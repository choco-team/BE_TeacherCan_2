import { Get, HttpException, HttpStatus, Injectable, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from 'src/db/entities/session.entity';
import { User } from 'src/db/entities/user.entity';
import { Roles } from 'src/decorator/roles.decorator';
import { studentInterface } from 'src/dto/user.dto';
import { Repository } from 'typeorm';
import { studentAnswerDto } from './student.controller';
import { Question } from 'src/db/entities/question.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';

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
    ) {}

        async getStudentInfo(userId){
            const user = await this.userRepository.findOne({where:{id:userId}})
            if (!user.studentInfo) {
                throw new HttpException("등록된 학생정보 없음", HttpStatus.NO_CONTENT)
            }
            return user.studentInfo
        }

        async checkAndSaveStudentInfo(data:studentInterface[], userId:number){

            const numbers = new Set();
            const hasDuplicate = data.some(student => numbers.has(student.number) || !numbers.add(student.number));
                if (hasDuplicate){
                throw new HttpException("학생 번호는 중복이 있어서는 안됩니다", HttpStatus.BAD_REQUEST)
            }
            const user = await this.userRepository.findOne({where:{id:userId}})
            user.studentInfo = data
            return await this.userRepository.save(user)        
        }

        async getStudentInfoForInput(session){
            const sessionData = await this.sessionRepository.findOne({where:{id:session}, relations:["users"]})
            if (!sessionData) {
                throw new HttpException("허가되지 않은 접근입니다", HttpStatus.FORBIDDEN)
            }
            if (!sessionData.user.studentInfo){
                throw new HttpException("등록된 학생정보가 없습니다", HttpStatus.NOT_FOUND)
            }

            return sessionData.user.studentInfo
        }

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
        
                let studentAnswer = await this.studentAnswerRepository.findOne({
                    where: { studentNumber: body.student, userId: sessionData.userId, questionId:question.id}
                });
        
                // ✅ studentAnswer가 없으면 새로 생성하고 변수에 할당
                if (!studentAnswer) {
                    studentAnswer = this.studentAnswerRepository.create({
                        studentNumber: body.student,
                        userId: sessionData.userId,
                        questionId: question.id,
                        answer: body.answer // 처음부터 answer 추가
                    });
                } else {
                    studentAnswer.answer = body.answer;
                }
        
                await this.studentAnswerRepository.save(studentAnswer);
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
