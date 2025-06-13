import { Entity, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { LinkCode } from "./linkCode.entity";

@Entity("links")
export class Links {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", length: 255 })
  link: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string;
  
  @CreateDateColumn({ type: "timestamp" })
  timeStamp: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  
  @ManyToOne(() => LinkCode, (LinkCode) => LinkCode.linkCode, { onDelete: "CASCADE", onUpdate: "CASCADE"})
  linkCode: LinkCode;
}