/**
 * N8nAdapter.ts
 * 
 * Purpose: n8n workflow automation adapter
 */

import axios from 'axios';
import { Logger } from '../../core/logs/Logger';
import { BaseAdapter, AdapterConfig } from '../IAdapter';
import { Config } from '../../core/Config';

export class N8nAdapter extends BaseAdapter {
  constructor(timeout?: number) {
    super(timeout || Config.ADAPTER_N8N_TIMEOUT);
  }

  async invoke(config: AdapterConfig): Promise<any> {
    this.validate(config);

    // Support both 'endpoint' and 'url' for backward compatibility
    const endpoint = config.endpoint || (config as any).url;
    const { data = {}, headers: customHeaders = {} } = config;

    Logger.info(`[N8nAdapter] Triggering workflow: ${endpoint}`);

    try {
      const headers: any = { 
        'Content-Type': 'application/json',
        ...customHeaders 
      };

      const response = await axios.post(endpoint, data, {
        headers,
        timeout: config.timeout || this.timeout
      });

      Logger.info(`[N8nAdapter] ✓ Workflow completed`);
      return response.data;
    } catch (error: any) {
      Logger.error(`[N8nAdapter] ✗ Workflow failed`, {
        message: error.message
      });
      throw error;
    }
  }
}
