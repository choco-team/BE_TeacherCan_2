import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 안전한 HTTP 메소드는 검증 생략
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    const csrfCookie = req.cookies['X-CSRF-Token'];
    const csrfHeader = req.headers['x-csrf-token'];
        
    // 토큰이 없거나 일치하지 않으면 오류
    // if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    //   throw new UnauthorizedException('CSRF 토큰이 유효하지 않습니다');
    // }
    
    next();
  }
}