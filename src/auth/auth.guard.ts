import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthRequest } from './auth.types';
import { UserRole } from 'src/dto/user.dto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const sessionId = request.cookies?.sessionId;
    console.log(request.cookies)

    if (!sessionId) {
      console.log("❌ 세션 ID 없음");
      // ⬇️ request.user에 기본값 설정
      request.user = { id: null, role: UserRole.GUEST, sessions: []};
      return true;
    }

    const user = await this.authService.getUserBySession(sessionId);
    if (!user) {
      console.log("❌ 유효하지 않은 세션");

      // ⬇️ 유효하지 않은 경우에도 기본값 설정
      request.user = { id: null, role: UserRole.GUEST, sessions: []};
      return true;
    }

    console.log("✅ 사용자 인증 성공:", user);
    request.user = {id: user.id, role: user.role, sessions: user.sessions}
    return true;
  }
}
