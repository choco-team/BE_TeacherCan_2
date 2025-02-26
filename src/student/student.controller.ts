import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { studentInterface } from 'src/dto/user.dto';

export interface studentAnswerDto{
    questionUuid: string,
    session: string,
    student: number,
    answer: string[]
}

@Controller('/api/student')
export class StudentController {
          constructor(private readonly studentService: StudentService) {}
 
@Get()
async getStudentInfo(@UserDecorator("id") userId:number) {
    return this.studentService.getStudentInfo(userId)
}

@Get("/input")
async getStudentInfoForInput(@Query("session") session:string) {
    return this.studentService.getStudentInfoForInput(session)
}


@Post()
@Roles("user")
async checkAndSaveStudentInfo(@Body() body:studentInterface[], @UserDecorator("id") userId:number) {
    return this.studentService.checkAndSaveStudentInfo(body, userId)
}

@Post("/submit")
async submitStudentAnswer(@Body() body:studentAnswerDto){
    return this.studentService.submitStudentAnswer(body)
}

}
