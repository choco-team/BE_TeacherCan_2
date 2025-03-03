import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/db/entities/user.entity';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { TokenUsage } from 'src/db/entities/tokenUsage.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CryptoService } from 'src/services/crypto.service';  // 암호화 서비스 추가
import { encoding_for_model, TiktokenModel } from 'tiktoken';

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
        private readonly cryptoService: CryptoService,  // 암호화 서비스 추가
    ) {}

    // 토큰 계산
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

    // 세션에 맞는 문항 생성
    async makeQuestionPrompt(questionId: number, sessionId: string) {
        try {
            const sessionData = await this.sessionRepository.findOne({ where: { id: sessionId } });
            const question = await this.questionRepository.findOne({ where: { id: questionId }, relations: ["subjects"] });
            if (sessionData.userId !== question.subjects.userId) {
                throw new HttpException("문항 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
            }

            // 내용과 정답을 복호화
            const decryptedContent = this.cryptoService.decryptAES(question.encryptedContent, question.ivContentId);
            const decryptedCorrectAnswer = this.cryptoService.decryptAES(question.encryptedCorrectAnswer, question.ivCorrectAnswer);

            return `사용자 세션: ${sessionId}
                    아까 작성해달라고 한 교과 학습 발달 상황 문항이야.
                    학생 답변이 올때까지 읽기만 해
                    문항: ${decryptedContent}
                    ${decryptedCorrectAnswer ? "모범답안: " + decryptedCorrectAnswer : null}`;
        } catch (error) {
            throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 학생 평가 작성 프롬프트 생성
    async makeStudentPrompt(sessionId, userId, studentNumber, questionId, maxLength, isLastQuesiotn) {
        try {
            const question = await this.questionRepository.findOne({ where: { id: questionId } });
            const studentAnswer = await this.studentAnswerRepository.findOne({ where: { studentNumber: studentNumber, userId } });

            // 답안 복호화
            const decryptedAnswer = studentAnswer ? this.cryptoService.decryptAES(studentAnswer.encryptedAnswer, studentAnswer.ivAnswer) : '';

            return `사용자 세션: ${sessionId}
                    학생의 교과 학습 발달 상황을 작성해줘!
                    너가 할 일은 문제 파일과 학생의 답안을 보고 학생에 대해 평가글을 작성하는 것이야
                    예를 들어 수학 문제에서 3+5를 맞춘 학생이면 '받아올림이 없는 한자리수의 덧셈 계산을 정확히 수행함',
                    사회 문제에서 지방자치단체장에 관한 문제를 맞추면 '우리나라의 지방자치단체장의 역할을 정확히 말함.' 등을 적어서 학생에 대한 교과학습 발달상황을 작성하는 것이야
                    답안은 배열로 제공될 것이고 배열 순서대로 문항에 대한 답을 적었다고 생각하면 돼
                    ${isLastQuesiotn === "false" ? "지금은 내용만 정확히 기억만 하고 절대 아무것도 답장하지 말 것" :
                    `지금은 이 학생의 마지막 문항이므로 평가문을 응답할 것
                    제공된 문제와 답안을 읽고 기억한 후, 배열로 주어진 학생의 답안을 기반으로 교과 학습 발달 상황을 작성할 것
                    문항 내용과 학생의 작성 내용을 직접적으로 언급하지 않고, 학생의 학습 수준에 대한 평가와 가능성 위주로만 서술할 것
                    모든 문장은 "~함", "~임"으로 끝나도록 작성할 것
                    평가문과 관련 없는 내용은 일절 하지 말 것
                    평가는 ${maxLength}자 내외로 작성해줘`}
                    문항 : ${question.encryptedContent} 
                    정답 풀이 ${question.encryptedCorrectAnswer || "미입력했으므로 문제를 보고 알아서 정답을 염두에 둘 것"}
                    학생 번호 ${studentNumber} 답안: ${decryptedAnswer || null}`;
        } catch (error) {
            throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // LLM에 프롬프트 전송
    async fetchToLlm(prompt: string, userId: number, promptTokens: number): Promise<string> {
        try {
            const apiKey = this.configService.get<string>("OPENAI_API_KEY");
            const apiUrl = this.configService.get<string>("OPENAI_URL");
            const model = this.configService.get<string>("LLM_MODEL");

            const userData = await this.userRepository.findOne({ where: { id: userId } });

            if (!userData) {
                throw new HttpException("사용자 정보를 찾지 못하였습니다", HttpStatus.NOT_FOUND);
            }

            if (Number(userData.remainingTokens) - Number(promptTokens) < 0) {
                throw new HttpException("토큰이 부족합니다", HttpStatus.FORBIDDEN);
            }

            const response = await axios.post(
                apiUrl,
                {
                    model: model,  // GPT-4o Mini 사용
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: Math.min(Number(userData.remainingTokens) - Number(promptTokens), 3000),
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
        } catch (error) {
            throw new HttpException("Llm 통신 중 오류 발생", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 토큰 계산 및 저장
    async calculateTokens(promptTokens: number, completionTokens: number, userId: number) {
        try {
            const model = this.configService.get<string>("LLM_MODEL");
            const totalTokens = promptTokens + (completionTokens * 3);
            const userData = await this.userRepository.findOne({ where: { id: userId } });

            if (!userData) {
                throw new HttpException("사용자 정보를 찾지 못했습니다", HttpStatus.NOT_FOUND);
            }

            userData.remainingTokens -= totalTokens;

            // DB 저장
            const tokenUsage = this.tokenUsageRepository.create({
                userId,
                promptTokens,
                completionTokens,
                totalTokens,
                model: model
            });

            await this.userRepository.save(userData);
            await this.tokenUsageRepository.save(tokenUsage);
        } catch (error) {
            throw new HttpException("토큰 계산 중에 서버 오류가 발생하였습니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 남은 토큰 확인
    async fetchRemainingTokens(userId: number) {
        try {
            const userData = await this.userRepository.findOne({ where: { id: userId } });

            if (!userData) {
                throw new HttpException("사용자 정보를 찾지 못하였습니다", HttpStatus.NOT_FOUND);
            }

            return userData.remainingTokens;
        } catch (error) {
            throw new HttpException("서버 오류가 발생하였습니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
