import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SessionService } from 'src/auth/session.service';

@Injectable()
export class PromptService {
    constructor(
        private readonly sessionService: SessionService,
    ) {}

    // 세션에 맞는 문항 생성
    async makeQuestionPrompt(questionId: number, sessionId: string) {
        try {
            const sessionData = await this.sessionService.getUserBySession(sessionId);
            const question = await this.questionRepository.findOne({ where: { id: questionId }, relations: ["subjects"] });
            if (sessionData.id !== question.subject.userId) {
                throw new HttpException("문항 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
            }

            // 내용과 정답을 복호화
            const decryptedContent = this.cryptoService.decryptAES(question.encryptedContent, question.ivContentId);
            const decryptedCorrectAnswer = this.cryptoService.decryptAES(question.encryptedCorrectAnswer, question.ivCorrectAnswer);

            return `사용자 세션: ${sessionId}
                    아까 작성해달라고 한 교과 학습 발달 상황 문항이야.
                    학생 답변이 올때까지 읽기만 해
                    문항: ${decryptedContent}
                    ${decryptedCorrectAnswer ? "모범답안: " + decryptedCorrectAnswer : null}`;
        } catch (error) {
            throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 학생 평가 작성 프롬프트 생성
    async makeStudentPrompt(sessionId, studentNumber, questionId, maxLength, isLastQuesiotn) {
        try {
            const question = await this.questionRepository.findOne({ where: { id: questionId } });
            const userData = await this.sessionService.getUserBySession(sessionId)
            const studentAnswer = await this.studentAnswerRepository.findOne({ where: { studentNumber: studentNumber, userId: userData.id } });

            // 답안 복호화
            const decryptedAnswer = studentAnswer ? this.cryptoService.decryptAES(studentAnswer.encryptedAnswer, studentAnswer.ivAnswer) : '';

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
                    학생 번호 ${studentNumber} 답안: ${decryptedAnswer || null}`;
        } catch (error) {
            throw new HttpException("서버 에러입니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
