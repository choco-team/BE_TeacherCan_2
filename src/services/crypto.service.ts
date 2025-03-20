import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RsaKey } from '../db/entities/rsaKey.entity';
import * as crypto from 'crypto';


@Injectable()
export  class CryptoService {
    private aesKey: Buffer; // 🔹 AES 키 저장

     constructor(
        @InjectRepository(RsaKey)
        private readonly rsaKeyRepository: Repository<RsaKey>,
    ) {}

    async onModuleInit() {
        // 모듈 초기화 단계에서 안전하게 키 로드
        this.aesKey = await this.decryptAESKey();
        console.log('✅ AES key successfully loaded');
    }


    /** 🔹 AES 키 복호화하여 로드 */
    private async decryptAESKey(): Promise<Buffer> {
        const AES_KEY = process.env.AES_KEY
        return Buffer.from(AES_KEY, 'base64') ;
    }

    async getAesKey(): Promise<Buffer> {
        if (!this.aesKey) {
            this.aesKey = await this.decryptAESKey();
        }
        return this.aesKey;
    }

    /** 🔹 AES 암호화 */
   async encryptAES(plaintext: string): Promise<{ encryptedData: string; iv: string }> {
        const key = await this.getAesKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { encryptedData: encrypted, iv: iv.toString('hex') };    }

    /** 🔹 AES 복호화 */
    async decryptAES(encryptedData: string, iv: string): Promise<string> {
        const key = await this.getAesKey();
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    hashData(plaintext:string){
       return crypto.createHash('sha256').update(plaintext).digest('hex')
    }
}
