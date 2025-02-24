import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorator/roles.decorator';
import { SubjectService } from './subject.service';
import { UserDecorator } from 'src/decorator/user.decorator';
import { CreateSubjectDto, ModifySubjectDto } from '../dto/subject.dto';
import { RolesGuard } from 'src/auth/role.guard';

@UseGuards(RolesGuard)
@Controller('/api/subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

@Get()
@Roles('user')
    async fetchUserSubject(@UserDecorator("id") userId:number){
    return await this.subjectService.fetchUserSubject(userId);
}

@Post()
@Roles('user')
    async addNewSubject(@Body() body:CreateSubjectDto, @UserDecorator("id") userId:number){
        const name = body.name
    return await this.subjectService.addNewSubject(name, userId);
}

@Patch()
@Roles('user')
async modifySubject(@Body() body:ModifySubjectDto, @UserDecorator("id") userId:number){
    const name = body.selected
    const newName = body.name    
    return await this.subjectService.modifySubject(name, newName, userId);
    }

@Delete()
@Roles('user')
async deleteSubject(@Body() body:CreateSubjectDto, @UserDecorator("id") userId:number){
    const name = body.name
    return await this.subjectService.deleteSubject(name, userId);
}

}
