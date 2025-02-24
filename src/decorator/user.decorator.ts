import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../db/entities/user.entity'; // ✅ User 엔티티 임포트

export const UserDecorator = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // ✅ 요청 객체에서 user 가져오기

    // 특정 필드만 가져오는 경우 (ex: @User('id'))
    return data ? user?.[data] : user;
  },
);
