import { Module } from '@nestjs/common';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { MusicSQLService } from './music.sql.service';
import { CryptoModule } from 'src/services/crypto.module';

@Module({
  imports: [CryptoModule],
  controllers: [MusicController],
  providers: [MusicService, MusicSQLService],
  exports: [MusicService, MusicSQLService],
})
export class MusicModule {}
