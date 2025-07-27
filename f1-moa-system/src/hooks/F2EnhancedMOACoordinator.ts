// F2 Enhanced MOA Coordinator - Seamless F1 Extension with Hook System

import { MOACoordinator } from '../agents/MOACoordinator.js';
import { F2HookManager } from './HookManager.js';
import { DefaultConfigurationSystem } from './ConfigurationSystem.js';
import { performance } from 'perf_hooks';
import type {
  F2HookConfiguration,
  HookEvent,
  HookResult,
  ClaudeConfiguration,
  HookConfiguration
} from './types.js';
import type { MOARequest, MOAResponse } from '../types/index.js';

/**
 * F2 Enhanced MOA Coordinator that seamlessly extends the F1 MOACoordinator
 * with comprehensive hook processing capabilities. Maintains full backward
 * compatibility while adding production-ready hook functionality.
 */
export class F2EnhancedMOACoordinator extends MOACoordinator {
  private hookManager: F2HookManager;
  private configSystem: DefaultConfigurationSystem;
  private f2Initialized = false;
  private hookProcessingEnabled = true;

  constructor() {
    super();
    console.log('🚀 Initializing F2 Enhanced MOA Coordinator...');
    
    // Initialize F2 configuration
    const f2Config = this.createF2Configuration();
    this.configSystem = new DefaultConfigurationSystem(f2Config);
    this.hookManager = new F2HookManager(this, f2Config);
  }

  async initialize(): Promise<void> {
    console.log('🔄 F2 Enhanced MOA Coordinator initialization starting...');

    try {
      // Initialize F1 MOA System first
      await super.initialize();

      // Then initialize F2 Hook System
      await this.initializeF2System();

      this.f2Initialized = true;
      console.log('✅ F2 Enhanced MOA Coordinator fully initialized');
      this.emit('f2-initialized', {
        f1Ready: true,
        f2Ready: true,
        hookProcessingEnabled: this.hookProcessingEnabled
      });

    } catch (error) {
      console.error('❌ F2 Enhanced MOA Coordinator initialization failed:', error);
      throw error;
    }
  }

  // Override processRequest to include hook processing
  async processRequest(request: MOARequest): Promise<MOAResponse> {
    const startTime = performance.now();

    try {
      // Execute pre-request hooks if F2 is initialized
      if (this.f2Initialized && this.hookProcessingEnabled) {
        await this.executePreRequestHooks(request);
      }

      // Execute original MOA processing
      const response = await super.processRequest(request);

      // Execute post-request hooks if F2 is initialized
      if (this.f2Initialized && this.hookProcessingEnabled) {
        await this.executePostRequestHooks(request, response);
      }

      const totalTime = performance.now() - startTime;
      console.log(`🎯 Enhanced MOA request completed in ${totalTime.toFixed(2)}ms`);

      return response;

    } catch (error) {
      console.error('❌ Enhanced MOA request failed:', error);
      
      // Try to execute error hooks
      if (this.f2Initialized && this.hookProcessingEnabled) {
        await this.executeErrorHooks(request, error);
      }

      throw error;
    }
  }

  // F2 Hook System Access Methods
  getHookManager(): F2HookManager {
    return this.hookManager;
  }

  getConfigurationSystem(): DefaultConfigurationSystem {
    return this.configSystem;
  }

  // Hook Processing Control
  enableHookProcessing(): void {
    this.hookProcessingEnabled = true;
    console.log('✅ Hook processing enabled');
    this.emit('hook-processing-enabled');
  }

  disableHookProcessing(): void {
    this.hookProcessingEnabled = false;
    console.log('⏸️ Hook processing disabled');
    this.emit('hook-processing-disabled');
  }

  isHookProcessingEnabled(): boolean {
    return this.hookProcessingEnabled && this.f2Initialized;
  }

  // Advanced Hook Operations
  async executeHook(event: HookEvent): Promise<HookResult> {
    if (!this.f2Initialized) {
      throw new Error('F2 Hook System not initialized');
    }

    return await this.hookManager.processHook(event);
  }

  async executeBatchHooks(events: HookEvent[]): Promise<HookResult[]> {
    if (!this.f2Initialized) {
      throw new Error('F2 Hook System not initialized');
    }

    return await this.hookManager.processBatch(events);
  }

