import { PartialType } from '@nestjs/swagger';
import { CreateStaffWorkDto } from './create-staff-work.dto';

export class UpdateStaffWorkDto extends PartialType(CreateStaffWorkDto) {}