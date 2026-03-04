import { ChatEntity, ChatMessageEntity } from '../../domain/entities/chat.entity';
import { Chat, ChatMessage, ChatMessageType } from '@prisma/client';

export class ChatMessageMapper {
  static toDomain(raw: ChatMessage): ChatMessageEntity {
    return new ChatMessageEntity({
      id: raw.id,
      chatId: raw.chatId,
      senderId: raw.senderId,
      message: raw.message ?? '',
      type: raw.type,
      attachmentUrl: raw.attachmentUrl ?? undefined,
      mimeType: raw.mimeType ?? undefined,
      fileSize: raw.fileSize ?? undefined,
      duration: raw.duration ?? undefined,
      isRead: raw.isRead,
      isDelivered: raw.isDelivered,
      readAt: raw.readAt ?? undefined,
      deliveredAt: raw.deliveredAt ?? undefined,
      createdAt: raw.createdAt,
    });
  }

  static toDomainArray(raws: ChatMessage[]): ChatMessageEntity[] {
    return raws.map(m => this.toDomain(m));
  }

  static toPersistence(domain: ChatMessageEntity): ChatMessage {
    return {
      id: domain.id,
      chatId: domain.chatId,
      senderId: domain.senderId,
      message: domain.message ?? null,
      type: domain.type as ChatMessageType,
      attachmentUrl: domain.attachmentUrl ?? null,
      mimeType: domain.mimeType ?? null,
      fileSize: domain.fileSize ?? null,
      duration: domain.duration ?? null,
      isRead: domain.isRead,
      isDelivered: domain.isDelivered,
      readAt: domain.readAt ?? null,
      deliveredAt: domain.deliveredAt ?? null,
      createdAt: domain.createdAt,
    };
  }

  static toDto(entity: ChatMessageEntity): any {
    return {
      id: entity.id,
      chatId: entity.chatId,
      senderId: entity.senderId,
      message: entity.message,
      type: entity.type,
      attachmentUrl: entity.attachmentUrl,
      mimeType: entity.mimeType,
      fileSize: entity.fileSize,
      duration: entity.duration,
      isRead: entity.isRead,
      isDelivered: entity.isDelivered,
      readAt: entity.readAt,
      deliveredAt: entity.deliveredAt,
      createdAt: entity.createdAt,
    };
  }
}

type ChatWithMessages = Chat & {
    messages?: ChatMessage[];
}

export class ChatMapper {
  static toDomain(raw: ChatWithMessages): ChatEntity {
    return new ChatEntity({
      id: raw.id,
      participant1Id: raw.participant1Id,
      participant2Id: raw.participant2Id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      messages: raw.messages ? ChatMessageMapper.toDomainArray(raw.messages) : [],
    });
  }

  static toDomainArray(raws: ChatWithMessages[]): ChatEntity[] {
    return raws.map(c => this.toDomain(c));
  }

  static toDto(entity: ChatEntity): any {
    return {
      id: entity.id,
      participant1Id: entity.participant1Id,
      participant2Id: entity.participant2Id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      messages: entity.messages?.map(m => ChatMessageMapper.toDto(m)) || [],
    };
  }

  static toPersistence(domain: ChatEntity): Chat {
    return {
      id: domain.id,
      participant1Id: domain.participant1Id,
      participant2Id: domain.participant2Id,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
