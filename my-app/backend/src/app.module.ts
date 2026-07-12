import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProPanelHandlerModule } from './pro-panel_handler/pro-panel_handler.module';
import {MailModule} from './sender/mail.module'
import {ChatModule} from'./chat/chat.module'
// import { TaskGateway } from './sender/task.gateway';

@Module({
  imports: [ProPanelHandlerModule, MailModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}