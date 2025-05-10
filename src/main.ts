import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

// CORS 설정하기
const isLocal = process.env.LOCAL === 'true';

app.use((req, res, next) => {
  // if (req.path.startsWith('/music-request/asd')) {
  //   console.log("@@@@@@@asdasdq123123132",req.path)

  //   next();
  // } else {
    express.json()(req, res, next);
  // }
});

// app.enableCors({
//   origin: ['http://localhost:3000', 'https://teachercan.com'],
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   exposedHeaders: ['Content-Type', 'Authorization'],
// });

app.enableCors({
  origin: ['http://localhost:3000', 'https://teachercan.com'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
});

if (process.env.LOCAL==="true"){
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


  // ✅ 글로벌 파이프 설정 (DTO 유효성 검사)
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
bootstrap();
