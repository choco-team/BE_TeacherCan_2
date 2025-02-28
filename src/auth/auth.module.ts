import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { KakaoStrategy } from './kakao.strategy';
import { UserModule } from '../user/user.module';
import { SessionSerializer } from './session.serializer';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/db/entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import { Session } from 'src/db/entities/session.entity';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './role.guard';
import { CryptoModule } from 'src/services/crypto.module';
import { CryptoService } from 'src/services/crypto.service';
import { RsaKey } from 'src/db/entities/rsaKey.entity';

@Module({
  imports: [ TypeOrmModule.forFeature([User, Session, RsaKey]),
  PassportModule.register({ session: true }),
  UserModule,
  CryptoModule,
  HttpModule],
  controllers: [AuthController],
  providers: [KakaoStrategy, SessionSerializer, CryptoService, AuthService, AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard, AuthService]
})
export class AuthModule {}

