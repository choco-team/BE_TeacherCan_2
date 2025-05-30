import { Request } from 'express';
import { User } from '../db/entities/user.entity';
import { userInterface, UserRole } from 'src/dto/user.dto';

export interface AuthRequest extends Request {
  sessionId: string
  user?: userInterface; // 세션이 없을 수도 있으므로 `?` 추가
  role?: UserRole;
  login: (user: User, callback: (err?: Error) => void) => void; // ✅ login 메서드 추가
  logout: (callback: (err: any) => void) => void; // logout 메서드 추가
}
