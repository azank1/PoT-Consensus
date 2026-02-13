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

import express, { Request, Response } from 'express';
import { DatabaseManager, AgentManifest } from '../db/sqlite';
import { Logger } from '../../core/logs/Logger';

export class RegistryServer {
  private app: express.Application;
  private db: DatabaseManager;
  private port: number;

  constructor(port: number = 9090) {
    this.app = express();
    this.db = new DatabaseManager();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, _res, next) => {
      Logger.info(`[RegistryAPI] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        agentCount: this.db.getAgentCount()
      });
    });

    // Register agent
    this.app.post('/register', (req: Request, res: Response) => {
      try {
        const manifest: AgentManifest = req.body;
        
        if (!manifest.id) {
          return res.status(400).json({ error: 'Missing agent id' });
        }
        
        if (!manifest.type) {
          return res.status(400).json({ error: 'Missing agent type' });
        }
        
        this.db.registerAgent(manifest.id, manifest);
        
        res.status(201).json({
          success: true,
          message: `Agent ${manifest.id} registered`,
          agent: manifest
        });
      } catch (error: any) {
        Logger.error('[RegistryAPI] Registration failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // List all agents
    this.app.get('/agents', (_req: Request, res: Response) => {
      try {
        const agents = this.db.getAllAgents();
        res.json({
          count: agents.length,
          agents
        });
      } catch (error: any) {
        Logger.error('[RegistryAPI] Failed to list agents', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Get specific agent
    this.app.get('/agents/:id', (req: Request, res: Response) => {
      try {
        const agentId = req.params.id as string;
        const agent = this.db.getAgent(agentId);
        
        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }
        
        res.json(agent);
      } catch (error: any) {
        Logger.error('[RegistryAPI] Failed to get agent', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Delete agent
    this.app.delete('/agents/:id', (req: Request, res: Response) => {
      try {
        const agentId = req.params.id as string;
        const deleted = this.db.deleteAgent(agentId);
        
        if (!deleted) {
          return res.status(404).json({ error: 'Agent not found' });
        }
        
        res.json({
          success: true,
          message: `Agent ${req.params.id} deleted`
        });
      } catch (error: any) {
        Logger.error('[RegistryAPI] Failed to delete agent', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Start the server
   */
  start(): void {
    this.app.listen(this.port, () => {
      Logger.info(`[RegistryAPI] Registry API listening on port ${this.port}`);
      Logger.info(`[RegistryAPI] Health check: http://localhost:${this.port}/health`);
    });
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    this.db.close();
    Logger.info('[RegistryAPI] Server shutdown complete');
  }
}

// Run server if executed directly
if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 9090;
  const server = new RegistryServer(port);
  
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    Logger.info('[RegistryAPI] Received SIGINT, shutting down gracefully');
    server.shutdown();
    process.exit(0);
  });
}
