import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity"; // 🔹 사용자 엔티티

@Entity("student_answers")
export class StudentAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int", nullable: false })
    studentNumber: number;

    /** 🔹 암호화된 답변 필드 */
    @Column("text", { nullable: true })
    encryptedAnswer: string; 

    @Column()
    questionId: number;

    @ManyToOne(() => User, (user) => user.studentAnswer, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column()
    userId: number;

}
