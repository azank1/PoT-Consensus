/**
 * Config.ts
 * 
 * Purpose: Centralized configuration management with validation
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from './logs/Logger';

// Load environment variables
dotenv.config();

export interface AppConfig {
  // Server
  port: number;
  host: string;
  
  // Database
  databasePath: string;
  
  // Logging
  logLevel: string;
  logEnableColors: boolean;
  logDir: string;
  
  // Executor
  executorTimeout: number;
  executorContinueOnError: boolean;
  
  // Retry
  retryMaxRetries: number;
  retryInitialDelay: number;
  retryMaxDelay: number;
  retryBackoffMultiplier: number;
  
  // API
  apiRateLimitWindow: number;
  apiRateLimitMax: number;
  apiEnableCors: boolean;
  apiCorsOrigin: string;
  
  // Adapters
  adapterHttpTimeout: number;
  adapterN8nTimeout: number;
  adapterMcpTimeout: number;
  
  // Optional
  apiKey?: string;
  jwtSecret?: string;
  jwtExpiration?: string;
  anthropicApiKey?: string;
  claudeModel?: string;
  claudeMaxTokens?: number;
  
  // Environment
  nodeEnv: string;
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private getEnv(key: string, defaultValue?: string): string {
    return process.env[key] || defaultValue || '';
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private loadConfig(): AppConfig {
    return {
      // Server
      port: this.getEnvNumber('PORT', 3000),
      host: this.getEnv('HOST', 'localhost'),
      
      // Database
      databasePath: this.getEnv('DATABASE_PATH', './data/agents.db'),
      
      // Logging
      logLevel: this.getEnv('LOG_LEVEL', 'info'),
      logEnableColors: this.getEnvBoolean('LOG_ENABLE_COLORS', true),
      logDir: this.getEnv('LOG_DIR', './data/logs'),
      
      // Executor
      executorTimeout: this.getEnvNumber('EXECUTOR_TIMEOUT', 60000),
      executorContinueOnError: this.getEnvBoolean('EXECUTOR_CONTINUE_ON_ERROR', true),
      
      // Retry
      retryMaxRetries: this.getEnvNumber('RETRY_MAX_RETRIES', 3),
      retryInitialDelay: this.getEnvNumber('RETRY_INITIAL_DELAY', 1000),
      retryMaxDelay: this.getEnvNumber('RETRY_MAX_DELAY', 30000),
      retryBackoffMultiplier: this.getEnvNumber('RETRY_BACKOFF_MULTIPLIER', 2),
      
      // API
      apiRateLimitWindow: this.getEnvNumber('API_RATE_LIMIT_WINDOW', 15),
      apiRateLimitMax: this.getEnvNumber('API_RATE_LIMIT_MAX', 100),
      apiEnableCors: this.getEnvBoolean('API_ENABLE_CORS', true),
      apiCorsOrigin: this.getEnv('API_CORS_ORIGIN', '*'),
      
      // Adapters
      adapterHttpTimeout: this.getEnvNumber('ADAPTER_HTTP_TIMEOUT', 10000),
      adapterN8nTimeout: this.getEnvNumber('ADAPTER_N8N_TIMEOUT', 30000),
      adapterMcpTimeout: this.getEnvNumber('ADAPTER_MCP_TIMEOUT', 30000),
      
      // Optional
      apiKey: this.getEnv('API_KEY'),
      jwtSecret: this.getEnv('JWT_SECRET'),
      jwtExpiration: this.getEnv('JWT_EXPIRATION', '24h'),
      anthropicApiKey: this.getEnv('ANTHROPIC_API_KEY'),
      claudeModel: this.getEnv('CLAUDE_MODEL', 'claude-3-sonnet-20240229'),
      claudeMaxTokens: this.getEnvNumber('CLAUDE_MAX_TOKENS', 4096),
      
      // Environment
      nodeEnv: this.getEnv('NODE_ENV', 'development')
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate port range
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push(`Invalid PORT: ${this.config.port}. Must be between 1 and 65535.`);
    }

    // Validate log level
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(this.config.logLevel)) {
      errors.push(`Invalid LOG_LEVEL: ${this.config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
    }

    // Validate timeout values
    if (this.config.executorTimeout < 0) {
      errors.push(`Invalid EXECUTOR_TIMEOUT: ${this.config.executorTimeout}. Must be >= 0.`);
    }

    // Validate retry configuration
    if (this.config.retryMaxRetries < 0) {
      errors.push(`Invalid RETRY_MAX_RETRIES: ${this.config.retryMaxRetries}. Must be >= 0.`);
    }

    if (this.config.retryInitialDelay < 0) {
      errors.push(`Invalid RETRY_INITIAL_DELAY: ${this.config.retryInitialDelay}. Must be >= 0.`);
    }

    if (this.config.retryMaxDelay < this.config.retryInitialDelay) {
      errors.push(`RETRY_MAX_DELAY must be >= RETRY_INITIAL_DELAY`);
    }

    if (this.config.retryBackoffMultiplier < 1) {
      errors.push(`Invalid RETRY_BACKOFF_MULTIPLIER: ${this.config.retryBackoffMultiplier}. Must be >= 1.`);
    }

    // Validate rate limiting
    if (this.config.apiRateLimitWindow < 1) {
      errors.push(`Invalid API_RATE_LIMIT_WINDOW: ${this.config.apiRateLimitWindow}. Must be >= 1.`);
    }

    if (this.config.apiRateLimitMax < 1) {
      errors.push(`Invalid API_RATE_LIMIT_MAX: ${this.config.apiRateLimitMax}. Must be >= 1.`);
    }

    // Validate environment
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(this.config.nodeEnv)) {
      errors.push(`Invalid NODE_ENV: ${this.config.nodeEnv}. Must be one of: ${validEnvs.join(', ')}`);
    }

    if (errors.length > 0) {
      console.error('Configuration validation errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Configuration validation failed');
    }
  }

  get(): AppConfig {
    return { ...this.config };
  }

  // Convenience getters for common config values
  get API_PORT(): number {
    return this.config.port;
  }

  get API_HOST(): string {
    return this.config.host;
  }

  get ADAPTER_HTTP_TIMEOUT(): number {
    return this.config.adapterHttpTimeout;
  }

  get ADAPTER_N8N_TIMEOUT(): number {
    return this.config.adapterN8nTimeout;
  }

  get ADAPTER_MCP_TIMEOUT(): number {
    return this.config.adapterMcpTimeout;
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

// Export singleton instance
export const Config = new ConfigManager();
