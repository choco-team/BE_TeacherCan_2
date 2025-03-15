import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/entities/user.entity';
import { Session } from 'src/db/entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,        
  ) {}
  
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
