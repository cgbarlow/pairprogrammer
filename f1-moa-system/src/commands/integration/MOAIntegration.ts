// F8 MOA Integration - F1 Bridge with <200ms Processing
// High-performance bridge between F8 commands and F1 MOA system

import { performance } from 'perf_hooks';
import type {
  MOAIntegration,
  ParsedCommand,
  CommandContext,
  MOACommandResult,
  MOARequestContext
} from '../types.js';
import type { 
  MOARequest, 
  MOAResponse, 
  AgentType 
} from '../../types/index.js';
import type { MOACoordinator } from '../../agents/MOACoordinator.js';
import type { F8CommandRegistry } from '../core/CommandRegistry.js';

export class F8MOAIntegration implements MOAIntegration {
  private resultCache: Map<string, MOACommandResult> = new Map();
  private readonly cacheSize = 500;
  private readonly cacheTTL = 300000; // 5 minutes
  private performanceMetrics: {
    totalRequests: number;
    avgProcessingTime: number;
    cacheHitRate: number;
    successRate: number;
  };

  constructor(
    private moaCoordinator: MOACoordinator,
    private commandRegistry: F8CommandRegistry
  ) {
    this.performanceMetrics = {
      totalRequests: 0,
      avgProcessingTime: 0,
      cacheHitRate: 0,
      successRate: 1.0
    };
    
    this.setupCacheCleanup();
  }

  async processMOACommand(command: ParsedCommand): Promise<MOACommandResult> {
    const startTime = performance.now();
    this.performanceMetrics.totalRequests++;
    
    try {
      // Check cache first for performance optimization
      const cacheKey = this.generateCacheKey(command);
      const cachedResult = this.getCachedResult(command);
      
      if (cachedResult) {
        this.updateMetrics(performance.now() - startTime, true, true);
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            cacheUsed: true
          }
        };
      }

      // Convert command to MOA request
      const moaRequest = await this.convertToMOARequest(command);
      
      // Process through F1 MOA system with performance monitoring
      const moaResponse = await this.processWithPerformanceMonitoring(moaRequest);
      
      const processingTime = performance.now() - startTime;
      
      // Create result object
      const result: MOACommandResult = {
        moaResponse,
        processingTime,
        agentsUsed: moaRequest.requiredAgentTypes || [],
        consensusReached: moaResponse.metadata.consensusReached,
        cacheUsed: false,
        metadata: {
          requestId: moaRequest.id,
          commandName: command.name,
          accuracy: moaResponse.result.confidence,
          confidence: moaResponse.result.confidence
        }
      };

      // Cache the result for future requests
      if (this.shouldCacheResult(command, result)) {
        this.cacheResult(cacheKey, result);
      }

      this.updateMetrics(processingTime, true, false);
      
      // Performance warning if exceeding target
      if (processingTime > 200) {
        console.warn(`⚠️ F8 MOA processing exceeded 200ms: ${processingTime.toFixed(2)}ms for command "${command.name}"`);
      }

      return result;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateMetrics(processingTime, false, false);
      
      console.error(`❌ F8 MOA processing failed for command "${command.name}":`, error);
      throw new Error(`MOA processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  selectOptimalAgents(commandType: string): AgentType[] {
    // Optimized agent selection based on command type and performance data
    const agentMapping: Record<string, AgentType[]> = {
      'analyze': ['analyst', 'researcher', 'coder'],
      'optimize': ['optimizer', 'coder', 'analyst'], 
      'review': ['validator', 'analyst', 'researcher'],
      'moa': ['coordinator', 'researcher', 'analyst'],
      'help': [] // Help doesn't need MOA agents
    };
    
    const baseAgents = agentMapping[commandType] || ['researcher', 'analyst'];
    
    // Add dynamic agent selection based on context
    return this.optimizeAgentSelection(baseAgents, commandType);
  }

  convertCommandContext(context: CommandContext): MOARequestContext {
    return {
      originalCommand: context.workingDirectory,
      targetCode: this.extractCodeFromUserPreferences(context),
      analysisType: this.inferAnalysisTypeFromEnvironment(context),
      optimizationGoals: this.extractOptimizationGoalsFromSession(context),
      reviewCriteria: this.extractReviewCriteriaFromPreferences(context),
      customPrompt: this.buildCustomPromptFromContext(context)
    };
  }

  getCachedResult(command: ParsedCommand): MOACommandResult | null {
    const cacheKey = this.generateCacheKey(command);
    const cached = this.resultCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache entry is expired
    const now = Date.now();
    const cacheAge = now - cached.metadata.requestId.split('-')[1];
    
    if (cacheAge > this.cacheTTL) {
      this.resultCache.delete(cacheKey);
      return null;
    }
    
    return cached;
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  // Private implementation methods
  private async convertToMOARequest(command: ParsedCommand): Promise<MOARequest> {
    const slashCommand = this.commandRegistry.findCommand(command.name);
    if (!slashCommand) {
      throw new Error(`Command not found in registry: ${command.name}`);
    }

    // Build optimized prompt based on command type
    const prompt = this.buildOptimizedPrompt(command);
    const context = this.convertCommandContext(command.context);
    const agents = slashCommand.metadata.integration.requiredAgents;

    return {
      id: this.generateRequestId(command),
      prompt,
      context: {
        ...context,
        commandMetadata: {
          name: command.name,
          arguments: command.arguments,
          flags: command.flags,
          timestamp: command.context.timestamp
        }
      },
      requiredAgentTypes: agents.length > 0 ? agents : this.selectOptimalAgents(command.name),
      consensusThreshold: this.calculateOptimalConsensusThreshold(command),
      astAnalysis: this.shouldPerformASTAnalysis(command),
      usePromptTemplate: this.selectPromptTemplate(command.name)
    };
  }

  private async processWithPerformanceMonitoring(request: MOARequest): Promise<MOAResponse> {
    const startTime = performance.now();
    
    try {
      const response = await this.moaCoordinator.processRequest(request);
      const processingTime = performance.now() - startTime;
      
      // Log performance metrics for monitoring
      if (processingTime > 150) {
        console.warn(`⚠️ F1 MOA processing time: ${processingTime.toFixed(2)}ms (request: ${request.id})`);
      }
      
      return response;
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ F1 MOA processing failed after ${processingTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  private buildOptimizedPrompt(command: ParsedCommand): string {
    const basePrompts: Record<string, (cmd: ParsedCommand) => string> = {
      analyze: (cmd) => {
        const code = cmd.arguments[0]?.value as string;
        const type = this.getFlagValue(cmd, 'type', 'ast');
        const depth = this.getFlagValue(cmd, 'depth', 'shallow');
        
        return `Perform ${depth} ${type} analysis of the following code:

\`\`\`
${code}
\`\`\`

Focus on providing actionable insights and specific recommendations.`;
      },
      
