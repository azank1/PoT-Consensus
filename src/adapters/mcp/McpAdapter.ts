/**
 * McpAdapter.ts
 * 
 * Purpose: Model Context Protocol (MCP) adapter
 */

import axios from 'axios';
import { Logger } from '../../core/logs/Logger';
import { BaseAdapter, AdapterConfig } from '../IAdapter';
import { Config } from '../../core/Config';
import { randomUUID } from 'crypto';

export class McpAdapter extends BaseAdapter {
  private useMockMode: boolean;

  constructor(timeout?: number, useMockMode: boolean = false) {
    super(timeout || Config.ADAPTER_MCP_TIMEOUT);
    this.useMockMode = useMockMode;
  }

  async invoke(config: AdapterConfig): Promise<any> {
    this.validate(config);

    // Support both 'endpoint' and 'url' for backward compatibility
    const endpoint = config.endpoint || (config as any).url;
    const { method, data: params = {} } = config;

    if (!endpoint) {
      throw new Error('Adapter configuration must include an endpoint or url');
    }

    if (!method) {
      throw new Error('MCP adapter requires a "method" parameter');
    }

    Logger.info(`[McpAdapter] Calling MCP method: ${method}`);

    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: randomUUID() // Use UUID for thread-safe request tracking
    };

    try {
      const response = await axios.post(endpoint, jsonRpcRequest, {
        headers: { 
          'Content-Type': 'application/json',
          ...config.headers 
        },
        timeout: config.timeout || this.timeout
      });

      if (response.data.error) {
        throw new Error(`MCP Error: ${response.data.error.message}`);
      }

      Logger.info(`[McpAdapter] ✓ MCP call successful`);
      return response.data.result;
    } catch (error: any) {
      if (this.useMockMode) {
        Logger.warn(`[McpAdapter] MCP server unavailable, using mock response`);
        
        // Mock response for demo purposes
        return {
          summary: 'Mock sentiment analysis: Positive sentiment detected',
          sentiment: 'positive',
          confidence: 0.85,
          mock: true
        };
      }
      
      // Re-throw error if not in mock mode
      Logger.error(`[McpAdapter] ✗ MCP call failed`, {
        message: error.message
      });
      throw error;
    }
  }
}
