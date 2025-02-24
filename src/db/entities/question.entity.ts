import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index, JoinColumn, Generated } from "typeorm";
import { Subject } from "./subject.entity"; // subjects 테이블이 존재한다고 가정
import { answerInterface, correctAnswerType } from "src/dto/question.dto";

@Entity("questions")
export class Question {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Subject, (subject) => subject.questions, { onDelete: "CASCADE" }) // 외래키 관계
    @JoinColumn({ name: "subjectsId" })
    subjects: Subject

    @Column()
    subjectsId: number;

    @Column({ length: 255 })
    title: string;

    @Column("text")
    content: string;

    @Column("text", { nullable: true })
    comment?: string;

    @CreateDateColumn({ type: "datetime" })
    createdAt: Date;

    @Column({ type: "uuid", unique: true })
    @Generated('uuid')
    uuid: string;

    @Column("json")
    answer_sheets: answerInterface[];

    @Column("json")
    correct_answer: correctAnswerType[];
}
