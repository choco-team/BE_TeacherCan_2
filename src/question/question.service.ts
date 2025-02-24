import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { Subject } from 'src/db/entities/subject.entity';
import { questionDataDto } from 'src/dto/question.dto';
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuestionService {
    constructor(
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,

        @InjectRepository(Subject)
        private readonly subjectRepository: Repository<Subject>,

        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,

        private readonly configService: ConfigService

    ){}

    async postQuestionOnDB(body:questionDataDto,userId:number){
        let question
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
        question.title = body.title
        question.content = body.content
        question.comment = body.comment
        question.correct_answer = body.correctAnswer
        question.answer_sheets = body.answerSheet

        await this.questionRepository.save(question);
    }

    async getQuestionOnDB(id: number, userId: number) {
        const question = await this.questionRepository.findOne({
            where: { id },
            relations: ["subjects"], // ✅ subjects 정보도 함께 가져오기
        });
    
        if (!question) {
            throw new Error("해당 질문을 찾을 수 없습니다.");
        }
    
        if (question.subjects?.userId !== userId) {  // ✅ 옵셔널 체이닝 추가
            throw new Error("권한이 없습니다.");
        }

        const questionInfo:questionDataDto = {
            id:question.id,
            title:question.title,
            subjectName:question.subjects.name,
            comment:question.comment,
            content:question.content,
            correctAnswer:question.correct_answer,
            answerSheet:question.answer_sheets,
        }
    
        return questionInfo;
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

    async getQuestionQRcode(id, userId){
        const question = await this.questionRepository.findOne({where:{id}, relations:["subjects"]});
        if (question.subjects.userId!==userId){
            throw new HttpException("권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        const session = await this.sessionRepository.findOne({
            where: { userId }, 
            order: { createdAt: "DESC" } // ✅ 최신 생성된 세션을 가져옴
        });
        console.log(session)
        if (!session)
        { throw new HttpException("세션이 종료되었습니다. 다시 로그인해주세요", HttpStatus.UNAUTHORIZED)}
            return {url: this.configService.get<string>("SITE_URL") + `student?id=${question.uuid}&session=${session.id}`}
      }
      
      async getAnswerPage(id, session){
        const question = await this.questionRepository.findOne({where:{uuid:id}, relations:["subjects"]});
        const sessionData = await this.sessionRepository.findOne({where:{id:session}})
        if (question.subjects.userId!==sessionData.userId){
            throw new HttpException("허가되지 않은 접근입니다", HttpStatus.FORBIDDEN)
        }
        return {title:question.title, answerSheet:question.answer_sheets} 
      }



            }