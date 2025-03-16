import { Injectable } from "@nestjs/common";
import { OauthService } from "./oauth.service";
import { AuthenticationService } from "./authentication.service";


@Injectable()
export class AuthService {
  constructor(
    private readonly oauthService: OauthService,
    private readonly authenticationService: AuthenticationService,
  ) {}

  async kakaoLogin(code: string) {
    // ✅ OAuth 인증 절차를 한 곳에서 처리
    const accessToken = await this.oauthService.getKakaoAccessToken(code);
    const kakaoUser = await this.oauthService.getKakaoUser(accessToken);

    // ✅ 사용자 검증 및 생성 로직을 서비스에서 처리
    return this.authenticationService.validateUser(kakaoUser, "kakao");
  }
}
