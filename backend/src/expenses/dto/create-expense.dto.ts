import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsDateString, IsEnum, Min } from 'class-validator';
import { ExpenseSource } from '@prisma/client';

export class CreateExpenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  staffId?: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amountNrs: number;

  @ApiProperty({ enum: ExpenseSource })
  @IsEnum(ExpenseSource)
  source: ExpenseSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}