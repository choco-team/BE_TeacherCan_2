import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { RsaKey } from './entities/rsaKey.entity';
import { Room } from './entities/room.entity';
import { Student } from './entities/student.entity';
import { Music } from './entities/music.entity';

ConfigModule.forRoot(); // .env 로드

const isLocal = process.env.LOCAL === 'true';

export const AppDataSource = new DataSource({
  type: 'mysql',
  ...(isLocal
    ? {
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number(process.env.DATABASE_PORT) || 3306,
      }
    : {
        socketPath: process.env.DB_SOCKET_PATH || '/cloudsql/teachercan-436815:asia-northeast1:teachercan',
      }),
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'yourpassword',
  database: process.env.DATABASE_NAME || 'mydatabase',
  entities: [User, Session, RsaKey, Room, Student, Music],
  logging: isLocal,
  extra: {
    authPlugins: 'caching_sha2_password',
  },
});
