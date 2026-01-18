'use client';

import React from 'react';

interface CaseContextFormatterProps {
  context: string;
  variant?: 'preview' | 'full';
  maxSections?: number;
}

/**
 * Компонент для красивого форматирования контекста кейса
 * Парсит текст на секции и отображает их структурированно
 */
export default function CaseContextFormatter({ 
  context, 
  variant = 'full',
  maxSections 
}: CaseContextFormatterProps) {
  // Парсим контекст на секции
  const sections = parseContext(context);

  // Для preview режима ограничиваем количество секций
  const displaySections = variant === 'preview' && maxSections 
    ? sections.slice(0, maxSections)
    : sections;

  if (variant === 'preview') {
    return (
      <div className="space-y-2.5">
        {displaySections.map((section, index) => (
          <div key={index} className="text-sm leading-relaxed">
            <span className="font-bold text-ui-text-main">{section.title}:</span>
            <span className="text-ui-text-muted ml-1.5">{truncateText(section.content, 100)}</span>
          </div>
        ))}
        {sections.length > displaySections.length && (
          <div className="text-xs text-ui-text-muted italic pt-1.5">
            ... и ещё {sections.length - displaySections.length} {sections.length - displaySections.length === 1 ? 'секция' : 'секции'}
          </div>
        )}
      </div>
    );
  }

  // Полный режим с красивым форматированием
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div 
          key={index} 
          className="border-l-4 border-system-focus/40 pl-5 py-4 bg-gradient-to-r from-bg-secondary/50 to-bg-secondary/20 rounded-r-lg hover:from-bg-secondary/70 hover:to-bg-secondary/40 transition-all shadow-sm"
        >
          <h3 className="font-bold text-lg text-ui-text-main mb-3 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-strategic-blue shadow-sm"></span>
            <span className="bg-strategic-blue/10 px-2 py-0.5 rounded text-strategic-blue">
              {section.title}
            </span>
          </h3>
          <div className="text-sm text-ui-text-main leading-relaxed pl-3.5 space-y-3">
            {section.content.split('\n\n').map((paragraph, pIndex) => {
              if (!paragraph.trim()) return null;
              const formatted = formatTextWithAccents(paragraph.trim());
              return (
                <p key={pIndex} className="mb-3 last:mb-0 text-base leading-7">
                  {formatted}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Парсит контекст на секции
 * Секции разделяются переносами строк и начинаются с заголовка, заканчивающегося двоеточием
 */
function parseContext(context: string): Array<{ title: string; content: string }> {
  if (!context) return [];

  // Нормализуем переносы строк (убираем лишние пробелы после \n)
  const normalized = context.replace(/\n\s+/g, '\n').trim();

  // Разделяем на строки
  const lines = normalized.split('\n').filter(line => line.trim());

  const sections: Array<{ title: string; content: string }> = [];
  let currentSection: { title: string; content: string } | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Проверяем, является ли строка заголовком секции
    // Заголовок должен заканчиваться двоеточием и быть относительно коротким (до 50 символов)
    const isHeader = trimmedLine.endsWith(':') && trimmedLine.length < 50;
    
    if (isHeader) {
      // Сохраняем предыдущую секцию, если она есть
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }
      
      // Создаём новую секцию
      const title = trimmedLine.slice(0, -1).trim(); // Убираем двоеточие
      currentSection = { title, content: '' };
    } else if (currentSection) {
      // Добавляем содержимое к текущей секции с сохранением переносов строк
      if (currentSection.content) {
        currentSection.content += '\n' + trimmedLine;
      } else {
        currentSection.content = trimmedLine;
      }
    } else {
      // Если нет текущей секции и строка не является заголовком, 
      // создаём секцию "Контекст" для первой строки
      if (sections.length === 0 && !currentSection) {
        currentSection = { title: 'Контекст', content: trimmedLine };
      }
    }
  }

  // Добавляем последнюю секцию
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // Если не удалось распарсить на секции, возвращаем весь контекст как одну секцию
  if (sections.length === 0) {
    return [{ title: 'Контекст', content: context.trim() }];
  }

  // Очищаем содержимое секций, но сохраняем переносы строк для абзацев
  return sections.map(section => ({
    title: section.title,
    content: section.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n') // Двойной перенос для абзацев
  }));
}

/**
 * Обрезает текст до указанной длины, добавляя многоточие
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Форматирует текст с акцентами - выделяет ключевые слова жирным шрифтом
 */
function formatTextWithAccents(text: string): React.ReactNode {
  // Если текст пустой, возвращаем как есть
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Список ключевых терминов для выделения (отсортированы от длинных к коротким)
  const keyTerms = [
    'Последний инцидент', 'Суть конфликта', 'Динамика конфликта', 'Текущая ситуация',
    'Системный контекст', 'Контекст задачи', 'Варианты решения', 'Масштаб проблемы',
    'Операционная картина', 'Временной контекст', 'История отношений', 'Суть различий',
    'Компания', 'Проект', 'Ситуация', 'Проблема', 'Инцидент', 'Конфликт',
    'История', 'Риски', 'Паттерн'
  ];

  // Паттерны для выделения: числа, важные слова в кавычках, ключевые фразы
  const patterns: Array<{ pattern: RegExp; className: string; groupIndex?: number }> = [
    // Выделяем ключевые термины - создаем паттерн для каждого термина отдельно
    // Используем простой паттерн, который находит слова в любом месте текста
    ...keyTerms.map(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Паттерн: начало строки или пробел/двоеточие, затем термин, затем пробел/двоеточие/конец строки
      // Используем группы захвата: (префикс)(термин)
      return {
        pattern: new RegExp(`(^|\\s|:)(${escaped})(?=\\s*:|\\s|$)`, 'gim'),
        className: 'font-extrabold text-ui-text-main',
        groupIndex: 2 // Используем вторую группу (сам термин, без префикса)
      };
    }),
    // Выделяем целые числа (только отдельно стоящие, не часть слова)
    { pattern: /\b(\d+)\b/g, className: 'font-bold text-catalyst-gold', groupIndex: 1 },
    // Выделяем проценты
    { pattern: /(\d+%)/g, className: 'font-bold text-catalyst-gold', groupIndex: 1 },
    // Выделяем слова в кавычках
    { pattern: /"([^"]+)"/g, className: 'font-medium text-catalyst-gold italic', groupIndex: 1 },
    // Выделяем важные фразы (например, "критично", "важно", "срочно")
    { pattern: /\b(критично|важно|срочно|критичен|критична|необходимо|обязательно)\b/gi, className: 'font-bold text-tension-red' },
    // Выделяем временные указания
    { pattern: /\b(завтра|сегодня|через \d+ (дня|дней|часа|часов|месяца|месяцев)|в течение)\b/gi, className: 'font-semibold text-catalyst-gold' },
  ];

  let result: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Собираем все совпадения с их позициями
  const matches: Array<{ start: number; end: number; text: string; className: string }> = [];
  
  patterns.forEach(({ pattern, className, groupIndex }) => {
    const regex = pattern instanceof RegExp 
      ? new RegExp(pattern.source, pattern.flags || 'gi')
      : new RegExp(String(pattern), 'gi');
    let match;
    // Сбрасываем lastIndex для глобального регулярного выражения
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      // Используем указанную группу захвата, если есть, иначе весь матч
      const matchedText = groupIndex && match[groupIndex] ? match[groupIndex] : match[0];
      // Вычисляем позицию совпадения с учетом группы
      let matchStart = match.index;
      if (groupIndex && match[groupIndex]) {
        // Находим позицию группы внутри полного совпадения
        matchStart = match.index + match[0].indexOf(matchedText);
      }
      
      matches.push({
        start: matchStart,
        end: matchStart + matchedText.length,
        text: matchedText,
        className
      });
    }
  });

  // Сортируем совпадения по позиции
  matches.sort((a, b) => a.start - b.start);

  // Убираем перекрывающиеся совпадения (оставляем первое)
  const nonOverlapping: typeof matches = [];
  for (const match of matches) {
    if (nonOverlapping.length === 0 || match.start >= nonOverlapping[nonOverlapping.length - 1].end) {
      nonOverlapping.push(match);
    }
  }

  // Строим результат
  nonOverlapping.forEach((match) => {
    // Добавляем текст до совпадения
    if (match.start > lastIndex) {
      result.push(<span key={key++}>{text.slice(lastIndex, match.start)}</span>);
    }
    
    // Добавляем выделенный текст
    result.push(
      <span key={key++} className={match.className}>
        {match.text}
      </span>
    );
    lastIndex = match.end;
  });

  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    result.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return result.length > 0 ? <>{result}</> : text;
}
