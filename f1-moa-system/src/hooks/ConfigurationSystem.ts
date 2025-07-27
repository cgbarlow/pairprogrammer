// F2 Configuration System - CLAUDE.md and hooks.yaml Integration

import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { performance } from 'perf_hooks';
import type {
  ConfigurationSystem,
  ClaudeConfiguration,
  HookConfiguration,
  ConfigValidationResult,
  ConfigChangeCallback,
  F2HookConfiguration,
  AgentConfiguration,
  SwarmConfiguration,
  HookPreferences,
  PerformanceConfiguration,
  EnvironmentSettings,
  HookDefinition,
  GlobalHookSettings
} from './types.js';

export class DefaultConfigurationSystem implements ConfigurationSystem {
  private claudeConfig: ClaudeConfiguration | null = null;
  private hookConfig: HookConfiguration | null = null;
  private watchers: any[] = []; // fs.FSWatcher[] - avoiding type import issues
  private changeCallbacks: ConfigChangeCallback[] = [];

  constructor(private baseConfig: F2HookConfiguration) {}

  async loadClaudeConfig(): Promise<ClaudeConfiguration> {
    const startTime = performance.now();
    
    try {
      const configPath = path.resolve('./CLAUDE.md');
      const exists = await this.fileExists(configPath);
      
      if (!exists) {
        console.warn('⚠️ CLAUDE.md not found, using default configuration');
        this.claudeConfig = this.getDefaultClaudeConfig();
        return this.claudeConfig;
      }

      const content = await fs.readFile(configPath, 'utf-8');
      this.claudeConfig = this.parseClaudeConfig(content);
      
      // Set up file watcher for hot reload
      await this.watchConfigFile(configPath, 'claude', () => this.loadClaudeConfig());
      
      const loadTime = performance.now() - startTime;
      console.log(`📄 CLAUDE.md loaded in ${loadTime.toFixed(2)}ms`);
      
      return this.claudeConfig;
    } catch (error) {
      console.error('❌ Failed to load CLAUDE.md:', error);
      this.claudeConfig = this.getDefaultClaudeConfig();
      return this.claudeConfig;
    }
  }

  async loadHookConfig(): Promise<HookConfiguration> {
    const startTime = performance.now();
    
    try {
      const configPaths = [
        './.claude/hooks.yaml',
        './.claude/hooks.yml',
        './hooks.yaml',
        './hooks.yml'
      ];
      
      for (const configPath of configPaths) {
        if (await this.fileExists(configPath)) {
          const content = await fs.readFile(configPath, 'utf-8');
          this.hookConfig = this.parseHookConfig(content);
          
          // Set up file watcher
          await this.watchConfigFile(configPath, 'hooks', () => this.loadHookConfig());
          
          const loadTime = performance.now() - startTime;
          console.log(`🪝 Hook config loaded from ${configPath} in ${loadTime.toFixed(2)}ms`);
          
          return this.hookConfig;
        }
      }
      
      // Create default config if none found
      console.log('📝 Creating default hooks.yaml configuration');
      this.hookConfig = this.getDefaultHookConfig();
      await this.saveDefaultHookConfig();
      
      return this.hookConfig;
      
    } catch (error) {
      console.error('❌ Failed to load hook config:', error);
      this.hookConfig = this.getDefaultHookConfig();
      return this.hookConfig;
    }
  }

  async reloadConfig(): Promise<void> {
    console.log('🔄 Reloading F2 Hook System configuration...');
    
    try {
      await Promise.all([
        this.loadClaudeConfig(),
        this.loadHookConfig()
      ]);
      
      console.log('✅ Configuration reloaded successfully');
      this.notifyConfigChange('reload', 'all', undefined, { claude: this.claudeConfig, hooks: this.hookConfig });
    } catch (error) {
      console.error('❌ Failed to reload configuration:', error);
      throw error;
    }
  }

