import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

// Enums matching Prisma schema
enum ReminderType {
  CONTRACT_EXPIRY = 'CONTRACT_EXPIRY',
  STAFF_CONTRACT = 'STAFF_CONTRACT',
  PAYMENT_DUE = 'PAYMENT_DUE',
  GENERAL = 'GENERAL'
}

enum ReminderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('GMAIL_USER'),
        pass: this.configService.get('GMAIL_APP_PASSWORD'),
      },
    });
  }

  // Helper method to determine reminder priority and stages
  private getPriorityAndStages(totalDays: number, daysRemaining: number): { 
    priority: ReminderPriority, 
    stage: 'INITIAL' | 'MIDPOINT' | 'FINAL' 
  } {
    const halfwayPoint = Math.floor(totalDays * 0.5);
    const quarterPoint = Math.floor(totalDays * 0.25);

    if (daysRemaining <= quarterPoint) {
      return { 
        priority: ReminderPriority.URGENT, 
        stage: 'FINAL' 
      };
    }
    
    if (daysRemaining <= halfwayPoint) {
      return { 
        priority: ReminderPriority.HIGH, 
        stage: 'MIDPOINT' 
      };
    }

    return { 
      priority: ReminderPriority.MEDIUM, 
      stage: 'INITIAL' 
    };
  }

  // Get clients approaching contract expiry with multiple reminder stages
  async getClientsForReminder() {
    const now = new Date();
    const clients = [];

    // 30 days reminder
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const clients30Days = await this.prisma.client.findMany({
      where: {
        contractStartDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(thirtyDaysFromNow.getTime() - 24 * 60 * 60 * 1000), // Within 24 hours of 30 days
        },
      },
    });

    // Add clients with reminder stages
    clients.push(...clients30Days.map(client => {
      const totalContractDays = client.contractDurationDays;
      const daysRemaining = Math.ceil(
        (new Date(client.contractStartDate).getTime() + totalContractDays * 24 * 60 * 60 * 1000 - now.getTime()) 
        / (24 * 60 * 60 * 1000)
      );
      
      const { priority, stage } = this.getPriorityAndStages(totalContractDays, daysRemaining);

      return { 
        ...client, 
        daysUntilExpiry: daysRemaining,
        priority,
        stage
      };
    }));

    return clients;
  }

  // Create admin reminder with stage-specific details
  async createAdminReminder(reminderData: {
    title: string;
    description?: string;
    type: ReminderType;
    priority?: ReminderPriority;
    dueDate: Date;
    clientId?: number;
    staffId?: number;
    stage?: 'INITIAL' | 'MIDPOINT' | 'FINAL';
  }) {
    return this.prisma.adminReminder.create({
      data: {
        ...reminderData,
        priority: reminderData.priority || ReminderPriority.MEDIUM,
      },
    });
  }

  // Send email only to admin with stage-specific content
  async sendAdminReminderEmail(client: any) {
    const expiryDate = new Date(client.contractStartDate);
    expiryDate.setDate(expiryDate.getDate() + client.contractDurationDays);

    const stageMessages = {
      INITIAL: 'This is an early reminder about your upcoming contract.',
      MIDPOINT: 'You are approaching the midpoint of your contract duration.',
      FINAL: 'URGENT: Your contract is about to expire. Immediate action required!'
    };

    const mailOptions = {
      from: this.configService.get('GMAIL_USER'),
      to: this.configService.get('GMAIL_ADMIN'),
      subject: `Contract Expiry ${client.stage} Alert - ${client.daysUntilExpiry} days remaining`,
      html: `
        <h2>Contract Expiry ${client.stage} Alert</h2>
        <p><strong>Client:</strong> ${client.name}</p>
        <p>Contract will expire in <strong>${client.daysUntilExpiry} days</strong>.</p>
        <p>${stageMessages[client.stage]}</p>
        <p><strong>Contract Details:</strong></p>
        <ul>
          <li>Start Date: ${client.contractStartDate.toDateString()}</li>
          <li>Duration: ${client.contractDurationDays} days</li>
          <li>Expiry Date: ${expiryDate.toDateString()}</li>
        </ul>
        <p>Please review and take necessary actions.</p>
        <p>Best regards,<br>Chronosynclabs</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Admin reminder email sent for ${client.name} (${client.daysUntilExpiry} days, ${client.stage} stage)`);
    } catch (error) {
      this.logger.error(`Failed to send admin reminder email for ${client.name}:`, error);
    }
  }

  // Cron job to send contract expiry reminders
  @Cron('0 9 * * *', {
    name: 'contractExpiryReminders',
    timeZone: 'Asia/Kathmandu',
  })
  async sendContractExpiryReminders() {
    const reminders = await this.getClientsForReminder();
    
    for (const reminder of reminders) {
      // Create admin reminder
      await this.createAdminReminder({
        title: `Contract Expiry ${reminder.stage} Alert - ${reminder.name}`,
        description: `Client contract for ${reminder.name} will expire in ${reminder.daysUntilExpiry} days (${reminder.stage} stage)`,
        type: ReminderType.CONTRACT_EXPIRY,
        priority: reminder.priority,
        dueDate: new Date(reminder.contractStartDate),
        clientId: reminder.id,
        stage: reminder.stage
      });

      // Send email only to admin
      await this.sendAdminReminderEmail(reminder);
    }

    this.logger.log(`Created ${reminders.length} contract expiry admin reminders`);
  }

  // Get active reminders
  async getActiveReminders() {
    const now = new Date();
    return this.prisma.adminReminder.findMany({
      where: {
        isCompleted: false,
        dueDate: {
          gte: now,
        },
      },
      include: {
        client: true,
        staff: true,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  // Mark reminder as completed
  async markReminderAsCompleted(reminderId: number) {
    return this.prisma.adminReminder.update({
      where: { id: reminderId },
      data: { isCompleted: true },
    });
  }

  // Create a new admin reminder
  async createReminder(createReminderDto: CreateReminderDto) {
    try {
      // Validate client and staff IDs if provided
      if (createReminderDto.clientId) {
        await this.prisma.client.findUniqueOrThrow({
          where: { id: createReminderDto.clientId }
        });
      }

      if (createReminderDto.staffId) {
        await this.prisma.staff.findUniqueOrThrow({
          where: { id: createReminderDto.staffId }
        });
      }

      // Create reminder
      return this.prisma.adminReminder.create({
        data: {
          title: createReminderDto.title,
          description: createReminderDto.description,
          type: createReminderDto.type,
          priority: createReminderDto.priority || ReminderPriority.MEDIUM,
          dueDate: createReminderDto.dueDate,
          clientId: createReminderDto.clientId,
          staffId: createReminderDto.staffId,
          isCompleted: createReminderDto.isCompleted || false,
          stage: createReminderDto.stage
        },
        include: {
          client: true,
          staff: true
        }
      });
    } catch (error) {
      this.logger.error('Error creating reminder', error);
      throw error;
    }
  }

  // Dry run method for testing
  async getDryRunReminders() {
    const clientReminders = await this.getClientsForReminder();
    const activeReminders = await this.getActiveReminders();

    return {
      clientReminders,
      activeReminders,
    };
  }
}