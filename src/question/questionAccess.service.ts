import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from "jsonwebtoken";
import { QuestionManagementService } from './questionManagement.service';
import { decodedQuestionToken, questionDataDto } from 'src/dto/question.dto';
import { SubjectService } from 'src/subject/subject.service';
import { AnswerSheetService } from './answerSheet.service';

@Injectable()
export class QuestionAccessService {
    constructor(
        private readonly subjectService: SubjectService,
        private readonly questionManagementService: QuestionManagementService,
        private readonly configService: ConfigService,
        private readonly answerSheetService: AnswerSheetService
    ){}
  

async canAccessThis(subjectId:number, userId:number){
    const subject = await this.subjectService.findSubjectById(subjectId)
    if (subject.userId!==userId){throw new HttpException("권한이 없습니다", HttpStatus.FORBIDDEN)}
}

async loadJWTSecret(){
    const result = this.configService.get<string>("JWT_SECRET");
    if (!result) throw new HttpException("서버 설정 오류입니다", HttpStatus.INTERNAL_SERVER_ERROR)
    return result
}

async makeAccessToken(payload, expiresIn:string) {
    const jwtSecret = await this.loadJWTSecret()
    return jwt.sign(payload, jwtSecret ,{expiresIn})
}

async getQuestionQRcode(id: number, userId: number) {
    const question = await this.questionManagementService.findQuestionById(id)
    await this.canAccessThis(question.subjectsId, userId)
    const token = this.makeAccessToken(
        { question: question.id, user: userId }, "1h")

    return {
        url: `${this.configService.get<string>("SITE_URL")}student?token=${token}`
    };
}

async verifyToken(token){
    const jwtSecret = await this.loadJWTSecret()
    const decoded = jwt.verify(token, jwtSecret)
    return decoded
}

async getAnswerPage(token: string) {
        // ✅ JWT 검증 및 타입 지정
        const verifyToken:decodedQuestionToken = await this.verifyToken(token);
        const question = await this.questionManagementService.loadQuestionOnDB(verifyToken.question)
        await this.canAccessThis(question.subjectsId, verifyToken.user)
        return { title: question.title, answerSheet: question.answerSheet}
}

    
    async deleteQuestionOnDB(id:number, userId:number) {
        const question = await this.questionManagementService.findQuestionById(id)
       await this.canAccessThis(question.subjectsId, userId)
       return  await this.questionManagementService.deleteQuestionOnDB(id)
    }    

    async fetchQuestionToDB(question:questionDataDto, userId:number){
    const subject = await this.subjectService.findSubjectByName(question.subjectName, userId)
    
    if (!question.id){
    const newQuestion = await this.questionManagementService.postQuestionOnDB(question)
    newQuestion.subjectsId = subject.id
    return await this.questionManagementService.saveQuestionOnDB(newQuestion)
    } else{
    const modifiedQuestion = await this.questionManagementService.modifiedQuestionOnDB(question)
    modifiedQuestion.subjectsId = subject.id
    return await this.questionManagementService.saveQuestionOnDB(modifiedQuestion)
    }
    }

    async getQuestionData(id:number, userId:number){
        const question = await this.questionManagementService.findQuestionById(id)
        const subject = await this.subjectService.findSubjectById(question.subjectsId)
        await this.canAccessThis(subject.id, userId)
            return await this.questionManagementService.loadQuestionOnDB(id);
    }

        async getStudentAnswerThisQuestion(questionId:number, userId:number){
        const question = await this.questionManagementService.findQuestionById(questionId)
        await this.canAccessThis(question.id,userId)
        return await this.answerSheetService.getStudentAnswerThisQuestion(questionId,userId)
        }
                }