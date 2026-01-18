#!/usr/bin/env node
/**
 * Скрипт для проверки доступности портов перед запуском dev серверов
 * Next.js должен быть на 3000, API на 3001
 */

const { execSync } = require('child_process');
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

function getProcessUsingPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    const lines = result.trim().split('\n');
    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid) {
        try {
          const processInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV`, { encoding: 'utf-8' });
          const match = processInfo.match(/"([^"]+)","(\d+)"/);
          if (match) {
            return { name: match[1], pid: match[2] };
          }
          return { name: 'Unknown', pid };
        } catch {
          return { name: 'Unknown', pid };
        }
      }
    }
  } catch (error) {
    // Port not in use or command failed
  }
  return null;
}

async function main() {
  const ports = [
    { port: 3000, name: 'Next.js (Frontend)' },
    { port: 3001, name: 'API (Backend)' },
  ];

  const issues = [];

  for (const { port, name } of ports) {
    const available = await checkPort(port);
    if (!available) {
      const process = getProcessUsingPort(port);
      issues.push({ port, name, process });
    }
  }

  if (issues.length > 0) {
    console.error('\n❌ Проблемы с портами:\n');
    for (const { port, name, process } of issues) {
      console.error(`  Порт ${port} (${name}) занят`);
      if (process) {
        console.error(`    Процесс: ${process.name} (PID: ${process.pid})`);
        console.error(`    Команда для освобождения: taskkill /PID ${process.pid} /F`);
      }
      console.error('');
    }
    console.error('💡 Решения:');
    console.error('  1. Остановите процессы, использующие эти порты');
    console.error('  2. Или используйте команды выше для принудительного завершения');
    console.error('  3. Или измените порты в конфигурации\n');
    process.exit(1);
  }

  console.log('✅ Все порты свободны (3000 - Next.js, 3001 - API)');
}

main().catch((error) => {
  console.error('Ошибка при проверке портов:', error);
  process.exit(1);
});
