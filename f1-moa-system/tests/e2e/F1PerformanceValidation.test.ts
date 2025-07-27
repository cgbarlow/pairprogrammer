// F1 MOA System - Performance Validation & Load Testing
// Final validation for production deployment

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MOACoordinator } from '../../src/agents/MOACoordinator.js';
import { ASTAnalyzer } from '../../src/ast/ASTAnalyzer.js';
import type { MOARequest, AgentType } from '../../src/types/index.js';

describe('F1 MOA System - Performance Validation Tests', () => {
  let coordinator: MOACoordinator;
  let astAnalyzer: ASTAnalyzer;
  
  const PERFORMANCE_TARGETS = {
    CONSENSUS_TIME: 300,
    SINGULAR_TIME: 200,
    CONCURRENT_LIMIT: 10,
    SUCCESS_RATE: 0.95,
    THROUGHPUT: 10 // requests/second
  };

  beforeAll(async () => {
    console.log('🚀 Initializing performance validation environment...');
    
    coordinator = new MOACoordinator();
    await coordinator.initialize();
    
    astAnalyzer = new ASTAnalyzer();
    await astAnalyzer.initialize();
    
    console.log('✅ Performance test environment ready');
  });
  
  afterAll(async () => {
    await coordinator.shutdown();
    console.log('✅ Performance test cleanup complete');
  });

  describe('⚡ Core Performance Validation', () => {
    it('should achieve <300ms consensus time consistently', async () => {
      const testRequests = Array.from({ length: 10 }, (_, i) => ({
        id: `consensus-perf-${i}`,
        prompt: `Performance test ${i}: Quick architecture review`,
        consensusThreshold: 0.6
      }));

      const responseTimes: number[] = [];
      
      for (const request of testRequests) {
        const response = await coordinator.processRequest(request);
        responseTimes.push(response.result.processingTime);
        
        // Each individual request should meet target
        expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
        expect(response.result.confidence).toBeGreaterThan(0.6);
        expect(response.agentResponses).toHaveLength(6);
      }

      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const p95Time = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
      
      expect(avgTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      expect(p95Time).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      
      console.log(`✅ Consensus performance: avg ${avgTime.toFixed(1)}ms, max ${maxTime}ms, p95 ${p95Time}ms`);
    });

    it('should achieve <200ms singular mode consistently', async () => {
      const testRequests = Array.from({ length: 10 }, (_, i) => ({
        id: `singular-perf-${i}`,
        prompt: `Quick validation ${i}: Simple code review`,
        requiredAgentTypes: ['coder'] as AgentType[]
      }));

      const responseTimes: number[] = [];
      
      for (const request of testRequests) {
        const response = await coordinator.processRequest(request);
        responseTimes.push(response.result.processingTime);
        
        expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.SINGULAR_TIME);
        expect(response.agentResponses).toHaveLength(1);
      }

      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      
      expect(avgTime).toBeLessThan(PERFORMANCE_TARGETS.SINGULAR_TIME);
      
      console.log(`✅ Singular mode performance: avg ${avgTime.toFixed(1)}ms, max ${maxTime}ms`);
    });

    it('should handle concurrent requests without degradation', async () => {
      const concurrentCount = PERFORMANCE_TARGETS.CONCURRENT_LIMIT;
      const requests = Array.from({ length: concurrentCount }, (_, i) => ({
        id: `concurrent-${i}`,
        prompt: `Concurrent test ${i}: System analysis`,
        consensusThreshold: 0.6
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => coordinator.processRequest(req))
      );
      const totalTime = Date.now() - startTime;

      // All should succeed
      expect(responses).toHaveLength(concurrentCount);
      responses.forEach((response, i) => {
        expect(response.result.confidence).toBeGreaterThan(0.6);
        expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME * 1.5); // Allow some overhead for concurrency
      });

      // Should be faster than sequential
      const estimatedSequential = responses.reduce((sum, r) => sum + r.result.processingTime, 0);
      expect(totalTime).toBeLessThan(estimatedSequential * 0.8); // At least 20% improvement

      const throughput = concurrentCount / (totalTime / 1000);
      expect(throughput).toBeGreaterThan(PERFORMANCE_TARGETS.THROUGHPUT);
      
      console.log(`✅ Concurrent processing: ${totalTime}ms for ${concurrentCount} requests, ${throughput.toFixed(1)} req/s`);
    });
  });

  describe('🧠 Agent Coordination Performance', () => {
    it('should spawn all 6 agents efficiently', async () => {
      const startTime = Date.now();
      
      // Get fresh coordinator to test initialization
      const newCoordinator = new MOACoordinator();
      await newCoordinator.initialize();
      
      const initTime = Date.now() - startTime;
      const agents = newCoordinator.getAgentStatus();
      
      expect(agents).toHaveLength(6);
      expect(initTime).toBeLessThan(1000); // Should initialize quickly
      
      // Clean up
      await newCoordinator.shutdown();
      
      console.log(`✅ Agent spawning: ${initTime}ms for 6 agents`);
    });

    it('should demonstrate parallel vs sequential agent processing', async () => {
      const testPrompt = 'Analyze this architecture pattern for scalability issues';
      
      // Time parallel processing (normal mode)
      const parallelStart = Date.now();
      const parallelResponse = await coordinator.processRequest({
        id: 'parallel-test',
        prompt: testPrompt,
        consensusThreshold: 0.7
      });
      const parallelTime = Date.now() - parallelStart;
      
      // Verify all 6 agents participated
      expect(parallelResponse.agentResponses).toHaveLength(6);
      expect(parallelResponse.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      
      // Compare to estimated sequential time (sum of individual response times)
      const estimatedSequential = parallelResponse.agentResponses.reduce(
        (sum, resp) => sum + (resp.metadata?.responseTime || 100), 0
      );
      
      // Parallel should be significantly faster
      expect(parallelTime).toBeLessThan(estimatedSequential * 0.5);
      
      console.log(`✅ Parallel efficiency: ${parallelTime}ms actual vs ${estimatedSequential}ms estimated sequential`);
    });

    it('should maintain agent performance under load', async () => {
      const loadTestRequests = Array.from({ length: 30 }, (_, i) => ({
        id: `agent-load-${i}`,
        prompt: `Load test ${i}: Complex system evaluation`,
        consensusThreshold: 0.6
      }));

      const agentPerformanceBefore = coordinator.getAgentStatus().map(a => ({
        id: a.id,
        responseTime: a.performance.responseTime
      }));

      // Process all requests
      const responses = await Promise.allSettled(
        loadTestRequests.map(req => coordinator.processRequest(req))
      );

      const successCount = responses.filter(r => r.status === 'fulfilled').length;
      const successRate = successCount / loadTestRequests.length;
      
      expect(successRate).toBeGreaterThan(PERFORMANCE_TARGETS.SUCCESS_RATE);
      
      const agentPerformanceAfter = coordinator.getAgentStatus().map(a => ({
        id: a.id,
        responseTime: a.performance.responseTime
      }));

      // Agent performance should not degrade significantly
      agentPerformanceBefore.forEach((before, i) => {
        const after = agentPerformanceAfter[i];
        expect(after.responseTime).toBeLessThan(before.responseTime * 2); // Max 2x degradation
      });
      
      console.log(`✅ Agent load test: ${successRate * 100}% success rate under ${loadTestRequests.length} requests`);
    });
  });

  describe('🌳 AST Performance Validation', () => {
    it('should parse JavaScript quickly', async () => {
      const jsCode = `
        class DataProcessor {
          constructor(config) {
            this.config = config;
            this.cache = new Map();
          }
          
          async process(data) {
            const results = [];
            for (const item of data) {
              if (this.cache.has(item.id)) {
                results.push(this.cache.get(item.id));
              } else {
                const processed = await this.transform(item);
                this.cache.set(item.id, processed);
                results.push(processed);
              }
            }
            return results;
          }
          
          transform(item) {
            return new Promise((resolve) => {
              setTimeout(() => resolve(item.value * 2), 10);
            });
          }
        }
      `;

      const startTime = Date.now();
      const analysis = await astAnalyzer.analyze(jsCode, 'javascript');
      const parseTime = Date.now() - startTime;

      expect(analysis.language).toBe('javascript');
      expect(analysis.nodes.length).toBeGreaterThan(20);
      expect(parseTime).toBeLessThan(50); // Very fast parsing
      expect(analysis.complexity).toBeGreaterThan(3);
      
      console.log(`✅ JS AST performance: ${parseTime}ms for ${jsCode.length} chars, ${analysis.nodes.length} nodes`);
    });

    it('should handle multiple languages efficiently', async () => {
      const codesamples = [
        { code: 'function test() { return "js"; }', lang: 'javascript' },
        { code: 'interface Test { value: string; }', lang: 'typescript' },
        { code: 'def test(): return "python"', lang: 'python' }
      ];

      const startTime = Date.now();
      const analyses = await Promise.all(
        codesamples.map(({ code, lang }) => astAnalyzer.analyze(code, lang))
      );
      const totalTime = Date.now() - startTime;

      expect(analyses).toHaveLength(3);
      analyses.forEach((analysis, i) => {
        expect(analysis.language).toBe(codesamples[i].lang);
        expect(analysis.nodes.length).toBeGreaterThan(0);
      });

      expect(totalTime).toBeLessThan(100); // All languages under 100ms
      
      console.log(`✅ Multi-language AST: ${totalTime}ms for ${codesamples.length} languages`);
    });
  });

  describe('📊 System Scalability Metrics', () => {
    it('should handle burst traffic efficiently', async () => {
      // Simulate burst of requests
      const burstSize = 15;
      const burstRequests = Array.from({ length: burstSize }, (_, i) => ({
        id: `burst-${i}`,
        prompt: `Burst request ${i}: Rapid analysis needed`,
        consensusThreshold: 0.5 // Lower threshold for speed
      }));

      const startTime = Date.now();
      
      // Send all at once (burst)
      const burstPromises = burstRequests.map(req => coordinator.processRequest(req));
      const responses = await Promise.all(burstPromises);
      
      const totalTime = Date.now() - startTime;
      const avgResponseTime = responses.reduce((sum, r) => sum + r.processingTime, 0) / responses.length;
      const throughput = burstSize / (totalTime / 1000);

      expect(responses).toHaveLength(burstSize);
      expect(avgResponseTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      expect(throughput).toBeGreaterThan(PERFORMANCE_TARGETS.THROUGHPUT);
      
      // Verify all succeeded with reasonable confidence
      responses.forEach(response => {
        expect(response.result.confidence).toBeGreaterThan(0.5);
      });
      
      console.log(`✅ Burst traffic: ${burstSize} requests in ${totalTime}ms, ${throughput.toFixed(1)} req/s, ${avgResponseTime.toFixed(1)}ms avg`);
    });

    it('should demonstrate system resource efficiency', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Process several requests to load the system
      const workloadRequests = Array.from({ length: 20 }, (_, i) => ({
        id: `workload-${i}`,
        prompt: `Workload test ${i}: System analysis with moderate complexity`,
        consensusThreshold: 0.6
      }));

      await Promise.all(workloadRequests.map(req => coordinator.processRequest(req)));
      
      const memoryAfter = process.memoryUsage();
      const metrics = coordinator.getSystemMetrics();
      
      // Memory should not have excessive growth
      const memoryGrowth = memoryAfter.heapUsed - memoryBefore.heapUsed;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);
      
      expect(memoryGrowthMB).toBeLessThan(50); // Less than 50MB growth
      expect(metrics.successRate).toBeGreaterThan(PERFORMANCE_TARGETS.SUCCESS_RATE);
      expect(metrics.avgResponseTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      
      console.log(`✅ Resource efficiency: ${memoryGrowthMB.toFixed(1)}MB memory growth, ${metrics.avgResponseTime.toFixed(1)}ms avg response`);
    });

    it('should provide comprehensive performance summary', () => {
      const metrics = coordinator.getSystemMetrics();
      const agents = coordinator.getAgentStatus();
      const supportedLanguages = astAnalyzer.getSupportedLanguages();
      
      const summary = {
        totalRequests: metrics.totalRequests,
        avgResponseTime: metrics.avgResponseTime,
        successRate: metrics.successRate,
        activeAgents: agents.length,
        consensusRate: metrics.consensusRate,
        languageSupport: supportedLanguages.length,
        systemHealth: 'operational'
      };

      // Validate all performance targets
      expect(summary.avgResponseTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      expect(summary.successRate).toBeGreaterThan(PERFORMANCE_TARGETS.SUCCESS_RATE);
      expect(summary.activeAgents).toBe(6);
      expect(summary.languageSupport).toBeGreaterThanOrEqual(5);
      
      console.log('🎯 FINAL PERFORMANCE SUMMARY:');
      console.log(`   📊 Total Requests: ${summary.totalRequests}`);
      console.log(`   ⚡ Avg Response Time: ${summary.avgResponseTime.toFixed(1)}ms (target: <${PERFORMANCE_TARGETS.CONSENSUS_TIME}ms)`);
      console.log(`   ✅ Success Rate: ${(summary.successRate * 100).toFixed(1)}% (target: >${PERFORMANCE_TARGETS.SUCCESS_RATE * 100}%)`);
      console.log(`   🤖 Active Agents: ${summary.activeAgents}/6`);
      console.log(`   🤝 Consensus Rate: ${(summary.consensusRate * 100).toFixed(1)}%`);
      console.log(`   🌳 AST Languages: ${summary.languageSupport} supported`);
      console.log(`   💚 System Health: ${summary.systemHealth.toUpperCase()}`);
      console.log('   🚀 PERFORMANCE VALIDATION: ALL TARGETS MET');
    });
  });
});