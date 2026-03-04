import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/persistence/prisma/prisma.module';
import { ChatService } from 'src/domain/services/chat.service';
import { ChatController } from '../controllers/chat.controller';
import { ChatRepository } from 'src/infrastructure/persistence/prisma/prisma-chat.repository';
import { SharedModule } from '../../shared/shared.module';
import { NotificationModule } from './notification.module';
import { ChatGateway } from 'src/shared/websockets/chat.gateway';

@Module({
  imports: [PrismaModule, SharedModule, NotificationModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    {
      provide: 'IChatRepository',
      useClass: ChatRepository,
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
