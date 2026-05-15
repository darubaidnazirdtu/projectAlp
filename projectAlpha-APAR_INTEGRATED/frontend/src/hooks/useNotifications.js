import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notification.service';
import { useSocket } from '../context/SocketContext';
import { toast } from 'sonner';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            const list = Array.isArray(data) ? data : [];
            setNotifications(list);
            setUnreadCount(list.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            console.log('🔔 New real-time notification:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Enhanced toast with entry details
            const metadata = notification.metadata;
            let description = notification.message;

            // Add key details to description if available
            if (metadata && metadata.details) {
                const details = metadata.details;
                const detailParts = [];

                // Add most relevant field based on entry type
                // Add most relevant field based on entry type
                if (details.title) detailParts.push(`${details.title}`);
                if (details.amount) detailParts.push(`₹${Number(details.amount).toLocaleString('en-IN')}`);
                if (details.revenue) detailParts.push(`₹${Number(details.revenue).toLocaleString('en-IN')}`);
                if (details.journal) detailParts.push(`${details.journal}`);
                if (details.conference) detailParts.push(`${details.conference}`);
                if (details.agency) detailParts.push(`${details.agency}`);

                if (detailParts.length > 0) {
                    description = `${notification.message}\n${detailParts.slice(0, 2).join(' • ')}`;
                }
            }

            // Show toast with enhanced description
            toast(notification.title, {
                description: description,
                duration: 6000
            });
        };

        socket.on('notification', handleNewNotification);

        return () => {
            socket.off('notification', handleNewNotification);
        };
    }, [socket]);

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllRead,
        refresh: fetchNotifications
    };
};
