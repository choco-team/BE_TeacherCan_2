import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { studentAnswerDataInterface } from 'src/dto/question.dto';

describe('LlmController', () => {
  let llmController: LlmController;
  let llmService: LlmService;

  // ✅ Mock LlmService
  const mockLlmService = {
    makeStudentPrompt: jest.fn(),
    checkTokens: jest.fn(),
    fetchToLlm: jest.fn(),
    calculateTokens: jest.fn(),
    fetchRemainingTokens: jest.fn().mockResolvedValue(5000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [{ provide: LlmService, useValue: mockLlmService }],
    }).compile();

    llmController = module.get<LlmController>(LlmController);
    llmService = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(llmController).toBeDefined();
  });

  // ✅ fetchStudentToLlm 테스트
  describe('fetchStudentToLlm', () => {
    const mockRequestData: studentAnswerDataInterface = {
      studentNumber: 123,
      questionId: 1,
      maxLength: 100,
      isLastQuesiotn: false,
    };

    it('should return GPT response when valid input is provided', async () => {
      mockLlmService.makeStudentPrompt.mockResolvedValue('mockPrompt');
      mockLlmService.checkTokens.mockResolvedValue(50);
      mockLlmService.fetchToLlm.mockResolvedValue('mockGPTResponse');
      mockLlmService.calculateTokens.mockResolvedValue(undefined);

      const result = await llmController.fetchStudentToLlm(mockRequestData, 1, 'mockSession');

      expect(result).toBe('mockGPTResponse');
      expect(mockLlmService.makeStudentPrompt).toHaveBeenCalledWith(
        'mockSession', 1, 123, 1, 100, false
      );
      expect(mockLlmService.checkTokens).toHaveBeenCalledWith('mockPrompt');
      expect(mockLlmService.fetchToLlm).toHaveBeenCalledWith('mockPrompt', 1, 50);
      expect(mockLlmService.calculateTokens).toHaveBeenCalledWith(50, 50, 1);
    });

    it('should throw BadRequestException if studentNumber is missing', async () => {
      const invalidRequestData = { ...mockRequestData, studentNumber: null };

      await expect(llmController.fetchStudentToLlm(invalidRequestData, 1, 'mockSession'))
        .rejects.toThrow(new HttpException('학생 번호가 없습니다!', HttpStatus.BAD_REQUEST));
    });

    it('should throw BadRequestException if questionId is missing', async () => {
      const invalidRequestData = { ...mockRequestData, questionId: null };

      await expect(llmController.fetchStudentToLlm(invalidRequestData, 1, 'mockSession'))
        .rejects.toThrow(new HttpException('문항 번호가 없습니다!', HttpStatus.BAD_REQUEST));
    });

    it('should throw InternalServerErrorException if LLM response is empty', async () => {
      mockLlmService.makeStudentPrompt.mockResolvedValue('mockPrompt');
      mockLlmService.checkTokens.mockResolvedValue(50);
      mockLlmService.fetchToLlm.mockResolvedValue(null); // ❌ LLM 응답이 없음

      await expect(llmController.fetchStudentToLlm(mockRequestData, 1, 'mockSession'))
        .rejects.toThrow(new HttpException('LLM 응답이 없습니다.', HttpStatus.INTERNAL_SERVER_ERROR));
    });
  });

  // ✅ fetchRemainingTokens 테스트
  describe('fetchRemainingTokens', () => {
    it('should return remaining tokens', async () => {
      const result = await llmController.fetchRemainingTokens(1);
      expect(result).toBe(5000);
      expect(mockLlmService.fetchRemainingTokens).toHaveBeenCalledWith(1);
    });
  });
});
