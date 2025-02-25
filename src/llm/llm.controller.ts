import { Controller, Get, HttpException, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { LlmService } from './llm.service';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';


@Controller('/api/llm')
export class LlmController {
      constructor(private readonly llmService: LlmService) {}

      @Get('/question')
      @Roles('user')
      async fetchQuestionToLlm(
        @Query("id", ParseIntPipe) questionId: number, 
        @UserDecorator("id") userId: number,
        @UserDecorator("sessions") sessionId: string
      ) {
        if (!questionId) {
          throw new HttpException("문항 ID가 없습니다!", HttpStatus.BAD_REQUEST);
        }
      
        try {
          // 프롬프트 생성
          const prompt = await this.llmService.makeQuestionPrompt(questionId, sessionId);
      
          // 입력 토큰 계산
          const usedInputToken = await this.llmService.checkTokens(prompt);
      
          // LLM에서 질문 가져오기
          const response = await this.llmService.fetchToLlm(prompt, userId);
          if (!response) {
            throw new HttpException("LLM 응답이 없습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
          }
      
          // 출력 토큰 계산
          const usedOutputToken = await this.llmService.checkTokens(response);
      
          // 토큰 사용량 정산
          await this.llmService.calculateTokens(usedInputToken, usedOutputToken, userId);
      
          return response;
        } catch (error) {
          console.error("Error fetching question:", error);
          throw new HttpException("LLM 처리 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }



      @Get('/student')
      @Roles('user')
      async fetchStudentToLlm(
        @Query("id", ParseIntPipe) studentNumber: number, 
        @UserDecorator("id") userId: number,
        @UserDecorator("sessions") sessionId: string
      ) {
        if (!studentNumber) {
          throw new HttpException("학생 번호가 없습니다!", HttpStatus.BAD_REQUEST);
        }
      
        try {
          // 프롬프트 생성
          const prompt = await this.llmService.makeStudentPrompt(studentNumber, sessionId);
      
          // 입력 토큰 계산
          const usedInputToken = await this.llmService.checkTokens(prompt);
      
          // LLM에서 질문 가져오기
          const response = await this.llmService.fetchToLlm(prompt, userId);
          if (!response) {
            throw new HttpException("LLM 응답이 없습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
          }
      
          // 출력 토큰 계산
          const usedOutputToken = await this.llmService.checkTokens(response);
      
          // 토큰 사용량 정산
          await this.llmService.calculateTokens(usedInputToken, usedOutputToken, userId);
      
          return response;
        } catch (error) {
          console.error("Error fetching question:", error);
          throw new HttpException("LLM 처리 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    }
