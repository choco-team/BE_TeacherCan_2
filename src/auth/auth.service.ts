import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/entities/user.entity';
import { AxiosResponse } from 'axios';
import { Session } from 'src/db/entities/session.entity';

@Injectable()
export class AuthService {
  private KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
  private KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    private readonly httpService: HttpService, // ✅ HTTP 요청을 위한 HttpService
  ) {}

  // 1️⃣ 카카오 API에서 액세스 토큰 가져오기
  async getKakaoAccessToken(code: string): Promise<string> {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.KAKAO_CLIENT_ID); // ✅ REST API 키
    params.append('client_secret', process.env.KAKAO_CLIENT_SECRET); // (선택)
    params.append('redirect_uri', process.env.KAKAO_CALLBACK_URL); // ✅ 콜백 URL
    params.append('code', code);

    try {
      const response: AxiosResponse = await this.httpService.axiosRef.post(this.KAKAO_TOKEN_URL, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return response.data.access_token; // ✅ 액세스 토큰 반환
    } catch (error) {
      console.error('카카오 토큰 요청 실패:', error.response?.data);
      throw new Error('카카오 액세스 토큰 요청 실패');
    }
  }

  // 2️⃣ 액세스 토큰을 사용해 사용자 정보 요청
  async getKakaoUser(accessToken: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.httpService.axiosRef.get(this.KAKAO_USER_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data; // ✅ 사용자 정보 반환
    } catch (error) {
      console.error('카카오 사용자 정보 요청 실패:', error.response?.data);
      throw new Error('카카오 사용자 정보 요청 실패');
    }
  }

  // 3️⃣ 사용자 정보를 DB에서 확인하고 저장
  async validateKakaoUser(kakaoUser: any) {
    const { id: oauthId } = kakaoUser; // ✅ 카카오 사용자 고유 ID

    let user = await this.userRepository.findOne({ where: { oauthId, provider: "kakao" } });

    if (!user) {
      user = this.userRepository.create({ oauthId, provider: 'kakao' });
      await this.userRepository.save(user);
    }

    return user;
  }
  // ✅ 세션을 생성하고 id를 반환
  async setSession(user: User): Promise<string> {
    await this.sessionRepository.delete({user})
    const session = this.sessionRepository.create({ user });
    const savedSession = await this.sessionRepository.save(session);
    return savedSession.id; // ✅ 생성된 세션 ID 반환
  }


    // ✅ 세션 ID를 기반으로 사용자 조회
    async getUserBySession(sessionId: string): Promise<User | null> {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['user'], // ✅ 유저 정보 함께 조회
      });
  
      if (!session || !session.user) {
        return null; // ❌ 세션이 없거나 유저 정보가 없으면 인증 실패
      }
  
      return session.user; // ✅ 유저 정보 반환
    }
  }
