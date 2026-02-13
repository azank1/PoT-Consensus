/**
 * CustomErrors.ts
 * 
 * Purpose: Custom error classes for better error handling and type safety
 */

/**
 * Base error class for all PoT-Consensus errors
 */
export class PotError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when adapter operations fail
 */
export class AdapterError extends PotError {
  constructor(
    message: string,
    public readonly adapterType: string,
    details?: any
  ) {
    super(message, 'ADAPTER_ERROR', 502, details);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends PotError {
  constructor(
    message: string,
    public readonly field?: string,
    details?: any
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends PotError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}

/**
 * Error thrown when database operations fail
 */
export class DatabaseError extends PotError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Error thrown when task execution times out
 */
export class TimeoutError extends PotError {
  constructor(
    message: string,
    public readonly taskId?: string,
    details?: any
  ) {
    super(message, 'TIMEOUT_ERROR', 408, details);
  }
}

/**
 * Error thrown when external service is unavailable
 */
export class ServiceUnavailableError extends PotError {
  constructor(
    message: string,
    public readonly service: string,
    details?: any
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends PotError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

/**
 * Error thrown when authorization fails
 */
export class AuthorizationError extends PotError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

/**
 * Error thrown when resource is not found
 */
export class NotFoundError extends PotError {
  constructor(
    message: string,
    public readonly resource?: string,
    details?: any
  ) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitBreakerError extends PotError {
  constructor(
    message: string,
    public readonly service: string,
    details?: any
  ) {
    super(message, 'CIRCUIT_BREAKER_OPEN', 503, details);
  }
}
