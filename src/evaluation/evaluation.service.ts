import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateSessionDto } from '../dto/session.dto';
import { SessionStoreService } from './session-store.service';
import { PassThrough } from 'stream';


@Injectable()
export class EvaluationService {
  constructor(
    private readonly sessionStore: SessionStoreService,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<{ sessionKey: string }> {
    const sessionKey = uuidv4();
    await this.sessionStore.saveSession(sessionKey, dto);
    return { sessionKey };
  }

  private streams = new Map<string, PassThrough>();

  createStream(sessionKey: string): PassThrough {
    const stream = new PassThrough();
    this.streams.set(sessionKey, stream);

    // 최초 연결시 바로 "connected" 메세지 보내기
    stream.write(`data: connected\n\n`);

    return stream;
  }

  sendToSession(sessionKey: string, payload: any) {
    const stream = this.streams.get(sessionKey);
    if (stream && !stream.destroyed) {
      stream.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  closeStream(sessionKey: string) {
    const stream = this.streams.get(sessionKey);
    if (stream) {
      stream.end();
      this.streams.delete(sessionKey);
    }
  }


}
