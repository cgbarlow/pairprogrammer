// F8 Hook Integration - F2 Bridge with <50ms Processing
// High-performance bridge between F8 commands and F2 Hook system

import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import type {
  HookIntegration,
  ParsedCommand,
  CommandResult,
  CommandEvent,
  HookIntegrationMetrics
} from '../types.js';
import type {
  HookManager,
  HookEvent,
  HookResult,
  Hook
} from '../../hooks/types.js';
import type { F8CommandRegistry } from '../core/CommandRegistry.js';

export class F8HookIntegration implements HookIntegration {
  private metrics: HookIntegrationMetrics;
  private commandHookBindings: Map<string, Hook[]> = new Map();
  private eventHistory: CommandEvent[] = [];
  private readonly maxHistorySize = 1000;
  private readonly maxHookProcessingTime = 50; // 50ms target

  constructor(
    private hookManager: HookManager,
    private commandRegistry: F8CommandRegistry
  ) {
    this.metrics = this.initializeMetrics();
    this.setupEventHistoryCleanup();
  }

  async triggerPreCommandHooks(command: ParsedCommand): Promise<HookResult[]> {
    const startTime = performance.now();
    
    try {
      // Build pre-command hook event
      const hookEvent = this.buildPreCommandHookEvent(command);
      
      // Process global pre-command hooks
      const globalHookResult = await this.processHookWithTimeout(hookEvent);
      const results = [globalHookResult];
      
      // Process command-specific hooks
      const commandHooks = this.commandHookBindings.get(command.name) || [];
      const preHooks = commandHooks.filter(hook => 
        hook.type === 'pre-command' || 
        hook.metadata.boundToCommand === command.name
      );
      
      if (preHooks.length > 0) {
        const specificResults = await Promise.all(
          preHooks.map(hook => this.executeSpecificHook(hook, hookEvent))
        );
        results.push(...specificResults);
      }
      
      const totalTime = performance.now() - startTime;
      this.updateHookMetrics(totalTime, results.every(r => r.success));
      
      // Performance warning
      if (totalTime > this.maxHookProcessingTime) {
        console.warn(`⚠️ F8 Pre-command hooks exceeded ${this.maxHookProcessingTime}ms: ${totalTime.toFixed(2)}ms`);
      }
      
      return results;
      
    } catch (error) {
      const totalTime = performance.now() - startTime;
      this.updateHookMetrics(totalTime, false);
      
      console.error('❌ F8 Pre-command hooks failed:', error);
      
      // Return fallback result
      return [{
        success: false,
        processingTime: totalTime,
        errors: [{
          code: 'PRE_HOOK_FAILURE',
          message: error instanceof Error ? error.message : 'Pre-command hook failed',
          context: { command: command.name }
        }],
        metadata: {
          hookId: 'pre-command-fallback',
          executionId: uuidv4(),
          retryCount: 0
        }
      }];
    }
  }

  async triggerPostCommandHooks(result: CommandResult): Promise<HookResult[]> {
    const startTime = performance.now();
    
    try {
      // Build post-command hook event
      const hookEvent = this.buildPostCommandHookEvent(result);
      
      // Process global post-command hooks
      const globalHookResult = await this.processHookWithTimeout(hookEvent);
      const results = [globalHookResult];
      
      // Process command-specific hooks
      const commandHooks = this.commandHookBindings.get(result.metadata.commandName) || [];
      const postHooks = commandHooks.filter(hook => 
        hook.type === 'post-command' || 
        hook.type === 'post-task'
      );
      
      if (postHooks.length > 0) {
        const specificResults = await Promise.all(
          postHooks.map(hook => this.executeSpecificHook(hook, hookEvent))
        );
        results.push(...specificResults);
      }
      
      const totalTime = performance.now() - startTime;
      this.updateHookMetrics(totalTime, results.every(r => r.success));
      
      // Performance warning
      if (totalTime > this.maxHookProcessingTime) {
        console.warn(`⚠️ F8 Post-command hooks exceeded ${this.maxHookProcessingTime}ms: ${totalTime.toFixed(2)}ms`);
      }
      
      return results;
      
    } catch (error) {
      const totalTime = performance.now() - startTime;
      this.updateHookMetrics(totalTime, false);
      
      console.error('❌ F8 Post-command hooks failed:', error);
      
      // Return fallback result
      return [{
        success: false,
        processingTime: totalTime,
        errors: [{
          code: 'POST_HOOK_FAILURE',
          message: error instanceof Error ? error.message : 'Post-command hook failed',
          context: { command: result.metadata.commandName }
        }],
        metadata: {
          hookId: 'post-command-fallback',
          executionId: uuidv4(),
          retryCount: 0
        }
      }];
    }
  }

