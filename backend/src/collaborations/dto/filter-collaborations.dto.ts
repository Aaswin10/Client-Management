import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsDateString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterCollaborationsDto {
  @ApiPropertyOptional({ description: 'Filter by campaign name' })
  @IsOptional()
  @IsString()
  campaignName?: string;

  @ApiPropertyOptional({ description: 'Filter by collaboration status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by influencer ID' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  influencerId?: number;

  @ApiPropertyOptional({ description: 'Filter by start date (from)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (to)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum collaboration amount' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum collaboration amount' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  maxAmount?: number;
}