import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { WorkItemsModule } from './work-items/work-items.module';
import { StaffModule } from './staff/staff.module';
import { StaffWorksModule } from './staff-works/staff-works.module';
import { IncomeModule } from './income/income.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AccountsModule } from './accounts/accounts.module';
import { RemindersModule } from './reminders/reminders.module';
import { InfluencersModule } from './influencers/influencers.module';
import { CollaborationsModule } from './collaborations/collaborations.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ClientsModule,
    WorkItemsModule,
    StaffModule,
    StaffWorksModule,
    IncomeModule,
    ExpensesModule,
    AccountsModule,
    RemindersModule,
    InfluencersModule,
    CollaborationsModule,
    PaymentsModule,
  ],
})
export class AppModule {}