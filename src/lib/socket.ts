"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = () => {
    if (!socket) {
        // In production (and usually dev), undefined URL means "connect to window.location"
        // This allows it to work on Railway/Render without hardcoding the domain
        const url = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000';

        socket = io(url, {
            path: "/socket.io",
            autoConnect: true,
        });
    }
    return socket;
};
