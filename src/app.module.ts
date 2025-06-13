import { RolesGuard } from './auth/role.guard';
import { MusicModule } from './music/music.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { RedisModule } from './redis/redis.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncModule } from './sync/sync.module';
import { LinkModule } from './link/link.module';
import { GlobalInterceptor } from './interceptor/global.interceptor';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options), // AppDataSource 적용
    AuthModule, // ✅ `AuthModule`을 통해 `AuthGuard`, `RolesGuard` 제공
    ConfigModule.forRoot({
      isGlobal: true, // ✅ 전역 사용 가능하도록 설정
    }),
    MusicModule,
    LinkModule,
    RedisModule,
    EvaluationModule,
    ScheduleModule.forRoot(),
    SyncModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // ✅ `AuthGuard`가 `AuthModule`에서 해결 가능
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // ✅ `RolesGuard`도 `AuthModule`을 통해 해결 가능
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalInterceptor,
    }
  ],
})