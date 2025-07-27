// F9 Claude Code Best Practices Example
// Comprehensive demonstration of 6th expert integration

import { 
  F9ExpertSystem,
  F9IntegratedMOACoordinator 
} from '../experts/f9_best_practices/index.js';
import type { MOARequest } from '../types/index.js';

/**
 * Comprehensive F9 Claude Code Best Practices Example
 * Demonstrates the complete 6-expert MOA system with F9 integration
 */
export class F9BestPracticesExample {
  private f9Coordinator!: F9IntegratedMOACoordinator;

  async initialize(): Promise<void> {
    console.log('🚀 Initializing F9 Enhanced MOA System Example...');
    this.f9Coordinator = await F9ExpertSystem.createF9EnhancedMOASystem();
    console.log('✅ F9 Enhanced MOA System ready for demonstration');
  }

  async runComprehensiveDemo(): Promise<void> {
    console.log('\n📋 F9 CLAUDE CODE BEST PRACTICES DEMONSTRATION');
    console.log('=' * 60);

    await this.demonstrateSystemInfo();
    await this.demonstrateWorkflowOptimization();
    await this.demonstrateMCPIntegration();
    await this.demonstratePerformanceOptimization();
    await this.demonstrateComprehensiveDevelopment();
    await this.demonstrateTraditionalCodeReview();
    await this.demonstrateSystemMetrics();
  }

  private async demonstrateSystemInfo(): Promise<void> {
    console.log('\n🔍 1. F9 SYSTEM INFORMATION');
    console.log('-'.repeat(40));

    const systemInfo = F9ExpertSystem.getF9SystemInfo();
    console.log(`Expert Type: ${systemInfo.expertType}`);
    console.log(`Version: ${systemInfo.version}`);
    console.log(`Integration Level: ${systemInfo.integrationLevel}`);
    console.log('Capabilities:');
    systemInfo.capabilities.forEach(cap => console.log(`  • ${cap}`));
    console.log('Performance Targets:');
    Object.entries(systemInfo.performanceTargets).forEach(([key, value]) => 
      console.log(`  • ${key}: <${value}ms`)
    );

    const agents = this.f9Coordinator.getAgentStatus();
    console.log(`\nActive Experts: ${agents.length}/6`);
    agents.forEach(agent => 
      console.log(`  • ${agent.name} (${agent.type}) - ${agent.status}`)
    );
  }

  private async demonstrateWorkflowOptimization(): Promise<void> {
    console.log('\n⚡ 2. WORKFLOW OPTIMIZATION ANALYSIS');
    console.log('-'.repeat(40));

    const workflowRequest: MOARequest = {
      id: 'demo-workflow-optimization',
      prompt: 'Optimize our React development workflow with Claude Code best practices for a medium-sized team working on an e-commerce platform',
      context: {
        projectType: 'react',
        teamSize: 'medium',
        focusArea: 'workflow',
        workflowOptimizationGoals: [
          'development_efficiency',
          'quality_automation',
          'team_coordination'
        ],
        performanceRequirements: ['response_time', 'development_velocity']
      },
      consensusThreshold: 0.8
    };

    console.log('Request:', workflowRequest.prompt);
    console.log('Context:', JSON.stringify(workflowRequest.context, null, 2));

    const startTime = Date.now();
    const response = await this.f9Coordinator.processRequest(workflowRequest);
    const responseTime = Date.now() - startTime;

    console.log(`\n📊 Response Time: ${responseTime}ms`);
    console.log(`Confidence: ${(response.result.confidence * 100).toFixed(1)}%`);
    console.log(`F9 Expert Used: ${response.metadata.f9ExpertUsed ? 'YES' : 'NO'}`);
    console.log(`Consensus Method: ${response.result.consensusMethod}`);
    console.log(`Agents Participated: ${response.agentResponses.length}/6`);

    console.log('\n📝 Expert Analysis Preview:');
    console.log(response.result.finalResponse.substring(0, 500) + '...');
  }

