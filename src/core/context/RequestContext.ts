/**
 * RequestContext.ts
 * 
 * Purpose: Provide correlation/session ID tracking across all components
 * Enables request tracing through the system for debugging and monitoring
 */

import { randomUUID } from 'crypto';

export interface RequestMetadata {
  sessionId: string;
  timestamp: number;
  userId?: string;
  source?: string;
}

export class RequestContext {
  private static current?: RequestContext;

  private metadata: RequestMetadata;

  private constructor(metadata?: Partial<RequestMetadata>) {
    this.metadata = {
      sessionId: metadata?.sessionId || randomUUID(),
      timestamp: metadata?.timestamp || Date.now(),
      userId: metadata?.userId,
      source: metadata?.source,
    };
  }

  /**
   * Create a new request context
   */
  static create(metadata?: Partial<RequestMetadata>): RequestContext {
    const context = new RequestContext(metadata);
    RequestContext.current = context;
    return context;
  }

  /**
   * Get the current request context or create a new one
   */
  static getCurrent(): RequestContext {
    if (!RequestContext.current) {
      RequestContext.current = RequestContext.create();
    }
    return RequestContext.current;
  }

  /**
   * Clear the current context
   */
  static clear(): void {
    RequestContext.current = undefined;
  }

  /**
   * Get the session ID
   */
  getSessionId(): string {
    return this.metadata.sessionId;
  }

  /**
   * Get the timestamp
   */
  getTimestamp(): number {
    return this.metadata.timestamp;
  }

  /**
   * Get the user ID if available
   */
  getUserId(): string | undefined {
    return this.metadata.userId;
  }

  /**
   * Get the source if available
   */
  getSource(): string | undefined {
    return this.metadata.source;
  }

  /**
   * Get all metadata
   */
  getMetadata(): RequestMetadata {
    return { ...this.metadata };
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.metadata.userId = userId;
  }

  /**
   * Set source
   */
  setSource(source: string): void {
    this.metadata.source = source;
  }

  /**
   * Get a formatted prefix for logging
   */
  getLogPrefix(): string {
    return `[${this.metadata.sessionId.substring(0, 8)}]`;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): RequestMetadata {
    return this.getMetadata();
  }
}
