import { Module } from '@nestjs/common';
// import {ProPanelHandlerModule} from './pro-panel_handler/pro-panel_handler.module'
import { ProPanelHandlerService } from './pro-panel_handler.service';
import { ProPanelHandler, eventHandler } from './pro-panel_handler.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import {GetBlock, blockSchema, GetProjects, blockSchemaGetter} from './schema/pro-panel_handler.schema'
import { TaskGateway } from '../sender/task.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';
// import { EmailsService } from './pro-panel_handler.service';
// import { MailService } from './mail.service';

@Module({
  controllers: [ProPanelHandler],
  providers: [ProPanelHandlerService, TaskGateway, 
    eventHandler
    // EmailsService
  ],
  imports: [
      ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_LOGIN_FOR_USERS_PROJECTS as string, {
      dbName: 'users_projects'
    }),
    MongooseModule.forFeature([{ name: GetBlock.name, schema: blockSchema, collection: 'data' }]),
    MongooseModule.forFeature([{ name: GetProjects.name, schema: blockSchemaGetter, collection: 'projects'}]),
    EventEmitterModule.forRoot()
  ],
  exports: [ProPanelHandlerService]
})

export class ProPanelHandlerModule {}
