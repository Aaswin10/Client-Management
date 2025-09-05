import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffWorkDto } from './dto/create-staff-work.dto';
import { UpdateStaffWorkDto } from './dto/update-staff-work.dto';

@Injectable()
export class StaffWorksService {
  constructor(private prisma: PrismaService) {}

  async create(createStaffWorkDto: CreateStaffWorkDto) {
    // For work-based staff, validate work item and get default rate if needed
    if (createStaffWorkDto.workItemId) {
      const workItem = await this.prisma.workItem.findUnique({
        where: { id: createStaffWorkDto.workItemId },
      });

      if (!workItem) {
        throw new NotFoundException(`Work item with ID ${createStaffWorkDto.workItemId} not found`);
      }

      // Set default rate if not provided
      if (createStaffWorkDto.unitRateNrs === undefined) {
        createStaffWorkDto.unitRateNrs = workItem.rateNrs;
      }
    } else {
      // For monthly staff, ensure title is provided
      if (!createStaffWorkDto.title) {
        throw new Error('Title is required for monthly staff work entries');
      }
    }

    // Prepare staff work data with proper types
    const createData: any = {
      staff: { connect: { id: createStaffWorkDto.staffId } },
      ...(createStaffWorkDto.workItemId && { 
        workItem: { connect: { id: createStaffWorkDto.workItemId } },
        quantity: createStaffWorkDto.quantity,
        unitRateNrs: createStaffWorkDto.unitRateNrs
      }),
      ...(createStaffWorkDto.clientId && { 
        client: { connect: { id: createStaffWorkDto.clientId } } 
      }),
      ...(createStaffWorkDto.title && { title: createStaffWorkDto.title }),
      ...(createStaffWorkDto.description && { description: createStaffWorkDto.description }),
      ...(createStaffWorkDto.performedAt && { 
        performedAt: new Date(createStaffWorkDto.performedAt) 
      }),
    };

    return await this.prisma.staffWork.create({
      data: createData,
      include: {
        staff: true,
        workItem: !!createStaffWorkDto.workItemId,
        client: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.staffWork.findMany({
      include: {
        staff: true,
        workItem: true,
        client: true,
      },
    });
  }

  async findOne(id: number) {
    const staffWork = await this.prisma.staffWork.findUnique({
      where: { id },
      include: {
        staff: true,
        workItem: true,
        client: true,
      },
    });

    if (!staffWork) {
      throw new NotFoundException(`Staff work with ID ${id} not found`);
    }

    return staffWork;
  }

  async update(id: number, updateStaffWorkDto: UpdateStaffWorkDto) {
    // First get the existing work with all fields we need
    const existingWork = await this.prisma.staffWork.findUnique({
      where: { id },
      include: {
        workItem: true,
      },
    });

    if (!existingWork) {
      throw new NotFoundException(`Staff work with ID ${id} not found`);
    }

    const updateData: any = {};

    // Handle work item related fields if workItemId is being updated
    if (updateStaffWorkDto.workItemId !== undefined) {
      if (updateStaffWorkDto.workItemId === null) {
        // If removing work item, also clear related fields
        updateData.workItem = { disconnect: true };
        updateData.quantity = null;
        updateData.unitRateNrs = null;
      } else {
        // If adding/updating work item, validate it
        const workItem = await this.prisma.workItem.findUnique({
          where: { id: updateStaffWorkDto.workItemId },
        });

        if (!workItem) {
          throw new NotFoundException(`Work item with ID ${updateStaffWorkDto.workItemId} not found`);
        }

        updateData.workItem = { connect: { id: updateStaffWorkDto.workItemId } };
        
        // Only update rate if not explicitly set
        if (updateStaffWorkDto.unitRateNrs === undefined) {
          updateData.unitRateNrs = workItem.rateNrs;
        }
      }
    }

    // Handle other fields
    if (updateStaffWorkDto.staffId !== undefined) {
      updateData.staff = { connect: { id: updateStaffWorkDto.staffId } };
    }

    if (updateStaffWorkDto.clientId !== undefined) {
      updateData.client = updateStaffWorkDto.clientId 
        ? { connect: { id: updateStaffWorkDto.clientId } }
        : { disconnect: true };
    }

    // Handle title/description for monthly staff
    if (updateStaffWorkDto.title !== undefined) {
      updateData.title = updateStaffWorkDto.title;
    }
    
    if (updateStaffWorkDto.description !== undefined) {
      updateData.description = updateStaffWorkDto.description;
    }

    // Handle quantity and unit rate for work-based staff
    if (updateStaffWorkDto.quantity !== undefined) {
      updateData.quantity = updateStaffWorkDto.quantity;
    }
    
    if (updateStaffWorkDto.unitRateNrs !== undefined) {
      updateData.unitRateNrs = updateStaffWorkDto.unitRateNrs;
    }

    // Handle performedAt
    if (updateStaffWorkDto.performedAt !== undefined) {
      updateData.performedAt = updateStaffWorkDto.performedAt 
        ? new Date(updateStaffWorkDto.performedAt)
        : null;
    }

    // Validate that we have either workItemId or title for monthly staff
    const workItemId = updateStaffWorkDto.workItemId !== undefined 
      ? updateStaffWorkDto.workItemId 
      : existingWork.workItemId;
      
    const title = updateStaffWorkDto.title !== undefined 
      ? updateStaffWorkDto.title 
      : (existingWork as any).title;
    
    if (!workItemId && !title) {
      throw new Error('Either workItemId or title must be provided');
    }

    return await this.prisma.staffWork.update({
      where: { id },
      data: updateData,
      include: {
        staff: true,
        workItem: !!workItemId,
        client: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return await this.prisma.staffWork.delete({
      where: { id },
    });
  }
}