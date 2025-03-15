import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { studentAnswerDataInterface } from 'src/dto/question.dto';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentAnswerDataDto } from 'src/dto/response.dto';
import { LlmApiService } from './llmApi.service';
import { TokenService } from './token.service';
import { PromptService } from './prompt.service';

@ApiTags('/llm')
@Controller('/llm')
export class LlmController {
      constructor(private readonly llmApiService: LlmApiService,
        private readonly tokenService: TokenService,
        private readonly promptService: PromptService
      ) {}

      @Post('/student')
      @ApiOperation({summary: '학생 평가지 전송 및 평가작성 요청', description: '학생의 평가지를 전송하고 평가 작성을 요청합니다(세션id 쿠키 필수)'})
      @ApiBody({type: StudentAnswerDataDto})
      @ApiResponse( {description: "GPT의 답변을 받아옵니다", schema: {type: 'string'} } )
      @ApiCookieAuth()
      @Roles('user')
      async fetchStudentToLlm(
        @Body() body: studentAnswerDataInterface,
        @UserDecorator("id") userId: number,
        @UserDecorator("sessions") sessionId: string
      ) {
        
        // llm 모델 불러오기
        const llmModel = await this.llmApiService.loadLlmModelInfo()

          // 프롬프트 생성
          const prompt = await this.promptService.makeStudentPrompt(sessionId,
            body.studentNumber,
            body.questionId,
            body.maxLength,
            body.isLastQuesiotn);
      
          // 입력 토큰 계산
          const usedInputToken = await this.tokenService.checkTokens(prompt);
      
          // LLM에 프롬프트 전송하기
          const response = await this.llmApiService.fetchToLlm(prompt, userId);
          if (!response) {
            throw new HttpException("LLM 응답이 없습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
          }
      
          // 출력 토큰 계산
          const usedOutputToken = await this.tokenService.checkTokens(response);
          
          
          const totalTokens = await this.tokenService.calculateTokens(usedInputToken, usedOutputToken);
          await this.tokenService.saveTokenUsages(userId, usedInputToken, usedOutputToken, totalTokens, llmModel)
      
          return response;
      }


      @Get('/usages')
      @ApiCookieAuth()
      @Roles('user')
      @ApiOperation({summary: '남은 토큰', description: '남은 토큰 정보를 가져옵니다(세션id 쿠키 필수)'})
      @ApiResponse( {description: "토큰양", schema: {type: 'number'} } )
      async fetchRemainingTokens(@UserDecorator("id") userId:number){
        return this.tokenService.fetchRemainingTokens(userId)
      }
    }
