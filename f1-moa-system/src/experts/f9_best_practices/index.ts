// F9 Claude Code Best Practices Expert - Main Export Module
// Production-ready 6th expert for MOA system integration

export { F9BestPracticesAgent } from './F9BestPracticesAgent.js';
export { F9KnowledgeBase } from './F9KnowledgeBase.js';
export { F9IntegratedMOACoordinator } from './F9IntegratedMOACoordinator.js';
export { F9EnhancedConsensusEngine } from './F9EnhancedConsensusEngine.js';

// Export F9-specific types
export type {
  F9WorkflowAnalysis,
  F9BestPracticesKnowledge,
  F9EnhancedConsensusOptions,
  F9AnalysisContext,
  F9ConsensusMetrics,
  ClaudeCodePattern,
  MCPIntegrationPattern,
  WorkflowOptimization,
  PerformanceBenchmark
} from './F9BestPracticesAgent.js';

export type {
  F9ConsensusStrategy,
  F9ExpertResponse
} from './F9EnhancedConsensusEngine.js';

// Main F9 Integration Factory
export class F9ExpertSystem {
  static async createF9EnhancedMOASystem(): Promise<F9IntegratedMOACoordinator> {
    const coordinator = new F9IntegratedMOACoordinator();
    await coordinator.initialize();
    return coordinator;
  }

  static async createF9Agent(): Promise<F9BestPracticesAgent> {
    const agent = new F9BestPracticesAgent();
    await agent.initialize();
    return agent;
  }

  static async createF9KnowledgeBase(): Promise<F9KnowledgeBase> {
    const kb = new F9KnowledgeBase();
    await kb.initialize();
    return kb;
  }

  static createF9ConsensusEngine(): F9EnhancedConsensusEngine {
    return new F9EnhancedConsensusEngine();
  }

  static getF9SystemInfo(): {
    version: string;
    expertType: string;
    capabilities: string[];
    integrationLevel: string;
    performanceTargets: Record<string, number>;
  } {
    return {
      version: '1.0.0',
      expertType: 'Claude Code Best Practices Expert',
      capabilities: [
        'claude_code_workflow_optimization',
        'mcp_integration_expertise',
        'development_process_automation',
        'ai_native_development_patterns',
        'tool_augmentation_strategies',
        'performance_optimization',
        'context_management',
        'swarm_coordination'
      ],
      integrationLevel: '6th_expert_moa_integration',
      performanceTargets: {
        workflow_analysis: 150, // ms
        tool_integration_guidance: 200, // ms
        performance_optimization: 175, // ms
        context_management: 100, // ms
        mcp_development_guidance: 250 // ms
      }
    };
  }
}