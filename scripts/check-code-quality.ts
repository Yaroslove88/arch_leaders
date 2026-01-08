/**
 * Скрипт для проверки качества кода
 * Проверяет соблюдение правил проекта
 * 
 * Запуск: ts-node scripts/check-code-quality.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface CodeIssue {
  file: string;
  line: number;
  rule: string;
  issue: string;
  severity: 'error' | 'warning';
}

const issues: CodeIssue[] = [];

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Проверка 1: Swagger декораторы
  if (filePath.includes('.controller.ts')) {
    let hasApiTags = false;
    let controllerName = '';

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Проверка @ApiTags
      if (line.includes('@Controller(')) {
        controllerName = line.match(/@Controller\(['"]([^'"]+)['"]\)/)?.[1] || '';
        // Проверяем предыдущие строки на @ApiTags
        let found = false;
        for (let i = Math.max(0, index - 5); i < index; i++) {
          if (lines[i].includes('@ApiTags')) {
            found = true;
            hasApiTags = true;
            break;
          }
        }
        if (!found) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'SWAGGER_1',
            issue: 'Missing @ApiTags decorator on controller',
            severity: 'error',
          });
        }
      }

      // Проверка @Param без @ApiParam
      if (line.includes('@Param(') && !content.includes('@ApiParam')) {
        // Проверяем, есть ли @ApiParam в ближайших строках
        let hasApiParam = false;
        for (let i = Math.max(0, index - 10); i < Math.min(lines.length, index + 5); i++) {
          if (lines[i].includes('@ApiParam')) {
            hasApiParam = true;
            break;
          }
        }
        if (!hasApiParam) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'SWAGGER_2',
            issue: 'Missing @ApiParam decorator for @Param',
            severity: 'error',
          });
        }
      }

      // Проверка @Query без @ApiQuery
      if (line.includes('@Query(') && !content.includes('@ApiQuery')) {
        let hasApiQuery = false;
        for (let i = Math.max(0, index - 10); i < Math.min(lines.length, index + 5); i++) {
          if (lines[i].includes('@ApiQuery')) {
            hasApiQuery = true;
            break;
          }
        }
        if (!hasApiQuery) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'SWAGGER_3',
            issue: 'Missing @ApiQuery decorator for @Query',
            severity: 'error',
          });
        }
      }

      // Проверка @Body с any типом
      if (line.includes('@Body()') && line.includes(': any')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'SWAGGER_4',
          issue: 'Using "any" type for @Body parameter. Create DTO class instead',
          severity: 'error',
        });
      }

      // Проверка @Body без @ApiBody
      if (line.includes('@Body()') && !content.includes('@ApiBody')) {
        let hasApiBody = false;
        for (let i = Math.max(0, index - 10); i < Math.min(lines.length, index + 5); i++) {
          if (lines[i].includes('@ApiBody')) {
            hasApiBody = true;
            break;
          }
        }
        if (!hasApiBody) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'SWAGGER_5',
            issue: 'Missing @ApiBody decorator for @Body',
            severity: 'error',
          });
        }
      }
    });
  }

  // Проверка 2: Обработка ошибок
  if (filePath.includes('.service.ts') || filePath.includes('.controller.ts')) {
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Проверка Prisma findUnique без проверки
      if (line.includes('findUnique') && !line.includes('findUniqueOrThrow')) {
        // Проверяем следующие строки на проверку результата
        let hasCheck = false;
        for (let i = index + 1; i < Math.min(lines.length, index + 5); i++) {
          if (
            lines[i].includes('if (!') ||
            lines[i].includes('assertExists') ||
            lines[i].includes('findUniqueOrThrow')
          ) {
            hasCheck = true;
            break;
          }
        }
        if (!hasCheck && !line.includes('//')) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'ERROR_1',
            issue: 'Prisma findUnique without null check. Use findUniqueOrThrow or check result',
            severity: 'error',
          });
        }
      }

      // Проверка прямого доступа к свойствам без optional chaining
      if (
        line.match(/\.\w+\.\w+/) &&
        !line.includes('?.') &&
        !line.includes('if (') &&
        !line.includes('//')
      ) {
        // Игнорируем строки с декораторами и импортами
        if (
          !line.includes('@') &&
          !line.includes('import') &&
          !line.includes('export') &&
          !line.includes('return') &&
          line.trim().length > 0
        ) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'ERROR_2',
            issue: 'Direct property access without optional chaining. Consider using ?.',
            severity: 'warning',
          });
        }
      }

      // Проверка использования any
      if (line.includes(': any') && !line.includes('//')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'ERROR_3',
          issue: 'Using "any" type. Use specific type or create DTO',
          severity: 'error',
        });
      }
    });
  }
}

function findFiles(dir: string, extension: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const filePath = path.join(dir, item);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
      files.push(...findFiles(filePath, extension));
    } else if (filePath.endsWith(extension)) {
      files.push(filePath);
    }
  });

  return files;
}

// Запуск проверки
const srcDir = path.join(__dirname, '../apps/api/src');
console.log('🔍 Checking code quality...\n');

const tsFiles = findFiles(srcDir, '.ts');
tsFiles.forEach((file) => {
  if (!file.includes('.spec.') && !file.includes('.test.')) {
    checkFile(file);
  }
});

// Вывод результатов
if (issues.length === 0) {
  console.log('✅ No issues found! Code follows all rules.');
  process.exit(0);
} else {
  console.log(`❌ Found ${issues.length} issues:\n`);

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  if (errors.length > 0) {
    console.log(`\n🔴 ERRORS (${errors.length}):\n`);
    errors.forEach((issue, index) => {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.log(`${index + 1}. ${relativePath}:${issue.line}`);
      console.log(`   Rule: ${issue.rule}`);
      console.log(`   Issue: ${issue.issue}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n🟡 WARNINGS (${warnings.length}):\n`);
    warnings.forEach((issue, index) => {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.log(`${index + 1}. ${relativePath}:${issue.line}`);
      console.log(`   Rule: ${issue.rule}`);
      console.log(`   Issue: ${issue.issue}\n`);
    });
  }

  console.log('\n📚 See PROJECT_RULES.md for details on how to fix these issues.');
  process.exit(errors.length > 0 ? 1 : 0);
}