  private async demonstrateMCPIntegration(): Promise<void> {
    console.log('\n🔧 3. MCP INTEGRATION GUIDANCE');
    console.log('-'.repeat(40));

    const mcpRequest: MOARequest = {
      id: 'demo-mcp-integration',
      prompt: 'Develop a high-performance MCP server for automated testing and code quality analysis with security focus',
      context: {
        projectType: 'node',
        toolIntegrationNeeds: ['mcp_integration', 'security_analysis'],
        performanceRequirements: ['response_time', 'throughput'],
        focusArea: 'integration'
      },
      consensusThreshold: 0.75
    };

    console.log('Request:', mcpRequest.prompt);

    const startTime = Date.now();
    const response = await this.f9Coordinator.processRequest(mcpRequest);
    const responseTime = Date.now() - startTime;

    console.log(`\n📊 Response Time: ${responseTime}ms`);
    console.log(`Confidence: ${(response.result.confidence * 100).toFixed(1)}%`);
    console.log(`F9 Expert Used: ${response.metadata.f9ExpertUsed ? 'YES' : 'NO'}`);

    // Extract key recommendations
    const analysisLines = response.result.finalResponse.split('\n');
    const mcpSection = analysisLines.find(line => line.includes('MCP Server'));
    if (mcpSection) {
      console.log('\n🎯 Key MCP Recommendations:');
      console.log(`  ${mcpSection}`);
    }

    // Find F9 specific guidance
    const f9Guidance = analysisLines.find(line => line.includes('F9') || line.includes('Claude Code'));
    if (f9Guidance) {
      console.log('🚀 F9 Workflow Enhancement:');
      console.log(`  ${f9Guidance}`);
    }
  }

  private async demonstratePerformanceOptimization(): Promise<void> {
    console.log('\n⚡ 4. PERFORMANCE OPTIMIZATION');
    console.log('-'.repeat(40));

    const performanceRequest: MOARequest = {
      id: 'demo-performance-optimization',
      prompt: 'Optimize Claude Code performance and response times for a large TypeScript project with complex dependencies',
      context: {
        projectType: 'typescript',
        teamSize: 'large',
        focusArea: 'performance',
        performanceRequirements: [
          'response_time',
          'memory_usage',
          'context_efficiency'
        ]
      },
      consensusThreshold: 0.8
    };

    console.log('Request:', performanceRequest.prompt);

    const startTime = Date.now();
    const response = await this.f9Coordinator.processRequest(performanceRequest);
    const responseTime = Date.now() - startTime;

    console.log(`\n📊 Response Time: ${responseTime}ms`);
    console.log(`Confidence: ${(response.result.confidence * 100).toFixed(1)}%`);

    // Extract performance metrics from F9 response
    const f9Response = response.agentResponses.find(r => 
      r.metadata?.agentType === 'f9_claude_expert'
    );

    if (f9Response) {
      console.log('\n🎯 F9 Performance Analysis:');
      console.log(`F9 Response Time: ${f9Response.metadata?.responseTime}ms`);
      console.log(`F9 Confidence: ${(f9Response.confidence * 100).toFixed(1)}%`);
      
      // Extract improvement estimates
      const improvements = f9Response.response.match(/(\d+)% improvement/g);
      if (improvements) {
        console.log('📈 Expected Improvements:');
        improvements.forEach(improvement => console.log(`  • ${improvement}`));
      }
    }
  }

