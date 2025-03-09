import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Session } from './session.entity';
import { Subject } from './subject.entity';
import { UserRole } from 'src/dto/user.dto';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  /** 🔹 SHA-256 해싱된 OAuth ID */
  @Column({ type: 'varchar', length: 255, unique: true })
  oauthIdHash: string;

  /** 🔹 AES 암호화된 OAuth ID */
  @Column("text")
  encryptedOauthId: string;

  @Column({type:"varchar", length:255})
  ivOauthId: string;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @Column({ type: 'enum', enum: ['kakao', 'local', 'guest'] })
  provider: 'kakao' | 'local' | 'guest';

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER }) // ✅ 기본값 USER
  role: UserRole;

  /** 🔹 AES 암호화된 학생 정보 */
  @Column("text", { nullable: true })
  encryptedStudentInfo: string;

  @Column({type:"varchar", length:255})
  ivStudentInfo: string;

  @Column({ default: 0 })
  remainingTokens: number;

  @OneToMany(() => Session, (session) => session.user, { cascade: true }) // ✅ 유저가 삭제되면 세션도 삭제됨
  sessions: Session[];

  // ✅ One-to-Many 관계: 한 유저가 여러 과목을 가질 수 있음
  @OneToMany(() => Subject, (subject) => subject.user)
  subjects: Subject[];

  // ✅ One-to-Many 관계: 한 유저가 여러 답안을 가질 수 있음
  @OneToMany(() => Subject, (studentAnswer) => studentAnswer.user)
  studentAnswer: Subject[];

}
