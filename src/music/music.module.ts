import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { MusicController } from './music.controller';
import { Student } from 'src/db/entities/student.entity';
import { Music } from 'src/db/entities/music.entity';
import { Room } from 'src/db/entities/room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoService } from 'src/services/crypto.service';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Music, Room])],
  providers: [MusicService, CryptoService],
  controllers: [MusicController]
})
export class MusicModule {}
