import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TaskGateway } from '../sender/task.gateway';
import { GuestController } from './guest.controller';
import { GuestService } from './guest.service';

@Module({
  controllers: [GuestController],
  providers: [GuestService, TaskGateway],
  imports: [
      ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_LOGIN_FOR_USERS_PROJECTS as string, {
      dbName: 'users_projects'
    })
  ],
  exports: [GuestService]
})

export class GuestModule {}
