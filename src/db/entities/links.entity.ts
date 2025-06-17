import { Entity, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, JoinColumn, Unique } from "typeorm";
import { LinkCode } from "./linkCode.entity";

@Entity("links")
@Unique(['link', 'linkCode'])
export class Links {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", length: 255 })
  link: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string;
  
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  
  @ManyToOne(() => LinkCode, (linkCode) => linkCode.links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'linkCode' }) 
  linkCode: LinkCode;
}