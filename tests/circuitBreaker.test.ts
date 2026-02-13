/**
 * circuitBreaker.test.ts
 * 
 * Tests for Circuit Breaker implementation
 */

import { CircuitBreaker, CircuitState } from '../src/core/resilience/CircuitBreaker';

describe('CircuitBreaker', () => {
  it('should start in CLOSED state', () => {
    const cb = new CircuitBreaker('test-service');
    const state = cb.getState();
    
    expect(state.state).toBe(CircuitState.CLOSED);
    expect(state.failures).toBe(0);
  });

  it('should execute function successfully in CLOSED state', async () => {
    const cb = new CircuitBreaker('test-service');
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await cb.execute(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should trip to OPEN after failure threshold', async () => {
    const cb = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      timeout: 1000,
      monitoringPeriod: 10000
    });
    
    const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
    
    // Fail 3 times to reach threshold
    for (let i = 0; i < 3; i++) {
      try {
        await cb.execute(mockFn);
      } catch (error) {
        // Expected to fail
      }
    }
    
    const state = cb.getState();
    expect(state.state).toBe(CircuitState.OPEN);
    expect(state.failures).toBe(3);
  });

  it('should reject requests when OPEN', async () => {
    const cb = new CircuitBreaker('test-service', {
      failureThreshold: 2,
      timeout: 1000,
      monitoringPeriod: 10000
    });
    
    const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
    
    // Trip the circuit
    for (let i = 0; i < 2; i++) {
      try {
        await cb.execute(mockFn);
      } catch (error) {
        // Expected
      }
    }
    
    // Now circuit should be OPEN and reject immediately
    await expect(cb.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    const cb = new CircuitBreaker('test-service', {
      failureThreshold: 2,
      timeout: 100, // Short timeout for test
      monitoringPeriod: 10000
    });
    
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');
    
    // Trip the circuit
    for (let i = 0; i < 2; i++) {
      try {
        await cb.execute(mockFn);
      } catch (error) {
        // Expected
      }
    }
    
    expect(cb.getState().state).toBe(CircuitState.OPEN);
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Next call should attempt reset (HALF_OPEN)
    const result = await cb.execute(mockFn);
    expect(result).toBe('success');
  });

  it('should reset to CLOSED after success threshold in HALF_OPEN', async () => {
    const cb = new CircuitBreaker('test-service', {
      failureThreshold: 2,
      successThreshold: 2,
      timeout: 100,
      monitoringPeriod: 10000
    });
    
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');
    
    // Trip the circuit
    for (let i = 0; i < 2; i++) {
      try {
        await cb.execute(mockFn);
      } catch (error) {
        // Expected
      }
    }
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Execute successfully twice to reset
    await cb.execute(mockFn);
    await cb.execute(mockFn);
    
    expect(cb.getState().state).toBe(CircuitState.CLOSED);
    expect(cb.getState().failures).toBe(0);
  });

  it('should manually reset circuit breaker', () => {
    const cb = new CircuitBreaker('test-service');
    
    // Manually reset
    cb.manualReset();
    
    const state = cb.getState();
    expect(state.state).toBe(CircuitState.CLOSED);
    expect(state.failures).toBe(0);
  });

  it('should only count failures in monitoring period', async () => {
    const cb = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      timeout: 1000,
      monitoringPeriod: 200 // 200ms monitoring period
    });
    
    const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
    
    // First failure
    try {
      await cb.execute(mockFn);
    } catch (error) {
      // Expected
    }
    
    // Wait for monitoring period to expire
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // These failures should start a new monitoring window
    for (let i = 0; i < 2; i++) {
      try {
        await cb.execute(mockFn);
      } catch (error) {
        // Expected
      }
    }
    
    // Should not be OPEN yet (only 2 failures in current window)
    expect(cb.getState().state).toBe(CircuitState.CLOSED);
  });
});
