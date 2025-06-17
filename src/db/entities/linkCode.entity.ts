import { Entity, UpdateDateColumn, PrimaryColumn, OneToMany } from "typeorm";
import { Links } from "./links.entity";

@Entity("link_code")
export class LinkCode {
  constructor(code?: string) {
    this.code = code;
  }

  @PrimaryColumn({ type: 'varchar', length: 255 })
  code: string;

  @UpdateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => Links, (links) => links.linkCode)
  links: Links[];
}