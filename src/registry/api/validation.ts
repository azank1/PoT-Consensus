/**
 * validation.ts
 * 
 * Purpose: Request validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AgentManifest } from '../db/sqlite';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate agent manifest structure
 */
export function validateAgentManifest(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationError[] = [];
  const manifest = req.body as Partial<AgentManifest>;

  // Required fields
  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push({ field: 'id', message: 'Agent ID is required and must be a string' });
  } else if (manifest.id.length < 3 || manifest.id.length > 100) {
    errors.push({ field: 'id', message: 'Agent ID must be between 3 and 100 characters' });
  } else if (!/^[a-zA-Z0-9_-]+$/.test(manifest.id)) {
    errors.push({ field: 'id', message: 'Agent ID must contain only alphanumeric characters, hyphens, and underscores' });
  }

  if (!manifest.type || typeof manifest.type !== 'string') {
    errors.push({ field: 'type', message: 'Agent type is required and must be a string' });
  }

  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push({ field: 'name', message: 'Agent name is required and must be a string' });
  } else if (manifest.name.length < 1 || manifest.name.length > 200) {
    errors.push({ field: 'name', message: 'Agent name must be between 1 and 200 characters' });
  }

  // Optional but validated if present
  if (manifest.description && typeof manifest.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  } else if (manifest.description && manifest.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be less than 1000 characters' });
  }

  if (manifest.protocol) {
    const validProtocols = ['http', 'n8n', 'mcp'];
    if (!validProtocols.includes(manifest.protocol)) {
      errors.push({ field: 'protocol', message: `Protocol must be one of: ${validProtocols.join(', ')}` });
    }
  }

  if (manifest.endpoint && typeof manifest.endpoint !== 'string') {
    errors.push({ field: 'endpoint', message: 'Endpoint must be a string' });
  } else if (manifest.endpoint) {
    try {
      new URL(manifest.endpoint);
    } catch {
      errors.push({ field: 'endpoint', message: 'Endpoint must be a valid URL' });
    }
  }

  if (manifest.capabilities && !Array.isArray(manifest.capabilities)) {
    errors.push({ field: 'capabilities', message: 'Capabilities must be an array' });
  }

  if (manifest.tags && !Array.isArray(manifest.tags)) {
    errors.push({ field: 'tags', message: 'Tags must be an array' });
  }

  if (manifest.config && typeof manifest.config !== 'object') {
    errors.push({ field: 'config', message: 'Config must be an object' });
  }

  // Return errors if any
  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      errors
    });
    return;
  }

  next();
}

/**
 * Validate agent ID parameter
 */
export function validateAgentId(req: Request, res: Response, next: NextFunction): void {
  const agentId = req.params.id;

  if (!agentId || typeof agentId !== 'string') {
    res.status(400).json({
      error: 'Invalid agent ID'
    });
    return;
  }

  if (agentId.length < 3 || agentId.length > 100) {
    res.status(400).json({
      error: 'Agent ID must be between 3 and 100 characters'
    });
    return;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(agentId)) {
    res.status(400).json({
      error: 'Agent ID must contain only alphanumeric characters, hyphens, and underscores'
    });
    return;
  }

  next();
}
