import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisPubSubService } from './redisPubSub.service';

@Global() // 어디서든 import 없이 사용 가능
@Module({
  providers: [RedisService, RedisPubSubService],
  exports: [RedisService, RedisPubSubService],
})
export class RedisModule {}
