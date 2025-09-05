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
import { StaffWorksService } from './staff-works.service';
import { CreateStaffWorkDto } from './dto/create-staff-work.dto';
import { UpdateStaffWorkDto } from './dto/update-staff-work.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('staff-works')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff-works')
export class StaffWorksController {
  constructor(private readonly staffWorksService: StaffWorksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new staff work record' })
  @ApiSuccessResponse('Staff work created successfully')
  @ApiErrorResponse('Bad request')
  async create(@Body() createStaffWorkDto: CreateStaffWorkDto) {
    const result = await this.staffWorksService.create(createStaffWorkDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff work records' })
  @ApiSuccessResponse('Staff works retrieved successfully')
  async findAll() {
    const result = await this.staffWorksService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a staff work record by ID' })
  @ApiSuccessResponse('Staff work retrieved successfully')
  @ApiErrorResponse('Staff work not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.staffWorksService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff work record' })
  @ApiSuccessResponse('Staff work updated successfully')
  @ApiErrorResponse('Staff work not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStaffWorkDto: UpdateStaffWorkDto,
  ) {
    const result = await this.staffWorksService.update(id, updateStaffWorkDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff work record' })
  @ApiSuccessResponse('Staff work deleted successfully')
  @ApiErrorResponse('Staff work not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.staffWorksService.remove(id);
    return {
      success: true,
      data: result,
    };
  }
}