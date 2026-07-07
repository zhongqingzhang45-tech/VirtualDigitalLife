import { Module } from '@nestjs/common';
import { CharacterController } from './interface/character.controller';
import { CharacterAppService } from './application/character.app-service';
import { CharacterRepositoryImpl } from './infrastructure/character.repository.impl';
import { CharacterDomainService } from './domain/character.domain-service';

@Module({
  controllers: [CharacterController],
  providers: [
    CharacterAppService,
    CharacterDomainService,
    {
      provide: 'CharacterRepository',
      useClass: CharacterRepositoryImpl,
    },
  ],
  exports: [CharacterDomainService],
})
export class CharacterModule {}
