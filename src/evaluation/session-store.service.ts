import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionStoreService {
  constructor(private readonly redisService: RedisService) {}

  async saveSession(sessionKey: string, data: any): Promise<void> {
    await this.redisService.getClient().set(`session:${sessionKey}`, JSON.stringify(data));
  }

  async getSession(sessionKey: string): Promise<any> {
    const raw = await this.redisService.getClient().get(`session:${sessionKey}`);
    return raw ? JSON.parse(raw) : null;
  }

  async deleteSession(sessionKey: string): Promise<void> {
    await this.redisService.getClient().del(`session:${sessionKey}`);
  }

  async examInfomation(sessionKey: string) {
   return await this.redisService.getClient().get(`session:${sessionKey}`);
  }

  async saveStudentSession(sessionKey: string, studentId: string, data: any): Promise<void> {
    const key = `session:${sessionKey}:${studentId}`;
    await this.redisService.getClient().set(key, JSON.stringify(data), 'EX', 7200); // TTL 2시간
  }
  

  async getStudentAnswerSheet(sessionKey: string,  studentId: string){
    try{
    const key = `session:${sessionKey}:${studentId}`;
    const data = await this.redisService.getClient().get(key);
  } catch (error){

    throw new HttpException(
  { message: '클라이언트로 답안 송신에 실패하였습니다', detail: error?.message ?? error.toString() },
  HttpStatus.INTERNAL_SERVER_ERROR,
);
  
  }
}

  async fetchExamData(sessionKey:string, studentNumber: number){
    const result = await this.redisService.getClient().get(`session:${sessionKey}:${studentNumber}`);
    if (!result) throw new HttpException('답안지 자료 송신에 실패했습니다', HttpStatus.NOT_FOUND)
    return result
  }


}
