import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { RolesGuard } from 'src/auth/role.guard';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnswerSheetResponseDto, DeleteQuestionDto, QuestionDataResponseDto, QuestionInfoResponseDto, StudentAnswerPerQuestionDto, UrlDto } from 'src/dto/response.dto';
import { QuestionAccessService } from './questionAccess.service';
import { QuestionManagementService } from './questionManagement.service';

@ApiTags("/question")
@UseGuards(RolesGuard)
@Controller('/question')
export class QuestionController {
      constructor(
        private readonly questionAccessService: QuestionAccessService,
        private readonly questionManagementService: QuestionManagementService
      ) {}
    
      @ApiOperation({summary: '문항 전송', description: '작성한 문항을 서버로 전송하여 저장합니다. (객체의 id가 없으면 추가, 있으면 수정 가능) (세션id 쿠키 필수)'})
      @ApiBody({description: '문항 전체 정보', type: QuestionDataResponseDto})
      @Post()
      @Roles("user")
      @ApiCookieAuth()
      async postQuestionOnDB(@Body() body, @UserDecorator("id") userId:number){
        await this.questionAccessService.fetchQuestionToDB(body,userId)
      }
      
      @ApiOperation({summary: '문항 리스트 불러오기', description: '업로드한 문항의 목록을 20개씩 불러옵니다 (세션id 쿠키 필수)'})
      @ApiResponse({description: '문항 목록을 가져옵니다', type: QuestionInfoResponseDto})
      @Get("/list/:page/:subject?")
      @Roles("user")
      @ApiCookieAuth()
      async getQuestionList(@Param("page") page: number, @Param("subject") subject:string | undefined, @UserDecorator("id") userId:number){
        return await this.questionManagementService.getQuestionList(page, userId, subject)
      }

      @ApiOperation({summary: 'QR코드 요청', description: '문항을 풀도록 하기 위한 QR코드를 요청합니다(세션id 쿠키 필수)'})
      @ApiResponse({description: 'URL을 가져옵니다', type: UrlDto})
      @Get("/qrcode")
      @Roles("user")
      @ApiCookieAuth()
      async getQuestionQRcode(@Query("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionAccessService.getQuestionQRcode(id,userId)
      }

      @ApiOperation({summary: '문항 답안정보 요청', description: '문항 답안을 렌더링하기 위해 답안의 형식을 불러옵니다'})
      @ApiResponse({description: "문항의 답안 정보를 가져옵니다", type: AnswerSheetResponseDto})
      @Get("/answer")
      async getAnswerPage(@Query("token") token:string){
        return await this.questionAccessService.getAnswerPage(token)
      }

      @ApiOperation({summary: '문항 삭제', description: '등록한 문항을 삭제합니다(세션id 쿠키 필수)'})
      @ApiBody({description:'삭제할 문항 번호', type: DeleteQuestionDto})
      @Delete()
      @Roles("user")
      @ApiCookieAuth()
      async deleteQuestionOnDB(@Body("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionAccessService.deleteQuestionOnDB(id,userId)
      }

      @ApiOperation({summary: '문항 수정 정보 불러오기', description: '특정 문항 수정을 위한 상세 정보를 불러옵니다.(세션id 쿠키 필수)'})
      @ApiResponse({description: "문항의 답안 정보를 가져옵니다", type:QuestionDataResponseDto })
      @Get("/edit/:id")
      @ApiCookieAuth()
      @Roles("user")
      async getQuestionDataForEdit(@Param("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionAccessService.getQuestionData(id,userId)
      }

      @ApiOperation({summary: '문항별 학생 답안 불러오기', description: '특정 문항의 학생 답안을 모두 불러옵니다. (세션id 쿠키 필수)'})
      @ApiResponse({
        description: "문항의 학생 답안을 모두 가져옵니다", example: [{id: 3, studentNumber: 1, name: "홍길동", studentAnswer: [4, "일의 자리에서 받아올림합니다"]}, {id: 3, studentNumber: 2, name: "김철수", studentAnswer: [1, "십의 자리에서 받아올림합니다"]}],
        schema: {type: "array", 
          items:{type: "object",
            properties:
            {id: {type: "number"},
            studentNumber: {type: "number"},
            name: {type: "string"},
            studentAnswer: {oneOf: [{type: "string"}, {type: "number"}]}}}} })
      @Get('/answer/list')
      @ApiCookieAuth()
      @Roles('user')
      async getStudentAnswerThisQuestion(@Query('id') questionId: number, @UserDecorator('id') userId:number){
        return await this.questionAccessService.getStudentAnswerThisQuestion(questionId, userId)
      }    
    }

    