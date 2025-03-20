import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenUsage } from 'src/db/entities/tokenUsage.entity';
import { ConfigService } from '@nestjs/config';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { DataSource } from 'typeorm';
import { User } from 'src/db/entities/user.entity';
import { AuthenticationService } from 'src/auth/authentication.service';

@Injectable()
export class TokenService {
    constructor(
        @InjectRepository(TokenUsage)
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
        private readonly authenticationService: AuthenticationService

    ) {}

    //**텍스트로부터 토큰을 구합니다*//
    async checkTokens(input: string): Promise<number> {
        try {
            const model = this.configService.get<TiktokenModel>("LLM_MODEL");
            const encoder = encoding_for_model(model);    
            const tokenCount = encoder.encode(input).length;
            encoder.free();
            return tokenCount;
        } catch (error) {
            throw new HttpException("입력 토큰 계산 실패", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    //**총 토큰을 계산합니다 */
    async calculateTokens(promptTokens: number, completionTokens: number) {
            const totalTokens = promptTokens + (completionTokens * 3);
            return totalTokens
        }


/**토큰 사용량을 DB에 저장합니다 인수는 유저ID, 프롬프트 사용량, 응답 사용량, 총 사용량, LLM모델명 순으로 입력합니다 */
async saveTokenUsages(userId: number, promptTokens: number, completionTokens: number, totalTokens: number, model: TiktokenModel) {
    return this.dataSource.transaction(async entityManager => {
        // 락을 사용하여 사용자 데이터 조회 (동시 접근 방지)
        const user = await entityManager.findOne(User, {
            where: { id: userId },
            lock: { mode: 'pessimistic_write' }
        });

        // 토큰 차감 및 사용량 기록 원자적으로 처리
        user.remainingTokens -= totalTokens;
        
        const tokenUsage = entityManager.create(TokenUsage, {
            userId,
            promptTokens,
            completionTokens,
            totalTokens,
            model
        });
        
        await entityManager.save(user);
        await entityManager.save(tokenUsage);
        
        return user.remainingTokens;
    });
}
    /**사용자 ID로부터 남은 토큰의 수를 구합니다 */
    async fetchRemainingTokens(userId: number) {
            const userData = await this.authenticationService.findUserById(userId);
            if (!userData) {
                throw new HttpException("사용자 정보를 찾지 못하였습니다", HttpStatus.NOT_FOUND);
            }
            return userData.remainingTokens;
    }
}
