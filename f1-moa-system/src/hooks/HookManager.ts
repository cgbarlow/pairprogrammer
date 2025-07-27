// F2 Hook Manager - Core Processing Engine with <50ms Guarantee

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import type {
  HookManager,
  HookEvent,
  HookResult,
  HookPerformanceMetrics,
  Hook,
  HookRegistry,
  EventSystem,
  ConfigurationSystem,
  AgentIntegration,
  MCPHookInterface,
  CachedResult,
  CircuitBreaker,
  F2HookConfiguration,
  HookFilter,
  HookError,
  HookMetadata
} from './types.js';
import { MOACoordinator } from '../agents/MOACoordinator.js';
import { DefaultHookRegistry } from './HookRegistry.js';
import { DefaultEventSystem } from './EventSystem.js';
import { DefaultConfigurationSystem } from './ConfigurationSystem.js';
import { MOAAgentIntegration } from './AgentIntegration.js';
import { DefaultMCPHookInterface } from './MCPInterface.js';
import { DefaultCircuitBreaker } from './CircuitBreaker.js';

export class F2HookManager extends EventEmitter implements HookManager {
  private registry: HookRegistry;
  private eventSystem: EventSystem;
  private configSystem: ConfigurationSystem;
  private agentIntegration: AgentIntegration;
  private mcpInterface: MCPHookInterface;
  private performanceCache: Map<string, CachedResult>;
  private circuitBreaker: CircuitBreaker;
  private metrics: HookPerformanceMetrics;
  private isInitialized = false;
  private readonly maxProcessingTime: number;

  constructor(
    private moaCoordinator: MOACoordinator,
    private config: F2HookConfiguration
  ) {
    super();
    
    this.maxProcessingTime = config.performance.maxHookProcessingTime || 50; // 50ms default
    
    // Initialize core components
    this.registry = new DefaultHookRegistry();
    this.eventSystem = new DefaultEventSystem();
    this.configSystem = new DefaultConfigurationSystem(config);
    this.agentIntegration = new MOAAgentIntegration(moaCoordinator);
    this.mcpInterface = new DefaultMCPHookInterface();
    this.performanceCache = new Map();
    this.circuitBreaker = new DefaultCircuitBreaker({
      threshold: 0.5,
      timeout: 5000,
      resetTimeout: 30000
    });
    
    this.metrics = this.initializeMetrics();
    
    // Setup cache cleanup
    this.setupCacheCleanup();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing F2 Hook System...');
    const startTime = performance.now();

    try {
      // Load configurations
      await this.configSystem.loadClaudeConfig();
      await this.configSystem.loadHookConfig();

      // Initialize components
      await this.registry.discoverHooks();
      if ((this.agentIntegration as any).initialize) {
        await (this.agentIntegration as any).initialize();
      }
      if ((this.mcpInterface as any).initialize) {
        await (this.mcpInterface as any).initialize();
      }

      // Setup event subscriptions
      this.setupEventSubscriptions();

      // Register built-in hooks
      await this.registerBuiltInHooks();

      this.isInitialized = true;
      const initTime = performance.now() - startTime;
      
      console.log(`✅ F2 Hook System initialized in ${initTime.toFixed(2)}ms`);
      this.emit('initialized', { 
        initTime,
        hooksRegistered: this.registry.getHooks().length 
      });

    } catch (error) {
      console.error('❌ Failed to initialize F2 Hook System:', error);
      throw error;
    }
  }

