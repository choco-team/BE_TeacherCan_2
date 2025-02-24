import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Session } from './session.entity';
import { Subject } from './subject.entity';
import { studentInterface, UserRole } from 'src/dto/user.dto';


@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  oauthId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) // ✅ 자동 생성
  createdAt: Date;

  @Column({ type: 'enum', enum: ['kakao', 'local', 'guest'] })
  provider: 'kakao' | 'local' | 'guest';

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER }) // ✅ 기본값 USER
  role: UserRole;

  @Column({type: "json"})
  studentInfo: studentInterface[];

  @OneToMany(() => Session, (session) => session.user, { cascade: true }) // ✅ 유저가 삭제되면 세션도 삭제됨
  sessions: Session[];

  // ✅ One-to-Many 관계: 한 유저가 여러 과목을 가질 수 있음
  @OneToMany(() => Subject, (subject) => subject.user)
  subjects: Subject[];

  // ✅ One-to-Many 관계: 한 유저가 여러 답안을 가질 수 있음
  @OneToMany(() => Subject, (studentAnswer) => studentAnswer.user)
  studentAnswer: Subject[];

}
