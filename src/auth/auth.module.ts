import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { KakaoStrategy } from './kakao.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/db/entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import { Session } from 'src/db/entities/session.entity';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './role.guard';
import { CryptoModule } from 'src/services/crypto.module';
import { CryptoService } from 'src/services/crypto.service';
import { AuthenticationService } from './authentication.service';
import { SessionService } from './session.service';
import { OauthService } from './oauth.service';
import { AuthService } from './auth.service';

@Module({
  imports: [ TypeOrmModule.forFeature([User, Session]),
  PassportModule.register({ session: true }),
  CryptoModule,
  HttpModule],
  controllers: [AuthController],
  providers: [KakaoStrategy, CryptoService, AuthenticationService, SessionService, OauthService, AuthGuard, RolesGuard, AuthService],
  exports: [AuthGuard, RolesGuard, AuthenticationService, SessionService, AuthService]
})
export class AuthModule {}

