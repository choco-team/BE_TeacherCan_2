// 2. RedisPubSubService: Pub/Sub 전용 (RedisService 의존)
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;
  private subscribedChannels: Set<string> = new Set();
  private subscribedPatterns: Set<string> = new Set();

  constructor(
    private readonly configService: ConfigService,
    // private readonly redisService: RedisService  // 필요하면 의존성 주입
  ) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    // Pub/Sub은 별도 연결이 필요
    this.publisher = new Redis({ host, port });
    this.subscriber = new Redis({ host, port });

    this.publisher.on('connect', () => {
      console.log('[RedisPubSub] Publisher Connected');
    });

    this.subscriber.on('connect', () => {
      console.log('[RedisPubSub] Subscriber Connected');
    });

    this.publisher.on('error', err => 
      console.error('[RedisPubSub] Publisher error:', err)
    );
    this.subscriber.on('error', err => 
      console.error('[RedisPubSub] Subscriber error:', err)
    );
  }

  // 기본 문자열 발행
  async publishRaw(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  // JSON 자동 직렬화 발행
  async publish(channel: string, message: any): Promise<void> {
    const payload = JSON.stringify(message);
    await this.publisher.publish(channel, payload);
  }

  // 채널별 핸들러 관리
  private channelHandlers: Map<string, Set<(message: string) => void>> = new Map();
  private messageListener: ((channel: string, message: string) => void) | null = null;

  // 기본 문자열 구독 (중복 구독 방지)
  async subscribeRaw(
    channel: string, 
    handler: (message: string) => void
  ): Promise<void> {
    // 첫 번째 구독이면 전역 메시지 리스너 등록
    if (!this.messageListener) {
      this.messageListener = (receivedChannel: string, message: string) => {
        const handlers = this.channelHandlers.get(receivedChannel);
        if (handlers) {
          handlers.forEach(handler => handler(message));
        }
      };
      this.subscriber.on('message', this.messageListener);
    }

    // 채널 구독
    if (!this.subscribedChannels.has(channel)) {
      await this.subscriber.subscribe(channel);
      this.subscribedChannels.add(channel);
      console.log(`[RedisPubSub] Subscribed to raw channel: ${channel}`);
    }

    // 핸들러 등록
    if (!this.channelHandlers.has(channel)) {
      this.channelHandlers.set(channel, new Set());
    }
    this.channelHandlers.get(channel)!.add(handler);
  }

  // JSON 자동 파싱 구독
  subscribe(channel: string, handler: (message: any) => void): void {
    const rawHandler = (message: string) => {
      try {
        const parsed = JSON.parse(message);
        handler(parsed);
      } catch (err) {
        console.error(`[RedisPubSub] Failed to parse message on ${channel}:`, err);
        // fallback으로 원본 메시지 전달
        handler(message);
      }
    };

    this.subscribeRaw(channel, rawHandler);
  }

  // 패턴 구독
  subscribePattern(
    pattern: string,
    handler: (channel: string, message: any) => void | Promise<void>,
  ): void {
    this.subscriber.psubscribe(pattern, (err, count) => {
      if (err) {
        console.error(`[RedisPubSub] Failed to psubscribe to ${pattern}:`, err);
      } else {
        console.log(`[RedisPubSub] Pattern-subscribed to ${pattern} (${count} patterns)`);
        this.subscribedPatterns.add(pattern);
      }
    });

    this.subscriber.on('pmessage', async (_pattern, receivedChannel, rawMessage) => {
      console.log(`[RedisPubSub] [pmessage] channel: ${receivedChannel}`);

      try {
        const parsed = JSON.parse(rawMessage);
        await handler(receivedChannel, parsed);
      } catch (err) {
        console.error(`[RedisPubSub] Failed to parse/handle message on ${receivedChannel}:`, err);
        // fallback으로 원본 메시지 전달
        await handler(receivedChannel, rawMessage);
      }
    });
  }

  // 구독 해제 (특정 핸들러)
  async unsubscribeHandler(
    channel: string, 
    handler: (message: string) => void
  ): Promise<void> {
    const handlers = this.channelHandlers.get(channel);
    if (handlers) {
      handlers.delete(handler);
      
      // 해당 채널의 모든 핸들러가 제거되면 채널 구독 해제
      if (handlers.size === 0) {
        this.channelHandlers.delete(channel);
        await this.unsubscribe(channel);
      }
    }
  }

  // 구독 해제 (채널 전체)
  async unsubscribe(channel: string): Promise<void> {
    if (this.subscribedChannels.has(channel)) {
      await this.subscriber.unsubscribe(channel);
      this.subscribedChannels.delete(channel);
      this.channelHandlers.delete(channel);
      console.log(`[RedisPubSub] Unsubscribed from channel: ${channel}`);
    }
  }

  async unsubscribePattern(pattern: string): Promise<void> {
    if (this.subscribedPatterns.has(pattern)) {
      await this.subscriber.punsubscribe(pattern);
      this.subscribedPatterns.delete(pattern);
    }
  }

  async onModuleDestroy() {
    console.log('[RedisPubSub] Cleaning up connections...');
    
    // 모든 구독 해제
    for (const channel of this.subscribedChannels) {
      await this.subscriber.unsubscribe(channel);
    }
    for (const pattern of this.subscribedPatterns) {
      await this.subscriber.punsubscribe(pattern);
    }
    
    // 핸들러 및 리스너 정리
    this.channelHandlers.clear();
    if (this.messageListener) {
      this.subscriber.off('message', this.messageListener);
      this.messageListener = null;
    }
    
    this.subscribedChannels.clear();
    this.subscribedPatterns.clear();
    
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}