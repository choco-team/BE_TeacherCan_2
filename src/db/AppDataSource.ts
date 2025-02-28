import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { Question } from './entities/question.entity';
import { User } from './entities/user.entity';
import { Subject } from './entities/subject.entity';
import { Session } from './entities/session.entity';
import { StudentAnswer } from './entities/studentAnswer.entity';
import { TokenUsage } from './entities/tokenUsage.entity';
import { RsaKey } from './entities/rsaKey.entity';

ConfigModule.forRoot(); // 환경 변수 로드

export const AppDataSource = new DataSource({
  type: 'mysql', // 또는 'mariadb'
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'yourpassword',
  database: process.env.DATABASE_NAME || 'mydatabase',
  entities: [Question, User, Subject, Session, StudentAnswer, TokenUsage, RsaKey], // 엔티티 자동 로드
  synchronize: process.env.LOCAL === "true" , // 개발 환경에서만 동기화
  logging: process.env.LOCAL === 'true', // 개발 환경에서만 로그 활성화
  extra: {
    authPlugins: 'caching_sha2_password'
  }
});
