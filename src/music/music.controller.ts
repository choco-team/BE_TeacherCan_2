import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MusicService } from './music.service';
import { RoomIdDto, RoomTitleDto, StudentEntranceInfoDto,  } from 'src/dto/music.dto';

@ApiTags('/music-request')
@Controller('/music-request')
export class MusicController {
      constructor(private readonly musicService: MusicService) {}

            @Post('/room')
            @ApiOperation({summary: '방 생성', description: '음악 추천을 위한 방을 생성합니다'})
            @ApiBody({type: RoomTitleDto})
            @ApiResponse( {description: "방 ID를 받아옵니다", type: RoomIdDto })
            async makeNewRoom(@Body("roomTitle") RoomTitle: string){
            return await this.musicService.makeNewRoom(RoomTitle)
            }

            @Get('/room/title')
            @ApiOperation({summary: '방 제목 가져오기', description: '방 제목을 가져옵니다'})
            @ApiBody({type: RoomIdDto})
            @ApiResponse( {description: "방의 제목을 받아옵니다", type: RoomTitleDto})
            async getRoomTitle(@Query('roomId') roomId:string){
            return await this.musicService.getRoomTitle(roomId)                
            }

            @Get()
            @ApiOperation({summary: '방 상세 정보 가져오기', description: '방의 상세 정보를 가져옵니다'})
            @ApiBody({type: RoomIdDto})
            @ApiResponse( {description: "방의 상제 정보를 가져옵니다", type: RoomTitleDto})
            async getRoomInfomation(@Query('roomId') roomId:string){
                return await this.musicService.getRoomInfomation(roomId)                
                }

            @Post('/student')
            @ApiOperation({summary: '방에 학생 정보 생성', description: '방의 입장한 학생의 정보를 생성합니다'})
            @ApiBody({type: StudentEntranceInfoDto})
            async addStudentInRoom(@Body('roomId') roomId: string, @Body('name') name: string){
                return await this.musicService.addStudentInRoom(roomId, name)
            }

    


}
