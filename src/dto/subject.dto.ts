import { ApiProperty } from '@nestjs/swagger';
export class CreateSubjectDto {
  @ApiProperty({example: "수학", description: "과목이름"})
    name: string;
  }
  
  export class ModifySubjectDto {
    @ApiProperty({example: "수학", description: "선택된 원래 과목이름"})
    selected: string;

    @ApiProperty({example: "수학", description: "바꿀 과목 이름"})
    name: string;
  }
  
  