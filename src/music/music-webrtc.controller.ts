import { Body, Controller, Get, Post, Query, Delete, InternalServerErrorException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddMusicInRoomDto, DeleteMusicInRoomDto, RoomTitleDto } from 'src/dto/music.dto';
import { MusicWebRTCService } from './music-webrtc.service';

@ApiTags('/music-webrtc')
@Controller('/music-webrtc')
export class MusicWebRTCController {
    constructor(
        private readonly musicWebRTCService: MusicWebRTCService
    ) {}

    @Post('/room')
    @ApiOperation({summary: 'WebRTC 방 생성', description: 'WebRTC 시그널링을 위한 방을 생성합니다'})
    @ApiBody({type: RoomTitleDto})
    @ApiResponse({description: "방 ID와 시그널링 URL을 받아옵니다"})
    async createWebRTCRoom(@Body("roomTitle") roomTitle: string) {
        return await this.musicWebRTCService.createRoomWebRTC(roomTitle);
    }

    @Get('/room/info')
    @ApiOperation({summary: 'WebRTC 방 정보 조회', description: 'WebRTC 연결 정보를 포함한 방 정보를 조회합니다'})
    @ApiResponse({description: "방 정보와 WebRTC 연결 상태를 받아옵니다"})
    async getWebRTCRoomInfo(@Query('roomId') roomId: string) {
        return await this.musicWebRTCService.getRoomInfoWebRTC(roomId);
    }

    @Post('/music')
    @ApiOperation({summary: 'WebRTC 음악 신청', description: 'WebRTC를 통해 실시간으로 음악을 신청합니다'})
    @ApiBody({type: AddMusicInRoomDto})
    async addMusicWebRTC(@Body() body: AddMusicInRoomDto) {
        const {roomId, musicId, title, student} = body;
        try {
            return await this.musicWebRTCService.addMusicWebRTC(roomId, musicId, title, student);
        } catch (err) {
            if (err) throw err;
            throw new InternalServerErrorException('WebRTC 음악 신청 중 문제가 발생했습니다');
        }
    }

    @Delete('/music')
    @ApiOperation({summary: 'WebRTC 음악 삭제', description: 'WebRTC를 통해 실시간으로 음악을 삭제합니다'})
    @ApiBody({type: DeleteMusicInRoomDto})
    async removeMusicWebRTC(@Body() body: DeleteMusicInRoomDto) {
        const {roomId, musicId} = body;
        try {
            return await this.musicWebRTCService.removeMusicWebRTC(roomId, musicId);
        } catch (err) {
            if (err) throw err;
            throw new InternalServerErrorException('WebRTC 음악 삭제 중 문제가 발생했습니다');
        }
    }

    @Post('/music/hybrid')
    @ApiOperation({summary: '하이브리드 음악 신청', description: '서버 저장 + WebRTC 실시간 동기화'})
    @ApiBody({type: AddMusicInRoomDto})
    async addMusicHybrid(@Body() body: AddMusicInRoomDto) {
        const {roomId, musicId, title, student} = body;
        try {
            return await this.musicWebRTCService.addMusicHybrid(roomId, musicId, title, student);
        } catch (err) {
            if (err) throw err;
            throw new InternalServerErrorException('하이브리드 음악 신청 중 문제가 발생했습니다');
        }
    }

    @Get('/connection-method')
    @ApiOperation({summary: '연결 방식 결정', description: '사용자 수에 따른 최적 연결 방식을 결정합니다'})
    @ApiResponse({description: "권장 연결 방식을 받아옵니다 (webrtc/sse/hybrid)"})
    async getConnectionMethod(@Query('roomId') roomId: string) {
        const method = await this.musicWebRTCService.getConnectionMethod(roomId);
        return { 
            recommendedMethod: method,
            roomId,
            description: this.getMethodDescription(method)
        };
    }

    @Get('/stats')
    @ApiOperation({summary: 'WebRTC 통계', description: 'WebRTC 연결 상태 통계를 조회합니다'})
    @ApiResponse({description: "WebRTC 연결 통계 정보를 받아옵니다"})
    async getWebRTCStats() {
        return this.musicWebRTCService.getWebRTCStats();
    }

    @Get('/room/users')
    @ApiOperation({summary: '방 사용자 목록', description: '특정 방의 WebRTC 연결된 사용자 목록을 조회합니다'})
    @ApiResponse({description: "방의 연결된 사용자 목록을 받아옵니다"})
    async getRoomUsers(@Query('roomId') roomId: string) {
        return this.musicWebRTCService.getRoomUsers(roomId);
    }

    private getMethodDescription(method: string): string {
        switch (method) {
            case 'webrtc':
                return '완전 P2P 방식 - 서버 비용 최소화, 소수 사용자에 최적';
            case 'hybrid':
                return '하이브리드 방식 - 서버 저장 + P2P 실시간 동기화';
            case 'sse':
                return '서버 중심 방식 - 안정성 우선, 대규모 사용자에 적합';
            default:
                return '알 수 없는 방식';
        }
    }
} 