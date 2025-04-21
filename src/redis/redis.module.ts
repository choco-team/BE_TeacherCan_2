import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // 어디서든 import 없이 사용 가능
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
