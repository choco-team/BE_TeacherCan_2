import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as express from "express";
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


// CORS 설정하기
const isLocal = process.env.LOCAL === 'true';

app.enableCors({
  origin: isLocal
    ? ['http://localhost:3000']  // 개발 환경
    : ['https://www.teachercan.com'], // 배포 환경
  credentials: true,
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

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
bootstrap();
