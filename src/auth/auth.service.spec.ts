import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CryptoService } from '../services/crypto.service';
import { User } from '../db/entities/user.entity';
import { Session } from '../db/entities/session.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let sessionRepository: Repository<Session>;
  let httpService: HttpService;
  let cryptoService: CryptoService;

  // ✅ Mock Repository & Services
  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockSessionRepository = {
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
      get: jest.fn(),
    },
  };

  const mockCryptoService = {
    encryptAES: jest.fn().mockReturnValue({ encryptedData: 'mockEncrypted', iv: 'mockIV' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Session), useValue: mockSessionRepository },
        { provide: HttpService, useValue: mockHttpService },
        { provide: CryptoService, useValue: mockCryptoService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
    httpService = module.get<HttpService>(HttpService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  // ✅ 카카오 액세스 토큰 요청 테스트
  describe('getKakaoAccessToken', () => {
    it('should throw an error if request fails', async () => {
      mockHttpService.axiosRef.post.mockRejectedValueOnce({
        response: { data: '카카오 액세스 토큰 요청 실패' }
      });

      await expect(authService.getKakaoAccessToken('mockCode')).rejects.toThrow('카카오 액세스 토큰 요청 실패');
    });
  });

  describe('getKakaoUser', () => {
    it('should throw an error if request fails', async () => {
      mockHttpService.axiosRef.get.mockRejectedValueOnce({
        response: { data: '카카오 사용자 정보 요청 실패' }
      });

      await expect(authService.getKakaoUser('mockAccessToken')).rejects.toThrow('카카오 사용자 정보 요청 실패');
    });
  });

  describe('validateKakaoUser', () => {
    it('should create a new user if not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockUserRepository.save.mockResolvedValueOnce(new User());

      const result = await authService.validateKakaoUser({ id: '67890' });

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        provider: 'kakao',
        encryptedOauthId: 'mockEncrypted',
        ivOauthId: 'mockIV',
        encryptedStudentInfo: 'mockEncrypted',
        ivStudentInfo: 'mockIV',
        remainingTokens: 1000000,
      });
    });
  });
  
  // ✅ 세션 생성 테스트
  describe('setSession', () => {
    it('should create a session and return session id', async () => {
      mockSessionRepository.delete.mockResolvedValueOnce({ affected: 1 });
      mockSessionRepository.create.mockReturnValue({ id: 'mockSessionId' });
      mockSessionRepository.save.mockResolvedValueOnce({ id: 'mockSessionId' });

      const result = await authService.setSession({ id: 1 } as User);
      expect(result).toBe('mockSessionId');
      expect(mockSessionRepository.save).toHaveBeenCalled();
    });
  });

  // ✅ 세션을 통한 사용자 조회 테스트
  describe('getUserBySession', () => {
    it('should return user if session exists', async () => {
      mockSessionRepository.findOne.mockResolvedValueOnce({
        id: 'mockSessionId',
        user: { id: 1, provider: 'kakao' },
      });

      const result = await authService.getUserBySession('mockSessionId');
      expect(result).toEqual({ id: 1, provider: 'kakao' });
    });

    it('should return null if session is not found', async () => {
      mockSessionRepository.findOne.mockResolvedValueOnce(null);

      const result = await authService.getUserBySession('invalidSessionId');
      expect(result).toBeNull();
    });
  });

  // ✅ 로그아웃 테스트
  describe('logout', () => {
    it('should delete session and return success', async () => {
      mockSessionRepository.delete.mockResolvedValueOnce({ affected: 1 });

      await expect(authService.logout(1)).resolves.toBeUndefined();
      expect(mockSessionRepository.delete).toHaveBeenCalledWith({ userId: 1 });
    });

    it('should throw an error if no session was deleted', async () => {
      mockSessionRepository.delete.mockResolvedValueOnce({ affected: 0 });

      await expect(authService.logout(1)).rejects.toThrow(
        new HttpException('서버 오류가 발생하였습니다', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });
});
