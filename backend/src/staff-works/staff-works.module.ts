import { Module } from '@nestjs/common';
import { StaffWorksService } from './staff-works.service';
import { StaffWorksController } from './staff-works.controller';

@Module({
  controllers: [StaffWorksController],
  providers: [StaffWorksService],
})
export class StaffWorksModule {}