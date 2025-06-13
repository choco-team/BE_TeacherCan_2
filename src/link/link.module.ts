import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoModule } from 'src/services/crypto.module';
import { LinkController } from './link.controller';
import { Links } from 'src/db/entities/links.entity';
import { LinkCode } from 'src/db/entities/linkCode.entity';
import { LinkSQLService } from './link.sql.service';
import { LinkService } from './link.service';

@Module({
  imports: [TypeOrmModule.forFeature([Links, LinkCode]), CryptoModule],
  providers: [LinkSQLService, LinkService],
  controllers: [LinkController]
})
export class LinkModule {}