  // Configuration Management
  async reloadConfiguration(): Promise<void> {
    console.log('🔄 Reloading F2 configuration...');
    
    try {
      await this.configSystem.reloadConfig();
      console.log('✅ F2 configuration reloaded successfully');
      this.emit('config-reloaded');
    } catch (error) {
      console.error('❌ F2 configuration reload failed:', error);
      throw error;
    }
  }

  getClaudeConfiguration(): ClaudeConfiguration | null {
    try {
      return this.configSystem['claudeConfig']; // Access private field
    } catch {
      return null;
    }
  }

  getHookConfiguration(): HookConfiguration | null {
    try {
      return this.configSystem['hookConfig']; // Access private field
    } catch {
      return null;
    }
  }

  // Performance and Monitoring
  getF2PerformanceMetrics(): {
    hookMetrics: any;
    configurationStatus: any;
    integrationStats: any;
    systemHealth: any;
  } {
    return {
      hookMetrics: this.hookManager.getPerformanceMetrics(),
      configurationStatus: this.configSystem.validateConfig(),
      integrationStats: (this.hookManager as any)['agentIntegration'].getIntegrationStats(),
      systemHealth: {
        f2Initialized: this.f2Initialized,
        hookProcessingEnabled: this.hookProcessingEnabled,
        lastActivity: Date.now()
      }
    };
  }

  // Enhanced System Status
  getEnhancedSystemStatus(): {
    f1Status: any;
    f2Status: any;
    integration: any;
  } {
    const f1Status = {
      metrics: this.getSystemMetrics(),
      agents: this.getAgentStatus()
    };

    const f2Status = {
      initialized: this.f2Initialized,
      hookProcessingEnabled: this.hookProcessingEnabled,
      performance: this.hookManager.getPerformanceMetrics(),
      configValid: this.configSystem.validateConfig().valid
    };

    const integration = {
      seamlessIntegration: true,
      backwardCompatible: true,
      hookSystemActive: this.f2Initialized && this.hookProcessingEnabled,
      lastUpdate: Date.now()
    };

    return { f1Status, f2Status, integration };
  }

  // Graceful Shutdown
  async shutdown(): Promise<void> {
    console.log('🔄 F2 Enhanced MOA Coordinator shutting down...');

    try {
      // Shutdown F2 Hook System first
      if (this.f2Initialized) {
        await this.hookManager.shutdown();
      }

      // Then shutdown F1 MOA System
      await super.shutdown();

      this.f2Initialized = false;
      console.log('✅ F2 Enhanced MOA Coordinator shutdown complete');
      this.emit('f2-shutdown');

    } catch (error) {
      console.error('❌ F2 Enhanced MOA Coordinator shutdown failed:', error);
      throw error;
    }
  }

  // Private F2 Initialization
  private async initializeF2System(): Promise<void> {
    console.log('🔧 Initializing F2 Hook System...');

    try {
      // Initialize hook manager
      await this.hookManager.initialize();

      // Setup F1-F2 integration hooks
      await this.setupIntegrationHooks();

      // Validate configuration
      const configValidation = this.configSystem.validateConfig();
      if (!configValidation.valid) {
        console.warn('⚠️ F2 configuration has issues:', configValidation.errors);
      }

      console.log('✅ F2 Hook System initialized successfully');

    } catch (error) {
      console.error('❌ F2 Hook System initialization failed:', error);
      throw error;
    }
  }

  private async setupIntegrationHooks(): Promise<void> {
    // Set up hooks that bridge F1 and F2 systems
    
    // Listen to F1 MOA events and convert to hook events
    this.on('request-processed', (data) => {
      if (this.hookProcessingEnabled) {
        (this.hookManager as any)['eventSystem'].emitHookEvent({
          type: 'mcp-response',
          phase: 'post',
          operation: 'mcp-response',
          context: {
            operationType: 'mcp-response',
            sessionId: data.requestId || 'moa-session',
            environment: 'production',
            metadata: data
          },
          timestamp: Date.now(),
          priority: 'medium'
        });
      }
    });

    // Listen to agent status changes
    this.on('agent-status-changed', (data) => {
      if (this.hookProcessingEnabled) {
        (this.hookManager as any)['eventSystem'].emitHookEvent({
          type: 'agent-coordinate',
          phase: 'post',
          operation: 'agent-coordinate',
          context: {
            operationType: 'agent-coordinate',
            agentId: data.agentId,
            sessionId: 'moa-session',
            environment: 'production',
            metadata: data
          },
          timestamp: Date.now(),
          priority: 'low'
        });
      }
    });

    console.log('🔗 F1-F2 integration hooks established');
  }

