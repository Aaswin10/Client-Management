import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { SocialPlatform } from '@prisma/client';

export class SearchInfluencersDto {
  @ApiPropertyOptional({ description: 'Search query for name, email, or handle' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: SocialPlatform, description: 'Filter by social platform' })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}