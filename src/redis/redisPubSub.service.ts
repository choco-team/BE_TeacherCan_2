import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService {
  private publisher: Redis;
  private subscriber: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.publisher = new Redis({ host, port });
    this.subscriber = new Redis({ host, port });

    this.publisher.on('error', err => console.error('[RedisPubSub] Pub error:', err));
    this.subscriber.on('error', err => console.error('[RedisPubSub] Sub error:', err));
  }

  async publish(channel: string, message: any): Promise<void> {
    const payload = JSON.stringify(message);
    await this.publisher.publish(channel, payload);
  }

  subscribe(channel: string, handler: (message: any) => void): void {
    this.subscriber.subscribe(channel, (err, count) => {
      if (err) {
        console.error(`[Redis] Failed to subscribe to ${channel}:`, err);
      } else {
        console.log(`[Redis] Subscribed to ${channel} (${count} channels)`);
      }
    });

    this.subscriber.on('message', (receivedChannel, rawMessage) => {
      if (receivedChannel === channel) {
        try {
          const parsed = JSON.parse(rawMessage);
          handler(parsed);
        } catch (err) {
          console.error(`[Redis] Failed to parse message on ${channel}:`, err);
        }
      }
    });
  }

  subscribePattern(
    pattern: string,
    handler: (channel: string, message: any) => void | Promise<void>,
  ): void {
    this.subscriber.psubscribe(pattern, (err, count) => {
      if (err) {
        console.error(`[Redis] Failed to psubscribe to ${pattern}:`, err);
      } else {
        console.log(`[Redis] Pattern-subscribed to ${pattern} (${count} patterns)`);
      }
    });

    this.subscriber.on('pmessage', async (_pattern, receivedChannel, rawMessage) => {
      console.log(`[Redis] [pmessage] channel: ${receivedChannel}`);
      console.log(`[Redis] [pmessage] raw:`, rawMessage);

      try {
        const parsed = JSON.parse(rawMessage);
        await handler(receivedChannel, parsed);
      } catch (err) {
        console.error(`[Redis] Failed to parse/handle message on ${receivedChannel}:`, err);
      }
    });
  }
}