  validateConfig(): ConfigValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      // Validate Claude configuration
      if (this.claudeConfig) {
        this.validateClaudeConfig(this.claudeConfig, errors, warnings);
      }

      // Validate Hook configuration
      if (this.hookConfig) {
        this.validateHookConfig(this.hookConfig, errors, warnings);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push({
        path: 'root',
        message: `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR'
      });

      return {
        valid: false,
        errors,
        warnings
      };
    }
  }

  watchConfig(callback: ConfigChangeCallback): void {
    this.changeCallbacks.push(callback);
  }

  private parseClaudeConfig(content: string): ClaudeConfiguration {
    // Extract configuration from CLAUDE.md markdown content
    const config: ClaudeConfiguration = {
      agents: this.extractAgentConfig(content),
      swarm: this.extractSwarmConfig(content),
      hooks: this.extractHookPreferences(content),
      performance: this.extractPerformanceConfig(content),
      environment: this.extractEnvironmentSettings(content)
    };
    
    return config;
  }

  private extractAgentConfig(content: string): AgentConfiguration[] {
    const agents: AgentConfiguration[] = [];
    
    // Extract agent configurations from CLAUDE.md
    // Look for agent type patterns and available agents section
    const agentSectionMatch = content.match(/## Available Agents.*?\n([\s\S]*?)(?=\n##|\n# |$)/);
    
    if (agentSectionMatch) {
      const agentSection = agentSectionMatch[1];
      
      // Parse agent types from the content
      const agentTypeMatches = agentSection.matchAll(/- `(\w+)` - (.+)/g);
      
      for (const match of agentTypeMatches) {
        const [, type, description] = match;
        
        agents.push({
          type,
          name: this.capitalize(type.replace('-', ' ')),
          capabilities: this.inferCapabilitiesFromDescription(description),
          hooks: [],
          performance: {
            maxResponseTime: 5000,
            maxConcurrency: 1,
            cacheStrategy: 'memory'
          }
        });
      }
    }

    // Add default agents if none found
    if (agents.length === 0) {
      agents.push(...this.getDefaultAgents());
    }

    return agents;
  }

  private extractSwarmConfig(content: string): SwarmConfiguration {
    // Extract swarm configuration from CLAUDE.md
    const swarmMatch = content.match(/maxAgents:\s*(\d+)/);
    const topologyMatch = content.match(/topology:\s*[\"']?(\w+)[\"']?/);
    const strategyMatch = content.match(/strategy:\s*[\"']?(\w+)[\"']?/);

    return {
      topology: (topologyMatch?.[1] as any) || 'hierarchical',
      maxAgents: parseInt(swarmMatch?.[1] || '8'),
      strategy: (strategyMatch?.[1] as any) || 'balanced',
      coordination: {
        consensusThreshold: 0.7,
        maxCoordinationTime: 5000,
        fallbackStrategy: 'majority'
      }
    };
  }

  private extractHookPreferences(content: string): HookPreferences {
    // Extract hook preferences from CLAUDE.md
    const hookSettings = {
      enabled: content.includes('Hook') || content.includes('hook'),
      maxProcessingTime: this.extractNumberFromContent(content, 'maxProcessingTime', 50),
      parallelExecution: content.includes('parallel') || content.includes('concurrent'),
      cacheEnabled: content.includes('cache') || content.includes('Cache'),
      defaultPriority: 'medium' as const,
      errorHandling: {
        retryCount: 3,
        retryDelay: 1000,
        fallbackEnabled: true,
        circuitBreakerEnabled: true,
        circuitBreakerThreshold: 0.5
      }
    };

    return hookSettings;
  }

  private extractPerformanceConfig(content: string): PerformanceConfiguration {
    return {
      maxMemoryUsage: this.extractNumberFromContent(content, 'maxMemory', 512) * 1024 * 1024, // MB to bytes
      maxCpuUsage: this.extractNumberFromContent(content, 'maxCpu', 80),
      performanceMonitoring: true,
      metricsRetention: 86400000, // 24 hours
      optimizationEnabled: content.includes('optimization') || content.includes('performance')
    };
  }

  private extractEnvironmentSettings(content: string): EnvironmentSettings {
    return {
      name: process.env.NODE_ENV || 'development',
      variables: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        HOOK_DEBUG: process.env.HOOK_DEBUG || 'false'
      },
      features: this.extractFeaturesFromContent(content),
      restrictions: []
    };
  }

  private parseHookConfig(content: string): HookConfiguration {
    try {
      const parsed = yaml.load(content) as any;
      
      return {
        hooks: this.normalizeHookDefinitions(parsed.hooks || []),
        settings: this.normalizeGlobalSettings(parsed.settings || {}),
        environments: parsed.environments || [],
        version: parsed.version || '1.0.0',
        metadata: {
          version: parsed.version || '1.0.0',
          createdAt: Date.now(),
          lastModified: Date.now(),
          author: parsed.author || 'system',
          description: parsed.description || 'F2 Hook Configuration'
        }
      };
    } catch (error) {
      console.error('❌ Failed to parse hook configuration YAML:', error);
      return this.getDefaultHookConfig();
    }
  }

  private normalizeHookDefinitions(hooks: any[]): HookDefinition[] {
    return hooks.map(hook => ({
      name: hook.name || 'unnamed',
      type: hook.type || 'custom',
      phase: hook.phase || 'post',
      enabled: hook.enabled !== false,
      priority: hook.priority || 1,
      configuration: {
        timeout: hook.configuration?.timeout || 1000,
        retries: hook.configuration?.retries || 0,
        fallbackEnabled: hook.configuration?.fallbackEnabled !== false,
        cacheEnabled: hook.configuration?.cacheEnabled !== false,
        parallelExecution: hook.configuration?.parallelExecution !== false,
        dependencies: hook.configuration?.dependencies || [],
        environment: hook.configuration?.environment || ['development', 'production'],
        conditions: hook.configuration?.conditions || []
      },
      handler: hook.handler || 'DefaultHandler',
      description: hook.description
    }));
  }

  private normalizeGlobalSettings(settings: any): GlobalHookSettings {
    return {
      maxProcessingTime: settings.maxProcessingTime || 50,
      parallelExecution: settings.parallelExecution !== false,
      cacheEnabled: settings.cacheEnabled !== false,
      retryPolicy: {
        maxRetries: settings.retryPolicy?.maxRetries || 3,
        backoffStrategy: settings.retryPolicy?.backoffStrategy || 'exponential',
        initialDelay: settings.retryPolicy?.initialDelay || 1000,
        maxDelay: settings.retryPolicy?.maxDelay || 10000
      },
      circuitBreaker: {
        enabled: settings.circuitBreaker?.enabled !== false,
        threshold: settings.circuitBreaker?.threshold || 0.5,
        timeout: settings.circuitBreaker?.timeout || 5000,
        resetTimeout: settings.circuitBreaker?.resetTimeout || 30000
      },
      monitoring: {
        enabled: settings.monitoring?.enabled !== false,
        metricsInterval: settings.monitoring?.metricsInterval || 5000,
        logLevel: settings.monitoring?.logLevel || 'info',
        tracing: settings.monitoring?.tracing !== false
      }
    };
  }

  private async watchConfigFile(filePath: string, type: string, callback: () => void): Promise<void> {
    try {
      const { watch } = await import('fs');
      const watcher = watch(filePath, (eventType) => {
        if (eventType === 'change') {
          console.log(`📝 Configuration file changed: ${filePath}`);
          callback();
          this.notifyConfigChange('modified', filePath, undefined, undefined);
        }
      });
      
      this.watchers.push(watcher);
    } catch (error) {
      console.warn(`⚠️ Could not watch config file: ${filePath}`, error);
    }
  }

  private async saveDefaultHookConfig(): Promise<void> {
    const defaultConfig = this.getDefaultHookConfig();
    const yamlContent = yaml.dump(defaultConfig, { 
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });

    try {
      // Ensure .claude directory exists
      const claudeDir = './.claude';
      await fs.mkdir(claudeDir, { recursive: true });
      
      const configPath = path.join(claudeDir, 'hooks.yaml');
      await fs.writeFile(configPath, yamlContent, 'utf-8');
      
      console.log(`📝 Default hooks.yaml created at ${configPath}`);
    } catch (error) {
      console.error('❌ Failed to save default hook config:', error);
    }
  }

  private getDefaultClaudeConfig(): ClaudeConfiguration {
    return {
      agents: this.getDefaultAgents(),
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
        maxMemoryUsage: 512 * 1024 * 1024, // 512MB
        maxCpuUsage: 80,
        performanceMonitoring: true,
        metricsRetention: 86400000, // 24 hours
        optimizationEnabled: true
      },
      environment: {
        name: 'development',
        variables: {},
        features: ['hooks', 'monitoring', 'caching'],
        restrictions: []
      }
    };
  }

  private getDefaultAgents(): AgentConfiguration[] {
    return [
      {
        type: 'researcher',
        name: 'Research Specialist',
        capabilities: ['information_gathering', 'source_analysis', 'fact_checking'],
        hooks: [],
        performance: { maxResponseTime: 5000, maxConcurrency: 1, cacheStrategy: 'memory' }
      },
      {
        type: 'coder',
        name: 'Implementation Expert',
        capabilities: ['code_generation', 'debugging', 'optimization'],
        hooks: [],
        performance: { maxResponseTime: 5000, maxConcurrency: 1, cacheStrategy: 'memory' }
      },
      {
        type: 'analyst',
        name: 'Analysis Engine',
        capabilities: ['data_analysis', 'pattern_recognition', 'performance_evaluation'],
        hooks: [],
        performance: { maxResponseTime: 5000, maxConcurrency: 1, cacheStrategy: 'memory' }
      },
      {
        type: 'optimizer',
        name: 'Optimization Specialist',
        capabilities: ['performance_tuning', 'resource_optimization', 'efficiency_improvement'],
        hooks: [],
        performance: { maxResponseTime: 5000, maxConcurrency: 1, cacheStrategy: 'memory' }
      },
      {
        type: 'coordinator',
        name: 'Coordination Hub',
        capabilities: ['task_orchestration', 'workflow_management', 'agent_coordination'],
        hooks: [],
        performance: { maxResponseTime: 5000, maxConcurrency: 1, cacheStrategy: 'memory' }
      }
    ];
  }

  private getDefaultHookConfig(): HookConfiguration {
    return {
      version: '2.0.0',
      metadata: {
        version: '2.0.0',
        createdAt: Date.now(),
        lastModified: Date.now(),
        author: 'F2-System',
        description: 'F2 Hook System Configuration'
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
      hooks: [
        {
          name: 'performance-monitor',
          type: 'post-task',
          phase: 'post',
          enabled: true,
          priority: 1,
          configuration: {
            timeout: 10,
            retries: 0,
            fallbackEnabled: true,
            cacheEnabled: false,
            parallelExecution: true,
            dependencies: [],
            environment: ['development', 'production'],
            conditions: []
          },
          handler: 'PerformanceMonitorHandler',
          description: 'Monitors hook performance and system metrics'
        },
        {
          name: 'agent-coordinator',
          type: 'agent-spawn',
          phase: 'post',
          enabled: true,
          priority: 0,
          configuration: {
            timeout: 30,
            retries: 1,
            fallbackEnabled: true,
            cacheEnabled: true,
            parallelExecution: false,
            dependencies: [],
            environment: ['development', 'production'],
            conditions: []
          },
          handler: 'AgentCoordinatorHandler',
          description: 'Coordinates agent spawning and assignment'
        }
      ],
      environments: [
        {
          name: 'development',
          variables: { DEBUG: 'true', LOG_LEVEL: 'debug' },
          hooks: []
        },
        {
          name: 'production',
          variables: { DEBUG: 'false', LOG_LEVEL: 'info' },
          hooks: [
            { name: 'performance-monitor', enabled: true }
          ]
        }
      ]
    };
  }

  // Validation methods
  private validateClaudeConfig(config: ClaudeConfiguration, errors: any[], warnings: any[]): void {
    if (!config.agents || config.agents.length === 0) {
      warnings.push({
        path: 'agents',
        message: 'No agents configured, using defaults',
        suggestion: 'Configure agents in CLAUDE.md for better performance'
      });
    }

    if (config.swarm.maxAgents < 1 || config.swarm.maxAgents > 100) {
      errors.push({
        path: 'swarm.maxAgents',
        message: 'maxAgents must be between 1 and 100',
        code: 'INVALID_AGENT_COUNT'
      });
    }

    if (config.hooks.maxProcessingTime < 10 || config.hooks.maxProcessingTime > 10000) {
      warnings.push({
        path: 'hooks.maxProcessingTime',
        message: 'Recommended maxProcessingTime is between 10ms and 10000ms',
        suggestion: 'Adjust for optimal performance'
      });
    }
  }

  private validateHookConfig(config: HookConfiguration, errors: any[], warnings: any[]): void {
    config.hooks.forEach((hook, index) => {
      if (!hook.name) {
        errors.push({
          path: `hooks[${index}].name`,
          message: 'Hook name is required',
          code: 'MISSING_HOOK_NAME'
        });
      }

      if (!hook.type) {
        errors.push({
          path: `hooks[${index}].type`,
          message: 'Hook type is required',
          code: 'MISSING_HOOK_TYPE'
        });
      }

      if (hook.configuration.timeout < 1 || hook.configuration.timeout > 30000) {
        warnings.push({
          path: `hooks[${index}].configuration.timeout`,
          message: 'Hook timeout should be between 1ms and 30000ms',
          suggestion: 'Adjust timeout for better reliability'
        });
      }
    });
  }

  // Utility methods
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private extractNumberFromContent(content: string, key: string, defaultValue: number): number {
    const regex = new RegExp(`${key}:\\s*(\\d+)`, 'i');
    const match = content.match(regex);
    return match ? parseInt(match[1]) : defaultValue;
  }

  private extractFeaturesFromContent(content: string): string[] {
    const features: string[] = [];
    
    if (content.includes('hook') || content.includes('Hook')) {
      features.push('hooks');
    }
    if (content.includes('performance') || content.includes('Performance')) {
      features.push('performance-monitoring');
    }
    if (content.includes('cache') || content.includes('Cache')) {
      features.push('caching');
    }
    if (content.includes('parallel') || content.includes('concurrent')) {
      features.push('parallel-execution');
    }
    
    return features;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private inferCapabilitiesFromDescription(description: string): string[] {
    const capabilities: string[] = [];
    
    if (description.includes('research') || description.includes('analysis')) {
      capabilities.push('research', 'analysis');
    }
    if (description.includes('code') || description.includes('implement')) {
      capabilities.push('coding', 'implementation');
    }
    if (description.includes('test') || description.includes('quality')) {
      capabilities.push('testing', 'quality-assurance');
    }
    if (description.includes('optimize') || description.includes('performance')) {
      capabilities.push('optimization', 'performance-tuning');
    }
    if (description.includes('coordinate') || description.includes('manage')) {
      capabilities.push('coordination', 'management');
    }
    
    return capabilities.length > 0 ? capabilities : ['general'];
  }

  private notifyConfigChange(type: string, path: string, oldValue: any, newValue: any): void {
    const change = {
      type: type as any,
      path,
      oldValue,
      newValue
    };

    this.changeCallbacks.forEach(callback => {
      try {
        callback(change);
      } catch (error) {
        console.error('❌ Error in config change callback:', error);
      }
    });
  }
}