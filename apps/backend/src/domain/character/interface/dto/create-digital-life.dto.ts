import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateDigitalLifeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
