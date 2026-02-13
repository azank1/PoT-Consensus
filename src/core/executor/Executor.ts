/**
 * Executor.ts
 * 
 * Purpose: Sequential task execution engine with retry and timeout support
 */

import { Task } from '../planner/ClaudePlanner';
import { ContextManager } from '../context/ContextManager';
import { Logger } from '../logs/Logger';
import { HttpAdapter } from '../../adapters/http/HttpAdapter';
import { N8nAdapter } from '../../adapters/n8n/N8nAdapter';
import { McpAdapter } from '../../adapters/mcp/McpAdapter';
import { RetryConfig, DEFAULT_RETRY_CONFIG, RetryHelper } from './RetryConfig';

export interface ExecutorConfig {
  retry?: RetryConfig;
  timeout?: number; // Default timeout in milliseconds
  continueOnError?: boolean; // Continue executing remaining tasks if one fails
}

const DEFAULT_EXECUTOR_CONFIG: ExecutorConfig = {
  retry: DEFAULT_RETRY_CONFIG,
  timeout: 60000, // 60 seconds default
  continueOnError: true
};

export class Executor {
  private context: ContextManager;
  private adapters: Map<string, any>;
  private config: ExecutorConfig;

  constructor(config: Partial<ExecutorConfig> = {}) {
    this.context = new ContextManager();
    this.adapters = new Map([
      ['http', new HttpAdapter()],
      ['n8n', new N8nAdapter()],
      ['mcp', new McpAdapter()]
    ]);
    this.config = { ...DEFAULT_EXECUTOR_CONFIG, ...config };
  }

  /**
   * Execute a task with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    taskName: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Task ${taskName} timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Execute a single task with retry and timeout
   */
  private async executeTask(task: Task): Promise<any> {
    // Check dependencies
    if (task.dependencies) {
      const missingDeps = task.dependencies.filter(dep => !this.context.has(dep));
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
    }

    // Store task info in context
    this.context.set('current_task', task.id);
    
    // Resolve template variables in input
    const resolvedInput = this.context.resolveTemplate(task.input);

    Logger.info(`[Executor] Executing ${task.agent_id}`);

    // Get adapter
    const adapter = this.adapters.get(task.protocol);
    if (!adapter) {
      throw new Error(`Unknown protocol: ${task.protocol}`);
    }

    // Execute task with retry and timeout
    const taskTimeout = task.timeout || this.config.timeout || 60000;
    const retryConfig = this.config.retry || DEFAULT_RETRY_CONFIG;

    const result = await RetryHelper.executeWithRetry(
      () => this.executeWithTimeout(
        adapter.invoke(resolvedInput),
        taskTimeout,
        task.agent_id
      ),
      retryConfig,
      task.agent_id,
      (attempt, error) => {
        Logger.warn(
          `[Executor] Retry attempt ${attempt}/${retryConfig.maxRetries} for ${task.agent_id}`,
          { error: error.message }
        );
      }
    );

    return result;
  }

  async execute(tasks: Task[]): Promise<any> {
    Logger.info(`[Executor] Starting execution of ${tasks.length} tasks`);
    
    const results: Record<string, any> = {};
    let hasError = false;

    for (const task of tasks) {
      try {
        const result = await this.executeTask(task);

        // Store result
        results[task.agent_id] = result;
        this.context.set(task.id, result);
        this.context.set(`${task.id}.result`, result);

        Logger.info(`[Executor] ✓ ${task.agent_id} completed`);
      } catch (error: any) {
        hasError = true;
        Logger.error(`[Executor] ✗ ${task.agent_id} failed after all retries`, { error: error.message });
        
        const errorResult: any = { 
          error: error.message,
          timestamp: new Date().toISOString()
        };

        // Only include stack trace in development
        if (process.env.NODE_ENV === 'development') {
          errorResult.stack = error.stack;
        }

        results[task.agent_id] = errorResult;

        // Stop execution if continueOnError is false
        if (!this.config.continueOnError) {
          Logger.error('[Executor] Stopping execution due to task failure');
          break;
        }
      }
    }

    if (hasError) {
      Logger.warn('[Executor] Execution completed with errors');
    } else {
      Logger.info('[Executor] Execution completed successfully');
    }

    return results;
  }

  getContext(): ContextManager {
    return this.context;
  }
}
