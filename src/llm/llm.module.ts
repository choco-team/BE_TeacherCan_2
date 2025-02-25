import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { TokenUsage } from 'src/db/entities/tokenUsage.entity';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([TokenUsage, Question, Session])],
  controllers: [LlmController],
  providers: [LlmService]
})
export class LlmModule {}
