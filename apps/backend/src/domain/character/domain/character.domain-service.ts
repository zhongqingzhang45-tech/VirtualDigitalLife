import { Inject, Injectable } from '@nestjs/common';
import { DigitalLife, DigitalLifeStatus } from './entities/digital-life.entity';
import { CharacterRepository, CreateDigitalLifeData } from './repositories/character.repository';

@Injectable()
export class CharacterDomainService {
  constructor(
    @Inject('CharacterRepository')
    private readonly characterRepository: CharacterRepository,
  ) {}

  async getById(id: string): Promise<DigitalLife | null> {
    return this.characterRepository.findById(id);
  }

  async getByUserId(userId: string): Promise<DigitalLife | null> {
    return this.characterRepository.findByUserId(userId);
  }

  async create(data: CreateDigitalLifeData): Promise<DigitalLife> {
    return this.characterRepository.create(data);
  }

  async updateName(id: string, name: string): Promise<DigitalLife> {
    return this.characterRepository.update(id, { name });
  }

  async updateAvatar(id: string, avatar: string): Promise<DigitalLife> {
    return this.characterRepository.update(id, { avatar });
  }

  async markActive(id: string): Promise<void> {
    await Promise.all([
      this.characterRepository.updateLastActiveTime(id),
      this.characterRepository.incrementInteractionCount(id),
    ]);
  }

  async incrementMemoryCount(id: string): Promise<void> {
    await this.characterRepository.incrementMemoryCount(id);
  }

  async getStatus(id: string): Promise<DigitalLifeStatus | null> {
    const life = await this.characterRepository.findById(id);
    return life?.status ?? null;
  }
}
