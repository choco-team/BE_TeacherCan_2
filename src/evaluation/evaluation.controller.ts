import { Controller, Post, Body, Sse, Param, Res, Header, Get, Req } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateSessionDto } from '../dto/session.dto';
import { ApiTags } from '@nestjs/swagger';
import * as path from 'path';
import { Request, Response } from 'express';
import { SessionStoreService } from './session-store.service';

@ApiTags('/evaluation')
@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService,
    private readonly sessionStoreService: SessionStoreService
  ) {}

  @Post('create')
  @Header('Access-Control-Allow-Origin', '*') // 여기만 CORS 열어줌
  async createSession(@Body() dto: CreateSessionDto) {
    return this.evaluationService.createSession(dto);
  }
  
  @Get('sse/:sessionKey')
  async connectSession(
    @Param('sessionKey') sessionKey: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('[SSE] 연결 요청됨:', sessionKey);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // 헤더를 강제로 먼저 보냄

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

  @Get('exam/:sessionKey')
  async connectExam(
    @Res() res: Response,
  ) {
    const filePath = path.join(__dirname, '..', '..', 'exam', 'main.html'); // 위치 주의
    res.sendFile(filePath);
  }

  @Get('exam/javaScript/code')
  async getMainJS(
    @Res() res: Response,
  ) {
    const filePath = path.join(__dirname, '..', '..', 'exam', 'main.js');
    res.sendFile(filePath);
  }

  @Get('student/:sessionKey')
  async fetchExamInfomation(
    @Param('sessionKey') sessionKey: string,
  ){
    return this.sessionStoreService.examInfomation(sessionKey)
  }




}
