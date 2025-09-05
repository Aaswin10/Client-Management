import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentsDto } from './dto/filter-payments.dto';
import { PaymentReportDto } from './dto/payment-report.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    // Verify influencer exists
    await this.prisma.influencer.findUniqueOrThrow({
      where: { id: createPaymentDto.influencerId },
    });

    // Verify collaboration exists if provided
    if (createPaymentDto.collaborationId) {
      await this.prisma.collaboration.findUniqueOrThrow({
        where: { id: createPaymentDto.collaborationId },
      });
    }

    const paymentData: any = {
      ...createPaymentDto,
      paymentDate: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : null,
      dueDate: createPaymentDto.dueDate ? new Date(createPaymentDto.dueDate) : null,
    };

    return await this.prisma.payment.create({
      data: paymentData,
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        collaboration: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.payment.findMany({
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        collaboration: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        collaboration: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    await this.findOne(id); // Check if exists

    const updateData: any = { ...updatePaymentDto };

    if (updatePaymentDto.paymentDate) {
      updateData.paymentDate = new Date(updatePaymentDto.paymentDate);
    }

    if (updatePaymentDto.dueDate) {
      updateData.dueDate = new Date(updatePaymentDto.dueDate);
    }

    return await this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        collaboration: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return await this.prisma.payment.delete({
      where: { id },
    });
  }

  async filter(filterDto: FilterPaymentsDto) {
    const { status, paymentMethod, influencerId, collaborationId, minAmount, maxAmount, startDate, endDate } = filterDto;

    const whereCondition: any = {};

    if (status) {
      whereCondition.status = status;
    }

    if (paymentMethod) {
      whereCondition.paymentMethod = paymentMethod;
    }

    if (influencerId) {
      whereCondition.influencerId = influencerId;
    }

    if (collaborationId) {
      whereCondition.collaborationId = collaborationId;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      whereCondition.amountNrs = {};
      if (minAmount !== undefined) {
        whereCondition.amountNrs.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        whereCondition.amountNrs.lte = maxAmount;
      }
    }

    if (startDate || endDate) {
      whereCondition.paymentDate = {};
      if (startDate) {
        whereCondition.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereCondition.paymentDate.lte = new Date(endDate);
      }
    }

    return await this.prisma.payment.findMany({
      where: whereCondition,
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        collaboration: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async generateReport(reportDto: PaymentReportDto) {
    const { reportType, influencerId, startDate, endDate } = reportDto;

    const whereCondition: any = {
      status: 'PAID', // Only include paid payments in reports
    };

    if (influencerId) {
      whereCondition.influencerId = influencerId;
    }

    if (startDate || endDate) {
      whereCondition.paymentDate = {};
      if (startDate) {
        whereCondition.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereCondition.paymentDate.lte = new Date(endDate);
      }
    }

    const payments = await this.prisma.payment.findMany({
      where: whereCondition,
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        collaboration: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Calculate totals
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amountNrs, 0);
    const totalPayments = payments.length;

    // Group by influencer
    const byInfluencer = payments.reduce((acc, payment) => {
      const influencerId = payment.influencerId;
      if (!acc[influencerId]) {
        acc[influencerId] = {
          influencer: payment.influencer,
          totalAmount: 0,
          paymentCount: 0,
          payments: [],
        };
      }
      acc[influencerId].totalAmount += payment.amountNrs;
      acc[influencerId].paymentCount += 1;
      acc[influencerId].payments.push(payment);
      return acc;
    }, {});

    // Group by campaign
    const byCampaign = payments.reduce((acc, payment) => {
      if (payment.collaboration) {
        const campaignName = payment.collaboration.campaignName;
        if (!acc[campaignName]) {
          acc[campaignName] = {
            campaignName,
            totalAmount: 0,
            paymentCount: 0,
            payments: [],
          };
        }
        acc[campaignName].totalAmount += payment.amountNrs;
        acc[campaignName].paymentCount += 1;
        acc[campaignName].payments.push(payment);
      }
      return acc;
    }, {});

    return {
      reportType,
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalAmount,
        totalPayments,
        averagePayment: totalPayments > 0 ? Math.round(totalAmount / totalPayments) : 0,
      },
      byInfluencer: Object.values(byInfluencer),
      byCampaign: Object.values(byCampaign),
      payments,
    };
  }

  async getOverduePayments() {
    const today = new Date();
    
    return await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: today,
        },
      },
      include: {
        influencer: {
          include: {
            socialHandles: true,
          },
        },
        collaboration: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async markAsOverdue() {
    const today = new Date();
    
    const result = await this.prisma.payment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return result;
  }
}