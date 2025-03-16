import { Module, Scope } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { TokenUsage } from 'src/db/entities/tokenUsage.entity';
import { Question } from 'src/db/entities/question.entity';
import { Session } from 'src/db/entities/session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAnswer } from 'src/db/entities/studentAnswer.entity';
import { User } from 'src/db/entities/user.entity';
import { CryptoService } from 'src/services/crypto.service';
import { RsaKey } from 'src/db/entities/rsaKey.entity';
import { LlmApiService } from './llmApi.service';
import { PromptService } from './prompt.service';
import { TokenService } from './token.service';
import { QuestionManagementService } from 'src/question/questionManagement.service';
import { SessionService } from 'src/auth/session.service';
import { AnswerSheetService } from 'src/question/answerSheet.service';
import { AuthenticationService } from 'src/auth/authentication.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, TokenUsage, Question, Session, StudentAnswer, RsaKey])],
  controllers: [LlmController],
  providers: [LlmService,
    {provide: LlmApiService,
      useClass: LlmApiService,
      scope: Scope.REQUEST
    },
    CryptoService, LlmApiService, PromptService, TokenService, QuestionManagementService, SessionService, AnswerSheetService, AuthenticationService]
})
export class LlmModule {}