  async bindHooksToCommand(commandName: string, hooks: Hook[]): Promise<void> {
    try {
      // Validate hooks before binding
      for (const hook of hooks) {
        this.validateHook(hook);
      }
      
      // Store hooks for the command
      const existingHooks = this.commandHookBindings.get(commandName) || [];
      this.commandHookBindings.set(commandName, [...existingHooks, ...hooks]);
      
      // Register hooks with the F2 hook manager
      for (const hook of hooks) {
        await this.hookManager.registry.registerHook({
          ...hook,
          metadata: {
            ...hook.metadata,
            boundToCommand: commandName,
            registeredBy: 'f8-system',
            registrationTime: Date.now()
          }
        });
      }
      
      console.log(`📎 F8: Bound ${hooks.length} hooks to command /${commandName}`);
      
    } catch (error) {
      console.error(`❌ F8: Failed to bind hooks to command /${commandName}:`, error);
      throw error;
    }
  }

  async emitCommandEvent(event: CommandEvent): Promise<void> {
    try {
      // Store event in history for analytics
      this.addToEventHistory(event);
      
      // Convert to hook event and emit
      const hookEvent = this.convertCommandEventToHookEvent(event);
      await this.processHookWithTimeout(hookEvent);
      
    } catch (error) {
      console.error('❌ F8: Failed to emit command event:', error);
      // Don't throw - event emission shouldn't break command execution
    }
  }

  getHookPerformanceMetrics(): HookIntegrationMetrics {
    return { ...this.metrics };
  }

  // Advanced hook management methods
  async unbindHooksFromCommand(commandName: string): Promise<void> {
    const hooks = this.commandHookBindings.get(commandName) || [];
    
    // Unregister from F2 hook manager
    for (const hook of hooks) {
      try {
        // Note: F2HookManager doesn't have unregister method in current implementation
        // This would need to be added to F2 system for complete functionality
        console.log(`📎 F8: Would unregister hook ${hook.id} from command /${commandName}`);
      } catch (error) {
        console.warn(`⚠️ F8: Failed to unregister hook ${hook.id}:`, error);
      }
    }
    
    // Remove from local bindings
    this.commandHookBindings.delete(commandName);
    
    console.log(`📎 F8: Unbound ${hooks.length} hooks from command /${commandName}`);
  }

  getCommandHooks(commandName: string): Hook[] {
    return this.commandHookBindings.get(commandName) || [];
  }

  getEventHistory(limit?: number): CommandEvent[] {
    return limit ? this.eventHistory.slice(-limit) : [...this.eventHistory];
  }

  // Private implementation methods
  private buildPreCommandHookEvent(command: ParsedCommand): HookEvent {
    return {
      type: 'pre-command',
      phase: 'pre',
      operation: 'command-execute',
      context: {
        operationType: 'command-execute',
        command: command.name,
        sessionId: command.context.sessionId,
        environment: command.context.environment,
        metadata: {
          arguments: command.arguments,
          flags: command.flags,
          parseTime: command.metadata.parseTime,
          validationTime: command.metadata.validationTime
        }
      },
      timestamp: Date.now(),
      priority: 'high'
    };
  }

