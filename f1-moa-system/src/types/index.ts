// F1 MOA System Core Types

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  capabilities: string[];
  status: AgentStatus;
  performance: AgentPerformance;
  context?: AgentContext;
}

export type AgentType = 
  | 'researcher' 
  | 'coder' 
  | 'analyst' 
  | 'optimizer' 
  | 'coordinator' 
  | 'validator'
  | 'f9_claude_expert';

export type AgentStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface AgentPerformance {
  responseTime: number;
  accuracy: number;
  consistency: number;
  lastUpdated: number;
}

export interface AgentContext {
  currentTask?: string;
  previousResponses: AgentResponse[];
  memory: Record<string, any>;
  expertise: string[];
}

export interface AgentResponse {
  agentId: string;
  response: string;
  confidence: number;
  reasoning: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ConsensusResult {
  finalResponse: string;
  confidence: number;
  processingTime: number;
  participatingAgents: string[];
  consensusMethod: 'weighted' | 'majority' | 'expert' | 'hybrid' | 'f9_enhanced_weighted' | 'traditional_weighted';
  reasoning: string;
}

export interface ASTAnalysis {
  language: string;
  nodes: ASTNode[];
  complexity: number;
  patterns: CodePattern[];
  suggestions: string[];
  parseTime: number;
}

export interface ASTNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children: ASTNode[];
  metadata?: Record<string, any>;
}

export interface CodePattern {
  type: string;
  confidence: number;
  description: string;
  location: { start: number; end: number };
  suggestions: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  examples: PromptExample[];
  performance: TemplatePerformance;
}

export interface PromptExample {
  input: Record<string, string>;
  expectedOutput: string;
  actualOutput?: string;
  success?: boolean;
}

export interface TemplatePerformance {
  successRate: number;
  avgResponseTime: number;
  usageCount: number;
  lastUsed: number;
}

export interface MOARequest {
  id: string;
  prompt: string;
  context?: Record<string, any>;
  requiredAgentTypes?: AgentType[];
  maxProcessingTime?: number;
  consensusThreshold?: number;
  astAnalysis?: boolean;
  usePromptTemplate?: string;
}

export interface MOAResponse {
  requestId: string;
  result: ConsensusResult;
  agentResponses: AgentResponse[];
  astAnalysis?: ASTAnalysis;
  processingTime: number;
  metadata: {
    timestamp: number;
    agentsUsed: number;
    consensusReached: boolean;
    templateUsed?: string;
    f9ExpertUsed?: boolean;
    analysisContext?: Record<string, any>;
  };
}

export interface MCPMessage {
  type: 'request' | 'response' | 'notification';
  id?: string;
  method?: string;
  params?: Record<string, any>;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPCapability {
  name: string;
  version: string;
  description: string;
  methods: string[];
}

export interface SystemMetrics {
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  activeAgents: number;
  consensusRate: number;
  astParseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

// F9 Claude Code Best Practices Expert Types

export interface F9ClaudeCodePattern {
  id: string;
  name: string;
  category: 'workflow' | 'performance' | 'context' | 'integration' | 'automation';
  pattern: string;
  description: string;
  useCase: string[];
  performance: {
    responseTime: number;
    efficiency: number;
    successRate: number;
  };
  implementation: {
    steps: string[];
    requirements: string[];
    benefits: string[];
  };
  examples: {
    before: string;
    after: string;
    improvement: string;
  }[];
  metadata: {
    created: number;
    lastUsed: number;
    usageCount: number;
    userRating: number;
  };
}

export interface F9WorkflowAnalysis {
  claudeCodeOptimization: {
    claudeMdSetup: {
      content: string;
      performanceImpact: string;
      optimizations: string[];
    };
    mcpServerConfig: {
      serverName: string;
      capabilities: string[];
      estimatedEfficiency: string;
    };
    hookConfiguration: {
      preEdit: string;
      postEdit: string;
      preCommit: string;
    };
    swarmCoordination: {
      agents: string[];
      coordinationStrategy: string;
      performanceTarget: string;
    };
  };
  contextManagement: {
    projectOptimization: string[];
    contextSplitting: string[];
    memoryUsage: string[];
  };
  performanceOptimizations: {
    responseTime: string[];
    toolIntegration: string[];
    automationStrategies: string[];
  };
  workflowRecommendations: {
    developmentPhases: string[];
    qualityGates: string[];
    estimatedEfficiency: string;
  };
}

export interface F9ConsensusMetrics {
  traditionalExpertWeight: number;
  f9ExpertWeight: number;
  qualityScore: number;
  workflowOptimizationScore: number;
  integratedConfidence: number;
  consensusStrength: number;
}

export interface F9EnhancedConsensusOptions {
  useF9Expert: boolean;
  f9Weight: number;
  traditionalWeight: number;
  dynamicWeighting: boolean;
  contextAware: boolean;
}

export interface F9AnalysisContext {
  projectType?: string;
  teamSize?: string;
  focusArea?: string;
  performanceRequirements?: string[];
  toolIntegrationNeeds?: string[];
  workflowOptimizationGoals?: string[];
}