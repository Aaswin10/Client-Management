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
import { CollaborationsService } from './collaborations.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { FilterCollaborationsDto } from './dto/filter-collaborations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('collaborations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collaborations')
export class CollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new collaboration' })
  @ApiSuccessResponse('Collaboration created successfully')
  @ApiErrorResponse('Bad request')
  async create(@Body() createCollaborationDto: CreateCollaborationDto) {
    const result = await this.collaborationsService.create(createCollaborationDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all collaborations' })
  @ApiSuccessResponse('Collaborations retrieved successfully')
  async findAll() {
    const result = await this.collaborationsService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get('filter')
  @ApiOperation({ summary: 'Filter collaborations by various criteria' })
  @ApiSuccessResponse('Filtered collaborations retrieved successfully')
  async filter(@Query() filterDto: FilterCollaborationsDto) {
    const result = await this.collaborationsService.filter(filterDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('influencer/:influencerId')
  @ApiOperation({ summary: 'Get collaborations by influencer ID' })
  @ApiSuccessResponse('Influencer collaborations retrieved successfully')
  async getByInfluencer(@Param('influencerId', ParseIntPipe) influencerId: number) {
    const result = await this.collaborationsService.getCollaborationsByInfluencer(influencerId);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collaboration by ID' })
  @ApiSuccessResponse('Collaboration retrieved successfully')
  @ApiErrorResponse('Collaboration not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.collaborationsService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collaboration' })
  @ApiSuccessResponse('Collaboration updated successfully')
  @ApiErrorResponse('Collaboration not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCollaborationDto: UpdateCollaborationDto,
  ) {
    const result = await this.collaborationsService.update(id, updateCollaborationDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collaboration' })
  @ApiSuccessResponse('Collaboration deleted successfully')
  @ApiErrorResponse('Collaboration not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.collaborationsService.remove(id);
    return {
      success: true,
      data: result,
    };
  }
}