import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { Subject } from 'src/db/entities/subject.entity';
import { questionDataDto } from 'src/dto/question.dto';
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config';
import { CryptoService } from 'src/services/crypto.service';
import * as jwt from "jsonwebtoken";

@Injectable()
export class QuestionService {
    constructor(
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,

        @InjectRepository(Subject)
        private readonly subjectRepository: Repository<Subject>,


        private readonly configService: ConfigService,
        private readonly cryptoService: CryptoService

    ){}

    async postQuestionOnDB(body:questionDataDto,userId:number){
        let question:Question
        if (body.id){
            question = await this.questionRepository.findOne({where:{id:body.id}})
           const subjectInfo = await this.subjectRepository.findOne({where:{userId,name:body.subjectName}})
           if (!subjectInfo){
            throw new HttpException("과목을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
           }
        } else {
            question = await this.questionRepository.create({title:body.title})
            const subjectInfo = await this.subjectRepository.findOne({where:{userId,name:body.subjectName}})
            if (!subjectInfo){
                throw new HttpException("등록되지 않은 교과 이름입니다", HttpStatus.NOT_FOUND)
               }
                question.subjectsId = subjectInfo.id
        }
        const content = this.cryptoService.encryptAES(body.content)
        const comment = this.cryptoService.encryptAES(body.comment)
        const answerSheet = this.cryptoService.encryptAES(JSON.stringify(body.answerSheet))
        const correctAnswer = this.cryptoService.encryptAES(JSON.stringify(body.correctAnswer))
        question.encryptedContent = content.encryptedData        
        question.ivContentId = content.iv
        question.encryptedComment = comment.encryptedData        
        question.ivCommentId = comment.iv
        question.encryptedAnswerSheets = answerSheet.encryptedData        
        question.ivAnswerSheets = answerSheet.iv
        question.encryptedCorrectAnswer = correctAnswer.encryptedData        
        question.ivCorrectAnswer = correctAnswer.iv
        await this.questionRepository.save(question);
    }

    
    
    async getQuestionList(page: number, userId: number, subject: string | undefined) {
        const pageSize = 20; // ✅ 한 페이지당 개수
        const offset = (page - 1) * pageSize; // ✅ OFFSET 계산
    
        const query = this.subjectRepository
            .createQueryBuilder("subjects")
            .leftJoin("subjects.questions", "questions") // ✅ questions와 JOIN
            .where("subjects.userId = :userId", { userId })
            .orderBy("questions.createdAt", "DESC") // ✅ 최신순 정렬
            .select([
                "questions.id",
                "subjects.name",         // ✅ Subject의 name만 선택
                "questions.title",       // ✅ Question의 title만 선택
                "questions.createdAt"    // ✅ Question의 createdAt만 선택
            ])
            .limit(pageSize) // ✅ 페이지네이션 적용 (최대 20개)
            .offset(offset);  // ✅ OFFSET 적용
    
        // ✅ subject 값이 제공되었을 경우, 해당 과목명과 일치하는 데이터만 검색
        if (subject) {
            query.andWhere("subjects.name = :subject", { subject });
        }
    
        return await query.getRawMany(); // ✅ 최종 실행
    }


//**학생 인증은 JWT 발급 방식 */
async getQuestionQRcode(id: number, userId: number) {
    const question = await this.questionRepository.findOne({
        where: { id },
        relations: ["subjects"]
    });

    if (!question) {
        throw new HttpException("질문을 찾을 수 없습니다", HttpStatus.NOT_FOUND);
    }

    if (question.subjects?.userId !== userId) {
        throw new HttpException("권한이 없습니다", HttpStatus.FORBIDDEN);
    }

    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    if (!jwtSecret) {
        throw new Error("환경 변수가 설정되지 않았습니다.");
    }

    const token = jwt.sign(
        { question: question.uuid, user: userId },
        jwtSecret,
        { expiresIn: "1h" }
    );

    return {
        url: `${this.configService.get<string>("SITE_URL")}student?token=${token}`
    };
}

async getAnswerPage(token: string) {
    try {
        const jwtSecret = this.configService.get<string>("JWT_SECRET");
        if (!jwtSecret) {
            throw new Error("환경 변수가 설정되지 않았습니다.");
        }

        // ✅ JWT 검증 및 타입 지정
        const verifyToken = jwt.verify(token, jwtSecret) as { question: string; user: number, iat:number, exp:number };

        const question = await this.questionRepository.findOne({
            where: { uuid: verifyToken.question },
            relations: ["subjects"]
        });

        if (!question) {
            throw new HttpException("질문을 찾을 수 없습니다", HttpStatus.NOT_FOUND);
        }

        // ✅ 권한 체크 (question.subjects가 null일 가능성 대비)
        if (!question.subjects || question.subjects.userId !== verifyToken.user) {
            throw new HttpException("허가되지 않은 접근입니다", HttpStatus.FORBIDDEN);
        }

        // ✅ 복호화 처리
        const answerSheet = question.encryptedAnswerSheets
            ? JSON.parse(this.cryptoService.decryptAES(question.encryptedAnswerSheets, question.ivAnswerSheets))
            : null;

        return { title: question.title, answerSheet };
    } catch (error) {
        console.error("JWT 검증 오류:", error);
        throw new HttpException("토큰 검증 실패", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}


    
    async deleteQuestionOnDB(id, userId) {
        const question = await this.questionRepository.findOne({ where: { id }, relations: ["subjects"] });
    
        // 권한 체크
        if (question.subjects.userId !== userId) {
            throw new HttpException("권한이 없습니다", HttpStatus.FORBIDDEN);
        }
    
        // 삭제 처리
       const DeleteResult = await this.questionRepository.delete({ id });
        if (DeleteResult.affected===0){
            throw new HttpException("문항을 찾을 수 없어 삭제에 실패하였습니다", HttpStatus.NOT_FOUND)
        }
    }
    
    async getQuestionDataForEdit(id, userId) {
        const question = await this.questionRepository.findOne({ where: { id }, relations: ["subjects"] });
    
        // 권한 체크
        if (question.subjects.userId !== userId) {
            throw new HttpException("권한이 없습니다", HttpStatus.FORBIDDEN);
        }
    
        // 복호화 처리
        const content = question.encryptedContent ? this.cryptoService.decryptAES(question.encryptedContent, question.ivContentId) : null;
        const comment = question.encryptedComment ? this.cryptoService.decryptAES(question.encryptedComment, question.ivCommentId) : null;
        const answerSheet = question.encryptedAnswerSheets ? JSON.parse(this.cryptoService.decryptAES(question.encryptedAnswerSheets, question.ivAnswerSheets)) : null;
        const correctAnswer = question.encryptedCorrectAnswer ? JSON.parse(this.cryptoService.decryptAES(question.encryptedCorrectAnswer, question.ivCorrectAnswer)) : null;
    
        const questionData = {
            title: question.title,
            content: content,
            comment: comment,
            subjectName: question.subjects.name,
            answerSheet: answerSheet,
            correctAnswer: correctAnswer,
            id: question.id,
        };
    
        return questionData;
    }
                }