  private async executePreRequestHooks(request: MOARequest): Promise<void> {
    try {
      const hookEvent: HookEvent = {
        type: 'pre-task',
        phase: 'pre',
        operation: 'mcp-request',
        context: {
          operationType: 'mcp-request',
          sessionId: request.id,
          environment: 'production',
          metadata: { request }
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      await this.hookManager.processHook(hookEvent);
    } catch (error) {
      console.warn('⚠️ Pre-request hook failed:', error);
      // Don't throw - hooks should not break main processing
    }
  }

  private async executePostRequestHooks(request: MOARequest, response: MOAResponse): Promise<void> {
    try {
      const hookEvent: HookEvent = {
        type: 'post-task',
        phase: 'post',
        operation: 'mcp-response',
        context: {
          operationType: 'mcp-response',
          sessionId: request.id,
          environment: 'production',
          metadata: { request, response }
        },
        timestamp: Date.now(),
        priority: 'medium'
      };

      await this.hookManager.processHook(hookEvent);
    } catch (error) {
      console.warn('⚠️ Post-request hook failed:', error);
      // Don't throw - hooks should not break main processing
    }
  }

  private async executeErrorHooks(request: MOARequest, error: any): Promise<void> {
    try {
      const hookEvent: HookEvent = {
        type: 'custom',
        phase: 'post',
        operation: 'custom',
        context: {
          operationType: 'error-handling',
          sessionId: request.id,
          environment: 'production',
          metadata: { 
            request, 
            error: error instanceof Error ? error.message : String(error)
          }
        },
        timestamp: Date.now(),
        priority: 'critical'
      };

      await this.hookManager.processHook(hookEvent);
    } catch (hookError) {
      console.warn('⚠️ Error hook failed:', hookError);
      // Don't throw - hooks should not break error handling
    }
  }

  private createF2Configuration(): F2HookConfiguration {
    return {
      claude: {
        agents: [],
        swarm: {
          topology: 'hierarchical',
          maxAgents: 8,
          strategy: 'balanced',
          coordination: {
            consensusThreshold: 0.7,
            maxCoordinationTime: 5000,
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
            retryCount: 3,
            retryDelay: 1000,
            fallbackEnabled: true,
            circuitBreakerEnabled: true,
            circuitBreakerThreshold: 0.5
          }
        },
        performance: {
          maxMemoryUsage: 512 * 1024 * 1024,
          maxCpuUsage: 80,
          performanceMonitoring: true,
          metricsRetention: 86400000,
          optimizationEnabled: true
        },
        environment: {
          name: process.env.NODE_ENV || 'development',
          variables: {},
          features: ['hooks', 'monitoring', 'performance'],
          restrictions: []
        }
      },
      hooks: {
        version: '2.0.0',
        metadata: {
          version: '2.0.0',
          createdAt: Date.now(),
          lastModified: Date.now(),
          author: 'F2-System',
          description: 'F2 Enhanced MOA Hook Configuration'
        },
        settings: {
          maxProcessingTime: 50,
          parallelExecution: true,
          cacheEnabled: true,
          retryPolicy: {
            maxRetries: 3,
            backoffStrategy: 'exponential',
            initialDelay: 1000,
            maxDelay: 10000
          },
          circuitBreaker: {
            enabled: true,
            threshold: 0.5,
            timeout: 5000,
            resetTimeout: 30000
          },
          monitoring: {
            enabled: true,
            metricsInterval: 5000,
            logLevel: 'info',
            tracing: true
          }
        },
        hooks: [],
        environments: []
      },
      performance: {
        maxHookProcessingTime: 50,
        maxConcurrentHooks: 10,
        cacheSize: 1000,
        metricsRetention: 86400000,
        optimizationInterval: 300000
      },
      security: {
        sandboxEnabled: true,
        permissionValidation: true,
        auditLogging: true,
        encryptionEnabled: false,
        trustedSources: ['built-in', 'config']
      }
    };
  }
}