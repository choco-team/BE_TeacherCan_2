import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { User } from 'src/db/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from 'src/db/entities/session.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Session])],
  controllers: [StudentController],
  providers: [StudentService]
})
export class StudentModule {}
