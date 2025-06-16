import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkCode } from 'src/db/entities/linkCode.entity';
import { Links } from 'src/db/entities/links.entity';
import { CreateLinkCodeDto, CreateLinkDto, GetLinkDto } from 'src/dto/link.dto';
import { CryptoService } from 'src/services/crypto.service';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class LinkSQLService {
constructor(
        @InjectRepository(LinkCode)
        private readonly linkCodeRepository: Repository<LinkCode>,
        @InjectRepository(Links)
        private readonly linksRepository: Repository<Links>,
        private readonly cryptoService: CryptoService,
        private readonly dataSource: DataSource
) {}

  async createNewLinkCode(dto: CreateLinkCodeDto) {
    const code = dto.code

    return await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(LinkCode, { where: { code } });
      if (existing) {
        throw new ConflictException('이미 존재하는 링크코드입니다.');
      }

      const newLinkCode = manager.create(LinkCode, { code });
      const saved = await manager.save(LinkCode, newLinkCode);
      return saved.code;
    });
  }

  async createNewLink(dto: CreateLinkDto) {
    const { description, link, code} = dto
    const linkCode = await this.linkCodeRepository.findOne({ where: { code } });
    if (!linkCode) throw new BadRequestException('유효하지 않은 LinkCode입니다.');

    const existingLink  = await this.linksRepository.findOne({ where: { linkCode: { code }, link  } });
    if (existingLink) throw new BadRequestException('이미 동일한 링크가 등록되어 있습니다.');

    const newLink  = this.linksRepository.create({ link, description, linkCode });
    return (await this.linksRepository.save(newLink)).id;
  }

  async getLinks(dto: GetLinkDto) {
    const code = dto.code
    const linkCode = await this.linkCodeRepository.findOne({ where: { code }, relations: ['links'] });

    return linkCode.links
  }
}

