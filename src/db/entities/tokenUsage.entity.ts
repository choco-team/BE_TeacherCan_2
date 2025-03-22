import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('token_usage')
export class TokenUsage {
    @PrimaryGeneratedColumn('uuid')  // UUID를 자동 생성하여 PK로 사용
    id: string;

    @Column()
    userId: number;

    @Column()
    promptTokens: number;

    @Column()
    completionTokens: number;

    @Column()
    totalTokens: number;

    @Column()
    model: string;

    @CreateDateColumn()
    createdAt: Date;
}
