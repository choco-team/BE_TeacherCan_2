import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOrCreate(kakaoId: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { oauthId:kakaoId } });

    if (!user) {
      user = this.userRepository.create({ oauthId:kakaoId, provider:"kakao" });
      await this.userRepository.save(user);
    }

    return user;
  }

  async findById(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { id } });
  }
  
}
