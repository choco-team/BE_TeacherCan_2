import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((raw) => {
        // 이미 완전히 포맷된 구조면 그대로 반환
        if (raw && typeof raw === 'object' && raw.success !== undefined) {
          return raw;
        }

        const defaultStatus = res.statusCode ?? 200;

        // 감싸진 구조 판단: message와 data 또는 statusCode가 있으면
        const hasWrappedShape =
          raw &&
          typeof raw === 'object' &&
          ('data' in raw && 'message' in raw);

        if (hasWrappedShape) {
          return {
            success: true,
            statusCode: raw.statusCode ?? defaultStatus,
            data: raw.data,
            message: raw.message,
            timestamp: new Date().toISOString(),
          };
        }

        // 기본 구조
        return {
          success: true,
          statusCode: defaultStatus,
          data: raw,
          message: '요청이 성공적으로 처리되었습니다.',
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
