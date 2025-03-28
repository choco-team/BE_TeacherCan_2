import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from 'src/db/entities/room.entity';
import { Repository } from 'typeorm';
import { MusicInfoService } from './musicInfo.service';
import { MusicStudentService } from './musicStudent.service';

@Injectable()
export class MusicRoomService {
constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
        private readonly musicInfoService: MusicInfoService,
        private readonly musicStudentService: MusicStudentService
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
const musicList = await this.musicInfoService.getAllMusicInRoom(roomId)
const studentList = await this.musicStudentService.findStudentInRoom(roomId)
const responseData = {roomTitle: room.roomTitle,
    studentList: studentList.map(student => student.name),
    musicList: musicList.map(music => ({
        musicId: music.musicId,
        roomTitle: music.title,
        student: studentList.find(student => student.id===music.studentId)?.name,
        timeStamp: music.timeStamp
        })
    )
}
return responseData
}

}
