import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { User } from '../db/entities/user.entity';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UserService) {
    super();
  }

  serializeUser(user: User, done: Function) {
    done(null, user.id); // 사용자 ID만 세션에 저장
  }

  async deserializeUser(userId: number, done: Function) {
    const user = await this.userService.findById(userId); // ID 기반 조회
    done(null, user);
  }
}
