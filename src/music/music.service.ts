import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Music } from 'src/db/entities/music.entity';
import { Room } from 'src/db/entities/room.entity';
import { Student } from 'src/db/entities/student.entity';
import { CryptoService } from 'src/services/crypto.service';
import { Repository } from 'typeorm';
import * as crypto from "crypto";

@Injectable()
export class MusicService {
constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,

        @InjectRepository(Music)
        private readonly musicRepository: Repository<Music>,

        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,

        private readonly cryptoService: CryptoService,  // 암호화 서비스 추가
) {}


async makeNewRoom(roomTitle){
const newRoom = await this.roomRepository.create({roomTitle})
const savedRoom = await this.roomRepository.save(newRoom)
return {roomId: savedRoom.id}
}

async getRoomTitle(roomId){
const room = await this.roomRepository.findOne({where: {id: roomId}})
return {roomTitle: room.roomTitle }
}

async getRoomInfomation(roomId){
const room = await this.roomRepository.findOne({where: {id: roomId}})
const musicList = await this.musicRepository.find({where: {roomId}, relations: ["student"]})
const studentList = await this.studentRepository.find({where: {roomId}})
const responseData = {roomTitle: room.roomTitle,
    studentList: studentList.map(student => this.cryptoService.decryptAES(student.encryptedName, student.ivName)),
    musicList: musicList.map(music => ({
        musicId: music.id,
        title: music.title,
        student: this.cryptoService.decryptAES(music.student.encryptedName, music.student.ivName),
        timeStamp: music.timeStamp
    })
    )
}
return responseData
}

async addStudentInRoom(roomId, name){
    const {encryptedData, iv}= this.cryptoService.encryptAES(name)
    const room = await this.roomRepository.findOne({where:{id:roomId}})
    if (!room) {throw new HttpException("방을 찾을 수 없습니다", HttpStatus.NOT_FOUND)}
    const nameHash = crypto.createHash('sha256').update(name).digest('hex')
    const findSameName = await this.studentRepository.find({where: {nameHash}})
    if (findSameName.length !==0) {throw new HttpException("방에 이름이 중복됩니다", HttpStatus.CONFLICT)}
    const student = this.studentRepository.create({encryptedName:encryptedData,
        ivName: iv,
        nameHash,
        roomId})
    await this.studentRepository.save(student)

}

async addMusicInRoom(roomId, musicId, title, student){
        const studentHashed = crypto.createHash('sha256').update(student).digest('hex')
        const studentData = await this.studentRepository.findOne({where: {nameHash: studentHashed}})
        const findMusic = await this.musicRepository.find({where: {roomId, musicId}})
        if (findMusic.length===1) {throw new HttpException("이미 신청한 곡입니다", HttpStatus.CONFLICT)}
        const music = this.musicRepository.create({studentId: studentData.id, title, musicId, roomId})
        return await this.musicRepository.save(music)
}

async removeMusicInRoom(roomId, musicId){
        const findMusic = await this.musicRepository.delete({roomId, musicId})
        if (findMusic.affected===0) {throw new HttpException("해당 음악을 찾을 수 없습니다", HttpStatus.NOT_FOUND)}
        return findMusic      
}
}
