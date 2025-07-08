import { DataSource } from 'typeorm';
import 'dotenv/config'; // ✅ 환경 변수 직접 로드
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { RsaKey } from './entities/rsaKey.entity';
import { Room } from './entities/room.entity';
import { Student } from './entities/student.entity';
import { Music } from './entities/music.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'yourpassword',
  database: process.env.DATABASE_NAME || 'mydatabase',
  entities: [User, Session,  RsaKey, Room, Student, Music],
  logging: process.env.LOCAL === 'true',
  ssl: { rejectUnauthorized: false},
});
