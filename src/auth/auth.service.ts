import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/entities/user.entity';
import { AxiosResponse } from 'axios';
import { Session } from 'src/db/entities/session.entity';
import { CryptoService } from '../services/crypto.service';
import * as crypto from "crypto";

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
    private readonly cryptoService: CryptoService, // ✅ CryptoService 주입

    
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


  async validateKakaoUser(kakaoUser: any) {
    const { id: oauthId } = kakaoUser; // ✅ 카카오 사용자 고유 ID
    const hashedOauthId = crypto.createHash('sha256').update(oauthId.toString()).digest('hex');

    let user = await this.userRepository.findOne({ 
        where: { provider: "kakao", oauthIdHash: hashedOauthId } 
    });

    if (!user) {
        user = new User();
        user.oauthIdHash = hashedOauthId; // ✅ 직접 설정
        const oauthIdData = this.cryptoService.encryptAES(oauthId.toString()); // ✅ 직접 설정
        user.encryptedOauthId = oauthIdData.encryptedData
        user.ivOauthId = oauthIdData.iv
        user.provider = 'kakao';
        const studentInfo = this.cryptoService.encryptAES(JSON.stringify([]));
        user.encryptedStudentInfo = studentInfo.encryptedData
        user.ivStudentInfo = studentInfo.iv
        user.remainingTokens = 1000000 // 테스트가입 토큰 100만 기본 지급

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

    async logout(userId){
      const session = await this.sessionRepository.delete({userId})
      if (session.affected===0)
      {throw new HttpException("서버 오류가 발생하였습니다", HttpStatus.INTERNAL_SERVER_ERROR)}
      }
      
  }
