import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAction, TargetType } from '../common/enums/admin-role.enum';

export interface AuditLogData {
  adminUserId: string;
  action: AdminAction | string;
  targetType: TargetType | string;
  targetId?: string;
  reason?: string;
  metadata?: any;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        admin_user_id: data.adminUserId,
        action: data.action,
        target_type: data.targetType,
        target_id: data.targetId,
        reason: data.reason,
        metadata: data.metadata || {},
        ip: data.ip,
      },
    });
  }

  async getLogs(filters: {
    adminUserId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    cursor?: string;
  }) {
    const where: any = {};

    if (filters.adminUserId) {
      where.admin_user_id = filters.adminUserId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.targetType) {
      where.target_type = filters.targetType;
    }
    if (filters.targetId) {
      where.target_id = filters.targetId;
    }
    if (filters.from || filters.to) {
      where.created_at = {};
      if (filters.from) {
        where.created_at.gte = filters.from;
      }
      if (filters.to) {
        where.created_at.lte = filters.to;
      }
    }

    const logs = await this.prisma.adminAuditLog.findMany({
      where,
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: filters.limit || 50,
      ...(filters.cursor && {
        skip: 1,
        cursor: {
          id: filters.cursor,
        },
      }),
    });

    return logs;
  }
}

