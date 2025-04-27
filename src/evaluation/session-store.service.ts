import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionStoreService {
  constructor(private readonly redisService: RedisService) {}

  async saveSession(sessionKey: string, data: any): Promise<void> {
    await this.redisService.getClient().set(`session:${sessionKey}`, JSON.stringify(data));
  }

  async getSession(sessionKey: string): Promise<any> {
    const raw = await this.redisService.getClient().get(`session:${sessionKey}`);
    return raw ? JSON.parse(raw) : null;
  }

  async deleteSession(sessionKey: string): Promise<void> {
    await this.redisService.getClient().del(`session:${sessionKey}`);
  }

  async examInfomation(sessionKey: string) {
   return await this.redisService.getClient().get(`session:${sessionKey}`);
  }

  async saveStudentSession(sessionKey: string, studentId: string, data: any): Promise<void> {
    const key = `session:${sessionKey}:${studentId}`;
    await this.redisService.getClient().set(key, JSON.stringify(data), 'EX', 7200); // TTL 2시간
  }
}
