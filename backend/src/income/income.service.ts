import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class IncomeService {
  constructor(private prisma: PrismaService) {}

  async create(createIncomeDto: CreateIncomeDto) {
    return await this.prisma.income.create({
      data: {
        ...createIncomeDto,
        receivedAt: createIncomeDto.receivedAt ? new Date(createIncomeDto.receivedAt) : new Date(),
      },
      include: {
        client: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.income.findMany({
      include: {
        client: true,
      },
    });
  }

  async findOne(id: number) {
    const income = await this.prisma.income.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!income) {
      throw new NotFoundException(`Income with ID ${id} not found`);
    }

    return income;
  }

  async update(id: number, updateIncomeDto: UpdateIncomeDto) {
    await this.findOne(id); // Check if exists

    return await this.prisma.income.update({
      where: { id },
      data: {
        ...updateIncomeDto,
        ...(updateIncomeDto.receivedAt && { receivedAt: new Date(updateIncomeDto.receivedAt) }),
      },
      include: {
        client: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return await this.prisma.income.delete({
      where: { id },
    });
  }
}