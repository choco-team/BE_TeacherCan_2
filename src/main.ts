import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as express from "express";
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

async function bootstrap() {
  // NestFactory.create 전에 환경 변수 수동 로드
  try {
    if (fs.existsSync('/.env')) {
      dotenv.config({ path: '/.env' });
      console.log('DATABASE_PASSWORD from env:', process.env.DATABASE_PASSWORD);
    }
  } catch (error) {
    console.error('Error loading .env file:', error);
  }

  const app = await NestFactory.create(AppModule);
  
// CORS 설정하기
const isLocal = process.env.LOCAL;
app.enableCors({
  origin: isLocal
    ? ['http://localhost:3000', 'http://test.teachercan.com']
    : ['https://www.teachercan.com', 'https://api.teachercan.com'],
  credentials: true,
  exposedHeaders: ['X-CSRF-Token']
});  

  if (isLocal){
    // Swagger 설정
    const config = new DocumentBuilder()
      .setTitle('API 문서') // 문서 제목
      .setDescription('API 설명') // 설명
      .setVersion('1.0') // 버전
      .addCookieAuth('connect.sid')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document,{
      swaggerOptions: {
        withCredentials: true, // 쿠키 자동 전송 활성화
      },
    });
  }
  
  // ✅ 쿠키 파서를 전역 미들웨어로 추가
  app.use(cookieParser());
  // ✅ 글로벌 파이프 설정 (DTO 유효성 검사)
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  await app.listen(Number(process.env.SERVER_PORT) ?? 3000);
}

bootstrap();
