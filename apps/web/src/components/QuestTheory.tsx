'use client';

import { useMemo } from 'react';

/**
 * Компонент для отображения теории и примеров квеста
 * 
 * Теория берется из quest.criteria.theory_and_examples согласно структуре из:
 * - docs/QUEST_CONTENT_STRUCTURE.md (определяет структуру полей квеста)
 * - docs/QUEST_THEORY_EXAMPLES.md (содержит примеры готовых теорий)
 * 
 * Теория содержит:
 * - Теоретическое объяснение концепции
 * - Примеры применения
 * - Практические советы
 * - Интеграцию в ежедневную практику
 * 
 * НЕ содержит шаги выполнения (steps) и критерии (criteria.items) - они в отдельных секциях
 */
function parseMarkdown(text: string): string {
  try {
    if (!text || typeof text !== 'string') return '';
    
    // Экранируем HTML для безопасности
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Восстанавливаем экранированные символы после обработки форматирования
    html = html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    // Разбиваем на строки для обработки
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    let listItems: string[] = [];
    
    function flushList() {
      if (listItems.length > 0 && listType) {
        const tag = listType === 'ul' ? 'ul' : 'ol';
        const className = listType === 'ul' 
          ? 'list-disc ml-6 mb-4 space-y-2 text-ash-light' 
          : 'list-decimal ml-6 mb-4 space-y-2 text-ash-light';
        processedLines.push(`<${tag} class="${className}">${listItems.join('')}</${tag}>`);
        listItems = [];
        listType = null;
      }
      inList = false;
    }
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();
      
      // Заголовки (проверяем до обрезки пробелов)
      if (trimmed.startsWith('### ')) {
        flushList();
        processedLines.push(`<h3 class="font-semibold text-ash-light mt-6 mb-3 text-lg">${trimmed.substring(4)}</h3>`);
        continue;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        processedLines.push(`<h2 class="font-semibold text-ash-light mt-6 mb-4 text-xl">${trimmed.substring(3)}</h2>`);
        continue;
      }
      if (trimmed.startsWith('# ')) {
        flushList();
        processedLines.push(`<h1 class="font-bold text-ash-light mt-6 mb-4 text-2xl">${trimmed.substring(2)}</h1>`);
        continue;
      }
      
      // Нумерованный список
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        // Обрабатываем форматирование внутри элемента списка
        let content = numberedMatch[2];
        content = content.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ash-light">$1</strong>');
        listItems.push(`<li class="text-ash-light">${content}</li>`);
        continue;
      }
      
      // Маркированный список
      const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        // Обрабатываем форматирование внутри элемента списка
        let content = bulletMatch[1];
        content = content.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ash-light">$1</strong>');
        listItems.push(`<li class="text-ash-light">${content}</li>`);
        continue;
      }
      
      // Не список - закрываем предыдущий список
      if (inList) {
        flushList();
      }
      
      // Пустая строка
      if (trimmed === '') {
        processedLines.push('');
        continue;
      }
      
      // Обычная строка - обрабатываем форматирование
      let processedLine = trimmed;
      processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ash-light">$1</strong>');
      processedLine = processedLine.replace(/\*(.+?)\*/g, '<em class="italic text-ui-text-muted">$1</em>');
      processedLines.push(processedLine);
    }
    
    flushList();
    html = processedLines.join('\n');
    
    // Разделяем на параграфы (двойной перенос строки)
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs
      .map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        // Если это уже заголовок или список, не оборачиваем в параграф
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
          return trimmed;
        }
        return `<p class="mb-4 text-ash-light leading-relaxed">${trimmed}</p>`;
      })
      .filter(p => p)
      .join('\n');
  
    return html;
  } catch (error) {
    console.error('Error in parseMarkdown:', error);
    return text || '';
  }
}

interface QuestTheoryProps {
  theory?: string;
  steps?: any[];
}

export function QuestTheory({ theory, steps }: QuestTheoryProps) {
  const parsedHtml = useMemo(() => {
    if (!theory || typeof theory !== 'string' || theory.trim().length <= 10) {
      return null;
    }
    
    // Фильтруем дублирование: убираем части, которые повторяют шаги и критерии
    let cleanedTheory = theory;
    
    // Удаляем повторяющиеся части про шаги (если они есть в теории)
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const stepDescriptions = steps
        .map((s: any) => (s.description || s.text || '').trim())
        .filter((d: string) => d.length > 10);
      
      // Удаляем упоминания конкретных шагов из теории, если они там есть
      stepDescriptions.forEach((stepDesc: string) => {
        const shortStep = stepDesc.substring(0, 30); // Первые 30 символов шага
        if (cleanedTheory.includes(shortStep)) {
          // Найдено совпадение - возможно дублирование, но не удаляем, так как может быть контекст
        }
      });
    }
    
    try {
      return parseMarkdown(cleanedTheory);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return null;
    }
  }, [theory, steps]);
  
  if (!parsedHtml) {
    return (
      <div className="mt-4 p-6 bg-bg-secondary rounded-lg border border-ui-border-soft">
        <div className="text-ash-light space-y-4">
          <div className="p-4 bg-graphite-structure rounded border border-ui-border-soft mb-4">
            <p className="text-sm text-ui-text-muted leading-relaxed">
              <strong className="font-semibold text-ash-light">Теория</strong> содержит детальное объяснение способности, 
              которую вы развиваете в этом квесте, с пояснением терминов, обоснованием важности и примерами применения.
            </p>
          </div>
          <p className="leading-relaxed">
            Детальная теория поможет вам понять не только <strong className="font-semibold">что</strong> делать, 
            но и <strong className="font-semibold">как</strong> это делать в реальности, 
            и <strong className="font-semibold">почему</strong> это важно для развития лидерства.
          </p>
          <p className="text-sm text-ui-text-muted italic">
            Теоретическая информация для этого квеста будет добавлена в ближайшее время.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-bg-secondary rounded-lg border border-ui-border-soft">
      <div 
        className="text-ash-light space-y-4"
        dangerouslySetInnerHTML={{ 
          __html: parsedHtml
        }}
      />
    </div>
  );
}

