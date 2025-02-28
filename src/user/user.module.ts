import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../db/entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CryptoService } from 'src/services/crypto.service';
import { RsaKey } from 'src/db/entities/rsaKey.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, RsaKey])],
  controllers: [UserController],
  providers: [UserService, CryptoService],
  exports: [UserService]
})
export class UserModule {}
