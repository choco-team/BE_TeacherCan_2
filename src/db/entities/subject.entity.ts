import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./user.entity";
import { Question } from "./question.entity";

@Entity("subjects")
export class Subject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ type: "varchar", length: 255 })
    name: string;

    // ✅ FK: userId (Many-to-One)
    @ManyToOne(() => User, (user) => user.subjects, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" }) // userId 컬럼과 연결
    user: User;

    // ✅ One-to-Many: subjects → questions (1:N 관계)
    @OneToMany(() => Question, (question) => question.subjects)
    questions: Question[];
}
