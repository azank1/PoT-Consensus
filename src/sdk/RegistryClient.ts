/**
 * RegistryClient.ts
 * 
 * Purpose: Shared HTTP client for interacting with Registry API
 * Centralizes error handling, timeout configuration, and request logic
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../core/Config';

export interface RegistryClientConfig {
  baseURL?: string;
  timeout?: number;
}

export class RegistryClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(config?: RegistryClientConfig) {
    this.baseURL = config?.baseURL || `http://${Config.API_HOST}:${Config.API_PORT}`;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config?.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Handle registry connection errors with user-friendly messages
   */
  private handleError(error: any, operation: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to Registry API at ${this.baseURL}\n` +
          `Make sure the registry server is running: npm run registry`
        );
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        throw new Error(
          `Registry API error (${status}): ${data.error || axiosError.message}`
        );
      }

      if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
        throw new Error(`Registry API request timed out for ${operation}`);
      }
    }

    throw new Error(`Registry API error: ${error.message || error}`);
  }

  /**
   * Check if the registry is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Register a new agent
   */
  async register(agent: any): Promise<any> {
    try {
      const response = await this.client.post('/agents', agent);
      return response.data;
    } catch (error) {
      this.handleError(error, 'register');
    }
  }

  /**
   * List all agents with optional pagination
   */
  async list(page?: number, limit?: number): Promise<any> {
    try {
      const params: any = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;
      
      const response = await this.client.get('/agents', { params });
      return response.data;
    } catch (error) {
      this.handleError(error, 'list');
    }
  }

  /**
   * Get agent by ID
   */
  async get(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/agents/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'get');
    }
  }

  /**
   * Update an existing agent
   */
  async update(id: string, agent: any): Promise<any> {
    try {
      const response = await this.client.put(`/agents/${id}`, agent);
      return response.data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete an agent
   */
  async delete(id: string): Promise<any> {
    try {
      const response = await this.client.delete(`/agents/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  /**
   * Get registry health status
   */
  async getHealth(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      this.handleError(error, 'health check');
    }
  }
}
