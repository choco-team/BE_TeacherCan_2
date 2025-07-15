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

    // 방 생성
    async createRoom(roomId: string, roomTitle: string) {
        const room = this.roomRepository.create({
            id: roomId,
            roomTitle,
            connectedAt: new Date()
        });
        
        return await this.roomRepository.save(room);
    }

    // 방 제목 조회
    async getRoomTitle(roomId: string) {
        const room = await this.roomRepository.findOne({where: {id: roomId}});
        if (!room) {
            throw new HttpException('방을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
        }
        return {roomTitle: room.roomTitle};
    }

    // 방 상세 정보 조회
    async getRoomInfomation(roomId: string) {
        const room = await this.roomRepository.findOne({where: {id: roomId}});
        if (!room) {
            throw new HttpException('방을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
        }
        
        const musicList = await this.getAllMusicInRoom(roomId);
        const studentList = await this.findStudentInRoom(roomId);
        
        const responseData = {
            roomTitle: room.roomTitle,
            studentList: studentList,
            musicList: musicList.map(music => ({
                musicId: music.musicId,
                title: music.title,
                student: music.studentName,
                timeStamp: music.timeStamp
            }))
        };
        
        return responseData;
    }

    // 방의 모든 음악 조회 (public으로 변경)
    async getAllMusicInRoom(roomId: string) {
        return await this.musicRepository.find({
            where: {roomId},
            order: {timeStamp: 'ASC'}, // 시간순 정렬
            select: ['id', 'musicId', 'roomId', 'studentName', 'title'], // 필요한 필드만 선택
        });
    }

    // 방의 학생 목록 조회 (public으로 변경)
    async findStudentInRoom(roomId: string) {
        const studentList = await this.studentRepository.find({ where: { roomId } });

        const decrypted = await Promise.all(
            studentList.map(async (student) => ({
                id: student.id,
                name: '' // 실제 복호화 로직 필요시 구현
            }))
        );    
        return decrypted;
    }

    // 음악 추가
    async addMusicToRoom(musicData: {
        musicId: string;
        title: string;
        roomId: string;
        studentName: string;
        timeStamp: Date;
    }) {
        const music = this.musicRepository.create(musicData);
        return await this.musicRepository.save(music);
    }

    // 특정 음악 찾기 (중복 확인용)
    async findMusicInRoom(roomId: string, musicId: string) {
        return await this.musicRepository.findOne({
            where: { roomId, musicId }
        });
    }

    // 음악 삭제
    async removeMusicFromRoom(roomId: string, musicId: string) {
        const music = await this.musicRepository.findOneBy({ roomId, musicId });
        if (!music) throw new HttpException('해당 음악을 찾을 수 없습니다', HttpStatus.NOT_FOUND);

        const deletedId = music.id;
        await this.musicRepository.remove(music);
        return deletedId
    }

    // 방 삭제 (필요시)
    async deleteRoom(roomId: string) {
        // 관련 데이터 먼저 삭제
        await this.musicRepository.delete({ roomId });
        await this.studentRepository.delete({ roomId });
        
        // 방 삭제
        const result = await this.roomRepository.delete({ id: roomId });
        return result.affected || 0;
    }

    // 방의 음악 개수 조회
    async getMusicCountInRoom(roomId: string) {
        return await this.musicRepository.count({ where: { roomId } });
    }

    // 방의 학생 수 조회
    async getStudentCountInRoom(roomId: string) {
        return await this.studentRepository.count({ where: { roomId } });
    }
}