import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.module';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getHealthStatus() {
    let database = 'unknown';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'healthy';
    } catch {
      database = 'unhealthy';
    }

    return {
      status: database === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database,
      },
    };
  }
}
