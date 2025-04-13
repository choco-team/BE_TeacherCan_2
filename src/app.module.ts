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
      useFactory: (config: ConfigService) => {
        // 여기에 로그 삽입!
        console.log('🔐 비밀번호 실제 값:', config.get('DATABASE_PASSWORD'));

        return {
          type: 'mysql',
          host: config.get('DATABASE_HOST'),
          port: parseInt(config.get('DATABASE_PORT') ?? '3306', 10),
          username: config.get('DATABASE_USER'),
          password: config.get('DATABASE_PASSWORD'),
          database: config.get('DATABASE_NAME'),
          synchronize: false,
          autoLoadEntities: true,
        };
      },
    }),

    AuthModule,
    SubjectModule,
    QuestionModule,
    StudentModule,
    LlmModule,
    MusicModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CsrfInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
