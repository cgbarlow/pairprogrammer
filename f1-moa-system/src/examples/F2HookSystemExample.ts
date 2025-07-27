// F2 Hook System Example - Demonstrating Production Usage

import { F2EnhancedMOACoordinator } from '../hooks/F2EnhancedMOACoordinator.js';
import type { HookEvent, Hook, HookHandler } from '../hooks/types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Example demonstrating F2 Hook System capabilities including:
 * - Basic hook registration and execution
 * - Performance monitoring
 * - Agent integration
 * - Configuration management
 * - Error handling
 */
export class F2HookSystemExample {
  private enhancedCoordinator: F2EnhancedMOACoordinator;

  constructor() {
    this.enhancedCoordinator = new F2EnhancedMOACoordinator();
  }

  async runExample(): Promise<void> {
    console.log('🚀 Starting F2 Hook System Example...\n');

    try {
      // Initialize the enhanced coordinator
      await this.enhancedCoordinator.initialize();
      
      // Demonstrate basic hook operations
      await this.demonstrateBasicHooks();
      
      // Show performance monitoring
      await this.demonstratePerformanceMonitoring();
      
      // Test agent integration
      await this.demonstrateAgentIntegration();
      
      // Show configuration management
      await this.demonstrateConfiguration();
      
      // Test error handling
      await this.demonstrateErrorHandling();
      
      // Demonstrate batch processing
      await this.demonstrateBatchProcessing();

    } catch (error) {
      console.error('❌ Example failed:', error);
    } finally {
      console.log('\n🏁 F2 Hook System Example completed');
      await this.enhancedCoordinator.shutdown();
    }
  }

  private async demonstrateBasicHooks(): Promise<void> {
    console.log('📋 1. Basic Hook Operations');
    console.log('================================');

    const hookManager = this.enhancedCoordinator.getHookManager();

    // Create a custom hook
    const customHook: Hook = {
      id: 'example-hook',
      name: 'Example Performance Hook',
      type: 'post-task',
      phase: 'post',
      priority: 2,
      enabled: true,
      handler: this.createExampleHandler(),
      dependencies: [],
      configuration: {
        timeout: 1000,
        retries: 1,
        fallbackEnabled: true,
        cacheEnabled: true,
        parallelExecution: true,
        dependencies: [],
        environment: ['development', 'production'],
        conditions: []
      },
      metadata: {
        registeredAt: Date.now(),
        registeredBy: 'example',
        source: 'dynamic',
        category: 'performance',
        tags: ['example', 'demo']
      },
      version: '1.0.0'
    };

    // Register the hook
    await hookManager['registry'].registerHook(customHook);

    // Execute a hook event
    const hookEvent: HookEvent = {
      type: 'post-task',
      phase: 'post',
      operation: 'custom',
      context: {
        operationType: 'custom',
        sessionId: 'example-session',
        environment: 'development',
        metadata: { example: true }
      },
      timestamp: Date.now(),
      priority: 'high'
    };

    const result = await hookManager.processHook(hookEvent);
    console.log(`✅ Hook executed successfully in ${result.processingTime.toFixed(2)}ms`);
    console.log('');
  }

