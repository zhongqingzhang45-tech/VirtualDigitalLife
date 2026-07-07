import { DigitalLife } from '../entities/digital-life.entity';

export interface CharacterRepository {
  findById(id: string): Promise<DigitalLife | null>;
  findByUserId(userId: string): Promise<DigitalLife | null>;
  create(data: CreateDigitalLifeData): Promise<DigitalLife>;
  update(id: string, data: Partial<DigitalLife>): Promise<DigitalLife>;
  incrementInteractionCount(id: string): Promise<void>;
  incrementMemoryCount(id: string): Promise<void>;
  updateLastActiveTime(id: string): Promise<void>;
}

export interface CreateDigitalLifeData {
  userId: string;
  name: string;
  avatar?: string;
  bio?: string;
}
