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

  register(sessionKey: string, res: Response): void {
    this.sessionStreams.set(sessionKey, res);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
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

private handleStreamMessage(channel: string, message: any) {
  const sessionKey = channel.split(':')[1];
  console.log(`[Redis] 수신된 메시지 → ${sessionKey}`, message); // 이 로그 꼭 있어야 함
  this.send(sessionKey, message);
}
}
