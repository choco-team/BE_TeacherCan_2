import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Music } from '../db/entities/music.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { Room } from '../db/entities/room.entity';
import { MusicDto } from 'src/dto/music.dto';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Music)
    private readonly musicRepository: Repository<Music>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly redisService: RedisService,
  ) {}

  async syncRedisToDatabase() {

    const roomKeys = await this.redisService.getClient().keys('room:*');
    const roomInfoKeys = roomKeys.filter((key) => !key.endsWith(':musicList'));



for (const roomKey of roomInfoKeys) {
  const roomDataRaw = await this.redisService.getClient().get(roomKey);
  if (!roomDataRaw) continue;

  const roomData:{id: string, roomTitle: string, connectedAt: string} = JSON.parse(roomDataRaw);
  const roomId = roomData.id;

  // room 테이블에 반영
  const room = this.roomRepository.create({
    id: roomId,
    roomTitle: roomData.roomTitle,
    connectedAt: new Date(roomData.connectedAt),
  });

  const existingRoom = await this.roomRepository.findOne({ where: { id: roomId } });
  if (!existingRoom) {
    await this.roomRepository.insert(room);
  }

  // music 리스트 조회
  const musicKey = `room:${roomId}:musicList`;
  const musicRaw = await this.redisService.getClient().get(musicKey);
  if (!musicRaw) continue;

  const musicList:MusicDto[] = JSON.parse(musicRaw);
  for (const musicData of musicList) {
    const existingMusic = await this.musicRepository.findOne({ where: { musicId: musicData.musicId } });

    const music = this.musicRepository.create({
      musicId: musicData.musicId,
      title: musicData.title,
      roomId: musicData.roomId,
      studentName: musicData.student,
      timeStamp: new Date(musicData.timeStamp),
    });

    if (existingMusic) {
      music.id = existingMusic.id;
      await this.musicRepository.save(music);
    } else {
      await this.musicRepository.insert(music);
    }
  }
}
  }
}
