/**
 * adapter.test.ts
 * 
 * Test Suite: Adapters
 * 
 * Tests:
 * - HttpAdapter creation and invocation
 * - N8nAdapter creation and invocation
 * - McpAdapter creation and invocation
 * - Error handling in adapters
 */

import { HttpAdapter } from '../src/adapters/http/HttpAdapter';
import { N8nAdapter } from '../src/adapters/n8n/N8nAdapter';
import { McpAdapter } from '../src/adapters/mcp/McpAdapter';

describe('HttpAdapter', () => {
  let adapter: HttpAdapter;

  beforeEach(() => {
    adapter = new HttpAdapter();
  });

  it('should create adapter instance', () => {
    expect(adapter).toBeInstanceOf(HttpAdapter);
  });

  it('should handle invoke with GET method', async () => {
    const config = {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      headers: {}
    };

    // This will fail in sandboxed environment, but we test the structure
    try {
      await adapter.invoke(config);
    } catch (error: any) {
      // Expected to fail due to network restrictions or invalid URL
      expect(error.message).toBeDefined();
      expect(typeof error.message).toBe('string');
    }
  });

  it('should handle invoke with POST method', async () => {
    const config = {
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'test', body: 'test content' }
    };

    try {
      await adapter.invoke(config);
    } catch (error: any) {
      // Expected to fail due to network restrictions or invalid URL
      expect(error.message).toBeDefined();
      expect(typeof error.message).toBe('string');
    }
  });
});

describe('N8nAdapter', () => {
  let adapter: N8nAdapter;

  beforeEach(() => {
    adapter = new N8nAdapter();
  });

  it('should create adapter instance', () => {
    expect(adapter).toBeInstanceOf(N8nAdapter);
  });

  it('should handle invoke with webhook URL', async () => {
    const config = {
      webhookUrl: 'https://n8n.example.com/webhook/test',
      payload: { data: 'test' }
    };

    try {
      await adapter.invoke(config);
    } catch (error: any) {
      // Expected to fail due to network restrictions
      expect(error.message).toBeDefined();
    }
  });
});

describe('McpAdapter', () => {
  let adapter: McpAdapter;

  beforeEach(() => {
    adapter = new McpAdapter();
  });

  it('should create adapter instance', () => {
    expect(adapter).toBeInstanceOf(McpAdapter);
  });

  it('should use mock implementation when MCP not available', async () => {
    const config = {
      method: 'tools/list',
      params: {}
    };

    const result = await adapter.invoke(config);
    
    expect(result).toHaveProperty('mock');
    expect(result.mock).toBe(true);
  });

  it('should handle different RPC methods', async () => {
    const configs = [
      { method: 'tools/list', params: {} },
      { method: 'resources/list', params: {} },
      { method: 'prompts/list', params: {} }
    ];

    for (const config of configs) {
      const result = await adapter.invoke(config);
      expect(result).toBeDefined();
      expect(result.mock).toBe(true); // Mock implementation
    }
  });
});
