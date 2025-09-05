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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentsDto } from './dto/filter-payments.dto';
import { PaymentReportDto } from './dto/payment-report.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiSuccessResponse('Payment created successfully')
  @ApiErrorResponse('Bad request')
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    const result = await this.paymentsService.create(createPaymentDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiSuccessResponse('Payments retrieved successfully')
  async findAll() {
    const result = await this.paymentsService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get('filter')
  @ApiOperation({ summary: 'Filter payments by various criteria' })
  @ApiSuccessResponse('Filtered payments retrieved successfully')
  async filter(@Query() filterDto: FilterPaymentsDto) {
    const result = await this.paymentsService.filter(filterDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue payments' })
  @ApiSuccessResponse('Overdue payments retrieved successfully')
  async getOverdue() {
    const result = await this.paymentsService.getOverduePayments();
    return {
      success: true,
      data: result,
    };
  }

  @Post('mark-overdue')
  @ApiOperation({ summary: 'Mark pending payments as overdue based on due date' })
  @ApiSuccessResponse('Payments marked as overdue successfully')
  async markOverdue() {
    const result = await this.paymentsService.markAsOverdue();
    return {
      success: true,
      data: result,
    };
  }

  @Post('report')
  @ApiOperation({ summary: 'Generate payment report' })
  @ApiSuccessResponse('Payment report generated successfully')
  async generateReport(@Body() reportDto: PaymentReportDto) {
    const result = await this.paymentsService.generateReport(reportDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiSuccessResponse('Payment retrieved successfully')
  @ApiErrorResponse('Payment not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.paymentsService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiSuccessResponse('Payment updated successfully')
  @ApiErrorResponse('Payment not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    const result = await this.paymentsService.update(id, updatePaymentDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiSuccessResponse('Payment deleted successfully')
  @ApiErrorResponse('Payment not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.paymentsService.remove(id);
    return {
      success: true,
      data: result,
    };
  }
}