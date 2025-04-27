import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SessionStreamService {
  private sessionStreams: Map<string, Response> = new Map();

  send(sessionKey: string, data: any): void {
    const res = this.sessionStreams.get(sessionKey);
    if (res && !res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  close(sessionKey: string): void {
    const res = this.sessionStreams.get(sessionKey);
    if (res && !res.writableEnded) {
      res.end();
    }
    this.sessionStreams.delete(sessionKey);
  }
}
