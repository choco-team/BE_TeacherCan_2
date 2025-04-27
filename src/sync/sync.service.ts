import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Music } from '../db/entities/music.entity'; // 경로 주의
import { Repository, MoreThan } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SyncService {
  private lastSyncedAt: Date = new Date(0); // 서버 시작 후 첫 싱크는 전체

  constructor(
    @InjectRepository(Music)
    private readonly musicRepository: Repository<Music>,
    private readonly redisService: RedisService,
  ) {}

  async syncMusicRequestsToRedis() {
    const updatedMusics = await this.musicRepository.find({
      where: {
        updatedAt: MoreThan(this.lastSyncedAt),
      },
    });

    for (const music of updatedMusics) {
      await this.updateMusicToRedis(music);
    }

    this.lastSyncedAt = new Date();
  }

  private async updateMusicToRedis(music: Music) {
    const key = `music:${music.id}`;

    await this.redisService.hset(key, {
      musicId: music.musicId,
      nickname: music.nickname || '',
      title: music.title || '',
      roomId: music.roomId,
      studentId: music.studentId ? music.studentId.toString() : '',
      updatedAt: music.updatedAt.toISOString(),
    });
  }
}
