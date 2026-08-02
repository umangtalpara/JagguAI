import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './entities/conversation.entity';
import { Message, MessageDocument } from './entities/message.entity';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}

  async insertConversation(data: Partial<Conversation>): Promise<ConversationDocument> {
    const conn = new this.conversationModel(data);
    return conn.save();
  }

  async getConversationByVisitor(workspaceId: string, visitorId: string): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne({ workspaceId, visitorId }).exec();
  }

  async getConversationById(id: string): Promise<ConversationDocument | null> {
    return this.conversationModel.findById(id).exec();
  }

  async insertMessage(data: Partial<Message>): Promise<MessageDocument> {
    const msg = new this.messageModel(data);
    return msg.save();
  }

  async getMessagesByConversation(conversationId: string): Promise<MessageDocument[]> {
    return this.messageModel.find({ conversationId }).sort({ createdAt: 1 }).exec();
  }
}
