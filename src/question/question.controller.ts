import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { RolesGuard } from 'src/auth/role.guard';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnswerSheetResponseDto, DeleteQuestionDto, QuestionDataResponseDto, QuestionInfoResponseDto, UrlDto } from 'src/dto/response.dto';

@ApiTags("/api/question")
@UseGuards(RolesGuard)
@Controller('/api/question')
export class QuestionController {
      constructor(private readonly questionService: QuestionService) {}
    
      @ApiOperation({summary: '문항 전송', description: '작성한 문항을 서버로 전송하여 저장합니다. (객체의 id가 없으면 추가, 있으면 수정 가능) (세션id 쿠키 필수)'})
      @ApiBody({description: '문항 전체 정보', type: QuestionDataResponseDto})
      @Post()
      @Roles("user")
      async postQuestionOnDB(@Body() body, @UserDecorator("id") userId:number){
        await this.questionService.postQuestionOnDB(body,userId)
      }
      
      @ApiOperation({summary: '문항 리스트 불러오기', description: '업로드한 문항의 목록을 20개씩 불러옵니다 (세션id 쿠키 필수)'})
      @ApiResponse({description: '문항 목록을 가져옵니다', type: QuestionInfoResponseDto})
      @Get("/list/:page/:subject?")
      @Roles("user")
      async getQuestionList(@Param("page") page: number, @Param("subject") subject:string | undefined, @UserDecorator("id") userId:number){
        return await this.questionService.getQuestionList(page, userId, subject)
      }

      @ApiOperation({summary: 'QR코드 요청', description: '문항을 풀도록 하기 위한 QR코드를 요청합니다(세션id 쿠키 필수)'})
      @ApiResponse({description: 'URL을 가져옵니다', type: UrlDto})
      @Get("/qrcode")
      @Roles("user")
      async getQuestionQRcode(@Query("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionService.getQuestionQRcode(id,userId)
      }

      @ApiOperation({summary: '문항 답안정보 요청', description: '문항 답안을 렌더링하기 위해 답안의 형식을 불러옵니다'})
      @ApiResponse({description: "문항의 답안 정보를 가져옵니다", type: AnswerSheetResponseDto})
      @Get("/answer")
      async getAnswerPage(@Query("token") token:string){
        return await this.questionService.getAnswerPage(token)
      }

      @ApiOperation({summary: '문항 삭제', description: '등록한 문항을 삭제합니다(세션id 쿠키 필수)'})
      @ApiBody({description:'삭제할 문항 번호', type: DeleteQuestionDto})
      @Delete()
      @Roles("user")
      async deleteQuestionOnDB(@Body("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionService.deleteQuestionOnDB(id,userId)
      }

      @ApiOperation({summary: '문항 수정 정보 불러오기', description: '특정 문항 수정을 위한 상세 정보를 불러옵니다.(세션id 쿠키 필수)'})
      @ApiResponse({description: "문항의 답안 정보를 가져옵니다", type:QuestionDataResponseDto })
      @Get("/edit/:id")
      @Roles("user")
      async getQuestionDataForEdit(@Param("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionService.getQuestionDataForEdit(id,userId)
      }
}
