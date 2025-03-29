import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from 'src/db/entities/room.entity';
import { Student } from 'src/db/entities/student.entity';
import { CryptoService } from 'src/services/crypto.service';
import { Repository } from 'typeorm';

@Injectable()
export class MusicStudentService {
constructor(
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
        private readonly cryptoService: CryptoService,  // 암호화 서비스 추가
) {}


async findStudentById(studentId) {
    const studentData = await this.studentRepository.findOne({where: {id: studentId}});
    
    if (!studentData) {
        throw new HttpException("학생을 찾을 수 없습니다", HttpStatus.NOT_FOUND);
    }
    
    const decryptedName = await this.cryptoService.decryptAES(studentData.encryptedName, studentData.ivName);
    return {...studentData, name: decryptedName};
}


async findStudentByNameAndRoomId(name, roomId) {
    const nameHash = this.cryptoService.hashData(name);
    const studentData = await this.studentRepository.findOne({where: {nameHash, roomId}});
    
    if (!studentData) {
        throw new HttpException("학생을 찾을 수 없습니다", HttpStatus.NOT_FOUND);
    }
    
    const decryptedStudent = await this.cryptoService.decryptAES(studentData.encryptedName, studentData.ivName);
    return {...studentData, name: decryptedStudent};
}
async findStudentInRoom(roomId) {
    const studentList = await this.studentRepository.find({where: {roomId}});
    const decryptedStudentList = await Promise.all(
        studentList.map(async student => ({
            id: student.id, 
            name: await this.cryptoService.decryptAES(student.encryptedName, student.ivName)
        }))
    );
    return decryptedStudentList;
}

async addStudentInRoom(roomId, name){
    const {encryptedData, iv}= await this.cryptoService.encryptAES(name)
    const nameHash = this.cryptoService.hashData(name)
    const findSameName = await this.studentRepository.find({where: {nameHash, roomId}})
    if (findSameName.length !==0) {throw new HttpException("방의 학생 이름이 중복됩니다", HttpStatus.CONFLICT)}
    const student = this.studentRepository.create({encryptedName:encryptedData,
        ivName: iv,
        nameHash,
        roomId})
    const result = await this.studentRepository.save(student)
    if (!result) throw new HttpException("방 생성에 실패하였습니다", HttpStatus.INTERNAL_SERVER_ERROR)
}
}
