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

    const user = standardUser || aparUser;
    const role = standardRole || aparRole;
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

        const backendUrl = import.meta.env.VITE_BASEURL || 'http://localhost:8000';

        if (!socketRef.current) {
            socketRef.current = io(backendUrl, {
                auth: {
                    token: localStorage.getItem('token')
                },
                transports: ['websocket', 'polling']
            });

            socketRef.current.on('connect', () => {
                console.log('✅ Global Socket Connected');
                setConnected(true);

                // Join personal notification room
                const userId = user.teacherId || user.faculty_id || user.id;
                socketRef.current.emit('join_notifications', { userId, role });
            });

            socketRef.current.on('disconnect', () => {
                console.log('🔌 Global Socket Disconnected');
                setConnected(false);
            });
        } else {
            // If already connected but user/role changed (unlikely without logout, but safe)
            const userId = user.teacherId || user.faculty_id || user.id;
            socketRef.current.emit('join_notifications', { userId, role });
        }

        return () => {
            // Usually we don't disconnect global socket on every small change
            // as it's meant to be persistent while logged in.
        };
    }, [user, role]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
