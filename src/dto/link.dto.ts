import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';


export class CreatedResDto {
  @ApiProperty({ example: 'uuid-1234-abcd' })
  id: string;
}

export class LinkDto {
    @ApiProperty({example: "www.naver.com", description: "링크"})
    @IsString()
    @IsNotEmpty()
    link: string;

    @ApiProperty({example: "네이버 링크", description: "링크 설명"})
    @IsString()
    description: string;
}

export class CreateLinkCodeDto {
    @ApiProperty({example: "jsm000", description: "링크코드"})
    @IsString()
    code: string;
}

export class CreateLinkDto {
    @ApiProperty({example: "jsm000", description: "링크코드"})
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({example: "www.naver.com", description: "링크"})
    @IsString()
    @IsNotEmpty()
    link: string;

    @ApiProperty({example: "네이버 링크", description: "링크 설명"})
    @IsString()
    description: string;
}

export class GetLinkDto {
    @ApiProperty({example: "jsm000", description: "링크코드"})
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class GetLinkResDto {
    @ApiProperty({description: "링크코드", type:LinkDto, isArray:true })
    @IsNotEmpty()
    links: LinkDto[]
}