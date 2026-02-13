/**
 * RetryConfig.ts
 * 
 * Purpose: Retry configuration and utilities for task execution
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 30000,         // 30 seconds
  backoffMultiplier: 2,    // Exponential backoff
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'NETWORK_ERROR',
    'TIMEOUT',
    '429',  // Too Many Requests
    '500',  // Internal Server Error
    '502',  // Bad Gateway
    '503',  // Service Unavailable
    '504'   // Gateway Timeout
  ]
};

export class RetryHelper {
  /**
   * Check if an error is retryable
   */
  static isRetryable(error: any, config: RetryConfig): boolean {
    if (!config.retryableErrors || config.retryableErrors.length === 0) {
      return true; // Retry all errors if no specific list
    }

    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || '';
    const statusCode = error?.response?.status || error?.statusCode || '';

    return config.retryableErrors.some(retryable => 
      errorMessage.includes(retryable) || 
      errorCode === retryable ||
      String(statusCode) === retryable
    );
  }

  /**
   * Calculate delay for next retry with exponential backoff
   */
  static calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a function with retry logic
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig,
    taskName: string,
    onRetry?: (attempt: number, error: any) => void
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry if we've exhausted attempts
        if (attempt > config.maxRetries) {
          throw error;
        }

        // Check if error is retryable
        if (!this.isRetryable(error, config)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt, config);
        
        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError;
  }
}
