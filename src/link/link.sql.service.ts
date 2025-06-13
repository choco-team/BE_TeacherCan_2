import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkCode } from 'src/db/entities/linkCode.entity';
import { Links } from 'src/db/entities/links.entity';
import { CreateLinkDto } from 'src/dto/link.dto';
import { CryptoService } from 'src/services/crypto.service';
import { Repository } from 'typeorm';

@Injectable()
export class LinkSQLService {
constructor(
        @InjectRepository(LinkCode)
        private readonly linkCodeRepository: Repository<LinkCode>,
        @InjectRepository(Links)
        private readonly linksRepository: Repository<Links>,
        private readonly cryptoService: CryptoService
) {}

  async createNewLinkCode(linkCode: string) {
    const existing = await this.linkCodeRepository.findOne({ where: { linkCode } });

    if (existing) {
      throw new ConflictException('이미 존재하는 링크코드입니다.');
    }

    // 트랜젝션 추가하기!!@!@!@!@!@!@
    const newLinkCode  = this.linkCodeRepository.create({ linkCode });
    return (await this.linkCodeRepository.save(newLinkCode)).id;
  }

  async createNewLink(linkDto: CreateLinkDto) {
    const { description, link} = linkDto
    const linkCode = await this.linkCodeRepository.findOne({ where: { linkCode: linkDto.linkCode } });
    if (!linkCode) throw new BadRequestException('유효하지 않은 LinkCode입니다.');

    const existingLink  = await this.linksRepository.findOne({ where: { linkCode, link  } });
    if (existingLink) throw new BadRequestException('이미 동일한 링크가 등록되어 있습니다.');

    const newLink  = this.linksRepository.create({ link, description, linkCode });
    return (await this.linksRepository.save(newLink)).id;
  }
}

