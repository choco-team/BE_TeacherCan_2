import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class MusicSQLService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  async getMusicList(roomId: string) {
    const { data, error } = await this.supabase
      .from('musics')
      .select('*')
      .eq('roomId', roomId)
      .order('timeStamp', { ascending: true });

    if (error) {
      console.error('음악 목록 조회 오류:', error);
      return [];
    }

    return data || [];
  }

  async getMusicById(id: string) {
    const { data, error } = await this.supabase
      .from('musics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('음악 조회 오류:', error);
      return null;
    }

    return data;
  }

  // 디버깅용: 모든 방 목록 조회
  async getAllRooms() {
    const { data, error } = await this.supabase.from('rooms').select('*');

    if (error) {
      console.error('방 목록 조회 오류:', error);
      return [];
    }

    return data || [];
  }

  async createRoom(roomId: string, roomTitle: string) {
    const { error } = await this.supabase
      .from('rooms')
      .insert([
        {
          id: roomId,
          roomTitle: roomTitle,
          connectedAt: new Date(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('방 생성 오류:', error);
      return { roomId, roomTitle };
    }

    return { roomId };
  }

  async getRoomTitle(roomId: string) {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('roomTitle')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('방 제목 조회 오류:', error);
      return { roomTitle: 'Room not found' };
    }

    return { roomTitle: data.roomTitle };
  }

  async getRoomInfomation(roomId: string) {
    try {
      // 방 정보 조회
      const { data: room, error: roomError } = await this.supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('방 정보 조회 오류:', roomError);
        return {
          roomTitle: 'Room not found',
          musicList: [],
          studentList: [],
        };
      }

      // 해당 방의 음악 목록 조회
      const { data: musicList, error: musicError } = await this.supabase
        .from('musics')
        .select('*')
        .eq('roomId', roomId)
        .order('timeStamp', { ascending: true });

      if (musicError) {
        console.error('음악 목록 조회 오류:', musicError);
      }

      // musicId 중복 제거 - 가장 최근 것만 유지
      const uniqueMusic = new Map();
      if (musicList) {
        musicList.forEach((music) => {
          if (
            !uniqueMusic.has(music.musicId) ||
            new Date(music.timeStamp) >
              new Date(uniqueMusic.get(music.musicId).timeStamp)
          ) {
            uniqueMusic.set(music.musicId, music);
          }
        });
      }

      // Map의 값들을 배열로 변환하고 시간순 정렬
      const resultMusicList = Array.from(uniqueMusic.values()).sort(
        (a, b) =>
          new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime(),
      );

      console.log(
        `[SQL] Room ${roomId}: Found ${musicList?.length || 0} total, ${resultMusicList.length} unique songs`,
      );

      return {
        roomTitle: room.title || room.roomTitle || 'Unknown Room',
        musicList: resultMusicList || [],
        studentList: [], // 학생 정보는 별도 테이블이 필요
      };
    } catch (error) {
      console.error('getRoomInfomation 에러:', error);
      return {
        roomTitle: 'Error loading room',
        musicList: [],
        studentList: [],
      };
    }
  }

  async addMusicToRoom(musicData: any) {
    try {
      // 이미 해당 방에 같은 musicId를 가진 음악이 있는지 확인
      const { data: existingMusic, error: checkError } = await this.supabase
        .from('musics')
        .select('*')
        .eq('roomId', musicData.roomId)
        .eq('musicId', musicData.musicId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116는 "결과가 없음" 에러이므로 무시
        console.error('기존 음악 확인 오류:', checkError);
        return { ...musicData, id: Date.now() };
      }

      // 이미 존재하는 음악이 있다면 에러 발생
      if (existingMusic) {
        throw new Error('이미 신청된 음악입니다.');
      }

      // 새로운 음악 생성
      const { data, error } = await this.supabase
        .from('musics')
        .insert([musicData])
        .select()
        .single();

      if (error) {
        console.error('음악 추가 오류:', error);
        return { ...musicData, id: Date.now() };
      }

      console.log(
        `[SQL] New music ${musicData.musicId} added to room ${musicData.roomId}`,
      );
      return data;
    } catch (error) {
      console.error('addMusicToRoom 에러:', error);
      throw new Error(error.message); // 클라이언트에게는 message만 전달
    }
  }

  async findMusicInRoom(roomId: string, musicId: string) {
    const { data, error } = await this.supabase
      .from('musics')
      .select('*')
      .eq('roomId', roomId)
      .eq('id', musicId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async getAllMusicInRoom(roomId: string) {
    try {
      const { data, error } = await this.supabase
        .from('musics')
        .select('*')
        .eq('roomId', roomId)
        .order('timeStamp', { ascending: true });

      if (error) {
        console.error('방 음악 목록 조회 오류:', error);
        return [];
      }

      // musicId 중복 제거 - 가장 최근 것만 유지
      const uniqueMusic = new Map();
      if (data) {
        data.forEach((music) => {
          if (
            !uniqueMusic.has(music.musicId) ||
            new Date(music.timeStamp) >
              new Date(uniqueMusic.get(music.musicId).timeStamp)
          ) {
            uniqueMusic.set(music.musicId, music);
          }
        });
      }

      // Map의 값들을 배열로 변환하고 시간순 정렬
      const result = Array.from(uniqueMusic.values()).sort(
        (a, b) =>
          new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime(),
      );

      console.log(
        `[SQL] Room ${roomId}: Found ${data?.length || 0} total, ${result.length} unique songs`,
      );
      return result;
    } catch (error) {
      console.error('getAllMusicInRoom 에러:', error);
      return [];
    }
  }

  async removeMusicFromRoom(roomId: string, musicId: string) {
    try {
      // 삭제 전에 해당 음악의 정보를 먼저 조회
      const { data: musicToDelete, error: selectError } = await this.supabase
        .from('musics')
        .select('id, musicId, title')
        .eq('roomId', roomId)
        .eq('musicId', musicId)
        .single();

      if (selectError) {
        console.error('삭제할 음악 조회 오류:', selectError);
        return { removed: false, musicId, error: '음악을 찾을 수 없습니다.' };
      }

      if (!musicToDelete) {
        return { removed: false, musicId, error: '음악을 찾을 수 없습니다.' };
      }

      // 음악 삭제
      const { error: deleteError } = await this.supabase
        .from('musics')
        .delete()
        .eq('roomId', roomId)
        .eq('musicId', musicId);

      if (deleteError) {
        console.error('음악 삭제 오류:', deleteError);
        return { removed: false, musicId, error: '음악 삭제에 실패했습니다.' };
      }

      console.log(
        `[SQL] Music deleted: ID ${musicToDelete.id}, musicId ${musicId} from room ${roomId}`,
      );
      return {
        removed: true,
        musicId,
        id: musicToDelete.id, // 테이블의 고유 ID
        title: musicToDelete.title,
      };
    } catch (error) {
      console.error('removeMusicFromRoom 에러:', error);
      return {
        removed: false,
        musicId,
        error: '음악 삭제 중 오류가 발생했습니다.',
      };
    }
  }
}
