import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AdjustAccountDto } from './dto/adjust-account.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto, contractPdfPath?: string) {
    const clientData = {
      ...createClientDto,
      contractStartDate: new Date(createClientDto.contractStartDate),
      contractPdfPath,
      dueAmountNrs: createClientDto.lockedAmountNrs - createClientDto.advanceAmountNrs,
    };

    return await this.prisma.client.create({
      data: clientData,
    });
  }

  async findAll() {
    return await this.prisma.client.findMany({
      include: {
        incomes: true,
        staffWorks: {
          include: {
            staff: true,
            workItem: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        incomes: true,
        staffWorks: {
          include: {
            staff: true,
            workItem: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto, contractPdfPath?: string) {
    await this.findOne(id);

    const updateData = {
      ...updateClientDto,
      ...(contractPdfPath && { contractPdfPath }),
    };

    // Ensure contractStartDate is properly formatted if it exists
    if (updateData.contractStartDate) {
      updateData.contractStartDate = new Date(updateData.contractStartDate).toISOString();
    }

    return await this.prisma.client.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.client.delete({
      where: { id },
    });
  }

  async adjustAccount(id: number, adjustAccountDto: AdjustAccountDto) {
    await this.findOne(id);

    return await this.prisma.$transaction(async (prisma) => {
      const updates: any = {};

      if (adjustAccountDto.lockedDelta !== undefined) {
        updates.lockedAmountNrs = {
          increment: adjustAccountDto.lockedDelta,
        };
      }

      if (adjustAccountDto.advanceDelta !== undefined) {
        updates.advanceAmountNrs = {
          increment: adjustAccountDto.advanceDelta,
        };
      }

      updates.dueAmountNrs = {
        increment: adjustAccountDto.lockedDelta - adjustAccountDto.advanceDelta,
      };

      return await prisma.client.update({
        where: { id },
        data: updates,
      });
    });
  }
}