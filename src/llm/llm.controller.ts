import { Body, Controller, Get, HttpException, HttpStatus, ParseIntPipe, Post, Query } from '@nestjs/common';
import { LlmService } from './llm.service';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { studentAnswerDataInterface } from 'src/dto/question.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentAnswerDataDto } from 'src/dto/response.dto';

@ApiTags('/api/llm')
@Controller('/api/llm')
export class LlmController {
      constructor(private readonly llmService: LlmService) {}

      @Post('/student')
      @ApiOperation({summary: '학생 평가지 전송 및 평가작성 요청', description: '학생의 평가지를 전송하고 평가 작성을 요청합니다'})
      @ApiBody({type: StudentAnswerDataDto})
      @ApiResponse( {description: "GPT의 답변을 받아옵니다", schema: {type: 'string'} } )
      @Roles('user')
      async fetchStudentToLlm(
        @Body() body: studentAnswerDataInterface,
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
      @ApiOperation({summary: '남은 토큰', description: '남은 토큰 정보를 가져옵니다'})
      @ApiResponse( {description: "토큰양", schema: {type: 'number'} } )
      async fetchRemainingTokens(@UserDecorator("id") userId:number){
        return this.llmService.fetchRemainingTokens(userId)
      }
    }
