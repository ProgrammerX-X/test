import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProPanelHandlerModule } from './pro-panel_handler/pro-panel_handler.module';
import {MailModule} from './sender/mail.module'
// import { TaskGateway } from './sender/task.gateway';

@Module({
  imports: [ProPanelHandlerModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}