/**
 * CircuitBreaker.ts
 * 
 * Purpose: Circuit breaker pattern implementation for external service calls
 * Prevents cascading failures by temporarily blocking calls to failing services
 */

import { CircuitBreakerError } from '../errors/CustomErrors';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Blocking calls due to failures
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening (default: 5)
  successThreshold: number;      // Number of successes to close from half-open (default: 2)
  timeout: number;               // Time in ms before attempting to recover (default: 60000)
  monitoringPeriod: number;      // Time window for counting failures in ms (default: 10000)
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
  recentFailures: number[];      // Timestamps of recent failures
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitoringPeriod: 10000
};

/**
 * Circuit breaker for protecting against cascading failures
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: CircuitState.CLOSED,
    failures: 0,
    successes: 0,
    lastFailureTime: null,
    nextAttemptTime: null,
    recentFailures: []
  };

  private config: CircuitBreakerConfig;

  constructor(
    private readonly serviceName: string,
    config?: Partial<CircuitBreakerConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state.state = CircuitState.HALF_OPEN;
        this.state.successes = 0;
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN for service: ${this.serviceName}`,
          this.serviceName,
          {
            state: this.state.state,
            failures: this.state.failures,
            nextAttemptTime: this.state.nextAttemptTime
          }
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (this.state.nextAttemptTime === null) {
      return false;
    }
    return Date.now() >= this.state.nextAttemptTime;
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.state.failures = 0;

    if (this.state.state === CircuitState.HALF_OPEN) {
      this.state.successes++;
      if (this.state.successes >= this.config.successThreshold) {
        this.reset();
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = Date.now();
    this.state.lastFailureTime = now;
    this.state.recentFailures.push(now);

    // Clean up old failures outside monitoring period
    this.state.recentFailures = this.state.recentFailures.filter(
      time => now - time < this.config.monitoringPeriod
    );

    // Count failures in monitoring period
    const recentFailureCount = this.state.recentFailures.length;

    if (this.state.state === CircuitState.HALF_OPEN) {
      // Immediately open if failure in half-open state
      this.trip();
    } else if (recentFailureCount >= this.config.failureThreshold) {
      this.trip();
    }

    this.state.failures = recentFailureCount;
  }

  /**
   * Trip the circuit breaker to OPEN state
   */
  private trip(): void {
    this.state.state = CircuitState.OPEN;
    this.state.nextAttemptTime = Date.now() + this.config.timeout;
    this.state.successes = 0;
  }

  /**
   * Reset the circuit breaker to CLOSED state
   */
  private reset(): void {
    this.state.state = CircuitState.CLOSED;
    this.state.failures = 0;
    this.state.successes = 0;
    this.state.lastFailureTime = null;
    this.state.nextAttemptTime = null;
    this.state.recentFailures = [];
  }

  /**
   * Get current state information
   */
  getState(): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number | null;
  } {
    return {
      state: this.state.state,
      failures: this.state.failures,
      successes: this.state.successes,
      lastFailureTime: this.state.lastFailureTime
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  manualReset(): void {
    this.reset();
  }
}
