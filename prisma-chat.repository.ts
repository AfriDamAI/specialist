import { Injectable } from '@nestjs/common';
import { IChatRepository } from '../../../domain/repositories/chat.repository.interface';
import { ChatEntity, ChatMessageEntity } from '../../../domain/entities/chat.entity';
import { ChatMapper, ChatMessageMapper } from '../../mappers/chat.mapper';
import { CreateChatParams, CreateChatMessageParams } from 'src/utils/type';
import { PrismaService } from './prisma.service';

@Injectable()
export class ChatRepository implements IChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createChat(params: CreateChatParams): Promise<ChatEntity> {
    // Check if chat already exists
    const existingChat = await this.prisma.chat.findFirst({
        where: {
            OR: [
                { participant1Id: params.participant1Id, participant2Id: params.participant2Id },
                { participant1Id: params.participant2Id, participant2Id: params.participant1Id }
            ]
        }
    });

    if (existingChat) {
        return ChatMapper.toDomain(existingChat);
    }

    const chat = await this.prisma.chat.create({
      data: {
        participant1Id: params.participant1Id,
        participant2Id: params.participant2Id,
      },
    });
    return ChatMapper.toDomain(chat);
  }

  async findChatById(id: string): Promise<ChatEntity | null> {
    const chat = await this.prisma.chat.findUnique({
      where: { id },
      include: {
        messages: {
            orderBy: { createdAt: 'asc' }
        }
      }
    });
    return chat ? ChatMapper.toDomain(chat) : null;
  }

  async findChatsByParticipantId(participantId: string): Promise<ChatEntity[]> {
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          { participant1Id: participantId },
          { participant2Id: participantId },
        ],
      },
      include: {
        messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return ChatMapper.toDomainArray(chats);
  }

  async addMessage(params: CreateChatMessageParams): Promise<ChatMessageEntity> {
    const message = await this.prisma.chatMessage.create({
      data: {
        chatId: params.chatId,
        senderId: params.senderId,
        message: params.message,
        type: params.type,
        attachmentUrl: params.attachmentUrl,
        mimeType: params.mimeType,
        fileSize: params.fileSize,
        duration: params.duration,
      },
    });

    // Update chat timestamp
    await this.prisma.chat.update({
        where: { id: params.chatId },
        data: { updatedAt: new Date() }
    });

    return ChatMessageMapper.toDomain(message);
  }

  async getMessages(chatId: string): Promise<ChatMessageEntity[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
    return ChatMessageMapper.toDomainArray(messages);
  }

  async markMessageAsRead(messageId: string): Promise<ChatMessageEntity> {
    const message = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return ChatMessageMapper.toDomain(message);
  }

  async deleteChat(id: string): Promise<void> {
    await this.prisma.chat.delete({
      where: { id },
    });
  }
}
