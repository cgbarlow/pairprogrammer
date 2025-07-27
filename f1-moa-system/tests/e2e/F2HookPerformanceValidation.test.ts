// F2 Hook Performance Validation - Benchmarking and Load Testing
// Validates <50ms guarantee and production performance requirements

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { F2HookManager } from '../../src/hooks/HookManager.js';
import { MOACoordinator } from '../../src/agents/MOACoordinator.js';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import type {
  HookEvent,
  HookResult,
  F2HookConfiguration,
  HookPerformanceMetrics
} from '../../src/hooks/types.js';

describe('F2 Hook Performance Validation - Production Benchmarks', () => {
  let hookManager: F2HookManager;
  let moaCoordinator: MOACoordinator;

  const STRICT_PERFORMANCE_TARGETS = {
    HOOK_PROCESSING_MAX: 50,       // ms - Absolute maximum
    CRITICAL_HOOK_MAX: 20,         // ms - Critical path maximum
    BATCH_EFFICIENCY_MIN: 2.0,     // Minimum speedup ratio
    CACHE_HIT_RATIO_MIN: 0.6,      // Minimum cache effectiveness
    SUCCESS_RATE_MIN: 0.98,        // Minimum success rate
    THROUGHPUT_MIN: 100,           // Minimum hooks/second
    P95_PROCESSING_TIME: 40,       // 95th percentile target
    P99_PROCESSING_TIME: 45        // 99th percentile target
  };

  const testConfiguration: F2HookConfiguration = {
    claude: {
      agents: [],
      swarm: {
        topology: 'mesh',
        maxAgents: 8,
        strategy: 'adaptive',
        coordination: {
          consensusThreshold: 0.7,
          maxCoordinationTime: 500,
          fallbackStrategy: 'majority'
        }
      },
      hooks: {
        enabled: true,
        maxProcessingTime: 50,
        parallelExecution: true,
        cacheEnabled: true,
        defaultPriority: 'medium',
        errorHandling: {
          retryCount: 1,
          retryDelay: 50,
          fallbackEnabled: true,
          circuitBreakerEnabled: true,
          circuitBreakerThreshold: 0.5
        }
      },
      performance: {
        maxMemoryUsage: 1024,
        maxCpuUsage: 90,
        performanceMonitoring: true,
        metricsRetention: 24 * 60 * 60 * 1000,
        optimizationEnabled: true
      },
      environment: {
        name: 'performance-test',
        variables: {},
        features: ['hooks', 'moa-integration', 'performance-monitoring'],
        restrictions: []
      }
    },
    hooks: {
      hooks: [],
      settings: {
        maxProcessingTime: 50,
        parallelExecution: true,
        cacheEnabled: true,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          initialDelay: 50,
          maxDelay: 100
        },
        circuitBreaker: {
          enabled: true,
          threshold: 0.5,
          timeout: 5000,
          resetTimeout: 30000
        },
        monitoring: {
          enabled: true,
          metricsInterval: 500,
          logLevel: 'warn',
          tracing: true
        }
      },
      environments: [],
      version: '2.0.0',
      metadata: {
        version: '2.0.0',
        createdAt: Date.now(),
        lastModified: Date.now(),
        author: 'F2 Performance Test',
        description: 'Performance testing configuration'
      }
    },
    performance: {
      maxHookProcessingTime: 50,
      maxConcurrentHooks: 50,
      cacheSize: 2000,
      metricsRetention: 24 * 60 * 60 * 1000,
      optimizationInterval: 2 * 60 * 1000
    },
    security: {
      sandboxEnabled: true,
      permissionValidation: true,
      auditLogging: false, // Disabled for performance testing
      encryptionEnabled: false,
      trustedSources: ['built-in', 'config', 'dynamic']
    }
  };

  beforeAll(async () => {
    console.log('🚀 Setting up F2 Hook Performance Validation environment...');
    
    moaCoordinator = new MOACoordinator();
    await moaCoordinator.initialize();
    
    hookManager = new F2HookManager(moaCoordinator, testConfiguration);
    await hookManager.initialize();
    
    console.log('✅ F2 Hook Performance environment ready');
  });

  afterAll(async () => {
    await hookManager.shutdown();
    await moaCoordinator.shutdown();
    console.log('✅ F2 Hook Performance validation complete');
  });

  describe('⚡ Core Performance Benchmarks', () => {
    it('should consistently process hooks under 50ms guarantee', async () => {
      const benchmarkRuns = 100;
      const results: number[] = [];

      for (let i = 0; i < benchmarkRuns; i++) {
        const event: HookEvent = {
          type: 'pre-edit',
          phase: 'pre',
          operation: 'file-write',
          context: {
            operationType: 'file-write',
            filePath: `/benchmark/file-${i}.js`,
            sessionId: `benchmark-${i}`,
            environment: 'performance-test',
            metadata: { run: i }
          },
          timestamp: Date.now(),
          priority: 'medium'
        };

        const startTime = performance.now();
        const result = await hookManager.processHook(event);
        const processingTime = performance.now() - startTime;

        expect(result.success).toBe(true);
        expect(result.processingTime).toBeLessThan(STRICT_PERFORMANCE_TARGETS.HOOK_PROCESSING_MAX);
        expect(processingTime).toBeLessThan(STRICT_PERFORMANCE_TARGETS.HOOK_PROCESSING_MAX);
        
        results.push(result.processingTime);
      }

      // Calculate percentiles
      const sortedResults = results.sort((a, b) => a - b);
      const p50 = sortedResults[Math.floor(benchmarkRuns * 0.5)];
      const p95 = sortedResults[Math.floor(benchmarkRuns * 0.95)];
      const p99 = sortedResults[Math.floor(benchmarkRuns * 0.99)];
      const max = Math.max(...results);
      const avg = results.reduce((sum, val) => sum + val, 0) / results.length;

      expect(p95).toBeLessThan(STRICT_PERFORMANCE_TARGETS.P95_PROCESSING_TIME);
      expect(p99).toBeLessThan(STRICT_PERFORMANCE_TARGETS.P99_PROCESSING_TIME);
      expect(max).toBeLessThan(STRICT_PERFORMANCE_TARGETS.HOOK_PROCESSING_MAX);

      console.log(`⚡ Performance benchmark (${benchmarkRuns} runs):`);
      console.log(`   📊 P50: ${p50.toFixed(2)}ms | P95: ${p95.toFixed(2)}ms | P99: ${p99.toFixed(2)}ms`);
      console.log(`   📈 Avg: ${avg.toFixed(2)}ms | Max: ${max.toFixed(2)}ms`);
      console.log(`   🎯 All targets met: P95 <${STRICT_PERFORMANCE_TARGETS.P95_PROCESSING_TIME}ms, P99 <${STRICT_PERFORMANCE_TARGETS.P99_PROCESSING_TIME}ms`);
    });

    it('should maintain critical hook fast path under 20ms', async () => {
      const criticalRuns = 50;
      const criticalResults: number[] = [];

      for (let i = 0; i < criticalRuns; i++) {
        const criticalEvent: HookEvent = {
          type: 'pre-command',
          phase: 'pre',
          operation: 'command-execute',
          context: {
            operationType: 'command-execute',
            command: `critical-command-${i}`,
            sessionId: `critical-${i}`,
            environment: 'performance-test',
            metadata: { critical: true, run: i }
          },
          timestamp: Date.now(),
          priority: 'critical'
        };

        const result = await hookManager.processHook(criticalEvent);
        
        expect(result.success).toBe(true);
        expect(result.processingTime).toBeLessThan(STRICT_PERFORMANCE_TARGETS.CRITICAL_HOOK_MAX);
        
        criticalResults.push(result.processingTime);
      }

      const avgCritical = criticalResults.reduce((sum, val) => sum + val, 0) / criticalResults.length;
      const maxCritical = Math.max(...criticalResults);

      expect(avgCritical).toBeLessThan(STRICT_PERFORMANCE_TARGETS.CRITICAL_HOOK_MAX);
      expect(maxCritical).toBeLessThan(STRICT_PERFORMANCE_TARGETS.CRITICAL_HOOK_MAX);

      console.log(`⚡ Critical hook performance (${criticalRuns} runs):`);
      console.log(`   ⏱️ Average: ${avgCritical.toFixed(2)}ms | Maximum: ${maxCritical.toFixed(2)}ms`);
      console.log(`   🎯 Fast path target: <${STRICT_PERFORMANCE_TARGETS.CRITICAL_HOOK_MAX}ms`);
    });

    it('should achieve minimum throughput under load', async () => {
      const loadTestDuration = 5000; // 5 seconds
      const events: HookEvent[] = [];
      let completedHooks = 0;

      // Generate continuous load
      const startTime = Date.now();
      const loadGenerator = setInterval(() => {
        if (Date.now() - startTime >= loadTestDuration) {
          clearInterval(loadGenerator);
          return;
        }

        const event: HookEvent = {
          type: 'post-edit',
          phase: 'post',
          operation: 'file-write',
          context: {
            operationType: 'file-write',
            filePath: `/load/file-${events.length}.js`,
            sessionId: 'load-test',
            environment: 'performance-test',
            metadata: { loadTest: true }
          },
          timestamp: Date.now(),
          priority: 'medium'
        };

        events.push(event);
        hookManager.processHook(event).then(() => {
          completedHooks++;
        });
      }, 10); // Create event every 10ms

      // Wait for load test completion
      await new Promise(resolve => setTimeout(resolve, loadTestDuration + 1000));

      const actualDuration = (Date.now() - startTime) / 1000; // seconds
      const throughput = completedHooks / actualDuration;

      expect(throughput).toBeGreaterThan(STRICT_PERFORMANCE_TARGETS.THROUGHPUT_MIN);

      console.log(`🚀 Load test results:`);
      console.log(`   📊 Throughput: ${throughput.toFixed(1)} hooks/second`);
      console.log(`   📈 Completed: ${completedHooks} / ${events.length} hooks`);
      console.log(`   🎯 Target: >${STRICT_PERFORMANCE_TARGETS.THROUGHPUT_MIN} hooks/second`);
    });
  });

  describe('📦 Batch Processing Efficiency', () => {
    it('should demonstrate significant batch processing speedup', async () => {
      const batchSizes = [10, 25, 50, 100];
      
      for (const batchSize of batchSizes) {
        const events = Array.from({ length: batchSize }, (_, i) => ({
          type: 'post-task' as const,
          phase: 'post' as const,
          operation: 'agent-coordinate' as const,
          context: {
            operationType: 'agent-coordinate' as const,
            sessionId: `batch-efficiency-${batchSize}`,
            environment: 'performance-test',
            metadata: { batchSize, index: i }
          },
          timestamp: Date.now(),
          priority: 'medium' as const
        }));

        // Sequential processing benchmark
        const seqStart = performance.now();
        const sequentialResults = [];
        for (const event of events) {
          const result = await hookManager.processHook(event);
          sequentialResults.push(result);
        }
        const sequentialTime = performance.now() - seqStart;

        // Batch processing benchmark
        const batchStart = performance.now();
        const batchResults = await hookManager.processBatch(events);
        const batchTime = performance.now() - batchStart;

        // Calculate efficiency
        const speedupRatio = sequentialTime / batchTime;
        expect(speedupRatio).toBeGreaterThan(STRICT_PERFORMANCE_TARGETS.BATCH_EFFICIENCY_MIN);

        console.log(`📦 Batch size ${batchSize}: ${speedupRatio.toFixed(2)}x speedup (${batchTime.toFixed(2)}ms vs ${sequentialTime.toFixed(2)}ms)`);
      }
    });

    it('should optimize mixed priority batch processing', async () => {
      const mixedBatch = [
        // Critical (should be processed first)
        ...Array.from({ length: 3 }, (_, i) => ({
          type: 'pre-command' as const,
          phase: 'pre' as const,
          operation: 'command-execute' as const,
          context: {
            operationType: 'command-execute' as const,
            command: `critical-${i}`,
            sessionId: 'mixed-batch',
            environment: 'performance-test',
            metadata: { priority: 'critical', index: i }
          },
          timestamp: Date.now(),
          priority: 'critical' as const
        })),
        // High priority
        ...Array.from({ length: 7 }, (_, i) => ({
          type: 'pre-edit' as const,
          phase: 'pre' as const,
          operation: 'file-write' as const,
          context: {
            operationType: 'file-write' as const,
            filePath: `/mixed/high-${i}.js`,
            sessionId: 'mixed-batch',
            environment: 'performance-test',
            metadata: { priority: 'high', index: i }
          },
          timestamp: Date.now(),
          priority: 'high' as const
        })),
        // Medium priority
        ...Array.from({ length: 10 }, (_, i) => ({
          type: 'post-task' as const,
          phase: 'post' as const,
          operation: 'agent-coordinate' as const,
          context: {
            operationType: 'agent-coordinate' as const,
            sessionId: 'mixed-batch',
            environment: 'performance-test',
            metadata: { priority: 'medium', index: i }
          },
          timestamp: Date.now(),
          priority: 'medium' as const
        }))
      ];

      const startTime = performance.now();
      const results = await hookManager.processBatch(mixedBatch);
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(20);
      
      // Critical hooks should complete fastest
      const criticalResults = results.slice(0, 3);
      const avgCriticalTime = criticalResults.reduce((sum, r) => sum + r.processingTime, 0) / criticalResults.length;
      
      expect(avgCriticalTime).toBeLessThan(STRICT_PERFORMANCE_TARGETS.CRITICAL_HOOK_MAX);
      expect(totalTime).toBeLessThan(500); // Total batch should complete quickly

      console.log(`⚖️ Mixed batch processing: ${totalTime.toFixed(2)}ms total, ${avgCriticalTime.toFixed(2)}ms avg critical`);
    });
  });

  describe('💾 Cache Performance Validation', () => {
    it('should achieve minimum cache hit ratio', async () => {
      const cacheTestEvents = Array.from({ length: 20 }, (_, i) => ({
        type: 'pre-search' as const,
        phase: 'pre' as const,
        operation: 'file-read' as const,
        context: {
          operationType: 'file-read' as const,
          filePath: `/cache/test-${i % 5}.js`, // Repeat filenames to create cache opportunities
          sessionId: 'cache-test',
          environment: 'performance-test',
          metadata: { cacheTest: true, index: i }
        },
        timestamp: Date.now(),
        priority: 'low' as const // Low priority events are cached
      }));

      // Process events to populate cache
      for (const event of cacheTestEvents) {
        await hookManager.processHook(event);
      }

      const metrics = hookManager.getPerformanceMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(STRICT_PERFORMANCE_TARGETS.CACHE_HIT_RATIO_MIN);

      console.log(`💾 Cache performance: ${(metrics.cacheHitRate * 100).toFixed(1)}% hit ratio (target: >${(STRICT_PERFORMANCE_TARGETS.CACHE_HIT_RATIO_MIN * 100).toFixed(1)}%)`);
    });

    it('should demonstrate cache performance benefits', async () => {
      const cacheableEvent: HookEvent = {
        type: 'pre-search',
        phase: 'pre',
        operation: 'file-read',
        context: {
          operationType: 'file-read',
          filePath: '/cache/performance-test.js',
          sessionId: 'cache-perf-test',
          environment: 'performance-test',
          metadata: { cachePerfTest: true }
        },
        timestamp: Date.now(),
        priority: 'low'
      };

      // First request (cache miss)
      const firstResult = await hookManager.processHook(cacheableEvent);
      expect(firstResult.success).toBe(true);
      expect(firstResult.metadata.cacheHit).toBeFalsy();

      // Second request (should be cached)
      const secondResult = await hookManager.processHook(cacheableEvent);
      expect(secondResult.success).toBe(true);
      expect(secondResult.metadata.cacheHit).toBe(true);

      // Cache should be significantly faster
      const speedupRatio = firstResult.processingTime / secondResult.processingTime;
      expect(speedupRatio).toBeGreaterThan(2.0); // At least 2x faster

      console.log(`🏎️ Cache speedup: ${speedupRatio.toFixed(2)}x faster (${secondResult.processingTime.toFixed(2)}ms vs ${firstResult.processingTime.toFixed(2)}ms)`);
    });
  });

  describe('📈 Memory and Resource Efficiency', () => {
    it('should maintain stable memory usage under continuous load', async () => {
      const initialMemory = process.memoryUsage();
      const loadEvents = 1000;
      
      // Process large number of events
      const events = Array.from({ length: loadEvents }, (_, i) => ({
        type: 'post-edit' as const,
        phase: 'post' as const,
        operation: 'file-write' as const,
        context: {
          operationType: 'file-write' as const,
          filePath: `/memory/test-${i}.js`,
          sessionId: 'memory-test',
          environment: 'performance-test',
          metadata: { memoryTest: true, index: i }
        },
        timestamp: Date.now(),
        priority: 'medium' as const
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        events.map(event => hookManager.processHook(event))
      );
      const processingTime = performance.now() - startTime;

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerHook = memoryIncrease / loadEvents;

      // All hooks should succeed
      expect(results).toHaveLength(loadEvents);
      results.forEach(result => expect(result.success).toBe(true));

      // Memory usage should be reasonable
      expect(memoryIncreasePerHook).toBeLessThan(10 * 1024); // <10KB per hook
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // <50MB total increase

      console.log(`💾 Memory efficiency test (${loadEvents} hooks):`);
      console.log(`   📊 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB total`);
      console.log(`   📈 Per hook: ${(memoryIncreasePerHook / 1024).toFixed(2)}KB`);
      console.log(`   ⏱️ Processing time: ${processingTime.toFixed(2)}ms`);
    });

    it('should demonstrate efficient resource cleanup', async () => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const beforeMemory = process.memoryUsage();
      
      // Create and process many events
      const cleanupEvents = Array.from({ length: 500 }, (_, i) => ({
        type: 'post-task' as const,
        phase: 'post' as const,
        operation: 'agent-coordinate' as const,
        context: {
          operationType: 'agent-coordinate' as const,
          sessionId: `cleanup-${i}`,
          environment: 'performance-test',
          metadata: { cleanup: true, index: i }
        },
        timestamp: Date.now(),
        priority: 'medium' as const
      }));

      await Promise.all(cleanupEvents.map(event => hookManager.processHook(event)));

      // Force garbage collection again
      if (global.gc) {
        global.gc();
      }

      const afterMemory = process.memoryUsage();
      const memoryDelta = afterMemory.heapUsed - beforeMemory.heapUsed;

      // Memory increase should be minimal after cleanup
      expect(memoryDelta).toBeLessThan(20 * 1024 * 1024); // <20MB

      console.log(`🧹 Resource cleanup: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB memory delta after 500 hooks`);
    });
  });

  describe('🎯 Production Performance Summary', () => {
    it('should meet all strict performance requirements', async () => {
      const metrics = hookManager.getPerformanceMetrics();
      
      const performanceSummary = {
        avgProcessingTime: metrics.avgProcessingTime,
        maxProcessingTime: metrics.maxProcessingTime,
        successRate: metrics.successRate,
        errorRate: metrics.errorRate,
        cacheHitRate: metrics.cacheHitRate,
        totalHooksProcessed: metrics.totalHooksProcessed
      };

      // Validate all strict requirements
      expect(performanceSummary.avgProcessingTime).toBeLessThan(STRICT_PERFORMANCE_TARGETS.HOOK_PROCESSING_MAX);
      expect(performanceSummary.maxProcessingTime).toBeLessThan(STRICT_PERFORMANCE_TARGETS.HOOK_PROCESSING_MAX);
      expect(performanceSummary.successRate).toBeGreaterThan(STRICT_PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
      expect(performanceSummary.errorRate).toBeLessThan(1 - STRICT_PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
      expect(performanceSummary.cacheHitRate).toBeGreaterThan(STRICT_PERFORMANCE_TARGETS.CACHE_HIT_RATIO_MIN);

      console.log('🎯 F2 HOOK PERFORMANCE VALIDATION SUMMARY:');
      console.log(`   ⚡ Processing Time: ${performanceSummary.avgProcessingTime.toFixed(2)}ms avg, ${performanceSummary.maxProcessingTime.toFixed(2)}ms max`);
      console.log(`   📊 Success Rate: ${(performanceSummary.successRate * 100).toFixed(2)}% (target: >${(STRICT_PERFORMANCE_TARGETS.SUCCESS_RATE_MIN * 100).toFixed(1)}%)`);
      console.log(`   💾 Cache Hit Rate: ${(performanceSummary.cacheHitRate * 100).toFixed(1)}% (target: >${(STRICT_PERFORMANCE_TARGETS.CACHE_HIT_RATIO_MIN * 100).toFixed(1)}%)`);
      console.log(`   📈 Total Hooks Processed: ${performanceSummary.totalHooksProcessed}`);
      console.log('   🏆 ALL STRICT PERFORMANCE TARGETS ACHIEVED');
      console.log('   ✅ F2 HOOK SYSTEM PERFORMANCE VALIDATED FOR PRODUCTION');
    });
  });
});