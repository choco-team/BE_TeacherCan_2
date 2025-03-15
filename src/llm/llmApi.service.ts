import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AuthenticationService } from 'src/auth/authentication.service';
import { TiktokenModel } from 'tiktoken';

@Injectable()
export class LlmApiService {
    constructor(
        private readonly configService: ConfigService,
        private readonly authenticationService : AuthenticationService
    ) {}

    // LLM에 프롬프트 전송
    async fetchToLlm(prompt: string, userId: number): Promise<string> {
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

    async loadLlmModelInfo(){
        const apiKey = this.configService.get<string>("OPENAI_API_KEY");
        const apiUrl = this.configService.get<string>("OPENAI_URL");
        const model = this.configService.get<TiktokenModel>("LLM_MODEL");
        return {apiKey, apiUrl, model}
}



}
