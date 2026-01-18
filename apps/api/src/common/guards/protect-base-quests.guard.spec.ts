import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProtectBaseQuestsGuard } from './protect-base-quests.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProtectBaseQuestsGuard', () => {
  let guard: ProtectBaseQuestsGuard;
  let prismaService: PrismaService;

  const mockPrismaService = {
    quest: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProtectBaseQuestsGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<ProtectBaseQuestsGuard>(ProtectBaseQuestsGuard);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('должен разрешить создание нового квеста (без questId)', async () => {
      const mockContext = createMockContext({
        params: {},
        body: {},
        user: { sub: 'user-123' },
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockPrismaService.quest.findUnique).not.toHaveBeenCalled();
    });

    it('должен заблокировать изменение базового квеста обычным пользователем', async () => {
      const mockUser = { sub: 'regular-user-id' };
      mockPrismaService.quest.findUnique.mockResolvedValue({
        id: 'quest-123',
        source: 'base_template',
        userId: null,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'regular-user-id',
        role: 'user',
      });

      const mockContext = createMockContext({
        params: { id: 'quest-123' },
        body: {},
        user: mockUser,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Only administrators and system operations can modify base quests',
      );
    });

    it('должен разрешить администратору изменять базовый квест', async () => {
      const mockUser = { sub: 'admin-user-id' };
      mockPrismaService.quest.findUnique.mockResolvedValue({
        id: 'quest-123',
        source: 'base_template',
        userId: null,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: 'admin',
      });

      const mockContext = createMockContext({
        params: { id: 'quest-123' },
        body: {},
        user: mockUser,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('должен разрешить системной операции изменять базовый квест', async () => {
      mockPrismaService.quest.findUnique.mockResolvedValue({
        id: 'quest-123',
        source: 'base_template',
        userId: null,
      });

      const mockContext = createMockContext({
        params: { id: 'quest-123' },
        body: { actor: 'system' },
        headers: {},
        user: null,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('должен разрешить владельцу изменять свой пользовательский квест', async () => {
      const mockUser = { sub: 'user-123' };
      mockPrismaService.quest.findUnique.mockResolvedValue({
        id: 'quest-456',
        source: 'user_generated',
        userId: 'user-123',
      });

      const mockContext = createMockContext({
        params: { id: 'quest-456' },
        body: {},
        user: mockUser,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('должен заблокировать пользователя от изменения чужого пользовательского квеста', async () => {
      const mockUser = { sub: 'user-123' };
      mockPrismaService.quest.findUnique.mockResolvedValue({
        id: 'quest-456',
        source: 'user_generated',
        userId: 'user-456',
      });

      const mockContext = createMockContext({
        params: { id: 'quest-456' },
        body: {},
        user: mockUser,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('должен выбросить NotFoundException если квест не найден', async () => {
      mockPrismaService.quest.findUnique.mockResolvedValue(null);

      const mockContext = createMockContext({
        params: { id: 'quest-999' },
        body: {},
        user: { sub: 'user-123' },
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('должен разрешить операцию с actor=sync-base-quests для базового квеста', async () => {
      mockPrismaService.quest.findUnique.mockResolvedValue({
        id: 'quest-123',
        source: 'base_template',
        userId: null,
      });

      const mockContext = createMockContext({
        params: { id: 'quest-123' },
        body: { actor: 'sync-base-quests' },
        headers: {},
        user: null,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  function createMockContext(options: {
    params?: any;
    body?: any;
    headers?: any;
    user?: any;
  }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          params: options.params || {},
          body: options.body || {},
          headers: options.headers || {},
          user: options.user || null,
          query: {},
        }),
      }),
    } as ExecutionContext;
  }
});
