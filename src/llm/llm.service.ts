import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { TokenUsage } from 'src/db/entities/tokenUsage.entity';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { Repository } from 'typeorm';
import axios from "axios"
import { User } from 'src/db/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
        constructor(
            @InjectRepository(User)
            private readonly userRepository: Repository<User>,

            @InjectRepository(Question)
            private readonly questionRepository: Repository<Question>,

            @InjectRepository(TokenUsage)
            private readonly tokenUsageRepository: Repository<TokenUsage>,
    
            @InjectRepository(Session)
            private readonly sessionRepository: Repository<Session>,

            @InjectRepository(StudentAnswer)
            private readonly studentAnswerRepository: Repository<StudentAnswer>,
            
            private readonly configService: ConfigService,
        ){ }

        async checkTokens(input:string): Promise<number> {
             try {
                const model = this.configService.get<TiktokenModel>("LLM_MODEL")

                const encoder = encoding_for_model(model);    
                // 입력된 문자열을 토큰화하여 토큰 개수 계산
                const tokenCount = encoder.encode(input).length;
    
                // 메모리 누수를 방지하기 위해 인코더 해제
                encoder.free();
    
                return tokenCount;
            } catch (error) {
                throw new HttpException("입력 토큰 계산 실패", HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }

        async makeBeforePrompt(sessionId:string, maxLength:number){
            const prompt = `
            사용자 세션: ${sessionId}

            학생의 교과 학습 발달 상황을 작성해줘!
            너가 할 일은 문제 파일과 학생의 답안을 보고 학생에 대해 평가글을 작성하는 것이야
            예를 들어 수학 문제에서 3+5를 맞춘 학생이면 '받아올림이 없는 한자리수의 덧셈 계산을 정확히 수행함',
            사회 문제에서 지방자치단체장에 관한 문제를 맞추면 '우리나라의 지방자치단체장의 역할을 정확히 말함.' 등을 적어서 학생에 대한 교과학습 발달상황을 작성하는 것이야
            답안은 json 형식의 배열로 제공될 것이고 배열 순서대로 문항에 대한 답이라고 생각하면 돼
 
            다음 지침을 반드시 따를 것:
            1. 학생의 답안이 오기 전까지 절대 아무것도 답장하지 말 것
            2. 제공된 문제와 답안을 읽고 기억한 후, 배열로 주어진 학생의 답안을 기반으로 교과 학습 발달 상황을 작성할 것
            3. 모든 문장은 "~함", "~임"으로 끝나도록 작성할 것
            4. 답변 길이는 최소 ${maxLength}자 분량 작성할 것
            5. 평가문과 관련 없는 내용은 일절 하지 말 것
                `;
            return prompt
        }


async makeQuestionPrompt(questionId:number, sessionId:string){
    try{
        const sessionData = await this.sessionRepository.findOne({where:{id:sessionId} })
        const question = await this.questionRepository.findOne({where:{id:questionId}, relations:["subjects"] })
        if (sessionData.userId!==question.subjects.userId) {
            throw new HttpException("문항 접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        return `사용자 세션: ${sessionId}
                아까 작성해달라고 한 교과 학습 발달 상황 문항이야.
                학생 답변이 올때까지 읽기만 해
                문항: ${question.content}
                ${question.correct_answer ? "모범답안: " + question.correct_answer : null}`
    } catch(error){
        throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR)    
    }
}


    async makeStudentPrompt(studentNumber:number, sessionId:string){
        try{
            const sessionData = await this.sessionRepository.findOne({where:{id:sessionId}})
            const studentAnswer = await this.studentAnswerRepository.findOne({where:{studentNumber:studentNumber, userId: sessionData.userId }})
            return `사용자 세션: ${sessionId}
                    아까 준 문항과 이 학생의 답안을 참고해서 교과 학습 발달 상황을 작성해줘
                    반드시 학생이 알고 있는 학습주제에 대한 학생의 학습 상태 평가문만 작성하고 문장 종결어미는 반드시 ~함, ~임으로 끝내줘
                    알려준 답변의 길이를 최대한 가깝게 20% 내외로 꼭 지켜줘

                    학생 ${studentNumber} 답안: ${JSON.stringify(studentAnswer.answer) || null}`
        } catch(error){
            throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR)    
        }
            }


            async fetchToLlm(prompt: string, userId:number, promptTokens:number): Promise<string> {
                const apiKey = this.configService.get<string>("OPENAI_API_KEY")
                const apiUrl = this.configService.get<string>("OPENAI_URL")
                const model = this.configService.get<TiktokenModel>("LLM_MODEL")
                const userData = await this.userRepository.findOne({where:{id:userId}});
                if (!userData){
                    throw new HttpException("사용자 정보를 찾지 못하였습니다", HttpStatus.NOT_FOUND)
                }
                if ( Number(userData.remainingTokens) - Number(promptTokens) < 0){
                    throw new HttpException("토큰이 부족합니다", HttpStatus.FORBIDDEN)
                }

                  const response = await axios.post(
                    apiUrl,
                    {
                      model: model, // GPT-4o Mini 사용
                      messages: [{ role: 'user', content: prompt }],
                      max_tokens: Math.min(Number(userData.remainingTokens) - Number(promptTokens), 3000) ,
                      temperature: 0.7,
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                      },
                    },
                  );
            
                  return response.data.choices[0]?.message?.content ?? '';
                } 


        async calculateTokens(promptTokens: number, completionTokens: number, userId: number) {
        try{
            const model = this.configService.get<TiktokenModel>("LLM_MODEL")
            const totalTokens = promptTokens + (completionTokens * 3);
            const userData = await this.userRepository.findOne({where:{id:userId}});
            userData.remainingTokens -= totalTokens


            // DB 저장
            const tokenUsage = this.tokenUsageRepository.create({
              userId,
              promptTokens,
              completionTokens,
              totalTokens,
              model:model
            });
            await this.userRepository.save(userData)
            await this.tokenUsageRepository.save(tokenUsage);
        }
        catch (error){
            throw new HttpException("토큰 계산 중에 서버 오류가 발생하였습니다",HttpStatus.INTERNAL_SERVER_ERROR)
        }
          }

          async fetchRemainingTokens(userId:number){
            try{
                const userData = await this.userRepository.findOne({where:{id:userId}})
                return userData.remainingTokens
            }
            catch (error){
                throw new HttpException("서버 오류가 발생하였습니다", HttpStatus.INTERNAL_SERVER_ERROR)
            }
          }
        }