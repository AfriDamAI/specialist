import { 
  Controller, Get, Post, Body, Param, ValidationPipe, 
  UseGuards, Request, NotFoundException, Patch,
  UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatService } from 'src/domain/services/chat.service';
import { CreateChatDto, CreateChatMessageDto } from 'src/application/DTOs/chat/create-chat.dto';
import { ChatMapper, ChatMessageMapper } from 'src/infrastructure/mappers/chat.mapper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadService } from 'src/shared/services/file-upload.service';
import { ChatMessageType } from '@prisma/client';

@ApiTags('Chats')
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a new chat' })
  @ApiResponse({ status: 201, description: 'Chat created successfully' })
  async create(@Body(new ValidationPipe()) createChatDto: CreateChatDto) {
    const chat = await this.chatService.initiateChat(createChatDto);
    return {
      succeeded: true,
      message: 'Chat initiated successfully',
      resultData: ChatMapper.toDto(chat)
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user chats' })
  async getMyChats(@Request() req: any) {
    const userId = this.extractUserId(req.user);
    const chats = await this.chatService.getUserChats(userId);
    return {
      succeeded: true,
      message: 'Chats retrieved successfully',
      resultData: chats.map(c => ChatMapper.toDto(c))
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chat by ID' })
  async findOne(@Param('id') id: string) {
    const chat = await this.chatService.getChatById(id);
    return {
      succeeded: true,
      message: 'Chat retrieved successfully',
      resultData: ChatMapper.toDto(chat)
    };
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all messages in a chat' })
  async getMessages(@Param('id') id: string) {
    const messages = await this.chatService.getChatMessages(id);
    return {
      succeeded: true,
      message: 'Messages retrieved successfully',
      resultData: messages.map(m => ChatMessageMapper.toDto(m))
    };
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Send a message in a chat' })
  async sendMessage(
    @Body(new ValidationPipe()) createMessageDto: CreateChatMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let attachmentUrl: string | undefined;
    let mimeType: string | undefined;
    let fileSize: number | undefined;
    let type = createMessageDto.type || 'TEXT';

    if (file) {
      const uploadedFile = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      };

      // Determine file type and upload accordingly
      if (file.mimetype.startsWith('image/')) {
        attachmentUrl = await this.fileUploadService.uploadImageFile(uploadedFile);
        type = 'IMAGE';
      } else if (file.mimetype.startsWith('video/')) {
        attachmentUrl = await this.fileUploadService.uploadVideoFile(uploadedFile);
        type = 'VIDEO';
      } else if (file.mimetype.startsWith('audio/')) {
        attachmentUrl = await this.fileUploadService.uploadAudioFile(uploadedFile);
        type = 'AUDIO';
      } else {
        attachmentUrl = await this.fileUploadService.uploadGenericFile(uploadedFile);
        type = 'FILE';
      }

      mimeType = file.mimetype;
      fileSize = file.size;
    }

    const message = await this.chatService.sendMessage({
      ...createMessageDto,
      type: type as ChatMessageType,
      attachmentUrl,
      mimeType,
      fileSize,
    });

    return {
      succeeded: true,
      message: 'Message sent successfully',
      resultData: ChatMessageMapper.toDto(message)
    };
  }

  @Patch('messages/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark message as read' })
  async markMessageAsRead(@Param('id') id: string) {
    const message = await this.chatService.markMessageAsRead(id);
    return {
      succeeded: true,
      message: 'Message marked as read',
      resultData: ChatMessageMapper.toDto(message)
    };
  }

  private extractUserId(user: any): string {
    const id = user.user?.id || user.id || user.sub;
    if (id) return id;
    throw new NotFoundException('User ID missing from session');
  }
}
