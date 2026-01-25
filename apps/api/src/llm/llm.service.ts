import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisResponseSchema, type AnalysisResponse } from './llm-response.schema';
import type { LLMCallResult, LLMParseError } from './llm-call-result';

/**
 * Сервис для работы с LLM API
 * Поддерживает OpenAI и Anthropic
 * Загружает промпты из prompt_registry
 */
@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly openaiApiKey?: string;
  private readonly anthropicApiKey?: string;
  private readonly provider: 'openai' | 'anthropic' | 'none';
  private readonly analysisPromptId = 'analysis_situation';
  private readonly questTheoryPromptId = 'quest_theory';
  
  // Кэш для промптов (загружаются при первом использовании)
  private analysisPromptCache: { template: string; version: number } | null = null;
  private questTheoryPromptCache: { template: string; version: number } | null = null;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    this.logger.log('🔍 LLMService constructor called');
    this.logger.log(`🔍 ConfigService: ${this.configService ? 'available' : 'NOT available'}`);
    
    if (!this.configService) {
      throw new Error('ConfigService must be injected. Check that ConfigModule is properly imported.');
    }

    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (this.openaiApiKey) {
      this.provider = 'openai';
      this.logger.log('✅ Using OpenAI API');
    } else if (this.anthropicApiKey) {
      this.provider = 'anthropic';
      this.logger.log('✅ Using Anthropic API');
    } else {
      this.provider = 'none';
      this.logger.warn('⚠️ No LLM API key found. Analysis will use mock data.');
    }
    this.logger.log('✅ LLMService initialized successfully');
  }

  /**
   * Анализ управленческой ситуации через LLM
   */
  async analyzeSituation(
    entry: {
      text: string;
      type: string;
      participants?: string[];
      context_json?: any;
    },
    requestId?: string,
  ): Promise<{
    summary: string;
    insights: any[];
    focus: any[];
    themes: string[];
    patterns: string[];
    tensions: string[];
    ability_signals: any[];
    __meta: {
      prompt_id: string;
      prompt_version: number;
      model: string;
    };
  }> {
    if (this.provider === 'none') {
      return this.generateMockAnalysis(entry);
    }

    const prompt = await this.buildAnalysisPrompt(entry);

    try {
      let result: LLMCallResult<AnalysisResponse>;
      
      if (this.provider === 'openai') {
        result = await this.callOpenAIWithRetry(prompt, requestId);
      } else if (this.provider === 'anthropic') {
        result = await this.callAnthropicWithRetry(prompt, requestId);
      } else {
        // Fallback для неизвестного провайдера
        return this.generateMockAnalysis(entry);
      }

      // Логируем успешный вызов
      this.logStructuredCall({
        requestId: result.requestId || requestId,
        model: result.model,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        latencyMs: result.latencyMs,
        success: true,
      });

      return {
        summary: result.data.summary,
        insights: result.data.insights,
        focus: result.data.focus,
        themes: result.data.themes,
        patterns: result.data.patterns,
        tensions: result.data.tensions,
        ability_signals: result.data.ability_signals,
        __meta: {
          prompt_id: this.analysisPromptId,
          prompt_version: this.analysisPromptCache?.version || 0,
          model: result.model,
        },
      };
    } catch (error) {
      this.logger.error(`[${requestId || 'unknown'}] LLM analysis failed:`, error);
      // Fallback to mock analysis
      return this.generateMockAnalysis(entry);
    }
  }

  /**
   * Загрузить промпт из prompt_registry
   */
  private async loadPrompt(promptId: string): Promise<{ template: string; version: number }> {
    try {
      // Ищем активную версию промпта
      const prompt = await this.prisma.promptRegistry.findFirst({
        where: {
          prompt_id: promptId,
          status: 'active',
        },
        orderBy: {
          version: 'desc',
        },
      });

      if (prompt) {
        this.logger.log(`✅ Загружен промпт ${promptId} v${prompt.version} из prompt_registry`);
        return { template: prompt.template, version: prompt.version };
      }

      // Fallback на хардкод, если промпт не найден в БД
      this.logger.warn(`⚠️ Промпт ${promptId} не найден в prompt_registry, используется fallback`);
      return this.getFallbackPrompt(promptId);
    } catch (error) {
      this.logger.error(`❌ Ошибка загрузки промпта ${promptId}:`, error);
      return this.getFallbackPrompt(promptId);
    }
  }

  /**
   * Fallback промпты (если не найдены в БД)
   */
  private getFallbackPrompt(promptId: string): { template: string; version: number } {
    if (promptId === 'analysis_situation') {
      return {
        template: `Проанализируй управленческую ситуацию и извлеки структурированные данные.

Ситуация:
{{entry.text}}

Участники: {{entry.participants}}
Контекст: {{entry.context_json}}

Извлеки:
1. **Темы** - повторяющиеся мотивы (массив строк)
2. **Паттерны** - поведенческие паттерны лидера (массив строк)
3. **Напряжения** - конфликты, противоречия (массив строк)
4. **Способности** - проявленные архитектурные способности (массив объектов с node_id и signal)
5. **Инсайты** - важные наблюдения (массив объектов с title и description)
6. **Фокус** - зоны для внимания (массив объектов с area и priority)

Верни JSON в формате:
{
  "summary": "краткая сводка ситуации",
  "themes": ["тема1", "тема2"],
  "patterns": ["паттерн1", "паттерн2"],
  "tensions": ["напряжение1"],
  "ability_signals": [{"node_id": "node_id", "signal": "описание"}],
  "insights": [{"title": "заголовок", "description": "описание"}],
  "focus": [{"area": "область", "priority": "high|medium|low"}]
}`,
        version: 0, // Fallback версия
      };
    }
    
    if (promptId === 'quest_theory') {
      return {
        template: `Ты — эксперт по лидерству и развитию способностей. Создай подробное описание теории и примеров для квеста.

КОНТЕКСТ КВЕСТА:
- Название: {{quest.title}}
- Описание: {{quest.description}}
- Тип: {{quest.type}}
- Связанные способности: {{quest.linked_nodes}}
- Шаги: {{quest.steps}}
- Критерии: {{quest.criteria}}

КОНТЕКСТ СПОСОБНОСТИ:
{{abilityNode.name}} - {{abilityNode.full_description}}
Практическое значение: {{abilityNode.practical_meaning}}

Создай раздел "Подробнее" включающий:
1. Теоретическое объяснение способности
2. Что это значит на практике
3. Конкретные примеры применения
4. Практические советы
5. Как интегрировать в ежедневную практику

Формат: Markdown (800-1200 слов)`,
        version: 0, // Fallback версия
      };
    }

    throw new Error(`Unknown prompt ID: ${promptId}`);
  }

  /**
   * Построить промпт для анализа ситуации (загружает из prompt_registry)
   */
  private async buildAnalysisPrompt(entry: {
    text: string;
    type: string;
    participants?: string[];
    context_json?: any;
  }): Promise<string> {
    // Загружаем промпт из БД или используем кэш
    if (!this.analysisPromptCache) {
      this.analysisPromptCache = await this.loadPrompt(this.analysisPromptId);
    }

    const template = this.analysisPromptCache.template;
    const participants = entry.participants?.join(', ') || 'не указаны';
    const context = entry.context_json
      ? JSON.stringify(entry.context_json, null, 2)
      : 'не указан';

    // Простая замена переменных (можно улучшить используя шаблонизатор)
    return template
      .replace(/\{\{entry\.text\}\}/g, entry.text)
      .replace(/\{\{entry\.participants\}\}/g, participants)
      .replace(/\{\{entry\.context_json\}\}/g, context);
  }

  /**
   * Вызов OpenAI API с retry и валидацией
   */
  private async callOpenAIWithRetry(
    prompt: string,
    requestId?: string,
    maxRetries = 2,
  ): Promise<LLMCallResult<AnalysisResponse>> {
    let lastError: Error | null = null;
    let rawResponse: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const model = 'gpt-4o-mini';

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'Ты анализируешь управленческие ситуации и извлекаешь структурированные данные. Всегда возвращай валидный JSON.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
          }),
        });

        const latencyMs = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;
        const tokensIn = data.usage?.prompt_tokens;
        const tokensOut = data.usage?.completion_tokens;

        if (!content) {
          throw new Error('No content in OpenAI response');
        }

        rawResponse = content;

        // Парсим JSON и валидируем через zod
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch (parseError) {
          const parseErr: LLMParseError = {
            rawResponse: content,
            error: parseError instanceof Error ? parseError.message : String(parseError),
            requestId,
            model,
          };
          this.logParseError(parseErr);
          throw new Error(`Failed to parse JSON response: ${parseErr.error}`);
        }

        // Валидация через zod
        const validated = AnalysisResponseSchema.parse(parsed);

        return {
          data: validated,
          model,
          tokensIn,
          tokensOut,
          latencyMs,
          requestId,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s
          const delayMs = Math.pow(2, attempt) * 1000;
          this.logger.warn(
            `[${requestId || 'unknown'}] OpenAI call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms:`,
            lastError.message,
          );
          await this.sleep(delayMs);
        } else {
          // Последняя попытка - сохраняем raw response если есть
          if (rawResponse) {
            const parseErr: LLMParseError = {
              rawResponse,
              error: lastError.message,
              requestId,
              model: 'gpt-4o-mini',
            };
            this.logParseError(parseErr);
          }
        }
      }
    }

    throw lastError || new Error('OpenAI call failed after retries');
  }

  /**
   * Вызов Anthropic API с retry и валидацией
   */
  private async callAnthropicWithRetry(
    prompt: string,
    requestId?: string,
    maxRetries = 2,
  ): Promise<LLMCallResult<AnalysisResponse>> {
    let lastError: Error | null = null;
    let rawResponse: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const model = 'claude-3-5-sonnet-20241022';

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.anthropicApiKey!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 4000,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        });

        const latencyMs = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as any;
        const content = data.content?.[0]?.text;
        const tokensIn = data.usage?.input_tokens;
        const tokensOut = data.usage?.output_tokens;

        if (!content) {
          throw new Error('No content in Anthropic response');
        }

        rawResponse = content;

        // Парсим JSON и валидируем через zod
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch (parseError) {
          const parseErr: LLMParseError = {
            rawResponse: content,
            error: parseError instanceof Error ? parseError.message : String(parseError),
            requestId,
            model,
          };
          this.logParseError(parseErr);
          throw new Error(`Failed to parse JSON response: ${parseErr.error}`);
        }

        // Валидация через zod
        const validated = AnalysisResponseSchema.parse(parsed);

        return {
          data: validated,
          model,
          tokensIn,
          tokensOut,
          latencyMs,
          requestId,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s
          const delayMs = Math.pow(2, attempt) * 1000;
          this.logger.warn(
            `[${requestId || 'unknown'}] Anthropic call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms:`,
            lastError.message,
          );
          await this.sleep(delayMs);
        } else {
          // Последняя попытка - сохраняем raw response если есть
          if (rawResponse) {
            const parseErr: LLMParseError = {
              rawResponse,
              error: lastError.message,
              requestId,
              model: 'claude-3-5-sonnet-20241022',
            };
            this.logParseError(parseErr);
          }
        }
      }
    }

    throw lastError || new Error('Anthropic call failed after retries');
  }

  /**
   * Генерация теории и примеров для квеста
   */
  async generateQuestTheory(quest: {
    title: string;
    description: string;
    type: string;
    steps?: any[];
    criteria?: any;
    linked_nodes?: string[];
  }, abilityNode?: {
    node_id: string;
    name?: string;
    full_description?: string;
    practical_meaning?: string;
    examples?: string[];
  }): Promise<string> {
    if (this.provider === 'none') {
      return this.generateMockQuestTheory(quest, abilityNode);
    }

    const prompt = await this.buildQuestTheoryPrompt(quest, abilityNode);
    const promptVersion = this.questTheoryPromptCache?.version || 0;
    this.logger.log(
      `[Prompt] ${this.questTheoryPromptId}_v${promptVersion} provider=${this.provider}`,
    );

    try {
      if (this.provider === 'openai') {
        return await this.callOpenAIText(prompt);
      } else if (this.provider === 'anthropic') {
        return await this.callAnthropicText(prompt);
      } else {
        // Fallback для неизвестного провайдера
        return this.generateMockQuestTheory(quest, abilityNode);
      }
    } catch (error) {
      this.logger.error('Quest theory generation failed:', error);
      return this.generateMockQuestTheory(quest, abilityNode);
    }
  }

  /**
   * Построить промпт для генерации теории квеста (загружает из prompt_registry)
   */
  private async buildQuestTheoryPrompt(quest: {
    title: string;
    description: string;
    type: string;
    steps?: any[];
    criteria?: any;
    linked_nodes?: string[];
  }, abilityNode?: {
    node_id: string;
    name?: string;
    full_description?: string;
    practical_meaning?: string;
    examples?: string[];
  }): Promise<string> {
    // Загружаем промпт из БД или используем кэш
    if (!this.questTheoryPromptCache) {
      this.questTheoryPromptCache = await this.loadPrompt(this.questTheoryPromptId);
    }

    const template = this.questTheoryPromptCache.template;
    const stepsText = quest.steps?.map((s, i) => `${i + 1}. ${typeof s === 'string' ? s : s.description || s.text || JSON.stringify(s)}`).join('\n') || 'не указаны';
    const criteriaText = typeof quest.criteria === 'string' 
      ? quest.criteria 
      : quest.criteria?.description || JSON.stringify(quest.criteria);
    const abilityInfo = abilityNode 
      ? `
КОНТЕКСТ СПОСОБНОСТИ:
- Название: ${abilityNode.name || abilityNode.node_id}
- Описание: ${abilityNode.full_description || 'не указано'}
- Практическое значение: ${abilityNode.practical_meaning || 'не указано'}
- Примеры: ${abilityNode.examples?.join(', ') || 'не указаны'}
`
      : '';

    // Простая замена переменных (можно улучшить используя шаблонизатор)
    return template
      .replace(/\{\{quest\.title\}\}/g, quest.title)
      .replace(/\{\{quest\.description\}\}/g, quest.description)
      .replace(/\{\{quest\.type\}\}/g, quest.type)
      .replace(/\{\{quest\.linked_nodes\}\}/g, quest.linked_nodes?.join(', ') || 'не указаны')
      .replace(/\{\{quest\.steps\}\}/g, stepsText)
      .replace(/\{\{quest\.criteria\}\}/g, criteriaText)
      .replace(/\{\{abilityNode\.name\}\}/g, abilityNode?.name || 'не указано')
      .replace(/\{\{abilityNode\.full_description\}\}/g, abilityNode?.full_description || 'не указано')
      .replace(/\{\{abilityNode\.practical_meaning\}\}/g, abilityNode?.practical_meaning || 'не указано')
      .replace(/\{\{abilityNode\.examples\}\}/g, abilityNode?.examples?.join(', ') || 'не указаны')
      .replace(/\{\{#if abilityNode\}\}([\s\S]*?)\{\{\/if\}\}/g, abilityNode ? '$1' : '')
      .replace(/\{\{abilityInfo\}\}/g, abilityInfo);
  }

  /**
   * Вызов OpenAI API для генерации текста (не JSON)
   */
  private async callOpenAIText(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по лидерству и развитию способностей. Создаешь подробные описания теории и примеров для квестов развития лидерства. Всегда возвращай текст в формате Markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return content;
  }

  /**
   * Вызов Anthropic API для генерации текста (не JSON)
   */
  private async callAnthropicText(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.content?.[0]?.text;
    
    if (!content) {
      throw new Error('No content in Anthropic response');
    }

    return content;
  }

  /**
   * Генерация мок-теории (если LLM недоступен)
   */
  private generateMockQuestTheory(quest: {
    title: string;
    description: string;
    type: string;
  }, abilityNode?: {
    node_id: string;
    name?: string;
  }): string {
    this.logger.warn('Using mock quest theory (no LLM API key)');
    
    return `## Теоретическое объяснение

Этот квест направлен на развитие способности "${abilityNode?.name || quest.title}".

### Что это значит на практике

${quest.description}

### Примеры применения

- Пример 1: [Конкретная ситуация из практики лидерства]
- Пример 2: [Другая ситуация]

### Практические советы

1. Начните с простых ситуаций
2. Практикуйте регулярно
3. Записывайте наблюдения

### Как интегрировать в ежедневную практику

Включите эту способность в свою ежедневную практику лидерства.`;
  }

  /**
   * Структурированное логирование вызова LLM
   */
  private logStructuredCall(params: {
    requestId?: string;
    model: string;
    tokensIn?: number;
    tokensOut?: number;
    latencyMs: number;
    success: boolean;
  }) {
    const logData = {
      requestId: params.requestId || 'unknown',
      model: params.model,
      tokensIn: params.tokensIn,
      tokensOut: params.tokensOut,
      latencyMs: params.latencyMs,
      success: params.success,
    };

    if (params.success) {
      this.logger.log(`[LLM Call] ${JSON.stringify(logData)}`);
    } else {
      this.logger.error(`[LLM Call Failed] ${JSON.stringify(logData)}`);
    }
  }

  /**
   * Логирование ошибки парсинга LLM ответа
   */
  private logParseError(error: LLMParseError) {
    this.logger.error(
      `[LLM Parse Error] requestId=${error.requestId || 'unknown'} model=${error.model || 'unknown'} error=${error.error}`,
    );
    this.logger.error(`[LLM Parse Error] Raw response: ${error.rawResponse.substring(0, 500)}...`);
    
    // В будущем можно сохранять в БД (LlmRun с ошибкой)
    // Пока логируем в консоль
  }

  /**
   * Утилита для задержки (backoff)
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Генерация мок-анализа (если LLM недоступен)
   */
  private generateMockAnalysis(entry: {
    text: string;
    type: string;
    participants?: string[];
  }): any {
    this.logger.warn('Using mock analysis (no LLM API key)');
    
    return {
      summary: `Анализ ситуации: ${entry.text.substring(0, 200)}...`,
      themes: ['управление', 'команда'],
      patterns: ['принятие решений'],
      tensions: ['неопределенность'],
      ability_signals: [
        {
          node_id: 'node_containment',
          signal: 'Удержание напряжения',
        },
      ],
      insights: [
        {
          title: 'Наблюдение',
          description: 'Ситуация требует анализа для выявления паттернов',
        },
      ],
      focus: [
        {
          area: 'Развитие способностей',
          priority: 'high',
        },
      ],
      __meta: {
        prompt_id: this.analysisPromptId,
        prompt_version: this.analysisPromptCache?.version || 0,
        model: 'mock',
      },
    };
  }
}

