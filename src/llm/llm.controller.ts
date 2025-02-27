import { Body, Controller, Get, HttpException, HttpStatus, ParseIntPipe, Post, Query } from '@nestjs/common';
import { LlmService } from './llm.service';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { studentAnswerDataDto } from 'src/dto/question.dto';


@Controller('/api/llm')
export class LlmController {
      constructor(private readonly llmService: LlmService) {}

      @Post('/student')
      @Roles('user')
      async fetchStudentToLlm(
        @Body() body: studentAnswerDataDto,
        @UserDecorator("id") userId: number,
        @UserDecorator("sessions") sessionId: string
      ) {
        if (!body.studentNumber) {
          throw new HttpException("학생 번호가 없습니다!", HttpStatus.BAD_REQUEST);
        }
        if (!body.questionId) {
          throw new HttpException("문항 번호가 없습니다!", HttpStatus.BAD_REQUEST);
        }
        
          // 프롬프트 생성
          const prompt = await this.llmService.makeStudentPrompt(sessionId,
            userId,
            body.studentNumber,
            body.questionId,
            body.maxLength,
            body.isLastQuesiotn);
      
          // 입력 토큰 계산
          const usedInputToken = await this.llmService.checkTokens(prompt);
      
          // LLM에서 질문 가져오기
          const response = await this.llmService.fetchToLlm(prompt, userId, usedInputToken);
          if (!response) {
            throw new HttpException("LLM 응답이 없습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
          }
      
          // 출력 토큰 계산
          const usedOutputToken = await this.llmService.checkTokens(response);
      
          // 토큰 사용량 정산
          await this.llmService.calculateTokens(usedInputToken, usedOutputToken, userId);
      
          return response;
      }


      @Get('/usages')
      @Roles('user')
      async fetchRemainingTokens(@UserDecorator("id") userId:number){
        return this.llmService.fetchRemainingTokens(userId)
      }
    }
