import { Module } from '@nestjs/common';
import { MusicController } from './music.controller';
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
  providers: [MusicSQLService, MusicService],
  controllers: [MusicController],
  exports: [MusicService, MusicSQLService] // 다른 모듈에서 사용할 수 있도록 export
})
export class MusicModule {}