import { Module } from '@nestjs/common';
import { MusicController } from './music.controller';
import { MusicWebRTCController } from './music-webrtc.controller';
import { MusicWebRTCGateway } from './music-webrtc.gateway';
import { MusicWebRTCService } from './music-webrtc.service';
import { Student } from 'src/db/entities/student.entity';
import { Music } from 'src/db/entities/music.entity';
import { Room } from 'src/db/entities/room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RsaKey } from 'src/db/entities/rsaKey.entity';
import { CryptoModule } from 'src/services/crypto.module';
import { MusicSQLService } from './music.sql.service';
import { MusicService } from './music.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Music, Room, RsaKey]), 
    CryptoModule
  ],
  providers: [
    MusicSQLService, 
    MusicService,
    MusicWebRTCService,
    MusicWebRTCGateway
  ],
  controllers: [
    MusicController,
    MusicWebRTCController
  ],
  exports: [
    MusicService, 
    MusicSQLService,
    MusicWebRTCService,
    MusicWebRTCGateway
  ]
})
export class MusicModule {}