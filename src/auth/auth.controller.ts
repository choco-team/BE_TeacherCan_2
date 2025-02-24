import { Controller, Delete, Get, HttpException, HttpStatus, Query, Req, Res, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRequest } from './auth.types';
import { CookieInterceptor } from 'src/interceptor/cookie.interceptor';
import { UserDecorator } from 'src/decorator/user.decorator';

@Controller("/api/login")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/kakao')
  @UseInterceptors(CookieInterceptor)
  async kakaoLoginCallback(@Query('code') code: string,@Req() req:AuthRequest) {
      const accessToken = await this.authService.getKakaoAccessToken(code);
      const kakaoUser = await this.authService.getKakaoUser(accessToken);
      const user = await this.authService.validateKakaoUser(kakaoUser);

      if (!user) {
          throw new HttpException('로그인 실패', HttpStatus.UNAUTHORIZED);
      }

      req.user = user

      // ✅ 세션 생성
      const sessionId = await this.authService.setSession(user);


    // ✅ Express 요청 객체에 속성 추가 시 Object.assign() 사용
    Object.assign(req, { sessionId });

      return { userId: user.id }; // ✅ JSON 응답 반환
  }

  @Get()
  @UseInterceptors(CookieInterceptor)
  async checkSession(@UserDecorator("id") userId : number){
    return {userId}
  }

  @Delete()
  async logout(@UserDecorator("id") userId:number) {
  return await this.authService.logout(userId);
}
}