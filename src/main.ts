import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express'
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  let app;
  
  // HTTPS 사용 시에만 SSL 인증서 파일 읽기
  if (process.env.LOCAL_HTTPS === "true") {
    try {
      const httpsOptions = {
        key: fs.readFileSync('./ssl/localhost-key.pem'),
        cert: fs.readFileSync('./ssl/localhost.pem'),
      };
      
      app = await NestFactory.create(AppModule, {
        httpsOptions
      });
      
      console.log('🔒 HTTPS 모드로 서버 시작');
    } catch (error) {
      console.error('❌ SSL 인증서 파일을 찾을 수 없습니다. HTTP 모드로 전환합니다.');
      console.error('SSL 파일 경로: ./ssl/localhost-key.pem, ./ssl/localhost.pem');
      
      // SSL 파일이 없으면 HTTP로 fallback
      app = await NestFactory.create(AppModule);
      console.log('🌐 HTTP 모드로 서버 시작');
    }
  } else {
    // HTTP 모드
    app = await NestFactory.create(AppModule);
    console.log('🌐 HTTP 모드로 서버 시작');
  }

  app.use(express.json());

  app.enableCors({
    origin: ['https://localhost:3000', 'http://localhost:3000', 'https://teachercan.com', 'https://www.teachercan.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  });

  // 로컬 개발 환경에서만 Swagger 활성화
  if (process.env.LOCAL === "true") {
    // Swagger 설정
    const config = new DocumentBuilder()
      .setTitle('TeacherCan API') // 문서 제목
      .setDescription('TeacherCan 백엔드 API 문서') // 설명
      .setVersion('1.0') // 버전
      .addCookieAuth('connect.sid')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        withCredentials: true, // 쿠키 자동 전송 활성화
      },
    });
    
    console.log('📚 Swagger 문서: http://localhost:8080/api-docs');
  }

  // ✅ 쿠키 파서를 전역 미들웨어로 추가
  app.use(cookieParser());
  
  // ✅ 글로벌 파이프 설정 (DTO 유효성 검사)
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  
  console.log(`🚀 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`환경: ${process.env.LOCAL === "true" ? "개발" : "프로덕션"}`);
}

bootstrap().catch(err => {
  console.error('❌ 서버 시작 실패:', err);
  process.exit(1);
});