import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CryptoService } from 'src/services/crypto.service';
import { v4 as uuidv4} from 'uuid'
import { MusicSQLService } from './music.sql.service';
import { Observable } from 'rxjs';
import { EventEmitter } from 'events';
import { RedisService } from 'src/redis/redis.service';
import { RedisStreamService } from 'src/redis/redis-stream.service';

@Injectable()
export class MusicService {

    constructor(
        private readonly cryptoService: CryptoService,
        private readonly musicSQLService: MusicSQLService,
        private readonly redisService: RedisService,
        private readonly redisStreamService: RedisStreamService,
    ) {}

    // 방 생성 - MySQL 직접 저장
    async makeNewRoom(roomTitle: string) {
        const roomId = uuidv4();
        
        // MySQL에 직접 방 정보 저장
        await this.musicSQLService.createRoom(roomId, roomTitle);
        
        return { roomId };
    }

    // 방 제목 조회 - MySQL 직접 조회
    async getRoomTitle(roomId: string): Promise<{ roomTitle: string }> {
        const roomData = await this.musicSQLService.getRoomTitle(roomId);
        return { roomTitle: roomData.roomTitle };
    }

    // 방 정보 조회 - MySQL 직접 조회
    async getRoomInformation(roomId: string) {
        try {
            const roomData = await this.musicSQLService.getRoomInfomation(roomId);
            return this.buildRoomInformationResponse(roomData, roomData.musicList, roomData.studentList);
        } catch (error) {
            throw new HttpException('방을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
        }
    }

    private buildRoomInformationResponse(room: any, musicList: any[], studentList: any[]) {
        return {
            roomTitle: room.roomTitle,
            studentList,
            musicList: musicList.map((music) => ({
                musicId: music.musicId,
                title: music.title,
                student: music.student,
                timeStamp: music.timeStamp,
            })),
        };
    }


    // 음악 추가 - MySQL 직접 저장
    async addMusicInRoom(roomId: string, musicId: string, title: string, studentName: string) {
        try {
            // 방 존재 여부 확인
            await this.musicSQLService.getRoomTitle(roomId);
            
            // 중복 음악 확인
            const existingMusic = await this.musicSQLService.findMusicInRoom(roomId, musicId);
            if (existingMusic) {
                throw new HttpException('이미 신청한 곡입니다', HttpStatus.CONFLICT);
            }

            // 음악 정보 저장
            const newMusic = {
                musicId,
                title,
                roomId,
                studentName,
                timeStamp: new Date(),
            };

            return await this.musicSQLService.addMusicToRoom(newMusic);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('음악 추가 중 오류가 발생했습니다', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 음악 리스트 조회 - MySQL 직접 조회
    async getMusicList(roomId: string) {
        try {
            return await this.musicSQLService.getAllMusicInRoom(roomId);
        } catch (error) {
            throw new HttpException('음악 리스트를 가져올 수 없습니다', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 음악 삭제 - MySQL 직접 삭제
    async removeMusicInRoom(roomId: string, musicId: string) {
        try {
            return await this.musicSQLService.removeMusicFromRoom(roomId, musicId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('음악 삭제 중 오류가 발생했습니다', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    //stream에 데이터 전송
    async sendToRoom(roomId: string, data: any) {
        const streamKey = `room:${roomId}:stream`;
        const client = this.redisService.getClient();
        await client.xadd(streamKey, 'MAXLEN', '~', 1000, '*', 'data', JSON.stringify({ data }));
    }

    //stream연결
    async createRedisStream(roomId: string): Promise<Observable<any>> {
        const streamKey = `room:${roomId}:stream`;
        const group = `room:${roomId}:group`;
        const getInitialPayload = async () => {
            const musicList = await this.getMusicList(roomId);
            const { roomTitle } = await this.getRoomTitle(roomId);
            return {
                type: 'init-music-list',
                data: { musicList, roomTitle },
            };
        }

        return this.redisStreamService.createStreamObservable(
            streamKey,
            group,
            getInitialPayload
        );
    }

}