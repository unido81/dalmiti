import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import { GameState, Player, Card, BotLevel } from './src/types/game';
import { createDeck, dealCards, isValidMove, shuffle } from './src/lib/game/logic';
import { getBestMove } from './src/lib/game/ai';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface Room {
    id: string;
    gameState: GameState;
    aiTimeout?: NodeJS.Timeout;
}

const rooms: Record<string, Room> = {};

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        console.log('Request:', req.method, req.url);
        try {
            const parsedUrl = parse(req.url!, true);
            const isSocketRequest = parsedUrl.pathname?.startsWith('/socket.io');
            if (!isSocketRequest) {
                await handle(req, res, parsedUrl);
            }
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(httpServer, {
        allowEIO3: true,
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Timer tracking
    const turnTimers: Record<string, NodeJS.Timeout> = {};

    const startTurnTimer = (roomId: string) => {
        const room = rooms[roomId];
        if (!room || room.gameState.status !== 'playing') return;

        // Clear existing timer
        if (turnTimers[roomId]) {
            clearTimeout(turnTimers[roomId]);
            delete turnTimers[roomId];
        }

        const limit = room.gameState.turnTimeLimit;
        if (!limit || limit <= 0) return; // Unlimited

        room.gameState.turnStartTime = Date.now();
        // Notify start time (optional, but game_state_update handles it)

        turnTimers[roomId] = setTimeout(() => {
            console.log(`[${roomId}] Turn time limit exceeded for player index ${room.gameState.currentTurnIndex}`);
            // Force Pass or Random Play?
            // "Pass" is safer to avoid ruining strategy, but if everyone passes it's round over.
            // Let's do Pass.
            const playerIndex = room.gameState.currentTurnIndex;
            handlePass(roomId, playerIndex);

        }, limit * 1000);
    };

    // Define functions in scope
    const processAiTurn = (roomId: string) => {
        const room = rooms[roomId];
        if (!room || room.gameState.status !== 'playing') return;

        // ** Start Timer for EVERY turn (Human or AI) **
        // Note: AI has its own delay, so we should ensure AI delay < Time Limit if possible.
        // But for consistency we start the timer here.
        startTurnTimer(roomId);

        const currentPlayer = room.gameState.players[room.gameState.currentTurnIndex];
        if (!currentPlayer.isBot) return;

        // Delay for realism based on difficulty
        const delay = currentPlayer.botDifficulty === 'easy' ? 1000 : currentPlayer.botDifficulty === 'hard' ? 2500 : 1500;

        room.aiTimeout = setTimeout(() => {
            console.log(`[${roomId}] Bot ${currentPlayer.name} thinking... LastPlayed: ${room.gameState.lastPlayedCards?.length || 0} cards`);
            const move = getBestMove(currentPlayer.hand, room.gameState.lastPlayedCards, currentPlayer.botDifficulty);

            if (move) {
                // Play cards
                console.log(`[${roomId}] Bot ${currentPlayer.name} plays`, move.length, 'cards');
                // Remove from hand
                for (const cardToPlay of move) {
                    const idx = currentPlayer.hand.findIndex(c => c.id === cardToPlay.id);
                    if (idx !== -1) {
                        currentPlayer.hand.splice(idx, 1);
                    }
                }
                room.gameState.lastPlayedCards = move;
                room.gameState.lastPlayerId = currentPlayer.id;

                if (currentPlayer.hand.length === 0) {
                    currentPlayer.finishedRank = room.gameState.winners.length + 1;
                    room.gameState.winners.push(currentPlayer);
                    console.log(`[${roomId}] Bot ${currentPlayer.name} finished! Rank: ${currentPlayer.finishedRank}`);

                    // Check if Game is Over (All players except one have finished)
                    if (room.gameState.winners.length >= room.gameState.players.length - 1) {
                        console.log(`[${roomId}] Game Finished!`);
                        room.gameState.status = 'finished';

                        // Assign last rank to the remaining player
                        const lastPlayer = room.gameState.players.find(p => p.hand.length > 0);
                        if (lastPlayer) {
                            lastPlayer.finishedRank = room.gameState.players.length;
                            room.gameState.winners.push(lastPlayer);
                        }

                        io.to(roomId).emit('game_state_update', room.gameState);
                        return;
                    }
                }

                // Next turn logic (simplified rotation, similar to play_cards)
                let nextIndex = (room.gameState.currentTurnIndex + 1) % room.gameState.players.length;
                let loopCount = 0;
                while (
                    (room.gameState.players[nextIndex].hasPassed || room.gameState.players[nextIndex].hand.length === 0) &&
                    loopCount < room.gameState.players.length
                ) {
                    nextIndex = (nextIndex + 1) % room.gameState.players.length;
                    loopCount++;
                }

                // Check if turn returned to the current player (everyone else passed/out)
                if (room.gameState.players[nextIndex].id === currentPlayer.id) {
                    console.log(`[${roomId}] Turn returned to Bot ${currentPlayer.name} immediately. Round Over!`);
                    room.gameState.lastPlayedCards = null;
                    room.gameState.lastPlayerId = null;
                    room.gameState.players.forEach(p => p.hasPassed = false);
                    // Bot starts again
                }

                room.gameState.currentTurnIndex = nextIndex;

                io.to(roomId).emit('game_state_update', room.gameState);
                processAiTurn(roomId);

            } else {
                // Pass
                console.log(`[${roomId}] Bot ${currentPlayer.name} passes`);
                const playerIndex = room.gameState.players.findIndex(p => p.id === currentPlayer.id);
                handlePass(roomId, playerIndex);
            }

        }, delay);
    };

    const handlePass = (roomId: string, playerIndex: number) => {
        const room = rooms[roomId];
        if (!room) return;

        // Mark as passed
        room.gameState.players[playerIndex].hasPassed = true;

        const activePlayers = room.gameState.players.filter(p => p.hand.length > 0);
        const unpassedPlayers = activePlayers.filter(p => !p.hasPassed);

        console.log(`[${roomId}] Pass: Player ${room.gameState.players[playerIndex].name}. Active: ${activePlayers.length}, Unpassed: ${unpassedPlayers.length}`);

        let roundOver = false;
        let winner = null;

        if (unpassedPlayers.length === 1) {
            roundOver = true;
            winner = unpassedPlayers[0];
        } else if (unpassedPlayers.length === 0) {
            // Everyone passed
            roundOver = true;
            // Winner is the last player who played, or just next available if everyone passed without playing (rare)
            if (room.gameState.lastPlayerId) {
                winner = room.gameState.players.find(p => p.id === room.gameState.lastPlayerId) || activePlayers[0];
            } else {
                winner = activePlayers[0];
            }
        }

        if (roundOver && winner) {
            console.log(`[${roomId}] Round Over! Winner: ${winner.name}`);
            room.gameState.round++; // Increment round number
            room.gameState.lastPlayedCards = null;
            room.gameState.lastPlayerId = null;
            room.gameState.players.forEach(p => p.hasPassed = false);

            // Check Game Over (0 or 1 active player left)
            const remainingPlayers = room.gameState.players.filter(p => p.hand.length > 0);
            if (remainingPlayers.length <= 1) {
                console.log(`[${roomId}] Game Over!`);
                room.gameState.status = 'finished';

                // Assign last rank to the remaining player
                const lastPlayer = room.gameState.players.find(p => p.hand.length > 0);
                if (lastPlayer) {
                    lastPlayer.finishedRank = room.gameState.players.length;
                    room.gameState.winners.push(lastPlayer);
                }

                io.to(roomId).emit('game_state_update', room.gameState);
                return;
            }

            // If winner has no cards (finished), next active player starts
            if (winner.hand.length === 0) {
                let nextIndex = (room.gameState.players.findIndex(p => p.id === winner.id) + 1) % room.gameState.players.length;
                // Find next active player
                let loopCount = 0;
                while (room.gameState.players[nextIndex].hand.length === 0 && loopCount < room.gameState.players.length) {
                    nextIndex = (nextIndex + 1) % room.gameState.players.length;
                    loopCount++;
                }
                room.gameState.currentTurnIndex = nextIndex;
                console.log(`[${roomId}] Winner finished. Next player starts: ${room.gameState.players[nextIndex].name}`);
            } else {
                room.gameState.currentTurnIndex = room.gameState.players.findIndex(p => p.id === winner.id);
            }
        } else {
            // Next turn - Skip players who have passed or finished
            let nextIndex = (room.gameState.currentTurnIndex + 1) % room.gameState.players.length;
            let loopCount = 0;
            while (
                (room.gameState.players[nextIndex].hasPassed || room.gameState.players[nextIndex].hand.length === 0) &&
                loopCount < room.gameState.players.length
            ) {
                nextIndex = (nextIndex + 1) % room.gameState.players.length;
                loopCount++;
            }

            // Safety Check: If turn returns to the last player who played cards, they win the round
            if (room.gameState.lastPlayerId && room.gameState.players[nextIndex].id === room.gameState.lastPlayerId) {
                console.log(`[${roomId}] Turn returned to last player ${room.gameState.players[nextIndex].name}. Round Over!`);
                room.gameState.round++;
                room.gameState.lastPlayedCards = null;
                room.gameState.lastPlayerId = null;
                room.gameState.players.forEach(p => p.hasPassed = false);

                // Check Game Over (0 or 1 active player left)
                const remainingPlayers = room.gameState.players.filter(p => p.hand.length > 0);
                if (remainingPlayers.length <= 1) {
                    console.log(`[${roomId}] Game Over!`);
                    room.gameState.status = 'finished';

                    // Assign last rank to the remaining player
                    const lastPlayer = room.gameState.players.find(p => p.hand.length > 0);
                    if (lastPlayer) {
                        lastPlayer.finishedRank = room.gameState.players.length;
                        room.gameState.winners.push(lastPlayer);
                    }

                    io.to(roomId).emit('game_state_update', room.gameState);
                    return;
                }

                // Check if this winner has cards
                const roundWinner = room.gameState.players[nextIndex];
                if (roundWinner.hand.length === 0) {
                    let nextActive = (nextIndex + 1) % room.gameState.players.length;
                    let lc = 0;
                    while (room.gameState.players[nextActive].hand.length === 0 && lc < room.gameState.players.length) {
                        nextActive = (nextActive + 1) % room.gameState.players.length;
                        lc++;
                    }
                    room.gameState.currentTurnIndex = nextActive;
                } else {
                    room.gameState.currentTurnIndex = nextIndex; // They start
                }
            } else {
                room.gameState.currentTurnIndex = nextIndex;
            }
        }

        io.to(roomId).emit('game_state_update', room.gameState);
        processAiTurn(roomId);
    };

    // Visitor Counting Logic
    const VISITOR_FILE = 'visitors.json';
    let visitorCount = 0;

    // Load initial count
    try {
        if (fs.existsSync(VISITOR_FILE)) {
            const data = fs.readFileSync(VISITOR_FILE, 'utf8');
            visitorCount = parseInt(JSON.parse(data).count);
        }
    } catch (e) {
        console.error('Failed to load visitor count', e);
    }

    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Increment and save visitor count (simple approach: count every connection)
        // For more accuracy, we could check IPs or cookies, but this is sufficient for now.
        visitorCount++;
        try {
            fs.writeFileSync(VISITOR_FILE, JSON.stringify({ count: visitorCount }));
        } catch (e) {
            console.error('Failed to save visitor count', e);
        }

        // Emit current count to this client (and everyone else to update numbers live)
        io.emit('visitor_count', visitorCount);

        socket.on('join_room', ({ roomId, nickname }: { roomId: string; nickname: string }) => {
            socket.join(roomId);

            if (!rooms[roomId]) {
                rooms[roomId] = {
                    id: roomId,
                    gameState: {
                        roomId,
                        players: [],
                        currentTurnIndex: 0,
                        lastPlayedCards: null,
                        lastPlayerId: null,
                        deck: [],
                        status: 'waiting',
                        round: 1,
                        winners: []
                    }
                };
            }

            const room = rooms[roomId];
            const existingPlayer = room.gameState.players.find(p => p.id === socket.id);

            if (!existingPlayer) {
                // Check if nickname exists (Reconnection logic)
                const sameNamePlayer = room.gameState.players.find(p => p.name === nickname);
                if (sameNamePlayer) {
                    sameNamePlayer.id = socket.id;
                    console.log(`Player ${nickname} reconnected with new ID ${socket.id}`);
                } else {
                    const newPlayer: Player = {
                        id: socket.id,
                        name: nickname,
                        hand: [],
                        isBot: false,
                        hasPassed: false,
                        characterId: ['king', 'queen', 'knight', 'merchant', 'peasant', 'jester', 'wizard', 'thief'][Math.floor(Math.random() * 8)]
                    };
                    room.gameState.players.push(newPlayer);
                }
            }

            io.to(roomId).emit('game_state_update', room.gameState);
            console.log(`${nickname} joined room ${roomId}`);
        });

        socket.on('add_bot', ({ roomId, difficulty }: { roomId: string, difficulty: BotLevel }) => {
            const room = rooms[roomId];
            if (room && room.gameState.status === 'waiting') {
                const botId = `bot-${Math.random().toString(36).substr(2, 5)}`;
                const newBot: Player = {
                    id: botId,
                    name: `Bot ${room.gameState.players.length + 1} (${difficulty})`,
                    hand: [],
                    isBot: true,
                    botDifficulty: difficulty || 'medium',
                    hasPassed: false,
                    characterId: ['king', 'queen', 'knight', 'merchant', 'peasant', 'jester', 'wizard', 'thief'][Math.floor(Math.random() * 8)]
                };
                room.gameState.players.push(newBot);
                io.to(roomId).emit('game_state_update', room.gameState);
            }
        });

        socket.on('set_time_limit', ({ roomId, limit }: { roomId: string, limit: number }) => {
            const room = rooms[roomId];
            if (room && room.gameState.status === 'waiting') {
                room.gameState.turnTimeLimit = limit;
                io.to(roomId).emit('game_state_update', room.gameState);
                console.log(`[${roomId}] Time limit set to ${limit}s`);
            }
        });

        socket.on('start_game', (roomId: string) => {
            console.log(`[${roomId}] Request to start game from ${socket.id}`);
            const room = rooms[roomId];
            if (!room) {
                console.log(`[${roomId}] Room not found!`);
                return;
            }
            if (room.gameState.status !== 'waiting') {
                console.log(`[${roomId}] Cannot start game. Status is ${room.gameState.status}`);
                return;
            }
            if (room.gameState.players.length < 2) {
                console.log(`[${roomId}] Cannot start game. Not enough players: ${room.gameState.players.length}`);
                // Optional: Emit error to client
                // return; 
                // Allow 1 player for testing for now, but log it
            }

            if (room && room.gameState.status === 'waiting') {
                console.log(`[${roomId}] Starting game with ${room.gameState.players.length} players`);
                room.gameState.status = 'playing';
                room.gameState.deck = createDeck();
                room.gameState.players = dealCards(room.gameState.players, room.gameState.deck);

                // Find player with the Dalmuti (Rank 1) to start
                const dalmutiIndex = room.gameState.players.findIndex(p => p.hand.some(c => c.rank === 1));
                if (dalmutiIndex !== -1) {
                    room.gameState.currentTurnIndex = dalmutiIndex;
                    console.log(`[${roomId}] Player ${room.gameState.players[dalmutiIndex].name} has the Dalmuti (1) and starts!`);
                } else {
                    // Fallback (should theoretically not happen with full deck) or for testing
                    room.gameState.currentTurnIndex = Math.floor(Math.random() * room.gameState.players.length);
                }

                io.to(roomId).emit('game_state_update', room.gameState);

                // Check if first player is bot
                processAiTurn(roomId);
            }
        });

        socket.on('play_cards', ({ roomId, cards }: { roomId: string, cards: Card[] }) => {
            console.log(`[${roomId}] Player ${socket.id} trying to play cards:`, cards);
            const room = rooms[roomId];
            if (!room || room.gameState.status !== 'playing') {
                console.log(`[${roomId}] Room not playing or not found`);
                return;
            }

            const playerIndex = room.gameState.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== room.gameState.currentTurnIndex) {
                console.log(`[${roomId}] Not player's turn. Current: ${room.gameState.currentTurnIndex}, Requesting: ${playerIndex}`);
                return;
            }

            if (isValidMove(cards, room.gameState.lastPlayedCards)) {
                console.log(`[${roomId}] Move valid. Processing...`);
                // Remove cards from hand
                const player = room.gameState.players[playerIndex];

                for (const cardToPlay of cards) {
                    const idx = player.hand.findIndex(c => c.id === cardToPlay.id);
                    if (idx !== -1) {
                        player.hand.splice(idx, 1);
                    }
                }

                room.gameState.lastPlayedCards = cards;
                room.gameState.lastPlayerId = socket.id;

                // Check win condition
                if (player.hand.length === 0) {
                    player.finishedRank = room.gameState.winners.length + 1;
                    room.gameState.winners.push(player);
                    console.log(`[${roomId}] Player ${player.name} finished! Rank: ${player.finishedRank}`);

                    // Check if Game is Over (All players except one have finished)
                    if (room.gameState.winners.length >= room.gameState.players.length - 1) {
                        console.log(`[${roomId}] Game Finished!`);
                        room.gameState.status = 'finished';

                        // Assign last rank to the remaining player
                        const lastPlayer = room.gameState.players.find(p => p.hand.length > 0);
                        if (lastPlayer) {
                            lastPlayer.finishedRank = room.gameState.players.length;
                            room.gameState.winners.push(lastPlayer);
                        }

                        io.to(roomId).emit('game_state_update', room.gameState);
                        return;
                    }
                }

                // Next turn
                let nextIndex = (room.gameState.currentTurnIndex + 1) % room.gameState.players.length;
                // Skip players who have passed or won (if we implement that)
                // For now simple rotation

                // Skip logic (copied from pass_turn for consistency)
                let loopCount = 0;
                while (
                    (room.gameState.players[nextIndex].hasPassed || room.gameState.players[nextIndex].hand.length === 0) &&
                    loopCount < room.gameState.players.length
                ) {
                    nextIndex = (nextIndex + 1) % room.gameState.players.length;
                    loopCount++;
                }

                // Check if turn returned to the current player (everyone else passed/out)
                if (room.gameState.players[nextIndex].id === socket.id) {
                    console.log(`[${roomId}] Turn returned to player ${socket.id} immediately. Round Over!`);
                    room.gameState.lastPlayedCards = null;
                    room.gameState.lastPlayerId = null;
                    room.gameState.players.forEach(p => p.hasPassed = false);
                    // Current player starts again
                }

                room.gameState.currentTurnIndex = nextIndex;

                io.to(roomId).emit('game_state_update', room.gameState);

                // Trigger AI check
                processAiTurn(roomId);
            } else {
                console.log(`[${roomId}] Invalid move.`);
                console.log('Last played:', room.gameState.lastPlayedCards);
                console.log('Selected:', cards);
            }
        });

        socket.on('pass_turn', (roomId: string) => {
            const room = rooms[roomId];
            if (!room || room.gameState.status !== 'playing') return;

            const playerIndex = room.gameState.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== room.gameState.currentTurnIndex) return;

            handlePass(roomId, playerIndex);
        });

        socket.on('leave_room', (roomId: string) => {
            const room = rooms[roomId];
            if (!room) return;

            console.log(`[${roomId}] Player ${socket.id} leaving room.`);

            const playerIndex = room.gameState.players.findIndex(p => p.id === socket.id);
            if (playerIndex === -1) return;

            // Remove player
            room.gameState.players.splice(playerIndex, 1);

            // If game is playing, we might need to adjust turn index
            if (room.gameState.status === 'playing') {
                if (room.gameState.players.length < 2) {
                    // End game if not enough players
                    room.gameState.status = 'waiting';
                    room.gameState.round = 1;
                    room.gameState.currentTurnIndex = 0;
                    room.gameState.lastPlayedCards = null;
                    room.gameState.lastPlayerId = null;
                    room.gameState.deck = [];
                    room.gameState.winners = [];
                    room.gameState.players.forEach(p => {
                        p.hand = [];
                        p.hasPassed = false;
                    });
                } else {
                    // Adjust turn index if needed
                    if (playerIndex < room.gameState.currentTurnIndex) {
                        room.gameState.currentTurnIndex--;
                    }
                    if (room.gameState.currentTurnIndex >= room.gameState.players.length) {
                        room.gameState.currentTurnIndex = 0;
                    }

                    // If it was the leaver's turn, pass to next
                    if (playerIndex === room.gameState.currentTurnIndex) {
                        // Simple rotation to next active
                        let nextIndex = room.gameState.currentTurnIndex % room.gameState.players.length;
                        let loopCount = 0;
                        while (
                            (room.gameState.players[nextIndex].hasPassed || room.gameState.players[nextIndex].hand.length === 0) &&
                            loopCount < room.gameState.players.length
                        ) {
                            nextIndex = (nextIndex + 1) % room.gameState.players.length;
                            loopCount++;
                        }
                        room.gameState.currentTurnIndex = nextIndex;
                    }
                }
            }

            io.to(roomId).emit('game_state_update', room.gameState);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Ideally handle disconnect similar to leave_room if permanent
        });

        socket.on('chat_message', ({ roomId, message, nickname }: { roomId: string, message: string, nickname: string }) => {
            console.log(`[${roomId}] Chat from ${nickname}: ${message}`);
            // Broadcast to all in room
            io.to(roomId).emit('chat_message', {
                id: Math.random().toString(36).substr(2, 9),
                sender: nickname,
                message: message,
                timestamp: new Date().toISOString()
            });
        });
    });

    httpServer.listen(port, (err?: any) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
