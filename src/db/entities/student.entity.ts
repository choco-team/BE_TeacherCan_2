import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Room } from "./room.entity";

@Entity("students")
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  roomId: string;

  @Column({ type: "varchar", length: 255 })
  encryptedName: string;

  @Column({ type: "varchar", length: 255 })
  ivName: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  visitedAt: Date;

  @ManyToOne(() => Room, (room) => room.id)
  room: Room;
}
