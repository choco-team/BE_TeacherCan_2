import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RsaKey } from '../db/entities/rsaKey.entity';
import { CryptoService } from '../services/crypto.service';

@Module({
    imports: [TypeOrmModule.forFeature([RsaKey])], // ✅ RsaKeyRepository 제공
    providers: [CryptoService],
    exports: [CryptoService, TypeOrmModule.forFeature([RsaKey])], // ✅ 다른 모듈에서 사용 가능하게 설정
})
export class CryptoModule {}
