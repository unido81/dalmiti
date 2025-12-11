import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/Button';

interface Message {
    id: string;
    sender: string;
    message: string;
    timestamp: string;
}

interface ChatProps {
    socket: Socket | null;
    roomId: string;
    nickname: string;
}

export const Chat: React.FC<ChatProps> = ({ socket, roomId, nickname }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg: Message) => {
            setMessages(prev => [...prev, msg]);
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }
        };

        socket.on('chat_message', handleMessage);

        return () => {
            socket.off('chat_message', handleMessage);
        };
    }, [socket, isOpen]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newMessage.trim() && socket) {
            socket.emit('chat_message', { roomId, message: newMessage, nickname });
            setNewMessage('');
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={toggleChat}
                className={`
                    fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all
                    ${isOpen ? 'bg-amber-600 text-white rotate-45' : 'bg-[#f4e4bc] border-2 border-[#8b5a2b] text-[#5a4632]'}
                `}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                ) : (
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                )}
            </button>

            {/* Chat Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full sm:w-80 bg-[#fff9e6] shadow-2xl z-40 flex flex-col border-l-4 border-[#8b5a2b]"
                    >
                        {/* Header */}
                        <div className="p-4 bg-[#8b5a2b] text-[#f4e4bc] font-serif flex justify-between items-center shadow-md">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                💬 대화방
                            </h3>
                            <button onClick={toggleChat} className="sm:hidden text-[#f4e4bc]">
                                ✕ 닫기
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('/parchment.png')] bg-cover">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.sender === nickname ? 'items-end' : 'items-start'}`}
                                >
                                    <span className="text-xs text-[#8b5a2b] mb-1 font-bold">
                                        {msg.sender}
                                    </span>
                                    <div
                                        className={`
                                            px-3 py-2 rounded-lg max-w-[85%] text-sm shadow-sm break-words
                                            ${msg.sender === nickname
                                                ? 'bg-[#8b5a2b] text-[#f4e4bc] rounded-tr-none'
                                                : 'bg-white text-[#4a3a2a] border border-[#d4c5a3] rounded-tl-none'
                                            }
                                        `}
                                    >
                                        {msg.message}
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-0.5 opacity-70">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-[#f4e4bc] border-t-2 border-[#d4c5a3]">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojis(!showEmojis)}
                                        className="h-full px-3 rounded-lg border-2 border-[#d4c5a3] bg-white hover:bg-gray-50 text-xl"
                                    >
                                        😊
                                    </button>

                                    {showEmojis && (
                                        <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-xl border border-[#d4c5a3] grid grid-cols-5 gap-2 w-64 z-50">
                                            {['😀', '😂', '😍', '😎', '🤔', '😭', '😡', '👍', '👎', '🎉', '🔥', '❤️', '💩', '👑', '⚔️', '🛡️', '🃏', '🎲', '👋', '🙏'].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewMessage(prev => prev + emoji);
                                                        setShowEmojis(false);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-xl"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="메시지를 입력하세요..."
                                    className="flex-1 px-3 py-2 rounded-lg border-2 border-[#d4c5a3] focus:border-[#8b5a2b] focus:outline-none bg-white text-[#4a3a2a]"
                                />
                                <Button type="submit" size="sm" className="bg-[#8b5a2b] hover:bg-[#6e4620] text-[#f4e4bc]">
                                    전송
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
