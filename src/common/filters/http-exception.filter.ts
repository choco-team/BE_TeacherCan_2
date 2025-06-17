// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (process.env.NODE_ENV == 'develop') {
      console.error('🔥 에러 발생:', exception);
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : '서버 내부 오류입니다.';

    const errorMessage =
      typeof message === 'string'
        ? message
        : (message as any)?.message || '알 수 없는 오류';

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
