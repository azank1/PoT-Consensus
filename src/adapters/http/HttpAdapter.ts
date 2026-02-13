/**
 * HttpAdapter.ts
 * 
 * Purpose: REST API / HTTP adapter
 */

import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from '../../core/logs/Logger';
import { BaseAdapter, AdapterConfig } from '../IAdapter';
import { Config } from '../../core/Config';

export class HttpAdapter extends BaseAdapter {
  constructor(timeout?: number) {
    super(timeout || Config.ADAPTER_HTTP_TIMEOUT);
  }

  async invoke(config: AdapterConfig): Promise<any> {
    this.validate(config);

    // Support both 'endpoint' and 'url' for backward compatibility
    const endpoint = config.endpoint || (config as any).url;
    const { method = 'GET', headers = {}, data, params } = config;

    Logger.info(`[HttpAdapter] ${method} ${endpoint}`);

    try {
      const axiosConfig: AxiosRequestConfig = {
        method,
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        ...(params && { params }),
        ...(data && { data }),
        timeout: config.timeout || this.timeout
      };

      const response = await axios(axiosConfig);
      Logger.info(`[HttpAdapter] ✓ Success`, { status: response.status });
      
      return response.data;
    } catch (error: any) {
      Logger.error(`[HttpAdapter] ✗ Failed`, {
        message: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }
}
