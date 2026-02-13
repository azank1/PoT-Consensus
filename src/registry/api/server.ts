/**
 * server.ts (Registry API)
 * 
 * Purpose: Express REST API for agent registration
 * 
 * Endpoints:
 * - POST   /register          - Register new agent
 * - GET    /agents            - List all registered agents
 * - GET    /agents/:id        - Get specific agent by ID
 * - DELETE /agents/:id        - Delete agent
 * - GET    /health            - Health check
 * 
 * Port: 9090 (configurable via env)
 * 
 * Dependencies:
 * - Express for REST API
 * - DatabaseManager for storage
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { DatabaseManager, AgentManifest } from '../db/sqlite';
import { Logger } from '../../core/logs/Logger';
import { Config } from '../../core/Config';
import { validateAgentManifest, validateAgentId } from './validation';
import { requestTracking } from './requestTracking';

export class RegistryServer {
  private app: express.Application;
  private db: DatabaseManager;
  private port: number;
  private server?: any;

  constructor(port?: number) {
    const config = Config.get();
    this.app = express();
    this.db = new DatabaseManager();
    this.port = port || config.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    const config = Config.get();

    // CORS
    if (config.apiEnableCors) {
      this.app.use(cors({
        origin: config.apiCorsOrigin === '*' ? '*' : config.apiCorsOrigin.split(','),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }));
    }

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request tracking and logging
    this.app.use(requestTracking);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.apiRateLimitWindow * 60 * 1000,
      max: config.apiRateLimitMax,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: config.apiRateLimitWindow
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        Logger.warn('[RegistryAPI] Rate limit exceeded');
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: config.apiRateLimitWindow
        });
      }
    });
    this.app.use(limiter);

    // Security headers
    this.app.use((_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check with detailed status
    this.app.get('/health', (_req: Request, res: Response) => {
      const agentCount = this.db.getAgentCount();
      const config = Config.get();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv,
        database: {
          connected: true,
          agentCount
        },
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        }
      });
    });

    // Register agent with validation
    this.app.post('/register', validateAgentManifest, (req: Request, res: Response) => {
      try {
        const manifest: AgentManifest = req.body;
        
        this.db.registerAgent(manifest.id, manifest);
        
        Logger.info(`[RegistryAPI] Agent registered: ${manifest.id}`);
        
        res.status(201).json({
          success: true,
          message: `Agent ${manifest.id} registered successfully`,
          agent: manifest
        });
      } catch (error: any) {
        Logger.error('[RegistryAPI] Registration failed', { error: error.message });
        res.status(500).json({ 
          error: 'Internal server error',
          message: Config.isDevelopment() ? error.message : 'Registration failed'
        });
      }
    });

    // List all agents with pagination
    this.app.get('/agents', (req: Request, res: Response) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
        const offset = (page - 1) * limit;

        const allAgents = this.db.getAllAgents();
        const paginatedAgents = allAgents.slice(offset, offset + limit);
        
        res.json({
          count: allAgents.length,
          page,
          limit,
          totalPages: Math.ceil(allAgents.length / limit),
          agents: paginatedAgents
        });
      } catch (error: any) {
        Logger.error('[RegistryAPI] Failed to list agents', { error: error.message });
        res.status(500).json({ 
          error: 'Internal server error',
          message: Config.isDevelopment() ? error.message : 'Failed to retrieve agents'
        });
      }
    });

    // Get specific agent with validation
    this.app.get('/agents/:id', validateAgentId, (req: Request, res: Response) => {
      try {
        const agentId = req.params.id as string;
        const agent = this.db.getAgent(agentId);
        
        if (!agent) {
          return res.status(404).json({ 
            error: 'Not found',
            message: `Agent with ID '${agentId}' not found` 
          });
        }
        
        res.json(agent);
      } catch (error: any) {
        Logger.error('[RegistryAPI] Failed to get agent', { error: error.message });
        res.status(500).json({ 
          error: 'Internal server error',
          message: Config.isDevelopment() ? error.message : 'Failed to retrieve agent'
        });
      }
    });

    // Delete agent with validation
    this.app.delete('/agents/:id', validateAgentId, (req: Request, res: Response) => {
      try {
        const agentId = req.params.id as string;
        const deleted = this.db.deleteAgent(agentId);
        
        if (!deleted) {
          return res.status(404).json({ 
            error: 'Not found',
            message: `Agent with ID '${agentId}' not found` 
          });
        }
        
        Logger.info(`[RegistryAPI] Agent deleted: ${agentId}`);
        
        res.json({
          success: true,
          message: `Agent '${agentId}' deleted successfully`
        });
      } catch (error: any) {
        Logger.error('[RegistryAPI] Failed to delete agent', { error: error.message });
        res.status(500).json({ 
          error: 'Internal server error',
          message: Config.isDevelopment() ? error.message : 'Failed to delete agent'
        });
      }
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      Logger.error('[RegistryAPI] Unhandled error', { 
        error: err.message,
        stack: err.stack 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: Config.isDevelopment() ? err.message : 'An unexpected error occurred'
      });
    });
  }

  /**
   * Start the server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        Logger.info(`[RegistryAPI] Registry API listening on port ${this.port}`);
        Logger.info(`[RegistryAPI] Health check: http://localhost:${this.port}/health`);
        Logger.info(`[RegistryAPI] Environment: ${Config.get().nodeEnv}`);
        resolve();
      });
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    Logger.info('[RegistryAPI] Initiating graceful shutdown');

    return new Promise((resolve) => {
      if (!this.server) {
        Logger.info('[RegistryAPI] Server not running, closing database');
        this.db.close();
        resolve();
        return;
      }

      let shutdownComplete = false;

      // Force shutdown after timeout
      const forceShutdownTimer = setTimeout(() => {
        if (!shutdownComplete) {
          Logger.warn('[RegistryAPI] Forcing shutdown after timeout');
          this.db.close();
          shutdownComplete = true;
          resolve();
        }
      }, 10000); // 10 second timeout

      // Stop accepting new connections
      this.server.close((err?: Error) => {
        if (shutdownComplete) return; // Already resolved by timeout
        
        clearTimeout(forceShutdownTimer);
        shutdownComplete = true;

        if (err) {
          Logger.error('[RegistryAPI] Error during server shutdown', { error: err.message });
        } else {
          Logger.info('[RegistryAPI] Server stopped accepting new connections');
        }

        // Close database connection
        try {
          this.db.close();
          Logger.info('[RegistryAPI] Database connection closed');
        } catch (dbErr: any) {
          Logger.error('[RegistryAPI] Error closing database', { error: dbErr.message });
        }

        Logger.info('[RegistryAPI] Graceful shutdown complete');
        resolve();
      });
    });
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        Logger.info(`[RegistryAPI] Received ${signal}, shutting down gracefully`);
        await this.shutdown();
        process.exit(0);
      });
    });
  }
}

// Run server if executed directly
if (require.main === module) {
  const config = Config.get();
  const port = process.env.REGISTRY_PORT ? parseInt(process.env.REGISTRY_PORT) : config.port;
  const server = new RegistryServer(port);
  
  // Start server
  server.start().then(() => {
    Logger.info('[RegistryAPI] Server started successfully');
  }).catch((error) => {
    Logger.error('[RegistryAPI] Failed to start server', { error: error.message });
    process.exit(1);
  });
  
  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    Logger.info(`[RegistryAPI] Received ${signal}, shutting down gracefully`);
    try {
      await server.shutdown();
      process.exit(0);
    } catch (error: any) {
      Logger.error('[RegistryAPI] Error during shutdown', { error: error.message });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    Logger.error('[RegistryAPI] Uncaught exception', { error: error.message, stack: error.stack });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    Logger.error('[RegistryAPI] Unhandled rejection', { reason });
    gracefulShutdown('unhandledRejection');
  });
}
