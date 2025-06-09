import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Music } from '../db/entities/music.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Music)
    private readonly musicRepository: Repository<Music>,
    private readonly redisService: RedisService,
  ) {}

  async syncRedisToDatabase() {
    const redisClient = this.redisService.getClient();
    const keys = await redisClient.keys('music:*');

    for (const key of keys) {
      const data = await redisClient.hgetall(key);

      if (!data.musicId) continue; // 필수 필드 없으면 무시

      const existing = await this.musicRepository.findOne({ where: { musicId: data.musicId } });

      const music = this.musicRepository.create({
        musicId: data.musicId,
        title: data.title || null,
        roomId: data.roomId || null,
        studentId: data.studentId ? parseInt(data.studentId, 10) : null,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      });

      if (existing) {
        // update
        music.id = existing.id;
        await this.musicRepository.save(music);
      } else {
        // insert
        await this.musicRepository.insert(music);
      }
    }
  }
}
