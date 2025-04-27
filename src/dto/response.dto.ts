import { ApiProperty } from "@nestjs/swagger";



export class UserIdResponseDto {
    @ApiProperty({example: 3, description: "과목 고유ID"}) 
  userId: number;
}

