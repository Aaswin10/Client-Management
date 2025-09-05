import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsDateString, Min, IsString, ValidateIf } from 'class-validator';

export class CreateStaffWorkDto {
  @ApiProperty()
  @IsInt()
  staffId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  workItemId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  clientId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @ValidateIf(o => o.workItemId !== undefined)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @ValidateIf(o => o.workItemId !== undefined)
  unitRateNrs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  performedAt?: string;
}