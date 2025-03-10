import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { Roles } from 'src/decorator/roles.decorator';
import { UserDecorator } from 'src/decorator/user.decorator';
import { studentInterface } from 'src/dto/user.dto';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckStudentAnswerDto, StudentInfoDto, StudentSubmitAnswerDto } from 'src/dto/response.dto';

export interface studentAnswerInterface{
    token: string,
    student: number,
    answer: string[]
}

@ApiTags('/student')
@Controller('/student')
export class StudentController {
          constructor(private readonly studentService: StudentService) {}

@ApiOperation({summary: '학생 명단 불러오기', description: '작성한 학생 명단을 조회합니다(세션id 쿠키 필수)'})
@ApiResponse({description: "학생 명단을 가져옵니다", type: StudentInfoDto })
@Get()
@Roles("user")
@ApiCookieAuth()
async getStudentInfo(@UserDecorator("id") userId:number) {
    return this.studentService.getStudentInfo(userId)
}

@ApiOperation({summary: '학생 명단 불러오기', description: 'QR코드에 담긴 토큰을 확인하고 학생 명단을 조회합니다'})
@ApiResponse({description: "학생 명단을 가져옵니다", type: StudentInfoDto })
@Get("/input")
async getStudentInfoForInput(@Query("token") toekn:string) {
    return this.studentService.getStudentInfoForInput(toekn)
}

@ApiOperation({summary: '학생 명단 저장', description: '작성한 학생 명단을 저장합니다(세션id 쿠키 필수)'})
@ApiBody({description: "학생 번호 이름", type: StudentInfoDto})
@Post()
@ApiCookieAuth()
@Roles("user")
async checkAndSaveStudentInfo(@Body() body:studentInterface[], @UserDecorator("id") userId:number) {
    return this.studentService.checkAndSaveStudentInfo(body, userId)
}

@ApiOperation({summary: '답안 전송', description: '학생이 작성한 답안을 보냅니다'})
@ApiBody({description: "학생 답안", type: StudentSubmitAnswerDto})
@Post("/submit")
async submitStudentAnswer(@Body() body:studentAnswerInterface){
    return this.studentService.submitStudentAnswer(body)
}

@ApiOperation({summary: '학생별 문항의 답안 전체 조회', description: '학생이 작성한 답안 전체를 조회합니다.(세션id 쿠키 필수)'})
@ApiResponse({description: "학생의 문항별 답안 전체를 조회합니다", type: CheckStudentAnswerDto})
@Get("/answer")
@ApiCookieAuth()
@Roles('user')
async getStudentAnswerList(@Query("studentNumber") studentNumber: number, @UserDecorator("id") userId: number ){
return this.studentService.getStudentAnswerList(studentNumber, userId)
}


}
