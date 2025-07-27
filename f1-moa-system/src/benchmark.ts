// F1 MOA System - Performance Benchmark Suite

import { MOACoordinator } from './agents/MOACoordinator.js';
import type { MOARequest } from './types/index.js';
import chalk from 'chalk';

interface BenchmarkResult {
  testName: string;
  totalRequests: number;
  successfulRequests: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  consensusRate: number;
  errorRate: number;
  memoryUsage: NodeJS.MemoryUsage;
}

class F1Benchmark {
  private coordinator: MOACoordinator;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.coordinator = new MOACoordinator();
  }

  async initialize(): Promise<void> {
    console.log(chalk.blue('🚀 Initializing F1 MOA Benchmark Suite...'));
    await this.coordinator.initialize();
    console.log(chalk.green('✅ Benchmark suite ready'));
  }

  async runAllBenchmarks(): Promise<void> {
    console.log(chalk.bold('\n📊 Running F1 MOA Performance Benchmarks\n'));

    // Benchmark 1: Single Request Performance
    await this.runSingleRequestBenchmark();

    // Benchmark 2: Consensus Time Target (<300ms)
    await this.runConsensusTimeBenchmark();

    // Benchmark 3: Throughput Test
    await this.runThroughputBenchmark();

    // Benchmark 4: Concurrent Processing
    await this.runConcurrentBenchmark();

    // Benchmark 5: AST Analysis Performance
    await this.runASTBenchmark();

    // Benchmark 6: Prompt Template Performance
    await this.runTemplateBenchmark();

    // Benchmark 7: Memory Usage Test
    await this.runMemoryBenchmark();

    // Benchmark 8: Stress Test
    await this.runStressTest();

    this.generateReport();
  }

  private async runSingleRequestBenchmark(): Promise<void> {
    console.log(chalk.cyan('🔍 Running Single Request Performance Test...'));

    const testRequests: MOARequest[] = [
      {
        id: 'single-1',
        prompt: 'Analyze this simple function: function add(a, b) { return a + b; }',
        consensusThreshold: 0.7
      },
      {
        id: 'single-2',
        prompt: 'Review the security of this authentication code',
        consensusThreshold: 0.8
      },
      {
        id: 'single-3',
        prompt: 'Optimize this database query performance',
        consensusThreshold: 0.75
      }
    ];

    const responseTimes: number[] = [];
    let successCount = 0;
    let consensusCount = 0;

    for (const request of testRequests) {
      try {
        const startTime = Date.now();
        const response = await this.coordinator.processRequest(request);
        const responseTime = Date.now() - startTime;

        responseTimes.push(responseTime);
        successCount++;
        
        if (response.result.confidence >= request.consensusThreshold!) {
          consensusCount++;
        }

        console.log(chalk.gray(`  ✓ ${request.id}: ${responseTime}ms (confidence: ${(response.result.confidence * 100).toFixed(1)}%)`));
      } catch (error) {
        console.log(chalk.red(`  ✗ ${request.id}: Failed`));
      }
    }

    const result = this.calculateBenchmarkResult(
      'Single Request Performance',
      testRequests.length,
      successCount,
      responseTimes,
      consensusCount
    );

    this.results.push(result);
    this.printBenchmarkResult(result);
  }

  private async runConsensusTimeBenchmark(): Promise<void> {
    console.log(chalk.cyan('⏱️ Running Consensus Time Target Test (<300ms)...'));

    const quickRequests: MOARequest[] = Array.from({ length: 20 }, (_, i) => ({
      id: `consensus-${i}`,
      prompt: `Quick analysis ${i}: Review this code snippet`,
      consensusThreshold: 0.6 // Lower threshold for speed
    }));

    const responseTimes: number[] = [];
    let successCount = 0;
    let consensusCount = 0;
    let under300Count = 0;

    for (let requestIndex = 0; requestIndex < quickRequests.length; requestIndex++) {
      const request = quickRequests[requestIndex];
      try {
        const startTime = Date.now();
        const response = await this.coordinator.processRequest(request);
        const responseTime = Date.now() - startTime;

        responseTimes.push(responseTime);
        successCount++;
        
        if (response.result.confidence >= request.consensusThreshold!) {
          consensusCount++;
        }

        if (responseTime < 300) {
          under300Count++;
        }

        if (requestIndex % 5 === 0) {
          console.log(chalk.gray(`  ✓ Processed ${requestIndex + 1}/20 requests`));
        }
      } catch (error) {
        console.log(chalk.red(`  ✗ ${request.id}: Failed`));
      }
    }

    const result = this.calculateBenchmarkResult(
      'Consensus Time Target',
      quickRequests.length,
      successCount,
      responseTimes,
      consensusCount
    );

    this.results.push(result);
    
    console.log(chalk.green(`✅ ${under300Count}/${quickRequests.length} requests under 300ms target`));
    if (under300Count >= quickRequests.length * 0.8) {
      console.log(chalk.green('🎯 Target achieved: >80% under 300ms'));
    } else {
      console.log(chalk.yellow('⚠️ Target missed: <80% under 300ms'));
    }
    
    this.printBenchmarkResult(result);
  }

  private async runThroughputBenchmark(): Promise<void> {
    console.log(chalk.cyan('🚀 Running Throughput Test...'));

    const throughputRequests: MOARequest[] = Array.from({ length: 50 }, (_, i) => ({
      id: `throughput-${i}`,
      prompt: `Throughput test ${i}: Analyze performance implications`,
      consensusThreshold: 0.7
    }));

    const responseTimes: number[] = [];
    let successCount = 0;
    let consensusCount = 0;

    const startTime = Date.now();

    // Process requests in batches of 5 for controlled throughput
    for (let i = 0; i < throughputRequests.length; i += 5) {
      const batch = throughputRequests.slice(i, i + 5);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const reqStartTime = Date.now();
          const response = await this.coordinator.processRequest(request);
          const responseTime = Date.now() - reqStartTime;

          responseTimes.push(responseTime);
          successCount++;
          
          if (response.result.confidence >= request.consensusThreshold!) {
            consensusCount++;
          }

          return responseTime;
        } catch (error) {
          return null;
        }
      });

      await Promise.all(batchPromises);
      console.log(chalk.gray(`  ✓ Processed ${Math.min(i + 5, throughputRequests.length)}/${throughputRequests.length} requests`));
    }

    const totalTime = Date.now() - startTime;
    const result = this.calculateBenchmarkResult(
      'Throughput Test',
      throughputRequests.length,
      successCount,
      responseTimes,
      consensusCount,
      totalTime
    );

    this.results.push(result);
    console.log(chalk.green(`✅ Processed ${successCount} requests in ${totalTime}ms`));
    console.log(chalk.green(`📈 Throughput: ${result.throughput.toFixed(2)} requests/second`));
    this.printBenchmarkResult(result);
  }

  private async runConcurrentBenchmark(): Promise<void> {
    console.log(chalk.cyan('⚡ Running Concurrent Processing Test...'));

    const concurrentRequests: MOARequest[] = Array.from({ length: 15 }, (_, i) => ({
      id: `concurrent-${i}`,
      prompt: `Concurrent test ${i}: Analyze this system architecture`,
      consensusThreshold: 0.7
    }));

    const responseTimes: number[] = [];
    let successCount = 0;
    let consensusCount = 0;

    const startTime = Date.now();

    // Process all requests concurrently
    const promises = concurrentRequests.map(async (request) => {
      try {
        const reqStartTime = Date.now();
        const response = await this.coordinator.processRequest(request);
        const responseTime = Date.now() - reqStartTime;

        responseTimes.push(responseTime);
        successCount++;
        
        if (response.result.confidence >= request.consensusThreshold!) {
          consensusCount++;
        }

        return responseTime;
      } catch (error) {
        return null;
      }
    });

    await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    const result = this.calculateBenchmarkResult(
      'Concurrent Processing',
      concurrentRequests.length,
      successCount,
      responseTimes,
      consensusCount,
      totalTime
    );

    this.results.push(result);
    console.log(chalk.green(`✅ Processed ${successCount} concurrent requests in ${totalTime}ms`));
    this.printBenchmarkResult(result);
  }

  private async runASTBenchmark(): Promise<void> {
    console.log(chalk.cyan('🌳 Running AST Analysis Performance Test...'));

    const codeSnippets = [
      'function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }',
      'class UserManager { constructor() { this.users = []; } addUser(user) { this.users.push(user); } }',
      'const processData = async (data) => { try { return await Promise.all(data.map(item => transform(item))); } catch (error) { throw error; } }',
      'for (let i = 0; i < 1000; i++) { for (let j = 0; j < 1000; j++) { console.log(i * j); } }'
    ];

    const astRequests: MOARequest[] = codeSnippets.map((code, i) => ({
      id: `ast-${i}`,
      prompt: code,
      astAnalysis: true,
      consensusThreshold: 0.7
    }));

    const responseTimes: number[] = [];
    let successCount = 0;
    let consensusCount = 0;

    for (const request of astRequests) {
      try {
        const startTime = Date.now();
        const response = await this.coordinator.processRequest(request);
        const responseTime = Date.now() - startTime;

        responseTimes.push(responseTime);
        successCount++;
        
        if (response.result.confidence >= request.consensusThreshold!) {
          consensusCount++;
        }

        console.log(chalk.gray(`  ✓ AST analysis: ${response.astAnalysis?.parseTime}ms parse, ${responseTime}ms total`));
      } catch (error) {
        console.log(chalk.red(`  ✗ ${request.id}: Failed`));
      }
    }

    const result = this.calculateBenchmarkResult(
      'AST Analysis Performance',
      astRequests.length,
      successCount,
      responseTimes,
      consensusCount
    );

    this.results.push(result);
    this.printBenchmarkResult(result);
  }

  private async runTemplateBenchmark(): Promise<void> {
    console.log(chalk.cyan('📝 Running Prompt Template Performance Test...'));

    const templateRequests: MOARequest[] = [
      {
        id: 'template-1',
        prompt: 'Review authentication code',
        usePromptTemplate: 'code-review',
        context: {
          context: 'Authentication module',
          changes: 'Added JWT validation',
          focus: 'Security'
        },
        consensusThreshold: 0.7
      },
      {
        id: 'template-2',
        prompt: 'Design system architecture',
        usePromptTemplate: 'architecture-design',
        context: {
          requirements: 'Real-time chat system',
          constraints: 'High availability',
          scale: '100k users'
        },
        consensusThreshold: 0.7
      }
    ];

    const responseTimes: number[] = [];
    let successCount = 0;
    let consensusCount = 0;

    for (const request of templateRequests) {
      try {
        const startTime = Date.now();
        const response = await this.coordinator.processRequest(request);
        const responseTime = Date.now() - startTime;

        responseTimes.push(responseTime);
        successCount++;
        
        if (response.result.confidence >= request.consensusThreshold!) {
          consensusCount++;
        }

        console.log(chalk.gray(`  ✓ Template ${request.usePromptTemplate}: ${responseTime}ms`));
      } catch (error) {
        console.log(chalk.red(`  ✗ ${request.id}: Failed`));
      }
    }

    const result = this.calculateBenchmarkResult(
      'Prompt Template Performance',
      templateRequests.length,
      successCount,
      responseTimes,
      consensusCount
    );

    this.results.push(result);
    this.printBenchmarkResult(result);
  }

  private async runMemoryBenchmark(): Promise<void> {
    console.log(chalk.cyan('💾 Running Memory Usage Test...'));

    const initialMemory = process.memoryUsage();
    
    // Process requests and monitor memory
    const memoryRequests: MOARequest[] = Array.from({ length: 30 }, (_, i) => ({
      id: `memory-${i}`,
      prompt: `Memory test ${i}: Analyze this complex system`,
      consensusThreshold: 0.7
    }));

    const responseTimes: number[] = [];
    let successCount = 0;
    let consensusCount = 0;

    for (const request of memoryRequests) {
      try {
        const startTime = Date.now();
        const response = await this.coordinator.processRequest(request);
        const responseTime = Date.now() - startTime;

        responseTimes.push(responseTime);
        successCount++;
        
        if (response.result.confidence >= request.consensusThreshold!) {
          consensusCount++;
        }

        // Force garbage collection every 10 requests
        if (successCount % 10 === 0) {
          if (global.gc) {
            global.gc();
          }
        }
      } catch (error) {
        console.log(chalk.red(`  ✗ ${request.id}: Failed`));
      }
    }

    const finalMemory = process.memoryUsage();
    
    const result = this.calculateBenchmarkResult(
      'Memory Usage Test',
      memoryRequests.length,
      successCount,
      responseTimes,
      consensusCount
    );

    result.memoryUsage = finalMemory;

    this.results.push(result);
    
    console.log(chalk.green(`📊 Memory usage: RSS ${(finalMemory.rss / 1024 / 1024).toFixed(1)}MB`));
    console.log(chalk.green(`📊 Heap used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`));
    this.printBenchmarkResult(result);
  }

  private async runStressTest(): Promise<void> {
    console.log(chalk.cyan('🔥 Running Stress Test...'));

    const stressRequests: MOARequest[] = Array.from({ length: 100 }, (_, i) => ({
      id: `stress-${i}`,
      prompt: `Stress test ${i}: Complex analysis with multiple requirements`,
      consensusThreshold: 0.6 // Lower threshold for stress test
    }));

    const responseTimes: number[] = [];
    let successCount = 0;
    let consensusCount = 0;

    const startTime = Date.now();

    // Process in batches of 10 to avoid overwhelming the system
    for (let i = 0; i < stressRequests.length; i += 10) {
      const batch = stressRequests.slice(i, i + 10);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const reqStartTime = Date.now();
          const response = await this.coordinator.processRequest(request);
          const responseTime = Date.now() - reqStartTime;

          responseTimes.push(responseTime);
          successCount++;
          
          if (response.result.confidence >= request.consensusThreshold!) {
            consensusCount++;
          }

          return responseTime;
        } catch (error) {
          return null;
        }
      });

      await Promise.all(batchPromises);
      
      if (i % 20 === 0) {
        console.log(chalk.gray(`  ✓ Stress test: ${Math.min(i + 10, stressRequests.length)}/${stressRequests.length} requests`));
      }
    }

    const totalTime = Date.now() - startTime;

    const result = this.calculateBenchmarkResult(
      'Stress Test',
      stressRequests.length,
      successCount,
      responseTimes,
      consensusCount,
      totalTime
    );

    this.results.push(result);
    console.log(chalk.green(`🔥 Stress test completed: ${successCount}/${stressRequests.length} successful`));
    this.printBenchmarkResult(result);
  }

  private calculateBenchmarkResult(
    testName: string,
    totalRequests: number,
    successfulRequests: number,
    responseTimes: number[],
    consensusCount: number,
    totalTime?: number
  ): BenchmarkResult {
    responseTimes.sort((a, b) => a - b);
    
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    const throughput = totalTime ? (successfulRequests / (totalTime / 1000)) : 0;
    
    return {
      testName,
      totalRequests,
      successfulRequests,
      avgResponseTime: avgResponseTime || 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      throughput,
      consensusRate: consensusCount / totalRequests,
      errorRate: (totalRequests - successfulRequests) / totalRequests,
      memoryUsage: process.memoryUsage()
    };
  }

  private printBenchmarkResult(result: BenchmarkResult): void {
    console.log(chalk.green(`✅ ${result.testName} Results:`));
    console.log(chalk.gray(`   Success Rate: ${((1 - result.errorRate) * 100).toFixed(1)}%`));
    console.log(chalk.gray(`   Avg Response: ${result.avgResponseTime.toFixed(1)}ms`));
    console.log(chalk.gray(`   P95 Response: ${result.p95ResponseTime.toFixed(1)}ms`));
    console.log(chalk.gray(`   Consensus Rate: ${(result.consensusRate * 100).toFixed(1)}%`));
    if (result.throughput > 0) {
      console.log(chalk.gray(`   Throughput: ${result.throughput.toFixed(2)} req/s`));
    }
    console.log();
  }

  private generateReport(): void {
    console.log(chalk.bold('\n📋 F1 MOA System Benchmark Report\n'));
    console.log('='.repeat(60));

    // Overall performance summary
    const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / this.results.length;
    const avgConsensusRate = this.results.reduce((sum, r) => sum + r.consensusRate, 0) / this.results.length;

    console.log(chalk.bold('📊 Overall Performance:'));
    console.log(chalk.green(`   Total Requests: ${totalRequests}`));
    console.log(chalk.green(`   Success Rate: ${((totalSuccessful / totalRequests) * 100).toFixed(1)}%`));
    console.log(chalk.green(`   Avg Response Time: ${avgResponseTime.toFixed(1)}ms`));
    console.log(chalk.green(`   Avg Consensus Rate: ${(avgConsensusRate * 100).toFixed(1)}%`));

    // Target achievement
    console.log(chalk.bold('\n🎯 Target Achievement:'));
    const consensusTimeResult = this.results.find(r => r.testName === 'Consensus Time Target');
    if (consensusTimeResult && consensusTimeResult.avgResponseTime < 300) {
      console.log(chalk.green('   ✅ <300ms consensus time target: ACHIEVED'));
    } else {
      console.log(chalk.yellow('   ⚠️ <300ms consensus time target: NOT ACHIEVED'));
    }

    const throughputResult = this.results.find(r => r.testName === 'Throughput Test');
    if (throughputResult && throughputResult.throughput > 5) {
      console.log(chalk.green('   ✅ >5 req/s throughput target: ACHIEVED'));
    } else {
      console.log(chalk.yellow('   ⚠️ >5 req/s throughput target: NOT ACHIEVED'));
    }

    // Detailed results
    console.log(chalk.bold('\n📈 Detailed Results:'));
    console.log('─'.repeat(60));
    
    for (const result of this.results) {
      console.log(chalk.cyan(`${result.testName}:`));
      console.log(`   Requests: ${result.successfulRequests}/${result.totalRequests}`);
      console.log(`   Avg Time: ${result.avgResponseTime.toFixed(1)}ms`);
      console.log(`   P95 Time: ${result.p95ResponseTime.toFixed(1)}ms`);
      console.log(`   Consensus: ${(result.consensusRate * 100).toFixed(1)}%`);
      if (result.throughput > 0) {
        console.log(`   Throughput: ${result.throughput.toFixed(2)} req/s`);
      }
      console.log();
    }

    console.log('='.repeat(60));
    console.log(chalk.bold.green('🎉 F1 MOA System Benchmark Complete!\n'));
  }

  async shutdown(): Promise<void> {
    await this.coordinator.shutdown();
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new F1Benchmark();
  
  benchmark.initialize()
    .then(() => benchmark.runAllBenchmarks())
    .then(() => benchmark.shutdown())
    .catch(error => {
      console.error(chalk.red('❌ Benchmark failed:'), error);
      process.exit(1);
    });
}

export { F1Benchmark };