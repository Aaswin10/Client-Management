import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateCollaborationDto {
  @ApiProperty()
  @IsInt()
  influencerId: number;

  @ApiProperty()
  @IsString()
  campaignName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  deliverables: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  agreedAmountNrs: number;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}