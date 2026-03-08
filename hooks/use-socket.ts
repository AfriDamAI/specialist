/**
 * 🛡️ AFRIDAM NEURAL SOCKET HOOK
 * Location: hooks/use-socket.tsx
 * Version: 2026.1.22 (Handshake Sync)
 * Rule 5: Pure logic engine. Resolves ts(7006) 'any' errors.
 */

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_OPTIONS } from "@/lib/config";

// 🧬 Define the Message Data structure
export interface SocketData {
  chatId?: string;
  content?: string;
  message?: string; // Support both 'content' and 'message'
  senderId?: string;
  userId?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MISSED_CALL' | 'SYSTEM';
  attachmentUrl?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  payload?: {
    note?: string;
    isTyping?: boolean;
    isNote?: boolean;
    offer?: any;
    answer?: any;
    candidate?: any;
    callType?: 'voice' | 'video';
    from?: string;
    to?: string;
  };
  timestamp?: string;
}

export const useSocket = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!url) return;

    /**
     * 🚀 THE HANDSHAKE (Rule 6)
     * Ensuring the token is pulled from local storage for the specialist sync.
     */
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const cleanToken = rawToken ? rawToken.replace(/['"]+/g, '').trim() : null;

    const socketInstance = io(url, {
      ...SOCKET_OPTIONS,
      forceNew: true,
      auth: {
        token: cleanToken
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("Specialist Sync: Handshake Hiccup", err.message);
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // 🛡️ Soft Tone: Keep it relatable
      console.log("Specialist Sync: ACTIVE");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Specialist Sync: PAUSED");
    });

    setSocket(socketInstance);

    return () => {
      // 🚀 OGA FIX: Clean up all listeners to prevent double-messages
      socketInstance.off();
      socketInstance.disconnect();
    };
  }, [url]);

  /** 🛡️ listen: Type-Safe Listener **/
  const listen = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  /** 🛡️ emit: Type-Safe Emitter **/
  const emit = useCallback((event: string, data: any) => {
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }, [socket]);

  return { isConnected, listen, emit, socket };
};
