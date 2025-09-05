import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('income')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new income record' })
  @ApiSuccessResponse('Income created successfully')
  @ApiErrorResponse('Bad request')
  async create(@Body() createIncomeDto: CreateIncomeDto) {
    const result = await this.incomeService.create(createIncomeDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all income records' })
  @ApiSuccessResponse('Income records retrieved successfully')
  async findAll() {
    const result = await this.incomeService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an income record by ID' })
  @ApiSuccessResponse('Income retrieved successfully')
  @ApiErrorResponse('Income not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.incomeService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an income record' })
  @ApiSuccessResponse('Income updated successfully')
  @ApiErrorResponse('Income not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    const result = await this.incomeService.update(id, updateIncomeDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an income record' })
  @ApiSuccessResponse('Income deleted successfully')
  @ApiErrorResponse('Income not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.incomeService.remove(id);
    return {
      success: true,
      data: result,
    };
  }
}