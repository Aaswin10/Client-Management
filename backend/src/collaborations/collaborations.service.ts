import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { FilterCollaborationsDto } from './dto/filter-collaborations.dto';

@Injectable()
export class CollaborationsService {
  constructor(private prisma: PrismaService) {}

  async create(createCollaborationDto: CreateCollaborationDto) {
    // Verify influencer exists
    await this.prisma.influencer.findUniqueOrThrow({
      where: { id: createCollaborationDto.influencerId },
    });

    return await this.prisma.collaboration.create({
      data: {
        ...createCollaborationDto,
        startDate: new Date(createCollaborationDto.startDate),
        endDate: new Date(createCollaborationDto.endDate),
      },
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        payments: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.collaboration.findMany({
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        payments: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id },
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID ${id} not found`);
    }

    return collaboration;
  }

  async update(id: number, updateCollaborationDto: UpdateCollaborationDto) {
    await this.findOne(id); // Check if exists

    const updateData: any = { ...updateCollaborationDto };

    if (updateCollaborationDto.startDate) {
      updateData.startDate = new Date(updateCollaborationDto.startDate);
    }

    if (updateCollaborationDto.endDate) {
      updateData.endDate = new Date(updateCollaborationDto.endDate);
    }

    return await this.prisma.collaboration.update({
      where: { id },
      data: updateData,
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        payments: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return await this.prisma.collaboration.delete({
      where: { id },
    });
  }

  async filter(filterDto: FilterCollaborationsDto) {
    const { campaignName, status, influencerId, startDate, endDate, minAmount, maxAmount } = filterDto;

    const whereCondition: any = {};

    if (campaignName) {
      whereCondition.campaignName = {
        contains: campaignName,
        mode: 'insensitive',
      };
    }

    if (status) {
      whereCondition.status = status;
    }

    if (influencerId) {
      whereCondition.influencerId = influencerId;
    }

    if (startDate || endDate) {
      whereCondition.startDate = {};
      if (startDate) {
        whereCondition.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereCondition.startDate.lte = new Date(endDate);
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      whereCondition.agreedAmountNrs = {};
      if (minAmount !== undefined) {
        whereCondition.agreedAmountNrs.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        whereCondition.agreedAmountNrs.lte = maxAmount;
      }
    }

    return await this.prisma.collaboration.findMany({
      where: whereCondition,
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        payments: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async getCollaborationsByInfluencer(influencerId: number) {
    return await this.prisma.collaboration.findMany({
      where: { influencerId },
      include: {
        payments: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }
}