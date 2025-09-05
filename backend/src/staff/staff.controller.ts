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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { MonthlyPayoutDto } from './dto/monthly-payout.dto';
import { StaffDetailsQueryDto } from './dto/staff-details.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  @ApiSuccessResponse('Staff created successfully')
  @ApiErrorResponse('Bad request')
  async create(@Body() createStaffDto: CreateStaffDto) {
    const result = await this.staffService.create(createStaffDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff members' })
  @ApiSuccessResponse('Staff retrieved successfully')
  async findAll() {
    const result = await this.staffService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a staff member by ID with optional date range filtering' })
  @ApiSuccessResponse('Staff retrieved successfully')
  @ApiErrorResponse('Staff not found')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: StaffDetailsQueryDto,
  ) {
    const { startDate, endDate } = query;
    const result = await this.staffService.findOne(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  @ApiSuccessResponse('Staff updated successfully')
  @ApiErrorResponse('Staff not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    const result = await this.staffService.update(id, updateStaffDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff member' })
  @ApiSuccessResponse('Staff deleted successfully')
  @ApiErrorResponse('Staff not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.staffService.remove(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/payout/monthly')
  @ApiOperation({ summary: 'Create monthly payout for staff member' })
  @ApiSuccessResponse('Monthly payout created successfully')
  @ApiErrorResponse('Staff not found or invalid staff type')
  async monthlyPayout(
    @Param('id', ParseIntPipe) id: number,
    @Body() monthlyPayoutDto: MonthlyPayoutDto,
  ) {
    const result = await this.staffService.monthlyPayout(id, monthlyPayoutDto);
    return {
      success: true,
      data: result,
    };
  }
}