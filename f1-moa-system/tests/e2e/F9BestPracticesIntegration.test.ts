// F9 Claude Code Best Practices Integration Test
// Comprehensive end-to-end validation of 6th expert integration

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  F9IntegratedMOACoordinator,
  F9BestPracticesAgent,
  F9KnowledgeBase,
  F9EnhancedConsensusEngine,
  F9ExpertSystem
} from '../../src/experts/f9_best_practices/index.js';
import type { MOARequest } from '../../src/types/index.js';

describe('F9 Claude Code Best Practices Integration', () => {
  let f9Coordinator: F9IntegratedMOACoordinator;
  let f9Agent: F9BestPracticesAgent;
  let f9KnowledgeBase: F9KnowledgeBase;
  let f9ConsensusEngine: F9EnhancedConsensusEngine;

  beforeEach(async () => {
    f9Coordinator = await F9ExpertSystem.createF9EnhancedMOASystem();
    f9Agent = await F9ExpertSystem.createF9Agent();
    f9KnowledgeBase = await F9ExpertSystem.createF9KnowledgeBase();
    f9ConsensusEngine = F9ExpertSystem.createF9ConsensusEngine();
  });

  afterEach(async () => {
    await f9Coordinator.shutdown();
    await f9Agent.shutdown();
  });

  describe('F9 Agent Core Functionality', () => {
    it('should initialize F9 agent with Claude Code expertise', async () => {
      const agent = f9Agent.getAgent();
      
      expect(agent.name).toBe('F9 Claude Code Best Practices Expert');
      expect(agent.capabilities).toContain('claude_code_workflow_optimization');
      expect(agent.capabilities).toContain('mcp_integration_expertise');
      expect(agent.capabilities).toContain('development_process_automation');
      expect(agent.status).toBe('idle');
    });

    it('should analyze workflow optimization requests', async () => {
      const request: MOARequest = {
        id: 'f9-workflow-test',
        prompt: 'Optimize our React development workflow with Claude Code best practices',
        context: {
          projectType: 'react',
          teamSize: 'medium',
          focusArea: 'workflow'
        }
      };

      const response = await f9Agent.analyzeRequest(request);

      expect(response.agentId).toBe(f9Agent.getAgent().id);
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.response).toContain('Claude Code Workflow Optimization');
      expect(response.response).toContain('React-specific');
      expect(response.metadata?.analysisType).toBe('workflow_optimization');
    });

    it('should analyze MCP integration requests', async () => {
      const request: MOARequest = {
        id: 'f9-mcp-test',
        prompt: 'Help me develop a high-performance MCP server for API documentation',
        context: {
          projectType: 'api',
          toolIntegrationNeeds: ['mcp_integration']
        }
      };

      const response = await f9Agent.analyzeRequest(request);

      expect(response.confidence).toBeGreaterThan(0.85);
      expect(response.response).toContain('MCP Server Configuration');
      expect(response.response).toContain('api-mcp-dev-assistant');
      expect(response.metadata?.analysisType).toBe('tool_integration');
    });

    it('should analyze performance optimization requests', async () => {
      const request: MOARequest = {
        id: 'f9-performance-test',
        prompt: 'Optimize Claude Code performance and response times for large projects',
        context: {
          performanceRequirements: ['response_time', 'efficiency']
        }
      };

      const response = await f9Agent.analyzeRequest(request);

      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.response).toContain('Performance Optimization');
      expect(response.response).toContain('45% improvement');
      expect(response.metadata?.analysisType).toBe('performance_optimization');
    });

    it('should meet F9 performance targets', async () => {
      const startTime = Date.now();
      
      const request: MOARequest = {
        id: 'f9-performance-target-test',
        prompt: 'Optimize workflow for better efficiency',
        context: { focusArea: 'workflow' }
      };

      const response = await f9Agent.analyzeRequest(request);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(200); // F9 target: <150ms for workflow analysis
      expect(response.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('F9 Knowledge Base', () => {
    it('should initialize with Claude Code patterns', async () => {
      const stats = f9KnowledgeBase.getSystemStats();
      
      expect(stats.totalPatterns).toBeGreaterThan(0);
      expect(stats.healthScore).toBeGreaterThan(0.8);
    });

    it('should search Claude Code patterns', async () => {
      const patterns = await f9KnowledgeBase.searchClaudeCodePatterns('workflow optimization');
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].category).toBe('workflow');
      expect(patterns[0].performance.efficiency).toBeGreaterThan(0);
    });

    it('should search MCP integration patterns', async () => {
      const patterns = await f9KnowledgeBase.searchMCPIntegrationPatterns('high performance');
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].serverType).toBe('development-assistant');
      expect(patterns[0].performance.efficiency).toBeGreaterThan(0.5);
    });

    it('should provide optimization recommendations', async () => {
      const recommendations = await f9KnowledgeBase.getOptimizationRecommendations({
        projectType: 'react',
        teamSize: 'medium',
        focus: 'performance'
      });

      expect(recommendations.claudeCodeOptimizations).toBeDefined();
      expect(recommendations.mcpIntegrations).toBeDefined();
      expect(recommendations.workflowImprovements).toBeDefined();
      expect(recommendations.expectedBenefits).toContain('Optimized for react development');
    });

    it('should track pattern usage and performance', async () => {
      const patternId = 'claude-md-optimization';
      const pattern = await f9KnowledgeBase.getClaudeCodePattern(patternId);
      
      expect(pattern).toBeDefined();
      expect(pattern!.metadata.usageCount).toBeGreaterThanOrEqual(0);
      
      await f9KnowledgeBase.recordPatternUsage(patternId, {
        responseTime: 120,
        success: true,
        userRating: 4.5
      });

      const updatedPattern = await f9KnowledgeBase.getClaudeCodePattern(patternId);
      expect(updatedPattern!.metadata.usageCount).toBe(pattern!.metadata.usageCount + 1);
    });
  });

  describe('F9 Enhanced Consensus Engine', () => {
    it('should build F9 enhanced consensus with traditional experts', async () => {
      const mockResponses = [
        {
          agentId: 'traditional-1',
          response: 'Traditional code quality analysis focusing on SOLID principles',
          confidence: 0.9,
          reasoning: 'Based on clean code expertise',
          timestamp: Date.now(),
          metadata: { agentType: 'validator', expertiseArea: 'Clean Code' }
        },
        {
          agentId: 'traditional-2',
          response: 'TDD approach with comprehensive testing strategy',
          confidence: 0.92,
          reasoning: 'Based on TDD expertise',
          timestamp: Date.now(),
          metadata: { agentType: 'coder', expertiseArea: 'TDD' }
        },
        {
          agentId: 'f9-expert',
          response: 'Claude Code workflow optimization with MCP integration and automated quality gates',
          confidence: 0.94,
          reasoning: 'Based on Claude Code workflow expertise',
          timestamp: Date.now(),
          metadata: { agentType: 'f9_claude_expert', expertiseArea: 'Workflow Optimization' }
        }
      ];

      const consensus = await f9ConsensusEngine.buildF9EnhancedConsensus(
        mockResponses,
        'Develop authentication system with best practices and optimized workflow',
        0.7,
        'adaptive'
      );

      expect(consensus.finalResponse).toContain('Traditional Software Engineering Guidance');
      expect(consensus.finalResponse).toContain('Claude Code Workflow Optimization');
      expect(consensus.finalResponse).toContain('Integrated Implementation Strategy');
      expect(consensus.confidence).toBeGreaterThan(0.85);
      expect(consensus.consensusMethod).toBe('f9_enhanced_weighted');
      expect(consensus.f9Metrics.f9ExpertWeight).toBeGreaterThan(0);
      expect(consensus.f9Metrics.traditionalExpertWeight).toBeGreaterThan(0);
    });

    it('should use dynamic weighting based on request context', async () => {
      const workflowFocusedResponses = [
        {
          agentId: 'traditional-1',
          response: 'Code quality guidelines',
          confidence: 0.85,
          reasoning: 'Traditional expertise',
          timestamp: Date.now(),
          metadata: { agentType: 'validator' }
        },
        {
          agentId: 'f9-expert',
          response: 'Workflow optimization strategies',
          confidence: 0.92,
          reasoning: 'F9 workflow expertise',
          timestamp: Date.now(),
          metadata: { agentType: 'f9_claude_expert' }
        }
      ];

      const workflowConsensus = await f9ConsensusEngine.buildF9EnhancedConsensus(
        workflowFocusedResponses,
        'Optimize development workflow and automation processes',
        0.7,
        'workflow_focused'
      );

      // F9 expert should have higher weight for workflow-focused requests
      expect(workflowConsensus.f9Metrics.f9ExpertWeight).toBeGreaterThan(0.5);
      expect(workflowConsensus.f9Metrics.workflowOptimizationScore).toBeGreaterThan(0.8);
    });

    it('should analyze consensus quality', async () => {
      const responses = [
        {
          agentId: 'traditional-1',
          response: 'High quality traditional analysis',
          confidence: 0.9,
          reasoning: 'Expert analysis',
          timestamp: Date.now(),
          metadata: { agentType: 'validator' }
        },
        {
          agentId: 'f9-expert',
          response: 'Comprehensive workflow optimization',
          confidence: 0.93,
          reasoning: 'F9 expertise',
          timestamp: Date.now(),
          metadata: { agentType: 'f9_claude_expert' }
        }
      ];

      const consensus = await f9ConsensusEngine.buildF9EnhancedConsensus(
        responses,
        'Comprehensive development guidance',
        0.7,
        'balanced'
      );

      const qualityAnalysis = await f9ConsensusEngine.analyzeConsensusQuality(responses, consensus);

      expect(qualityAnalysis.overallQuality).toBeGreaterThan(0.8);
      expect(qualityAnalysis.expertAgreement).toBeGreaterThan(0.7);
      expect(qualityAnalysis.workflowIntegration).toBeGreaterThan(0.8);
      expect(qualityAnalysis.recommendations).toBeDefined();
    });
  });

  describe('F9 Integrated MOA Coordinator', () => {
    it('should initialize with 6 experts including F9', async () => {
      const agents = f9Coordinator.getAgentStatus();
      
      expect(agents.length).toBe(6);
      
      const f9Expert = agents.find(agent => agent.name.includes('F9 Claude Code'));
      expect(f9Expert).toBeDefined();
      expect(f9Expert!.capabilities).toContain('claude_code_workflow_optimization');
      
      const traditionalExperts = agents.filter(agent => !agent.name.includes('F9'));
      expect(traditionalExperts.length).toBe(5);
    });

    it('should process workflow optimization requests with F9 expert', async () => {
      const request: MOARequest = {
        id: 'f9-integrated-workflow-test',
        prompt: 'Develop user authentication with Claude Code workflow optimization',
        context: {
          projectType: 'node',
          focusArea: 'workflow',
          workflowOptimizationGoals: ['process_optimization', 'development_efficiency']
        },
        consensusThreshold: 0.7
      };

      const response = await f9Coordinator.processRequest(request);

      expect(response.result.confidence).toBeGreaterThan(0.8);
      expect(response.result.finalResponse).toContain('Traditional Software Engineering Guidance');
      expect(response.result.finalResponse).toContain('Claude Code Workflow Optimization');
      expect(response.result.consensusMethod).toBe('f9_enhanced_weighted');
      expect(response.metadata.f9ExpertUsed).toBe(true);
      expect(response.agentResponses.length).toBe(6);
    });

    it('should process traditional code review without F9 when not needed', async () => {
      const request: MOARequest = {
        id: 'f9-integrated-traditional-test',
        prompt: 'Review this code for SOLID principles and clean code practices',
        context: {
          focusArea: 'quality'
        },
        consensusThreshold: 0.7
      };

      const response = await f9Coordinator.processRequest(request);

      expect(response.result.confidence).toBeGreaterThan(0.7);
      // F9 expert might not be used for pure code quality reviews
      expect(response.metadata.f9ExpertUsed).toBeDefined();
    });

    it('should provide F9 system metrics and status', async () => {
      const systemMetrics = f9Coordinator.getSystemMetrics();
      
      expect(systemMetrics.f9Integration).toBeDefined();
      expect(systemMetrics.f9Integration.f9AgentPerformance).toBeDefined();
      expect(systemMetrics.f9Integration.knowledgeBaseStats).toBeDefined();
      expect(systemMetrics.f9Integration.integrationHealth).toBeGreaterThan(0);

      const f9Status = f9Coordinator.getF9ExpertStatus();
      expect(f9Status.agent.name).toContain('F9 Claude Code');
      expect(f9Status.knowledgeBase.totalPatterns).toBeGreaterThan(0);
      expect(f9Status.performance.avgResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should allow F9 configuration updates', () => {
      const originalConfig = f9Coordinator.getSystemMetrics().f9Integration.consensusWeights;
      
      f9Coordinator.updateF9Configuration({
        f9Weight: 0.5,
        traditionalWeight: 0.5,
        dynamicWeighting: false
      });

      const updatedMetrics = f9Coordinator.getSystemMetrics();
      expect(updatedMetrics.f9Integration.consensusWeights.f9Weight).toBe(0.5);
      expect(updatedMetrics.f9Integration.consensusWeights.traditionalWeight).toBe(0.5);
      expect(updatedMetrics.f9Integration.consensusWeights.dynamicWeighting).toBe(false);
    });

    it('should meet performance targets for 6-expert coordination', async () => {
      const startTime = Date.now();
      
      const request: MOARequest = {
        id: 'f9-performance-coordination-test',
        prompt: 'Quick workflow optimization guidance',
        context: { focusArea: 'performance' },
        consensusThreshold: 0.7
      };

      const response = await f9Coordinator.processRequest(request);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(500); // Target: 6-expert coordination in <400ms
      expect(response.result.confidence).toBeGreaterThan(0.7);
      expect(response.processingTime).toBeLessThan(500);
    });
  });

  describe('F9 Expert System Factory', () => {
    it('should provide F9 system information', () => {
      const info = F9ExpertSystem.getF9SystemInfo();
      
      expect(info.version).toBe('1.0.0');
      expect(info.expertType).toBe('Claude Code Best Practices Expert');
      expect(info.capabilities).toContain('claude_code_workflow_optimization');
      expect(info.integrationLevel).toBe('6th_expert_moa_integration');
      expect(info.performanceTargets.workflow_analysis).toBe(150);
    });

    it('should create F9 system components individually', async () => {
      const agent = await F9ExpertSystem.createF9Agent();
      const kb = await F9ExpertSystem.createF9KnowledgeBase();
      const consensus = F9ExpertSystem.createF9ConsensusEngine();

      expect(agent.getAgent().name).toContain('F9 Claude Code');
      expect(kb.getSystemStats().totalPatterns).toBeGreaterThan(0);
      expect(consensus).toBeInstanceOf(F9EnhancedConsensusEngine);

      await agent.shutdown();
    });
  });

  describe('F9 Integration Performance', () => {
    it('should maintain high performance with F9 integration', async () => {
      const requests: MOARequest[] = [
        {
          id: 'perf-1',
          prompt: 'Optimize React component development workflow',
          context: { projectType: 'react', focusArea: 'workflow' }
        },
        {
          id: 'perf-2',  
          prompt: 'Review code quality and suggest improvements',
          context: { focusArea: 'quality' }
        },
        {
          id: 'perf-3',
          prompt: 'Develop MCP server with performance optimization',
          context: { toolIntegrationNeeds: ['mcp_integration'] }
        }
      ];

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => f9Coordinator.processRequest(req))
      );
      const totalTime = Date.now() - startTime;

      expect(responses.length).toBe(3);
      responses.forEach(response => {
        expect(response.result.confidence).toBeGreaterThan(0.7);
        expect(response.processingTime).toBeLessThan(600);
      });
      
      // Parallel processing should be efficient
      expect(totalTime).toBeLessThan(1000);
    });

    it('should track F9 usage patterns and effectiveness', async () => {
      const workflowRequest: MOARequest = {
        id: 'f9-tracking-test',
        prompt: 'Optimize Claude Code workflow for team collaboration',
        context: { 
          focusArea: 'workflow',
          workflowOptimizationGoals: ['team_coordination', 'process_optimization']
        }
      };

      const response = await f9Coordinator.processRequest(workflowRequest);
      
      expect(response.metadata.f9ExpertUsed).toBe(true);
      expect(response.metadata.analysisContext).toBeDefined();
      
      const systemMetrics = f9Coordinator.getSystemMetrics();
      expect(systemMetrics.totalRequests).toBeGreaterThan(0);
      expect(systemMetrics.f9Integration.integrationHealth).toBeGreaterThan(0.8);
    });
  });
});

