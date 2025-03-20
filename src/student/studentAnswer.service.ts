
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { studentAnswerInterface } from './student.controller';
import { CryptoService } from 'src/services/crypto.service'; // 암호화 서비스 추가
import { QuestionAccessService } from 'src/question/questionAccess.service';
import { decodedQuestionToken } from 'src/dto/question.dto';
import { QuestionManagementService } from 'src/question/questionManagement.service';
import { Repository } from 'typeorm'

@Injectable()
export class StudentAnswerService {
    constructor(
        @InjectRepository(StudentAnswer)
        private readonly studentAnswerRepository: Repository<StudentAnswer>,
        private readonly cryptoService: CryptoService,    
        private readonly questionAccessService: QuestionAccessService,
        private readonly questionManagementService: QuestionManagementService
    ) {}


/** 🔹 학생 답안 제출 */
    async submitStudentAnswer(body: studentAnswerInterface) {
            const verifyToken:decodedQuestionToken = await this.questionAccessService.verifyToken(body.token)
            const question = await this.questionManagementService.findQuestionById(verifyToken.question)
            const answer = await this.cryptoService.encryptAES(JSON.stringify(body.answer))

            // 학생 답안 저장
            await this.studentAnswerRepository.upsert(
                {
                    studentNumber: body.student,
                    userId: verifyToken.user,
                    questionId: question.id,
                    encryptedAnswer: answer.encryptedData,  // 암호화된 답안 저장
                    ivAnswer: answer.iv
                },
                ["studentNumber", "userId", "questionId"] // 🔥 기존 데이터와 비교할 키
            );
    }

/** 학생의 답안 목록 보기 */
    async getStudentAnswerList(studentNumber:number, userId:number){
        const answerList = await this.studentAnswerRepository.find({where:{studentNumber, userId}, relations:["question"]})
        const responseData = await Promise.all(answerList.map(async answer => ({
            id: answer.id,
            correctAnswer: JSON.parse(
                await this.cryptoService.decryptAES(
                    answer.question.encryptedCorrectAnswer, 
                    answer.question.ivCorrectAnswer
                )
            ),
            answerSheet: JSON.parse(
                await this.cryptoService.decryptAES(
                    answer.question.encryptedAnswerSheets,
                    answer.question.ivAnswerSheets
                )
            ),
            title: answer.question.title,
            studentAnswer: JSON.parse(
                await this.cryptoService.decryptAES(
                    answer.encryptedAnswer, 
                    answer.ivAnswer
                )
            )
        })));
       
        return responseData
        }
    }