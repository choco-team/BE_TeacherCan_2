import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("link_code")
export class LinkCode {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique:true, type: "varchar", length: 255 })
  linkCode: string;

  @UpdateDateColumn({ type: 'timestamp' })
  connectedAt: Date;
}