#!/usr/bin/env node
/**
 * index.ts (CLI Tool)
 * 
 * Purpose: Command-line interface for PoT-Consensus
 * 
 * Commands:
 * - register --file <manifest.json>   - Register agent from manifest file
 * - list                              - List all registered agents
 * - invoke --goal "<goal>"            - Execute orchestration with goal
 * 
 * Examples:
 * $ npm run cli -- register --file manifests/agent.http.json
 * $ npm run cli -- list
 * $ npm run cli -- invoke --goal "Fetch and analyze customer reviews"
 * 
 * Dependencies:
 * - Commander for CLI framework
 * - Orchestrator for execution
 * - RegistryClient for API communication
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../../core/orchestrator/Orchestrator';
import { AgentManifest } from '../../registry/db/sqlite';
import { RegistryClient } from '../RegistryClient';

const program = new Command();
const registryClient = new RegistryClient();

program
  .name('pot-cli')
  .description('PoT-Consensus CLI - Manage agents and execute orchestrations')
  .version('1.0.0');

/**
 * Register command - Register agent from manifest file
 */
program
  .command('register')
  .description('Register an agent from a manifest file')
  .requiredOption('-f, --file <path>', 'Path to agent manifest JSON file')
  .action(async (options) => {
    try {
      const manifestPath = path.resolve(options.file);
      
      if (!fs.existsSync(manifestPath)) {
        console.error(`❌ Error: File not found: ${manifestPath}`);
        process.exit(1);
      }

      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest: AgentManifest = JSON.parse(manifestContent);

      console.log(`📝 Registering agent: ${manifest.id}`);
      
      const response = await registryClient.register(manifest);
      
      console.log('✅ Agent registered successfully');
      console.log(JSON.stringify(response, null, 2));
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

/**
 * List command - List all registered agents
 */
program
  .command('list')
  .description('List all registered agents')
  .action(async () => {
    try {
      const response = await registryClient.list();
      const { count, agents } = response;

      console.log(`\n📋 Registered Agents (${count}):\n`);
      
      if (count === 0) {
        console.log('   No agents registered yet.');
        console.log('   Use "pot-cli register --file <manifest.json>" to register an agent.\n');
        return;
      }

      agents.forEach((agent: AgentManifest, index: number) => {
        console.log(`${index + 1}. ${agent.id}`);
        console.log(`   Type: ${agent.type}`);
        const configStr = JSON.stringify(agent.config || {});
        console.log(`   Config: ${configStr.length > 60 ? configStr.substring(0, 60) + '...' : configStr}`);
        console.log('');
      });
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Invoke command - Execute orchestration with a goal
 */
program
  .command('invoke')
  .description('Execute orchestration with a goal')
  .requiredOption('-g, --goal <goal>', 'Goal to execute')
  .action(async (options) => {
    try {
      console.log(`\n🎯 Executing goal: "${options.goal}"\n`);
      
      const orchestrator = new Orchestrator();
      const result = await orchestrator.run(options.goal);
      
      console.log('\n✅ Execution Complete\n');
      console.log('Results:');
      console.log(JSON.stringify(result, null, 2));
      console.log('');
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Get agent command - Get specific agent details
 */
program
  .command('get')
  .description('Get details of a specific agent')
  .requiredOption('-i, --id <agentId>', 'Agent ID')
  .action(async (options) => {
    try {
      const response = await registryClient.get(options.id);
      
      console.log('\n📄 Agent Details:\n');
      console.log(JSON.stringify(response, null, 2));
      console.log('');
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Delete command - Delete an agent
 */
program
  .command('delete')
  .description('Delete a registered agent')
  .requiredOption('-i, --id <agentId>', 'Agent ID')
  .action(async (options) => {
    try {
      const response = await registryClient.delete(options.id);
      
      console.log(`✅ ${response.message}`);
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Health command - Check registry health
 */
program
  .command('health')
  .description('Check registry server health')
  .action(async () => {
    try {
      const response = await registryClient.getHealth();
      
      console.log('\n💚 Registry Health:\n');
      console.log(JSON.stringify(response, null, 2));
      console.log('');
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();

