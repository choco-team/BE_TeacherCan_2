import { Injectable } from '@nestjs/common';
import { MusicSQLService } from './music.sql.service';
import { CryptoService } from '../services/crypto.service';
import { Subject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MusicService {
  // 전역 이벤트 버스 - 모든 SSE 클라이언트가 구독
  private globalEventBus = new Subject<any>();
  private roomStreams = new Map<string, Subject<any>>();

  constructor(
    private readonly musicSQLService: MusicSQLService,
    private readonly cryptoService: CryptoService,
  ) {}

  // 전역 이벤트 버스 구독
  getGlobalEventBus(): Observable<any> {
    return this.globalEventBus.asObservable();
  }

  // 전역 이벤트 전송
  private emitGlobalEvent(event: any) {
    console.log(`[Global Event] Emitting:`, event.type);
    this.globalEventBus.next(event);
  }

  async getMusicList(roomId?: string) {
    if (roomId) {
      return this.musicSQLService.getAllMusicInRoom(roomId);
    }
    return this.musicSQLService.getMusicList(roomId);
  }

  async getMusicById(id: string) {
    return this.musicSQLService.getMusicById(id);
  }

  // 추가 메서드들
  async makeNewRoom(roomTitle: string) {
    const roomId = uuidv4();
    return this.musicSQLService.createRoom(roomId, roomTitle);
  }

  async getRoomTitle(roomId: string) {
    return this.musicSQLService.getRoomTitle(roomId);
  }

  async getRoomInformation(roomId: string) {
    return this.musicSQLService.getRoomInfomation(roomId);
  }

  async addMusicInRoom(
    roomId: string,
    musicId: string,
    title: string,
    student: string,
  ) {
    const musicData = {
      musicId,
      title,
      roomId,
      studentName: student,
      timeStamp: new Date(),
      updatedAt: new Date(),
    };

    const savedMusic = await this.musicSQLService.addMusicToRoom(musicData);

    // 전역 이벤트로 새 음악 추가 알림 (모든 SSE 클라이언트에게)
    this.emitGlobalEvent({
      type: 'new-music',
      roomId,
      musicList: savedMusic,
    });

    // 기존 방별 브로드캐스트도 유지
    this.broadcastToRoom(roomId, {
      type: 'new-music',
      musicList: savedMusic,
    });

    return savedMusic;
  }

  async removeMusicInRoom(roomId: string, musicId: string) {
    const result = await this.musicSQLService.removeMusicFromRoom(
      roomId,
      musicId,
    );

    if (!result.removed) {
      throw new Error(result.error || '음악 삭제에 실패했습니다.');
    }

    // 전역 이벤트로 음악 삭제 알림 (모든 SSE 클라이언트에게)
    this.emitGlobalEvent({
      type: 'deleted-music',
      roomId,
      id: result.id, // 테이블의 고유 ID 사용
      musicId: result.musicId, // musicId도 함께 전송
    });

    // 방에서 음악 제거 이벤트 브로드캐스트
    this.broadcastToRoom(roomId, {
      type: 'deleted-music',
      roomId,
      id: result.id, // 테이블의 고유 ID 사용
      musicId: result.musicId, // musicId도 함께 전송
    });

    return result;
  }

  async sendToRoom(roomId: string, data: any) {
    console.log(`Sending to room ${roomId}:`, data);
    this.broadcastToRoom(roomId, data);
    return { success: true };
  }

  // 방별 SSE 스트림 생성
  createRoomStream(roomId: string): Observable<any> {
    console.log(`[SSE] Creating stream for room ${roomId}`);

    if (!this.roomStreams.has(roomId)) {
      console.log(`[SSE] New stream created for room ${roomId}`);
      this.roomStreams.set(roomId, new Subject<any>());
    } else {
      console.log(`[SSE] Existing stream found for room ${roomId}`);
    }

    const stream = this.roomStreams.get(roomId)!;
    console.log(
      `[SSE] Stream for room ${roomId} ready, subscribers:`,
      stream.observers.length,
    );

    return stream.asObservable();
  }

  // 방에 이벤트 브로드캐스트
  private broadcastToRoom(roomId: string, data: any) {
    const stream = this.roomStreams.get(roomId);
    if (stream) {
      stream.next(data);
      console.log(`[SSE] Broadcasted to room ${roomId}:`, data.type);
    }
  }

  // 방 스트림 정리
  removeRoomStream(roomId: string) {
    const stream = this.roomStreams.get(roomId);
    if (stream) {
      stream.complete();
      this.roomStreams.delete(roomId);
      console.log(`[SSE] Removed stream for room ${roomId}`);
    }
  }

  // ping 이벤트 전송
  sendPing(roomId: string) {
    this.broadcastToRoom(roomId, {
      type: 'ping',
      roomId,
      timestamp: new Date().toISOString(),
    });
  }

  // 기존 createRedisStream 메서드 제거하고 일반 스트림으로 대체
  async createStream(roomId: string) {
    return {
      roomId,
      type: 'stream-created',
      message: 'Room stream created successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