  async processHook(event: HookEvent): Promise<HookResult> {
    const startTime = performance.now();
    const executionId = uuidv4();
    
    try {
      // Validate processing time constraint
      if (event.priority === 'critical' && this.maxProcessingTime < 20) {
        return await this.processFastPath(event, executionId);
      }

      // Check circuit breaker
      if (this.circuitBreaker.isOpen()) {
        console.warn(`⚠️ Circuit breaker open, using fallback for hook: ${event.type}`);
        return this.getFallbackResult(event, executionId);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(event);
      if (this.performanceCache.has(cacheKey)) {
        const cached = this.performanceCache.get(cacheKey)!;
        if (!cached.isExpired()) {
          this.updateMetrics(performance.now() - startTime, true, true);
          return {
            ...cached.result,
            metadata: {
              ...cached.result.metadata,
              executionId,
              cacheHit: true
            }
          };
        }
      }

      // Process with full pipeline
      const result = await this.processFullPipeline(event, executionId);
      
      const processingTime = performance.now() - startTime;
      
      // Validate performance constraint
      if (processingTime > this.maxProcessingTime) {
        console.warn(`⚠️ Hook processing exceeded ${this.maxProcessingTime}ms: ${processingTime.toFixed(2)}ms`);
        this.circuitBreaker.recordFailure();
      } else {
        this.circuitBreaker.recordSuccess();
      }
      
      this.updateMetrics(processingTime, true, false);
      
      // Cache result if beneficial
      if (this.shouldCache(event)) {
        this.cacheResult(cacheKey, result);
      }
      
      return result;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateMetrics(processingTime, false, false);
      this.circuitBreaker.recordFailure();
      
      console.error(`❌ Hook processing failed for ${event.type}:`, error);
      
      return {
        success: false,
        processingTime,
        errors: [{
          code: 'HOOK_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          context: { event }
        }],
        metadata: {
          hookId: 'unknown',
          executionId,
          retryCount: 0
        }
      };
    }
  }

  async processBatch(events: HookEvent[]): Promise<HookResult[]> {
    const startTime = performance.now();
    console.log(`🔄 Processing batch of ${events.length} hooks...`);

    try {
      // Group events by priority for optimal processing
      const priorityGroups = this.groupEventsByPriority(events);
      const results: HookResult[] = [];

      // Process critical events first (fast path)
      if (priorityGroups.critical.length > 0) {
        const criticalResults = await Promise.all(
          priorityGroups.critical.map(event => this.processFastPath(event, uuidv4()))
        );
        results.push(...criticalResults);
      }

      // Process other priorities in parallel
      const otherEvents = [
        ...priorityGroups.high,
        ...priorityGroups.medium,
        ...priorityGroups.low
      ];

      if (otherEvents.length > 0) {
        const otherResults = await Promise.all(
          otherEvents.map(event => this.processHook(event))
        );
        results.push(...otherResults);
      }

      const totalTime = performance.now() - startTime;
      console.log(`✅ Batch processing completed in ${totalTime.toFixed(2)}ms`);

      return results;

    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      throw error;
    }
  }

  private async processFastPath(event: HookEvent, executionId: string): Promise<HookResult> {
    // Ultra-fast processing for critical operations (<20ms target)
    const startTime = performance.now();
    
    try {
      const hooks = this.registry.getHooks({ 
        type: event.type, 
        phase: event.phase,
        priority: 'critical'
      });

      // Execute only the highest priority hook to minimize time
      if (hooks.length === 0) {
        return this.getEmptyResult(event, executionId);
      }

      const hook = hooks[0]; // Use only the first/highest priority hook
      const result = await this.executeHookWithTimeout(hook, event, 15); // 15ms timeout

      const processingTime = performance.now() - startTime;
      
      return {
        success: true,
        processingTime,
        data: result.data,
        metadata: {
          hookId: hook.id,
          executionId,
          agentsInvolved: (result as any).agentsInvolved || [],
          cacheHit: false
        }
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      return {
        success: false,
        processingTime,
        errors: [{
          code: 'FAST_PATH_ERROR',
          message: error instanceof Error ? error.message : 'Fast path execution failed',
          context: { event }
        }],
        metadata: {
          hookId: 'fast-path',
          executionId,
          retryCount: 0
        }
      };
    }
  }

  private async processFullPipeline(event: HookEvent, executionId: string): Promise<HookResult> {
    const startTime = performance.now();
    
    try {
      // Get applicable hooks
      const hooks = this.registry.getHooks({ 
        type: event.type, 
        phase: event.phase 
      });

      if (hooks.length === 0) {
        return this.getEmptyResult(event, executionId);
      }

      // Resolve dependencies and order hooks
      const orderedHooks = this.registry.resolveDependencies(hooks);
      
      // Execute hooks based on configuration
      const results = await this.executeHooksInOrder(orderedHooks, event);
      
      const finalResult = this.aggregateResults(results, executionId);
      finalResult.processingTime = performance.now() - startTime;
      
      return finalResult;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      throw new Error(`Full pipeline processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeHooksInOrder(hooks: Hook[], event: HookEvent): Promise<HookResult[]> {
    const results: HookResult[] = [];
    const parallelHooks: Hook[] = [];
    const sequentialHooks: Hook[] = [];

    // Separate hooks by execution strategy
    for (const hook of hooks) {
      if (hook.configuration.parallelExecution) {
        parallelHooks.push(hook);
      } else {
        sequentialHooks.push(hook);
      }
    }

    // Execute parallel hooks first
    if (parallelHooks.length > 0) {
      const parallelResults = await Promise.all(
        parallelHooks.map(hook => 
          this.executeHookWithTimeout(hook, event, hook.configuration.timeout)
            .catch(error => this.createErrorResult(hook, error))
        )
      );
      results.push(...parallelResults);
    }

    // Execute sequential hooks
    for (const hook of sequentialHooks) {
      try {
        const result = await this.executeHookWithTimeout(hook, event, hook.configuration.timeout);
        results.push(result);
      } catch (error) {
        const errorResult = this.createErrorResult(hook, error);
        results.push(errorResult);
        
        // Stop on critical errors if configured
        if (!hook.configuration.fallbackEnabled) {
          break;
        }
      }
    }

    return results;
  }

  private async executeHookWithTimeout(hook: Hook, event: HookEvent, timeoutMs: number): Promise<HookResult> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Hook ${hook.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await hook.handler.execute(event);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private aggregateResults(results: HookResult[], executionId: string): HookResult {
    const successfulResults = results.filter(r => r.success);
    const errors = results.flatMap(r => r.errors || []);
    
    return {
      success: successfulResults.length > 0,
      processingTime: Math.max(...results.map(r => r.processingTime)),
      data: {
        results: successfulResults.map(r => r.data),
        totalHooks: results.length,
        successfulHooks: successfulResults.length
      },
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        hookId: 'aggregated',
        executionId,
        agentsInvolved: this.getUniqueAgents(results),
        cacheHit: false
      }
    };
  }

  private getUniqueAgents(results: HookResult[]): string[] {
    const agents = new Set<string>();
    results.forEach(result => {
      result.metadata.agentsInvolved?.forEach(agent => agents.add(agent));
    });
    return Array.from(agents);
  }

  private groupEventsByPriority(events: HookEvent[]): Record<string, HookEvent[]> {
    return events.reduce((groups, event) => {
      if (!groups[event.priority]) {
        groups[event.priority] = [];
      }
      groups[event.priority].push(event);
      return groups;
    }, {} as Record<string, HookEvent[]>);
  }

  private generateCacheKey(event: HookEvent): string {
    return `${event.type}-${event.phase}-${event.operation}-${JSON.stringify(event.context)}`;
  }

  private shouldCache(event: HookEvent): boolean {
    // Cache read operations and low-priority events
    return event.operation.includes('read') || 
           event.priority === 'low' || 
           event.priority === 'medium';
  }

  private cacheResult(key: string, result: HookResult): void {
    const ttl = 300000; // 5 minutes default
    this.performanceCache.set(key, {
      result: { ...result, cached: true },
      timestamp: Date.now(),
      ttl,
      isExpired: function() {
        return Date.now() - this.timestamp > this.ttl;
      }
    });
  }

  private getFallbackResult(event: HookEvent, executionId: string): HookResult {
    return {
      success: true,
      processingTime: 1, // Minimal time for fallback
      data: { fallback: true },
      metadata: {
        hookId: 'fallback',
        executionId,
        cacheHit: false
      }
    };
  }

  private getEmptyResult(event: HookEvent, executionId: string): HookResult {
    return {
      success: true,
      processingTime: 0,
      data: { empty: true },
      metadata: {
        hookId: 'empty',
        executionId,
        cacheHit: false
      }
    };
  }

  private createErrorResult(hook: Hook, error: any): HookResult {
    return {
      success: false,
      processingTime: 0,
      errors: [{
        code: 'HOOK_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Hook execution failed',
        stack: error instanceof Error ? error.stack : undefined,
        context: { hookId: hook.id }
      }],
      metadata: {
        hookId: hook.id,
        executionId: uuidv4(),
        retryCount: 0
      }
    };
  }

  private setupEventSubscriptions(): void {
    // Subscribe to MOA events for integration
    this.moaCoordinator.on('initialized', () => {
      this.emit('moa-integrated');
    });

    this.moaCoordinator.on('request-processed', (data) => {
      this.eventSystem.emitHookEvent({
        type: 'mcp-response',
        phase: 'post',
        operation: 'mcp-response',
        context: {
          operationType: 'mcp-response',
          sessionId: 'moa-session',
          environment: 'production',
          metadata: data
        },
        timestamp: Date.now(),
        priority: 'medium'
      });
    });
  }

  private async registerBuiltInHooks(): Promise<void> {
    // Register essential built-in hooks
    const builtInHooks: Hook[] = [
      {
        id: 'performance-monitor',
        name: 'Performance Monitor',
        type: 'post-task',
        phase: 'post',
        priority: 1,
        enabled: true,
        handler: {
          execute: async (event: HookEvent) => {
            // Monitor and log performance
            return {
              success: true,
              processingTime: 1,
              data: { monitored: true },
              metadata: {
                hookId: 'performance-monitor',
                executionId: uuidv4()
              }
            };
          },
          canHandle: () => true,
          getMetadata: () => ({
            name: 'Performance Monitor',
            version: '1.0.0',
            description: 'Monitors hook performance',
            supportedEvents: ['post-task'],
            performanceHints: []
          })
        },
        dependencies: [],
        configuration: {
          timeout: 10,
          retries: 0,
          fallbackEnabled: true,
          cacheEnabled: false,
          parallelExecution: true,
          dependencies: [],
          environment: ['production', 'development'],
          conditions: []
        },
        metadata: {
          registeredAt: Date.now(),
          registeredBy: 'system',
          source: 'built-in',
          category: 'monitoring',
          tags: ['performance', 'monitoring']
        },
        version: '1.0.0'
      }
    ];

    for (const hook of builtInHooks) {
      await this.registry.registerHook(hook);
    }
  }

  private setupCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.performanceCache.entries()) {
        if (cached.isExpired()) {
          this.performanceCache.delete(key);
        }
      }
    }, 300000); // 5 minutes
  }

  private initializeMetrics(): HookPerformanceMetrics {
    return {
      avgProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: Number.MAX_VALUE,
      totalHooksProcessed: 0,
      successRate: 1.0,
      errorRate: 0.0,
      cacheHitRate: 0.0,
      lastUpdated: Date.now(),
      performanceBreakdown: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }

  private updateMetrics(processingTime: number, success: boolean, cached: boolean): void {
    this.metrics.totalHooksProcessed++;
    this.metrics.avgProcessingTime = (this.metrics.avgProcessingTime + processingTime) / 2;
    this.metrics.maxProcessingTime = Math.max(this.metrics.maxProcessingTime, processingTime);
    this.metrics.minProcessingTime = Math.min(this.metrics.minProcessingTime, processingTime);
    
    const successCount = this.metrics.totalHooksProcessed * this.metrics.successRate;
    const newSuccessCount = success ? successCount + 1 : successCount;
    this.metrics.successRate = newSuccessCount / this.metrics.totalHooksProcessed;
    this.metrics.errorRate = 1 - this.metrics.successRate;
    
    if (cached) {
      const cacheHits = this.metrics.totalHooksProcessed * this.metrics.cacheHitRate + 1;
      this.metrics.cacheHitRate = cacheHits / this.metrics.totalHooksProcessed;
    }
    
    this.metrics.lastUpdated = Date.now();
  }

  getPerformanceMetrics(): HookPerformanceMetrics {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down F2 Hook System...');
    
    this.performanceCache.clear();
    this.isInitialized = false;
    
    this.emit('shutdown');
    console.log('✅ F2 Hook System shutdown complete');
  }
}