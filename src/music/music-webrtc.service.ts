import { Injectable, Logger } from '@nestjs/common';
import { MusicWebRTCGateway } from './music-webrtc.gateway';
import { MusicSQLService } from './music.sql.service';
import { MusicService } from './music.service';

interface WebRTCMusicData {
  type: 'add' | 'remove' | 'update';
  musicId?: string;
  title?: string;
  studentName?: string;
  timestamp?: Date;
}

interface RoomUser {
  socketId: string;
  userId: string;
  roomId: string;
}

@Injectable()
export class MusicWebRTCService {
  private readonly logger = new Logger(MusicWebRTCService.name);

  constructor(
    private readonly webrtcGateway: MusicWebRTCGateway,
    private readonly musicSQLService: MusicSQLService,
    private readonly musicService: MusicService,
  ) {}

  /**
   * WebRTC 방식으로 음악 추가
   * 서버에는 저장하되, 실시간 동기화는 P2P로 처리
   */
  async addMusicWebRTC(roomId: string, musicId: string, title: string, studentName: string) {
    try {
      // 1. 서버에 저장 (영구 보존)
      const savedMusic = await this.musicService.addMusicInRoom(roomId, musicId, title, studentName);
      
      // 2. WebRTC로 실시간 동기화 (비용 절감)
      const musicData: WebRTCMusicData = {
        type: 'add',
        musicId: savedMusic.musicId,
        title: savedMusic.title,
        studentName: savedMusic.studentName,
        timestamp: savedMusic.timeStamp,
      };

      // 시그널링 서버를 통해 방의 모든 사용자에게 브로드캐스트
      this.webrtcGateway.server.to(roomId).emit('music-updated', musicData);

      this.logger.log(`Music added via WebRTC: ${musicId} in room ${roomId}`);
      return { success: true, musicId: savedMusic.musicId };
    } catch (error) {
      this.logger.error(`Failed to add music via WebRTC: ${error.message}`);
      throw error;
    }
  }

  /**
   * WebRTC 방식으로 음악 삭제
   */
  async removeMusicWebRTC(roomId: string, musicId: string) {
    try {
      // 1. 서버에서 삭제
      const removedId = await this.musicService.removeMusicInRoom(roomId, musicId);
      
      // 2. WebRTC로 실시간 동기화
      const musicData: WebRTCMusicData = {
        type: 'remove',
        musicId,
      };

      this.webrtcGateway.server.to(roomId).emit('music-updated', musicData);

      this.logger.log(`Music removed via WebRTC: ${musicId} in room ${roomId}`);
      return { success: true, removedId };
    } catch (error) {
      this.logger.error(`Failed to remove music via WebRTC: ${error.message}`);
      throw error;
    }
  }

  /**
   * 방 생성 (WebRTC 시그널링 설정 포함)
   */
  async createRoomWebRTC(roomTitle: string) {
    const roomId = await this.musicService.makeNewRoom(roomTitle);
    
    this.logger.log(`Room created for WebRTC: ${roomId.roomId}`);
    return {
      ...roomId,
      signalingUrl: `ws://localhost:8080/webrtc`, // WebSocket 시그널링 URL
    };
  }

  /**
   * 방 정보 조회 (WebRTC 사용자 정보 포함)
   */
  async getRoomInfoWebRTC(roomId: string) {
    try {
      // 1. 기본 방 정보 조회
      const roomInfo = await this.musicService.getRoomInformation(roomId);
      
      // 2. WebRTC 연결된 사용자 정보 추가
      const webrtcInfo = this.webrtcGateway.getRoomInfo(roomId);
      
      return {
        ...roomInfo,
        webrtc: {
          connectedUsers: webrtcInfo?.userCount || 0,
          signalingUrl: `ws://localhost:8080/webrtc`,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get room info via WebRTC: ${error.message}`);
      throw error;
    }
  }

  /**
   * 연결 방식 결정 (사용자 수에 따른 동적 전환)
   */
  async getConnectionMethod(roomId: string): Promise<'webrtc' | 'sse' | 'hybrid'> {
    try {
      const webrtcInfo = this.webrtcGateway.getRoomInfo(roomId);
      const userCount = webrtcInfo?.userCount || 0;

      // 사용자 수에 따른 동적 전환
      if (userCount < 5) {
        return 'webrtc'; // 소수 사용자: 완전 P2P
      } else if (userCount < 20) {
        return 'hybrid'; // 중간 규모: 하이브리드
      } else {
        return 'sse'; // 대규모: 서버 중심 (안정성 우선)
      }
    } catch (error) {
      this.logger.warn(`Failed to determine connection method: ${error.message}`);
      return 'sse'; // 기본값
    }
  }

  /**
   * 하이브리드 방식: 중요 데이터는 서버, 실시간 동기화는 P2P
   */
  async addMusicHybrid(roomId: string, musicId: string, title: string, studentName: string) {
    try {
      // 1. 서버에 저장 (중요 데이터 보존)
      const savedMusic = await this.musicService.addMusicInRoom(roomId, musicId, title, studentName);
      
      // 2. WebRTC로 실시간 동기화 (비용 절감)
      const musicData: WebRTCMusicData = {
        type: 'add',
        musicId: savedMusic.musicId,
        title: savedMusic.title,
        studentName: savedMusic.studentName,
        timestamp: savedMusic.timeStamp,
      };

      // 시그널링 서버를 통해 브로드캐스트
      this.webrtcGateway.server.to(roomId).emit('music-updated', musicData);

      this.logger.log(`Music added via hybrid: ${musicId} in room ${roomId}`);
      return { success: true, method: 'hybrid', musicId: savedMusic.musicId };
    } catch (error) {
      this.logger.error(`Failed to add music via hybrid: ${error.message}`);
      throw error;
    }
  }

  /**
   * WebRTC 연결 상태 모니터링
   */
  getWebRTCStats() {
    const allRooms = this.webrtcGateway.getAllRooms();
    const totalUsers = allRooms.reduce((sum, room) => sum + room.userCount, 0);
    
    return {
      totalRooms: allRooms.length,
      totalUsers,
      rooms: allRooms,
    };
  }

  /**
   * 방별 WebRTC 사용자 목록
   */
  getRoomUsers(roomId: string): RoomUser[] {
    const roomInfo = this.webrtcGateway.getRoomInfo(roomId);
    return roomInfo?.users || [];
  }
} 