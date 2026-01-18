import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ProtectGlobalTreeGuard } from './protect-global-tree.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProtectGlobalTreeGuard', () => {
  let guard: ProtectGlobalTreeGuard;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProtectGlobalTreeGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<ProtectGlobalTreeGuard>(ProtectGlobalTreeGuard);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('должен разрешить системную операцию для tree_main', async () => {
      const mockContext = createMockContext({
        body: { treeId: 'tree_main', actor: 'system' },
        user: null,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('должен разрешить администратору изменять tree_main', async () => {
      const mockUser = { sub: 'admin-user-id' };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: 'admin',
      });

      const mockContext = createMockContext({
        body: { treeId: 'tree_main' },
        user: mockUser,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('должен заблокировать обычного пользователя от изменения tree_main', async () => {
      const mockUser = { sub: 'regular-user-id' };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'regular-user-id',
        role: 'user',
      });

      const mockContext = createMockContext({
        body: { treeId: 'tree_main' },
        user: mockUser,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Only administrators and system operations can modify the global tree',
      );
    });

    it('должен разрешить владельцу изменять свое дерево (tree_user_*)', async () => {
      const mockUser = { sub: 'user-123' };
      const mockContext = createMockContext({
        body: { treeId: 'tree_user_user-123' },
        user: mockUser,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('должен заблокировать пользователя от изменения чужого дерева', async () => {
      const mockUser = { sub: 'user-123' };
      const mockContext = createMockContext({
        body: { treeId: 'tree_user_user-456' },
        user: mockUser,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('должен разрешить операцию с actor=analyzer для tree_main', async () => {
      const mockContext = createMockContext({
        body: { treeId: 'tree_main', actor: 'analyzer' },
        user: null,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('должен разрешить операцию с actor=script для tree_main', async () => {
      const mockContext = createMockContext({
        body: { treeId: 'tree_main', actor: 'script' },
        user: null,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  function createMockContext(options: {
    body?: any;
    user?: any;
    params?: any;
    headers?: any;
  }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body: options.body || {},
          user: options.user || null,
          params: options.params || {},
          headers: options.headers || {},
          method: 'POST',
        }),
      }),
    } as ExecutionContext;
  }
});
