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

    @Column()
    questionId: number;

    @ManyToOne(() => Question, question => question.studentAnswer, { onDelete: "CASCADE" })
    @JoinColumn({ name: "questionId" })
    question: Question;

    @ManyToOne(() => User, user => user.studentAnswer, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column()
    userId: number;  
}
