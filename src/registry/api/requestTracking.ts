/**
 * requestTracking.ts
 * 
 * Purpose: Request tracking middleware for structured logging
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../core/logs/Logger';
import * as crypto from 'crypto';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Middleware to add request tracking
 */
export function requestTracking(req: Request, res: Response, next: NextFunction): void {
  // Generate or use existing request ID
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
  
  // Attach to request for use in handlers
  (req as any).requestId = requestId;
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  const startTime = Date.now();
  Logger.info(`[Request] ${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 
                     'info';
    
    Logger[logLevel](`[Response] ${req.method} ${req.path}`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
}

/**
 * Get request ID from request object
 */
export function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}
