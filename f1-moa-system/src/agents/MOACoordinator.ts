// F1 MOA System - 6-Agent Coordinator with Task Tool Integration

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Agent, 
  AgentType, 
  MOARequest, 
  MOAResponse, 
  AgentResponse, 
  ConsensusResult,
  SystemMetrics 
} from '../types/index.js';
import { ConsensusEngine } from '../consensus/ConsensusEngine.js';
import { PromptingSystem } from '../prompting/PromptingSystem.js';
import { ASTAnalyzer } from '../ast/ASTAnalyzer.js';

export class MOACoordinator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private consensusEngine: ConsensusEngine;
  private promptingSystem: PromptingSystem;
  private astAnalyzer: ASTAnalyzer;
  private metrics: SystemMetrics;
  private isInitialized = false;

  constructor() {
    super();
    this.consensusEngine = new ConsensusEngine();
    this.promptingSystem = new PromptingSystem();
    this.astAnalyzer = new ASTAnalyzer();
    this.metrics = this.initializeMetrics();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing F1 MOA System with 6-Agent Swarm...');
    
    // Initialize core systems
    await this.astAnalyzer.initialize();
    await this.promptingSystem.initialize();
    
    // Spawn the 6 core agents using Task tool pattern
    await this.spawnCoreAgents();
    
    this.isInitialized = true;
    console.log('✅ F1 MOA System initialized with 6 agents');
    this.emit('initialized', { agentCount: this.agents.size });
  }

  private async spawnCoreAgents(): Promise<void> {
    const coreAgentTypes: { type: AgentType; name: string; capabilities: string[] }[] = [
      {
        type: 'researcher',
        name: 'Research Specialist',
        capabilities: ['information_gathering', 'source_analysis', 'fact_checking', 'trend_identification']
      },
      {
        type: 'coder',
        name: 'Implementation Expert',
        capabilities: ['code_generation', 'debugging', 'optimization', 'architecture_design']
      },
      {
        type: 'analyst',
        name: 'Analysis Engine',
        capabilities: ['data_analysis', 'pattern_recognition', 'performance_evaluation', 'risk_assessment']
      },
      {
        type: 'optimizer',
        name: 'Optimization Specialist',
        capabilities: ['performance_tuning', 'resource_optimization', 'efficiency_improvement', 'bottleneck_detection']
      },
      {
        type: 'coordinator',
        name: 'Coordination Hub',
        capabilities: ['task_orchestration', 'workflow_management', 'agent_coordination', 'decision_synthesis']
      },
      {
        type: 'validator',
        name: 'Quality Assurance',
        capabilities: ['validation', 'testing', 'quality_control', 'compliance_checking']
      }
    ];

    // Spawn all agents in parallel (simulating Task tool pattern)
    const agentPromises = coreAgentTypes.map(agentSpec => this.spawnAgent(agentSpec));
    await Promise.all(agentPromises);
  }

  private async spawnAgent(spec: { type: AgentType; name: string; capabilities: string[] }): Promise<Agent> {
    const agent: Agent = {
      id: uuidv4(),
      type: spec.type,
      name: spec.name,
      capabilities: spec.capabilities,
      status: 'idle',
      performance: {
        responseTime: 0,
        accuracy: 1.0,
        consistency: 1.0,
        lastUpdated: Date.now()
      },
      context: {
        previousResponses: [],
        memory: {},
        expertise: spec.capabilities
      }
    };

    this.agents.set(agent.id, agent);
    console.log(`🤖 Spawned ${agent.type} agent: ${agent.name} (${agent.id.slice(0, 8)})`);
    
    return agent;
  }

  async processRequest(request: MOARequest): Promise<MOAResponse> {
    const startTime = Date.now();
    console.log(`📝 Processing MOA request: ${request.id}`);

    try {
      // AST Analysis if requested
      let astAnalysis;
      if (request.astAnalysis) {
        astAnalysis = await this.astAnalyzer.analyze(request.prompt);
      }

      // Apply prompt template if specified
      let processedPrompt = request.prompt;
      if (request.usePromptTemplate) {
        processedPrompt = await this.promptingSystem.applyTemplate(
          request.usePromptTemplate,
          request.context || {}
        );
      }

      // Get relevant agents
      const selectedAgents = this.selectAgents(request.requiredAgentTypes);
      
      // Parallel agent processing
      const agentResponses = await this.processWithAgents(
        selectedAgents,
        processedPrompt,
        request.context
      );

      // Consensus building
      const consensusResult = await this.consensusEngine.buildConsensus(
        agentResponses,
        request.consensusThreshold || 0.7
      );

      const processingTime = Date.now() - startTime;
      
      // Update metrics
      this.updateMetrics(processingTime, agentResponses.length, true);

      const response: MOAResponse = {
        requestId: request.id,
        result: consensusResult,
        agentResponses,
        astAnalysis,
        processingTime,
        metadata: {
          timestamp: Date.now(),
          agentsUsed: selectedAgents.length,
          consensusReached: consensusResult.confidence >= (request.consensusThreshold || 0.7),
          templateUsed: request.usePromptTemplate
        }
      };

      console.log(`✅ MOA request completed in ${processingTime}ms (${selectedAgents.length} agents)`);
      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, 0, false);
      console.error('❌ MOA request failed:', error);
      throw error;
    }
  }

  private selectAgents(requiredTypes?: AgentType[]): Agent[] {
    if (requiredTypes && requiredTypes.length > 0) {
      return Array.from(this.agents.values()).filter(agent => 
        requiredTypes.includes(agent.type)
      );
    }
    
    // Use all available agents by default
    return Array.from(this.agents.values());
  }

  private async processWithAgents(
    agents: Agent[],
    prompt: string,
    context?: Record<string, any>
  ): Promise<AgentResponse[]> {
    console.log(`🔄 Processing with ${agents.length} agents in parallel...`);

    const agentPromises = agents.map(agent => this.processWithAgent(agent, prompt, context));
    const responses = await Promise.all(agentPromises);

    return responses.filter(response => response !== null) as AgentResponse[];
  }

  private async processWithAgent(
    agent: Agent,
    prompt: string,
    context?: Record<string, any>
  ): Promise<AgentResponse | null> {
    const startTime = Date.now();
    
    try {
      // Update agent status
      agent.status = 'processing';
      
      // Simulate agent processing with specialized response based on type
      const response = await this.generateAgentResponse(agent, prompt, context);
      
      const responseTime = Date.now() - startTime;
      
      // Update agent performance
      agent.performance.responseTime = responseTime;
      agent.performance.lastUpdated = Date.now();
      agent.status = 'completed';

      const agentResponse: AgentResponse = {
        agentId: agent.id,
        response: response.content,
        confidence: response.confidence,
        reasoning: response.reasoning,
        timestamp: Date.now(),
        metadata: {
          agentType: agent.type,
          agentName: agent.name,
          responseTime,
          capabilities: agent.capabilities
        }
      };

      // Store in agent context
      if (agent.context) {
        agent.context.previousResponses.push(agentResponse);
        // Keep only last 10 responses
        if (agent.context.previousResponses.length > 10) {
          agent.context.previousResponses = agent.context.previousResponses.slice(-10);
        }
      }

      return agentResponse;

    } catch (error) {
      console.error(`❌ Agent ${agent.name} failed:`, error);
      agent.status = 'error';
      return null;
    }
  }

  private async generateAgentResponse(
    agent: Agent,
    prompt: string,
    context?: Record<string, any>
  ): Promise<{ content: string; confidence: number; reasoning: string }> {
    // Simulate agent-specific processing based on type
    const processingDelay = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    let content: string;
    let confidence: number;
    let reasoning: string;

    switch (agent.type) {
      case 'researcher':
        content = `Research analysis: ${this.generateResearchResponse(prompt)}`;
        confidence = 0.85 + Math.random() * 0.1;
        reasoning = 'Based on information gathering and source analysis capabilities';
        break;
        
      case 'coder':
        content = `Implementation approach: ${this.generateCodeResponse(prompt)}`;
        confidence = 0.88 + Math.random() * 0.1;
        reasoning = 'Based on code generation and architecture design expertise';
        break;
        
      case 'analyst':
        content = `Analysis insights: ${this.generateAnalysisResponse(prompt)}`;
        confidence = 0.82 + Math.random() * 0.15;
        reasoning = 'Based on pattern recognition and data analysis capabilities';
        break;
        
      case 'optimizer':
        content = `Optimization recommendations: ${this.generateOptimizationResponse(prompt)}`;
        confidence = 0.80 + Math.random() * 0.15;
        reasoning = 'Based on performance tuning and efficiency improvement expertise';
        break;
        
      case 'coordinator':
        content = `Coordination strategy: ${this.generateCoordinationResponse(prompt)}`;
        confidence = 0.90 + Math.random() * 0.05;
        reasoning = 'Based on task orchestration and workflow management capabilities';
        break;
        
      case 'validator':
        content = `Validation assessment: ${this.generateValidationResponse(prompt)}`;
        confidence = 0.87 + Math.random() * 0.1;
        reasoning = 'Based on quality control and compliance checking capabilities';
        break;
        
      default:
        content = `General response: ${prompt}`;
        confidence = 0.75;
        reasoning = 'Generic agent response';
    }

    return { content, confidence, reasoning };
  }

  private generateResearchResponse(prompt: string): string {
    return `Conducting research on "${prompt}". Key findings: feasibility analysis, relevant sources identified, current best practices documented.`;
  }

  private generateCodeResponse(prompt: string): string {
    return `Code implementation strategy for "${prompt}": modular architecture, type-safe implementation, performance considerations, testing approach.`;
  }

  private generateAnalysisResponse(prompt: string): string {
    return `Analysis of "${prompt}": pattern identification, data insights, risk factors, performance implications.`;
  }

  private generateOptimizationResponse(prompt: string): string {
    return `Optimization recommendations for "${prompt}": performance bottlenecks identified, resource usage optimization, efficiency improvements.`;
  }

  private generateCoordinationResponse(prompt: string): string {
    return `Coordination approach for "${prompt}": task breakdown, workflow orchestration, agent assignments, timeline planning.`;
  }

  private generateValidationResponse(prompt: string): string {
    return `Validation criteria for "${prompt}": quality metrics, compliance requirements, testing strategies, acceptance criteria.`;
  }

  getSystemMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getAgentStatus(): Agent[] {
    return Array.from(this.agents.values());
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down F1 MOA System...');
    
    // Set all agents to idle
    for (const agent of this.agents.values()) {
      agent.status = 'idle';
    }
    
    this.emit('shutdown');
    console.log('✅ F1 MOA System shutdown complete');
  }

  private initializeMetrics(): SystemMetrics {
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      successRate: 1.0,
      activeAgents: 0,
      consensusRate: 1.0,
      astParseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }

  private updateMetrics(processingTime: number, agentsUsed: number, success: boolean): void {
    this.metrics.totalRequests++;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + processingTime) / 2;
    this.metrics.successRate = (this.metrics.successRate * (this.metrics.totalRequests - 1) + (success ? 1 : 0)) / this.metrics.totalRequests;
    this.metrics.activeAgents = agentsUsed;
  }
}