import { Body, Controller, Delete, Get, InternalServerErrorException, Post, Query, Req, Sse } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddMusicInRoomDto, DeleteMusicInRoomDto, MusicListResDto, RoomIdDto, RoomTitleDto } from 'src/dto/music.dto';
import { MusicService } from './music.service';
import { Observable } from 'rxjs';

@ApiTags('/music-request')
@Controller('/music-request')
export class MusicController {
    constructor(
        private readonly musicService: MusicService
    ) {}

    @Get('poll')
    // @ApiOperation({summary: '음악 목록 롱폴링', description: '롱폴링 요청을 처리합니다.'})
    // @ApiBody({type: RoomTitleDto})
    // @ApiResponse({description: "업데이트 된 데이터를 받아옵니다.", type: RoomIdDto})
    async pollMusic(
        @Query('roomId') roomId: string,
    ) {
        if (!roomId) {
        return { updates: [], error: 'roomId는 필수입니다.' };
        }

        const result = await this.musicService.pollMusicStream(roomId);
        return result;
    }


    @Sse('/sse')
    async streamMusicList(@Query('roomId') roomId: string, @Req() req: Request): Promise<Observable<any>> {
        const stream = await this.musicService.createRedisStream(roomId);
        // 클라이언트 연결 해제 처리
        const res = (req as any).res;
        res.on('close', () => {
            console.log(`[SSE] Client disconnected from room ${roomId}`);
        });
        return stream;
    }

    @Post('/room')
    @ApiOperation({summary: '방 생성', description: '음악 추천을 위한 방을 생성합니다'})
    @ApiBody({type: RoomTitleDto})
    @ApiResponse({description: "방 ID를 받아옵니다", type: RoomIdDto})
    async makeNewRoom(@Body("roomTitle") RoomTitle: string){
        return await this.musicService.makeNewRoom(RoomTitle)
    }

    @Get('/room/title')
    @ApiOperation({summary: '방 제목 가져오기', description: '방 제목을 가져옵니다'})
    @ApiResponse({description: "방의 제목을 받아옵니다", type: RoomTitleDto})
    async getRoomTitle(@Query('roomId') roomId: string){
        return await this.musicService.getRoomTitle(roomId)                
    }

    @Get()
    @ApiOperation({summary: '방 상세 정보 가져오기', description: '방의 상세 정보를 가져옵니다'})
    @ApiResponse({description: "방의 상세 정보를 가져옵니다", type: RoomTitleDto})
    async getRoomInformation(@Query('roomId') roomId: string){
        return await this.musicService.getRoomInformation(roomId)                
    }

    @Get('/music/list')
    @ApiOperation({summary: '음악목록 가져오기', description: '방의 음악목록울 가져옵니다'})
    @ApiResponse({description: "방의 음악목록울 가져옵니다", type: MusicListResDto})
    async getMusicListByRoomId(@Query('roomId') roomId: string){
        const musicList = await this.musicService.getMusicList(roomId) 
        return {musicList}          
    }


    @Post('/music')
    @ApiOperation({summary: '음악 신청 정보 생성', description: '신청한 음악을 기록합니다'})
    @ApiBody({type: AddMusicInRoomDto})
    async addMusicInRoom(@Body() body: AddMusicInRoomDto){
        const {roomId, musicId, title, student} = body
        try{
            const savedMusic = await this.musicService.addMusicInRoom(roomId, musicId, title, student)

            this.musicService.sendToRoom(roomId, {
                musicId: savedMusic.musicId,
                title: savedMusic.title,
                studentName: savedMusic.studentName,
            });
            return { success: true }
        } catch (err) {
            if (err) throw err;
            throw new InternalServerErrorException('음악 신청 저장 중 문제가 발생했습니다');
        }

    }

    @Delete('/music')
    @ApiOperation({summary: '신청된 음악 정보 삭제', description: '신청된 음악을 삭제합니다'})
    @ApiBody({type: DeleteMusicInRoomDto})
    async removeMusicInRoom(@Body() body: DeleteMusicInRoomDto){
        const {roomId, musicId} = body
        try {
            const removedMusicId = await this.musicService.removeMusicInRoom(roomId, musicId)
            this.musicService.sendToRoom(roomId, {
            type: 'deleted-music',
            data: {
                id: removedMusicId
            },
            });
            return { success: true }
        } catch (err) {
            if (err) throw err;
            throw new InternalServerErrorException('음악 신청 삭제 중 문제가 발생했습니다');
        }

    }
}