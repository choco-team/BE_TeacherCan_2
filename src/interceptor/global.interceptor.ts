import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { CsrfInterceptor } from "./csrf.interceptor";
import { Observable } from "rxjs";
import { TransformInterceptor } from "./transform.interceptor";

@Injectable()
export class GlobalInterceptor implements NestInterceptor {
  constructor(
    private readonly csrf: CsrfInterceptor,
    private readonly transform: TransformInterceptor<any>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // CSRF 처리 먼저
    return this.csrf.intercept(context, {
      handle: () => this.transform.intercept(context, next),
    });
  }
}
