import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AdjustAccountDto } from './dto/adjust-account.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('contractPdf'))
  @ApiOperation({ summary: 'Create a new client' })
  @ApiConsumes('multipart/form-data')
  @ApiSuccessResponse('Client created successfully')
  @ApiErrorResponse('Bad request')
  async create(
    @Body() createClientDto: CreateClientDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.clientsService.create(createClientDto, file?.path);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiSuccessResponse('Clients retrieved successfully')
  async findAll() {
    const result = await this.clientsService.findAll();
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiSuccessResponse('Client retrieved successfully')
  @ApiErrorResponse('Client not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.clientsService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('contractPdf'))
  @ApiOperation({ summary: 'Update a client' })
  @ApiConsumes('multipart/form-data')
  @ApiSuccessResponse('Client updated successfully')
  @ApiErrorResponse('Client not found')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.clientsService.update(id, updateClientDto, file?.path);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiSuccessResponse('Client deleted successfully')
  @ApiErrorResponse('Client not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.clientsService.remove(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/account/adjust')
  @ApiOperation({ summary: 'Adjust client account amounts' })
  @ApiSuccessResponse('Account adjusted successfully')
  @ApiErrorResponse('Client not found')
  async adjustAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() adjustAccountDto: AdjustAccountDto,
  ) {
    const result = await this.clientsService.adjustAccount(id, adjustAccountDto);
    return {
      success: true,
      data: result,
    };
  }
}