  private async demonstrateComprehensiveDevelopment(): Promise<void> {
    console.log('\n🏗️ 5. COMPREHENSIVE DEVELOPMENT GUIDANCE');
    console.log('-'.repeat(40));

    const comprehensiveRequest: MOARequest = {
      id: 'demo-comprehensive-development',
      prompt: 'Develop a secure user authentication system with Claude Code optimization, comprehensive testing, CI/CD integration, and performance monitoring',
      context: {
        projectType: 'node',
        teamSize: 'medium',
        focusArea: 'comprehensive',
        performanceRequirements: ['security', 'scalability', 'maintainability'],
        toolIntegrationNeeds: ['mcp_integration', 'ci_cd', 'monitoring'],
        workflowOptimizationGoals: [
          'development_efficiency',
          'quality_automation',
          'security_integration'
        ]
      },
      consensusThreshold: 0.85,
      astAnalysis: true
    };

    console.log('Request: Complex authentication system development');
    console.log('Requirements: Security + Performance + Workflow + Quality');

    const startTime = Date.now();
    const response = await this.f9Coordinator.processRequest(comprehensiveRequest);
    const responseTime = Date.now() - startTime;

    console.log(`\n📊 Comprehensive Analysis Results:`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log(`Confidence: ${(response.result.confidence * 100).toFixed(1)}%`);
    console.log(`All 6 Experts Participated: ${response.agentResponses.length === 6 ? 'YES' : 'NO'}`);
    console.log(`AST Analysis: ${response.astAnalysis ? 'Included' : 'Not included'}`);

    // Expert contribution analysis
    console.log('\n👥 Expert Contributions:');
    response.agentResponses.forEach(agentResponse => {
      const expertType = agentResponse.metadata?.agentName || agentResponse.metadata?.agentType || 'Unknown';
      const confidence = (agentResponse.confidence * 100).toFixed(0);
      const responseTime = agentResponse.metadata?.responseTime || 0;
      console.log(`  • ${expertType}: ${confidence}% confidence (${responseTime}ms)`);
    });

    // Integration quality assessment
    const hasTraditionalGuidance = response.result.finalResponse.includes('Traditional Software Engineering');
    const hasF9Guidance = response.result.finalResponse.includes('Claude Code Workflow Optimization');
    const hasIntegratedStrategy = response.result.finalResponse.includes('Integrated Implementation Strategy');

    console.log('\n🎯 Integration Quality:');
    console.log(`  Traditional Engineering Guidance: ${hasTraditionalGuidance ? '✅' : '❌'}`);
    console.log(`  F9 Workflow Optimization: ${hasF9Guidance ? '✅' : '❌'}`);
    console.log(`  Integrated Strategy: ${hasIntegratedStrategy ? '✅' : '❌'}`);
  }

  private async demonstrateTraditionalCodeReview(): Promise<void> {
    console.log('\n📋 6. TRADITIONAL CODE REVIEW (WITHOUT F9 FOCUS)');
    console.log('-'.repeat(40));

    const traditionalRequest: MOARequest = {
      id: 'demo-traditional-review',
      prompt: 'Review this code for SOLID principles, clean code practices, and design patterns. Focus on code quality and maintainability.',
      context: {
        focusArea: 'quality',
        codeSnippet: `
class UserService {
  constructor(db, logger, validator) {
    this.db = db;
    this.logger = logger;
    this.validator = validator;
  }
  
  async createUser(userData) {
    if (!this.validator.validate(userData)) {
      throw new Error('Invalid user data');
    }
    const user = await this.db.save(userData);
    this.logger.log('User created: ' + user.id);
    return user;
  }
}
        `
      },
      consensusThreshold: 0.75
    };

    console.log('Request: Traditional code quality review');
    console.log('Focus: SOLID principles, clean code, design patterns');

    const startTime = Date.now();
    const response = await this.f9Coordinator.processRequest(traditionalRequest);
    const responseTime = Date.now() - startTime;

    console.log(`\n📊 Code Review Results:`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log(`Confidence: ${(response.result.confidence * 100).toFixed(1)}%`);
    console.log(`F9 Expert Used: ${response.metadata.f9ExpertUsed ? 'YES' : 'NO'}`);
    console.log(`Primary Focus: ${response.metadata.f9ExpertUsed ? 'Integrated (Traditional + F9)' : 'Traditional Quality'}`);

    // Analyze expert weighting for quality-focused request
    const traditionalResponses = response.agentResponses.filter(r => 
      r.metadata?.agentType !== 'f9_claude_expert'
    );
    const f9Response = response.agentResponses.find(r => 
      r.metadata?.agentType === 'f9_claude_expert'
    );

    console.log(`\n⚖️ Expert Weighting:`);
    console.log(`Traditional Experts: ${traditionalResponses.length}/5 participated`);
    console.log(`F9 Expert: ${f9Response ? 'Participated' : 'Not used'}`);

    if (f9Response) {
      console.log(`F9 Contribution: Workflow context added to quality review`);
    }
  }

  private async demonstrateSystemMetrics(): Promise<void> {
    console.log('\n📊 7. SYSTEM METRICS AND PERFORMANCE');
    console.log('-'.repeat(40));

    const systemMetrics = this.f9Coordinator.getSystemMetrics();
    
    console.log('🔧 Core System Metrics:');
    console.log(`  Total Requests: ${systemMetrics.totalRequests}`);
    console.log(`  Average Response Time: ${systemMetrics.avgResponseTime.toFixed(0)}ms`);
    console.log(`  Success Rate: ${(systemMetrics.successRate * 100).toFixed(1)}%`);
    console.log(`  Active Agents: ${systemMetrics.activeAgents}/6`);
    console.log(`  Consensus Rate: ${(systemMetrics.consensusRate * 100).toFixed(1)}%`);

    if (systemMetrics.f9Integration) {
      console.log('\n🚀 F9 Integration Metrics:');
      const f9Metrics = systemMetrics.f9Integration;
      console.log(`  F9 Agent Performance: ${f9Metrics.f9AgentPerformance.avgResponseTime.toFixed(0)}ms avg`);
      console.log(`  F9 Success Rate: ${(f9Metrics.f9AgentPerformance.successRate * 100).toFixed(1)}%`);
      console.log(`  Knowledge Base Health: ${(f9Metrics.knowledgeBaseStats.healthScore * 100).toFixed(1)}%`);
      console.log(`  Knowledge Patterns: ${f9Metrics.knowledgeBaseStats.totalPatterns}`);
      console.log(`  Integration Health: ${(f9Metrics.integrationHealth * 100).toFixed(1)}%`);
      console.log(`  Current Consensus Weights: F9 ${(f9Metrics.consensusWeights.f9Weight * 100).toFixed(0)}%, Traditional ${(f9Metrics.consensusWeights.traditionalWeight * 100).toFixed(0)}%`);
    }

    // F9 Expert specific status
    const f9Status = this.f9Coordinator.getF9ExpertStatus();
    console.log('\n🎯 F9 Expert Status:');
    console.log(`  Agent ID: ${f9Status.agent.id.slice(0, 8)}...`);
    console.log(`  Status: ${f9Status.agent.status}`);
    console.log(`  Capabilities: ${f9Status.agent.capabilities.length}`);
    console.log(`  Last Performance Update: ${new Date(f9Status.agent.performance.lastUpdated).toLocaleTimeString()}`);

    // Performance comparison
    const agents = this.f9Coordinator.getAgentStatus();
    console.log('\n⚡ Expert Performance Comparison:');
    agents.forEach(agent => {
      const isF9 = agent.name.includes('F9');
      const indicator = isF9 ? '🚀' : '👤';
      console.log(`  ${indicator} ${agent.name}: ${agent.performance.responseTime.toFixed(0)}ms`);
    });
  }

  async demonstrateCustomScenarios(): Promise<void> {
    console.log('\n🎨 CUSTOM F9 SCENARIOS');
    console.log('=' * 40);

    // Scenario 1: Dynamic weighting demonstration
    await this.demonstrateDynamicWeighting();

    // Scenario 2: F9 recommendations
    await this.demonstrateF9Recommendations();

    // Scenario 3: Performance under load
    await this.demonstratePerformanceUnderLoad();
  }

  private async demonstrateDynamicWeighting(): Promise<void> {
    console.log('\n⚖️ DYNAMIC WEIGHTING DEMONSTRATION');
    console.log('-'.repeat(40));

    const scenarios = [
      {
        name: 'Workflow-Focused Request',
        prompt: 'Optimize development workflow and automation processes',
        expectedF9Weight: 'High (60-70%)'
      },
      {
        name: 'Quality-Focused Request', 
        prompt: 'Review code for SOLID principles and clean architecture',
        expectedF9Weight: 'Low (15-25%)'
      },
      {
        name: 'Balanced Request',
        prompt: 'Develop feature with good practices and efficient workflow',
        expectedF9Weight: 'Medium (30-40%)'
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n📋 ${scenario.name}:`);
      console.log(`Prompt: "${scenario.prompt}"`);
      console.log(`Expected F9 Weight: ${scenario.expectedF9Weight}`);
      
      const request: MOARequest = {
        id: `dynamic-weighting-${scenario.name.toLowerCase().replace(/\s+/g, '-')}`,
        prompt: scenario.prompt,
        context: {},
        consensusThreshold: 0.7
      };

      const response = await this.f9Coordinator.processRequest(request);
      const f9Used = response.metadata.f9ExpertUsed;
      console.log(`Actual F9 Usage: ${f9Used ? 'Used' : 'Not Used'}`);
      console.log(`Consensus Method: ${response.result.consensusMethod}`);
    }
  }

  private async demonstrateF9Recommendations(): Promise<void> {
    console.log('\n💡 F9 CONTEXTUAL RECOMMENDATIONS');
    console.log('-'.repeat(40));

    const contexts = [
      {
        name: 'React Performance Project',
        context: { projectType: 'react', teamSize: 'medium', focus: 'performance' }
      },
      {
        name: 'Node.js API Development',
        context: { projectType: 'node', teamSize: 'large', focus: 'scalability' }
      },
      {
        name: 'Python ML Pipeline',
        context: { projectType: 'python', teamSize: 'small', focus: 'automation' }
      }
    ];

    for (const scenario of contexts) {
      console.log(`\n🎯 ${scenario.name}:`);
      const recommendations = await this.f9Coordinator.getF9Recommendations(scenario.context);
      
      console.log(`  Claude Code Optimizations: ${recommendations.claudeCodeOptimizations.length}`);
      console.log(`  MCP Integrations: ${recommendations.mcpIntegrations.length}`);
      console.log(`  Workflow Improvements: ${recommendations.workflowImprovements.length}`);
      console.log('  Expected Benefits:');
      recommendations.expectedBenefits.slice(0, 3).forEach(benefit => 
        console.log(`    • ${benefit}`)
      );
    }
  }

  private async demonstratePerformanceUnderLoad(): Promise<void> {
    console.log('\n🚀 PERFORMANCE UNDER LOAD');
    console.log('-'.repeat(40));

    console.log('Testing concurrent request handling...');

    const requests: MOARequest[] = Array.from({ length: 5 }, (_, i) => ({
      id: `load-test-${i}`,
      prompt: `Optimize ${['React', 'Node.js', 'Python', 'TypeScript', 'Vue'][i]} development workflow`,
      context: {
        projectType: ['react', 'node', 'python', 'typescript', 'vue'][i],
        focusArea: 'performance'
      },
      consensusThreshold: 0.7
    }));

    const startTime = Date.now();
    const responses = await Promise.all(
      requests.map(req => this.f9Coordinator.processRequest(req))
    );
    const totalTime = Date.now() - startTime;

    console.log(`\n📊 Load Test Results:`);
    console.log(`Total Requests: ${responses.length}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Average Time per Request: ${(totalTime / responses.length).toFixed(0)}ms`);
    console.log(`All Successful: ${responses.every(r => r.result.confidence > 0.7) ? 'YES' : 'NO'}`);

    const f9UsageCount = responses.filter(r => r.metadata.f9ExpertUsed).length;
    console.log(`F9 Expert Usage: ${f9UsageCount}/${responses.length} requests`);

    // Performance analysis
    const responseTimes = responses.map(r => r.processingTime);
    console.log(`Response Time Range: ${Math.min(...responseTimes)}-${Math.max(...responseTimes)}ms`);
    console.log(`Median Response Time: ${this.median(responseTimes).toFixed(0)}ms`);
  }

  private median(numbers: number[]): number {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle];
  }

  async cleanup(): Promise<void> {
    console.log('\n🔄 Shutting down F9 Enhanced MOA System...');
    await this.f9Coordinator.shutdown();
    console.log('✅ Cleanup complete');
  }
}

// Example usage and execution
export async function runF9BestPracticesDemo(): Promise<void> {
  const demo = new F9BestPracticesExample();
  
  try {
    await demo.initialize();
    await demo.runComprehensiveDemo();
    await demo.demonstrateCustomScenarios();
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await demo.cleanup();
  }
}

// Auto-run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runF9BestPracticesDemo().catch(console.error);
}

export default F9BestPracticesExample;