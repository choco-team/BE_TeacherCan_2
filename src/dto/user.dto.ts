import { Session } from "src/db/entities/session.entity"

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  GUEST = 'guest'
}

export interface studentInterface{
  name: string,
  number: number
}

export interface userInterface{
  id: number | null,
  role: UserRole,
  sessions: Session[]
}

