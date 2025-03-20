import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';

@Injectable()
export class OauthService {
  private KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
  private KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me';

  constructor(
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
  }
