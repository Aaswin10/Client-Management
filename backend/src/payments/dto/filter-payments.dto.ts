import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export class FilterPaymentsDto {
  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filter by payment status' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Filter by payment method' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filter by influencer ID' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  influencerId?: number;

  @ApiPropertyOptional({ description: 'Filter by collaboration ID' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  collaborationId?: number;

  @ApiPropertyOptional({ description: 'Minimum payment amount' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum payment amount' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by payment date (from)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by payment date (to)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}