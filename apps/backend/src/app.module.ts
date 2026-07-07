import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './presentation/health/health.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CharacterModule } from './domain/character/character.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    PrismaModule,
    HealthModule,
    CharacterModule,
  ],
})
export class AppModule {}
