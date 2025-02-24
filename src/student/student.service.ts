import { Get, HttpException, HttpStatus, Injectable, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from 'src/db/entities/session.entity';
import { User } from 'src/db/entities/user.entity';
import { Roles } from 'src/decorator/roles.decorator';
import { studentInterface } from 'src/dto/user.dto';
import { Repository } from 'typeorm';

@Injectable()
export class StudentService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>) {}

        @Get()
        @Roles("user")
        async getStudentInfo(userId){
            const user = await this.userRepository.findOne({where:{id:userId}})
            if (!user.studentInfo) {
                throw new HttpException("등록된 학생정보 없음", HttpStatus.NO_CONTENT)
            }
            return user.studentInfo
        }

        @Post()
        @Roles("user")
        async checkAndSaveStudentInfo(data:studentInterface[], userId:number){
            const numbers = new Set();
            const hasDuplicate = data.some(student => numbers.has(student.number) || !numbers.add(student.number));
                if (hasDuplicate){
                throw new HttpException("학생 번호는 중복이 있어서는 안됩니다", HttpStatus.BAD_REQUEST)
            }
            const user = await this.userRepository.findOne({where:{id:userId}})
            user.studentInfo = data
            return await this.userRepository.save(user)            
        }

        @Get()
        async getStudentInfoForInput(session){
            const sessionData = await this.sessionRepository.findOne({where:{id:session}, relations:["users"]})
            if (!sessionData) {
                throw new HttpException("허가되지 않은 접근입니다", HttpStatus.FORBIDDEN)
            }
            if (!sessionData.user.studentInfo){
                throw new HttpException("등록된 학생정보가 없습니다", HttpStatus.NOT_FOUND)
            }

            return sessionData.user.studentInfo
        }

}
