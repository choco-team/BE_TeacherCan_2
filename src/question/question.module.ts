import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from 'src/db/entities/subject.entity';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { CryptoService } from 'src/services/crypto.service';
import { RsaKey } from 'src/db/entities/rsaKey.entity';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { User } from 'src/db/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Subject, Question, RsaKey, StudentAnswer, User])],
  controllers: [QuestionController],
  providers: [QuestionService, CryptoService]
})
export class QuestionModule {}
