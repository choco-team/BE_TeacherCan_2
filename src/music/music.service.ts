import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CryptoService } from 'src/services/crypto.service';
import { v4 as uuidv4} from 'uuid'
import { MusicSQLService } from './music.sql.service';
import { Observable } from 'rxjs';
import { EventEmitter } from 'events';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class MusicService {

    constructor(
        private readonly cryptoService: CryptoService,
        private readonly musicSQLService: MusicSQLService,
        private readonly redisService: RedisService,
    ) {}

    async sendToRoom(roomId: string, data: any) {
        const streamKey = `room:${roomId}:stream`;
        const client = this.redisService.getClient();
        await client.xadd(streamKey, 'MAXLEN', '~', 1000, '*', 'data', JSON.stringify({ data }));

        console.log(`[SSE] Sending event to room ${roomId}`, data);
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

    createRedisStream(roomId: string): Observable<any> {
        const client = this.redisService.getClient();
        const group = `room:${roomId}:group`;
        const consumer = `sse-${Math.random().toString(36).substring(2)}`;
        const streamKey = `room:${roomId}:stream`;

        return new Observable((observer) => {
            let isRunning = true;

            // 초기 데이터 전송
            const sendInitialData = async () => {
                try {
                    const musicList = await this.getMusicList(roomId);
                    const roomTitle = (await this.getRoomTitle(roomId)).roomTitle;
                    observer.next({
                        data: {musicList, roomTitle},
                        type: 'init-music-list',
                    });
                    console.log(`[SSE] Sent initial music list for room ${roomId}`);
                } catch (err) {
                    console.warn(`[SSE] Failed to send initial data for room ${roomId}:(연결유지)`, err);
                }
            };

            const initGroup = async () => {
                try {
                    await client.xgroup('CREATE', streamKey, group, '$', 'MKSTREAM');
                } catch (err) {
                    if (!String(err.message).includes('BUSYGROUP')) {
                    console.error('xgroup create error:', err);
                    }
                }
            }

            const poll = async () => {
                while (isRunning) {
                    try {
                        const response = await client.xreadgroup(
                        'GROUP', group, consumer,
                        'COUNT', 1,
                        'BLOCK', 1000,
                        'STREAMS', streamKey, '>'
                        ) as [string, [string, string[]][]][] | null;

                        if (response) {
                        for (const [, messages] of response) {
                            for (const [id, fields] of messages) {
                                const dataMap: Record<string, string> = {};
                                for (let i = 0; i < fields.length; i += 2) {
                                dataMap[fields[i]] = fields[i + 1];
                                }

                                if (!dataMap['data']) continue;

                                try {
                                    const payload = JSON.parse(dataMap['data']);
                                    observer.next({
                                        data: payload.data,
                                        type: 'music-list'
                                    });
                                    await client.xack(streamKey, group, id);
                                } catch (err) {
                                    console.error('[RedisStream SSE] JSON parse error:', err);
                                }
                            }
                        }
                        }
                    } catch (e) {
                        console.error('[RedisStream SSE] Error:', e);
                    }
                }
            };

            const startPing = () => {
                const pingInterval = setInterval(() => {
                    if (!isRunning) {
                        clearInterval(pingInterval);
                        return;
                    }
                    observer.next({
                        data: 'ping',
                        type: 'ping',
                    });
                }, 15000);
            };

            initGroup()
                .then(() => sendInitialData())
                .then(() => {
                    startPing();
                    poll()
                });
            
            return () => {
                isRunning = false;
                console.log(`[SSE] Closed stream for ${roomId}`);
            };
        });
    }
}