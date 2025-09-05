import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { UpdateInfluencerDto } from './dto/update-influencer.dto';
import { SearchInfluencersDto } from './dto/search-influencers.dto';

@Injectable()
export class InfluencersService {
  constructor(private prisma: PrismaService) {}

  async create(createInfluencerDto: CreateInfluencerDto) {
    const { socialHandles, ...influencerData } = createInfluencerDto;

    return await this.prisma.influencer.create({
      data: {
        ...influencerData,
        socialHandles: {
          create: socialHandles || [],
        },
      },
      include: {
        socialHandles: true,
        collaborations: true,
        payments: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.influencer.findMany({
      include: {
        socialHandles: true,
        collaborations: {
          include: {
            payments: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const influencer = await this.prisma.influencer.findUnique({
      where: { id },
      include: {
        socialHandles: true,
        collaborations: {
          include: {
            payments: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!influencer) {
      throw new NotFoundException(`Influencer with ID ${id} not found`);
    }

    return influencer;
  }

  async update(id: number, updateInfluencerDto: UpdateInfluencerDto) {
    await this.findOne(id); // Check if exists

    const { socialHandles, ...influencerData } = updateInfluencerDto;

    // If social handles are provided, replace all existing ones
    if (socialHandles) {
      await this.prisma.socialHandle.deleteMany({
        where: { influencerId: id },
      });
    }

    return await this.prisma.influencer.update({
      where: { id },
      data: {
        ...influencerData,
        ...(socialHandles && {
          socialHandles: {
            create: socialHandles,
          },
        }),
      },
      include: {
        socialHandles: true,
        collaborations: true,
        payments: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return await this.prisma.influencer.delete({
      where: { id },
    });
  }

  async search(searchDto: SearchInfluencersDto) {
    const { query, platform, isActive } = searchDto;

    const whereCondition: any = {};

    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }

    if (query) {
      whereCondition.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        {
          socialHandles: {
            some: {
              handle: { contains: query, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (platform) {
      whereCondition.socialHandles = {
        some: {
          platform: platform,
        },
      };
    }

    return await this.prisma.influencer.findMany({
      where: whereCondition,
      include: {
        socialHandles: true,
        collaborations: {
          include: {
            payments: true,
          },
        },
        payments: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getInfluencerStats(id: number) {
    const influencer = await this.findOne(id);

    const totalCollaborations = await this.prisma.collaboration.count({
      where: { influencerId: id },
    });

    const totalEarnings = await this.prisma.payment.aggregate({
      where: {
        influencerId: id,
        status: 'PAID',
      },
      _sum: {
        amountNrs: true,
      },
    });

    const pendingPayments = await this.prisma.payment.aggregate({
      where: {
        influencerId: id,
        status: 'PENDING',
      },
      _sum: {
        amountNrs: true,
      },
    });

    const overduePayments = await this.prisma.payment.aggregate({
      where: {
        influencerId: id,
        status: 'OVERDUE',
      },
      _sum: {
        amountNrs: true,
      },
    });

    return {
      influencer,
      stats: {
        totalCollaborations,
        totalEarnings: totalEarnings._sum.amountNrs || 0,
        pendingPayments: pendingPayments._sum.amountNrs || 0,
        overduePayments: overduePayments._sum.amountNrs || 0,
      },
    };
  }
}