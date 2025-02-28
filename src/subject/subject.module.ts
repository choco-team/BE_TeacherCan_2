import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/db/entities/user.entity';
import { Subject } from 'src/db/entities/subject.entity';
import { CryptoService } from 'src/services/crypto.service';
import { RsaKey } from 'src/db/entities/rsaKey.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subject, RsaKey])],
  controllers: [SubjectController],
  providers: [SubjectService, CryptoService]
})
export class SubjectModule {}
