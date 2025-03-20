import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AuthenticationService } from 'src/auth/authentication.service';
import { TiktokenModel } from 'tiktoken';

@Injectable()
export class LlmApiService {
    private modelConfig: Readonly<{
        apiKey: string;
        apiUrl: string;
        model: TiktokenModel;
    }>;
    constructor(
        private readonly configService: ConfigService,
        private readonly authenticationService : AuthenticationService,
    ) {}

    // LLM에 프롬프트 전송
    async fetchToLlm(prompt: string, userId: number, promptTokens:number): Promise<string> {
        const {apiKey, apiUrl, model} = await this.loadLlmModelInfo()
        const userData = await this.authenticationService.findUserById(userId)

            const response = await axios.post(
                apiUrl,
                {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: Math.min(Number(userData.remainingTokens) - Number(promptTokens), 3000),
                    temperature: 0.7,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                },
            );

            return response.data.choices[0]?.message?.content ?? '';
    }

    async onModuleInit() {
        // 초기화 시 한 번만 구성 로드하고 불변 객체로 만들기
        this.modelConfig = Object.freeze({
            apiKey: this.configService.get<string>("OPENAI_API_KEY"),
            apiUrl: this.configService.get<string>("OPENAI_URL"),
            model: this.configService.get<TiktokenModel>("LLM_MODEL")
        });
    }

    async loadLlmModelInfo() {
        return this.modelConfig; // 캐시된 불변 설정 반환
    }
}


