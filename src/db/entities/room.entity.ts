import { Entity, Column, UpdateDateColumn, PrimaryColumn } from "typeorm";

@Entity("rooms")
export class Room {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 255 })
  roomTitle?: string;

  @UpdateDateColumn({ type: 'timestamp' })
  connectedAt: Date;
}