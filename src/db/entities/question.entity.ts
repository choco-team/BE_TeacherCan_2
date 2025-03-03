import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Generated } from "typeorm";
import { Subject } from "./subject.entity"; // 🔹 FK 관계 대상 테이블

@Entity("questions")
export class Question {
    @PrimaryGeneratedColumn()
    id: number;

    /** 🔹 FK 관계 (Many-to-One) */
    @ManyToOne(() => Subject, (subject) => subject.questions, { onDelete: "CASCADE", eager: true }) 
    @JoinColumn({ name: "subjectsId" }) // 🔹 FK 컬럼과 매핑
    subjects: Subject;

    /** 🔹 FK ID 컬럼 (DB에서 직접 참조 가능) */
    @Column({ type: "int" })
    subjectsId: number;

    @Column({ length: 255 })
    title: string;

    @Column("text")
    encryptedContent: string; // 🔹 암호화된 본문

    @Column({type:"varchar", length:255})
    ivContentId: string;  

    @Column("text", { nullable: true })
    encryptedComment?: string; // 🔹 암호화된 해설

    @Column({type:"varchar", length:255})
    ivCommentId: string;  

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    createdAt: Date;

    @Column({ type: "uuid", unique: true })
    @Generated('uuid')
    uuid: string;

    @Column("text")
    encryptedAnswerSheets: string; // 🔹 암호화된 답안지

    @Column({type:"varchar", length:255})
    ivAnswerSheets: string;  

    @Column("text")
    encryptedCorrectAnswer: string; // 🔹 암호화된 정답

    @Column({type:"varchar", length:255})
    ivCorrectAnswer: string;
  

}
