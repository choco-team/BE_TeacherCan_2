import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/entities/user.entity';
import { CryptoService } from '../services/crypto.service';
import * as crypto from "crypto";
import { DEFAULT_TOKEN } from 'src/config/constants';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cryptoService: CryptoService, // ✅ CryptoService 주입

    
  ) {}
  async validateUser(oauthInfo: any, provider: 'kakao' | 'local' | 'guest') {
    const { id: oauthId } = oauthInfo; // ✅ 카카오 사용자 고유 ID
    const hashedOauthId = crypto.createHash('sha256').update(oauthId.toString()).digest('hex');

    let user = await this.userRepository.findOne({ 
        where: { provider, oauthIdHash: hashedOauthId } 
    });

    if (!user) {user = await this.createNewUser(oauthId, hashedOauthId, provider)} // 기존 계정에 없을 경우 새 계정을 자동 생성합니다

    return user;
}

async createNewUser(oauthId, hashedOauthId, provider){
    try{
        const user = new User();
        user.oauthIdHash = hashedOauthId; // ✅ 직접 설정
        const oauthIdData = await this.cryptoService.encryptAES(oauthId.toString()); // ✅ 직접 설정
        user.encryptedOauthId = oauthIdData.encryptedData
        user.ivOauthId = oauthIdData.iv
        user.provider = provider;
        const studentInfo = await this.cryptoService.encryptAES(JSON.stringify([]));
        user.encryptedStudentInfo = studentInfo.encryptedData
        user.ivStudentInfo = studentInfo.iv
        user.remainingTokens = DEFAULT_TOKEN  
        return await this.userRepository.save(user)
    } catch (error){
        throw new HttpException("사용자 정보 생성에 실패했습니다" + error, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    }

    async findUserById(id){
        const userData = await this.userRepository.findOne({where:{id}})
        if (!userData) throw new HttpException("사용자 정보를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
            return userData
    }

    async modifyUserInfo(user:User){
        try{
        await this.userRepository.save(user);
    } catch (error){
        throw new HttpException("사용자 정보 변경에 실패했습니다" + error, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    }

}
