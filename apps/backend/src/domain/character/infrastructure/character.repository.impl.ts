import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.module';
import { DigitalLife, DigitalLifeStatus } from '../domain/entities/digital-life.entity';
import { CharacterRepository, CreateDigitalLifeData } from '../domain/repositories/character.repository';

@Injectable()
export class CharacterRepositoryImpl implements CharacterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DigitalLife | null> {
    const model = await this.prisma.digitalLife.findUnique({
      where: { id, deletedAt: null },
    });
    return model ? this.toEntity(model) : null;
  }

  async findByUserId(userId: string): Promise<DigitalLife | null> {
    const model = await this.prisma.digitalLife.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return model ? this.toEntity(model) : null;
  }

  async create(data: CreateDigitalLifeData): Promise<DigitalLife> {
    const model = await this.prisma.digitalLife.create({
      data: {
        userId: data.userId,
        name: data.name,
        avatarUrl: data.avatar ?? null,
        bio: data.bio ?? null,
      },
    });
    return this.toEntity(model);
  }

  async update(id: string, data: Partial<DigitalLife>): Promise<DigitalLife> {
    const model = await this.prisma.digitalLife.update({
      where: { id },
      data: {
        name: data.name,
        avatarUrl: data.avatar,
        bio: data.bio,
        status: data.status as any,
      },
    });
    return this.toEntity(model);
  }

  async incrementInteractionCount(id: string): Promise<void> {
    await this.prisma.digitalLife.update({
      where: { id },
      data: { totalInteractionCount: { increment: 1 } },
    });
  }

  async incrementMemoryCount(id: string): Promise<void> {
    await this.prisma.digitalLife.update({
      where: { id },
      data: { totalMemoryCount: { increment: 1 } },
    });
  }

  async updateLastActiveTime(id: string): Promise<void> {
    await this.prisma.digitalLife.update({
      where: { id },
      data: { lastActiveTime: new Date() },
    });
  }

  private toEntity(model: any): DigitalLife {
    return {
      id: model.id,
      userId: model.userId,
      name: model.name,
      avatar: model.avatarUrl,
      bio: model.bio,
      status: model.status as DigitalLifeStatus,
      birthTime: model.birthTime,
      lastActiveTime: model.lastActiveTime,
      totalInteractionCount: model.totalInteractionCount,
      totalMemoryCount: model.totalMemoryCount,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
