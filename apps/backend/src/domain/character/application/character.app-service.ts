import { Injectable } from '@nestjs/common';
import { CharacterDomainService } from '../domain/character.domain-service';
import { DigitalLife } from '../domain/entities/digital-life.entity';

@Injectable()
export class CharacterAppService {
  constructor(private readonly characterDomainService: CharacterDomainService) {}

  async getMyDigitalLife(userId: string): Promise<DigitalLife | null> {
    return this.characterDomainService.getByUserId(userId);
  }

  async getDigitalLifeById(id: string): Promise<DigitalLife | null> {
    return this.characterDomainService.getById(id);
  }

  async createDigitalLife(
    userId: string,
    data: { name: string; avatar?: string; bio?: string },
  ): Promise<DigitalLife> {
    return this.characterDomainService.create({
      userId,
      ...data,
    });
  }
}
