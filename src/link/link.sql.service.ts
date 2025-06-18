import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkCode } from 'src/db/entities/linkCode.entity';
import { Links } from 'src/db/entities/links.entity';
import { CreateLinkDto, LinkCodeDto, LinkIdDto } from 'src/dto/link.dto';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class LinkSQLService {
constructor(
        @InjectRepository(LinkCode)
        private readonly linkCodeRepository: Repository<LinkCode>,
        @InjectRepository(Links)
        private readonly linksRepository: Repository<Links>,
        private readonly dataSource: DataSource
) {}

  async createNewLinkCode(dto: LinkCodeDto) {
    const code = dto.code

    return await this.dataSource.transaction(async (manager) => {
      const newLinkCode = manager.create(LinkCode, { code });
      try {
        return (await manager.insert(LinkCode, newLinkCode)).identifiers[0].code;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
          throw new ConflictException('이미 존재하는 링크코드입니다.');
        }
        throw err;
      }
    });
  }

  async createNewLink(dto: CreateLinkDto) {
    const { description, link, code} = dto

    return await this.dataSource.transaction(async manager => {
      const exists = await manager.getRepository(LinkCode).exists({ where: { code } });
      if (!exists) throw new BadRequestException('유효하지 않은 링크 코드입니다.');

      const linkCodeEntity = new LinkCode(code);
      linkCodeEntity.code = code;

      const newLink = manager.create(Links, { link, description, linkCode: linkCodeEntity});
      try {
        const saved = await manager.save(Links, newLink);
        return { id: saved.id };
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' || err.code === 'SQLITE_CONSTRAINT') {
          throw new BadRequestException('이미 동일한 링크가 등록되어 있습니다.');
        }
        throw err;
      }
    });
  }

  async getLinks(dto: LinkCodeDto) {
    const { code } = dto;

    const links = await this.linksRepository
      .createQueryBuilder('links')              
      .innerJoin('links.linkCode', 'linkCode') 
      .where('linkCode.code = :code', { code }) 
      .select(['links.id', 'links.link', 'links.description'])
      .getMany();

    if (links.length === 0) { // 링크가 존재하지 않을경우 linkCode가 유효한지 검사 (매번 검사)
      const exists = await this.linkCodeRepository.exists({ where: { code } });
      if (!exists) throw new BadRequestException('유효하지 않은 링크 코드입니다.');
      return [] // 링크코드가 문제 없을 경우 빈 배열이 맞으므로 [] 전달
    }
    return links;
  }

  async deleteLink(dto: LinkIdDto) {
    const {id} = dto
    const result = await this.linksRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('삭제할 링크가 존재하지 않습니다.');
    }
  }

  async deleteLinkCode(dto: LinkCodeDto) {
    const {code} = dto
    const result = await this.linkCodeRepository.delete(code);

    if (result.affected === 0) {
      throw new NotFoundException('삭제할 링크코드가 존재하지 않습니다.');
    }
  }
}



