import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { join } from "path";
import * as express from "express";
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { CryptoService } from "./services/crypto.service";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    // 🔹 CryptoService 가져오기
    const cryptoService = app.get(CryptoService);

    // 🔹 서버 부팅 시 RSA 및 AES 키 생성 실행
    await cryptoService.ensureRSAKeyExists();
    await cryptoService.generateAndEncryptAESKey();

// CORS 설정하기
app.enableCors({
  origin: 'https://www.teachercan.com/',
  credentials: true,
});

if (process.env.LOCAL==="true"){
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('API 문서') // 문서 제목
    .setDescription('API 설명') // 설명
    .setVersion('1.0') // 버전
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}



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