  private async demonstratePerformanceMonitoring(): Promise<void> {
    console.log('📊 2. Performance Monitoring');
    console.log('================================');

    const hookManager = this.enhancedCoordinator.getHookManager();
    const metrics = hookManager.getPerformanceMetrics();

    console.log('Performance Metrics:');
    console.log(`  • Total hooks processed: ${metrics.totalHooksProcessed}`);
    console.log(`  • Average processing time: ${metrics.avgProcessingTime.toFixed(2)}ms`);
    console.log(`  • Success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`  • Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log('');
  }

  private async demonstrateAgentIntegration(): Promise<void> {
    console.log('🤝 3. Agent Integration');
    console.log('================================');

    // Get agent status from the enhanced coordinator
    const agentStatus = this.enhancedCoordinator.getAgentStatus();
    console.log(`Active agents: ${agentStatus.length}`);

    // Example of hook-agent coordination
    if (agentStatus.length > 0) {
      const hookEvent: HookEvent = {
        type: 'agent-coordinate',
        phase: 'post',
        operation: 'agent-coordinate',
        context: {
          operationType: 'agent-coordinate',
          agentId: agentStatus[0].id,
          sessionId: 'agent-session',
          environment: 'development',
          metadata: { coordination: true }
        },
        timestamp: Date.now(),
        priority: 'medium'
      };

      await this.enhancedCoordinator.executeHook(hookEvent);
      console.log('✅ Agent coordination hook executed');
    }
    console.log('');
  }

  private async demonstrateConfiguration(): Promise<void> {
    console.log('⚙️ 4. Configuration Management');
    console.log('================================');

    const configSystem = this.enhancedCoordinator.getConfigurationSystem();
    const validation = configSystem.validateConfig();

    console.log('Configuration Status:');
    console.log(`  • Valid: ${validation.valid}`);
    console.log(`  • Errors: ${validation.errors.length}`);
    console.log(`  • Warnings: ${validation.warnings.length}`);

    if (validation.warnings.length > 0) {
      console.log('  Warnings:');
      validation.warnings.forEach((warning, i) => {
        console.log(`    ${i + 1}. ${warning.message}`);
      });
    }
    console.log('');
  }

  private async demonstrateErrorHandling(): Promise<void> {
    console.log('🛡️ 5. Error Handling');
    console.log('================================');

    const hookManager = this.enhancedCoordinator.getHookManager();

    // Create a hook that will fail
    const failingHook: Hook = {
      id: 'failing-hook',
      name: 'Failing Example Hook',
      type: 'custom',
      phase: 'post',
      priority: 1,
      enabled: true,
      handler: this.createFailingHandler(),
      dependencies: [],
      configuration: {
        timeout: 100,
        retries: 2,
        fallbackEnabled: true,
        cacheEnabled: false,
        parallelExecution: false,
        dependencies: [],
        environment: ['development'],
        conditions: []
      },
      metadata: {
        registeredAt: Date.now(),
        registeredBy: 'example',
        source: 'dynamic',
        category: 'test',
        tags: ['error', 'test']
      },
      version: '1.0.0'
    };

    await hookManager['registry'].registerHook(failingHook);

    // Execute the failing hook
    const failingEvent: HookEvent = {
      type: 'custom',
      phase: 'post',
      operation: 'custom',
      context: {
        operationType: 'custom',
        sessionId: 'error-session',
        environment: 'development',
        metadata: { shouldFail: true }
      },
      timestamp: Date.now(),
      priority: 'low'
    };

    try {
      const result = await hookManager.processHook(failingEvent);
      console.log(`Hook result: ${result.success ? 'Success' : 'Failed'}`);
      if (result.errors && result.errors.length > 0) {
        console.log(`Error handled: ${result.errors[0].message}`);
      }
    } catch (error) {
      console.log('✅ Error properly caught and handled');
    }
    console.log('');
  }

  private async demonstrateBatchProcessing(): Promise<void> {
    console.log('⚡ 6. Batch Processing');
    console.log('================================');

    const hookManager = this.enhancedCoordinator.getHookManager();

    // Create multiple hook events
    const batchEvents: HookEvent[] = [
      {
        type: 'post-task',
        phase: 'post',
        operation: 'custom',
        context: {
          operationType: 'custom',
          sessionId: 'batch-1',
          environment: 'development',
          metadata: { batch: 1 }
        },
        timestamp: Date.now(),
        priority: 'high'
      },
      {
        type: 'post-task',
        phase: 'post',
        operation: 'custom',
        context: {
          operationType: 'custom',
          sessionId: 'batch-2',
          environment: 'development',
          metadata: { batch: 2 }
        },
        timestamp: Date.now(),
        priority: 'medium'
      },
      {
        type: 'post-task',
        phase: 'post',
        operation: 'custom',
        context: {
          operationType: 'custom',
          sessionId: 'batch-3',
          environment: 'development',
          metadata: { batch: 3 }
        },
        timestamp: Date.now(),
        priority: 'low'
      }
    ];

    const results = await hookManager.processBatch(batchEvents);
    console.log(`✅ Processed ${results.length} hooks in batch`);
    
    const successCount = results.filter(r => r.success).length;
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    console.log(`  • Success rate: ${(successCount / results.length * 100).toFixed(1)}%`);
    console.log(`  • Average time: ${avgTime.toFixed(2)}ms`);
    console.log('');
  }

  private createExampleHandler(): HookHandler {
    return {
      execute: async (event: HookEvent) => {
        // Simulate some processing
        await new Promise(resolve => setTimeout(resolve, 10));
        
        return {
          success: true,
          processingTime: 10,
          data: {
            processed: true,
            eventType: event.type,
            timestamp: Date.now()
          },
          metadata: {
            hookId: 'example-hook',
            executionId: uuidv4()
          }
        };
      },
      canHandle: (event: HookEvent) => {
        return event.type === 'post-task' || event.type === 'agent-coordinate';
      },
      getMetadata: () => ({
        name: 'Example Handler',
        version: '1.0.0',
        description: 'Example hook handler for demonstration',
        supportedEvents: ['post-task', 'agent-coordinate'],
        performanceHints: [
          {
            operation: 'execute',
            expectedTime: 10,
            cpuIntensive: false,
            memoryIntensive: false
          }
        ]
      }),
      id: 'example-handler'
    };
  }

  private createFailingHandler(): HookHandler {
    return {
      execute: async (event: HookEvent) => {
        // Simulate a failure
        throw new Error('Example hook failure for testing');
      },
      canHandle: (event: HookEvent) => {
        return event.type === 'custom';
      },
      getMetadata: () => ({
        name: 'Failing Handler',
        version: '1.0.0',
        description: 'Handler that always fails for error testing',
        supportedEvents: ['custom'],
        performanceHints: []
      }),
      id: 'failing-handler'
    };
  }
}

// Example usage
export async function runF2Example(): Promise<void> {
  const example = new F2HookSystemExample();
  await example.runExample();
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runF2Example().catch(console.error);
}