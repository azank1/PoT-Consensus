"use strict";
/**
 * registry.test.ts
 *
 * Test Suite: Registry System
 *
 * Tests:
 * - DatabaseManager CRUD operations
 * - Agent registration
 * - Agent retrieval (single and all)
 * - Agent deletion
 * - Database persistence
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_1 = require("../src/registry/db/sqlite");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('DatabaseManager', () => {
    let db;
    const testDbPath = path.join(__dirname, '../data/test-registry.db');
    beforeEach(() => {
        // Remove test database if it exists
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        db = new sqlite_1.DatabaseManager(testDbPath);
    });
    afterEach(() => {
        db.close();
        // Clean up test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });
    describe('Agent Registration', () => {
        it('should register a new agent', () => {
            const manifest = {
                id: 'test-agent-1',
                type: 'http',
                config: { url: 'https://api.example.com' }
            };
            db.registerAgent(manifest.id, manifest);
            const retrieved = db.getAgent(manifest.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(manifest.id);
            expect(retrieved?.type).toBe(manifest.type);
        });
        it('should update an existing agent', () => {
            const manifest = {
                id: 'test-agent-1',
                type: 'http',
                config: { url: 'https://api.example.com' }
            };
            db.registerAgent(manifest.id, manifest);
            // Update the agent
            const updatedManifest = {
                ...manifest,
                config: { url: 'https://api.updated.com' }
            };
            db.registerAgent(manifest.id, updatedManifest);
            const retrieved = db.getAgent(manifest.id);
            expect(retrieved?.config.url).toBe('https://api.updated.com');
        });
    });
    describe('Agent Retrieval', () => {
        it('should retrieve a registered agent by ID', () => {
            const manifest = {
                id: 'test-agent-1',
                type: 'mcp',
                config: { endpoint: 'ws://localhost:3000' }
            };
            db.registerAgent(manifest.id, manifest);
            const retrieved = db.getAgent(manifest.id);
            expect(retrieved).toEqual(manifest);
        });
        it('should return null for non-existent agent', () => {
            const retrieved = db.getAgent('non-existent');
            expect(retrieved).toBeNull();
        });
        it('should retrieve all registered agents', () => {
            const agents = [
                { id: 'agent-1', type: 'http', config: {} },
                { id: 'agent-2', type: 'n8n', config: {} },
                { id: 'agent-3', type: 'mcp', config: {} }
            ];
            agents.forEach(agent => db.registerAgent(agent.id, agent));
            const retrieved = db.getAllAgents();
            expect(retrieved).toHaveLength(3);
            expect(retrieved.map(a => a.id).sort()).toEqual(['agent-1', 'agent-2', 'agent-3']);
        });
        it('should return empty array when no agents registered', () => {
            const retrieved = db.getAllAgents();
            expect(retrieved).toHaveLength(0);
        });
    });
    describe('Agent Deletion', () => {
        it('should delete an existing agent', () => {
            const manifest = {
                id: 'test-agent-1',
                type: 'http',
                config: {}
            };
            db.registerAgent(manifest.id, manifest);
            const deleted = db.deleteAgent(manifest.id);
            const retrieved = db.getAgent(manifest.id);
            expect(deleted).toBe(true);
            expect(retrieved).toBeNull();
        });
        it('should return false when deleting non-existent agent', () => {
            const deleted = db.deleteAgent('non-existent');
            expect(deleted).toBe(false);
        });
    });
    describe('Agent Count', () => {
        it('should return correct agent count', () => {
            expect(db.getAgentCount()).toBe(0);
            db.registerAgent('agent-1', { id: 'agent-1', type: 'http', config: {} });
            expect(db.getAgentCount()).toBe(1);
            db.registerAgent('agent-2', { id: 'agent-2', type: 'n8n', config: {} });
            expect(db.getAgentCount()).toBe(2);
            db.deleteAgent('agent-1');
            expect(db.getAgentCount()).toBe(1);
        });
    });
});
//# sourceMappingURL=registry.test.js.map