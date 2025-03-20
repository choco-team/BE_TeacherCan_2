import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { studentAnswerDataInterface } from 'src/dto/question.dto';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentAnswerDataDto } from 'src/dto/response.dto';
import { LlmService } from './llm.service';
import { TokenService } from './token.service';

@ApiTags('/llm')
@Controller('/llm')
export class LlmController {
      constructor(
        private readonly llmService: LlmService,
        private readonly tokenService: TokenService,
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
        return this.llmService.fetchStudentToLlm(body, sessionId, userId)
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
