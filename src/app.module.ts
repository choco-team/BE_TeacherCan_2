import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MusicModule } from './music/music.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MusicModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
