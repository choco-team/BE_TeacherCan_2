import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { join } from "path";
import * as express from "express";
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ 정적 파일 서빙
  app.use(express.static(join(process.cwd(), "front")));

  // ✅ API 요청이 아닌 경우 index.html 제공 (Svelte 라우팅 지원)
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    res.sendFile(join(process.cwd(), "front", "index.html"));
  });
  // ✅ 쿠키 파서를 전역 미들웨어로 추가
  app.use(cookieParser());
  // ✅ 글로벌 파이프 설정 (DTO 유효성 검사)
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
