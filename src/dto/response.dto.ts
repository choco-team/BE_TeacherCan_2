import { ApiProperty } from "@nestjs/swagger";
import { answerInterface, correctAnswerType} from "./question.dto";


export class UserIdResponseDto {
    @ApiProperty({example: 3, description: "과목 고유ID"}) 
  userId: number;
}


export class QuestionInfoResponseDto {
  @ApiProperty({example: 1, description: "문항  고유ID"})  
  question_id: number;

  @ApiProperty({example: "수학", description: "과목이름"})  
  subject_name: string;

    @ApiProperty({example: "두 자리수의 덧셈 수행평가", description: "평가지 제목"})
    question_title: string;
    
    @ApiProperty({example: new Date(), description: "작성일"})
    question_createdAt: Date;
  }
  
  export class AnswerSheetResponseDto {
    @ApiProperty({example: "두 자리수의 덧셈 수행평가", description: "평가지 제목"})
    title: string;

    @ApiProperty({example: [{format: "select", counts: 5}, {format: "input"}], description: "답안 입력형식 기록"})
    answerSheet: answerInterface[]
  }

  export class QuestionDataResponseDto {
    @ApiProperty({example: "수학", description: "과목이름"})  
    subjectName: string;

    @ApiProperty({example: "두 자리수의 덧셈 수행평가", description: "평가지 제목"})
        title: string;

        @ApiProperty({example: "이 문항은 학생들에게 두 자리수의 덧셈의 받아올림 처리까지 정확히 할 수 있는지 평가하기 위해 만듬", description: "평가지 관련 보충 설명 기록"})
        comment: string;

        @ApiProperty({example: `초등학교 3학년 두자리수 덧셈 수행평가지
3학년  반 이름 :
(중략)`, description: "평가지 본문"})      
        content: string;

        @ApiProperty({example: [{format: "select", counts: 5}, {format: "input"}], description: "답안 입력형식 기록"})
        answerSheet: answerInterface[];

        @ApiProperty({example: [3, "두번째 자리수에서 받아올림"], description: "정답지 기록"})
        correctAnswer: correctAnswerType[];
        id?: number;
  }

  export class StudentInfoDto{
    @ApiProperty({example: "홍길동", description: "학생명"})  
    name: string;

    @ApiProperty({example: 50301, description: "학생 번호"})  
    number: number;
  }

  export class StudentAnswerDataDto{
    @ApiProperty({example: 50301, description: "학생 번호"})  
    studentNumber: number;

    @ApiProperty({example: 1, description: "문항  고유ID"})  
    questionId: number;

    @ApiProperty({example: 120, description: "답변 요청 길이 글자수"})  
    maxLength: number;

    @ApiProperty({example: false, description: "학생의 마지막 문항 풀이 전송인지 여부 - false: 학생의 다음 문항 및 풀이 계속 전송, true: 이 학생의 평가를 응답받음"})  
    isLastQuesiotn: boolean;
  }

  export class DeleteQuestionDto{
    @ApiProperty({example: 1, description: "문항  고유ID"})  
    id: number;
  }

  export class StudentSubmitAnswerDto{
    @ApiProperty({example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzQxMzc0MDQ0LCJleHAiOjE3NDEzNzc2NDR9.fLpVyCx-VCWLAGg7snKNVMlqkE8OqoZ55G-V1PENk-E", description: "jwt 토큰"})  
    token: string;

    @ApiProperty({example: 50301, description: "학생 번호"})  
    student: number;

    @ApiProperty({example: [3, "두번째 자리수에서 받아올림"], description: "학생 답안 기록"})
    answer: string[];
  }


  export class UrlDto{
    @ApiProperty({example: process.env.SITE_URL + "&code=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzQxMzc0MDQ0LCJleHAiOjE3NDEzNzc2NDR9.fLpVyCx-VCWLAGg7snKNVMlqkE8OqoZ55G-V1PENk-E'", description: "jwt 토큰"})  
    url: string
  }

  export class CheckStudentAnswerDto{
    @ApiProperty({example: 1, description: "답장  고유ID"})
    id: number;

    @ApiProperty({example: "두 자리수의 덧셈 수행평가", description: "평가지 제목"})
    title: string;

    @ApiProperty({example: [{format: "select", counts: 5}, {format: "input"}], description: "답안 입력형식 기록"})
    answerSheet: answerInterface[];

    @ApiProperty({example: [2, "64마리"], description: "학생의 답안지"})
    studentAnswer: correctAnswerType[]
    
    @ApiProperty({example: [2, "64마리"], description: "모범 답안"})
    correctAnswer: correctAnswerType[]

  }

  export class StudentAnswerPerQuestionDto{
    @ApiProperty({example: 1, description: "답장  고유ID"})
    id: number;

    @ApiProperty({example: 2, description: "학생 번호"})
    studentNumber: number;

    @ApiProperty({example: [2, "64마리"], description: "학생의 답안"})
    studentAnswer: correctAnswerType[];
  }