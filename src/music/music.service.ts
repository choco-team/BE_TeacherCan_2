import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CryptoService } from 'src/services/crypto.service';
import { v4 as uuidv4} from 'uuid'
import { MusicSQLService } from './music.sql.service';
import { Observable } from 'rxjs';
import { EventEmitter } from 'events';

@Injectable()
export class MusicService {
    private eventEmitter = new EventEmitter(); // Redis PubSub 대신 EventEmitter 사용

    constructor(
        private readonly cryptoService: CryptoService,
        private readonly musicSQLService: MusicSQLService
    ) {}

    // Redis PubSub 대신 EventEmitter 사용
    async sendToRoom(roomId: string, data: any) {
        const channel = `room:${roomId}:channel`;
        this.eventEmitter.emit(channel, JSON.stringify(data));
        console.log(`[SSE] Sending event to room ${roomId}`, data);
    }

    async unsubscribeFromRoom(roomId: string) {
        const channel = `room:${roomId}:channel`;
        this.eventEmitter.removeAllListeners(channel);
    }

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

            await this.musicSQLService.addMusicToRoom(newMusic);
            
            return { success: true };
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
            const deletedCount = await this.musicSQLService.removeMusicFromRoom(roomId, musicId);
            
            if (deletedCount === 0) {
                throw new HttpException('해당 음악을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('음악 삭제 중 오류가 발생했습니다', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // SSE 스트림 생성 - EventEmitter 사용
    createMusicListStream(roomId: string): Observable<any> {
        const channel = `room:${roomId}:channel`;
        
        return new Observable((observer) => {
            // 초기 데이터 전송
            this.getMusicList(roomId).then(initialData => {
                observer.next({
                    event: 'music-list',
                    data: { musicList: initialData },
                });
            }).catch(err => {
                console.error('초기 음악 리스트 로드 실패:', err);
                observer.error(err);
            });

            // EventEmitter 리스너 설정
            const listener = (message: string) => {
                try {
                    observer.next({
                        event: 'music-list',
                        data: JSON.parse(message),
                    });
                } catch (err) {
                    console.error('SSE 메시지 파싱 실패:', err);
                    observer.error(err);
                }
            };
            
            console.log(`[SSE] Setting up listener for room ${roomId}`);
            this.eventEmitter.on(channel, listener);

            // 정리 함수
            return () => {
                console.log(`[SSE] Cleaning up subscription for room ${roomId}`);
                this.eventEmitter.removeListener(channel, listener);
            };
        });
    }
}