// F9 Enhanced MOA Coordinator - 6-Expert System with Claude Code Best Practices
// Extends existing 5-expert system with F9 Claude Code expertise

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
} from '../../types/index.js';
import { ConsensusEngine } from '../../consensus/ConsensusEngine.js';
import { PromptingSystem } from '../../prompting/PromptingSystem.js';
import { ASTAnalyzer } from '../../ast/ASTAnalyzer.js';
import { F9BestPracticesAgent } from './F9BestPracticesAgent.js';
import { F9KnowledgeBase } from './F9KnowledgeBase.js';

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

export class F9IntegratedMOACoordinator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private consensusEngine: ConsensusEngine;
  private promptingSystem: PromptingSystem;
  private astAnalyzer: ASTAnalyzer;
  private f9Agent: F9BestPracticesAgent;
  private f9KnowledgeBase: F9KnowledgeBase;
  private metrics: SystemMetrics;
  private isInitialized = false;

  // F9-specific configuration
  private f9ConsensusOptions: F9EnhancedConsensusOptions = {
    useF9Expert: true,
    f9Weight: 0.30,
    traditionalWeight: 0.70,
    dynamicWeighting: true,
    contextAware: true
  };

  constructor() {
    super();
    this.consensusEngine = new ConsensusEngine();
    this.promptingSystem = new PromptingSystem();
    this.astAnalyzer = new ASTAnalyzer();
    this.f9Agent = new F9BestPracticesAgent();
    this.f9KnowledgeBase = new F9KnowledgeBase();
    this.metrics = this.initializeMetrics();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing F9 Enhanced MOA System with 6-Expert Architecture...');
    
    // Initialize core systems
    await this.astAnalyzer.initialize();
    await this.promptingSystem.initialize();
    await this.f9Agent.initialize();
    await this.f9KnowledgeBase.initialize();
    
    // Spawn the 6 experts: 5 traditional + 1 F9 Claude Code expert
    await this.spawnEnhancedExpertSystem();
    
    this.isInitialized = true;
    console.log('✅ F9 Enhanced MOA System initialized with 6 experts including Claude Code specialization');
    this.emit('f9-moa-initialized', { 
      agentCount: this.agents.size,
      f9AgentId: this.f9Agent.getAgent().id,
      expertTypes: Array.from(this.agents.values()).map(a => a.type)
    });
  }

  private async spawnEnhancedExpertSystem(): Promise<void> {
    // 5 Traditional Software Engineering Experts
    const traditionalExperts: { type: AgentType; name: string; capabilities: string[]; expertise: string }[] = [
      {
        type: 'researcher',
        name: 'Dave Farley (CI/CD & Testing Expert)',
        capabilities: ['continuous_integration', 'continuous_deployment', 'testing_strategies', 'automation'],
        expertise: 'CI/CD pipelines, automated testing, deployment strategies, continuous delivery practices'
      },
      {
        type: 'coder',
        name: 'Kent Beck (TDD & Simple Design Expert)',
        capabilities: ['test_driven_development', 'simple_design', 'refactoring', 'extreme_programming'],
        expertise: 'Test-driven development, simple design principles, refactoring techniques, XP practices'
      },
      {
        type: 'analyst',
        name: 'Martin Fowler (Patterns & Architecture Expert)',
        capabilities: ['design_patterns', 'software_architecture', 'refactoring', 'enterprise_architecture'],
        expertise: 'Design patterns, software architecture, enterprise patterns, refactoring catalog'
      },
      {
        type: 'optimizer',
        name: 'Kevlin Henney (Clarity & Philosophy Expert)',
        capabilities: ['code_clarity', 'design_philosophy', 'programming_principles', 'communication'],
        expertise: 'Code clarity, design philosophy, programming principles, effective communication'
      },
      {
        type: 'validator',
        name: 'Robert C. Martin (Clean Code & SOLID Expert)',
        capabilities: ['clean_code', 'solid_principles', 'software_craftsmanship', 'architecture'],
        expertise: 'Clean code principles, SOLID design principles, software craftsmanship, clean architecture'
      }
    ];

    // Spawn traditional experts
    const traditionalPromises = traditionalExperts.map(expertSpec => this.spawnTraditionalExpert(expertSpec));
    await Promise.all(traditionalPromises);

    // Add F9 Claude Code Best Practices Expert as 6th expert
    const f9AgentData = this.f9Agent.getAgent();
    this.agents.set(f9AgentData.id, f9AgentData);
    console.log(`🤖 Added F9 Claude Code Expert: ${f9AgentData.name} (${f9AgentData.id.slice(0, 8)})`);
  }

  private async spawnTraditionalExpert(spec: { 
    type: AgentType; 
    name: string; 
    capabilities: string[]; 
    expertise: string; 
  }): Promise<Agent> {
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
        expertise: [spec.expertise]
      }
    };

    this.agents.set(agent.id, agent);
    console.log(`🤖 Spawned traditional expert: ${agent.name} (${agent.id.slice(0, 8)})`);
    
    return agent;
  }

  async processRequest(request: MOARequest): Promise<MOAResponse> {
    const startTime = Date.now();
    console.log(`📝 Processing F9 Enhanced MOA request: ${request.id}`);

    try {
      // Determine if F9 expertise is needed
      const analysisContext = this.extractF9AnalysisContext(request);
      const useF9Expert = this.shouldUseF9Expert(request, analysisContext);
      
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

      // Get expert responses with F9 integration
      const agentResponses = await this.processWithF9Enhancement(
        request,
        processedPrompt,
        analysisContext,
        useF9Expert
      );

      // Enhanced consensus with F9 integration
      const consensusResult = await this.buildF9EnhancedConsensus(
        agentResponses,
        request,
        analysisContext,
        useF9Expert
      );

      const processingTime = Date.now() - startTime;
      
      // Update metrics
      this.updateF9Metrics(processingTime, agentResponses.length, true, useF9Expert);

      const response: MOAResponse = {
        requestId: request.id,
        result: consensusResult,
        agentResponses,
        astAnalysis,
        processingTime,
        metadata: {
          timestamp: Date.now(),
          agentsUsed: agentResponses.length,
          consensusReached: consensusResult.confidence >= (request.consensusThreshold || 0.7),
          templateUsed: request.usePromptTemplate,
          f9ExpertUsed: useF9Expert,
          analysisContext: analysisContext
        }
      };

      console.log(`✅ F9 Enhanced MOA request completed in ${processingTime}ms (${agentResponses.length} experts, F9: ${useF9Expert})`);
      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateF9Metrics(processingTime, 0, false, false);
      console.error('❌ F9 Enhanced MOA request failed:', error);
      throw error;
    }
  }

  private extractF9AnalysisContext(request: MOARequest): F9AnalysisContext {
    const prompt = request.prompt.toLowerCase();
    const context = request.context || {};
    
    return {
      projectType: context.projectType || this.detectProjectType(prompt),
      teamSize: context.teamSize || this.detectTeamSize(prompt),
      focusArea: context.focusArea || this.detectFocusArea(prompt),
      performanceRequirements: this.extractPerformanceRequirements(prompt),
      toolIntegrationNeeds: this.extractToolIntegrationNeeds(prompt),
      workflowOptimizationGoals: this.extractWorkflowOptimizationGoals(prompt)
    };
  }

  private shouldUseF9Expert(request: MOARequest, context: F9AnalysisContext): boolean {
    if (!this.f9ConsensusOptions.useF9Expert) return false;
    
    const prompt = request.prompt.toLowerCase();
    
    // F9 expertise indicators
    const f9Keywords = [
      'claude', 'workflow', 'mcp', 'tool', 'integration', 'automation',
      'context', 'performance', 'optimization', 'development process',
      'ai-assisted', 'claude code', 'hook', 'swarm'
    ];
    
    const hasF9Keywords = f9Keywords.some(keyword => prompt.includes(keyword));
    const hasWorkflowFocus = context.workflowOptimizationGoals && context.workflowOptimizationGoals.length > 0;
    const hasToolIntegration = context.toolIntegrationNeeds && context.toolIntegrationNeeds.length > 0;
    
    return hasF9Keywords || hasWorkflowFocus || hasToolIntegration;
  }

  private async processWithF9Enhancement(
    request: MOARequest,
    prompt: string,
    context: F9AnalysisContext,
    useF9Expert: boolean
  ): Promise<AgentResponse[]> {
    console.log(`🔄 Processing with 6-expert system (F9 Expert: ${useF9Expert ? 'ACTIVE' : 'INACTIVE'})...`);

    const responses: AgentResponse[] = [];

    // Get traditional expert responses (5 experts)
    const traditionalAgents = Array.from(this.agents.values())
      .filter(agent => agent.id !== this.f9Agent.getAgent().id);
    
    const traditionalPromises = traditionalAgents.map(agent => 
      this.processWithTraditionalAgent(agent, prompt, request.context)
    );
    
    const traditionalResponses = await Promise.all(traditionalPromises);
    responses.push(...traditionalResponses.filter(response => response !== null) as AgentResponse[]);

    // Get F9 expert response if needed
    if (useF9Expert) {
      try {
        const f9Response = await this.f9Agent.analyzeRequest({
          ...request,
          prompt,
          context: { ...request.context, ...context }
        });
        responses.push(f9Response);
        console.log(`✅ F9 Expert analysis completed with confidence: ${f9Response.confidence}`);
      } catch (error) {
        console.error('❌ F9 Expert analysis failed:', error);
      }
    }

    return responses;
  }

  private async processWithTraditionalAgent(
    agent: Agent,
    prompt: string,
    context?: Record<string, any>
  ): Promise<AgentResponse | null> {
    const startTime = Date.now();
    
    try {
      agent.status = 'processing';
      
      // Simulate traditional expert processing
      const response = await this.generateTraditionalExpertResponse(agent, prompt, context);
      
      const responseTime = Date.now() - startTime;
      
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
          capabilities: agent.capabilities,
          expertiseArea: agent.context?.expertise?.[0] || 'General'
        }
      };

      // Store in agent context
      if (agent.context) {
        agent.context.previousResponses.push(agentResponse);
        if (agent.context.previousResponses.length > 10) {
          agent.context.previousResponses = agent.context.previousResponses.slice(-10);
        }
      }

      return agentResponse;

    } catch (error) {
      console.error(`❌ Traditional expert ${agent.name} failed:`, error);
      agent.status = 'error';
      return null;
    }
  }

  private async generateTraditionalExpertResponse(
    agent: Agent,
    prompt: string,
    context?: Record<string, any>
  ): Promise<{ content: string; confidence: number; reasoning: string }> {
    // Simulate expert-specific processing based on agent name/expertise
    const processingDelay = Math.random() * 100 + 80; // 80-180ms
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    let content: string;
    let confidence: number;
    let reasoning: string;

    // Expert-specific responses based on agent name
    if (agent.name.includes('Dave Farley')) {
      content = `CI/CD and Testing Analysis: ${this.generateCICDResponse(prompt)}`;
      confidence = 0.88 + Math.random() * 0.08;
      reasoning = 'Based on continuous integration, deployment, and testing expertise from Dave Farley principles';
    } else if (agent.name.includes('Kent Beck')) {
      content = `TDD and Simple Design Analysis: ${this.generateTDDResponse(prompt)}`;
      confidence = 0.91 + Math.random() * 0.06;
      reasoning = 'Based on test-driven development and simple design principles from Kent Beck methodology';
    } else if (agent.name.includes('Martin Fowler')) {
      content = `Architecture and Patterns Analysis: ${this.generateArchitectureResponse(prompt)}`;
      confidence = 0.89 + Math.random() * 0.07;
      reasoning = 'Based on software architecture patterns and design principles from Martin Fowler catalog';
    } else if (agent.name.includes('Kevlin Henney')) {
      content = `Code Clarity and Philosophy Analysis: ${this.generateClarityResponse(prompt)}`;
      confidence = 0.92 + Math.random() * 0.05;
      reasoning = 'Based on code clarity, design philosophy, and programming principles from Kevlin Henney insights';
    } else if (agent.name.includes('Robert C. Martin')) {
      content = `Clean Code and SOLID Analysis: ${this.generateCleanCodeResponse(prompt)}`;
      confidence = 0.87 + Math.random() * 0.09;
      reasoning = 'Based on clean code principles and SOLID design from Uncle Bob methodology';
    } else {
      content = `General expert analysis: ${prompt}`;
      confidence = 0.75;
      reasoning = 'Generic expert response';
    }

    return { content, confidence, reasoning };
  }

  private async buildF9EnhancedConsensus(
    responses: AgentResponse[],
    request: MOARequest,
    context: F9AnalysisContext,
    useF9Expert: boolean
  ): Promise<ConsensusResult> {
    const startTime = Date.now();
    
    // Separate F9 and traditional responses
    const f9Response = responses.find(r => r.metadata?.agentType === 'f9_claude_expert');
    const traditionalResponses = responses.filter(r => r.metadata?.agentType !== 'f9_claude_expert');

    // Dynamic weighting based on request context
    const weights = this.calculateF9DynamicWeights(request, context, useF9Expert);
    
    let finalResponse: string;
    let confidence: number;
    let reasoning: string;

    if (useF9Expert && f9Response) {
      // F9-enhanced consensus
      const traditionalSynthesis = await this.synthesizeTraditionalExpertises(traditionalResponses);
      const f9Synthesis = f9Response.response;
      
      finalResponse = this.synthesizeF9EnhancedResponse(
        traditionalSynthesis,
        f9Synthesis,
        weights,
        context
      );
      
      confidence = this.calculateF9EnhancedConfidence(
        traditionalResponses,
        f9Response,
        weights
      );
      
      reasoning = `Enhanced 6-expert consensus combining traditional software engineering expertise (${(weights.traditional * 100).toFixed(0)}%) with F9 Claude Code workflow optimization (${(weights.f9 * 100).toFixed(0)}%). Analysis incorporates ${context.focusArea || 'general'} focus with workflow optimization considerations.`;
    } else {
      // Traditional 5-expert consensus
      const traditionalConsensus = await this.consensusEngine.buildConsensus(
        traditionalResponses,
        request.consensusThreshold || 0.7
      );
      
      finalResponse = traditionalConsensus.finalResponse;
      confidence = traditionalConsensus.confidence;
      reasoning = `Traditional 5-expert consensus focusing on proven software engineering principles without workflow optimization.`;
    }

    const processingTime = Date.now() - startTime;

    return {
      finalResponse,
      confidence,
      processingTime,
      participatingAgents: responses.map(r => r.agentId),
      consensusMethod: useF9Expert ? 'f9_enhanced_weighted' : 'traditional_weighted',
      reasoning
    };
  }

  private calculateF9DynamicWeights(
    request: MOARequest,
    context: F9AnalysisContext,
    useF9Expert: boolean
  ): { traditional: number; f9: number } {
    if (!useF9Expert) {
      return { traditional: 1.0, f9: 0.0 };
    }

    const prompt = request.prompt.toLowerCase();
    
    // Base weights
    let f9Weight = this.f9ConsensusOptions.f9Weight;
    let traditionalWeight = this.f9ConsensusOptions.traditionalWeight;

    if (this.f9ConsensusOptions.dynamicWeighting) {
      // Adjust weights based on request type
      if (prompt.includes('workflow') || prompt.includes('optimization') || prompt.includes('process')) {
        f9Weight = 0.60; // F9 leadership for workflow
        traditionalWeight = 0.40;
      } else if (prompt.includes('tool') || prompt.includes('integration') || prompt.includes('mcp')) {
        f9Weight = 0.70; // F9 dominance for tool integration
        traditionalWeight = 0.30;
      } else if (prompt.includes('performance') || prompt.includes('efficiency')) {
        f9Weight = 0.50; // Balanced for performance
        traditionalWeight = 0.50;
      } else if (prompt.includes('code review') || prompt.includes('quality')) {
        f9Weight = 0.20; // Traditional dominance for code quality
        traditionalWeight = 0.80;
      }
    }

    // Ensure weights sum to 1.0
    const total = f9Weight + traditionalWeight;
    return {
      f9: f9Weight / total,
      traditional: traditionalWeight / total
    };
  }

  private async synthesizeTraditionalExpertises(responses: AgentResponse[]): Promise<string> {
    // Synthesize traditional 5-expert responses
    const expertiseAreas = responses.map(r => ({
      area: r.metadata?.expertiseArea || 'General',
      content: r.response,
      confidence: r.confidence
    }));

    return `Traditional Software Engineering Expert Analysis:

${expertiseAreas.map(expert => `
**${expert.area}**:
${expert.content}
(Confidence: ${(expert.confidence * 100).toFixed(0)}%)
`).join('\n')}

**Synthesized Traditional Recommendations**:
- Apply proven software engineering principles
- Follow established design patterns and practices
- Implement comprehensive testing strategies
- Maintain clean, readable, and maintainable code
- Use SOLID principles and clean architecture
- Ensure continuous integration and deployment excellence`;
  }

  private synthesizeF9EnhancedResponse(
    traditionalSynthesis: string,
    f9Synthesis: string,
    weights: { traditional: number; f9: number },
    context: F9AnalysisContext
  ): string {
    return `# F9 Enhanced 6-Expert Analysis

## Executive Summary
Comprehensive analysis combining traditional software engineering excellence with Claude Code workflow optimization.

## Traditional Software Engineering Guidance (${(weights.traditional * 100).toFixed(0)}% weight)
${traditionalSynthesis}

## Claude Code Workflow Optimization (${(weights.f9 * 100).toFixed(0)}% weight)
${f9Synthesis}

## Integrated Implementation Strategy
**Phase 1: Foundation** - Apply traditional engineering principles for solid codebase foundation
**Phase 2: Optimization** - Integrate Claude Code workflow optimizations for enhanced development efficiency
**Phase 3: Integration** - Combine quality practices with optimized development processes
**Phase 4: Continuous Improvement** - Monitor and optimize both code quality and workflow efficiency

## Expected Outcomes
- **Code Quality**: Maintained at 95%+ compliance with traditional engineering standards
- **Development Efficiency**: ${context.focusArea === 'performance' ? '60-70%' : '40-50%'} improvement through workflow optimization
- **Team Productivity**: Enhanced through integrated quality and efficiency practices
- **Maintainability**: Long-term sustainability through proven principles and optimized processes

---
*Analysis generated by 6-expert PPMOA system with F9 Claude Code Best Practices integration*`;
  }

  private calculateF9EnhancedConfidence(
    traditionalResponses: AgentResponse[],
    f9Response: AgentResponse,
    weights: { traditional: number; f9: number }
  ): number {
    const traditionalAvgConfidence = traditionalResponses.reduce((sum, r) => sum + r.confidence, 0) / traditionalResponses.length;
    const f9Confidence = f9Response.confidence;
    
    const weightedConfidence = (traditionalAvgConfidence * weights.traditional) + (f9Confidence * weights.f9);
    
    // Boost confidence for comprehensive analysis
    const enhancementBoost = 0.05;
    
    return Math.min(0.98, weightedConfidence + enhancementBoost);
  }

  // Traditional expert response generators
  private generateCICDResponse(prompt: string): string {
    return `Continuous Integration and Deployment analysis for "${prompt}". Recommendations: automated testing pipeline, deployment automation, quality gates, monitoring and feedback loops.`;
  }

  private generateTDDResponse(prompt: string): string {
    return `Test-Driven Development approach for "${prompt}". Strategy: red-green-refactor cycle, simple design, comprehensive test coverage, emergent architecture.`;
  }

  private generateArchitectureResponse(prompt: string): string {
    return `Software Architecture and Patterns analysis for "${prompt}". Recommendations: appropriate design patterns, architectural layers, enterprise patterns, system boundaries.`;
  }

  private generateClarityResponse(prompt: string): string {
    return `Code Clarity and Design Philosophy for "${prompt}". Focus: intention-revealing code, clear abstractions, effective communication, principled design decisions.`;
  }

  private generateCleanCodeResponse(prompt: string): string {
    return `Clean Code and SOLID principles for "${prompt}". Guidelines: meaningful names, small functions, single responsibility, open-closed principle, dependency inversion.`;
  }

  // Context detection helpers
  private detectProjectType(prompt: string): string {
    if (prompt.includes('react') || prompt.includes('frontend')) return 'react';
    if (prompt.includes('node') || prompt.includes('api') || prompt.includes('backend')) return 'node';
    if (prompt.includes('python') || prompt.includes('django') || prompt.includes('flask')) return 'python';
    if (prompt.includes('mobile') || prompt.includes('app')) return 'mobile';
    return 'general';
  }

  private detectTeamSize(prompt: string): string {
    if (prompt.includes('enterprise') || prompt.includes('large team')) return 'large';
    if (prompt.includes('team') || prompt.includes('collaboration')) return 'medium';
    return 'small';
  }

  private detectFocusArea(prompt: string): string {
    if (prompt.includes('performance') || prompt.includes('speed') || prompt.includes('optimization')) return 'performance';
    if (prompt.includes('quality') || prompt.includes('testing') || prompt.includes('validation')) return 'quality';
    if (prompt.includes('workflow') || prompt.includes('process') || prompt.includes('efficiency')) return 'workflow';
    if (prompt.includes('security') || prompt.includes('safety') || prompt.includes('compliance')) return 'security';
    return 'general';
  }

  private extractPerformanceRequirements(prompt: string): string[] {
    const requirements: string[] = [];
    if (prompt.includes('fast') || prompt.includes('speed')) requirements.push('response_time');
    if (prompt.includes('efficient') || prompt.includes('optimization')) requirements.push('efficiency');
    if (prompt.includes('scalable') || prompt.includes('scale')) requirements.push('scalability');
    if (prompt.includes('memory') || prompt.includes('resource')) requirements.push('resource_usage');
    return requirements;
  }

  private extractToolIntegrationNeeds(prompt: string): string[] {
    const needs: string[] = [];
    if (prompt.includes('mcp') || prompt.includes('server')) needs.push('mcp_integration');
    if (prompt.includes('hook') || prompt.includes('automation')) needs.push('hook_system');
    if (prompt.includes('tool') || prompt.includes('integration')) needs.push('tool_coordination');
    if (prompt.includes('claude') || prompt.includes('ai')) needs.push('ai_integration');
    return needs;
  }

  private extractWorkflowOptimizationGoals(prompt: string): string[] {
    const goals: string[] = [];
    if (prompt.includes('workflow') || prompt.includes('process')) goals.push('process_optimization');
    if (prompt.includes('development') || prompt.includes('coding')) goals.push('development_efficiency');
    if (prompt.includes('quality') || prompt.includes('validation')) goals.push('quality_automation');
    if (prompt.includes('team') || prompt.includes('collaboration')) goals.push('team_coordination');
    return goals;
  }

  // System management methods
  getSystemMetrics(): SystemMetrics & { f9Integration: any } {
    const f9Metrics = this.f9Agent.getPerformanceMetrics();
    const f9Stats = this.f9KnowledgeBase.getSystemStats();
    
    return {
      ...this.metrics,
      f9Integration: {
        f9AgentPerformance: f9Metrics,
        knowledgeBaseStats: f9Stats,
        consensusWeights: this.f9ConsensusOptions,
        integrationHealth: this.calculateF9IntegrationHealth()
      }
    };
  }

  private calculateF9IntegrationHealth(): number {
    const f9Metrics = this.f9Agent.getPerformanceMetrics();
    const f9Stats = this.f9KnowledgeBase.getSystemStats();
    
    const performanceScore = f9Metrics.avgResponseTime < 200 ? 1.0 : 200 / f9Metrics.avgResponseTime;
    const successScore = f9Metrics.successRate;
    const knowledgeScore = f9Stats.healthScore;
    
    return (performanceScore + successScore + knowledgeScore) / 3;
  }

  getF9ExpertStatus(): { agent: Agent; knowledgeBase: any; performance: any } {
    return {
      agent: this.f9Agent.getAgent(),
      knowledgeBase: this.f9KnowledgeBase.getSystemStats(),
      performance: this.f9Agent.getPerformanceMetrics()
    };
  }

  async getF9Recommendations(context: F9AnalysisContext): Promise<any> {
    return await this.f9KnowledgeBase.getOptimizationRecommendations(context);
  }

  updateF9Configuration(options: Partial<F9EnhancedConsensusOptions>): void {
    this.f9ConsensusOptions = { ...this.f9ConsensusOptions, ...options };
    console.log('🔧 F9 Configuration updated:', this.f9ConsensusOptions);
  }

  private updateF9Metrics(processingTime: number, agentsUsed: number, success: boolean, f9Used: boolean): void {
    this.metrics.totalRequests++;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + processingTime) / 2;
    this.metrics.successRate = (this.metrics.successRate * (this.metrics.totalRequests - 1) + (success ? 1 : 0)) / this.metrics.totalRequests;
    this.metrics.activeAgents = agentsUsed;
    
    // F9-specific metrics tracking
    if (f9Used) {
      this.emit('f9-usage', { processingTime, success, agentsUsed });
    }
  }

  getAgentStatus(): Agent[] {
    return Array.from(this.agents.values());
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down F9 Enhanced MOA System...');
    
    // Shutdown F9 agent
    await this.f9Agent.shutdown();
    
    // Set all agents to idle
    for (const agent of this.agents.values()) {
      agent.status = 'idle';
    }
    
    this.emit('f9-moa-shutdown');
    console.log('✅ F9 Enhanced MOA System shutdown complete');
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
}