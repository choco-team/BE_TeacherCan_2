import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './db/AppDataSource';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SubjectModule } from './subject/subject.module';
import { QuestionModule } from './question/question.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/role.guard';
import { StudentModule } from './student/student.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options), // AppDataSource 적용
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'front'),
      serveRoot: '/', // ✅ 루트 경로에서 정적 파일 서빙
      exclude: ['/api*'], // ✅ API 요청 제외 (API는 /api 경로에서 제공)
    }),
    AuthModule, // ✅ `AuthModule`을 통해 `AuthGuard`, `RolesGuard` 제공
    SubjectModule,
    QuestionModule,
    ConfigModule.forRoot({
      isGlobal: true, // ✅ 전역 사용 가능하도록 설정
    }),
    StudentModule,
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
  ],
})
export class AppModule {}
