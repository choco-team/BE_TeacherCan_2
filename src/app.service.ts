import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
try {
  // nickname 컬럼 추가
  await queryRunner.query(`
    ALTER TABLE musics
    ADD COLUMN IF NOT EXISTS nickname VARCHAR(255) NULL;
  `);

  // FK 삭제 (FK 이름은 정확히 확인해야 함)
  await queryRunner.query(`
    ALTER TABLE musics
    DROP FOREIGN KEY FK_musics_roomId,
    DROP FOREIGN KEY FK_musics_studentId;
  `);

  // 컬럼 수정
  await queryRunner.query(`
    ALTER TABLE musics
    MODIFY roomId VARCHAR(255) NULL,
    MODIFY studentId INT NULL;
  `);

  await queryRunner.commitTransaction();
  console.log('[AppService] musics 테이블 수정 완료');
} catch (error) {
  await queryRunner.rollbackTransaction();
  console.error('[AppService] musics 테이블 수정 실패:', error.message);
} finally {
  await queryRunner.release();
}
  }
}
