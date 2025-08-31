import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Sse,
  Delete,
} from '@nestjs/common';
import { Query, Req } from '@nestjs/common';
import { MusicService } from './music.service';
import { ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';

@ApiTags('/music-request')
@Controller('/music-request')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Sse('/sse')
  async streamMusicList(
    @Query('roomId') roomId: string,
    @Req() req: Request,
  ): Promise<Observable<any>> {
    console.log(`[SSE] Client connected to room ${roomId}`);

    // 클라이언트 연결 해제 처리
    const res = (req as any).res;
    res.on('close', () => {
      console.log(`[SSE] Client disconnected from room ${roomId}`);
    });

    return new Observable<any>((subscriber) => {
      // 연결 시 즉시 현재 방 정보 전송
      this.sendRoomData(subscriber, roomId);

      // MusicService의 전역 이벤트 버스 구독
      const globalEventSubscription = this.musicService
        .getGlobalEventBus()
        .subscribe((event) => {
          // 해당 방의 이벤트만 필터링
          if (event.roomId === roomId) {
            console.log(
              `[SSE] Received global event for room ${roomId}:`,
              event.type,
            );

            // new-music 이벤트를 SSE로 전송
            if (event.type === 'new-music') {
              subscriber.next({
                data: {
                  type: 'new-music',
                  roomId: event.roomId,
                  musicList: event.musicList,
                },
                type: 'new-music',
                id: Date.now().toString(),
              });
            }

            // deleted-music 이벤트를 SSE로 전송
            if (event.type === 'deleted-music') {
              subscriber.next({
                data: {
                  type: 'deleted-music',
                  id: event.id,
                },
                type: 'deleted-music',
                id: Date.now().toString(),
              });
            }
          }
        });

      // 주기적으로 ping 이벤트 전송 (연결 유지)
      const pingInterval = setInterval(() => {
        subscriber.next({
          data: {
            type: 'ping',
            roomId,
            timestamp: new Date().toISOString(),
          },
          type: 'ping',
          id: Date.now().toString(),
        });
      }, 60000 * 5); // 5분마다 ping

      // 연결 해제 시 정리
      return () => {
        clearInterval(pingInterval);
        globalEventSubscription.unsubscribe();
        console.log(`[SSE] Stream closed for room ${roomId}`);
      };
    });
  }

  private async sendRoomData(subscriber: any, roomId: string) {
    try {
      // 방 정보와 음악 목록 조회
      const roomInfo = await this.musicService.getRoomInformation(roomId);

      // SSE 이벤트 전송
      subscriber.next({
        data: {
          type: 'room-update',
          roomId,
          roomTitle: roomInfo.roomTitle,
          musicList: roomInfo.musicList,
          studentList: roomInfo.studentList,
          timestamp: new Date().toISOString(),
        },
        type: 'room-update',
        id: Date.now().toString(),
      });

      console.log(
        `[SSE] Sent room data for ${roomId}:`,
        roomInfo.musicList.length,
        'songs',
      );
    } catch (error) {
      console.error(`[SSE] Error sending room data for ${roomId}:`, error);

      // 에러 발생 시 에러 이벤트 전송
      subscriber.next({
        data: {
          type: 'error',
          message: '방 정보를 가져올 수 없습니다.',
          roomId,
          timestamp: new Date().toISOString(),
        },
        type: 'error',
        id: Date.now().toString(),
      });
    }
  }

  @Post('room')
  async createRoom(@Body('roomTitle') RoomTitle: string) {
    return await this.musicService.makeNewRoom(RoomTitle);
  }

  @Get('room/title')
  async getRoomTitle(@Query('roomId') roomId: string) {
    return await this.musicService.getRoomTitle(roomId);
  }

  @Get()
  async getRoomInformation(@Query('roomId') roomId: string) {
    return await this.musicService.getRoomInformation(roomId);
  }

  @Post('music')
  async addMusicInRoom(
    @Body('roomId') roomId: string,
    @Body('musicId') musicId: string,
    @Body('title') title: string,
    @Body('student') student: string,
  ) {
    try {
      const savedMusic = await this.musicService.addMusicInRoom(
        roomId,
        musicId,
        title,
        student,
      );

      // 음악 추가 이벤트는 MusicService에서 자동으로 브로드캐스트됨
      console.log(`[Controller] Music added to room ${roomId}:`, savedMusic);

      return savedMusic;
    } catch (error) {
      // 중복 음악 에러인 경우 400 Bad Request 반환
      if (error.message.includes('이미 신청된 음악입니다.')) {
        throw new HttpException(
          {
            statusCode: 400,
            message: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // 기타 에러는 500 Internal Server Error 반환
      throw new HttpException(
        {
          statusCode: 500,
          message: '음악 추가 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('room/:roomId/music')
  async getMusicList(@Param('roomId') roomId: string) {
    // roomId를 사용하여 해당 방의 음악만 가져오도록 수정
    return await this.musicService.getRoomInformation(roomId);
  }

  @Delete('music')
  async removeMusicInRoom(
    @Body('roomId') roomId: string,
    @Body('musicId') musicId: string,
  ) {
    try {
      const removedMusicId = await this.musicService.removeMusicInRoom(
        roomId,
        musicId,
      );
      this.musicService.sendToRoom(roomId, {
        type: 'deleted-music',
        id: removedMusicId,
      });
      return {};
    } catch (error) {
      throw error;
    }
  }
}
