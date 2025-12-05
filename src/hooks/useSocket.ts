import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInstance = getSocket();

        function onConnect() {
            setIsConnected(true);
            console.log('Socket connected:', socketInstance.id);
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log('Socket disconnected');
        }

        function onConnectError(err: any) {
            console.error('Socket connection error:', err);
        }

        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('connect_error', onConnectError);

        setSocket(socketInstance);

        // Check if already connected
        if (socketInstance.connected) {
            onConnect();
        }

        return () => {
            socketInstance.off('connect', onConnect);
            socketInstance.off('disconnect', onDisconnect);
            socketInstance.off('connect_error', onConnectError);
        };
    }, []);

    return { socket, isConnected };
};
