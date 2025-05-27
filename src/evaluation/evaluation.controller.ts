import { Controller, Post, Body, Param, Res, Get, Req, Header } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateSessionDto, studentAnswer } from '../dto/session.dto';
import { ApiTags } from '@nestjs/swagger';
import * as path from 'path';
import { Request, Response } from 'express';
import { SessionStoreService } from './session-store.service';
import { SessionStreamService } from './session-stream.service';
import { RedisPubSubService } from 'src/redis/redisPubSub.service';

@ApiTags('/evaluation')
@Controller('evaluation')
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly sessionStoreService: SessionStoreService,
    private readonly sessionStreamService: SessionStreamService,
    private readonly redisPubSubService: RedisPubSubService
  ) {}

  // ✅ 세션 생성 (public API)
  @Post('create')
  async createSession(@Body() dto: CreateSessionDto) {
    return this.evaluationService.createSession(dto);
  }

  // ✅ 시험 화면 전달 (protected or open 둘 다 가능)
  @Get('exam/:sessionKey')
  async connectExam(
    @Res() res: Response,
  ) {
    const filePath = path.join(process.cwd(), 'exam', 'main.html');
    res.sendFile(filePath);
  }

  @Get('exam/javaScript/code')
  async getMainJS(
    @Res() res: Response,
  ) {
    const filePath = path.join(process.cwd(), 'exam', 'main.js');
    res.sendFile(filePath);
  }

  // ✅ 시험 문제 정보 (인증 필요, 전역 CORS 정책 적용)
  @Get('student/:sessionKey')
  async fetchExamInfomation(
    @Param('sessionKey') sessionKey: string,
  ) {
    return this.sessionStoreService.examInfomation(sessionKey);
  }


@Get('sse/:sessionKey')
@Header('Content-Type', 'text/event-stream; charset=utf-8')
@Header('Cache-Control', 'no-cache')
@Header('Connection', 'keep-alive')
public stream(
  @Param('sessionKey') sessionKey: string,
  @Res() res: Response,
  @Req() req: Request
) {
  console.log('✅ SSE 연결 요청 들어옴:', sessionKey);

  // SSE 등록
  this.sessionStreamService.register(sessionKey, res);

  // 초기 응답 (최소 한 번은 write 해야 onmessage 작동)
  res.write(`data: ${JSON.stringify({ sessionKey, connected: true })}\n\n`);

  // 연결 종료 시 정리
  req.on('close', () => {
    console.warn(`❌ SSE 연결 끊김: ${sessionKey}`);
    this.sessionStreamService.unregister(sessionKey); // 등록 해제
  });
}


@Post('student/:sessionKey')
async submitExam(
  @Param('sessionKey') sessionKey: string,
  @Body() body: studentAnswer
) {
  console.log('세션키: ', sessionKey , '답안 :', body);
  const result = await this.evaluationService.examSubmit(sessionKey, body);
  console.log('데이터 :', result)

  // ✅ 직접 send 대신 Redis publish
  await this.redisPubSubService.publish(`stream:${sessionKey}`, result);

  return result;
}

  @Get('/:sessionKey/:student')
async fetchExamData(
  @Param(`sessionKey`) sessionKey: string,
  @Param(`student`) student: number
){
  return await this.sessionStoreService.fetchExamData(sessionKey, student);
}


}
