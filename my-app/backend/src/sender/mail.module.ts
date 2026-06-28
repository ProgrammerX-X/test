import { Module } from '@nestjs/common';
import { SenderMail, jwtAuth, EmailsService } from './mail.service';
import { SenderController } from './mail.controller';
import { ScheduleModule } from '@nestjs/schedule';
import {JwtModule} from '@nestjs/jwt'
import { TaskGateway } from './task.gateway';
import { ProPanelHandlerModule} from 'src/pro-panel_handler/pro-panel_handler.module';
// import { ProPanelHandlerService } from 'src/pro-panel_handler/pro-panel_handler.service'; 

@Module({
  controllers: [SenderController],
  providers: [SenderMail, jwtAuth, TaskGateway, EmailsService],
  imports: [ScheduleModule.forRoot(), 
    JwtModule.register({
      secret: process.env.TOKEN_JWT,
      signOptions: { expiresIn: '15m' },
    }),
    ProPanelHandlerModule
  ]
  
})

export class MailModule{}