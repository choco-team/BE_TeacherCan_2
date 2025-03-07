import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/db/entities/user.entity';
import { Session } from 'src/db/entities/session.entity';
import { Question } from 'src/db/entities/question.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { studentAnswerInterface } from './student.controller';
import { CryptoService } from 'src/services/crypto.service'; // 암호화 서비스 추가
import { ConfigService } from '@nestjs/config';
import * as jwt from "jsonwebtoken"
import { studentInterface } from 'src/dto/user.dto';

@Injectable()
export class StudentService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,

        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,

        @InjectRepository(StudentAnswer)
        private readonly studentAnswerRepository: Repository<StudentAnswer>,

        private readonly cryptoService: CryptoService,  // 암호화 서비스 추가
        private readonly configService: ConfigService
        
    ) {}

    /** 🔹 학생 정보 가져오기 (복호화) */
    async getStudentInfo(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user || !user.encryptedStudentInfo) {
            throw new HttpException("등록된 학생정보 없음", HttpStatus.NO_CONTENT);
        }

        // 학생 정보를 복호화
        const decryptedStudentInfo:studentInterface = JSON.parse(this.cryptoService.decryptAES(user.encryptedStudentInfo, user.ivStudentInfo));

        return decryptedStudentInfo;
    }

    /** 🔹 학생 정보 저장 (암호화) */
    async checkAndSaveStudentInfo(data: any[], userId: number) {
        const numbers = new Set();
        const hasDuplicate = data.some(student => numbers.has(student.number) || !numbers.add(student.number));
        
        if (hasDuplicate) {
            throw new HttpException("학생 번호는 중복이 있어서는 안됩니다", HttpStatus.BAD_REQUEST);
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });

        // 학생 정보를 암호화하여 저장
        const encryptedStudentInfo = this.cryptoService.encryptAES(JSON.stringify(data));
        user.encryptedStudentInfo = encryptedStudentInfo.encryptedData;
        user.ivStudentInfo = encryptedStudentInfo.iv

        return await this.userRepository.save(user);
    }

    /** 🔹 토큰에 맞는 학생 정보 가져오기 */
    async getStudentInfoForInput(token: string) {

                const jwtSecret = this.configService.get<string>("JWT_SECRET");
                if (!jwtSecret) {
                    throw new Error("환경 변수가 설정되지 않았습니다.");
                }
        
                // ✅ JWT 검증 및 타입 지정
                const verifyToken = jwt.verify(token, jwtSecret) as { question: string; user: number };
        
                const question = await this.questionRepository.findOne({
                    where: { uuid: verifyToken.question },
                    relations: ["subjects"]
                });
        
                const userData = await this.userRepository.findOne({where:{id:verifyToken.user}})

        // 학생 정보 복호화
        const StudentInfo = JSON.parse(this.cryptoService.decryptAES(userData.encryptedStudentInfo, userData.ivStudentInfo));

        return StudentInfo;
    }

    /** 🔹 학생 답안 제출 */
    async submitStudentAnswer(body: studentAnswerInterface) {
        try {

            
            const jwtSecret = this.configService.get<string>("JWT_SECRET");
            if (!jwtSecret) {
                throw new Error("환경 변수가 설정되지 않았습니다.");
            }
    
            // ✅ JWT 검증 및 타입 지정
            const verifyToken = jwt.verify(body.token, jwtSecret) as { question: string; user: number };
    
            const question = await this.questionRepository.findOne({
                where: { uuid: verifyToken.question },
                relations: ["subjects"]
            });

            if (!question || !question.subjects) {
                throw new HttpException(
                    "⚠️ 유효하지 않은 시험 문항입니다.",
                    HttpStatus.NOT_FOUND
                );
            }

            if (verifyToken.user !== question.subjects.userId) {
                throw new HttpException(
                    "🚫 잘못된 시험지의 결과를 작성하였습니다.",
                    HttpStatus.NOT_ACCEPTABLE
                );
            }

            const answer = this.cryptoService.encryptAES(JSON.stringify(body.answer))

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

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error("🔥 submitStudentAnswer Error:", error);
            throw new HttpException(
                "🚨 서버 오류가 발생하였습니다. 관리자에게 문의하세요.",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

}