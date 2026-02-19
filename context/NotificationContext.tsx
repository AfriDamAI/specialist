'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

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
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  // 🏛️ Rule #6: Ensuring we hit the correct backend socket port
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

  useEffect(() => {
    // 🛡️ Rule #6: Security Handshake using local storage
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!rawToken) {
      console.warn('📡 Notification Engine: Waiting for specialist auth...');
      return;
    }

    // 🛡️ Rule #3: Sanitation to prevent "jwt expired" errors due to double-quotes
    const cleanToken = rawToken.replace(/['"]+/g, '').trim();

    const newSocket = io(envUrl, { 
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
      console.error('❌ Socket Handshake Failed:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [envUrl]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, markAsRead, showNotification }}>
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