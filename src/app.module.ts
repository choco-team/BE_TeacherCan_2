import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './db/AppDataSource';
import { AuthModule } from './auth/auth.module';
import { SubjectModule } from './subject/subject.module';
import { QuestionModule } from './question/question.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/role.guard';
import { StudentModule } from './student/student.module';
import { LlmModule } from './llm/llm.module';
import { MusicModule } from './music/music.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CsrfInterceptor } from './interceptor/csrf.interceptor';
import { CsrfMiddleware } from './middleware/csrf.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options), // AppDataSource 적용
    AuthModule, // ✅ `AuthModule`을 통해 `AuthGuard`, `RolesGuard` 제공
    SubjectModule,
    QuestionModule,
    ConfigModule.forRoot({
      isGlobal: true, // ✅ 전역 사용 가능하도록 설정
      envFilePath: '/.env', // 루트 디렉토리의 .env 파일
      ignoreEnvFile: false, // .env 파일을 무시하지 않음
    }),
    StudentModule,
    LlmModule,
    MusicModule,
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
      useClass: CsrfInterceptor,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}