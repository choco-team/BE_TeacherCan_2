import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { RolesGuard } from 'src/auth/role.guard';

@UseGuards(RolesGuard)
@Controller('/api/question')
export class QuestionController {
      constructor(private readonly questionService: QuestionService) {}
    
      @Post()
      @Roles("user")
      async postQuestionOnDB(@Body() body, @UserDecorator("id") userId:number){
        await this.questionService.postQuestionOnDB(body,userId)
      }

      @Get()
      @Roles("user")
      async getQuesiotnOnDB(@Query("id") id:number, @UserDecorator("id") userId:number){
       return await this.questionService.getQuestionOnDB(id, userId)
      }

      @Get("/list/:page/:subject?")
      @Roles("user")
      async getQuestionList(@Param("page") page: number, @Param("subject") subject:string | undefined, @UserDecorator("id") userId:number){
        return await this.questionService.getQuestionList(page, userId, subject)
      }

      @Get("/qrcode")
      @Roles("user")
      async getQuestionQRcode(@Query("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionService.getQuestionQRcode(id,userId)
      }

      @Get("/answer")
      async getAnswerPage(@Query("token") token:string){
        return await this.questionService.getAnswerPage(token)
      }

      @Delete()
      @Roles("user")
      async deleteQuestionOnDB(@Body("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionService.deleteQuestionOnDB(id,userId)
      }

      @Get("/edit/:id")
      @Roles("user")
      async getQuestionDataForEdit(@Param("id") id:number, @UserDecorator("id") userId:number){
        return await this.questionService.getQuestionDataForEdit(id,userId)
      }
}