      optimize: (cmd) => {
        const code = cmd.arguments[0]?.value as string;
        const goals = this.getFlagValue(cmd, 'goals', 'performance').split(',');
        const aggressiveness = this.getFlagValue(cmd, 'aggressiveness', 'moderate');
        
        return `Optimize the following code with ${aggressiveness} approach for: ${goals.join(', ')}

\`\`\`
${code}
\`\`\`

Provide specific optimization strategies and expected improvements.`;
      },
      
      review: (cmd) => {
        const code = cmd.arguments[0]?.value as string;
        const criteria = this.getFlagValue(cmd, 'criteria', 'code-quality,best-practices').split(',');
        const format = this.getFlagValue(cmd, 'format', 'detailed');
        
        return `Review the following code focusing on: ${criteria.join(', ')}

\`\`\`
${code}
\`\`\`

Provide ${format} feedback with specific recommendations and examples.`;
      },
      
      moa: (cmd) => {
        return cmd.arguments[0]?.value as string;
      }
    };

    const promptBuilder = basePrompts[command.name];
    if (!promptBuilder) {
      return `Process the following command: ${command.name} with arguments: ${JSON.stringify(command.arguments)}`;
    }

    return promptBuilder(command);
  }

  private optimizeAgentSelection(baseAgents: AgentType[], commandType: string): AgentType[] {
    // Add performance-based agent optimization
    const optimizedAgents = [...baseAgents];
    
    // Add coordinator for complex operations
    if (baseAgents.length > 2 && !optimizedAgents.includes('coordinator')) {
      optimizedAgents.push('coordinator');
    }
    
    // Add validator for review-type operations
    if (commandType.includes('review') || commandType.includes('quality')) {
      if (!optimizedAgents.includes('validator')) {
        optimizedAgents.push('validator');
      }
    }
    
    // Limit to maximum of 4 agents for performance
    return optimizedAgents.slice(0, 4);
  }

  private calculateOptimalConsensusThreshold(command: ParsedCommand): number {
    // Dynamic consensus threshold based on command criticality
    const thresholds: Record<string, number> = {
      analyze: 0.7,    // Lower threshold for analysis (more exploratory)
      optimize: 0.8,   // Higher threshold for optimization (more critical)
      review: 0.75,    // Medium threshold for review
      moa: 0.7,       // Configurable via flags
      help: 0.6       // Low threshold for help
    };
    
    let threshold = thresholds[command.name] || 0.7;
    
    // Check for custom consensus flag
    const customConsensus = this.getFlagValue(command, 'consensus', null);
    if (customConsensus) {
      const parsed = parseFloat(customConsensus);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        threshold = parsed;
      }
    }
    
    return threshold;
  }

  private shouldPerformASTAnalysis(command: ParsedCommand): boolean {
    // AST analysis is beneficial for code-related commands
    const astCommands = ['analyze', 'optimize', 'review'];
    
    if (!astCommands.includes(command.name)) {
      return false;
    }
    
    // Check if the first argument looks like code
    const firstArg = command.arguments[0]?.value as string;
    if (!firstArg) {
      return false;
    }
    
    return this.looksLikeCode(firstArg);
  }

  private looksLikeCode(content: string): boolean {
    // Simple heuristics to detect if content is code
    const codeIndicators = [
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /=>\s*{/,
      /import\s+.*from/,
      /export\s+(default\s+)?/,
      /{[\s\S]*}/,
      /\(\s*\)\s*=>/
    ];
    
    return codeIndicators.some(pattern => pattern.test(content));
  }

  private selectPromptTemplate(commandName: string): string | undefined {
    const templateMapping: Record<string, string> = {
      'analyze': 'analysis',
      'optimize': 'optimization', 
      'review': 'review'
    };
    
    return templateMapping[commandName];
  }

  private generateRequestId(command: ParsedCommand): string {
    return `f8-${command.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(command: ParsedCommand): string {
    // Create a stable cache key from command components
    const keyComponents = [
      command.name,
      JSON.stringify(command.arguments.map(arg => ({ name: arg.name, value: arg.value }))),
      JSON.stringify(command.flags.map(flag => ({ name: flag.name, value: flag.value })))
    ];
    
    return keyComponents.join('|');
  }

  private shouldCacheResult(command: ParsedCommand, result: MOACommandResult): boolean {
    // Cache successful results for non-user-specific commands
    if (!result.moaResponse.metadata.consensusReached) {
      return false;
    }
    
    // Don't cache if processing took too long (likely complex/unique)
    if (result.processingTime > 5000) {
      return false;
    }
    
    // Don't cache personal/session-specific results
    const sessionSpecificFlags = ['verbose', 'interactive'];
    if (command.flags.some(flag => sessionSpecificFlags.includes(flag.name))) {
      return false;
    }
    
    return this.resultCache.size < this.cacheSize;
  }

  private cacheResult(key: string, result: MOACommandResult): void {
    // LRU cache implementation
    if (this.resultCache.size >= this.cacheSize) {
      const firstKey = this.resultCache.keys().next().value;
      this.resultCache.delete(firstKey);
    }
    
    this.resultCache.set(key, {
      ...result,
      metadata: {
        ...result.metadata,
        cachedAt: Date.now()
      }
    });
  }

  private setupCacheCleanup(): void {
    // Clean expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, result] of this.resultCache.entries()) {
        const cacheAge = now - (result.metadata.cachedAt || 0);
        if (cacheAge > this.cacheTTL) {
          this.resultCache.delete(key);
        }
      }
    }, 300000); // 5 minutes
  }

  private updateMetrics(processingTime: number, success: boolean, cached: boolean): void {
    // Update running averages efficiently
    const alpha = 0.1; // Smoothing factor
    this.performanceMetrics.avgProcessingTime = 
      this.performanceMetrics.avgProcessingTime * (1 - alpha) + processingTime * alpha;
    
    // Update success rate
    const successCount = this.performanceMetrics.totalRequests * this.performanceMetrics.successRate;
    const newSuccessCount = success ? successCount + 1 : successCount;
    this.performanceMetrics.successRate = newSuccessCount / this.performanceMetrics.totalRequests;
    
    // Update cache hit rate
    if (cached) {
      const cacheHits = this.performanceMetrics.totalRequests * this.performanceMetrics.cacheHitRate + 1;
      this.performanceMetrics.cacheHitRate = cacheHits / this.performanceMetrics.totalRequests;
    }
  }

  private getFlagValue(command: ParsedCommand, flagName: string, defaultValue: string | null): string {
    const flag = command.flags.find(f => f.name === flagName);
    return flag ? String(flag.value) : (defaultValue || '');
  }

  // Context extraction helper methods
  private extractCodeFromUserPreferences(context: CommandContext): string | undefined {
    // Extract code context from user preferences or session
    return undefined; // Implementation would depend on user session management
  }

  private inferAnalysisTypeFromEnvironment(context: CommandContext): string | undefined {
    // Infer analysis type from current environment
    if (context.environment === 'production') {
      return 'performance';
    } else if (context.environment === 'development') {
      return 'quality';
    }
    return undefined;
  }

  private extractOptimizationGoalsFromSession(context: CommandContext): string[] | undefined {
    // Extract optimization goals from session history
    return undefined; // Would analyze recent commands and preferences
  }

  private extractReviewCriteriaFromPreferences(context: CommandContext): string[] | undefined {
    // Extract review criteria from user preferences
    const defaultCriteria = context.userPreferences.defaultAgents.includes('validator') 
      ? ['code-quality', 'best-practices']
      : ['code-quality'];
    
    return defaultCriteria;
  }

  private buildCustomPromptFromContext(context: CommandContext): string | undefined {
    // Build custom prompt additions based on context
    const promptAdditions: string[] = [];
    
    if (context.userPreferences.verboseOutput) {
      promptAdditions.push('Provide detailed explanations and examples.');
    }
    
    if (context.environment === 'production') {
      promptAdditions.push('Focus on production-ready solutions and best practices.');
    }
    
    return promptAdditions.length > 0 ? promptAdditions.join(' ') : undefined;
  }
}