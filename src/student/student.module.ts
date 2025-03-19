import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentInfoService } from './studentInfo.service';
import { StudentAnswerService } from './studentAnswer.service';
import { AuthModule } from 'src/auth/auth.module';
import { QuestionModule } from 'src/question/question.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { CryptoModule } from 'src/services/crypto.module';

@Module({
    imports: [AuthModule, QuestionModule, TypeOrmModule.forFeature([StudentAnswer]), CryptoModule],
  controllers: [StudentController],
  providers: [StudentInfoService, StudentAnswerService]
})
export class StudentModule {}
