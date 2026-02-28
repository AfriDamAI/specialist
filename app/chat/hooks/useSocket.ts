'use client';

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/config";

/**
 * 🛡️ AFRIDAM NEURAL SOCKET HOOK
 * Location: hooks/use-socket.tsx
 * Version: 2026.1.22 (Handshake Sync)
 * Rule 5: Pure logic engine. Resolves ts(7006) 'any' errors.
 */

// 🧬 Define the Message Data structure
export interface SocketData {
  content: string;
  senderId?: string;
  userId?: string;
  payload?: {
    note?: string;
    isTyping?: boolean;
    isNote?: boolean;
  };
  timestamp?: string;
}

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  message: string;
  type: string;
  timestamp?: string;
}

export const useSocket = (chatId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    /**
     * 🚀 THE HANDSHAKE (Rule 6)
     * Ensuring the token is pulled from local storage for the specialist sync.
     */
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
      secure: true,
      reconnection: true,
      auth: {
        token: typeof window !== 'undefined' ? localStorage.getItem("token") : null
      }
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // 🛡️ Soft Tone: Keep it relatable
      console.log("Specialist Sync: ACTIVE");
      
      // Join the specific chat room if chatId is provided
      if (chatId) {
        socketInstance.emit("joinChat", { chatId });
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Specialist Sync: PAUSED");
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`Specialist Sync: RECONNECTED (attempt ${attemptNumber})`);
      setIsConnected(true);
      // Rejoin chat room after reconnection
      if (chatId) {
        socketInstance.emit("joinChat", { chatId });
      }
    });

    setSocket(socketInstance);

    return () => {
      // 🚀 OGA FIX: Clean up all listeners to prevent double-messages
      socketInstance.off();
      socketInstance.disconnect();
    };
  }, [chatId]);

  /** 🛡️ listen: Type-Safe Listener **/
  const listen = useCallback((event: string, callback: (data: SocketData) => void) => {
    if (socket) {
      socket.on(event, (data: SocketData) => {
        callback(data);
      });
    }
  }, [socket]);

  /** 🛡️ emit: Type-Safe Emitter **/
  const emit = useCallback((event: string, data: SocketData) => {
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }, [socket]);

  return { isConnected, listen, emit };
};
