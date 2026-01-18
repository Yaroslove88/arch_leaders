import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { existsSync } from 'fs';

/**
 * Сервис для управления путями к файлам и директориям
 * Адаптирован для проекта "Архитектор лидерства"
 */
@Injectable()
export class PathConfigService {
  private readonly logger = new Logger(PathConfigService.name);
  private projectRoot: string | null = null;
  private workspaceRoot: string | null = null;

  /**
   * Получить корень проекта (где находится leadership-architect)
   * В Docker контейнере это /app, в локальной разработке определяется от process.cwd()
   */
  getProjectRoot(): string {
    if (this.projectRoot) {
      return this.projectRoot;
    }

    // 1. Для Docker: проверяем абсолютный путь /app
    // В Docker data файлы находятся в /app/data/
    const dockerRoot = '/app';
    const dockerDataPath = path.join(dockerRoot, 'data');
    if (existsSync(dockerDataPath)) {
      this.logger.log(`Using Docker project root: ${dockerRoot}`);
      this.projectRoot = dockerRoot;
      return dockerRoot;
    }

    // 2. Для локальной разработки: определяем от process.cwd()
    let projectRoot = process.cwd();
    
    // Если мы в apps/api, поднимаемся на 2 уровня вверх к корню проекта
    if (projectRoot.endsWith('apps\\api') || projectRoot.endsWith('apps/api')) {
      projectRoot = path.resolve(projectRoot, '../..');
    }
    // Если в apps/api/dist
    else if (projectRoot.includes('apps\\api\\dist') || projectRoot.includes('apps/api/dist')) {
      projectRoot = path.resolve(projectRoot, '../../..');
    }
    // Если уже в корне проекта, проверяем наличие packages/shared
    else if (!existsSync(path.join(projectRoot, 'packages', 'shared'))) {
      // Пробуем найти корень проекта, поднимаясь вверх
      let currentDir = projectRoot;
      for (let i = 0; i < 5; i++) {
        if (existsSync(path.join(currentDir, 'packages', 'shared'))) {
          projectRoot = currentDir;
          break;
        }
        currentDir = path.resolve(currentDir, '..');
      }
    }
    
    const normalizedProjectRoot = path.normalize(projectRoot);
    this.logger.log(`Using local project root: ${normalizedProjectRoot}`);
    this.projectRoot = normalizedProjectRoot;
    return normalizedProjectRoot;
  }

  /**
   * Получить корень workspace (где находится Professional)
   */
  getWorkspaceRoot(): string {
    if (this.workspaceRoot) {
      return this.workspaceRoot;
    }

    const projectRoot = this.getProjectRoot();
    let workspaceRoot = path.resolve(projectRoot, '..');
    
    const normalizedWorkspaceRoot = path.normalize(workspaceRoot);
    this.workspaceRoot = normalizedWorkspaceRoot;
    return normalizedWorkspaceRoot;
  }

  /**
   * Получить путь к seed файлу (дерево способностей)
   */
  getSeedPath(): string {
    // Проверяем переменную окружения
    if (process.env.SEED_FILE_PATH) {
      const envPath = path.normalize(process.env.SEED_FILE_PATH);
      if (existsSync(envPath)) {
        return envPath;
      }
    }

    // 1. Для Docker: проверяем абсолютный путь
    const dockerSeedPath = '/app/packages/shared/src/seed/initial-ability-tree.json';
    if (existsSync(dockerSeedPath)) {
      return dockerSeedPath;
    }

    // 2. Для локальной разработки
    const projectRoot = this.getProjectRoot();
    const seedPath = path.resolve(
      projectRoot,
      'packages/shared/src/seed/initial-ability-tree.json'
    );
    
    // Проверка на path traversal
    const normalizedSeedPath = path.normalize(seedPath);
    const normalizedProjectRoot = path.normalize(projectRoot);
    
    if (!normalizedSeedPath.startsWith(normalizedProjectRoot)) {
      throw new Error(`Invalid path: seed path is outside project root`);
    }
    
    return normalizedSeedPath;
  }

  /**
   * Найти папку с ситуациями лидерства
   * Адаптировано под "Лидерство/Ситуации" вместо "Психотерапия - Сессии"
   */
  getSituationsRootPath(): string | null {
    // Проверяем переменную окружения
    if (process.env.SITUATIONS_ROOT_PATH) {
      const envPath = path.normalize(process.env.SITUATIONS_ROOT_PATH);
      if (existsSync(envPath)) {
        return envPath;
      }
    }

    return this.findSituationsRoot();
  }

  /**
   * Поиск папки ситуаций по возможным путям
   */
  private findSituationsRoot(): string | null {
    const projectRoot = this.getProjectRoot();
    const workspaceRoot = this.getWorkspaceRoot();
    const normalizedWorkspaceRoot = path.normalize(workspaceRoot);
    
    const possiblePaths = [
      // От корня workspace
      path.resolve(normalizedWorkspaceRoot, 'Лидерство/Ситуации'),
      path.resolve(normalizedWorkspaceRoot, 'Лидерство\\Ситуации'),
      // Относительно apps/api
      path.resolve(projectRoot, '../../Лидерство/Ситуации'),
      path.resolve(projectRoot, '../../../Лидерство/Ситуации'),
      // Альтернативные варианты
      path.resolve(process.cwd(), '../../Лидерство/Ситуации'),
      path.resolve(process.cwd(), '../../../Лидерство/Ситуации'),
      // Абсолютный путь (для Windows)
      'D:\\gpt\\Professional\\Лидерство\\Ситуации',
      path.resolve('D:/gpt/Professional/Лидерство/Ситуации'),
    ];

    for (const possiblePath of possiblePaths) {
      try {
        const normalizedPath = path.normalize(possiblePath);
        
        // Проверка на path traversal
        if (normalizedPath.includes('..')) {
          const resolvedPath = path.resolve(normalizedPath);
          if (!resolvedPath.startsWith(normalizedWorkspaceRoot) && 
              !resolvedPath.startsWith('D:\\gpt\\Professional') &&
              !resolvedPath.startsWith('D:/gpt/Professional')) {
            continue;
          }
        }
        
        if (existsSync(normalizedPath)) {
          return normalizedPath;
        }
      } catch (error) {
        // Игнорируем ошибки доступа к файлам
        continue;
      }
    }

    return null;
  }
}

