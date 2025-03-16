import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { CryptoService } from 'src/services/crypto.service';
import { StudentInfoService } from './studentInfo.service';
import { StudentAnswerService } from './studentAnswer.service';
import { AuthModule } from 'src/auth/auth.module';
import { QuestionModule } from 'src/question/question.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { RsaKey } from 'src/db/entities/rsaKey.entity';

@Module({
    imports: [AuthModule, QuestionModule, TypeOrmModule.forFeature([StudentAnswer, RsaKey])],
  controllers: [StudentController],
  providers: [StudentInfoService, StudentAnswerService, CryptoService]
})
export class StudentModule {}
