import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { TokenUsage } from 'src/db/entities/tokenUsage.entity';
import { encoding_for_model } from 'tiktoken';
import { Repository } from 'typeorm';

@Injectable()
export class LlmService {
        constructor(
            @InjectRepository(Question)
            private readonly questionRepository: Repository<Question>,

            @InjectRepository(TokenUsage)
            private readonly tokenUsageRepository: Repository<TokenUsage>,
    
            @InjectRepository(Session)
            private readonly sessionRepository: Repository<Session>,

            @InjectRepository(StudentAnswer)
            private readonly studentAnswerRepository: Repository<StudentAnswer>,

            private readonly configService: ConfigService
        ){}

        async checkTokens(input:string): Promise<number> {
             try {
                // GPT-4 또는 GPT-3.5 모델에 맞는 인코딩 가져오기
                const encoder = encoding_for_model("gpt-4");
    
                // 입력된 문자열을 토큰화하여 토큰 개수 계산
                const tokenCount = encoder.encode(input).length;
    
                // 메모리 누수를 방지하기 위해 인코더 해제
                encoder.free();
    
                return tokenCount;
            } catch (error) {
                throw new HttpException("입력 토큰 계산 실패", HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }

async makeQuestionPrompt(questionId:number, sessionId:string){
try{
    const question = await this.questionRepository.findOne({where:{id:questionId}})
    return `User Session: ${sessionId}

You are generating student assessment comments based on their test answers.  
First, read the problem statement and its correct answer carefully, but **do not** respond yet.  
Once you receive a student's entire answer, write an **evaluation report** of at least **120 characters** in Korean.  
Make sure your response is insightful and constructive.

Problem: ${question}`

} catch(error){
    throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR)    
}
    }


    async makeStudentPrompt(studentNumber:number, sessionId:string){
        try{
            const sessionData = await this.sessionRepository.findOne({where:{id:sessionId}})
            const studentAnswer = await this.studentAnswerRepository.findOne({where:{studentNumber:studentNumber, userId: sessionData.userId }})
            return `User Session: ${sessionId}
                    Student ${studentNumber} Answer: ${studentAnswer}`
        } catch(error){
            throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR)    
        }
            }
        async fetchToLlm(prompt:string, userId:number){
            let response:string
// 재작성 필요함
        return response
        }

        async calculateTokens(input, output, userId){
// 작성 필요함
            
        }
}