import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';

@Injectable()
export class WorkItemsService {
  constructor(private prisma: PrismaService) {}

  async create(createWorkItemDto: CreateWorkItemDto) {
    return await this.prisma.workItem.create({
      data: createWorkItemDto,
    });
  }

  async findAll() {
    return await this.prisma.workItem.findMany({
      include: {
        staffWorks: {
          include: {
            staff: true,
            client: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const workItem = await this.prisma.workItem.findUnique({
      where: { id },
      include: {
        staffWorks: {
          include: {
            staff: true,
            client: true,
          },
        },
      },
    });

    if (!workItem) {
      throw new NotFoundException(`Work item with ID ${id} not found`);
    }

    return workItem;
  }

  async update(id: number, updateWorkItemDto: UpdateWorkItemDto) {
    await this.findOne(id); // Check if exists

    return await this.prisma.workItem.update({
      where: { id },
      data: updateWorkItemDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return await this.prisma.workItem.delete({
      where: { id },
    });
  }
}