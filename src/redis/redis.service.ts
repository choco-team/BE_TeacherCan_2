import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private pubClient: Redis; // publish 및 일반 작업용
  private subClient: Redis; // subscribe 전용

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.pubClient = new Redis({
  host: this.configService.get<string>('REDIS_HOST', 'localhost'),
  port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.subClient = new Redis({
  host: this.configService.get<string>('REDIS_HOST', 'localhost'),
  port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.pubClient.on('connect', () => {
      console.log('[Redis] Pub Client Connected');
    });

    this.subClient.on('connect', () => {
      console.log('[Redis] Sub Client Connected');
    });

    this.pubClient.on('error', (err) => {
      console.error('[Redis] Pub Error:', err);
    });

    this.subClient.on('error', (err) => {
      console.error('[Redis] Sub Error:', err);
    });
  }

  // publish
  async publish(channel: string, message: string) {
    await this.pubClient.publish(channel, message);
  }

  // subscribe
  async subscribe(channel: string, listener: (message: string) => void) {
    await this.subClient.subscribe(channel);
    this.subClient.on('message', (subscribedChannel, message) => {
      if (subscribedChannel === channel) {
        listener(message);
      }
    });
  }

  // 일반 키-밸류 작업용
  getClient(): Redis {
    return this.pubClient;
  }

  /**
   * HSET 메서드 추가 (music_request용)
   * @param key Redis 키
   * @param values 저장할 필드-값 오브젝트
   */
  async hset(key: string, values: Record<string, string>) {
    if (!this.pubClient.status || this.pubClient.status !== 'ready') {
      console.warn('[Redis] pubClient not ready, reconnecting...');
      await this.pubClient.connect();
    }

    const entries = Object.entries(values).flat();
    if (entries.length === 0) return;

    await this.pubClient.hset(key, ...entries);
  }

  /**
   * (Optional) 키 삭제
   */
  async delete(key: string) {
    if (!this.pubClient.status || this.pubClient.status !== 'ready') {
      await this.pubClient.connect();
    }
    await this.pubClient.del(key);
  }

  async onModuleDestroy() {
    await this.pubClient.quit();
    await this.subClient.quit();
  }
}
