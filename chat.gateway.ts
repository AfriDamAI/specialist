import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { ChatService } from 'src/domain/services/chat.service';
import { AppGateway } from './app.gateway';
import { CreateChatMessageDto } from 'src/application/DTOs/chat/create-chat.dto';

@WebSocketGateway({ cors: true, namespace: '/chat' })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => AppGateway))
    private readonly appGateway: AppGateway,
  ) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: CreateChatMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.chatService.sendMessage({
        chatId: data.chatId,
        senderId: data.senderId,
        message: data.message,
        type: data.type as any,
        attachmentUrl: data.attachmentUrl,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        duration: data.duration,
      });
      
      const chat = await this.chatService.getChatById(data.chatId);
      const receiverId = chat.participant1Id === data.senderId 
        ? chat.participant2Id 
        : chat.participant1Id;

      // Send to receiver via WebSocket
      this.appGateway.sendToUser(receiverId, 'newMessage', message);
      
      // Send confirmation to sender
      client.emit('messageSent', message);

      this.logger.log(`Message sent from ${data.senderId} to ${receiverId}`);
      
      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { chatId: string; senderId: string; isTyping: boolean },
  ) {
    const chat = await this.chatService.getChatById(data.chatId);
    const receiverId = chat.participant1Id === data.senderId 
      ? chat.participant2Id 
      : chat.participant1Id;

    this.appGateway.sendToUser(receiverId, 'userTyping', {
      chatId: data.chatId,
      userId: data.senderId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.chatService.markMessageAsRead(data.messageId);
      const chat = await this.chatService.getChatById(message.chatId);
      
      const receiverId = chat.participant1Id === message.senderId 
        ? chat.participant2Id 
        : chat.participant1Id;

      this.appGateway.sendToUser(receiverId, 'messageRead', { messageId: data.messageId });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
