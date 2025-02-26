import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { User } from 'src/db/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from 'src/db/entities/session.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { Question } from 'src/db/entities/question.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Session, StudentAnswer, Question])],
  controllers: [StudentController],
  providers: [StudentService]
})
export class StudentModule {}
