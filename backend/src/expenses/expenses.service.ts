import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto) {
    return await this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        paidAt: createExpenseDto.paidAt ? new Date(createExpenseDto.paidAt) : new Date(),
      },
      include: {
        staff: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.expense.findMany({
      include: {
        staff: true,
      },
    });
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        staff: true,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    await this.findOne(id); // Check if exists

    return await this.prisma.expense.update({
      where: { id },
      data: {
        ...updateExpenseDto,
        ...(updateExpenseDto.paidAt && { paidAt: new Date(updateExpenseDto.paidAt) }),
      },
      include: {
        staff: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return await this.prisma.expense.delete({
      where: { id },
    });
  }
}