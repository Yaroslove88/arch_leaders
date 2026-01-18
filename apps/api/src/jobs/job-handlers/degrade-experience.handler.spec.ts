import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AbilityStateService } from '../../ability/ability-state.service';
import { DegradeExperienceHandler } from './degrade-experience.handler';
import { Prisma } from '@prisma/client';

describe('DegradeExperienceHandler', () => {
  let handler: DegradeExperienceHandler;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      userAbilityState: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockAbilityStateService = {
      // Mock methods if needed
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DegradeExperienceHandler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AbilityStateService,
          useValue: mockAbilityStateService,
        },
      ],
    }).compile();

    handler = module.get<DegradeExperienceHandler>(DegradeExperienceHandler);
    prismaService = module.get(PrismaService);
  });

  describe('handle', () => {
    it('should process nodes with internal progress >= 100%', async () => {
      const mockNodes = [
        {
          user_id: 'user-1',
          node_id: 'node-1',
          internal_progress: new Prisma.Decimal(1.5), // 150%
          last_activity_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
          node: { id: 'node-1', level: 'basic' },
        },
      ];

      prismaService.userAbilityState.findMany.mockResolvedValue(mockNodes as any);
      prismaService.userAbilityState.update.mockResolvedValue({} as any);

      const result = await handler.handle();

      expect(result.processed).toBe(1);
      expect(prismaService.userAbilityState.findMany).toHaveBeenCalledWith({
        where: {
          internal_progress: {
            gte: 1.0,
          },
        },
        include: {
          node: true,
        },
      });
    });

    it('should not degrade if last activity was less than 30 days ago', async () => {
      const mockNodes = [
        {
          user_id: 'user-1',
          node_id: 'node-1',
          internal_progress: new Prisma.Decimal(1.5),
          last_activity_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          node: { id: 'node-1', level: 'basic' },
        },
      ];

      prismaService.userAbilityState.findMany.mockResolvedValue(mockNodes as any);

      const result = await handler.handle();

      expect(result.processed).toBe(1);
      expect(result.degraded).toBe(0); // No degradation
      expect(prismaService.userAbilityState.update).not.toHaveBeenCalled();
    });

    it('should apply degradation based on internal progress level', async () => {
      const mockNodes = [
        {
          user_id: 'user-1',
          node_id: 'node-1',
          internal_progress: new Prisma.Decimal(2.5), // 250% - fast degradation
          last_activity_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          node: { id: 'node-1', level: 'master' },
        },
      ];

      prismaService.userAbilityState.findMany.mockResolvedValue(mockNodes as any);
      prismaService.userAbilityState.update.mockResolvedValue({} as any);

      const result = await handler.handle();

      expect(result.processed).toBe(1);
      expect(result.degraded).toBe(1);
      expect(prismaService.userAbilityState.update).toHaveBeenCalled();
    });

    it('should not degrade below 100%', async () => {
      const mockNodes = [
        {
          user_id: 'user-1',
          node_id: 'node-1',
          internal_progress: new Prisma.Decimal(1.01), // Just above 100%
          last_activity_date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
          node: { id: 'node-1', level: 'basic' },
        },
      ];

      prismaService.userAbilityState.findMany.mockResolvedValue(mockNodes as any);
      prismaService.userAbilityState.update.mockImplementation((args: any) => {
        // Проверяем, что новый прогресс не ниже 100%
        expect(Number(args.data.internal_progress)).toBeGreaterThanOrEqual(1.0);
        return Promise.resolve({} as any);
      });

      const result = await handler.handle();

      expect(result.processed).toBe(1);
      expect(result.degraded).toBe(1);
    });

    it('should handle nodes without last_activity_date (migration case)', async () => {
      const mockNodes = [
        {
          user_id: 'user-1',
          node_id: 'node-1',
          internal_progress: new Prisma.Decimal(1.5),
          last_activity_date: null,
          node: { id: 'node-1', level: 'basic' },
        },
      ];

      prismaService.userAbilityState.findMany.mockResolvedValue(mockNodes as any);
      prismaService.userAbilityState.update.mockResolvedValue({} as any);

      const result = await handler.handle();

      expect(result.processed).toBe(1);
      expect(result.degraded).toBe(0); // No degradation, just sets date
      // Should update last_activity_date to current date
      expect(prismaService.userAbilityState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            last_activity_date: expect.any(Date),
          }),
        }),
      );
    });
  });
});
