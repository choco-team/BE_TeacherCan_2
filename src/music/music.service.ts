import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { CryptoService } from 'src/services/crypto.service';
import { v4 as uuidv4} from 'uuid'
import { MusicSQLService } from './music.sql.service';

@Injectable()
export class MusicService {
constructor(
        private readonly redisService: RedisService,
        private readonly cryptoService: CryptoService,
        private readonly musicSQLService: MusicSQLService
) {}


async makeNewRoom(roomTitle: string) {
    const roomId = uuidv4(); // 고유 ID 생성
    const roomKey = `room:${roomId}`;

    const now = new Date().toISOString();
    const roomData = {
      id: roomId,
      roomTitle,
      connectedAt: now,
    };

    const redis = this.redisService.getClient();
    await redis.set(roomKey, JSON.stringify(roomData));
    await redis.set(roomKey, JSON.stringify(roomData), 'EX', 60 * 60 * 24 * 7); // TTL: 7일

    return { roomId };
  }

  async getRoomTitle(roomId: string): Promise<{ roomTitle: string }> {
    const redis = this.redisService.getClient();
    const roomKey = `room:${roomId}`;
    const cached = await redis.get(roomKey);
  
    if (cached) {
      const { roomTitle } = JSON.parse(cached);
      return { roomTitle };
    }
  
    // 🔁 fallback to SQL
    const roomData = await this.musicSQLService.getRoomInfomation(roomId);
    await this.saveToRedis(roomData)

    return {roomTitle : roomData.roomTitle};
  }
  
  async getRoomInformation(roomId: string) {
    const [room, musicList, studentList] = await Promise.all([
      this.getRoomData(roomId),
      this.getMusicList(roomId),
      this.getStudentList(roomId),
    ]);

    if (!room) {
      const roomData = await this.musicSQLService.getRoomInfomation(roomId);
      await this.saveToRedis({ id: roomId, ...roomData });
      return this.buildRoomInformationResponse(roomData, roomData.musicList, roomData.studentList)
    }
  
    return this.buildRoomInformationResponse(room, musicList, studentList);
  }
  
  private async getRoomData(roomId: string) {
    const redis = this.redisService.getClient();
    const raw = await redis.get(`room:${roomId}`);
    if (!raw) return null;
    return JSON.parse(raw);
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
  
  
  async addStudentInRoom(roomId: string, name: string) {
    const room = await this.getRoomData(roomId).catch(() => null);
    if (room) return { success: true }
    else {
      const roomData = await this.musicSQLService.getRoomInfomation(roomId)
      if (!roomData) {throw new HttpException("해당 방을 찾지 못했습니다", HttpStatus.NOT_FOUND)}
      else {
      await this.saveToRedis({ id: roomId, ...roomData });
      return { success: true}
    }
  }
}
  
  private async getStudentList(studentKey: string) {
    const redis = this.redisService.getClient();
    const rawList = await redis.get(studentKey);
    return rawList ? JSON.parse(rawList) : [];
  }
    
  
  async addMusicInRoom(roomId: string, musicId: string, title: string, studentName: string) {
  
    const musicList = await this.getMusicList(roomId);

    const room = await this.getRoomData(roomId).catch(() => null);
    if (!room){
      const roomData = await this.musicSQLService.getRoomInfomation(roomId)
      await this.saveToRedis({ id: roomId, ...roomData });
  }

    if (this.isDuplicateMusic(musicList, musicId)) {
      throw new HttpException('이미 신청한 곡입니다', HttpStatus.CONFLICT);
    }
  
    const newMusic = {
      musicId,
      title,
      roomId,
      student: studentName,
      timeStamp: new Date().toISOString(),
    };
  
    musicList.push(newMusic);
    await this.saveMusicList(roomId, musicList);
  
    return { success: true };
  }
    
  async getMusicList(roomId: string) {
    const redis = this.redisService.getClient();
    const key = `room:${roomId}:musicList`;
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : [];
  }
  
  private isDuplicateMusic(musicList: any[], musicId: string): boolean {
    return musicList.some((music) => music.musicId === musicId);
  }
  
  private async saveMusicList(roomId: string, musicList: any[]) {
    const redis = this.redisService.getClient();
    const key = `room:${roomId}:musicList`;
    await redis.set(key, JSON.stringify(musicList), 'EX', 60 * 60 * 24 * 7);
  }
  


  async removeMusicInRoom(roomId: string, musicId: string) {
    const musicList = await this.getMusicList(roomId);
  
    const updatedList = this.removeMusicById(musicList, musicId);
    if (!updatedList) {
      throw new HttpException('해당 음악을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
    }
  
    await this.saveMusicList(roomId, updatedList);
    return { success: true };
  }

  private removeMusicById(musicList: any[], musicId: string): any[] | null {
    const index = musicList.findIndex((m) => m.musicId === musicId);
    if (index === -1) return null;
  
    const newList = [...musicList];
    newList.splice(index, 1);
    return newList;
  }
  
  private async saveToRedis(roomData: {
    id?: string;
    roomTitle: string;
    studentList: { id: number; name: string }[];
    musicList: {
      musicId: string;
      title: string;
      student: string;
      timeStamp: Date;
    }[];
  }) {
    const { id, roomTitle, studentList, musicList } = roomData;
    const redis = this.redisService.getClient();
  
    // 방 정보 저장
    const roomKey = `room:${id}`;
    const roomPayload = {
      id,
      roomTitle,
      connectedAt: new Date().toISOString(),
    };

    const normalizedStudentList = studentList.map((s) => ({
      id: s.id.toString(),
      name: s.name,
    }));
    
    const normalizedMusicList = musicList.map((m) => ({
      musicId: m.musicId,
      title: m.title,
      student: m.student,
      timeStamp: m.timeStamp instanceof Date ? m.timeStamp.toISOString() : m.timeStamp,
    }));
    
  
    await redis.set(roomKey, JSON.stringify(roomPayload), 'EX', 60 * 60 * 24 * 7);
  
    // 학생 리스트 저장
    const studentKey = `room:${id}:students`;
    await redis.set(studentKey, JSON.stringify(normalizedStudentList), 'EX', 60 * 60 * 24 * 7);

    // 음악 리스트 저장
    const musicKey = `room:${id}:musicList`;
    await redis.set(musicKey, JSON.stringify(normalizedMusicList), 'EX', 60 * 60 * 24 * 7);
  }
  
  }

  