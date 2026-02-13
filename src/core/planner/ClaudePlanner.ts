/**
 * ClaudePlanner.ts
 * 
 * Purpose: AI-powered task planner using Claude-Flow SDK
 */

import { Logger } from '../logs/Logger';

export interface Task {
  id: string;
  agent_id: string;
  protocol: 'http' | 'n8n' | 'mcp';
  input: any;
  dependencies?: string[];
  timeout?: number; // Task-specific timeout in milliseconds
}

export class ClaudePlanner {
  private claudeFlow: any;

  constructor() {
    try {
      // Attempt to load Claude-Flow
      const ClaudeFlowModule = require('claude-flow');
      this.claudeFlow = ClaudeFlowModule.ClaudeFlow || ClaudeFlowModule.default;
      Logger.info('[ClaudePlanner] Claude-Flow SDK loaded successfully');
    } catch (error) {
      Logger.warn('[ClaudePlanner] Claude-Flow not available, using mock planner');
      this.claudeFlow = null;
    }
  }

  async plan(goal: string): Promise<Task[]> {
    Logger.info(`[ClaudePlanner] Planning for goal: "${goal}"`);

    if (this.claudeFlow) {
      try {
        const flow = new this.claudeFlow();
        const plan = await flow.createPlan(goal);
        Logger.info('[ClaudePlanner] Generated plan from Claude-Flow', plan);
        
        // Transform Claude-Flow output to our Task format
        return this.transformPlan(plan);
      } catch (error) {
        Logger.error('[ClaudePlanner] Claude-Flow execution failed, falling back to mock', error);
        return this.mockPlan(goal);
      }
    }

    return this.mockPlan(goal);
  }

  private transformPlan(claudePlan: any): Task[] {
    // Transform Claude-Flow plan format to our Task format
    if (claudePlan?.tasks && Array.isArray(claudePlan.tasks)) {
      return claudePlan.tasks.map((task: any, index: number) => ({
        id: task.id || `task-${index + 1}`,
        agent_id: task.agent_id || `agent.${task.protocol || 'http'}`,
        protocol: task.protocol || 'http',
        input: task.input || {},
        dependencies: task.dependencies
      }));
    }
    return [];
  }

  private mockPlan(goal: string): Task[] {
    Logger.info('[ClaudePlanner] Using mock plan generator');
    
    // Simple mock: create 2-step plan based on goal keywords
    const tasks: Task[] = [];

    if (goal.toLowerCase().includes('fetch') || goal.toLowerCase().includes('get') || goal.toLowerCase().includes('retrieve')) {
      tasks.push({
        id: 'task-1',
        agent_id: 'agent.http.fetch_reviews',
        protocol: 'http',
        input: {
          endpoint: 'https://jsonplaceholder.typicode.com/comments',
          method: 'GET',
          params: { postId: 1 }
        }
      });
    }

    if (goal.toLowerCase().includes('summarize') || goal.toLowerCase().includes('analyze') || goal.toLowerCase().includes('sentiment')) {
      tasks.push({
        id: 'task-2',
        agent_id: 'agent.mcp.summarize',
        protocol: 'mcp',
        input: {
          endpoint: 'http://localhost:8080/mcp',
          method: 'analyze_sentiment',
          params: {
            text: '{{task-1.result}}'
          }
        },
        dependencies: tasks.length > 0 ? ['task-1'] : undefined
      });
    }

    Logger.info(`[ClaudePlanner] Generated ${tasks.length} tasks`);
    return tasks;
  }
}
