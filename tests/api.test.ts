/**
 * api.test.ts
 * 
 * Integration tests for the Registry API server
 */

import { RegistryServer } from '../src/registry/api/server';
import axios from 'axios';

describe.skip('Registry API', () => {
  let server: RegistryServer;
  const baseUrl = 'http://localhost:3001';
  const testAgent = {
    id: 'test-agent-1',
    type: 'http' as const,
    name: 'Test Agent',
    description: 'A test agent',
    endpoint: 'https://example.com/api',
    config: { key: 'value' }
  };

  beforeAll(async () => {
    server = new RegistryServer(3001);
    await server.start();
    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    await server.shutdown();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${baseUrl}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('database');
      expect(response.data).toHaveProperty('uptime');
    });
  });

  describe('Agent Registration', () => {
    it('should register a new agent', async () => {
      const response = await axios.post(`${baseUrl}/register`, testAgent);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('agent');
      expect(response.data.agent.id).toBe(testAgent.id);
    });

    it('should reject invalid agent (missing id)', async () => {
      const invalidAgent = { ...testAgent };
      delete (invalidAgent as any).id;
      
      try {
        await axios.post(`${baseUrl}/register`, invalidAgent);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    it('should reject invalid agent (invalid id format)', async () => {
      const invalidAgent = {
        ...testAgent,
        id: 'invalid id with spaces!'
      };
      
      try {
        await axios.post(`${baseUrl}/register`, invalidAgent);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    it('should reject invalid endpoint URL', async () => {
      const invalidAgent = {
        ...testAgent,
        id: 'test-agent-invalid-url',
        endpoint: 'not-a-valid-url'
      };
      
      try {
        await axios.post(`${baseUrl}/register`, invalidAgent);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  describe('Agent Retrieval', () => {
    beforeEach(async () => {
      // Register test agent
      await axios.post(`${baseUrl}/register`, testAgent);
    });

    it('should retrieve registered agent by id', async () => {
      const response = await axios.get(`${baseUrl}/agents/${testAgent.id}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testAgent.id);
      expect(response.data.name).toBe(testAgent.name);
    });

    it('should return 404 for non-existent agent', async () => {
      try {
        await axios.get(`${baseUrl}/agents/non-existent-agent`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    it('should list all agents', async () => {
      const response = await axios.get(`${baseUrl}/agents`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('count');
      expect(response.data).toHaveProperty('agents');
      expect(Array.isArray(response.data.agents)).toBe(true);
      expect(response.data.agents.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${baseUrl}/agents?page=1&limit=10`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('page', 1);
      expect(response.data).toHaveProperty('limit', 10);
      expect(response.data).toHaveProperty('totalPages');
    });
  });

  describe('Agent Deletion', () => {
    beforeEach(async () => {
      // Register test agent
      await axios.post(`${baseUrl}/register`, {
        ...testAgent,
        id: 'test-agent-delete'
      });
    });

    it('should delete existing agent', async () => {
      const response = await axios.delete(`${baseUrl}/agents/test-agent-delete`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    it('should return 404 when deleting non-existent agent', async () => {
      try {
        await axios.delete(`${baseUrl}/agents/non-existent-agent`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include CORS headers', async () => {
      const response = await axios.get(`${baseUrl}/health`);
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should include security headers', async () => {
      const response = await axios.get(`${baseUrl}/health`);
      
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      try {
        await axios.get(`${baseUrl}/unknown-route`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    it('should handle malformed JSON', async () => {
      try {
        await axios.post(`${baseUrl}/register`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});
