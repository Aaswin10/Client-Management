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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InfluencersService } from './influencers.service';
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { UpdateInfluencerDto } from './dto/update-influencer.dto';
import { SearchInfluencersDto } from './dto/search-influencers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('influencers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('influencers')
export class InfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new influencer' })
  @ApiSuccessResponse('Influencer created successfully')
  @ApiErrorResponse('Bad request')
  async create(@Body() createInfluencerDto: CreateInfluencerDto) {
    const result = await this.influencersService.create(createInfluencerDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all influencers' })
  @ApiSuccessResponse('Influencers retrieved successfully')
  async findAll() {
    const result = await this.influencersService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search influencers by name, handle, or platform' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query for name, email, or handle' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by social platform' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiSuccessResponse('Search results retrieved successfully')
  async search(@Query() searchDto: SearchInfluencersDto) {
    const result = await this.influencersService.search(searchDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an influencer by ID' })
  @ApiSuccessResponse('Influencer retrieved successfully')
  @ApiErrorResponse('Influencer not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.influencersService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get influencer statistics' })
  @ApiSuccessResponse('Influencer stats retrieved successfully')
  @ApiErrorResponse('Influencer not found')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    const result = await this.influencersService.getInfluencerStats(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an influencer' })
  @ApiSuccessResponse('Influencer updated successfully')
  @ApiErrorResponse('Influencer not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInfluencerDto: UpdateInfluencerDto,
  ) {
    const result = await this.influencersService.update(id, updateInfluencerDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an influencer' })
  @ApiSuccessResponse('Influencer deleted successfully')
  @ApiErrorResponse('Influencer not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.influencersService.remove(id);
    return {
      success: true,
      data: result,
    };
  }
}