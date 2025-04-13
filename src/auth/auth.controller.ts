import { Controller, Delete, Get, HttpException, HttpStatus, Query, Req, Res, UseInterceptors } from '@nestjs/common';
import { AuthRequest } from './auth.types';
import { UserDecorator } from 'src/decorator/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { UserIdResponseDto } from 'src/dto/response.dto';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';

@ApiTags('/login')
@Controller("/login")
export class AuthController {
  constructor(
  private readonly sessionService: SessionService,
  private readonly authService: AuthService,
  ){}

  @Get('/kakao')
  @ApiOperation({summary: '카카오 로그인', description: '카카오 계정으로 사용자 인증을 진행하여 로그인합니다.'})
  @ApiResponse( {description: "계정 번호를 반환합니다", type:UserIdResponseDto } )
  @UseInterceptors(CookieInterceptor)
  async kakaoLoginCallback(@Query('code') code: string,@Req() req:AuthRequest) {
    const user = await this.authService.kakaoLogin(code);

      if (!user) {
          throw new HttpException('로그인 실패', HttpStatus.UNAUTHORIZED);
      }

      req.user = user
      const sessionId = await this.sessionService.setSession(user);
      Object.assign(req, { sessionId });

      return { userId: user.id }; // ✅ JSON 응답 반환
  }

  @Get()
  @ApiCookieAuth()
  @ApiOperation({summary: '로그인 확인요청', description: 'httpOnly 쿠키를 전송하여 로그인 여부를 확인하고 로그인시 계정 정보를 가져옵니다(세션id 쿠키 필수)'})
  @ApiResponse( {description: "계정 번호를 반환합니다", type:UserIdResponseDto } )
  @UseInterceptors(CookieInterceptor)
  async checkSession(@UserDecorator("id") userId : number){
    return {userId}
  }

  @Delete()
  @ApiCookieAuth()
  @ApiOperation({summary: '로그아웃', description: 'httpOnly 쿠키를 삭제하여 로그아웃합니다'})
  async logout(@UserDecorator("id") userId:number) {
  return await this.sessionService.logout(userId);
}
}
