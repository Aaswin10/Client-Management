import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get account summary with totals and analytics' })
  @ApiSuccessResponse('Account summary retrieved successfully')
  async getSummary() {
    const result = await this.accountsService.getSummary();
    return {
      success: true,
      data: result,
    };
  }

  @Get('staff-work-payout-preview')
  @ApiOperation({ summary: 'Get staff work payout preview for a specific month' })
  @ApiQuery({ name: 'month', type: Number, description: 'Month (1-12)' })
  @ApiQuery({ name: 'year', type: Number, description: 'Year' })
  @ApiQuery({ name: 'staffId', type: Number, required: false, description: 'Optional staff ID filter' })
  @ApiSuccessResponse('Staff work payout preview retrieved successfully')
  async getStaffWorkPayoutPreview(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('staffId') staffId?: string,
  ) {
    const staffIdNum = staffId ? parseInt(staffId) : undefined;
    const result = await this.accountsService.getStaffWorkPayoutPreview(month, year, staffIdNum);
    return {
      success: true,
      data: result,
    };
  }
}