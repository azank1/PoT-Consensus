/**
 * N8nAdapter.ts
 * 
 * Purpose: n8n workflow automation adapter
 */

import axios from 'axios';
import { Logger } from '../../core/logs/Logger';
import { AdapterError, ValidationError } from '../../core/errors/CustomErrors';
import { CircuitBreaker } from '../../core/resilience/CircuitBreaker';

export class N8nAdapter {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('N8N', {
      failureThreshold: 5,
      timeout: 10000, // 10 seconds
      monitoringPeriod: 60000
    });
  }

  async invoke(input: any): Promise<any> {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new ValidationError('Input must be an object', 'input');
    }

    const { endpoint, payload = {}, authToken } = input;

    if (!endpoint || typeof endpoint !== 'string') {
      throw new ValidationError('endpoint is required and must be a string', 'endpoint');
    }

    // Validate endpoint URL
    try {
      const url = new URL(endpoint);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new ValidationError(
          `Invalid protocol: ${url.protocol}. Only http: and https: are allowed`,
          'endpoint'
        );
      }
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Invalid endpoint URL: ${endpoint}`, 'endpoint');
    }

    Logger.info(`[N8nAdapter] Triggering workflow: ${endpoint}`);

    try {
      return await this.circuitBreaker.execute(async () => {
        const headers: any = { 'Content-Type': 'application/json' };
        
        // Only add authorization header if token is provided and not empty
        if (authToken && typeof authToken === 'string' && authToken.trim()) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await axios.post(endpoint, payload, {
          headers,
          timeout: 30000
        });

        Logger.info(`[N8nAdapter] ✓ Workflow completed`);
        return response.data;
      });
    } catch (error: any) {
      Logger.error(`[N8nAdapter] ✗ Workflow failed`, {
        message: error.message,
        status: error.response?.status
      });

      if (error instanceof AdapterError || error instanceof ValidationError) {
        throw error;
      }

      throw new AdapterError(
        `N8n adapter failed: ${error.message}`,
        'N8N',
        {
          endpoint,
          status: error.response?.status,
          originalError: error.message
        }
      );
    }
  }
}
