import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { MonthlyPayoutDto } from './dto/monthly-payout.dto';
import { ExpenseSource } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(createStaffDto: CreateStaffDto) {
    return await this.prisma.staff.create({
      data: createStaffDto,
    });
  }

  async findAll() {
    return await this.prisma.staff.findMany({
      include: {
        staffWorks: {
          include: {
            workItem: true,
            client: true,
          },
        },
        expenses: true,
      },
    });
  }

  async findOne(id: number, startDate?: Date, endDate?: Date) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    // Build date filter for staff works and expenses
    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    const [staffWorks, expenses] = await Promise.all([
      this.prisma.staffWork.findMany({
        where: {
          staffId: id,
          ...(Object.keys(dateFilter).length > 0 && {
            performedAt: dateFilter,
          }),
        },
        include: {
          workItem: true,
          client: true,
        },
        orderBy: {
          performedAt: 'desc',
        },
      }),
      this.prisma.expense.findMany({
        where: {
          staffId: id,
          ...(Object.keys(dateFilter).length > 0 && {
            paidAt: dateFilter,
          }),
        },
        orderBy: {
          paidAt: 'desc',
        },
      }),
    ]);

    return {
      ...staff,
      staffWorks,
      expenses,
    };
  }

  async update(id: number, updateStaffDto: UpdateStaffDto) {
    await this.findOne(id); // Check if exists

    return await this.prisma.staff.update({
      where: { id },
      data: updateStaffDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return await this.prisma.staff.delete({
      where: { id },
    });
  }

  async monthlyPayout(id: number, monthlyPayoutDto: MonthlyPayoutDto) {
    const staff = await this.findOne(id); // Check if exists

    if (staff.type !== 'MONTHLY') {
      throw new BadRequestException('Monthly payout is only available for MONTHLY staff');
    }

    return await this.prisma.expense.create({
      data: {
        staffId: id,
        amountNrs: monthlyPayoutDto.amountNrs,
        source: ExpenseSource.STAFF_MONTHLY,
        note: monthlyPayoutDto.note,
        paidAt: monthlyPayoutDto.paidAt ? new Date(monthlyPayoutDto.paidAt) : new Date(),
      },
    });
  }
}