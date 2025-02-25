import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Question } from "./question.entity"; // 질문 엔티티
import { User } from "./user.entity"; // 사용자 엔티티

@Entity("student_answers")
export class StudentAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int", nullable: false })
    studentNumber: number;

    @Column({ type: "json", nullable: true })
    answer: any;

    @ManyToOne(() => Question, question => question.studentAnswer, { onDelete: "CASCADE" })
    @JoinColumn({ name: "questionId" })
    question: Question;

    @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", nullable: false })
    studentName: string;

    @ManyToOne(() => User, user => user.studentAnswer, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column()
    userId: number;  
}
