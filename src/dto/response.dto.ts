import { ApiProperty } from "@nestjs/swagger";



export class UserIdResponseDto {
    @ApiProperty({example: 3, description: "과목 고유ID"}) 
  userId: number;
}

export class BaseResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: '요청이 성공적으로 처리되었습니다.' })
  message: string;

  @ApiProperty({ example: new Date().toISOString() })
  timestamp: string;
}