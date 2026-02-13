/**
 * AdapterRegistry.ts
 * 
 * Purpose: Centralized registry for managing protocol adapters
 * Extracted from Executor to follow Single Responsibility Principle
 */

import { IAdapter } from './IAdapter';
import { HttpAdapter } from './http/HttpAdapter';
import { N8nAdapter } from './n8n/N8nAdapter';
import { McpAdapter } from './mcp/McpAdapter';
import { Logger } from '../core/logs/Logger';

export class AdapterRegistry {
  private adapters: Map<string, IAdapter>;

  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }

  /**
   * Register default protocol adapters
   */
  private registerDefaultAdapters(): void {
    this.register('http', new HttpAdapter());
    this.register('n8n', new N8nAdapter());
    this.register('mcp', new McpAdapter());
    Logger.info('[AdapterRegistry] Registered default adapters: http, n8n, mcp');
  }

  /**
   * Register a new adapter for a protocol
   * @param protocol Protocol name (e.g., 'http', 'n8n', 'mcp')
   * @param adapter Adapter instance implementing IAdapter
   */
  register(protocol: string, adapter: IAdapter): void {
    this.adapters.set(protocol.toLowerCase(), adapter);
    Logger.debug(`[AdapterRegistry] Registered adapter for protocol: ${protocol}`);
  }

  /**
   * Get adapter for a specific protocol
   * @param protocol Protocol name
   * @returns Adapter instance or undefined if not found
   */
  get(protocol: string): IAdapter | undefined {
    return this.adapters.get(protocol.toLowerCase());
  }

  /**
   * Check if an adapter is registered for a protocol
   * @param protocol Protocol name
   * @returns true if adapter exists, false otherwise
   */
  has(protocol: string): boolean {
    return this.adapters.has(protocol.toLowerCase());
  }

  /**
   * Get all registered protocol names
   * @returns Array of protocol names
   */
  getProtocols(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Unregister an adapter
   * @param protocol Protocol name to unregister
   * @returns true if adapter was removed, false if it didn't exist
   */
  unregister(protocol: string): boolean {
    const result = this.adapters.delete(protocol.toLowerCase());
    if (result) {
      Logger.debug(`[AdapterRegistry] Unregistered adapter for protocol: ${protocol}`);
    }
    return result;
  }

  /**
   * Clear all registered adapters
   */
  clear(): void {
    this.adapters.clear();
    Logger.debug('[AdapterRegistry] Cleared all adapters');
  }
}
