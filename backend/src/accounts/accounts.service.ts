import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    // Get totals
    const totalIncomeResult = await this.prisma.income.aggregate({
      _sum: { amountNrs: true },
    });

    const totalExpenseResult = await this.prisma.expense.aggregate({
      _sum: { amountNrs: true },
    });

    const totalIncomeNrs = totalIncomeResult._sum.amountNrs || 0;
    const totalExpenseNrs = totalExpenseResult._sum.amountNrs || 0;
    const netNrs = totalIncomeNrs - totalExpenseNrs;

    // Get income by client
    const incomeByClient = await this.prisma.income.groupBy({
      by: ['clientId'],
      _sum: { amountNrs: true },
    });

    const incomeByClientWithNames = await Promise.all(
      incomeByClient.map(async (income) => {
        const client = await this.prisma.client.findUnique({
          where: { id: income.clientId },
          select: { name: true },
        });
        return {
          clientId: income.clientId,
          name: client?.name || 'Unknown',
          total: income._sum.amountNrs || 0,
        };
      }),
    );

    // Get expense by source
    const expenseBySource = await this.prisma.expense.groupBy({
      by: ['source'],
      _sum: { amountNrs: true },
    });

    const expenseBySourceFormatted = expenseBySource.map((expense) => ({
      source: expense.source,
      total: expense._sum.amountNrs || 0,
    }));

    // Get counts
    const activeClientsCount = await this.prisma.client.count({
      where: { type: 'ACTIVE' },
    });

    const activeStaffCount = await this.prisma.staff.count({
      where: { isActive: true },
    });

    const now = new Date();
    const openContractsCount = await this.prisma.client.count({
      where: {
        type: 'ACTIVE',
      },
    });

    // Contracts expiring in different windows
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(now.getDate() + 1);

    const contractsExpiringIn30Days = await this.prisma.client.count({
      where: {
        type: 'ACTIVE',
        AND: [
          {
            contractStartDate: {
              lte: now,
            },
          },
          {
            contractStartDate: {
              lte: thirtyDaysFromNow,
            },
          },
          {
            contractStartDate: {
              gt: now,
            },
          }
        ]
      },
    });

    const contractsExpiringIn7Days = await this.prisma.client.count({
      where: {
        type: 'ACTIVE',
        AND: [
          {
            contractStartDate: {
              lte: now,
            },
          },
          {
            contractStartDate: {
              lte: sevenDaysFromNow,
            },
          },
          {
            contractStartDate: {
              gt: now,
            },
          }
        ]
      },
    });

    const contractsExpiringIn1Day = await this.prisma.client.count({
      where: {
        type: 'ACTIVE',
        AND: [
          {
            contractStartDate: {
              lte: now,
            },
          },
          {
            contractStartDate: {
              lte: oneDayFromNow,
            },
          },
          {
            contractStartDate: {
              gt: now,
            },
          }
        ]
      },
    });

    return {
      totals: {
        totalIncomeNrs,
        totalExpenseNrs,
        netNrs,
      },
      incomeByClient: incomeByClientWithNames,
      expenseBySource: expenseBySourceFormatted,
      counts: {
        activeClients: activeClientsCount,
        activeStaff: activeStaffCount,
        openContracts: openContractsCount,
        contractsExpiringIn30Days,
        contractsExpiringIn7Days,
        contractsExpiringIn1Day,
      },
    };
  }

  async getStaffWorkPayoutPreview(month: number, year: number, staffId?: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const whereCondition: any = {
      performedAt: {
        gte: startDate,
        lte: endDate,
      },
      staff: {
        type: 'WORK_BASIS',
      },
    };

    if (staffId) {
      whereCondition.staffId = staffId;
    }

    const staffWorks = await this.prisma.staffWork.findMany({
      where: whereCondition,
      include: {
        staff: true,
        workItem: true,
        client: true,
      },
    });

    // Group by staff
    const payoutPreview = staffWorks.reduce((acc, work) => {
      const staffKey = work.staffId;
      if (!acc[staffKey]) {
        acc[staffKey] = {
          staffId: work.staffId,
          staffName: work.staff.name,
          totalAmount: 0,
          works: [],
        };
      }

      const workTotal = work.quantity * work.unitRateNrs;
      acc[staffKey].totalAmount += workTotal;
      acc[staffKey].works.push({
        id: work.id,
        workItem: work.workItem.title,
        client: work.client?.name || 'No Client',
        quantity: work.quantity,
        unitRate: work.unitRateNrs,
        total: workTotal,
        performedAt: work.performedAt,
      });

      return acc;
    }, {});

    return Object.values(payoutPreview);
  }
}