import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorator/roles.decorator';
import { SubjectService } from './subject.service';
import { UserDecorator } from 'src/decorator/user.decorator';
import { CreateSubjectDto, ModifySubjectDto } from '../dto/subject.dto';
import { RolesGuard } from 'src/auth/role.guard';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('/api/subject')
@UseGuards(RolesGuard)
@Controller('/api/subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

@ApiOperation({summary: '과목 가져오기', description: '저장된 과목을 서버에서 가져옵니다(세션id 쿠키 필수)'})
@ApiResponse({
    status: 200,
    description: '과목 리스트를 가져옵니다.',
    schema: {
      type: 'array',   // 배열 타입 명시
      items: { type: 'string' }, // 배열 내부 요소는 string
      example: ['수학', '과학', '영어'], // 예제 데이터
    },
  })
  @Get()
@Roles('user')
    async fetchUserSubject(@UserDecorator("id") userId:number){
    return await this.subjectService.fetchUserSubject(userId);
}

@ApiOperation({summary: '과목 추가', description: '작성한 과목을 추가합니다(세션id 쿠키 필수)'})
@ApiBody({description:'작성한 과목을 추가합니다', type:CreateSubjectDto })
@ApiResponse({
    status: 200,
    description: '과목 리스트를 가져옵니다.',
    schema: {
      type: 'array',   // 배열 타입 명시
      items: { type: 'string' }, // 배열 내부 요소는 string
      example: ['수학', '과학', '영어'], // 예제 데이터
    },
  })
  @Post()
@Roles('user')
    async addNewSubject(@Body() body:CreateSubjectDto, @UserDecorator("id") userId:number){
        const name = body.name
    return await this.subjectService.addNewSubject(name, userId);
}

@ApiOperation({summary: '과목명 수정', description: '작성한 과목명을 수정합니다(세션id 쿠키 필수)'})
@ApiBody({description: '작성한 과목명으로 수정합니다', type:ModifySubjectDto})
@ApiResponse({
    status: 200,
    description: '과목 리스트를 가져옵니다.',
    schema: {
      type: 'array',   // 배열 타입 명시
      items: { type: 'string' }, // 배열 내부 요소는 string
      example: ['수학', '과학', '영어'], // 예제 데이터
    },
  })
  @Patch()
@Roles('user')
async modifySubject(@Body() body:ModifySubjectDto, @UserDecorator("id") userId:number){
    const name = body.selected
    const newName = body.name    
    return await this.subjectService.modifySubject(name, newName, userId);
    }

@ApiOperation({summary: '과목 삭제', description: '작성된 과목을 삭제합니다(세션id 쿠키 필수)'})
@ApiBody({description: '삭제할 과목 이름', type: CreateSubjectDto})
@ApiResponse({
    status: 200,
    description: '과목 리스트를 가져옵니다.',
    schema: {
      type: 'array',   // 배열 타입 명시
      items: { type: 'string' }, // 배열 내부 요소는 string
      example: ['수학', '국어', '과학'], // 예제 데이터
    },
  })
  @Delete()
@Roles('user')
async deleteSubject(@Body() body:CreateSubjectDto, @UserDecorator("id") userId:number){
    const name = body.name
    return await this.subjectService.deleteSubject(name, userId);
}

}
