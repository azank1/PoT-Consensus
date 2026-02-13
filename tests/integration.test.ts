/**
 * integration.test.ts
 * 
 * End-to-end integration tests for the PoT-Consensus platform
 */

import { Orchestrator } from '../src/core/orchestrator/Orchestrator';
import { ClaudePlanner } from '../src/core/planner/ClaudePlanner';
import { Executor } from '../src/core/executor/Executor';
import { ContextManager } from '../src/core/context/ContextManager';

describe('End-to-End Integration Tests', () => {
  
  describe('Full Orchestration Flow', () => {
    it('should plan and execute a complete workflow', async () => {
      const orchestrator = new Orchestrator();
      const goal = 'Fetch user data from API and analyze it';

      const result = await orchestrator.run(goal);

      expect(result).toBeDefined();
      // Result should contain outputs from both tasks
      expect(Object.keys(result).length).toBeGreaterThan(0);
    }, 15000); // 15 second timeout for retries

    it('should handle errors gracefully in workflow', async () => {
      const orchestrator = new Orchestrator();
      const goal = 'Process invalid data';

      const result = await orchestrator.run(goal);

      expect(result).toBeDefined();
      // Should complete even with errors (due to continueOnError)
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe('Planning and Execution Integration', () => {
    it('should plan tasks and execute them in order', async () => {
      const planner = new ClaudePlanner();
      const executor = new Executor();

      const tasks = await planner.plan('Fetch data and process it');
      expect(tasks.length).toBeGreaterThan(0);

      const results = await executor.execute(tasks);
      expect(results).toBeDefined();
      expect(Object.keys(results).length).toBe(tasks.length);
    }, 15000); // 15 second timeout for retries

    it('should handle task dependencies', async () => {
      const executor = new Executor();
      const context = executor.getContext();

      // Set up initial data
      context.set('user_id', '123');

      const tasks = [
        {
          id: 'task1',
          agent_id: 'fetch-user',
          protocol: 'http' as const,
          input: {
            endpoint: 'https://api.example.com/users/{{user_id}}',
            method: 'GET'
          }
        },
        {
          id: 'task2',
          agent_id: 'process-data',
          protocol: 'http' as const,
          input: {
            data: '{{task1.result}}'
          },
          dependencies: ['task1']
        }
      ];

      const results = await executor.execute(tasks);
      
      expect(results['fetch-user']).toBeDefined();
      expect(results['process-data']).toBeDefined();
    });
  });

  describe('Context Management Integration', () => {
    it('should share context across tasks', async () => {
      const executor = new Executor();
      const context = executor.getContext();

      // First task sets a value
      context.set('api_key', 'secret-key-123');

      const tasks = [
        {
          id: 'task1',
          agent_id: 'auth',
          protocol: 'http' as const,
          input: {
            apiKey: '{{api_key}}'
          }
        }
      ];

      await executor.execute(tasks);
      
      // Context should still have the value
      expect(context.get('api_key')).toBe('secret-key-123');
    });

    it('should resolve nested template variables', async () => {
      const context = new ContextManager();
      
      context.set('user', {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com'
      });

      const template = {
        userId: '{{user.id}}',
        userName: '{{user.name}}',
        message: 'Hello {{user.name}}!'
      };

      const resolved = context.resolveTemplate(template);
      
      // Template resolution converts to strings
      expect(resolved.userId).toBe('123');
      expect(resolved.userName).toBe('John Doe');
      expect(resolved.message).toBe('Hello John Doe!');
    });
  });

  describe('Error Recovery and Retry', () => {
    it('should retry failed tasks', async () => {
      const executor = new Executor({
        retry: {
          maxRetries: 2,
          initialDelay: 50, // Shorter for faster tests
          maxDelay: 200,
          backoffMultiplier: 2,
          retryableErrors: ['NETWORK_ERROR', 'getaddrinfo', 'ECONNREFUSED']
        }
      });

      const tasks = [
        {
          id: 'task1',
          agent_id: 'failing-task',
          protocol: 'http' as const,
          input: {
            endpoint: 'http://localhost:99999/nonexistent', // Valid URL but unreachable
            method: 'GET'
          }
        }
      ];

      const startTime = Date.now();
      const results = await executor.execute(tasks);
      const duration = Date.now() - startTime;

      // Should have taken time for retries (at least initial delay)
      expect(duration).toBeGreaterThan(40);
      
      // Should have error result
      expect(results['failing-task']).toHaveProperty('error');
    }, 10000); // 10 second timeout

    it('should respect timeout configuration', async () => {
      const executor = new Executor({
        timeout: 100 // Very short timeout
      });

      const tasks = [
        {
          id: 'task1',
          agent_id: 'slow-task',
          protocol: 'http' as const,
          input: {
            endpoint: 'https://httpbin.org/delay/5',
            method: 'GET'
          },
          timeout: 100
        }
      ];

      const startTime = Date.now();
      const results = await executor.execute(tasks);
      const duration = Date.now() - startTime;

      // Should timeout quickly
      expect(duration).toBeLessThan(2000);
      expect(results['slow-task']).toHaveProperty('error');
    }, 5000);
  });

  describe('Multi-Protocol Support', () => {
    it('should handle different protocol types', async () => {
      const executor = new Executor();

      const tasks = [
        {
          id: 'http-task',
          agent_id: 'http-agent',
          protocol: 'http' as const,
          input: { endpoint: 'https://api.example.com', method: 'GET' }
        },
        {
          id: 'n8n-task',
          agent_id: 'n8n-agent',
          protocol: 'n8n' as const,
          input: { endpoint: 'https://n8n.example.com/webhook', data: {} }
        },
        {
          id: 'mcp-task',
          agent_id: 'mcp-agent',
          protocol: 'mcp' as const,
          input: { method: 'test.method', params: {} }
        }
      ];

      const results = await executor.execute(tasks);

      // All tasks should complete (with errors for invalid URLs, but that's expected)
      expect(Object.keys(results).length).toBe(3);
      expect(results['http-agent']).toBeDefined();
      expect(results['n8n-agent']).toBeDefined();
      expect(results['mcp-agent']).toBeDefined();
    });
  });

  describe('Error Propagation', () => {
    it('should stop on critical error when continueOnError is false', async () => {
      const executor = new Executor({
        continueOnError: false,
        retry: { maxRetries: 0, initialDelay: 0, maxDelay: 0, backoffMultiplier: 1 }
      });

      const tasks = [
        {
          id: 'task1',
          agent_id: 'failing-task',
          protocol: 'http' as const,
          input: { endpoint: 'invalid-url', method: 'GET' }
        },
        {
          id: 'task2',
          agent_id: 'never-runs',
          protocol: 'http' as const,
          input: { endpoint: 'https://api.example.com', method: 'GET' }
        }
      ];

      const results = await executor.execute(tasks);

      // First task should have error
      expect(results['failing-task']).toHaveProperty('error');
      
      // Second task should not have run
      expect(results['never-runs']).toBeUndefined();
    });

    it('should continue on error when continueOnError is true', async () => {
      const executor = new Executor({
        continueOnError: true,
        retry: { maxRetries: 0, initialDelay: 0, maxDelay: 0, backoffMultiplier: 1 }
      });

      const tasks = [
        {
          id: 'task1',
          agent_id: 'failing-task',
          protocol: 'http' as const,
          input: { endpoint: 'invalid-url', method: 'GET' }
        },
        {
          id: 'task2',
          agent_id: 'successful-task',
          protocol: 'http' as const,
          input: { endpoint: 'https://api.example.com', method: 'GET' }
        }
      ];

      const results = await executor.execute(tasks);

      // Both tasks should have results (even if first one errored)
      expect(results['failing-task']).toBeDefined();
      expect(results['successful-task']).toBeDefined();
    });
  });
});
