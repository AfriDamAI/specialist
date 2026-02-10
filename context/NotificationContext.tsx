'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/config';

// Rule #5: Defining the Clinical Notification Schema
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'system' | 'chat';
  isRead: boolean;
  time: string;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[]; // 🛡️ ADDED: Recognizable by TypeScript
  markAsRead: (id: string) => void; // 🛡️ ADDED: Recognizable by TypeScript
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Calculate unread count based on current state
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Rule #3: The Real-Time Neural Pulse
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('✅ Notification Engine Linked');
    });

    socket.on('newMessage', (payload) => {
      const newNotif: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'New Clinical Message',
        message: payload.message,
        type: 'chat',
        isRead: false,
        time: 'Just now'
      };

      setNotifications((prev) => [newNotif, ...prev]);
      
      toast.success(`New Message: ${payload.message.substring(0, 20)}...`, {
        icon: '💬',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, markAsRead, showNotification }}>
      {children}
      {/* 🛡️ RE-ENFORCED: Production Styling for Neural Design Language */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#000',
            color: '#fff',
            borderRadius: '1.5rem',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            padding: '16px 24px',
            border: '1px solid rgba(255,122,89,0.2)', // Hint of AfriDam Orange
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