/**
 * McpAdapter.ts
 * 
 * Purpose: Model Context Protocol (MCP) adapter
 */

import axios from 'axios';
import { Logger } from '../../core/logs/Logger';
import { AdapterError, ValidationError } from '../../core/errors/CustomErrors';
import { CircuitBreaker } from '../../core/resilience/CircuitBreaker';

export class McpAdapter {
  private requestId = 0;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('MCP', {
      failureThreshold: 3,
      timeout: 10000, // 10 seconds
      monitoringPeriod: 60000
    });
  }

  async invoke(input: any): Promise<any> {
    // Validate required fields
    if (!input || typeof input !== 'object') {
      throw new ValidationError('Input must be an object', 'input');
    }

    const { endpoint, method, params = {} } = input;

    if (!endpoint || typeof endpoint !== 'string') {
      throw new ValidationError('Endpoint is required and must be a string', 'endpoint');
    }

    if (!method || typeof method !== 'string') {
      throw new ValidationError('Method is required and must be a string', 'method');
    }

    // Validate endpoint URL
    try {
      new URL(endpoint);
    } catch {
      throw new ValidationError(`Invalid endpoint URL: ${endpoint}`, 'endpoint');
    }

    Logger.info(`[McpAdapter] Calling MCP method: ${method}`);

    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: ++this.requestId
    };

    try {
      return await this.circuitBreaker.execute(async () => {
        const response = await axios.post(endpoint, jsonRpcRequest, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });

        if (response.data.error) {
          throw new AdapterError(
            `MCP Error: ${response.data.error.message}`,
            'MCP',
            { code: response.data.error.code }
          );
        }

        Logger.info(`[McpAdapter] ✓ MCP call successful`);
        return response.data.result;
      });
    } catch (error: any) {
      Logger.error(`[McpAdapter] ✗ Failed`, {
        message: error.message,
        endpoint,
        method
      });

      // Re-throw errors instead of returning mock data
      if (error instanceof AdapterError || error instanceof ValidationError) {
        throw error;
      }

      throw new AdapterError(
        `MCP adapter failed: ${error.message}`,
        'MCP',
        { endpoint, method, originalError: error.message }
      );
    }
  }
}
