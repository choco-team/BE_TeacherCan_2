import { Controller, Delete, Get, HttpException, HttpStatus, Query, Req, Res, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRequest } from './auth.types';
import { CookieInterceptor } from 'src/interceptor/cookie.interceptor';
import { UserDecorator } from 'src/decorator/user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserIdResponseDto } from 'src/dto/response.dto';

@ApiTags('/api/login')
@Controller("/api/login")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/kakao')
  @ApiOperation({summary: '카카오 로그인', description: '카카오 계정으로 사용자 인증을 진행하여 로그인합니다.'})
  @ApiResponse( {description: "계정 번호를 반환합니다", type:UserIdResponseDto } )
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
  @ApiOperation({summary: '로그인 확인요청', description: 'httpOnly 쿠키를 전송하여 로그인 여부를 확인하고 로그인시 계정 정보를 가져옵니다'})
  @ApiResponse( {description: "계정 번호를 반환합니다", type:UserIdResponseDto } )
  @UseInterceptors(CookieInterceptor)
  async checkSession(@UserDecorator("id") userId : number){
    return {userId}
  }

  @Delete()
  @ApiOperation({summary: '로그아웃', description: 'httpOnly 쿠키를 삭제하여 로그아웃합니다'})
  async logout(@UserDecorator("id") userId:number) {
  return await this.authService.logout(userId);
}
}