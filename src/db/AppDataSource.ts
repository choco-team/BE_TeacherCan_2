import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { RsaKey } from './entities/rsaKey.entity';
import { Room } from './entities/room.entity';
import { Student } from './entities/student.entity';
import { Music } from './entities/music.entity';

ConfigModule.forRoot(); // 환경 변수 로드

export const AppDataSource = new DataSource({
  type: 'mysql', // 또는 'mariadb'
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'yourpassword',
  database: process.env.DATABASE_NAME || 'mydatabase',
  entities: [User, Session,  RsaKey, Room, Student, Music], // 엔티티 자동 로드
  logging: process.env.LOCAL === 'true', // 개발 환경에서만 로그 활성화
  extra: {
    authPlugins: 'caching_sha2_password'
  }
});
