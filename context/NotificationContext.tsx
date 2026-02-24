'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import { SOCKET_URL } from '@/lib/config';

/**
 * 🏛️ Rule #5 & #6: Synced with NotificationBell Interface
 */
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'system' | 'chat';
  isRead: boolean;
  time: string;
  createdAt?: string;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const pathname = usePathname();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    // 🛡️ Guard: Avoid fetching if no token or on auth pages
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || pathname === '/login' || pathname === '/') return;

    try {
      const response = await apiClient('/notifications/me');
      if (response && (response.resultData || response.data)) {
        const data = response.resultData || response.data;
        // Map backend response if needed. Assuming it matches our Notification interface or close to it.
        const mappedNotifications: Notification[] = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'system',
          isRead: n.isRead,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: n.createdAt
        }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    }
  }, [pathname]);

  useEffect(() => {
    // 🛡️ Only fetch if we have a token and are not on public pages
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && pathname !== '/login' && pathname !== '/') {
      fetchNotifications();
    }
  }, [fetchNotifications, pathname]);

  useEffect(() => {
    // 🛡️ Rule #6: Security Handshake using local storage
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!rawToken) {
      console.warn('📡 Notification Engine: Waiting for specialist auth...');
      return;
    }

    // 🛡️ Rule #3: Sanitation to prevent "jwt expired" errors due to double-quotes
    const cleanToken = rawToken.replace(/['"]+/g, '').trim();

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: cleanToken }, // Rule #6: standard NestJS WsGuard check
    });

    newSocket.on('connect', () => {
      console.log('✅ Specialist Workstation: Connected to AfriDam Pulse');
    });

    // 🏥 REAL-TIME CLINICAL ALERT HANDLER
    const handleIncomingAlert = (payload: any) => {
      /**
       * 🛡️ Rule #3: Resilient Data Extraction
       * Backend often wraps socket payloads in 'data' or 'resultData'.
       */
      const data = payload?.resultData || payload?.data || payload;

      const newNotif: Notification = {
        id: data.id || Math.random().toString(36).substr(2, 9),
        title: data.title || 'New Clinical Assignment',
        message: data.message || 'A new skin analysis requires your review.',
        type: data.type || 'appointment',
        isRead: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // 🛡️ Rule #5: Precision Oga Style Notification
      toast.success(`${newNotif.title}`, {
        icon: '🏥',
        duration: 8000,
      });
    };

    // 🏛️ Rule #6: Listening for specific Backend Gateway events mapped in AppGateway
    newSocket.on('new_assignment', handleIncomingAlert);
    newSocket.on('appointment_created', handleIncomingAlert);
    newSocket.on('notification_received', handleIncomingAlert);

    newSocket.on('connect_error', (err) => {
      // console.error('❌ Socket Handshake Failed:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient('/notifications/mark-all-read', { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
    }
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  }, []);

  const value = useMemo(() => ({
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    showNotification,
    fetchNotifications
  }), [unreadCount, notifications, markAsRead, markAllAsRead, showNotification, fetchNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* 🏛️ Rule #4: World-Class Toast Styling */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#000000',
            color: '#fff',
            borderRadius: '1.5rem',
            fontSize: '12px',
            fontWeight: '900',
            border: '2px solid #FF7A59',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontStyle: 'italic'
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};