import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/db/entities/user.entity';
import { Session } from 'src/db/entities/session.entity';
import { Question } from 'src/db/entities/question.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { studentAnswerDto } from './student.controller';
import { CryptoService } from 'src/services/crypto.service'; // 암호화 서비스 추가

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
    ) {}

    /** 🔹 학생 정보 가져오기 (복호화) */
    async getStudentInfo(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user || !user.encryptedStudentInfo) {
            throw new HttpException("등록된 학생정보 없음", HttpStatus.NO_CONTENT);
        }

        // 학생 정보를 복호화
        const decryptedStudentInfo = JSON.parse(this.cryptoService.decryptAES(user.encryptedStudentInfo, ''));

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
        const encryptedStudentInfo = this.cryptoService.encryptAES(JSON.stringify(data)).encryptedData;
        user.encryptedStudentInfo = encryptedStudentInfo;

        return await this.userRepository.save(user);
    }

    /** 🔹 세션에 맞는 학생 정보 가져오기 */
    async getStudentInfoForInput(session: string) {
        const sessionData = await this.sessionRepository.findOne({ where: { id: session }, relations: ["users"] });

        if (!sessionData) {
            throw new HttpException("허가되지 않은 접근입니다", HttpStatus.FORBIDDEN);
        }

        if (!sessionData.user.encryptedStudentInfo) {
            throw new HttpException("등록된 학생정보가 없습니다", HttpStatus.NOT_FOUND);
        }

        // 학생 정보 복호화
        const decryptedStudentInfo = JSON.parse(this.cryptoService.decryptAES(sessionData.user.encryptedStudentInfo, ''));

        return decryptedStudentInfo;
    }

    /** 🔹 학생 답안 제출 */
    async submitStudentAnswer(body: studentAnswerDto) {
        try {
            const sessionData = await this.sessionRepository.findOne({ where: { id: body.session } });

            if (!sessionData) {
                throw new HttpException(
                    "⛔ 선생님이 시험을 종료하였기 때문에 이 시험지를 제출할 수 없습니다.",
                    HttpStatus.FORBIDDEN
                );
            }

            const question = await this.questionRepository.findOne({
                where: { uuid: body.questionUuid },
                relations: ["subjects"]
            });

            if (!question || !question.subjects) {
                throw new HttpException(
                    "⚠️ 유효하지 않은 시험 문항입니다.",
                    HttpStatus.NOT_FOUND
                );
            }

            if (sessionData.userId !== question.subjects.userId) {
                throw new HttpException(
                    "🚫 잘못된 시험지의 결과를 작성하였습니다.",
                    HttpStatus.NOT_ACCEPTABLE
                );
            }

            // 답안 복호화 (복호화 필요)
            const decryptedAnswer = this.cryptoService.decryptAES(JSON.stringify(body.answer), JSON.stringify([]));

            // 학생 답안 저장
            await this.studentAnswerRepository.upsert(
                {
                    studentNumber: body.student,
                    userId: sessionData.userId,
                    questionId: question.id,
                    encryptedAnswer: this.cryptoService.encryptAES(decryptedAnswer).encryptedData,  // 암호화된 답안 저장
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

    /** 🔹 학생 답안 가져오기 (복호화) */
    async getStudentAnswerForQuestion(userId: number, questionId: number) {
        const studentAnswer = await this.studentAnswerRepository.findOne({
            where: { userId, questionId }
        });

        if (!studentAnswer) {
            throw new HttpException("답안이 없습니다", HttpStatus.NOT_FOUND);
        }

        // 답안 복호화
        const decryptedAnswer = this.cryptoService.decryptAES(studentAnswer.encryptedAnswer, '');

        return {
            studentNumber: studentAnswer.studentNumber,
            decryptedAnswer,
        };
    }
}