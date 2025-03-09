import { ApiProperty } from '@nestjs/swagger';

export class RoomTitleDto {
    @ApiProperty({example: "5학년 1반", description: "방 제목을 정해 방을 새로 생성합니다"})
    roomTitle: string
}

export class RoomIdDto {
    @ApiProperty({example: "4923c544-0c2e-4383-b40d-985b304ef05a", description: "방 ID를 전송합니다"})
    roomId: string
}

export class StudentEntranceInfoDto{
    @ApiProperty({example: "4923c544-0c2e-4383-b40d-985b304ef05a", description: "방 ID를 전송합니다"})
    roomId: string

    @ApiProperty({example: "홍길동", description: "학생명을 전송합니다"})
    name: string

}