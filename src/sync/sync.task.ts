import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncService } from './sync.service';

@Injectable()
export class SyncTask {
  constructor(private readonly syncService: SyncService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    console.log('[SyncTask] 시작: DB → Redis 동기화');
    await this.syncService.syncRedisToDatabase();
    console.log('[SyncTask] 완료');
  }
}
