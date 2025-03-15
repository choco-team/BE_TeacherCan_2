import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CryptoService } from 'src/services/crypto.service'; // 암호화 서비스 추가
import { studentInterface } from 'src/dto/user.dto';
import { AuthenticationService } from 'src/auth/authentication.service';
import { QuestionAccessService } from 'src/question/questionAccess.service';
import { decodedQuestionToken } from 'src/dto/question.dto';

@Injectable()
export class StudentInfoService {
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly cryptoService: CryptoService,
        private readonly questionAccessService: QuestionAccessService
    ) {}

    /** 🔹 학생 정보 가져오기 (복호화) */
    async getStudentInfo(userId: number) {
        const user = await this.authenticationService.findUserById(userId)
        const decryptedStudentInfo:studentInterface = JSON.parse(this.cryptoService.decryptAES(user.encryptedStudentInfo, user.ivStudentInfo));

        return decryptedStudentInfo;
    }

    async checkDuplicatedStudent(data:studentInterface[]){
    const numbers = new Set();
    const hasDuplicate = data.some(student => numbers.has(student.number) || !numbers.add(student.number));
    
    if (hasDuplicate) {
        throw new HttpException("학생 번호는 중복이 있어서는 안됩니다", HttpStatus.BAD_REQUEST);
    }

}
    /** 🔹 학생 정보 저장 (암호화) */
    async checkAndSaveStudentInfo(data:studentInterface[], userId: number) {
       await this.checkDuplicatedStudent(data) 
       const user = await this.authenticationService.findUserById(userId)
       
        // 학생 정보를 암호화하여 저장
        const encryptedStudentInfo = this.cryptoService.encryptAES(JSON.stringify(data));
        user.encryptedStudentInfo = encryptedStudentInfo.encryptedData;
        user.ivStudentInfo = encryptedStudentInfo.iv

        return await this.authenticationService.modifyUserInfo(user);
    }

    /** 🔹 토큰에 맞는 학생 정보 가져오기 */
    async getStudentInfoForInput(token: string) {
               const verifyToken:decodedQuestionToken = await this.questionAccessService.verifyToken(token);       
               const userData = await this.authenticationService.findUserById(verifyToken.user);
               const StudentInfo = JSON.parse(this.cryptoService.decryptAES(userData.encryptedStudentInfo, userData.ivStudentInfo));
        return StudentInfo;
    }

}