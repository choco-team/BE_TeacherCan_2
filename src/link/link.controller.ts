import { Body, Controller, Delete, Get, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateLinkDto, GetLinkResDto, LinkCodeDto, LinkIdDto } from 'src/dto/link.dto';
import { LinkService } from './link.service';
import { LinkSQLService } from './link.sql.service';
import { TransformInterceptor } from 'src/interceptor/transform.interceptor';
import { SwaggerSuccess } from 'src/common/swagger/swagger-response.utils';

@UseInterceptors(TransformInterceptor)
@ApiTags('/link')
@Controller('/link')
export class LinkController {
      constructor(
        private readonly linkService: LinkService,
        private readonly linkSQLService: LinkSQLService,
    ) {}

    @Post('/code')
    @ApiOperation({summary: '링크코드 생성', description: '새 링크코드를 생성합니다.'})
    @SwaggerSuccess(LinkCodeDto, '링크코드가 성공적으로 생성되었습니다.')
    async createNewLinkCodeApi(@Body() dto: LinkCodeDto){
        return { 
            data: {code: await this.linkSQLService.createNewLinkCode(dto)},
            message: '링크코드가 성공적으로 생성되었습니다.',
        }
    }

    @Post('')
    @ApiOperation({summary: '링크 생성', description: '새 링크를 생성합니다.'})
    @SwaggerSuccess(LinkIdDto , "링크가 성공적으로 생성되었습니다.")
    async createNewLinkApi(@Body() dto: CreateLinkDto){
        return {
            data: { id: await this.linkSQLService.createNewLink(dto) },
            message: '링크가 성공적으로 생성되었습니다.',
        }
    }

    @Get('')
    @ApiOperation({summary: '링크목록 조회', description: '링크 목록을 가져옵니다.'})
    @SwaggerSuccess(GetLinkResDto, '링크 목록 조회 성공')
    async getLinksApi(@Query() dto : LinkCodeDto){
        return { 
            data: {links: await this.linkSQLService.getLinks(dto)},
            message: '링크 목록 조회 성공'
        }
    }

    @Delete('')
    @ApiOperation({summary: '링크 삭제', description: '링크를 삭제합니다.'})
    @SwaggerSuccess(LinkIdDto, '링크 삭제 성공')
    async deleteLinkApi(@Query() dto : LinkIdDto){
        return { 
            data: {links: await this.linkSQLService.deleteLink(dto)},
            message: '링크 삭제 성공'
        }
    }

    @Delete('code')
    @ApiOperation({summary: '링크코드 삭제', description: '링크코드를 삭제합니다.'})
    @SwaggerSuccess(LinkCodeDto, '링크코드 삭제 성공')
    async deleteLinkCodeApi(@Query() dto : LinkCodeDto){
        return { 
            data: {links: await this.linkSQLService.deleteLinkCode(dto)},
            message: '링크코드 삭제 성공'
        }
    }
}
