import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerSheetItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsIn(['select', 'input', 'textarea']) // format은 정해진 값 중 하나만
  format: 'select' | 'input' | 'textarea';

  @IsOptional()
  @IsNumber()
  counts?: number;
}

class StudentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  number: number;
}

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerSheetItemDto)
  answerSheet: AnswerSheetItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentDto)
  studentList: StudentDto[];
}
