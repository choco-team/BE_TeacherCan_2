import { Entity, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Room } from "./room.entity";
import { Student } from "./student.entity"

@Entity("musics")
export class Music {
  @Column({ type: "varchar", length: 255 })
  id: string;

  @Column({ type: "varchar", length: 255 })
  roomId: string;

  @Column({ type: "int" })
  studentId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  title?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timeStamp: Date;

  @ManyToOne(() => Student, (student) => student.id, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  student: Student;

  @ManyToOne(() => Room, (room) => room.id, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  room: Room;
}
