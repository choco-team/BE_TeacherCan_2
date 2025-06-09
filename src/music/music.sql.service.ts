import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Music } from 'src/db/entities/music.entity';
import { Room } from 'src/db/entities/room.entity';
import { Student } from 'src/db/entities/student.entity';
import { CryptoService } from 'src/services/crypto.service';
import { Repository } from 'typeorm';

@Injectable()
export class MusicSQLService {
constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
        @InjectRepository(Music)
        private readonly musicRepository: Repository<Music>,
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
        private readonly cryptoService: CryptoService
) {}

async getRoomTitle(roomId){
const room = await this.roomRepository.findOne({where: {id: roomId}})
return {roomTitle: room.roomTitle }
}

async getRoomInfomation(roomId){
const room = await this.roomRepository.findOne({where: {id: roomId}})
if (!room) throw new HttpException('방을 찾을 수 없습니다', HttpStatus.NOT_FOUND)
const musicList = await this.getAllMusicInRoom(roomId)
const studentList = await this.findStudentInRoom(roomId)
const responseData = {roomTitle: room.roomTitle,
    studentList: studentList,
    musicList: musicList.map(music => ({
        musicId: music.musicId,
        title: music.title,
        student: studentList.find(student => student.id===music.studentId)?.name,
        timeStamp: music.timeStamp
        })
    )
}
return responseData
}

private async getAllMusicInRoom(roomId){
    return await this.musicRepository.find({where: {roomId}})
  }

private  async findStudentInRoom(roomId) {
    const studentList = await this.studentRepository.find({ where: { roomId } });

    const decrypted = await Promise.all(
        studentList.map(async (student) => ({
          id: student.id,
          name: ''
        }))
      );    
      return decrypted;
    }
    

}

