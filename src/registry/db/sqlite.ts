/**
 * sqlite.ts (Database Manager)
 * 
 * Purpose: SQLite database operations for agent registry
 * 
 * Schema:
 * agents {
 *   id: TEXT PRIMARY KEY
 *   manifest: TEXT (JSON)
 * }
 * 
 * Methods:
 * - registerAgent(id, manifest): Insert/update agent
 * - getAgent(id): Retrieve agent by ID
 * - getAllAgents(): Get all registered agents
 * - deleteAgent(id): Remove agent
 * - close(): Close database connection
 * 
 * Dependencies:
 * - better-sqlite3
 */

import Database from 'better-sqlite3';
import { Logger } from '../../core/logs/Logger';
import { DatabaseError } from '../../core/errors/CustomErrors';
import * as path from 'path';
import * as fs from 'fs';

export interface AgentManifest {
  id: string;
  type: 'http' | 'n8n' | 'mcp';
  name?: string;
  description?: string;
  protocol?: string;
  endpoint?: string;
  capabilities?: string[];
  tags?: string[];
  config: any;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string = path.join(__dirname, '../../../data/registry.db')) {
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initSchema();
    Logger.info(`[DatabaseManager] Database initialized at ${dbPath}`);
  }

  /**
   * Initialize database schema
   */
  private initSchema(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        manifest TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    this.db.exec(createTableSQL);
    Logger.info('[DatabaseManager] Schema initialized');
  }

  /**
   * Register or update an agent
   */
  registerAgent(id: string, manifest: AgentManifest): void {
    const manifestJson = JSON.stringify(manifest);
    const stmt = this.db.prepare(`
      INSERT INTO agents (id, manifest, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        manifest = excluded.manifest,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    stmt.run(id, manifestJson);
    Logger.info(`[DatabaseManager] Agent registered: ${id}`);
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentManifest | null {
    try {
      const stmt = this.db.prepare('SELECT manifest FROM agents WHERE id = ?');
      const row = stmt.get(id) as { manifest: string } | undefined;
      
      if (!row) {
        return null;
      }
      
      try {
        return JSON.parse(row.manifest);
      } catch (parseError: any) {
        Logger.error(`[DatabaseManager] Failed to parse manifest for agent ${id}`, {
          error: parseError.message
        });
        throw new DatabaseError(
          `Failed to parse manifest for agent ${id}: ${parseError.message}`,
          { agentId: id }
        );
      }
    } catch (error: any) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      Logger.error(`[DatabaseManager] Failed to get agent ${id}`, {
        error: error.message
      });
      throw new DatabaseError(
        `Failed to get agent ${id}: ${error.message}`,
        { agentId: id }
      );
    }
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentManifest[] {
    try {
      const stmt = this.db.prepare('SELECT manifest FROM agents ORDER BY created_at DESC');
      const rows = stmt.all() as { manifest: string }[];
      
      const agents: AgentManifest[] = [];
      for (const row of rows) {
        try {
          agents.push(JSON.parse(row.manifest));
        } catch (parseError: any) {
          Logger.warn(`[DatabaseManager] Skipping corrupted manifest`, {
            error: parseError.message
          });
          // Skip corrupted entries instead of failing the entire operation
          continue;
        }
      }
      
      return agents;
    } catch (error: any) {
      Logger.error(`[DatabaseManager] Failed to get all agents`, {
        error: error.message
      });
      throw new DatabaseError(
        `Failed to get all agents: ${error.message}`
      );
    }
  }

  /**
   * Delete agent by ID
   */
  deleteAgent(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM agents WHERE id = ?');
    const result = stmt.run(id);
    
    const deleted = result.changes > 0;
    if (deleted) {
      Logger.info(`[DatabaseManager] Agent deleted: ${id}`);
    }
    
    return deleted;
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM agents');
    const row = stmt.get() as { count: number };
    return row.count;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    Logger.info('[DatabaseManager] Database connection closed');
  }
}
