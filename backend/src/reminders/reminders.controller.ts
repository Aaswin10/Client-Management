import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Patch, 
  Body,
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';

@ApiTags('reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new admin reminder' })
  @ApiSuccessResponse('Reminder created successfully')
  async createReminder(@Body() createReminderDto: CreateReminderDto) {
    const result = await this.remindersService.createReminder(createReminderDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('dry-run')
  @ApiOperation({ summary: 'Get list of clients and active reminders (for testing)' })
  @ApiSuccessResponse('Dry run reminders retrieved successfully')
  async getDryRunReminders() {
    const result = await this.remindersService.getDryRunReminders();
    return {
      success: true,
      data: result,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get list of active admin reminders' })
  @ApiSuccessResponse('Active reminders retrieved successfully')
  async getActiveReminders() {
    const result = await this.remindersService.getActiveReminders();
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a reminder as completed' })
  @ApiSuccessResponse('Reminder marked as completed')
  async markReminderAsCompleted(@Param('id') id: string) {
    const result = await this.remindersService.markReminderAsCompleted(Number(id));
    return {
      success: true,
      data: result,
    };
  }
}