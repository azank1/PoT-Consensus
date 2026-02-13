/**
 * HttpAdapter.ts
 * 
 * Purpose: REST API / HTTP adapter
 */

import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from '../../core/logs/Logger';
import { AdapterError, ValidationError } from '../../core/errors/CustomErrors';
import { CircuitBreaker } from '../../core/resilience/CircuitBreaker';

export class HttpAdapter {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('HTTP', {
      failureThreshold: 5,
      timeout: 10000, // 10 seconds - matches axios timeout
      monitoringPeriod: 60000
    });
  }

  async invoke(input: any): Promise<any> {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new ValidationError('Input must be an object', 'input');
    }

    const { endpoint, method = 'GET', headers = {}, body, params } = input;

    if (!endpoint || typeof endpoint !== 'string') {
      throw new ValidationError('Endpoint is required and must be a string', 'endpoint');
    }

    // Validate endpoint URL
    try {
      const url = new URL(endpoint);
      // Validate protocol
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

    Logger.info(`[HttpAdapter] ${method} ${endpoint}`);

    try {
      return await this.circuitBreaker.execute(async () => {
        const config: AxiosRequestConfig = {
          method,
          url: endpoint,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          ...(params && { params }),
          ...(body && { data: body }),
          timeout: 10000
        };

        const response = await axios(config);
        Logger.info(`[HttpAdapter] ✓ Success`, { status: response.status });
        
        return response.data;
      });
    } catch (error: any) {
      Logger.error(`[HttpAdapter] ✗ Failed`, {
        message: error.message,
        status: error.response?.status
      });

      if (error instanceof AdapterError || error instanceof ValidationError) {
        throw error;
      }

      throw new AdapterError(
        `HTTP adapter failed: ${error.message}`,
        'HTTP',
        {
          endpoint,
          method,
          status: error.response?.status,
          originalError: error.message
        }
      );
    }
  }
}
