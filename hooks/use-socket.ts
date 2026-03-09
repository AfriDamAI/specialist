'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_OPTIONS } from '@/lib/config';

export interface SocketData {
  chatId?: string;
  content?: string;
  message?: string;
  senderId?: string;
  userId?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MISSED_CALL' | 'SYSTEM';
  attachmentUrl?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
}

/**
 * useSocket — Creates and manages a single persistent Socket.io connection.
 * Reads the SOCKET_URL from config and the JWT token from localStorage.
 */
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!rawToken) return;

    const cleanToken = rawToken.replace(/['"]+/g, '').trim();

    const socketInstance = io(SOCKET_URL, {
      ...SOCKET_OPTIONS,
      forceNew: true,
      auth: { token: cleanToken },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('✅ AfriDam Socket: CONNECTED');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('⚠️ AfriDam Socket: DISCONNECTED');
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('❌ AfriDam Socket: Connection Error', err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off();
      socketInstance.disconnect();
    };
  }, []);

  const listen = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) socket.on(event, callback);
  }, [socket]);

  const emit = useCallback((event: string, data: any) => {
    if (socket) socket.emit(event, data);
  }, [socket]);

  return { isConnected, listen, emit, socket };
};
