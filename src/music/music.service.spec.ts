// jest 환경에서 실행됨을 명시
/**
 * @jest-environment node
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MusicService } from './music.service';
import { MusicSQLService } from './music.sql.service';
import { CryptoService } from '../services/crypto.service';
import { HttpException } from '@nestjs/common';
import { expect, jest } from '@jest/globals';
import { RoomIdDto, RoomTitleDto, MusicDto } from '../dto/music.dto';
import { MockInstance } from 'jest-mock';

interface StudentInfo {
  name: string;
  id: number;
}

interface RoomInformation {
  roomTitle: string;
  studentList: StudentInfo[];
  musicList: MusicDto[];
}

interface MockMusicSQLService {
  createRoom: MockInstance<(roomId: string, roomTitle: string) => Promise<void>>;
  getRoomTitle: MockInstance<(roomId: string) => Promise<RoomTitleDto>>;
  getRoomInfomation: MockInstance<(roomId: string) => Promise<RoomInformation>>;
  getAllMusicInRoom: MockInstance<(roomId: string) => Promise<MusicDto[]>>;
  findStudentInRoom: MockInstance<(roomId: string) => Promise<StudentInfo[]>>;
  addMusicToRoom: MockInstance<(musicData: any) => Promise<void>>;
  findMusicInRoom: MockInstance<(roomId: string, musicId: string) => Promise<MusicDto | null>>;
  removeMusicFromRoom: MockInstance<(roomId: string, musicId: string) => Promise<number>>;
}

const mockMusicSQLService: MockMusicSQLService = {
  createRoom: jest.fn(),
  getRoomTitle: jest.fn(),
  getRoomInfomation: jest.fn(),
  getAllMusicInRoom: jest.fn(),
  findStudentInRoom: jest.fn(),
  addMusicToRoom: jest.fn(),
  findMusicInRoom: jest.fn(),
  removeMusicFromRoom: jest.fn(),
};


describe('MusicService', () => {
  let service: MusicService;
  let musicSQLService: MockMusicSQLService;
  let cryptoService: Partial<CryptoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MusicService,
        { provide: MusicSQLService, useValue: mockMusicSQLService },
        { provide: CryptoService, useValue: {} },
      ],
    }).compile();

    service = module.get<MusicService>(MusicService);
    musicSQLService = mockMusicSQLService;
    cryptoService = module.get(CryptoService);

    Object.values(mockMusicSQLService).forEach(fn => fn.mockReset && fn.mockReset());
  });

  describe('makeNewRoom', () => {
    it('방 생성 성공', async () => {
      // RoomIdDto 반환
      musicSQLService.createRoom.mockResolvedValue(undefined); // 실제 DB 저장 결과는 사용하지 않음
      const result = await service.makeNewRoom('테스트방');
      expect(result).toHaveProperty('roomId');
    });
  });

  describe('getRoomTitle', () => {
    it('방 제목 조회 성공', async () => {
      // RoomTitleDto 반환
      musicSQLService.getRoomTitle.mockResolvedValue({ roomTitle: '테스트방' });
      const result = await service.getRoomTitle('room-1');
      expect(result).toEqual({ roomTitle: '테스트방' });
    });
  });

  describe('getRoomInformation', () => {
    it('방 상세 정보 조회 성공', async () => {
      // RoomTitleDto 또는 상세 정보 DTO 반환 (실제 서비스는 buildRoomInformationResponse 구조)
      musicSQLService.getRoomInfomation.mockResolvedValue({
        roomTitle: '테스트방',
        studentList: [{ name: '홍길동', id: 1 }],
        musicList: [
          {
            musicId: 'cbuZfY2S2UQ',
            roomId: 'room-1',
            title: '[ 𝑷𝒍𝒂𝒚𝒍𝒊𝒔𝒕 ] 코딩할때 듣기 좋은 노래',
            student: '홍길동',
            timeStamp: new Date().toISOString(),
          },
        ],
      });
      const result = await service.getRoomInformation('room-1');
      expect(result).toHaveProperty('roomTitle', '테스트방');
      expect(result).toHaveProperty('studentList');
      expect(result).toHaveProperty('musicList');
    });
  });

  describe('addMusicInRoom', () => {
    it('음악 추가 성공', async () => {
      musicSQLService.getRoomTitle.mockResolvedValue({ roomTitle: '테스트방' });
      musicSQLService.findMusicInRoom.mockResolvedValue(null);
      musicSQLService.addMusicToRoom.mockResolvedValue(undefined);
      const result = await service.addMusicInRoom('room-1', 'music-1', '노래제목', '학생A');
      expect(result).toEqual({ success: true });
    });
    it('이미 신청한 곡이면 예외', async () => {
      musicSQLService.getRoomTitle.mockResolvedValue({ roomTitle: '테스트방' });
      musicSQLService.findMusicInRoom.mockResolvedValue({
        musicId: 'music-1',
        title: '노래제목',
        roomId: 'room-1',
        student: '학생A',
        timeStamp: new Date().toISOString(),
      });
      await expect(
        service.addMusicInRoom('room-1', 'music-1', '노래제목', '학생A')
      ).rejects.toThrow();
    });
  });

  describe('getMusicList', () => {
    it('음악 리스트 조회 성공', async () => {
      // MusicListResDto.musicList 반환
      musicSQLService.getAllMusicInRoom.mockResolvedValue([
        {
          musicId: 'cbuZfY2S2UQ',
          title: '[ 𝑷𝒍𝒂𝒚𝒍𝒊𝒔𝒕 ] 코딩할때 듣기 좋은 노래',
          roomId: 'room-1',
          student: '홍길동',
          timeStamp: new Date().toISOString(),
        },
      ]);
      const result = await service.getMusicList('room-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('musicId');
    });
  });

  describe('removeMusicInRoom', () => {
    it('음악 삭제 성공', async () => {
      musicSQLService.removeMusicFromRoom.mockResolvedValue(1);
      const result = await service.removeMusicInRoom('room-1', 'music-1');
      expect(result).toEqual({ success: true });
    });
    it('음악이 없으면 예외', async () => {
      musicSQLService.removeMusicFromRoom.mockResolvedValue(0);
      await expect(
        service.removeMusicInRoom('room-1', 'music-1')
      ).rejects.toThrow();
    });
  });

  describe('sendToRoom', () => {
    it('이벤트가 정상적으로 emit되는지 확인', async () => {
      const spy = jest.spyOn((service as any).eventEmitter, 'emit');
      await service.sendToRoom('room-1', { test: 1 });
      expect(spy).toBeCalled();
    });
  });
}); 