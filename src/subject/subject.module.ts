import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/db/entities/user.entity';
import { Subject } from 'src/db/entities/subject.entity';
import { CryptoModule } from 'src/services/crypto.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subject]), CryptoModule],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService]
})
export class SubjectModule {}
