import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subject } from 'src/db/entities/subject.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubjectService {
constructor(
        @InjectRepository(Subject)
        private readonly subjectRepository: Repository<Subject>,
){}

async fetchUserSubject(userId: number) {
    const data = await this.subjectRepository
        .createQueryBuilder()
        .select("name")
        .where("userId = :userId", { userId })
        .getRawMany();

    return data.map(item => item.name); // ✅ 바로 가공하여 반환
}


async addNewSubject(name:string, userId:number){
    const check = await this.subjectRepository.findOne({where:{name, userId}})
    if (check) {throw new HttpException("이미 있는 과목입니다", HttpStatus.CONFLICT)}
    const subject = await this.subjectRepository.create({name, userId})
    await this.subjectRepository.save(subject)
    return  await this.fetchUserSubject(userId)
}

async modifySubject(name:string, newName:string, userId:number){
    const check = await this.subjectRepository.findOne({where:{name:newName, userId}})
    if (check) {throw new HttpException("이미 있는 과목입니다", HttpStatus.CONFLICT)}
    const result = await this.subjectRepository.update({ name, userId }, { name: newName });
    if (result.affected===0) {
        throw new HttpException("해당 자료를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
    }
    return  await this.fetchUserSubject(userId)
}

async deleteSubject(name:string, userId:number){
    const result = await this.subjectRepository.delete({name, userId})
    if (result.affected===0){
        throw new HttpException("해당 자료를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
    }
   return await this.fetchUserSubject(userId)
}

}
