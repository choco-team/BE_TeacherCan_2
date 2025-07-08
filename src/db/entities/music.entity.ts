import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./room.entity";
import { Student } from "./student.entity"

@Entity("musics")
export class Music {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", length: 255 })
  musicId: string;

  @Column({ type: "varchar", length: 255 })
  roomId: string;

  @Column({ type: "int" })
  studentId: number;
  @Column({ type: "varchar", nullable: true })
  studentName: string

  @Column({ type: "varchar", length: 255, nullable: true })
  title?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timeStamp: Date;
}
