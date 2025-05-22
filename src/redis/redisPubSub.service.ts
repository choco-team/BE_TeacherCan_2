import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    // Redis 연결
    this.publisher = new Redis();    // pub용
    this.subscriber = new Redis();   // sub용
  }

  // ✅ 메시지 publish
  async publish(channel: string, message: any): Promise<void> {
    const payload = JSON.stringify(message);
    await this.publisher.publish(channel, payload);
  }

  // ✅ 특정 채널 subscribe
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

  // ✅ 패턴 기반 구독 (stream:*)
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
