import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('🌐 Music 서버 시작');

  app.use(express.json());

  // SSE를 위한 헤더 설정
  app.use((req, res, next) => {
    if (req.path === '/sse' || req.path === '/music-request/sse') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    }
    next();
  });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8080',
      'https://www.teachercan.com',
      'https://teachercan.com',
      'https://be-teacher-can-2-cr55yn82i-teachercans-projects.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  });

  const port = process.env.PORT ?? 8080;
  await app.listen(port);

  console.log(`🚀 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`🔗 서버 URL: http://localhost:${port}`);
  console.log(`📡 SSE 엔드포인트: http://localhost:${port}/sse`);
  console.log(`💚 헬스체크: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('❌ 서버 시작 실패:', err);
  process.exit(1);
});
