// F1 MOA System - Main Entry Point

import { MOACoordinator } from './agents/MOACoordinator.js';
import { F1MCPServer } from './mcp/server.js';
import type { MOARequest } from './types/index.js';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

program
  .name('f1-moa')
  .description('F1 Core Prompting & AST Analysis + 6-Agent MOA System')
  .version('1.0.0');

program
  .command('start')
  .description('Start the MOA system')
  .option('-p, --port <port>', 'MCP server port', '8080')
  .option('--agents <count>', 'Number of agents to spawn', '6')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Starting F1 MOA System...'));
    
    const coordinator = new MOACoordinator();
    await coordinator.initialize();
    
    console.log(chalk.green('✅ F1 MOA System ready for requests'));
    console.log(chalk.gray(`   Agents: ${coordinator.getAgentStatus().length}`));
    console.log(chalk.gray(`   Port: ${options.port}`));
  });

program
  .command('server')
  .description('Start MCP server for Claude Code integration')
  .option('-p, --port <port>', 'Server port', '8080')
  .action(async (options) => {
    const port = parseInt(options.port);
    const server = new F1MCPServer(port);
    
    console.log(chalk.blue(`🌐 Starting F1 MCP Server on port ${port}...`));
    await server.start();
  });

program
  .command('process')
  .description('Process a prompt with the MOA system')
  .requiredOption('-p, --prompt <prompt>', 'Prompt to process')
  .option('-c, --context <context>', 'Additional context (JSON string)')
  .option('-a, --agents <types>', 'Required agent types (comma-separated)')
  .option('-t, --template <templateId>', 'Prompt template to use')
  .option('--ast', 'Enable AST analysis')
  .option('--threshold <threshold>', 'Consensus threshold', '0.7')
  .action(async (options) => {
    const coordinator = new MOACoordinator();
    await coordinator.initialize();
    
    const request: MOARequest = {
      id: `cli-${Date.now()}`,
      prompt: options.prompt,
      context: options.context ? JSON.parse(options.context) : undefined,
      requiredAgentTypes: options.agents ? options.agents.split(',') : undefined,
      usePromptTemplate: options.template,
      astAnalysis: options.ast,
      consensusThreshold: parseFloat(options.threshold)
    };
    
    console.log(chalk.blue('🔄 Processing request...'));
    const startTime = Date.now();
    
    try {
      const response = await coordinator.processRequest(request);
      const processingTime = Date.now() - startTime;
      
      console.log(chalk.green('✅ Processing complete!'));
      console.log(chalk.gray(`   Time: ${processingTime}ms`));
      console.log(chalk.gray(`   Agents: ${response.agentResponses.length}`));
      console.log(chalk.gray(`   Confidence: ${(response.result.confidence * 100).toFixed(1)}%`));
      console.log('\n' + chalk.bold('Result:'));
      console.log(response.result.finalResponse);
      
      if (response.astAnalysis) {
        console.log('\n' + chalk.bold('AST Analysis:'));
        console.log(chalk.gray(`   Language: ${response.astAnalysis.language}`));
        console.log(chalk.gray(`   Complexity: ${response.astAnalysis.complexity}`));
        console.log(chalk.gray(`   Patterns: ${response.astAnalysis.patterns.length}`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Processing failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    
    await coordinator.shutdown();
  });

program
  .command('benchmark')
  .description('Run performance benchmarks')
  .option('-r, --requests <count>', 'Number of requests', '10')
  .option('-c, --concurrent <count>', 'Concurrent requests', '1')
  .action(async (options) => {
    console.log(chalk.blue('📊 Running F1 MOA benchmarks...'));
    
    const coordinator = new MOACoordinator();
    await coordinator.initialize();
    
    const requestCount = parseInt(options.requests);
    const concurrentCount = parseInt(options.concurrent);
    
    const results = await runBenchmark(coordinator, requestCount, concurrentCount);
    
    console.log(chalk.green('✅ Benchmark complete!'));
    console.log('\n' + chalk.bold('Results:'));
    console.log(chalk.gray(`   Total Requests: ${results.totalRequests}`));
    console.log(chalk.gray(`   Avg Response Time: ${results.avgResponseTime.toFixed(1)}ms`));
    console.log(chalk.gray(`   Success Rate: ${(results.successRate * 100).toFixed(1)}%`));
    console.log(chalk.gray(`   Throughput: ${results.throughput.toFixed(1)} req/s`));
    console.log(chalk.gray(`   P95 Response Time: ${results.p95ResponseTime.toFixed(1)}ms`));
    
    if (results.avgResponseTime < 300) {
      console.log(chalk.green('🎯 Target <300ms consensus time achieved!'));
    } else {
      console.log(chalk.yellow('⚠️ Target <300ms consensus time not achieved'));
    }
    
    await coordinator.shutdown();
  });

async function runBenchmark(coordinator: MOACoordinator, requestCount: number, concurrentCount: number) {
  const testPrompts = [
    'Analyze this code for performance issues',
    'Design a scalable microservices architecture',
    'Review this security implementation',
    'Optimize database query performance',
    'Implement error handling strategy'
  ];
  
  const responseTimes: number[] = [];
  let successCount = 0;
  
  const startTime = Date.now();
  
  // Run benchmarks in batches of concurrent requests
  for (let batchStart = 0; batchStart < requestCount; batchStart += concurrentCount) {
    const batch = [];
    
    for (let j = 0; j < concurrentCount && (batchStart + j) < requestCount; j++) {
      const prompt = testPrompts[(batchStart + j) % testPrompts.length];
      const request: MOARequest = {
        id: `bench-${batchStart + j}`,
        prompt,
        consensusThreshold: 0.7
      };
      
      batch.push(processBenchmarkRequest(coordinator, request));
    }
    
    const batchResults = await Promise.allSettled(batch);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        responseTimes.push(result.value);
        successCount++;
      }
    }
  }
  
  const totalTime = Date.now() - startTime;
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const successRate = successCount / requestCount;
  const throughput = requestCount / (totalTime / 1000);
  
  // Calculate P95
  responseTimes.sort((a, b) => a - b);
  const p95Index = Math.floor(responseTimes.length * 0.95);
  const p95ResponseTime = responseTimes[p95Index] || 0;
  
  return {
    totalRequests: requestCount,
    avgResponseTime,
    successRate,
    throughput,
    p95ResponseTime
  };
}

async function processBenchmarkRequest(coordinator: MOACoordinator, request: MOARequest): Promise<number> {
  const startTime = Date.now();
  await coordinator.processRequest(request);
  return Date.now() - startTime;
}

// CLI argument parsing
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { MOACoordinator, F1MCPServer };
export type * from './types/index.js';