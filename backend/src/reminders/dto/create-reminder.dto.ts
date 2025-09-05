import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReminderType {
  CONTRACT_EXPIRY = 'CONTRACT_EXPIRY',
  STAFF_CONTRACT = 'STAFF_CONTRACT',
  PAYMENT_DUE = 'PAYMENT_DUE',
  GENERAL = 'GENERAL'
}

export enum ReminderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ReminderStage {
  INITIAL = 'INITIAL',
  MIDPOINT = 'MIDPOINT', 
  FINAL = 'FINAL'
}

export class CreateReminderDto {
  @ApiProperty({ description: 'Title of the reminder', example: 'Contract Expiry Reminder' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the reminder', example: 'Client contract will expire soon' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Type of reminder', enum: ReminderType, example: ReminderType.CONTRACT_EXPIRY })
  @IsEnum(ReminderType)
  type: ReminderType;

  @ApiPropertyOptional({ description: 'Priority of the reminder', enum: ReminderPriority, default: ReminderPriority.MEDIUM })
  @IsEnum(ReminderPriority)
  @IsOptional()
  priority?: ReminderPriority = ReminderPriority.MEDIUM;

  @ApiPropertyOptional({ description: 'Stage of the reminder', enum: ReminderStage })
  @IsEnum(ReminderStage)
  @IsOptional()
  stage?: ReminderStage;

  @ApiProperty({ description: 'Due date of the reminder', example: '2024-12-31' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Related client ID', example: 1 })
  @IsNumber()
  @IsOptional()
  clientId?: number;

  @ApiPropertyOptional({ description: 'Related staff ID', example: 1 })
  @IsNumber()
  @IsOptional()
  staffId?: number;

  @ApiPropertyOptional({ description: 'Whether the reminder is completed', default: false })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean = false;
} 