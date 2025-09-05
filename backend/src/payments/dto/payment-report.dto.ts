import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class PaymentReportDto {
  @ApiProperty({ description: 'Type of report', example: 'monthly' })
  @IsString()
  reportType: string;

  @ApiPropertyOptional({ description: 'Filter by influencer ID' })
  @IsOptional()
  @IsInt()
  influencerId?: number;

  @ApiPropertyOptional({ description: 'Report start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Report end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}