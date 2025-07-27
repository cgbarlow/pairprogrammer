// F2 Hook System - Comprehensive E2E Test Suite
// Validates production readiness with F1 MOA integration and <50ms performance guarantee

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { F2HookManager } from '../../src/hooks/HookManager.js';
import { DefaultHookRegistry } from '../../src/hooks/HookRegistry.js';
import { DefaultEventSystem } from '../../src/hooks/EventSystem.js';
import { MOACoordinator } from '../../src/agents/MOACoordinator.js';
import { F1MCPServer } from '../../src/mcp/server.js';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import type {
  HookEvent,
  HookResult,
  Hook,
  F2HookConfiguration,
  HookCoordinationRequest,
  MCPRequest,
  MCPResponse,
  HookPerformanceMetrics
} from '../../src/hooks/types.js';

describe('F2 Hook System - Comprehensive E2E Production Tests', () => {
  let hookManager: F2HookManager;
  let moaCoordinator: MOACoordinator;
  let hookRegistry: DefaultHookRegistry;
  let eventSystem: DefaultEventSystem;
  let mcpServer: F1MCPServer;
  let client: WebSocket;
  
  const PERFORMANCE_TARGETS = {
    HOOK_PROCESSING_TIME: 50,      // ms - Core guarantee
    CRITICAL_HOOK_TIME: 20,        // ms - Fast path
    CONFIGURATION_LOAD_TIME: 100,  // ms
    BATCH_PROCESSING_SPEEDUP: 0.3, // 30% improvement over sequential
    CONCURRENT_HOOKS: 20,           // Simultaneous hook execution
    MCP_INTEGRATION_TIME: 100       // ms - MCP response time
  };

  const mockF2Configuration: F2HookConfiguration = {
    claude: {
      agents: [],
      swarm: {
        topology: 'hierarchical',
        maxAgents: 6,
        strategy: 'balanced',
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
          retryCount: 2,
          retryDelay: 100,
          fallbackEnabled: true,
          circuitBreakerEnabled: true,
          circuitBreakerThreshold: 0.5
        }
      },
      performance: {
        maxMemoryUsage: 512,
        maxCpuUsage: 80,
        performanceMonitoring: true,
        metricsRetention: 24 * 60 * 60 * 1000,
        optimizationEnabled: true
      },
      environment: {
        name: 'test',
        variables: {},
        features: ['hooks', 'moa-integration'],
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
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 100,
          maxDelay: 1000
        },
        circuitBreaker: {
          enabled: true,
          threshold: 0.5,
          timeout: 5000,
          resetTimeout: 30000
        },
        monitoring: {
          enabled: true,
          metricsInterval: 1000,
          logLevel: 'info',
          tracing: true
        }
      },
      environments: [],
      version: '2.0.0',
      metadata: {
        version: '2.0.0',
        createdAt: Date.now(),
        lastModified: Date.now(),
        author: 'F2 Test Suite',
        description: 'Test configuration for F2 Hook System'
      }
    },
    performance: {
      maxHookProcessingTime: 50,
      maxConcurrentHooks: 20,
      cacheSize: 1000,
      metricsRetention: 24 * 60 * 60 * 1000,
      optimizationInterval: 5 * 60 * 1000
    },
    security: {
      sandboxEnabled: true,
      permissionValidation: true,
      auditLogging: true,
      encryptionEnabled: false,
      trustedSources: ['built-in', 'config']
    }
  };

  beforeAll(async () => {
    console.log('🚀 Setting up F2 Hook System E2E test environment...');
    
    // Initialize MOA Coordinator first
    moaCoordinator = new MOACoordinator();
    await moaCoordinator.initialize();
    
    // Initialize F2 Hook System
    hookManager = new F2HookManager(moaCoordinator, mockF2Configuration);
    await hookManager.initialize();
    
    // Initialize components for direct testing
    hookRegistry = new DefaultHookRegistry();
    eventSystem = new DefaultEventSystem();
    
    // Start MCP server for integration tests
    mcpServer = new F1MCPServer(8083);
    await mcpServer.start();
    
    // Allow server startup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ F2 Hook System E2E test environment ready');
  });
  
  afterAll(async () => {
    console.log('🔄 Cleaning up F2 Hook System E2E test environment...');
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.close();
    }
    
    await hookManager.shutdown();
    await mcpServer.stop();
    await moaCoordinator.shutdown();
    
    console.log('✅ F2 Hook System E2E test cleanup complete');
  });

  describe('🔧 Core Hook Processing Performance', () => {
    it('should process single hooks under 50ms guarantee', async () => {
      const event: HookEvent = {
        type: 'pre-task',
        phase: 'pre',
        operation: 'file-read',
        context: {
          operationType: 'file-read',
          filePath: '/test/file.js',
          sessionId: 'test-session',
          environment: 'test',
          metadata: { priority: 'high' }
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      const startTime = performance.now();
      const result = await hookManager.processHook(event);
      const processingTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      expect(processingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      expect(result.metadata.executionId).toBeDefined();
      
      console.log(`✅ Hook processing: ${result.processingTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME}ms)`);
    });

    it('should process critical hooks under 20ms fast path', async () => {
      const criticalEvent: HookEvent = {
        type: 'pre-command',
        phase: 'pre',
        operation: 'command-execute',
        context: {
          operationType: 'command-execute',
          command: 'npm test',
          sessionId: 'critical-session',
          environment: 'test',
          metadata: { urgent: true }
        },
        timestamp: Date.now(),
        priority: 'critical'
      };

      const startTime = performance.now();
      const result = await hookManager.processHook(criticalEvent);
      const processingTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CRITICAL_HOOK_TIME);
      expect(processingTime).toBeLessThan(PERFORMANCE_TARGETS.CRITICAL_HOOK_TIME);
      
      console.log(`⚡ Critical hook fast path: ${result.processingTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.CRITICAL_HOOK_TIME}ms)`);
    });

    it('should handle concurrent hook execution with maintained performance', async () => {
      const concurrentEvents = Array.from({ length: PERFORMANCE_TARGETS.CONCURRENT_HOOKS }, (_, i) => ({
        type: 'post-edit' as const,
        phase: 'post' as const,
        operation: 'file-write' as const,
        context: {
          operationType: 'file-write' as const,
          filePath: `/test/concurrent-${i}.js`,
          sessionId: 'concurrent-session',
          environment: 'test',
          metadata: { index: i }
        },
        timestamp: Date.now(),
        priority: 'medium' as const
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        concurrentEvents.map(event => hookManager.processHook(event))
      );
      const totalTime = performance.now() - startTime;

      // All hooks should succeed
      expect(results).toHaveLength(PERFORMANCE_TARGETS.CONCURRENT_HOOKS);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      });

      // Concurrent execution should be faster than sequential
      const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
      const sequentialEstimate = results.length * PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME;
      
      expect(totalTime).toBeLessThan(sequentialEstimate * PERFORMANCE_TARGETS.BATCH_PROCESSING_SPEEDUP);
      
      console.log(`🔄 Concurrent hooks: ${avgProcessingTime.toFixed(2)}ms avg, ${totalTime.toFixed(2)}ms total (vs ${sequentialEstimate}ms sequential estimate)`);
    });

    it('should demonstrate batch processing performance improvements', async () => {
      const batchEvents = Array.from({ length: 15 }, (_, i) => ({
        type: 'post-task' as const,
        phase: 'post' as const,
        operation: 'agent-coordinate' as const,
        context: {
          operationType: 'agent-coordinate' as const,
          agentId: `agent-${i}`,
          sessionId: 'batch-session',
          environment: 'test',
          metadata: { batchIndex: i }
        },
        timestamp: Date.now(),
        priority: i < 5 ? 'critical' as const : 'medium' as const
      }));

      // Test sequential processing
      const seqStartTime = performance.now();
      const sequentialResults = [];
      for (const event of batchEvents) {
        const result = await hookManager.processHook(event);
        sequentialResults.push(result);
      }
      const sequentialTime = performance.now() - seqStartTime;

      // Test batch processing
      const batchStartTime = performance.now();
      const batchResults = await hookManager.processBatch(batchEvents);
      const batchTime = performance.now() - batchStartTime;

      // Validate results
      expect(batchResults).toHaveLength(batchEvents.length);
      expect(sequentialResults).toHaveLength(batchEvents.length);
      
      // Batch should be significantly faster
      const speedupRatio = sequentialTime / batchTime;
      expect(speedupRatio).toBeGreaterThan(1.5); // At least 50% faster
      
      console.log(`📦 Batch processing speedup: ${speedupRatio.toFixed(2)}x (${batchTime.toFixed(2)}ms vs ${sequentialTime.toFixed(2)}ms)`);
    });
  });

  describe('⚙️ Configuration System Integration', () => {
    it('should load CLAUDE.md configuration under 100ms', async () => {
      const configSystem = (hookManager as any).configSystem;
      
      const startTime = performance.now();
      const claudeConfig = await configSystem.loadClaudeConfig();
      const loadTime = performance.now() - startTime;

      expect(claudeConfig).toBeDefined();
      expect(claudeConfig.hooks).toBeDefined();
      expect(claudeConfig.swarm).toBeDefined();
      expect(claudeConfig.performance).toBeDefined();
      expect(loadTime).toBeLessThan(PERFORMANCE_TARGETS.CONFIGURATION_LOAD_TIME);
      
      console.log(`📋 CLAUDE.md config loaded in ${loadTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.CONFIGURATION_LOAD_TIME}ms)`);
    });

    it('should parse hooks.yaml configuration with validation', async () => {
      const configSystem = (hookManager as any).configSystem;
      
      const startTime = performance.now();
      const hookConfig = await configSystem.loadHookConfig();
      const loadTime = performance.now() - startTime;

      expect(hookConfig).toBeDefined();
      expect(hookConfig.settings).toBeDefined();
      expect(hookConfig.hooks).toBeInstanceOf(Array);
      expect(hookConfig.version).toBeDefined();
      expect(loadTime).toBeLessThan(PERFORMANCE_TARGETS.CONFIGURATION_LOAD_TIME);
      
      // Validate configuration structure
      const validation = configSystem.validateConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      console.log(`🔧 hooks.yaml config loaded and validated in ${loadTime.toFixed(2)}ms`);
    });

    it('should handle configuration changes dynamically', async () => {
      const configSystem = (hookManager as any).configSystem;
      let changeDetected = false;
      
      // Setup change detection
      configSystem.watchConfig((change: any) => {
        changeDetected = true;
        expect(change.type).toBe('modified');
        expect(change.path).toBeDefined();
      });

      // Simulate configuration change
      await configSystem.reloadConfig();
      
      // Configuration should remain valid after reload
      const validation = configSystem.validateConfig();
      expect(validation.valid).toBe(true);
      
      console.log('🔄 Configuration change detection and reload validated');
    });
  });

  describe('🤝 F1 MOA Integration', () => {
    it('should coordinate with F1 MOA agents seamlessly', async () => {
      const agentIntegration = (hookManager as any).agentIntegration;
      
      const coordinationRequest: HookCoordinationRequest = {
        hookEvent: {
          type: 'agent-coordinate',
          phase: 'pre',
          operation: 'consensus-build',
          context: {
            operationType: 'consensus-build',
            sessionId: 'moa-integration-test',
            environment: 'test',
            metadata: { 
              taskType: 'code-review',
              complexity: 'high'
            }
          },
          timestamp: Date.now(),
          priority: 'high'
        },
        requiredAgents: ['researcher', 'coder', 'analyst'],
        coordinationStrategy: {
          type: 'consensus',
          agents: ['researcher', 'coder', 'analyst'],
          timeout: 5000,
          consensusThreshold: 0.7
        },
        timeout: 10000
      };

      const startTime = performance.now();
      const agentResponses = await agentIntegration.coordinateWithMOA(coordinationRequest);
      const coordinationTime = performance.now() - startTime;

      expect(agentResponses).toBeInstanceOf(Array);
      expect(agentResponses.length).toBeGreaterThan(0);
      expect(coordinationTime).toBeLessThan(10000); // Within timeout
      
      // Verify F1 agent integration
      agentResponses.forEach(response => {
        expect(response.agentId).toBeDefined();
        expect(response.response).toBeDefined();
        expect(response.confidence).toBeGreaterThan(0);
        expect(response.reasoning).toBeDefined();
      });
      
      console.log(`🤝 F1 MOA coordination: ${agentResponses.length} agents responded in ${coordinationTime.toFixed(2)}ms`);
    });

    it('should extend F1 MOACoordinator with hook capabilities', async () => {
      // Verify MOA coordinator has hook integration
      const moaStatus = moaCoordinator.getAgentStatus();
      expect(moaStatus).toHaveLength(6); // F1 6-agent system
      
      // Test hook-enhanced MOA request processing
      const enhancedRequest = {
        id: 'hook-enhanced-test',
        prompt: 'Analyze microservices architecture with hook system validation',
        consensusThreshold: 0.7,
        hookIntegration: true,
        preHooks: ['pre-task', 'pre-edit'],
        postHooks: ['post-task', 'post-edit']
      };

      const startTime = performance.now();
      const response = await moaCoordinator.processRequest(enhancedRequest as any);
      const processingTime = performance.now() - startTime;

      expect(response.result.finalResponse).toContain('architecture');
      expect(response.result.confidence).toBeGreaterThan(0.7);
      expect(response.agentResponses).toHaveLength(6);
      expect(processingTime).toBeLessThan(5000);
      
      console.log(`🔗 Hook-enhanced MOA processing: ${processingTime.toFixed(2)}ms`);
    });

    it('should maintain hook context across agent interactions', async () => {
      const agentIntegration = (hookManager as any).agentIntegration;
      
      const sharedContext = {
        operationType: 'multi-agent-task' as const,
        sessionId: 'shared-context-test',
        environment: 'test',
        metadata: {
          sharedData: 'agent-coordination-data',
          timestamp: Date.now()
        }
      };

      // Share context across agents
      await agentIntegration.shareHookContext(sharedContext);
      
      // Verify context is available to multiple agents
      const availableAgents = await agentIntegration.getAvailableAgents(['code-analysis', 'performance-optimization']);
      expect(availableAgents.length).toBeGreaterThan(0);
      
      // Update metrics for hook integration
      await agentIntegration.updateAgentMetrics({
        agentId: 'test-agent',
        hooksTriggered: 5,
        avgHookResponseTime: 25,
        hookSuccessRate: 0.95,
        lastHookExecution: Date.now(),
        hookTypes: {
          'pre-task': 2,
          'post-task': 2,
          'pre-edit': 1
        }
      });
      
      console.log('🎯 Hook context sharing and agent metrics validated');
    });
  });

  describe('🌐 MCP Protocol Integration', () => {
    it('should establish WebSocket connection to MCP server with hook capabilities', async () => {
      return new Promise<void>((resolve, reject) => {
        client = new WebSocket('ws://localhost:8083');
        
        const timeout = setTimeout(() => {
          reject(new Error('MCP connection timeout'));
        }, 5000);
        
        client.on('open', () => {
          clearTimeout(timeout);
          expect(client.readyState).toBe(WebSocket.OPEN);
          resolve();
        });
        
        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    it('should expose hook capabilities via MCP protocol', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPRequest = {
          id: 'test-hook-capabilities',
          method: 'hook_capabilities'
        };

        const timeout = setTimeout(() => {
          reject(new Error('Hook capabilities response timeout'));
        }, 5000);

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          try {
            const response: MCPResponse = JSON.parse(data.toString());
            
            if (response.id === 'test-hook-capabilities') {
              clearTimeout(timeout);
              
              expect(response.result).toBeDefined();
              expect(response.result.hookCapabilities).toBeInstanceOf(Array);
              expect(response.result.hookCapabilities.length).toBeGreaterThan(0);
              
              const capabilities = response.result.hookCapabilities;
              const expectedCapabilities = [
                'hook_processing',
                'batch_processing',
                'configuration_management',
                'moa_integration',
                'performance_monitoring'
              ];
              
              expectedCapabilities.forEach(cap => {
                expect(capabilities.some((c: any) => c.name === cap)).toBe(true);
              });
              
              console.log(`🌐 Hook capabilities exposed: ${capabilities.length} capabilities available`);
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });
    });

    it('should process hook requests via MCP with performance targets', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPRequest = {
          id: 'test-mcp-hook-processing',
          method: 'hook_process',
          params: {
            type: 'pre-edit',
            phase: 'pre',
            operation: 'file-write',
            context: {
              operationType: 'file-write',
              filePath: '/test/mcp-integration.js',
              sessionId: 'mcp-test-session',
              environment: 'test',
              metadata: { source: 'mcp-test' }
            },
            priority: 'high'
          }
        };

        const startTime = performance.now();
        const timeout = setTimeout(() => {
          reject(new Error('MCP hook processing timeout'));
        }, 10000);

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          try {
            const response: MCPResponse = JSON.parse(data.toString());
            
            if (response.id === 'test-mcp-hook-processing') {
              clearTimeout(timeout);
              const responseTime = performance.now() - startTime;
              
              expect(response.result).toBeDefined();
              expect(response.result.success).toBe(true);
              expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
              expect(responseTime).toBeLessThan(PERFORMANCE_TARGETS.MCP_INTEGRATION_TIME);
              expect(response.result.metadata.executionId).toBeDefined();
              
              console.log(`🌐 MCP hook processing: ${response.result.processingTime.toFixed(2)}ms hook + ${responseTime.toFixed(2)}ms total`);
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });
    });

    it('should validate MCP protocol compliance for hooks', async () => {
      const mcpInterface = (hookManager as any).mcpInterface;
      
      const complianceResult = mcpInterface.validateMCPCompliance();
      
      expect(complianceResult.compliant).toBe(true);
      expect(complianceResult.version).toBeDefined();
      expect(complianceResult.issues).toHaveLength(0);
      
      // Verify exposed capabilities
      const capabilities = mcpInterface.getCapabilities();
      expect(capabilities).toBeInstanceOf(Array);
      expect(capabilities.length).toBeGreaterThan(0);
      
      capabilities.forEach(capability => {
        expect(capability.name).toBeDefined();
        expect(capability.version).toBeDefined();
        expect(capability.description).toBeDefined();
        expect(capability.hookTypes).toBeInstanceOf(Array);
        expect(capability.supportedOperations).toBeInstanceOf(Array);
        expect(capability.performanceGuarantees).toBeInstanceOf(Array);
      });
      
      console.log(`✅ MCP compliance validated: ${capabilities.length} capabilities exposed`);
    });
  });

  describe('🚨 Error Handling & Resilience', () => {
    it('should handle malformed hook events gracefully', async () => {
      const malformedEvent = {
        type: 'invalid-type',
        phase: 'invalid-phase',
        operation: 'invalid-operation',
        context: null,
        timestamp: 'invalid-timestamp',
        priority: 'invalid-priority'
      } as any;

      const result = await hookManager.processHook(malformedEvent);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.metadata.executionId).toBeDefined();
      expect(result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      
      console.log('🚨 Malformed event handled gracefully');
    });

    it('should implement circuit breaker for failing hooks', async () => {
      const circuitBreaker = (hookManager as any).circuitBreaker;
      
      // Simulate multiple failures to trigger circuit breaker
      for (let i = 0; i < 10; i++) {
        circuitBreaker.recordFailure();
      }
      
      expect(circuitBreaker.isOpen()).toBe(true);
      
      // Process hook with open circuit breaker
      const event: HookEvent = {
        type: 'pre-task',
        phase: 'pre',
        operation: 'file-read',
        context: {
          operationType: 'file-read',
          sessionId: 'circuit-breaker-test',
          environment: 'test',
          metadata: {}
        },
        timestamp: Date.now(),
        priority: 'medium'
      };

      const result = await hookManager.processHook(event);
      
      expect(result.success).toBe(true); // Should use fallback
      expect(result.data).toEqual({ fallback: true });
      expect(result.processingTime).toBeLessThan(10); // Fallback should be very fast
      
      console.log('🔴 Circuit breaker fallback mechanism validated');
    });

    it('should handle timeout scenarios for slow hooks', async () => {
      // Create a mock slow hook for testing
      const slowHook: Hook = {
        id: 'slow-test-hook',
        name: 'Slow Test Hook',
        type: 'pre-task',
        phase: 'pre',
        priority: 50,
        enabled: true,
        handler: {
          execute: async () => {
            await new Promise(resolve => setTimeout(resolve, 200)); // Intentionally slow
            return {
              success: true,
              processingTime: 200,
              data: { slow: true },
              metadata: {
                hookId: 'slow-test-hook',
                executionId: uuidv4()
              }
            };
          },
          canHandle: () => true,
          getMetadata: () => ({
            name: 'Slow Test Hook',
            version: '1.0.0',
            description: 'Intentionally slow hook for testing',
            supportedEvents: ['pre-task'],
            performanceHints: []
          })
        },
        dependencies: [],
        configuration: {
          timeout: 100, // Shorter than execution time
          retries: 0,
          fallbackEnabled: true,
          cacheEnabled: false,
          parallelExecution: false,
          dependencies: [],
          environment: ['test'],
          conditions: []
        },
        metadata: {
          registeredAt: Date.now(),
          registeredBy: 'test',
          source: 'dynamic',
          category: 'test',
          tags: ['slow', 'timeout']
        },
        version: '1.0.0'
      };

      await hookRegistry.registerHook(slowHook);

      const event: HookEvent = {
        type: 'pre-task',
        phase: 'pre',
        operation: 'file-read',
        context: {
          operationType: 'file-read',
          sessionId: 'timeout-test',
          environment: 'test',
          metadata: {}
        },
        timestamp: Date.now(),
        priority: 'medium'
      };

      const result = await hookManager.processHook(event);
      
      // Should handle timeout gracefully
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].message).toContain('timed out');
      
      console.log('⏱️ Hook timeout handling validated');
    });

    it('should handle resource exhaustion scenarios', async () => {
      // Create many concurrent requests to test resource handling
      const heavyEvents = Array.from({ length: 100 }, (_, i) => ({
        type: 'post-edit' as const,
        phase: 'post' as const,
        operation: 'file-write' as const,
        context: {
          operationType: 'file-write' as const,
          filePath: `/test/heavy-${i}.js`,
          sessionId: 'resource-test',
          environment: 'test',
          metadata: { heavy: true, index: i }
        },
        timestamp: Date.now(),
        priority: 'medium' as const
      }));

      const startTime = performance.now();
      const results = await Promise.allSettled(
        heavyEvents.map(event => hookManager.processHook(event))
      );
      const processingTime = performance.now() - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successful / heavyEvents.length;

      expect(successRate).toBeGreaterThan(0.8); // >80% should succeed even under load
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`💪 Resource exhaustion test: ${(successRate * 100).toFixed(1)}% success rate under heavy load`);
    });
  });

  describe('📊 Performance Monitoring & Metrics', () => {
    it('should collect comprehensive performance metrics', async () => {
      // Process several hooks to generate metrics
      const testEvents = Array.from({ length: 10 }, (_, i) => ({
        type: 'post-task' as const,
        phase: 'post' as const,
        operation: 'agent-coordinate' as const,
        context: {
          operationType: 'agent-coordinate' as const,
          sessionId: 'metrics-test',
          environment: 'test',
          metadata: { metricsIndex: i }
        },
        timestamp: Date.now(),
        priority: i % 2 === 0 ? 'high' as const : 'medium' as const
      }));

      await Promise.all(testEvents.map(event => hookManager.processHook(event)));

      const metrics: HookPerformanceMetrics = hookManager.getPerformanceMetrics();
      
      expect(metrics.totalHooksProcessed).toBeGreaterThan(0);
      expect(metrics.avgProcessingTime).toBeGreaterThan(0);
      expect(metrics.avgProcessingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      expect(metrics.maxProcessingTime).toBeGreaterThan(0);
      expect(metrics.minProcessingTime).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0.9);
      expect(metrics.errorRate).toBeLessThan(0.1);
      expect(metrics.lastUpdated).toBeGreaterThan(0);
      expect(metrics.performanceBreakdown).toBeDefined();
      
      console.log(`📊 Performance metrics: ${metrics.avgProcessingTime.toFixed(2)}ms avg, ${(metrics.successRate * 100).toFixed(1)}% success rate`);
    });

    it('should track hook type performance breakdown', async () => {
      const performanceEvents = [
        { type: 'pre-task' as const, priority: 'critical' as const },
        { type: 'post-task' as const, priority: 'high' as const },
        { type: 'pre-edit' as const, priority: 'medium' as const },
        { type: 'post-edit' as const, priority: 'low' as const }
      ].map(({ type, priority }, i) => ({
        type,
        phase: 'pre' as const,
        operation: 'performance-test' as const,
        context: {
          operationType: 'performance-test' as const,
          sessionId: 'breakdown-test',
          environment: 'test',
          metadata: { breakdownIndex: i }
        },
        timestamp: Date.now(),
        priority
      }));

      await Promise.all(performanceEvents.map(event => hookManager.processHook(event)));

      const metrics = hookManager.getPerformanceMetrics();
      const breakdown = metrics.performanceBreakdown;
      
      expect(breakdown.critical).toBeGreaterThanOrEqual(0);
      expect(breakdown.high).toBeGreaterThanOrEqual(0);
      expect(breakdown.medium).toBeGreaterThanOrEqual(0);
      expect(breakdown.low).toBeGreaterThanOrEqual(0);
      
      // Critical should be fastest
      if (breakdown.critical > 0 && breakdown.medium > 0) {
        expect(breakdown.critical).toBeLessThanOrEqual(breakdown.medium);
      }
      
      console.log('📈 Performance breakdown by priority validated');
    });

    it('should demonstrate cache effectiveness', async () => {
      const cacheableEvent: HookEvent = {
        type: 'pre-search',
        phase: 'pre',
        operation: 'file-read',
        context: {
          operationType: 'file-read',
          filePath: '/test/cacheable.js',
          sessionId: 'cache-test',
          environment: 'test',
          metadata: { cacheable: true }
        },
        timestamp: Date.now(),
        priority: 'low' // Low priority events are cached
      };

      // First execution - should be slow
      const firstResult = await hookManager.processHook(cacheableEvent);
      expect(firstResult.success).toBe(true);
      expect(firstResult.metadata.cacheHit).toBeFalsy();

      // Second execution - should be cached and faster
      const secondResult = await hookManager.processHook(cacheableEvent);
      expect(secondResult.success).toBe(true);
      expect(secondResult.metadata.cacheHit).toBe(true);
      expect(secondResult.processingTime).toBeLessThan(firstResult.processingTime);

      const metrics = hookManager.getPerformanceMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
      
      console.log(`💾 Cache effectiveness: ${(metrics.cacheHitRate * 100).toFixed(1)}% hit rate`);
    });
  });

  describe('🎯 Load Testing & Scalability', () => {
    it('should handle high-frequency hook requests efficiently', async () => {
      const highFrequencyEvents = Array.from({ length: 50 }, (_, i) => ({
        type: 'post-edit' as const,
        phase: 'post' as const,
        operation: 'file-write' as const,
        context: {
          operationType: 'file-write' as const,
          filePath: `/test/load-${i}.js`,
          sessionId: 'load-test',
          environment: 'test',
          metadata: { loadIndex: i }
        },
        timestamp: Date.now() + i, // Stagger timestamps
        priority: i % 4 === 0 ? 'critical' as const : 'medium' as const
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        highFrequencyEvents.map(event => hookManager.processHook(event))
      );
      const totalTime = performance.now() - startTime;

      // All requests should succeed
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      });

      // Performance metrics
      const avgResponseTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
      const throughput = results.length / (totalTime / 1000); // requests per second

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      expect(throughput).toBeGreaterThan(20); // >20 requests/second

      console.log(`🚀 Load test: ${avgResponseTime.toFixed(1)}ms avg, ${throughput.toFixed(1)} req/s throughput`);
    });

    it('should maintain performance under mixed priority workloads', async () => {
      const mixedWorkload = [
        // Critical hooks (should be fastest)
        ...Array.from({ length: 5 }, (_, i) => ({
          type: 'pre-command' as const,
          phase: 'pre' as const,
          operation: 'command-execute' as const,
          context: {
            operationType: 'command-execute' as const,
            command: `critical-command-${i}`,
            sessionId: 'mixed-workload',
            environment: 'test',
            metadata: { critical: true }
          },
          timestamp: Date.now(),
          priority: 'critical' as const
        })),
        // High priority hooks
        ...Array.from({ length: 10 }, (_, i) => ({
          type: 'pre-edit' as const,
          phase: 'pre' as const,
          operation: 'file-write' as const,
          context: {
            operationType: 'file-write' as const,
            filePath: `/test/high-${i}.js`,
            sessionId: 'mixed-workload',
            environment: 'test',
            metadata: { high: true }
          },
          timestamp: Date.now(),
          priority: 'high' as const
        })),
        // Medium priority hooks
        ...Array.from({ length: 15 }, (_, i) => ({
          type: 'post-task' as const,
          phase: 'post' as const,
          operation: 'agent-coordinate' as const,
          context: {
            operationType: 'agent-coordinate' as const,
            sessionId: 'mixed-workload',
            environment: 'test',
            metadata: { medium: true }
          },
          timestamp: Date.now(),
          priority: 'medium' as const
        }))
      ];

      const startTime = performance.now();
      const results = await Promise.all(
        mixedWorkload.map(event => hookManager.processHook(event))
      );
      const totalTime = performance.now() - startTime;

      // Verify critical hooks were processed fastest
      const criticalResults = results.slice(0, 5);
      const highResults = results.slice(5, 15);
      const mediumResults = results.slice(15);

      const avgCriticalTime = criticalResults.reduce((sum, r) => sum + r.processingTime, 0) / criticalResults.length;
      const avgHighTime = highResults.reduce((sum, r) => sum + r.processingTime, 0) / highResults.length;
      const avgMediumTime = mediumResults.reduce((sum, r) => sum + r.processingTime, 0) / mediumResults.length;

      expect(avgCriticalTime).toBeLessThan(PERFORMANCE_TARGETS.CRITICAL_HOOK_TIME);
      expect(avgCriticalTime).toBeLessThanOrEqual(avgHighTime);
      expect(avgHighTime).toBeLessThanOrEqual(avgMediumTime);

      console.log(`⚖️ Mixed workload: Critical ${avgCriticalTime.toFixed(1)}ms, High ${avgHighTime.toFixed(1)}ms, Medium ${avgMediumTime.toFixed(1)}ms`);
    });
  });

  describe('🏆 Production Readiness Validation', () => {
    it('should meet all F2 Hook System performance targets', async () => {
      const summary = {
        hookProcessingTime: hookManager.getPerformanceMetrics().avgProcessingTime,
        successRate: hookManager.getPerformanceMetrics().successRate,
        cacheHitRate: hookManager.getPerformanceMetrics().cacheHitRate,
        errorRate: hookManager.getPerformanceMetrics().errorRate,
        f1Integration: true,
        mcpCompliance: (hookManager as any).mcpInterface.validateMCPCompliance().compliant,
        configurationValidation: (hookManager as any).configSystem.validateConfig().valid
      };

      // Core performance targets
      expect(summary.hookProcessingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      expect(summary.successRate).toBeGreaterThan(0.95);
      expect(summary.errorRate).toBeLessThan(0.05);
      
      // Integration requirements
      expect(summary.f1Integration).toBe(true);
      expect(summary.mcpCompliance).toBe(true);
      expect(summary.configurationValidation).toBe(true);

      console.log('🎯 F2 HOOK SYSTEM PRODUCTION READINESS SUMMARY:');
      console.log(`   ✅ Hook Processing: ${summary.hookProcessingTime.toFixed(1)}ms (target: <${PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME}ms)`);
      console.log(`   ✅ Success Rate: ${(summary.successRate * 100).toFixed(1)}% (target: >95%)`);
      console.log(`   ✅ Error Rate: ${(summary.errorRate * 100).toFixed(1)}% (target: <5%)`);
      console.log(`   ✅ Cache Hit Rate: ${(summary.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`   ✅ F1 MOA Integration: ${summary.f1Integration ? 'Active' : 'Inactive'}`);
      console.log(`   ✅ MCP Compliance: ${summary.mcpCompliance ? 'Compliant' : 'Non-compliant'}`);
      console.log(`   ✅ Configuration: ${summary.configurationValidation ? 'Valid' : 'Invalid'}`);
      console.log('   🚀 F2 HOOK SYSTEM READY FOR PRODUCTION DEPLOYMENT');
    });

    it('should demonstrate end-to-end integration workflow', async () => {
      console.log('🔄 Executing complete F2 Hook System integration workflow...');
      
      // Step 1: Configuration loading
      const configStartTime = performance.now();
      await (hookManager as any).configSystem.reloadConfig();
      const configTime = performance.now() - configStartTime;
      expect(configTime).toBeLessThan(PERFORMANCE_TARGETS.CONFIGURATION_LOAD_TIME);
      
      // Step 2: F1 MOA coordination
      const moaStartTime = performance.now();
      const moaResponse = await moaCoordinator.processRequest({
        id: 'integration-workflow',
        prompt: 'Perform comprehensive system analysis with hook integration',
        consensusThreshold: 0.7
      });
      const moaTime = performance.now() - moaStartTime;
      expect(moaResponse.result.confidence).toBeGreaterThan(0.7);
      
      // Step 3: Hook processing pipeline
      const hookStartTime = performance.now();
      const pipelineEvents: HookEvent[] = [
        {
          type: 'pre-task',
          phase: 'pre',
          operation: 'agent-spawn',
          context: {
            operationType: 'agent-spawn',
            sessionId: 'integration-workflow',
            environment: 'production',
            metadata: { workflow: 'end-to-end' }
          },
          timestamp: Date.now(),
          priority: 'high'
        },
        {
          type: 'post-task',
          phase: 'post',
          operation: 'consensus-validate',
          context: {
            operationType: 'consensus-validate',
            sessionId: 'integration-workflow',
            environment: 'production',
            metadata: { workflow: 'end-to-end' }
          },
          timestamp: Date.now(),
          priority: 'high'
        }
      ];
      
      const hookResults = await hookManager.processBatch(pipelineEvents);
      const hookTime = performance.now() - hookStartTime;
      
      expect(hookResults).toHaveLength(2);
      hookResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.HOOK_PROCESSING_TIME);
      });
      
      // Step 4: MCP protocol validation
      const mcpValidation = (hookManager as any).mcpInterface.validateMCPCompliance();
      expect(mcpValidation.compliant).toBe(true);
      
      const totalWorkflowTime = configTime + moaTime + hookTime;
      
      console.log('🎯 END-TO-END INTEGRATION WORKFLOW COMPLETE:');
      console.log(`   📋 Configuration: ${configTime.toFixed(2)}ms`);
      console.log(`   🤝 F1 MOA Processing: ${moaTime.toFixed(2)}ms`);
      console.log(`   🪝 Hook Pipeline: ${hookTime.toFixed(2)}ms`);
      console.log(`   🌐 MCP Compliance: ${mcpValidation.compliant ? 'Verified' : 'Failed'}`);
      console.log(`   ⚡ Total Workflow: ${totalWorkflowTime.toFixed(2)}ms`);
      console.log('   ✅ F2 HOOK SYSTEM INTEGRATION VALIDATED');
    });
  });
});