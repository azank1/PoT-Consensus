/**
 * customErrors.test.ts
 * 
 * Tests for Custom Error classes
 */

import {
  PotError,
  AdapterError,
  ValidationError,
  ConfigurationError,
  DatabaseError,
  TimeoutError,
  ServiceUnavailableError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  CircuitBreakerError
} from '../src/core/errors/CustomErrors';

describe('Custom Error Classes', () => {
  describe('PotError', () => {
    it('should create a base PotError', () => {
      const error = new PotError('Test error', 'TEST_ERROR', 500, { detail: 'test' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PotError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('PotError');
    });
  });

  describe('AdapterError', () => {
    it('should create an AdapterError', () => {
      const error = new AdapterError('HTTP request failed', 'HTTP', { endpoint: 'test' });
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(AdapterError);
      expect(error.message).toBe('HTTP request failed');
      expect(error.code).toBe('ADAPTER_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.adapterType).toBe('HTTP');
      expect(error.details).toEqual({ endpoint: 'test' });
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError', () => {
      const error = new ValidationError('Invalid input', 'email', { value: 'test' });
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe('email');
    });
  });

  describe('ConfigurationError', () => {
    it('should create a ConfigurationError', () => {
      const error = new ConfigurationError('Invalid configuration');
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('DatabaseError', () => {
    it('should create a DatabaseError', () => {
      const error = new DatabaseError('Connection failed');
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('TimeoutError', () => {
    it('should create a TimeoutError', () => {
      const error = new TimeoutError('Task timed out', 'task-123');
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.statusCode).toBe(408);
      expect(error.taskId).toBe('task-123');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create a ServiceUnavailableError', () => {
      const error = new ServiceUnavailableError('Service down', 'API');
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(ServiceUnavailableError);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.service).toBe('API');
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('should create an AuthorizationError', () => {
      const error = new AuthorizationError('Insufficient permissions');
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError', () => {
      const error = new NotFoundError('Resource not found', 'User');
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe('User');
    });
  });

  describe('CircuitBreakerError', () => {
    it('should create a CircuitBreakerError', () => {
      const error = new CircuitBreakerError('Circuit open', 'PaymentService');
      
      expect(error).toBeInstanceOf(PotError);
      expect(error).toBeInstanceOf(CircuitBreakerError);
      expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
      expect(error.statusCode).toBe(503);
      expect(error.service).toBe('PaymentService');
    });
  });

  describe('Error stack traces', () => {
    it('should capture stack traces', () => {
      const error = new ValidationError('Test');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });
  });

  describe('Error inheritance', () => {
    it('should maintain instanceof checks', () => {
      const error = new AdapterError('Test', 'HTTP');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof PotError).toBe(true);
      expect(error instanceof AdapterError).toBe(true);
      expect(error instanceof ValidationError).toBe(false);
    });
  });
});
