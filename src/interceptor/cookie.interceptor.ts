import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { map } from 'rxjs';
import { AuthRequest } from 'src/auth/auth.types';

@Injectable()
export class CookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuthRequest>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (request.sessionId) {
          response.cookie('sessionId', request.sessionId, {
            httpOnly: true,
            secure: !process.env.LOCAL,
            sameSite: 'none',
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7일 유지
          });
        }
        return data;
      }),
    );
  }
}
