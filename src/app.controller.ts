import { Controller, Get, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface MessageEvent {
  data: string | object;
  type?: string;
  id?: string;
}

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      status: 'OK',
      message: 'Music Server is running!',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      service: 'Music Server',
      timestamp: new Date().toISOString(),
    };
  }

  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      // 연결 시 즉시 메시지 전송
      subscriber.next({
        data: {
          type: 'connection',
          message: 'SSE 연결이 설정되었습니다.',
          timestamp: new Date().toISOString(),
        },
        type: 'connection',
        id: '1',
      });

      // 주기적으로 상태 업데이트 전송 (예시)
      const interval = setInterval(() => {
        subscriber.next({
          data: {
            type: 'status',
            message: '서버 상태 업데이트',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
          },
          type: 'status',
          id: Date.now().toString(),
        });
      }, 30000); // 30초마다

      // 연결 해제 시 정리
      return () => {
        clearInterval(interval);
        console.log('SSE 연결이 종료되었습니다.');
      };
    }).pipe(
      map((event) => ({
        ...event,
        data:
          typeof event.data === 'string'
            ? event.data
            : JSON.stringify(event.data),
      })),
    );
  }
}
