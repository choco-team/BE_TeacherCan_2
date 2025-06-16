import { Body, Controller, Delete, Get, Post, Query, Req, Sse, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatedResDto, CreateLinkCodeDto, CreateLinkDto, GetLinkDto, GetLinkResDto } from 'src/dto/link.dto';
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
    @ApiBody({type: CreateLinkCodeDto})
    @SwaggerSuccess(CreatedResDto)
    async makeNewLinkCode(@Body() dto: CreateLinkCodeDto){
        return { id: await this.linkSQLService.createNewLinkCode(dto) }
    }

    @Post('')
    @ApiOperation({summary: '링크 생성', description: '새 링크를 생성합니다.'})
    @ApiBody({type: CreateLinkDto})
    @SwaggerSuccess(CreatedResDto , "링크가 성공적으로 생성되었습니다.")
    async makeNewLink(@Body() dto: CreateLinkDto){
        return {
            data: { id: await this.linkSQLService.createNewLink(dto) },
            message: '링크가 성공적으로 생성되었습니다.',
        }
    }

    @Get('')
    @ApiOperation({summary: '링크목록 가져오기', description: '링크 목록을 가져옵니다.'})
    @SwaggerSuccess(GetLinkResDto)
    async getLink(@Query() dto : GetLinkDto){
        return { links: await this.linkSQLService.getLinks(dto)}
    }

}
