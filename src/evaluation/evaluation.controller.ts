import { Controller, Post, Body, Sse, Param, Res, Header, Get, Req, HttpCode } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateSessionDto, studentAnswer } from '../dto/session.dto';
import { ApiTags } from '@nestjs/swagger';
import * as path from 'path';
import { Request, Response } from 'express';
import { SessionStoreService } from './session-store.service';

@ApiTags('/evaluation')
@Controller('evaluation')
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly sessionStoreService: SessionStoreService
  ) {}

  // ✅ 세션 생성 (public API)
  @Post('create')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  @HttpCode(201)
  async createSession(@Body() dto: CreateSessionDto) {
    return this.evaluationService.createSession(dto);
  }

  // ✅ SSE 연결 (public API)
  @Get('sse/:sessionKey')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  async connectSession(
    @Param('sessionKey') sessionKey: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('[SSE] 연결 요청됨:', sessionKey);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = this.evaluationService.createStream(sessionKey);

    stream.on('data', (data: string) => {
      res.write(data);
    });

    req.on('close', () => {
      console.log('[SSE] 연결 끊김:', sessionKey);
      this.evaluationService.closeStream(sessionKey);
      res.end();
    });
  }

  // ✅ 시험 화면 전달 (protected or open 둘 다 가능)
  @Get('exam/:sessionKey')
  async connectExam(
    @Res() res: Response,
  ) {
    const filePath = path.join(__dirname, '..', '..', 'exam', 'main.html');
    res.sendFile(filePath);
  }

  @Get('exam/javaScript/code')
  async getMainJS(
    @Res() res: Response,
  ) {
    const filePath = path.join(__dirname, '..', '..', 'exam', 'main.js');
    res.sendFile(filePath);
  }

  // ✅ 시험 문제 정보 (인증 필요, 전역 CORS 정책 적용)
  @Get('student/:sessionKey')
  async fetchExamInfomation(
    @Param('sessionKey') sessionKey: string,
  ) {
    return this.sessionStoreService.examInfomation(sessionKey);
  }

  // ✅ 답안 제출 (인증 필요, 전역 CORS 정책 적용)
  @Post('student/:sessionKey')
  async submitExam(
    @Param('sessionKey') sessionKey: string,
    @Body() body: studentAnswer
  ) {
    return this.evaluationService.examSubmit(sessionKey, body);
  }
}
