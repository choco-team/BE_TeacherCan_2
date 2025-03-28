import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SessionService } from 'src/auth/session.service';
import { AnswerSheetService } from 'src/question/answerSheet.service';
import { QuestionManagementService } from 'src/question/questionManagement.service';

@Injectable()
export class PromptService {
    constructor(
        private readonly sessionService: SessionService,
        private readonly questionManagementService: QuestionManagementService,
        private readonly answerSheetService: AnswerSheetService
    ) {}

    // 학생 평가 작성 프롬프트 생성
    async makeStudentPrompt(sessionId:string, studentNumber:number, questionId:number, maxLength:number, isLastQuesiotn:string) {
        try {
            const question = await this.questionManagementService.findQuestionById(questionId)
            const userData = await this.sessionService.getUserBySession(sessionId)
            const studentAnswer = await this.answerSheetService.findStudentAnswerByNumber(studentNumber, userData.id, questionId)

            return `사용자 세션: ${sessionId}
                    학생의 교과 학습 발달 상황을 작성하고 싶어!
                    너가 할 일은 문제 파일과 학생의 답안을 보고 학생에 대해 평가글을 작성하는 것이야
                    예를 들어 수학 문제에서 3+5를 맞춘 학생이면 '받아올림이 없는 한자리수의 덧셈 계산을 정확히 수행함', 등을 적어서 학생에 대한 교과학습 발달상황을 작성하는 것이야
                    답안은 배열로 제공될 것이고 배열 순서대로 문항에 대한 답을 적었다고 생각하면 돼
                    ${isLastQuesiotn === "false" ? "지금은 내용만 정확히 읽기만 하고 절대 아무것도 답장하지 말 것" :
                    `지금은 이 학생의 마지막 문항이므로 평가문을 응답할 것
                    '그러나', '그리고'와 같은 불필요한 접속사 표현은 쓰지 말 것
                    제공된 문제와 답안을 읽고 기억한 후, 배열로 주어진 학생의 답안을 기반으로 교과 학습 발달 상황을 작성할 것
                    문항 내용과 학생의 작성 내용을 직접적으로 언급하지 않고, 학생의 학습 수준에 대한 평가와 가능성 위주로만 서술할 것
                    모든 문장은 "~함", "~임"으로 끝나도록 작성할 것
                    평가문과 관련 없는 내용은 일절 하지 말 것
                    평가는 ${maxLength}자 내외로 작성해줘`}
                    문항 : ${question.encryptedContent} 
                    정답 풀이 ${question.encryptedCorrectAnswer || "미입력했으므로 문제를 보고 알아서 정답을 염두에 둘 것"}
                    학생 번호 ${studentNumber} 답안: ${studentAnswer}`;
        } catch (error) {
            throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
