import { Module } from '@nestjs/common';
// import {ProPanelHandlerModule} from './pro-panel_handler/pro-panel_handler.module'
import { chatService } from './chat.service';
import { chatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { Chat } from './chat.service';
@Module({
  controllers: [chatController],
  providers: [chatService, ChatGateway, Chat],
  imports: [
      ConfigModule.forRoot({
      isGlobal: true,
    })
  ],
  exports: [chatService]
})

export class ChatModule {}