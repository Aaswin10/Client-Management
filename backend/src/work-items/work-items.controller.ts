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
import { WorkItemsService } from './work-items.service';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('work-items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-items')
export class WorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new work item' })
  @ApiSuccessResponse('Work item created successfully')
  @ApiErrorResponse('Bad request')
  async create(@Body() createWorkItemDto: CreateWorkItemDto) {
    const result = await this.workItemsService.create(createWorkItemDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all work items' })
  @ApiSuccessResponse('Work items retrieved successfully')
  async findAll() {
    const result = await this.workItemsService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work item by ID' })
  @ApiSuccessResponse('Work item retrieved successfully')
  @ApiErrorResponse('Work item not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.workItemsService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work item' })
  @ApiSuccessResponse('Work item updated successfully')
  @ApiErrorResponse('Work item not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkItemDto: UpdateWorkItemDto,
  ) {
    const result = await this.workItemsService.update(id, updateWorkItemDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a work item' })
  @ApiSuccessResponse('Work item deleted successfully')
  @ApiErrorResponse('Work item not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.workItemsService.remove(id);
    return {
      success: true,
      data: result,
    };
  }
}