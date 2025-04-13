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
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // ✅ 먼저 .env 환경변수 로딩
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.LOCAL === 'true' ? './.env' : '/.env',
    }),

    // ✅ 그 다음 TypeORM (ConfigService 의존함)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DATABASE_HOST'),
        port: parseInt(config.get('DATABASE_PORT') ?? '3306', 10),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    AuthModule, // ✅ AuthModule을 통해 AuthGuard, RolesGuard 제공
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
      useClass: AuthGuard, // ✅ AuthGuard가 AuthModule에서 해결 가능
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // ✅ RolesGuard도 AuthModule을 통해 해결 가능
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