import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: +(process.env.REDIS_PORT || 6379),
    });

    this.client.on('connect', () => {
      console.log('[Redis] Connected');
    });

    this.client.on('error', (err) => {
      console.error('[Redis] Error:', err);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  onModuleDestroy() {
    return this.client.quit();
  }
}
