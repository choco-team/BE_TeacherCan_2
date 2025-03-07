import { ApiProperty } from "@nestjs/swagger";
import { answerInterface, correctAnswerType, questionDataDto } from "./question.dto";
import { IntersectionType } from '@nestjs/mapped-types';

export class UserIdResponseDto {
  userId: number;
}


export class QuestionInfoResponseDto {
    id: number;

    name: string;

    title: string;
    
    createdAt: Date;
  }
  
  export class AnswerSheetResponseDto {
    title: string;

    answerSheet: answerInterface[]
  }

  export class QuestionDataResponseDto {
        subjectName: string;
        title: string;
        comment: string;
        content: string;
        answerSheet: answerInterface[];
        correctAnswer: correctAnswerType[];
        id?: number;
  }

  export class StudentInfoDto{
    name: string;
    number: number;
  }

  export class StudentAnswerDataDto{
    studentNumber: number;
    questionId: number;
    maxLength: number;
    isLastQuesiotn: boolean;
  }

  export class DeleteQuestionDto{
    id: number;
  }

  export class StudentSubmitAnswerDto{
    token: string;
    student: number;
    answer: string[];
  }