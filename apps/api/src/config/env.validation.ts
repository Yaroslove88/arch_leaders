import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsOptional()
  @IsString({ message: 'DATABASE_URL must be a string' })
  DATABASE_URL?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'PORT must be a number' })
  PORT?: number;

  @IsOptional()
  @IsEnum(NodeEnv, { message: 'NODE_ENV must be one of: development, production, test' })
  NODE_ENV?: NodeEnv;

  @IsOptional()
  @IsString({ message: 'WEB_URL must be a string' })
  WEB_URL?: string;

  @IsOptional()
  @IsString({ message: 'API_KEY must be a string' })
  API_KEY?: string;

  @IsOptional()
  @IsString({ message: 'TELEGRAM_BOT_TOKEN must be a string' })
  TELEGRAM_BOT_TOKEN?: string;

  @IsOptional()
  @IsString({ message: 'OPENAI_API_KEY must be a string' })
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString({ message: 'ANTHROPIC_API_KEY must be a string' })
  ANTHROPIC_API_KEY?: string;

  @IsOptional()
  @IsString({ message: 'JWT_SECRET must be a string' })
  JWT_SECRET?: string;

  @IsOptional()
  @IsString({ message: 'JWT_EXPIRES_IN must be a string' })
  JWT_EXPIRES_IN?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  // Дополнительная валидация для production
  const nodeEnv = (validatedConfig.NODE_ENV || 'development') as NodeEnv;
  
  if (nodeEnv === NodeEnv.Production) {
    const missingVars: string[] = [];
    
    if (!validatedConfig.DATABASE_URL) {
      missingVars.push('DATABASE_URL');
    }
    
    if (!validatedConfig.WEB_URL) {
      missingVars.push('WEB_URL');
    }
    
    // Хотя бы один LLM ключ должен быть установлен
    if (!validatedConfig.OPENAI_API_KEY && !validatedConfig.ANTHROPIC_API_KEY) {
      console.warn('⚠️  WARNING: No LLM API key found. Analysis will use mock data.');
      console.warn('   Set either OPENAI_API_KEY or ANTHROPIC_API_KEY for production.');
    }
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables for production: ${missingVars.join(', ')}`
      );
    }
  } else {
    // Для development - предупреждения
    if (!validatedConfig.DATABASE_URL) {
      console.warn('⚠️  WARNING: DATABASE_URL is not set. Database connection will fail.');
    }
    
    if (!validatedConfig.OPENAI_API_KEY && !validatedConfig.ANTHROPIC_API_KEY) {
      console.warn('⚠️  WARNING: No LLM API key found. Analysis will use mock data.');
    }
  }

  return validatedConfig;
}