  private buildPostCommandHookEvent(result: CommandResult): HookEvent {
    return {
      type: 'post-command',
      phase: 'post',
      operation: 'command-execute',
      context: {
        operationType: 'command-execute',
        command: result.metadata.commandName,
        sessionId: 'current-session', // Would get from command context in real implementation
        environment: 'production',
        metadata: {
          success: result.success,
          executionTime: result.metadata.executionTime,
          hasData: !!result.data,
          dataType: result.data ? typeof result.data : 'none',
          suggestionsCount: result.suggestions?.length || 0
        }
      },
      timestamp: Date.now(),
      priority: 'medium'
    };
  }

  private async processHookWithTimeout(hookEvent: HookEvent): Promise<HookResult> {
    const timeout = 40; // 40ms timeout for hook processing
    
    return new Promise(async (resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          processingTime: timeout,
          errors: [{
            code: 'HOOK_TIMEOUT',
            message: `Hook processing timed out after ${timeout}ms`,
            context: { hookEvent }
          }],
          metadata: {
            hookId: 'timeout-handler',
            executionId: uuidv4(),
            retryCount: 0
          }
        });
      }, timeout);

      try {
        const result = await this.hookManager.processHook(hookEvent);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          processingTime: timeout,
          errors: [{
            code: 'HOOK_ERROR',
            message: error instanceof Error ? error.message : 'Hook processing failed',
            context: { hookEvent }
          }],
          metadata: {
            hookId: 'error-handler',
            executionId: uuidv4(),
            retryCount: 0
          }
        });
      }
    });
  }

  private async executeSpecificHook(hook: Hook, event: HookEvent): Promise<HookResult> {
    const startTime = performance.now();
    
    try {
      // Execute hook with timeout
      const timeout = hook.configuration.timeout || 30;
      const result = await Promise.race([
        hook.handler.execute(event),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Hook ${hook.id} timed out`)), timeout)
        )
      ]);
      
      const processingTime = performance.now() - startTime;
      
      return {
        success: true,
        processingTime,
        data: result.data,
        metadata: {
          hookId: hook.id,
          executionId: uuidv4(),
          retryCount: 0
        }
      };
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      return {
        success: false,
        processingTime,
        errors: [{
          code: 'SPECIFIC_HOOK_ERROR',
          message: error instanceof Error ? error.message : 'Specific hook execution failed',
          context: { hookId: hook.id }
        }],
        metadata: {
          hookId: hook.id,
          executionId: uuidv4(),
          retryCount: 0
        }
      };
    }
  }

  private validateHook(hook: Hook): void {
    if (!hook.id || !hook.name) {
      throw new Error('Hook must have id and name');
    }
    
    if (!hook.handler || typeof hook.handler.execute !== 'function') {
      throw new Error('Hook must have a valid handler with execute method');
    }
    
    if (!hook.type || !hook.phase) {
      throw new Error('Hook must have type and phase');
    }
    
    if (hook.configuration.timeout && hook.configuration.timeout > 100) {
      throw new Error('Hook timeout cannot exceed 100ms for F8 integration');
    }
  }

  private convertCommandEventToHookEvent(event: CommandEvent): HookEvent {
    const hookType = event.type === 'command-started' ? 'pre-command' : 
                    event.type === 'command-completed' ? 'post-command' : 
                    'command-error';
    
    return {
      type: hookType,
      phase: event.type === 'command-started' ? 'pre' : 'post',
      operation: 'command-event',
      context: {
        operationType: 'command-event',
        command: event.command.name,
        sessionId: event.command.context.sessionId,
        environment: event.command.context.environment,
        metadata: {
          eventType: event.type,
          timestamp: event.timestamp,
          duration: event.duration,
          hasResult: !!event.result
        }
      },
      timestamp: event.timestamp,
      priority: 'low'
    };
  }

  private addToEventHistory(event: CommandEvent): void {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private setupEventHistoryCleanup(): void {
    // Clean old events every 10 minutes
    setInterval(() => {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      this.eventHistory = this.eventHistory.filter(event => event.timestamp > cutoffTime);
    }, 600000); // 10 minutes
  }

  private updateHookMetrics(processingTime: number, success: boolean): void {
    // Update hook execution metrics
    this.metrics.totalHookExecutions++;
    
    // Running average for processing time
    const alpha = 0.1;
    this.metrics.avgHookProcessingTime = 
      this.metrics.avgHookProcessingTime * (1 - alpha) + processingTime * alpha;
    
    // Update success rate
    const successCount = this.metrics.totalHookExecutions * this.metrics.hookSuccessRate;
    const newSuccessCount = success ? successCount + 1 : successCount;
    this.metrics.hookSuccessRate = newSuccessCount / this.metrics.totalHookExecutions;
    
    // Update commands with hooks count
    this.metrics.commandsWithHooks = this.commandHookBindings.size;
  }

  private initializeMetrics(): HookIntegrationMetrics {
    return {
      avgHookProcessingTime: 0,
      hooksTriggeredPerCommand: 2, // Pre and post hooks typically
      hookSuccessRate: 1.0,
      commandsWithHooks: 0,
      totalHookExecutions: 0
    };
  }

  // Advanced features for monitoring and debugging
  getHookExecutionStats(): {
    totalExecutions: number;
    averageTime: number;
    successRate: number;
    recentFailures: Array<{ hookId: string; error: string; timestamp: number }>;
  } {
    // This would track detailed hook execution statistics
    return {
      totalExecutions: this.metrics.totalHookExecutions,
      averageTime: this.metrics.avgHookProcessingTime,
      successRate: this.metrics.hookSuccessRate,
      recentFailures: [] // Would be populated with actual failure tracking
    };
  }

  async benchmarkHookPerformance(iterations: number = 100): Promise<{
    avgPreHookTime: number;
    avgPostHookTime: number;
    recommendations: string[];
  }> {
    // Performance benchmarking for hook optimization
    const preHookTimes: number[] = [];
    const postHookTimes: number[] = [];
    
    // Mock command for testing
    const mockCommand: ParsedCommand = {
      name: 'test',
      arguments: [],
      flags: [],
      context: {
        workingDirectory: '/test',
        environment: 'development',
        sessionId: 'test-session',
        userPreferences: {} as any,
        timestamp: Date.now()
      },
      metadata: {
        rawInput: '/test',
        parseTime: 1,
        validationTime: 1
      }
    };

    const mockResult: CommandResult = {
      success: true,
      data: 'test',
      message: 'Test complete',
      metadata: {
        executionTime: 50,
        commandName: 'test',
        timestamp: Date.now()
      }
    };

    // Run benchmarks
    for (let i = 0; i < iterations; i++) {
      const preStart = performance.now();
      await this.triggerPreCommandHooks(mockCommand);
      preHookTimes.push(performance.now() - preStart);

      const postStart = performance.now();
      await this.triggerPostCommandHooks(mockResult);
      postHookTimes.push(performance.now() - postStart);
    }

    const avgPreHookTime = preHookTimes.reduce((a, b) => a + b, 0) / preHookTimes.length;
    const avgPostHookTime = postHookTimes.reduce((a, b) => a + b, 0) / postHookTimes.length;

    const recommendations: string[] = [];
    
    if (avgPreHookTime > 30) {
      recommendations.push('Consider reducing pre-command hook complexity');
    }
    
    if (avgPostHookTime > 30) {
      recommendations.push('Consider reducing post-command hook complexity');
    }
    
    if (this.commandHookBindings.size > 10) {
      recommendations.push('Consider consolidating command-specific hooks');
    }

    return {
      avgPreHookTime,
      avgPostHookTime,
      recommendations
    };
  }
}