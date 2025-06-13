import { Body, Controller, Delete, Get, Post, Query, Req, Sse } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
\import { CreateLinkCodeDto, CreateLinkDto, CreateLinkResDto } from 'src/dto/link.dto';
import { LinkService } from './link.service';
import { LinkSQLService } from './link.sql.service';
@ApiTags('/link')
@Controller('/link')
export class LinkController {
      constructor(
        private readonly linkService: LinkService,
        private readonly linkSQLService: LinkSQLService,

    ) {}

    @Post('/code')
    @ApiOperation({summary: '링크코드 생성', description: '새 링크코드를 생성합니다.'})
    @ApiBody({type: CreateLinkCodeDto})
    @ApiResponse( {status: 201, description: "링크코드의 ID를 받아옵니다" })
    @ApiResponse({ status: 409, description: '이미 존재하는 링크코드' })
    async makeNewLinkCode(@Body() dto: CreateLinkCodeDto){
        return await this.linkSQLService.createNewLinkCode(dto.linkCode)
    }

    @Post('')
    @ApiOperation({summary: '링크 생성', description: '새 링크를 생성합니다.'})
    @ApiBody({type: CreateLinkDto})
    @ApiCreatedResponse({ description: '링크가 생성되었습니다.', type: CreateLinkResDto})
    @ApiResponse( {status: 201, description: "링크의 ID를 받아옵니다" })
    async makeNewLink(@Body() dto: CreateLinkDto){
        return {id: await this.linkSQLService.createNewLink(dto)}
    }

}
