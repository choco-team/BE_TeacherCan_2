import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from 'src/db/entities/subject.entity';
import { Question } from 'src/db/entities/question.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { QuestionManagementService } from './questionManagement.service';
import { AnswerSheetService } from './answerSheet.service';
import { QuestionAccessService } from './questionAccess.service';
import { AuthenticationService } from 'src/auth/authentication.service';
import { CryptoModule } from 'src/services/crypto.module';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/db/entities/user.entity';
import { SubjectModule } from 'src/subject/subject.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Question, StudentAnswer, User]), CryptoModule, AuthModule, CryptoModule, SubjectModule],
  controllers: [QuestionController],
  providers: [QuestionManagementService, AnswerSheetService, QuestionAccessService, AuthenticationService],
  exports: [QuestionManagementService, AnswerSheetService, QuestionAccessService]
})
export class QuestionModule {}
