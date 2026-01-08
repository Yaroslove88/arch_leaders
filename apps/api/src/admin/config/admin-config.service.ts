import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfigSets() {
    return this.prisma.configSet.findMany({
      include: {
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 1, // Последняя версия
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async getConfigSetById(configSetId: string) {
    const configSet = await this.prisma.configSet.findUnique({
      where: { id: configSetId },
      include: {
        versions: {
          orderBy: {
            version: 'desc',
          },
        },
      },
    });

    if (!configSet) {
      throw new NotFoundException('Config set not found');
    }

    return configSet;
  }

  async getConfigVersions(configSetId: string) {
    return this.prisma.configVersion.findMany({
      where: { config_set_id: configSetId },
      orderBy: {
        version: 'desc',
      },
    });
  }

  async createConfigVersion(
    configSetId: string,
    data: { payload: any; comment?: string; createdByAdmin: string },
  ) {
    // Получаем последнюю версию
    const lastVersion = await this.prisma.configVersion.findFirst({
      where: { config_set_id: configSetId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (lastVersion?.version || 0) + 1;

    return this.prisma.configVersion.create({
      data: {
        config_set_id: configSetId,
        version: newVersion,
        payload: data.payload,
        comment: data.comment,
        created_by_admin: data.createdByAdmin,
      },
    });
  }

  async activateConfigVersion(configSetId: string, version: number) {
    // Деактивируем все версии этого config set
    await this.prisma.configVersion.updateMany({
      where: {
        config_set_id: configSetId,
        activated_at: { not: null },
      },
      data: {
        activated_at: null,
      },
    });

    // Активируем нужную версию
    return this.prisma.configVersion.updateMany({
      where: {
        config_set_id: configSetId,
        version,
      },
      data: {
        activated_at: new Date(),
      },
    });
  }

  async getUserConfig(userId: string) {
    const binding = await this.prisma.userConfigBinding.findFirst({
      where: { user_id: userId },
    });

    if (!binding) {
      return null;
    }

    const configSet = await this.prisma.configSet.findUnique({
      where: { id: binding.config_set_id },
      include: {
        versions: {
          where: binding.pinned_version
            ? { version: binding.pinned_version }
            : { activated_at: { not: null } },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!configSet) {
      throw new NotFoundException(`Config set ${binding.config_set_id} not found`);
    }

    return {
      ...binding,
      configSet,
    };
  }

  async pinUserConfigVersion(
    userId: string,
    configSetId: string,
    version: number,
  ) {
    const existing = await this.prisma.userConfigBinding.findFirst({
      where: {
        user_id: userId,
        config_set_id: configSetId,
      },
    });

    if (existing) {
      return this.prisma.userConfigBinding.updateMany({
        where: {
          user_id: userId,
          config_set_id: configSetId,
        },
        data: {
          pinned_version: version,
        },
      });
    }

    return this.prisma.userConfigBinding.create({
      data: {
        user_id: userId,
        config_set_id: configSetId,
        pinned_version: version,
      },
    });
  }
}

