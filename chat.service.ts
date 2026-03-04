import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { ChatEntity, ChatMessageEntity } from '../entities/chat.entity';
import { IChatRepository } from '../repositories/chat.repository.interface';
import { CreateChatParams, CreateChatMessageParams } from 'src/utils/type';
import { AppGateway } from 'src/shared/websockets/app.gateway'; // Import AppGateway
import { NotificationService } from './notification.service'; // Import NotificationService
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { forwardRef } from '@nestjs/common';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject('IChatRepository') private readonly chatRepository: IChatRepository,
    @Inject(forwardRef(() => AppGateway)) private readonly appGateway: AppGateway, // Inject AppGateway with forwardRef
    private readonly notificationService: NotificationService, // Inject NotificationService
    private readonly prisma: PrismaService,
  ) {}

  async initiateChat(params: CreateChatParams): Promise<ChatEntity> {
    const chat = await this.chatRepository.createChat(params);
    
    // Notify participant2 about new chat request via WebSocket
    this.appGateway.sendToUser(params.participant2Id, 'newChatRequest', {
      chatId: chat.id,
      fromUserId: params.participant1Id,
      message: 'You have a new chat request'
    });
    
    // Create notification - try as specialist first, then user
    try {
      await this.notificationService.createNotification({
        title: 'New Chat Request',
        message: 'Someone wants to chat with you',
        specialistId: params.participant2Id,
      });
    } catch (error) {
      // If specialist fails, try as user
      try {
        await this.notificationService.createNotification({
          title: 'New Chat Request',
          message: 'Someone wants to chat with you',
          userId: params.participant2Id,
        });
      } catch (err) {
        this.logger.warn(`Could not create notification for ${params.participant2Id}`);
      }
    }
    
    this.logger.log(`Chat initiated and notification sent to ${params.participant2Id}`);
    
    return chat;
  }

  async getChatById(id: string): Promise<ChatEntity> {
    const chat = await this.chatRepository.findChatById(id);
    if (!chat) {
      throw new NotFoundException(`Chat with id ${id} not found`);
    }
    return chat;
  }

  async getUserChats(userId: string): Promise<ChatEntity[]> {
    return this.chatRepository.findChatsByParticipantId(userId);
  }

  async sendMessage(params: CreateChatMessageParams): Promise<ChatMessageEntity> {
    const message = await this.chatRepository.addMessage(params);

    const chat = await this.chatRepository.findChatById(params.chatId);
    if (chat) {
      const receiverId = chat.participant1Id === params.senderId ? chat.participant2Id : chat.participant1Id;
      
      // 🛡️ SESSION ENFORCEMENT 🛡️
      const activeAppointment = await this.prisma.appointment.findFirst({
        where: {
          OR: [
            { userId: params.senderId, specialistId: receiverId },
            { userId: receiverId, specialistId: params.senderId },
          ],
          status: AppointmentStatus.IN_PROGRESS,
        },
      });

      if (activeAppointment) {
          const now = new Date();
          if (activeAppointment.endedAt && now > activeAppointment.endedAt && !activeAppointment.isExtended) {
              // Session expired, mark as completed and block message
              this.logger.log(`Session ${activeAppointment.id} expired. Auto-completing via Chat enforcement.`);
              
              // We use a simplified completion logic here since we are in ChatService
              // Ideally, this should trigger AppointmentService.completeAppointment
              // but to avoid circular dependency and keep it simple:
              await this.prisma.appointment.update({
                  where: { id: activeAppointment.id },
                  data: { status: AppointmentStatus.COMPLETED },
              });
              
              throw new ForbiddenException('The appointment session has ended. Chat is no longer available.');
          }
      } else {
          // No active session found
          throw new ForbiddenException('Chat is only available during an active appointment session.');
      }

      // Send real-time message via WebSocket to the receiver
      const sent = this.appGateway.sendToUser(receiverId, 'newMessage', message);
      
      if (sent) {
        this.logger.log(`Real-time message delivered to ${receiverId} for chat ${chat.id}`);
      } else {
        this.logger.warn(`User ${receiverId} is offline. Message saved to database.`);
      }

      // Create database notification - try specialist first, then user
      const notificationText = params.message 
        ? `You have a new message: "${params.message.substring(0, 50)}${params.message.length > 50 ? '...' : ''}"`
        : `You have a new ${params.type || 'multimedia'} message`;

      try {
        await this.notificationService.createNotification({
          title: 'New Chat Message',
          message: notificationText,
          specialistId: receiverId,
        });
      } catch (error) {
        try {
          await this.notificationService.createNotification({
            title: 'New Chat Message',
            message: notificationText,
            userId: receiverId,
          });
        } catch (err) {
          this.logger.warn(`Could not create notification for ${receiverId}`);
        }
      }
      
      this.logger.log(`Database notification created for ${receiverId}`);
    }

    return message;
  }

  async getChatMessages(chatId: string): Promise<ChatMessageEntity[]> {
    return this.chatRepository.getMessages(chatId);
  }

  async markMessageAsRead(messageId: string): Promise<ChatMessageEntity> {
    return this.chatRepository.markMessageAsRead(messageId);
  }

  async recordMissedCall(chatId: string, senderId: string): Promise<ChatMessageEntity> {
    const chat = await this.chatRepository.findChatById(chatId);
    if (!chat) {
      throw new NotFoundException(`Chat with id ${chatId} not found`);
    }

    const message = await this.chatRepository.addMessage({
      chatId,
      senderId,
      message: 'Missed Call',
      type: 'MISSED_CALL',
    });

    const receiverId = chat.participant1Id === senderId ? chat.participant2Id : chat.participant1Id;
    this.appGateway.sendToUser(receiverId, 'newMessage', message);

    return message;
  }
}
