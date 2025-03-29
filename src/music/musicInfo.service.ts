import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Music } from 'src/db/entities/music.entity';
import { Repository } from 'typeorm';
import { MusicStudentService } from './musicStudent.service';

@Injectable()
export class MusicInfoService {
constructor(
        @InjectRepository(Music)
        private readonly musicRepository: Repository<Music>,
        private readonly musicStudentService: MusicStudentService
) {}

async getAllMusicInRoom(roomId){
  return await this.musicRepository.find({where: {roomId}})
}

async addMusicInRoom(roomId:string, musicId:string, title:string, student:string){
        const studentData = await this.musicStudentService.findStudentByNameAndRoomId(student, roomId)
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
