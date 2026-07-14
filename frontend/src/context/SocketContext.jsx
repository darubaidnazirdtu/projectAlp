import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectUser, selectRole } from '../store/slices/authSlice';
import { selectAparUser, selectAparRole } from '../store/slices/aparAuthSlice';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const standardUser = useSelector(selectUser);
    const standardRole = useSelector(selectRole);
    const aparUser = useSelector(selectAparUser);
    const aparRole = useSelector(selectAparRole);

    const isAparPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/apar');
    const user = isAparPath ? aparUser : standardUser;
    const role = isAparPath ? aparRole : standardRole;
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        const userId = user.userId || user.teacherId || user.faculty_id || user.id;
        if (!userId) return;

        const backendUrl = import.meta.env.VITE_BASEURL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000');
        // Remove /api/v1 or any API path for Socket.IO connection (Socket.IO runs on root)
        const socketUrl = backendUrl.replace(/\/api\/v\d+$/, '').replace(/\/api$/, '');

        if (!socketRef.current) {
            socketRef.current = io(socketUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 500,
                reconnectionDelayMax: 5000,
                timeout: 20000
            });

            socketRef.current.on('connect', () => {
                // console.log('✅ Global Socket Connected');
                setConnected(true);

                // Join personal notification room
                socketRef.current.emit('join_notifications', { userId, role });
            });

            socketRef.current.on('disconnect', () => {
                // console.log('🔌 Global Socket Disconnected');
                setConnected(false);
            });
            socketRef.current.on('reconnect', () => {
                setConnected(true);
                socketRef.current.emit('join_notifications', { userId, role });
            });
            socketRef.current.on('connect_error', () => {
                setConnected(false);
            });
        } else if (socketRef.current.disconnected) {
            socketRef.current.connect();
            socketRef.current.emit('join_notifications', { userId, role });
        } else {
            // If already connected but user/role changed (unlikely without logout, but safe)
            socketRef.current.emit('join_notifications', { userId, role });
        }

        return () => {
            // Only disconnect on unmount, not on user/role changes
            // Socket should remain persistent while logged in
        };
    }, [user, role]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext); // eslint-disable-line react-refresh/only-export-components
