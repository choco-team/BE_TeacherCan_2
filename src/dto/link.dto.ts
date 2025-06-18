import { ApiProperty } from '@nestjs/swagger';

export class LinkDto {
    @ApiProperty({example: "www.naver.com", description: "링크"})
    link: string;

    @ApiProperty({example: "네이버 링크", description: "링크 설명"})
    description: string;
}

export class LinkIdDto {
    @ApiProperty({ example: 'uuid-1234-abcd', description: "링크 id" })
    id: string;
}

export class LinkCodeDto {
    @ApiProperty({example: "jsm000", description: "링크코드"})
    code: string;
}

export class CreateLinkDto {
    @ApiProperty({example: "jsm000", description: "링크코드"})
    code: string;

    @ApiProperty({example: "www.naver.com", description: "링크"})
    link: string;

    @ApiProperty({example: "네이버 링크", description: "링크 설명"})
    description: string;
}

export class GetLinkResDto {
    @ApiProperty({description: "링크코드", type:LinkDto, isArray:true })
    links: LinkDto[]
}