import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'
import { CryptoService } from 'src/services/crypto.service';
import * as jwt from "jsonwebtoken";
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { AuthenticationService } from 'src/auth/authentication.service';

@Injectable()
export class AnswerSheetService {
    constructor(
        @InjectRepository(StudentAnswer)
        private readonly studentAnswerRepository: Repository<StudentAnswer>,
        private readonly cryptoService: CryptoService,
        private readonly authenticationService: AuthenticationService

    ){}

        async findStudentAnswerByNumber(studentNumber:number, userId:number, questionId:number){
            const studentAnswer = await this.studentAnswerRepository.findOne({ where: { studentNumber, userId, questionId} });
            const decryptedAnswer = studentAnswer ? await this.cryptoService.decryptAES(studentAnswer.encryptedAnswer, studentAnswer.ivAnswer) : null;   
            return decryptedAnswer
        }

        async getStudentAnswerThisQuestion(questionId, userId){
            const studentAnswer = await this.studentAnswerRepository.find({where: {questionId, userId}})
            const userData = await this.authenticationService.findUserById(userId)
            const studentList:{name: string, number:number}[] = JSON.parse(this.cryptoService.decryptAES(userData.encryptedStudentInfo, userData.ivStudentInfo))
            const responseData = studentAnswer.map(answer => {
                const student = studentList.find(student => student.number === answer.studentNumber);
                return {
                    id: answer.id,
                    name: student?.name,
                    studentNumber: student?.number,
                    studentAnswer: JSON.parse(this.cryptoService.decryptAES(answer.encryptedAnswer, answer.ivAnswer))
                };
            });
            return responseData
        }
                }