import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncTask } from './sync.task';
import { RedisService } from '../redis/redis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Music } from 'src/db/entities/music.entity';
import { Room } from 'src/db/entities/room.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Music, Room])],
    providers: [SyncService, SyncTask, RedisService],
})
export class SyncModule {}
