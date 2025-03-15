import { Injectable, Scope } from '@nestjs/common';

import { LlmApiService } from './llmApi.service';
import { PromptService } from './prompt.service';
import { TokenService } from './token.service';
import { studentAnswerDataInterface } from 'src/dto/question.dto';

@Injectable({scope:Scope.REQUEST})
export class LlmService {
    constructor(
        private readonly llmApiService: LlmApiService,
        private readonly promptService: PromptService,
        private readonly tokenService: TokenService
    ) {}

    async fetchStudentToLlm(body:studentAnswerDataInterface, sessionId:string, userId:number){
    const llmModel = await this.llmApiService.loadLlmModelInfo()
          // 프롬프트 생성
          const prompt = await this.promptService.makeStudentPrompt(sessionId,
            body.studentNumber,
            body.questionId,
            body.maxLength,
            body.isLastQuesiotn);
      
          // 입력 토큰 계산
          const usedInputToken = await this.tokenService.checkTokens(prompt);
      
          // LLM에 프롬프트 전송하기
          const response = await this.llmApiService.fetchToLlm(prompt, userId, usedInputToken);
      
          // 출력 토큰 계산
          const usedOutputToken = await this.tokenService.checkTokens(response);
          
          const totalTokens = await this.tokenService.calculateTokens(usedInputToken, usedOutputToken);
          await this.tokenService.saveTokenUsages(userId, usedInputToken, usedOutputToken, totalTokens, llmModel.model)
      
          return response;

}

}
