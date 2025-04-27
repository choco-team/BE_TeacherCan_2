import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { SessionStoreService } from './session-store.service';
import { SessionStreamService } from './session-stream.service';
import { RedisModule } from 'src/redis/redis.module'; // OK!

@Module({
  imports: [RedisModule], // ✅ 여기에
  controllers: [EvaluationController], // ✅ 컨트롤러만
  providers: [
    EvaluationService,
    SessionStoreService,
    SessionStreamService,
  ],
})
export class EvaluationModule {}
