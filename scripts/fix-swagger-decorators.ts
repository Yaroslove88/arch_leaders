/**
 * Скрипт для проверки и исправления декораторов Swagger в контроллерах
 * 
 * Запуск: ts-node scripts/fix-swagger-decorators.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ControllerIssue {
  file: string;
  line: number;
  issue: string;
  fix: string;
}

const issues: ControllerIssue[] = [];

function checkController(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let inMethod = false;
  let methodName = '';
  let hasParams = false;
  let hasQuery = false;
  let hasBody = false;
  let hasApiDecorators = false;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Проверка на начало метода
    if (line.match(/@(Get|Post|Patch|Delete|Put)\(/)) {
      inMethod = true;
      hasParams = false;
      hasQuery = false;
      hasBody = false;
      hasApiDecorators = false;
      methodName = line.match(/@(\w+)\(/)?.[1] || '';
    }
    
    // Проверка на декораторы Swagger
    if (line.includes('@Api')) {
      hasApiDecorators = true;
    }
    
    // Проверка параметров
    if (line.includes('@Param(')) {
      hasParams = true;
      if (!content.includes('@ApiParam')) {
        issues.push({
          file: filePath,
          line: lineNum,
          issue: `Missing @ApiParam for @Param in method`,
          fix: 'Add @ApiParam({ name: "id", type: String })',
        });
      }
    }
    
    if (line.includes('@Query(')) {
      hasQuery = true;
      if (!content.includes('@ApiQuery')) {
        issues.push({
          file: filePath,
          line: lineNum,
          issue: `Missing @ApiQuery for @Query in method`,
          fix: 'Add @ApiQuery({ name: "param", required: false, type: String })',
        });
      }
    }
    
    if (line.includes('@Body()')) {
      hasBody = true;
      if (line.includes(': any') || !content.includes('@ApiBody')) {
        issues.push({
          file: filePath,
          line: lineNum,
          issue: `Missing @ApiBody or using 'any' type`,
          fix: 'Create DTO class and use @ApiBody({ type: YourDto })',
        });
      }
    }
    
    // Конец метода
    if (line.trim().startsWith('async ') && inMethod) {
      inMethod = false;
    }
  });
}

function findControllers(dir: string) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findControllers(filePath);
    } else if (file.endsWith('.controller.ts')) {
      checkController(filePath);
    }
  });
}

// Запуск проверки
const controllersDir = path.join(__dirname, '../apps/api/src');
console.log('🔍 Checking controllers for Swagger decorators...\n');
findControllers(controllersDir);

if (issues.length === 0) {
  console.log('✅ All controllers have proper Swagger decorators!');
} else {
  console.log(`❌ Found ${issues.length} issues:\n`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${path.basename(issue.file)}:${issue.line}`);
    console.log(`   Issue: ${issue.issue}`);
    console.log(`   Fix: ${issue.fix}\n`);
  });
}

