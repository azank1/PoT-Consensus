/**
 * IAdapter.ts
 * 
 * Purpose: Common interface for all protocol adapters
 * Ensures consistent contract across HTTP, n8n, and MCP adapters
 */

export interface AdapterConfig {
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  [key: string]: any;
}

export interface IAdapter {
  /**
   * Execute the adapter with the given configuration
   * @param config Adapter configuration including endpoint, method, data, etc.
   * @returns Promise with the execution result
   */
  invoke(config: AdapterConfig): Promise<any>;

  /**
   * Validate adapter configuration before execution
   * @param config Configuration to validate
   * @throws Error if configuration is invalid
   */
  validate(config: AdapterConfig): void;
}

/**
 * Base adapter class with common functionality
 */
export abstract class BaseAdapter implements IAdapter {
  protected timeout: number;

  constructor(timeout?: number) {
    this.timeout = timeout || 30000; // Default 30s timeout
  }

  abstract invoke(config: AdapterConfig): Promise<any>;

  validate(config: AdapterConfig): void {
    // Get endpoint from either 'endpoint' or 'url' for backward compatibility
    const endpoint = config.endpoint || (config as any).url;
    
    if (!endpoint) {
      throw new Error('Adapter configuration must include an endpoint or url');
    }

    // Validate endpoint is a valid URL or allow relative paths
    if (endpoint.startsWith('http')) {
      try {
        new URL(endpoint);
      } catch (err) {
        throw new Error(`Invalid URL: ${endpoint}`);
      }
    }
  }
}
