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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense record' })
  @ApiSuccessResponse('Expense created successfully')
  @ApiErrorResponse('Bad request')
  async create(@Body() createExpenseDto: CreateExpenseDto) {
    const result = await this.expensesService.create(createExpenseDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all expense records' })
  @ApiSuccessResponse('Expenses retrieved successfully')
  async findAll() {
    const result = await this.expensesService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense record by ID' })
  @ApiSuccessResponse('Expense retrieved successfully')
  @ApiErrorResponse('Expense not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.expensesService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense record' })
  @ApiSuccessResponse('Expense updated successfully')
  @ApiErrorResponse('Expense not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    const result = await this.expensesService.update(id, updateExpenseDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense record' })
  @ApiSuccessResponse('Expense deleted successfully')
  @ApiErrorResponse('Expense not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.expensesService.remove(id);
    return {
      success: true,
      data: result,
    };
  }
}