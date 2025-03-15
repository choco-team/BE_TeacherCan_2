import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/db/entities/question.entity';
import { questionDataDto } from 'src/dto/question.dto';
import { Repository } from 'typeorm'
import { CryptoService } from 'src/services/crypto.service';

@Injectable()
export class QuestionManagementService {
    constructor(
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        private readonly cryptoService: CryptoService
    ){}


     postQuestionOnDB(question:questionDataDto){
     const newQuestion = this.questionRepository.create()
     const content = this.cryptoService.encryptAES(question.content)
     const comment = this.cryptoService.encryptAES(question.comment)
     const answerSheet = this.cryptoService.encryptAES(JSON.stringify(question.answerSheet))
     const correctAnswer = this.cryptoService.encryptAES(JSON.stringify(question.correctAnswer))
    
     newQuestion.encryptedContent = content.encryptedData        
     newQuestion.ivContentId = content.iv
     newQuestion.encryptedComment = comment.encryptedData        
     newQuestion.ivCommentId = comment.iv
     newQuestion.encryptedAnswerSheets = answerSheet.encryptedData        
     newQuestion.ivAnswerSheets = answerSheet.iv
     newQuestion.encryptedCorrectAnswer = correctAnswer.encryptedData        
     newQuestion.ivCorrectAnswer = correctAnswer.iv
     return newQuestion
    }

    async modifiedQuestionOnDB(question:questionDataDto){
        const loadQuestion = await this.findQuestionById(question.id)
        const content = this.cryptoService.encryptAES(question.content)
        const comment = this.cryptoService.encryptAES(question.comment)
        const answerSheet = this.cryptoService.encryptAES(JSON.stringify(question.answerSheet))
        const correctAnswer = this.cryptoService.encryptAES(JSON.stringify(question.correctAnswer))
       
        loadQuestion.encryptedContent = content.encryptedData        
        loadQuestion.ivContentId = content.iv
        loadQuestion.encryptedComment = comment.encryptedData        
        loadQuestion.ivCommentId = comment.iv
        loadQuestion.encryptedAnswerSheets = answerSheet.encryptedData        
        loadQuestion.ivAnswerSheets = answerSheet.iv
        loadQuestion.encryptedCorrectAnswer = correctAnswer.encryptedData        
        loadQuestion.ivCorrectAnswer = correctAnswer.iv
        return loadQuestion
    }

    async saveQuestionOnDB(question:Question){
     try{  
     await this.questionRepository.save(question);
    } catch (error){
        throw new HttpException("문항 저장에 실패하였습니다", HttpStatus.INTERNAL_SERVER_ERROR)
    }
    }

    async findQuestionById(questionId){
            const result = await this.questionRepository.findOne({where:{id:questionId}})
            if (!result) throw new HttpException("문항을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
                return result
    }

    
    async getQuestionList(page: number, userId: number, subject: string | undefined) {
        const pageSize = 20; // ✅ 한 페이지당 개수
        const offset = (page - 1) * pageSize; // ✅ OFFSET 계산
    
        const query = this.questionRepository
        .createQueryBuilder("question")
        .leftJoin("question.subject", "subject") // ✅ 반대로 subject와 JOIN
        .where("subject.userId = :userId", { userId })
        .orderBy("question.createdAt", "DESC") // ✅ 최신순 정렬
        .select([
          "question.id",
          "subject.name",         // ✅ Subject의 name만 선택
          "question.title",       // ✅ Question의 title만 선택
          "question.createdAt"    // ✅ Question의 createdAt만 선택
        ])
        .limit(pageSize) // ✅ 페이지네이션 적용 (최대 20개)
        .offset(offset);
      
      if (subject) {
          query.andWhere("subject.name = :subject", { subject }); // ✅ subject가 테이블 별칭
      }

      return await query.getRawMany(); // ✅ 최종 실행
    }

    async deleteQuestionOnDB(questionId) {
       const DeleteResult = await this.questionRepository.delete({ id:questionId });
        if (DeleteResult.affected===0){
            throw new HttpException("문항을 찾을 수 없어 삭제에 실패하였습니다", HttpStatus.NOT_FOUND)
        }
    }
    
    async loadQuestionOnDB(questionId) {
        const question = await this.questionRepository.findOne({ where: { id:questionId }, relations: ["subjects"] });
        if (!question) throw new HttpException("문항을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
    
        const content = question.encryptedContent ? this.cryptoService.decryptAES(question.encryptedContent, question.ivContentId) : null;
        const comment = question.encryptedComment ? this.cryptoService.decryptAES(question.encryptedComment, question.ivCommentId) : null;
        const answerSheet = question.encryptedAnswerSheets ? JSON.parse(this.cryptoService.decryptAES(question.encryptedAnswerSheets, question.ivAnswerSheets)) : null;
        const correctAnswer = question.encryptedCorrectAnswer ? JSON.parse(this.cryptoService.decryptAES(question.encryptedCorrectAnswer, question.ivCorrectAnswer)) : null;
    
        const questionData = {
            title: question.title,
            content: content,
            comment: comment,
            subjectName: question.subject.name,
            answerSheet: answerSheet,
            correctAnswer: correctAnswer,
            id: question.id,
            subjectsId: question.subjectsId
        };
    
        return questionData;
    }
}