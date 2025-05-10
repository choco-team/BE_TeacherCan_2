import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CsrfInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // SSE 경로 우회
    if (request.path.startsWith('/music-request/sse')) {
      return next.handle();
    }
    
    // // GET 요청이나 안전한 메소드에 대해서만 새 CSRF 토큰 생성
    // if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    //   const csrfToken = uuidv4();
      
    //   // 쿠키에 토큰 설정 (HttpOnly 설정으로 JavaScript에서 접근 불가)
    //   response.cookie('X-CSRF-Token', csrfToken, {
    //     httpOnly: true,
    //     secure: process.env.LOCAL === 'false',
    //     sameSite: 'none',
    //   });
      
    //   // 응답 헤더에 토큰 설정 (클라이언트가 읽을 수 있게)
    //   response.header('X-CSRF-Token', csrfToken);
    // }
    
    return next.handle();
  }
}