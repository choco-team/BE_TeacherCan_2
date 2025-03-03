import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/entities/user.entity';
import { CryptoService } from '../services/crypto.service';  // 암호화 서비스 추가
import * as crypto from 'crypto';  // 해시 작업을 위한 crypto 추가

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly cryptoService: CryptoService, // 암호화 서비스 추가
  ) {}

  /** 🔹 카카오 ID로 사용자 찾기 또는 생성 */
  async findOrCreate(kakaoId: string): Promise<User> {
    const hashedOauthId = crypto.createHash('sha256').update(kakaoId).digest('hex'); // SHA-256 해싱

    // 먼저 해시값을 이용해서 사용자 찾기
    let user = await this.userRepository.findOne({ where: { oauthIdHash: hashedOauthId } });

    if (!user) {

      const oauthId = this.cryptoService.encryptAES(kakaoId)
      // 사용자 없으면 생성
      user = this.userRepository.create({ 
        oauthIdHash: hashedOauthId,  // 해시된 ID 저장
        encryptedOauthId: oauthId.encryptedData,  // 암호화된 OAuth ID 저장
        ivOauthId: oauthId.iv,
        provider: "kakao" 
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  /** 🔹 사용자 ID로 사용자 찾기 */
  async findById(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { id } });
  }
}
