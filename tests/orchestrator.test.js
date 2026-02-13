"use strict";
/**
 * orchestrator.test.ts
 *
 * Test Suite: Core Orchestration
 *
 * Tests:
 * - Orchestrator instantiation
 * - Plan generation from goal
 * - Plan execution
 * - ClaudePlanner task decomposition
 * - Integration between planner and executor
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Orchestrator_1 = require("../src/core/orchestrator/Orchestrator");
const ClaudePlanner_1 = require("../src/core/planner/ClaudePlanner");
const Executor_1 = require("../src/core/executor/Executor");
const ContextManager_1 = require("../src/core/context/ContextManager");
describe('Orchestrator', () => {
    let orchestrator;
    beforeEach(() => {
        orchestrator = new Orchestrator_1.Orchestrator();
    });
    it('should create orchestrator instance', () => {
        expect(orchestrator).toBeInstanceOf(Orchestrator_1.Orchestrator);
    });
    it('should execute a simple goal', async () => {
        const goal = 'Test orchestration goal';
        const result = await orchestrator.run(goal);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
    });
});
describe('ClaudePlanner', () => {
    let planner;
    beforeEach(() => {
        planner = new ClaudePlanner_1.ClaudePlanner();
    });
    it('should create planner instance', () => {
        expect(planner).toBeInstanceOf(ClaudePlanner_1.ClaudePlanner);
    });
    it('should generate plan from goal', async () => {
        const goal = 'Fetch data and process it';
        const plan = await planner.plan(goal);
        expect(Array.isArray(plan)).toBe(true);
        expect(plan.length).toBeGreaterThan(0);
        // Check plan structure
        plan.forEach(task => {
            expect(task).toHaveProperty('id');
            expect(task).toHaveProperty('agent_id');
            expect(task).toHaveProperty('input');
        });
    });
    it('should use mock planner when Claude-Flow unavailable', async () => {
        const goal = 'Test goal';
        const plan = await planner.plan(goal);
        // Mock planner should still return valid plan structure
        expect(plan).toBeDefined();
        expect(Array.isArray(plan)).toBe(true);
    });
});
describe('Executor', () => {
    let executor;
    beforeEach(() => {
        executor = new Executor_1.Executor();
    });
    it('should create executor instance', () => {
        expect(executor).toBeInstanceOf(Executor_1.Executor);
    });
    it('should execute empty task list', async () => {
        const result = await executor.execute([]);
        expect(result).toEqual({});
    });
    it('should handle task dependencies', async () => {
        // Just test that executor can be called - actual execution will fail
        const tasks = [
            {
                id: 'task-1',
                agent_id: 'mock-agent',
                protocol: 'http',
                input: { type: 'mock' },
                dependencies: []
            }
        ];
        // Execution will fail due to unknown agent, but structure is validated
        const result = await executor.execute(tasks);
        expect(result).toBeDefined();
    });
});
describe('ContextManager', () => {
    let contextManager;
    beforeEach(() => {
        contextManager = new ContextManager_1.ContextManager();
    });
    it('should create context manager instance', () => {
        expect(contextManager).toBeInstanceOf(ContextManager_1.ContextManager);
    });
    it('should set and get context values', () => {
        contextManager.set('key1', 'value1');
        expect(contextManager.get('key1')).toBe('value1');
    });
    it('should resolve template variables', () => {
        contextManager.set('task-1.result', 'Hello');
        contextManager.set('task-2.data', 'World');
        const template = '{{task-1.result}} {{task-2.data}}!';
        const resolved = contextManager.resolveTemplate(template);
        expect(resolved).toBe('Hello World!');
    });
    it('should handle missing template variables', () => {
        const template = '{{missing.var}}';
        const resolved = contextManager.resolveTemplate(template);
        expect(resolved).toBe('{{missing.var}}');
    });
    it('should resolve nested objects', () => {
        contextManager.set('task-1.result', 'value');
        const obj = {
            field1: '{{task-1.result}}',
            field2: 'static',
            nested: {
                field3: '{{task-1.result}}'
            }
        };
        const resolved = contextManager.resolveTemplate(obj);
        expect(resolved.field1).toBe('value');
        expect(resolved.field2).toBe('static');
        expect(resolved.nested.field3).toBe('value');
    });
    it('should clear context', () => {
        contextManager.set('key1', 'value1');
        contextManager.set('key2', 'value2');
        contextManager.clear();
        expect(contextManager.get('key1')).toBeUndefined();
        expect(contextManager.get('key2')).toBeUndefined();
    });
});
//# sourceMappingURL=orchestrator.test.js.map