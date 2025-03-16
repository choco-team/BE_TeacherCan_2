import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RsaKey } from '../db/entities/rsaKey.entity';
import { createPublicKey, publicEncrypt } from 'crypto';
import * as crypto from 'crypto';
import * as fs from 'fs';

const AES_KEY_PATH = 'aes_key.enc'; // AES 키를 저장할 파일 경로
const RSA_PRIVATE_KEY = fs.readFileSync('private_key.pem','utf8'); // 환경변수에서 RSA 비밀키 로드

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

    /** 🔹 서버 실행 시 RSA 공개키가 DB에 없으면 생성하여 저장 */
    async ensureRSAKeyExists() {
        const existingKey = await this.rsaKeyRepository.findOne({
            where: {}, // 🔹 모든 데이터를 대상으로 정렬
            order: { createdAt: 'DESC' } // 🔹 가장 최신 키 조회
        });
                if (!existingKey) {
            if (!RSA_PRIVATE_KEY) {
                throw new Error('RSA 비밀키가 없습니다.');
            }

            // RSA 비밀키에서 공개키 생성
            const publicKey = createPublicKey(RSA_PRIVATE_KEY)
                .export({ type: 'pkcs1', format: 'pem' })
                .toString('utf-8'); // 🔥 여기서 string으로 변환

                
            // 공개키를 DB에 저장
            await this.rsaKeyRepository.save({ publicKey, keyVersion: 'v1' });
            console.log('✅ RSA 공개키가 생성되어 DB에 저장되었습니다.');
        } else {
            console.log('🔹 RSA 공개키가 이미 존재합니다.');
        }
    }

    /** 🔹 AES 키 생성 및 RSA 공개키로 암호화 후 파일 저장 */
    async generateAndEncryptAESKey() {
        if (!fs.existsSync(AES_KEY_PATH)) {
            console.log('🔹 AES 키를 생성하고 암호화 중...');

            const rsaKey = await this.rsaKeyRepository.findOne({where: {}, order:{createdAt:'DESC'}});
            if (!rsaKey) throw new Error('RSA 공개키가 없습니다.');

            const aesKey = Buffer.from(require('crypto').randomBytes(32)); // 256비트 AES 키
            const encryptedAESKey = publicEncrypt(rsaKey.publicKey, aesKey);

            fs.writeFileSync(AES_KEY_PATH, encryptedAESKey);
            console.log('✅ AES 키가 암호화되어 파일에 저장되었습니다.');
        } else {
            console.log('🔹 AES 키 파일이 이미 존재합니다.');
        }
    }

    /** 🔹 AES 키 복호화하여 로드 */
    private async decryptAESKey(): Promise<Buffer> {
        if (!fs.existsSync(AES_KEY_PATH)) {
            await this.ensureRSAKeyExists()
            await this.generateAndEncryptAESKey()        }
        if (!RSA_PRIVATE_KEY) {
            throw new Error('RSA 비밀키가 환경변수에 없습니다.');
        }

        const encryptedAESKey = fs.readFileSync(AES_KEY_PATH);
        return crypto.privateDecrypt(RSA_PRIVATE_KEY, encryptedAESKey);
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
