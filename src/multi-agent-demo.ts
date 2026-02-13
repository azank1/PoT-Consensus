/**
 * multi-agent-demo.ts
 * 
 * Demonstration of Multi-Agent Orchestration System
 */

import { MultiAgentOrchestrator } from './core/orchestrator/MultiAgentOrchestrator';
import { Logger } from './core/logs/Logger';

async function main() {
  console.log('\n🤖 PoT-Consensus Multi-Agent System Demo\n');
  console.log('='.repeat(60));
  console.log('\n');

  const orchestrator = new MultiAgentOrchestrator();

  // Display registered agents
  console.log('📋 Registered Specialized Agents:\n');
  const agents = orchestrator.getAgents();
  agents.forEach((agent, index) => {
    console.log(`${index + 1}. ${agent.id}`);
    console.log(`   Role: ${agent.role}`);
    console.log(`   Priority: ${agent.priority}`);
    console.log(`   Capabilities: ${agent.capabilities.slice(0, 3).join(', ')}...`);
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('\n');

  // Create development workflow
  const projectGoal = 'Build production-ready PoT-Consensus system';
  console.log(`🎯 Creating workflow for: "${projectGoal}"\n`);

  const workflow = orchestrator.createDevelopmentWorkflow(projectGoal);

  console.log('📊 Workflow Phases:\n');
  workflow.forEach((task, index) => {
    console.log(`${index + 1}. ${task.phase} (${task.id})`);
    console.log(`   Agents: ${task.assignedAgents.join(', ')}`);
    console.log(`   Dependencies: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}`);
    console.log(`   Status: ${task.status}`);
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('\n');

  // Execute workflow
  console.log('🚀 Executing Multi-Agent Workflow...\n');
  const results = await orchestrator.executeWorkflow(projectGoal);

  console.log('\n' + '='.repeat(60));
  console.log('\n');

  // Display results
  console.log('✅ Workflow Execution Results:\n');
  Object.entries(results).forEach(([taskId, result]: [string, any]) => {
    console.log(`📦 ${taskId}:`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      Object.entries(result).forEach(([agentId, agentResult]: [string, any]) => {
        console.log(`   🤖 ${agentId} (${agentResult.role}):`);
        console.log(`      Status: ${agentResult.status}`);
        if (agentResult.recommendations) {
          console.log('      Recommendations:');
          agentResult.recommendations.forEach((rec: string) => {
            console.log(`        • ${rec}`);
          });
        }
      });
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('\n');

  // Display workflow status
  const status = orchestrator.getWorkflowStatus(projectGoal);
  console.log('📈 Workflow Status Summary:\n');
  console.log(`   Total Tasks: ${status.total}`);
  console.log(`   Completed: ${status.completed} (${status.progress}%)`);
  console.log(`   In Progress: ${status.inProgress}`);
  console.log(`   Failed: ${status.failed}`);
  console.log(`   Pending: ${status.pending}`);
  console.log('\n');

  console.log('='.repeat(60));
  console.log('\n');

  console.log('✅ Multi-Agent System Demo Complete!\n');
}

main().catch(error => {
  Logger.error('[Demo] Failed to execute multi-agent demo', { error: error.message });
  console.error('❌ Error:', error.message);
  process.exit(1);
});
