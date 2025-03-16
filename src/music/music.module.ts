import { Module } from '@nestjs/common';
import { MusicController } from './music.controller';
import { Student } from 'src/db/entities/student.entity';
import { Music } from 'src/db/entities/music.entity';
import { Room } from 'src/db/entities/room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoService } from 'src/services/crypto.service';
import { RsaKey } from 'src/db/entities/rsaKey.entity';
import { MusicInfoService } from './musicInfo.service';
import { MusicRoomService } from './musicRoom.service';
import { MusicStudentService } from './musicStudent.service';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Music, Room, RsaKey])],
  providers: [MusicInfoService, MusicRoomService, MusicStudentService, CryptoService],
  controllers: [MusicController]
})
export class MusicModule {}
