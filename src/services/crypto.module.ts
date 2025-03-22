import { Module } from '@nestjs/common';
import { CryptoService } from '../services/crypto.service';

@Module({
    providers: [CryptoService],
    exports: [CryptoService], // ✅ 다른 모듈에서 사용 가능하게 설정
})
export class CryptoModule {}
