/**
 * Результат вызова LLM API
 */
export interface LLMCallResult<T> {
  data: T;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs: number;
  requestId?: string;
}

/**
 * Ошибка парсинга LLM ответа
 */
export interface LLMParseError {
  rawResponse: string;
  error: string;
  requestId?: string;
  model?: string;
}

