// 1. RedisService: 기본 Redis 연결 관리 + 일반 작업
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    console.log('[RedisService] Config REDIS_HOST =', host);
    console.log('[RedisService] Config REDIS_PORT =', port);

    this.client = new Redis({ host, port });

    this.client.on('connect', () => {
      console.log('[Redis] Client Connected');
    });

    this.client.on('error', (err) => {
      console.error('[Redis] Error:', err);
    });
  }

  // 클라이언트 접근 (다른 서비스에서 사용)
  getClient(): Redis {
    return this.client;
  }

  // 일반 Redis 작업들
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async hset(key: string, values: Record<string, string>): Promise<void> {
    if (!this.client.status || this.client.status !== 'ready') {
      console.warn('[Redis] Client not ready, reconnecting...');
      await this.client.connect();
    }

    const entries = Object.entries(values).flat();
    if (entries.length === 0) return;

    await this.client.hset(key, ...entries);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key);
  }

  async delete(key: string): Promise<void> {
    if (!this.client.status || this.client.status !== 'ready') {
      await this.client.connect();
    }
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async onModuleDestroy() {
    console.log('[Redis] Cleaning up connection...');
    await this.client.quit();
  }
}