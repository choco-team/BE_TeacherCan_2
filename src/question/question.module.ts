import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from 'src/db/entities/subject.entity';
import { Question } from 'src/db/entities/question.entity';
import { CryptoService } from 'src/services/crypto.service';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { QuestionManagementService } from './questionManagement.service';
import { AnswerSheetService } from './answerSheet.service';
import { QuestionAccessService } from './questionAccess.service';
import { AuthenticationService } from 'src/auth/authentication.service';
import { CryptoModule } from 'src/services/crypto.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Question, StudentAnswer]), CryptoModule, AuthModule, QuestionModule],
  controllers: [QuestionController],
  providers: [CryptoService, QuestionManagementService, AnswerSheetService, QuestionAccessService, AuthenticationService],
  exports: [QuestionManagementService, AnswerSheetService, QuestionAccessService]
})
export class QuestionModule {}
