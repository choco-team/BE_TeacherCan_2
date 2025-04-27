import { Entity, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./room.entity";
import { Student } from "./student.entity"

@Entity("musics")
export class Music {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", length: 255 })
  musicId: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  roomId: string;

  @Column({ type: "int", nullable: true })
  studentId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  nickname: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  title?: string;

  @CreateDateColumn({ type: "timestamp" })
  timeStamp: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;  

  @ManyToOne(() => Student, (student) => student.id, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  student: Student;

  @ManyToOne(() => Room, (room) => room.id, { onDelete: "CASCADE", onUpdate: "CASCADE", nullable: true })
  room: Room;
}
