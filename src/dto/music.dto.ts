import { ApiProperty } from '@nestjs/swagger';

export class RoomTitleDto {
    @ApiProperty({example: "5학년 1반", description: "방 제목을 정해 방을 새로 생성합니다"})
    roomTitle: string;
}

export class RoomIdDto {
    @ApiProperty({example: "4923c544-0c2e-4383-b40d-985b304ef05a", description: "방 ID를 전송합니다"})
    roomId: string;
}

export class StudentEntranceInfoDto{
    @ApiProperty({example: "4923c544-0c2e-4383-b40d-985b304ef05a", description: "방 ID를 전송합니다"})
    roomId: string;

    @ApiProperty({example: "홍길동", description: "학생명을 전송합니다"})
    name: string;
}

export class AddMusicInRoomDto{
    @ApiProperty({example: "4923c544-0c2e-4383-b40d-985b304ef05a", description: "방 ID를 전송합니다"})
    roomId: string;

    @ApiProperty({example: "홍길동", description: "학생명을 전송합니다"})
    student: string;

    @ApiProperty({example: "cbuZfY2S2UQ", description: "음악 ID를 전송합니다"})
    musicId: string;

    @ApiProperty({example: "[ 𝑷𝒍𝒂𝒚𝒍𝒊𝒔𝒕 ] 코딩할때 듣기 좋은 노래", description: "음악의 제목을 전송합니다"})
    title: string;
}

export class DeleteMusicInRoomDto{
    @ApiProperty({example: "4923c544-0c2e-4383-b40d-985b304ef05a", description: "방 ID를 전송합니다"})
    roomId: string;

    @ApiProperty({example: "cbuZfY2S2UQ", description: "음악 ID를 전송합니다"})
    musicId: string;
}