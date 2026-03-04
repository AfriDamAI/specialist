import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { URLSearchParams } from 'url'; // Import URLSearchParams for parsing query parameters
  import { Logger, Inject, forwardRef } from '@nestjs/common'; // Import Logger from @nestjs/common
  import { ModuleRef } from '@nestjs/core';
  import { ChatService } from 'src/domain/services/chat.service';
  
  @WebSocketGateway({ cors: true }) // Enable CORS for WebSocket connections
  export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(AppGateway.name);
    // Map to store connected clients by userId. A user can have multiple connections.
    private clients: Map<string, Socket[]> = new Map();
    // Map to track active calls for missed call logic: chatId-callerId-recipientId -> Timeout
    private activeCalls: Map<string, NodeJS.Timeout> = new Map();
  
    constructor(
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
      private readonly moduleRef: ModuleRef,
    ) {}
  
    async handleConnection(client: Socket) {
      this.logger.log(`Client connected: ${client.id}`);
  
      try {
        const token = this.extractTokenFromHandshake(client);
        if (!token) {
          this.logger.warn(`Client ${client.id} connection denied: No token provided.`);
          client.disconnect(true);
          return;
        }
  
        const secret = this.configService.get<string>('JWT_SECRET');
        const payload = this.jwtService.verify(token, { secret });
  
        const userId = payload.sub; // Assuming 'sub' contains the user ID
        const userRole = payload.role; // Assuming 'role' contains the user role
  
        if (!userId) {
          this.logger.warn(`Client ${client.id} connection denied: No userId in token payload.`);
          client.disconnect(true);
          return;
        }
  
        if (!this.clients.has(userId)) {
          this.clients.set(userId, []);
        }
        this.clients.get(userId).push(client);
  
        this.logger.log(`Client ${client.id} connected as User ID: ${userId}, Role: ${userRole}`);
      } catch (error) {
        this.logger.error(`Client ${client.id} authentication failed: ${error.message}`);
        client.disconnect(true);
      }
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected: ${client.id}`);
      // Remove the disconnected client from the map
      this.clients.forEach((sockets, userId) => {
        const index = sockets.indexOf(client);
        if (index > -1) {
          sockets.splice(index, 1);
          if (sockets.length === 0) {
            this.clients.delete(userId);
          }
          this.logger.log(`User ID ${userId} removed client ${client.id}. Remaining connections: ${sockets.length}`);
          return;
        }
      });
    }
  
    private extractTokenFromHandshake(client: Socket): string | null {
      // Try to get token from query parameters first (e.g., for browser clients)
      const query = client.handshake.url ? new URLSearchParams(client.handshake.url.split('?')[1]) : null;
      const tokenFromQuery = query ? query.get('token') : null;
  
      if (tokenFromQuery) {
        return tokenFromQuery;
      }
  
      // Fallback to authorization header (e.g., for some client libraries)
      const authHeader = client.handshake.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
  
      return null;
    }
  
    /**
     * Sends a message to all connected clients.
     * @param event The event name.
     * @param payload The data to send.
     */
    broadcastMessage(event: string, payload: any) {
      this.server.emit(event, payload);
      this.logger.debug(`Broadcasting event '${event}' with payload: ${JSON.stringify(payload)}`);
    }
  
    /**
     * Sends a message to a specific user by their ID.
     * @param userId The ID of the user to send the message to.
     * @param event The event name.
     * @param payload The data to send.
     * @returns True if the message was sent to at least one client, false otherwise.
     */
    sendToUser(userId: string, event: string, payload: any): boolean {
      const sockets = this.clients.get(userId);
      if (sockets && sockets.length > 0) {
        sockets.forEach(socket => {
          socket.emit(event, payload);
          this.logger.debug(`Sent event '${event}' to user ${userId} (client ${socket.id}) with payload: ${JSON.stringify(payload)}`);
        });
        return true;
      }
      this.logger.warn(`Attempted to send event '${event}' to user ${userId}, but no active connections were found.`);
      return false;
    }
  
    /**
     * Sends a message to multiple users by their IDs.
     * @param userIds An array of user IDs to send the message to.
     * @param event The event name.
     * @param payload The data to send.
     * @returns An array of user IDs to whom the message was successfully sent to at least one client.
     */
    sendToUsers(userIds: string[], event: string, payload: any): string[] {
      const successfullySentUsers: string[] = [];
      userIds.forEach(userId => {
        if (this.sendToUser(userId, event, payload)) {
          successfullySentUsers.push(userId);
        }
      });
      return successfullySentUsers;
    }
  
    /**
     * Retrieves all active connections for a given user ID.
     * @param userId The ID of the user.
     * @returns An array of Socket instances for the user, or undefined if no connections.
     */
    getConnectionsForUser(userId: string): Socket[] | undefined {
      return this.clients.get(userId);
    }

    /**
     * WebRTC Signaling Handlers
     */
    @SubscribeMessage('call-offer')
    handleCallOffer(client: Socket, payload: { to: string; offer: any; chatId: string; type: 'voice' | 'video' }) {
      const fromId = this.getUserIdFromSocket(client);
      if (!fromId) return { success: false, error: 'User not authenticated' };

      this.logger.log(`Call offer from ${fromId} to user ${payload.to} for chat ${payload.chatId}`);
      
      const sent = this.sendToUser(payload.to, 'call-offer', {
        from: fromId,
        offer: payload.offer,
        chatId: payload.chatId,
        type: payload.type,
      });

      if (sent) {
        const callId = `${payload.chatId}-${fromId}-${payload.to}`;
        // Clear any existing timeout for this call
        if (this.activeCalls.has(callId)) {
          clearTimeout(this.activeCalls.get(callId));
        }

        const timeout = setTimeout(async () => {
          this.logger.log(`Call timeout for ${callId}. Recording missed call.`);
          try {
            // Lazy load ChatService to avoid circular dependency
            const chatService = this.moduleRef.get(ChatService, { strict: false });
            await chatService.recordMissedCall(payload.chatId, fromId);
          } catch (error) {
            this.logger.error(`Failed to record missed call: ${error.message}`);
          }
          this.activeCalls.delete(callId);
        }, 45000); // 45 seconds ringing time

        this.activeCalls.set(callId, timeout);
      }

      return { success: sent };
    }

    @SubscribeMessage('call-answer')
    handleCallAnswer(client: Socket, payload: { to: string; answer: any; chatId: string }) {
      const fromId = this.getUserIdFromSocket(client);
      if (!fromId) return { success: false };

      // 'to' is the original caller. 'fromId' is the recipient answering.
      const callId = `${payload.chatId}-${payload.to}-${fromId}`;
      const timeout = this.activeCalls.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        this.activeCalls.delete(callId);
        this.logger.log(`Call ${callId} answered. Timeout cleared.`);
      }

      this.logger.log(`Call answer from ${fromId} to user ${payload.to}`);
      const sent = this.sendToUser(payload.to, 'call-answer', {
        from: fromId,
        answer: payload.answer,
        chatId: payload.chatId,
      });
      return { success: sent };
    }

    @SubscribeMessage('ice-candidate')
    handleIceCandidate(client: Socket, payload: { to: string; candidate: any; chatId: string }) {
      const fromId = this.getUserIdFromSocket(client);
      this.logger.debug(`ICE candidate from ${fromId} to user ${payload.to}`);
      const sent = this.sendToUser(payload.to, 'ice-candidate', {
        from: fromId,
        candidate: payload.candidate,
        chatId: payload.chatId,
      });
      return { success: sent };
    }

    @SubscribeMessage('call-end')
    handleCallEnd(client: Socket, payload: { to: string; chatId: string }) {
      const fromId = this.getUserIdFromSocket(client);
      if (!fromId) return { success: false };

      this.logger.log(`Call ended by ${fromId} to user ${payload.to}`);

      // 1. Check if it was an unanswered call from this user (Caller hangs up)
      const callIdAsCaller = `${payload.chatId}-${fromId}-${payload.to}`;
      const timeout = this.activeCalls.get(callIdAsCaller);
      if (timeout) {
        clearTimeout(timeout);
        this.activeCalls.delete(callIdAsCaller);
        this.logger.log(`Call ${callIdAsCaller} ended by caller. Recording missed call.`);
        try {
          const chatService = this.moduleRef.get(ChatService, { strict: false });
          chatService.recordMissedCall(payload.chatId, fromId);
        } catch (e) {
          this.logger.error(`Error recording missed call on hangup: ${e.message}`);
        }
      }

      // 2. Check if it was an incoming call being rejected (Recipient hangs up/rejects)
      const callIdAsRecipient = `${payload.chatId}-${payload.to}-${fromId}`;
      const recipientTimeout = this.activeCalls.get(callIdAsRecipient);
      if (recipientTimeout) {
        clearTimeout(recipientTimeout);
        this.activeCalls.delete(callIdAsRecipient);
        this.logger.log(`Call ${callIdAsRecipient} rejected by recipient. Recording missed call.`);
        try {
          const chatService = this.moduleRef.get(ChatService, { strict: false });
          chatService.recordMissedCall(payload.chatId, payload.to);
        } catch (e) {
          this.logger.error(`Error recording missed call on reject: ${e.message}`);
        }
      }

      const sent = this.sendToUser(payload.to, 'call-end', {
        from: fromId,
        chatId: payload.chatId,
      });
      return { success: sent };
    }

    /**
     * Helper to get userId from socket
     */
    private getUserIdFromSocket(socket: Socket): string | null {
      for (const [userId, sockets] of this.clients.entries()) {
        if (sockets.includes(socket)) {
          return userId;
        }
      }
      return null;
    }
  }