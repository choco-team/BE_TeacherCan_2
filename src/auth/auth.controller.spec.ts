import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieInterceptor } from 'src/interceptor/cookie.interceptor';
import { UserIdResponseDto } from 'src/dto/response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    getKakaoAccessToken: jest.fn().mockResolvedValue('mockAccessToken'),
    getKakaoUser: jest.fn().mockResolvedValue({ id: '12345', email: 'test@example.com' }),
    validateKakaoUser: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
    setSession: jest.fn().mockResolvedValue('mockSessionId'),
    logout: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).overrideInterceptor(CookieInterceptor).useValue(jest.fn()).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('kakaoLoginCallback', () => {
    it('should return userId on successful login', async () => {
      const req = {} as any; // Mock request object
      const result = await authController.kakaoLoginCallback('mockCode', req);

      expect(mockAuthService.getKakaoAccessToken).toHaveBeenCalledWith('mockCode');
      expect(mockAuthService.getKakaoUser).toHaveBeenCalledWith('mockAccessToken');
      expect(mockAuthService.validateKakaoUser).toHaveBeenCalledWith({ id: '12345', email: 'test@example.com' });
      expect(mockAuthService.setSession).toHaveBeenCalledWith({ id: 1, email: 'test@example.com' });

      expect(result).toEqual({ userId: 1 });
      expect(req.sessionId).toBe('mockSessionId');
    });

    it('should throw an exception if user validation fails', async () => {
      mockAuthService.validateKakaoUser.mockResolvedValueOnce(null);

      await expect(authController.kakaoLoginCallback('mockCode', {} as any))
        .rejects.toThrow(new HttpException('로그인 실패', HttpStatus.UNAUTHORIZED));
    });
  });

  describe('checkSession', () => {
    it('should return userId if session is valid', async () => {
      const result = await authController.checkSession(1);
      expect(result).toEqual({ userId: 1 });
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return success message', async () => {
      const result = await authController.logout(1);

      expect(mockAuthService.logout).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: '로그아웃 성공' });
    });
  });
});
