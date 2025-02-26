import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { TokenUsage } from 'src/db/entities/tokenUsage.entity';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { User } from 'src/db/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TokenUsage, Question, Session, StudentAnswer])],
  controllers: [LlmController],
  providers: [LlmService]
})
export class LlmModule {}
