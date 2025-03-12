import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/entities/user.entity';
import { Question } from '../db/entities/question.entity';
import { TokenUsage } from '../db/entities/tokenUsage.entity';
import { Session } from '../db/entities/session.entity';
import { StudentAnswer } from '../db/entities/studentAnswer.entity';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../services/crypto.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios'); // Axios를 Mock 처리

describe('LlmService', () => {
  let llmService: LlmService;
  let userRepository: Repository<User>;
  let questionRepository: Repository<Question>;
  let sessionRepository: Repository<Session>;
  let studentAnswerRepository: Repository<StudentAnswer>;
  let tokenUsageRepository: Repository<TokenUsage>;
  let configService: ConfigService;
  let cryptoService: CryptoService;

  // ✅ Mock Repository 및 서비스 설정
  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockQuestionRepository = {
    findOne: jest.fn(),
  };

  const mockSessionRepository = {
    findOne: jest.fn(),
  };

  const mockStudentAnswerRepository = {
    findOne: jest.fn(),
  };

  const mockTokenUsageRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      const configMap = {
        LLM_MODEL: 'gpt-4o-mini',
        OPENAI_API_KEY: 'mock-api-key',
        OPENAI_URL: 'https://mock-openai.com',
      };
      return configMap[key];
    }),
  };

  const mockCryptoService = {
    encryptAES: jest.fn().mockReturnValue({ encryptedData: 'mockEncrypted', iv: 'mockIV' }),
    decryptAES: jest.fn().mockImplementation((data) => data), // 복호화는 원본 그대로 반환
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Question), useValue: mockQuestionRepository },
        { provide: getRepositoryToken(TokenUsage), useValue: mockTokenUsageRepository },
        { provide: getRepositoryToken(Session), useValue: mockSessionRepository },
        { provide: getRepositoryToken(StudentAnswer), useValue: mockStudentAnswerRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CryptoService, useValue: mockCryptoService },
      ],
    }).compile();

    llmService = module.get<LlmService>(LlmService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    questionRepository = module.get<Repository<Question>>(getRepositoryToken(Question));
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
    studentAnswerRepository = module.get<Repository<StudentAnswer>>(getRepositoryToken(StudentAnswer));
    tokenUsageRepository = module.get<Repository<TokenUsage>>(getRepositoryToken(TokenUsage));
    configService = module.get<ConfigService>(ConfigService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(llmService).toBeDefined();
  });

  // ✅ `fetchRemainingTokens` 테스트
  describe('fetchRemainingTokens', () => {
    it('should return remaining tokens', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ remainingTokens: 5000 });

      const result = await llmService.fetchRemainingTokens(1);
      expect(result).toBe(5000);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NOT_FOUND if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(llmService.fetchRemainingTokens(1)).rejects.toThrow(
        new HttpException('사용자 정보를 찾지 못하였습니다', HttpStatus.NOT_FOUND),
      );
    });
  });

  // ✅ `fetchToLlm` 테스트
  describe('fetchToLlm', () => {
    it('should return response from LLM API', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ remainingTokens: 1000 });

      (axios.post as jest.Mock).mockResolvedValueOnce({
        data: { choices: [{ message: { content: 'mock response' } }] },
      });

      const result = await llmService.fetchToLlm('mock prompt', 1, 50);

      expect(result).toBe('mock response');
      expect(axios.post).toHaveBeenCalledWith(
        'https://mock-openai.com',
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'mock prompt' }],
        }),
        expect.any(Object),
      );
    });

    it('should throw NOT_FOUND if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(llmService.fetchToLlm('mock prompt', 1, 50)).rejects.toThrow(
        new HttpException('사용자 정보를 찾지 못하였습니다', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw FORBIDDEN if tokens are insufficient', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ remainingTokens: 10 });

      await expect(llmService.fetchToLlm('mock prompt', 1, 50)).rejects.toThrow(
        new HttpException('토큰이 부족합니다', HttpStatus.FORBIDDEN),
      );
    });
  });

  // ✅ `calculateTokens` 테스트
  describe('calculateTokens', () => {
    it('should subtract tokens and save data', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 1, remainingTokens: 1000 });
      mockTokenUsageRepository.create.mockReturnValue({ id: 1 });

      await llmService.calculateTokens(100, 50, 1);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ remainingTokens: 1000 - (100 + 50 * 3) }),
      );
      expect(mockTokenUsageRepository.create).toHaveBeenCalled();
      expect(mockTokenUsageRepository.save).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(llmService.calculateTokens(100, 50, 1)).rejects.toThrow(
        new HttpException('사용자 정보를 찾지 못했습니다', HttpStatus.NOT_FOUND),
      );
    });
  });
});
