import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RsaKey {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: false })
    publicKey: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    keyVersion: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
