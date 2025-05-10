import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    
    // // SSE 경로는 우회
    // if (req.originalUrl.includes('/music-request/asd')) {
    //   console.log('[CsrfMiddleware] SSE 경로 우회됨:', req.originalUrl);
    //   return next();
    // }

    // 안전한 HTTP 메소드는 검증 생략
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    const csrfCookie = req.cookies['X-CSRF-Token'];
    const csrfHeader = req.headers['X-CSRF-Token'];
        
    next();
  }
}
