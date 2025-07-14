import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisService } from './redis.service';

interface StreamInitPayload {
  type: string;
  data: any;
}

@Injectable()
export class RedisStreamService implements OnModuleDestroy{
  private isDestroyed = false;
  constructor(private readonly redisService: RedisService) {}

  onModuleDestroy() {
    this.isDestroyed = true;
    console.log('[RedisStreamService] onModuleDestroy: 서비스 종료 중...');
  }

  async readStreamSinceLastId(
    streamKey: string,
    group: string,
    consumer: string,
    timeout: number,
  ) {
    const client = this.redisService.getClient();

    // stream 그룹생성 시도, 이미 있으면 넘어감
    try {
      await client.xgroup('CREATE', streamKey, group, '0', 'MKSTREAM');
    } catch (err) {
      if (!String(err.message).includes('BUSYGROUP')) {
        console.error('[RedisStream] 그룹 생성 오류:', err);
        throw err
      }
    }

    const results = [];

    while (!this.isDestroyed) {
      try {
        console.log("!!!!!! 읽기 시도")
        // xreadgroup시도, 새로운 데이터가 없으면 timeout동안 대기
        const response = await client.xreadgroup(
          'GROUP', group, consumer,
          'COUNT', 1,
          'BLOCK', timeout,
          'STREAMS', streamKey, '>'
        ) as [string, [string, string[]][]][] | null;

        // 데이터가 없으면 xreadgroup 재시도
        if (!response) continue;

        // 데이터가 있으면 반환 후 반복 종료
        for (const [, messages] of response) {
          for (const [id, fields] of messages) {
            const data: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
              data[fields[i]] = fields[i + 1];
            }
            results.push({ id, ...data });
            await client.xack(streamKey, group, id);
            await client.xdel(streamKey, id)
          }
        }

        break

      } catch (err) {
        console.error('[Stream] Polling error:', err);
        await new Promise((r) => setTimeout(r, 500)); // 에러 발생 시 while문 재시도
      }
    }

    return results;
  }

  createStreamObservable(
    streamKey: string,
    group: string,
    getInitialPayload: () => Promise<StreamInitPayload>
  ): Observable<any> {
    const client = this.redisService.getClient();
    const consumer = `consumer-${Math.random().toString(36).substring(2)}`;

    return new Observable((observer) => {
      let isRunning = true;
      let pingInterval: NodeJS.Timeout | undefined = undefined;

      const initGroup = async () => {
        try {
          await client.xgroup('CREATE', streamKey, group, '$', 'MKSTREAM');
        } catch (err) {
          if (!String(err.message).includes('BUSYGROUP')) {
            console.error('[Stream] Group create error:', err);
          }
        }
      };

      const sendInitialData = async () => {
        try {
          const payload = await getInitialPayload();
          observer.next(payload);
        } catch (err) {
          console.warn('[Stream] Failed to send initial payload:', err);
        }
      };

      const poll = async () => {
        while (isRunning && !this.isDestroyed) {
          try {
            const response = await client.xreadgroup(
              'GROUP', group, consumer,
              'COUNT', 1,
              'BLOCK', 1000,
              'STREAMS', streamKey, '>'
            ) as [string, [string, string[]][]][] | null;

            if (!response) continue;

            for (const [, messages] of response) {
              for (const [id, fields] of messages) {
                const dataMap: Record<string, string> = {};
                for (let i = 0; i < fields.length; i += 2) {
                  dataMap[fields[i]] = fields[i + 1];
                }

                if (!dataMap['data']) continue;

                try {
                  const parsed = JSON.parse(dataMap['data']);
                  observer.next({
                    type: parsed.data.type || 'new-list',
                    data: parsed.data.data,
                  });
                  await client.xack(streamKey, group, id);
                } catch (err) {
                  console.error('[Stream] JSON parse error:', err);
                }
              }
            }
          } catch (err) {
            console.error('[Stream] Polling error:', err);
            await new Promise((r) => setTimeout(r, 500)); // 재시도
          }
        }
      };

      const startPing = () => {
        observer.next({ type: 'ping', data: 'ping' });
        pingInterval = setInterval(() => {
          if (!isRunning || this.isDestroyed) {
            clearInterval(pingInterval);
            return;
          }
          observer.next({ type: 'ping', data: 'ping' });
        }, 60000);
      };

      initGroup()
          .then(() => sendInitialData())
          .then(() => {
              startPing();
              (async () => {
                  await poll();
              })();
          });

      return () => {
        isRunning = false;
        clearInterval(pingInterval);
        console.log(`[SSE] Stream for ${streamKey} closed.`);
      };
    });
  }
}