import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Question } from './entities/question.entity';
import { User } from './entities/user.entity';
import { Subject } from './entities/subject.entity';
import { Session } from './entities/session.entity';
import { StudentAnswer } from './entities/studentAnswer.entity';
import { TokenUsage } from './entities/tokenUsage.entity';
import { Room } from './entities/room.entity';
import { Student } from './entities/student.entity';
import { Music } from './entities/music.entity';

// 독립적으로 환경 변수 로드
try {
  if (fs.existsSync('/.env')) {
    dotenv.config({ path: '/.env' });
    console.log('Environment variables loaded directly in AppDataSource');
  }
} catch (error) {
  console.error('Error loading .env file:', error);
}


export const AppDataSource = new DataSource({
  type: 'mysql', // 또는 'mariadb'
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'yourpassword',
  database: process.env.DATABASE_NAME || 'mydatabase',
  entities: [Question, User, Subject, Session, StudentAnswer, TokenUsage, Room, Student, Music],
  synchronize: process.env.LOCAL === 'true',
  logging: process.env.LOCAL === 'true',
  extra: {
    authPlugins: 'caching_sha2_password',
    ssl: process.env.LOCAL === 'false' ? {
      ca: fs.readFileSync(process.env.MYSQL_CA_PATH!, 'utf8'),
      cert: fs.readFileSync(process.env.MYSQL_CERT_PATH!, 'utf8'),
      key: fs.readFileSync(process.env.MYSQL_KEY_PATH!, 'utf8'),
      rejectUnauthorized: true
    } : undefined
  }
});
