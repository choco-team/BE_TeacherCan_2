import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisPubSubService } from './redisPubSub.service';
import { RedisStreamService } from './redis-stream.service';

@Global() // 어디서든 import 없이 사용 가능
@Module({
  providers: [RedisService, RedisPubSubService, RedisStreamService],
  exports: [RedisService, RedisPubSubService, RedisStreamService],
})
export class RedisModule {}
