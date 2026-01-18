import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { OverwriteProtectionInterceptor } from './overwrite-protection.interceptor';

describe('OverwriteProtectionInterceptor', () => {
  let interceptor: OverwriteProtectionInterceptor;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OverwriteProtectionInterceptor],
    }).compile();

    interceptor = module.get<OverwriteProtectionInterceptor>(
      OverwriteProtectionInterceptor,
    );

    // Создаем spy для logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('должен логировать попытку изменения дерева', (done) => {
      const mockContext = createMockContext({
        url: '/tree/change',
        method: 'POST',
        body: { treeId: 'tree_main', actor: 'user' },
        user: { sub: 'user-123' },
      });

      const mockHandler = {
        handle: () => of({ success: true }),
      };

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('Tree modification attempt'),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('Tree modification successful'),
          );
          done();
        },
      });
    });

    it('должен логировать попытку изменения квеста', (done) => {
      const mockContext = createMockContext({
        url: '/quests/quest-123',
        method: 'PATCH',
        params: { id: 'quest-123' },
        body: {},
        user: { sub: 'user-123' },
      });

      const mockHandler = {
        handle: () => of({ success: true }),
      };

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('Quest modification attempt'),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('Quest modification successful'),
          );
          done();
        },
      });
    });

    it('должен логировать заблокированную попытку изменения (403)', (done) => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const mockContext = createMockContext({
        url: '/tree/change',
        method: 'POST',
        body: { treeId: 'tree_main' },
        user: { sub: 'user-123' },
      });

      const forbiddenError = {
        status: 403,
        message: 'Forbidden: Only administrators can modify global tree',
      };

      const mockHandler = {
        handle: () => throwError(() => forbiddenError),
      };

      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: () => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Tree modification blocked'),
          );
          done();
        },
      });
    });

    it('должен логировать другую ошибку как ошибку', (done) => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const mockContext = createMockContext({
        url: '/quests/quest-123',
        method: 'PATCH',
        params: { id: 'quest-123' },
        body: {},
        user: { sub: 'user-123' },
      });

      const serverError = {
        status: 500,
        message: 'Internal server error',
      };

      const mockHandler = {
        handle: () => throwError(() => serverError),
      };

      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Quest modification error'),
          );
          done();
        },
      });
    });

    it('должен правильно определять тип операции для дерева', (done) => {
      const mockContext = createMockContext({
        url: '/tree/change',
        method: 'POST',
        body: { treeId: 'tree_main' },
        user: { sub: 'user-123' },
      });

      const mockHandler = {
        handle: () => of({ success: true }),
      };

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('Tree modification attempt'),
          );
          done();
        },
      });
    });

    it('должен правильно определять тип операции для квеста', (done) => {
      const mockContext = createMockContext({
        url: '/quests/quest-123',
        method: 'DELETE',
        params: { id: 'quest-123' },
        body: {},
        user: { sub: 'user-123' },
      });

      const mockHandler = {
        handle: () => of({ success: true }),
      };

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('Quest modification attempt'),
          );
          done();
        },
      });
    });
  });

  function createMockContext(options: {
    url: string;
    method: string;
    params?: any;
    body?: any;
    user?: any;
  }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          url: options.url,
          method: options.method,
          params: options.params || {},
          body: options.body || {},
          user: options.user || null,
          headers: options.body?.actor
            ? { 'x-actor': options.body.actor }
            : {},
        }),
      }),
    } as ExecutionContext;
  }
});