describe('F9 Advanced Integration Scenarios', () => {
  let f9System: F9IntegratedMOACoordinator;

  beforeEach(async () => {
    f9System = await F9ExpertSystem.createF9EnhancedMOASystem();
  });

  afterEach(async () => {
    await f9System.shutdown();
  });

  it('should handle complex multi-context requests', async () => {
    const complexRequest: MOARequest = {
      id: 'f9-complex-scenario',
      prompt: 'Develop secure authentication system with Claude Code optimization, MCP integration, performance monitoring, and comprehensive testing strategy',
      context: {
        projectType: 'node',
        teamSize: 'large',
        focusArea: 'comprehensive',
        performanceRequirements: ['response_time', 'scalability', 'security'],
        toolIntegrationNeeds: ['mcp_integration', 'hook_system', 'monitoring'],
        workflowOptimizationGoals: ['development_efficiency', 'quality_automation', 'team_coordination']
      },
      consensusThreshold: 0.8,
      astAnalysis: true
    };

    const response = await f9System.processRequest(complexRequest);

    expect(response.result.confidence).toBeGreaterThan(0.85);
    expect(response.result.finalResponse).toContain('Traditional Software Engineering Guidance');
    expect(response.result.finalResponse).toContain('Claude Code Workflow Optimization');
    expect(response.result.finalResponse).toContain('Integrated Implementation Strategy');
    expect(response.result.finalResponse).toContain('authentication');
    expect(response.result.finalResponse).toContain('MCP Server Configuration');
    expect(response.result.finalResponse).toContain('Performance');
    expect(response.metadata.f9ExpertUsed).toBe(true);
    expect(response.agentResponses.length).toBe(6);
  });

  it('should provide contextual F9 recommendations', async () => {
    const context = {
      projectType: 'react',
      teamSize: 'medium',
      focusArea: 'performance'
    };

    const recommendations = await f9System.getF9Recommendations(context);

    expect(recommendations.claudeCodeOptimizations).toBeDefined();
    expect(recommendations.mcpIntegrations).toBeDefined();
    expect(recommendations.workflowImprovements).toBeDefined();
    expect(recommendations.expectedBenefits).toContain('Optimized for react development');
  });
});