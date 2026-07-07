import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { CharacterAppService } from '../application/character.app-service';
import { CreateDigitalLifeDto } from './dto/create-digital-life.dto';

@Controller('life')
export class CharacterController {
  constructor(private readonly characterAppService: CharacterAppService) {}

  @Get('mine')
  async getMyLife(@Request() req: any) {
    const userId = req.user?.id ?? 'dev-user-001';
    const life = await this.characterAppService.getMyDigitalLife(userId);
    return {
      code: 0,
      data: life,
    };
  }

  @Post('create')
  async createLife(@Request() req: any, @Body() dto: CreateDigitalLifeDto) {
    const userId = req.user?.id ?? 'dev-user-001';
    const life = await this.characterAppService.createDigitalLife(userId, dto);
    return {
      code: 0,
      data: life,
    };
  }
}
