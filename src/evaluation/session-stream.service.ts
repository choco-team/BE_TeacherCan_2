import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { RedisPubSubService } from 'src/redis/redisPubSub.service';
import { SessionStoreService } from './session-store.service';

@Injectable()
export class SessionStreamService {
  private sessionStreams = new Map<string, Response>();

  constructor(
    private readonly redisPubSubService: RedisPubSubService,
    private readonly sessionStoreService: SessionStoreService
  ) {
    // 🔥 Redis 구독: 자동 답안 조회 후 push
    this.redisPubSubService.subscribe('stream:get-answer', this.handleGetAnswerRequest.bind(this));

    // 🔥 일반 스트림 메시지도 계속 처리
    this.redisPubSubService.subscribePattern('stream:*', this.handleStreamMessage.bind(this));
  }

register(sessionKey: string, res: Response) {
  if (this.sessionStreams.has(sessionKey)) {
    console.log(`[SSE] 기존 세션 ${sessionKey} 연결 덮어쓰기`);
  }
  this.sessionStreams.set(sessionKey, res);
}

unregister(sessionKey: string) {
  this.sessionStreams.delete(sessionKey);
}



  send(sessionKey: string, data: any): void {
    const res = this.sessionStreams.get(sessionKey);
    if (res && !res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  private async handleGetAnswerRequest(message: any) {
    const { sessionKey, studentId } = message;
    console.log(`[Redis] 자동 답안 조회 요청:`, message);

    const result = await this.sessionStoreService.getStudentAnswerSheet(sessionKey, studentId);

    this.send(sessionKey, {
      type: 'student-answer-sent',
      studentId,
      data: result
    });
  }

private async handleStreamMessage(channel: string, message: string) {
  console.log('✅ handleStreamMessage 호출됨');
  console.log('채널:', channel);
  console.log('메시지:', message);

  const sessionKey = channel.split(':')[1].trim();
  const res = this.sessionStreams.get(sessionKey);

  if (!res) {
    console.warn('[SSE] 해당 sessionKey에 연결된 res 없음:', sessionKey);
    return;
  }

  let parsed;
  try {
    parsed = typeof message === 'string' ? JSON.parse(message) : message;
  } catch {
    console.warn('[SSE] 메시지 JSON 파싱 실패:', message);
    parsed = { raw: message };
  }

  res.write(`data: ${JSON.stringify(parsed)}\n\n`);
}
}
