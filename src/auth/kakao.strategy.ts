import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private authenticationService: AuthenticationService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      callbackURL: process.env.KAKAO_CALLBACK_URL,
    });
  }

  async validate(profile: any, done: Function) {
    const kakaoId = profile.id.toString();
    const user = await this.authenticationService.validateUser(kakaoId, "kakao");
    done(null, user);
  }
}
