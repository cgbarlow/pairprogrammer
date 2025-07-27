// F9 Enhanced Consensus Engine - Advanced 6-Expert Consensus with Claude Code Integration
// Sophisticated consensus algorithms for traditional + F9 expert coordination

import type { AgentResponse, ConsensusResult } from '../../types/index.js';

export interface F9ConsensusMetrics {
  traditionalExpertWeight: number;
  f9ExpertWeight: number;
  qualityScore: number;
  workflowOptimizationScore: number;
  integratedConfidence: number;
  consensusStrength: number;
}

export interface F9ConsensusStrategy {
  mode: 'balanced' | 'quality_focused' | 'workflow_focused' | 'adaptive';
  dynamicWeighting: boolean;
  contextAware: boolean;
  performanceOptimized: boolean;
}

export interface F9ExpertResponse {
  agentResponse: AgentResponse;
  isF9Expert: boolean;
  expertiseArea: string;
  workflowRelevance: number;
  qualityRelevance: number;
}

export class F9EnhancedConsensusEngine {
  private consensusStrategies: Map<string, F9ConsensusStrategy>;
  private performanceMetrics: {
    consensusTime: number[];
    qualityScores: number[];
    userSatisfaction: number[];
  };

  constructor() {
    this.consensusStrategies = this.initializeConsensusStrategies();
    this.performanceMetrics = {
      consensusTime: [],
      qualityScores: [],
      userSatisfaction: []
    };
  }

  private initializeConsensusStrategies(): Map<string, F9ConsensusStrategy> {
    return new Map([
      ['balanced', {
        mode: 'balanced',
        dynamicWeighting: true,
        contextAware: true,
        performanceOptimized: true
      }],
      ['quality_focused', {
        mode: 'quality_focused',
        dynamicWeighting: false,
        contextAware: true,
        performanceOptimized: false
      }],
      ['workflow_focused', {
        mode: 'workflow_focused', 
        dynamicWeighting: true,
        contextAware: true,
        performanceOptimized: true
      }],
      ['adaptive', {
        mode: 'adaptive',
        dynamicWeighting: true,
        contextAware: true,
        performanceOptimized: true
      }]
    ]);
  }

  async buildF9EnhancedConsensus(
    responses: AgentResponse[],
    requestPrompt: string,
    threshold: number = 0.7,
    strategy: string = 'adaptive'
  ): Promise<ConsensusResult & { f9Metrics: F9ConsensusMetrics }> {
    const startTime = Date.now();

    // Classify and analyze responses
    const f9Responses = this.classifyF9Responses(responses);
    const analysisContext = this.analyzeRequestContext(requestPrompt);
    const consensusStrategy = this.consensusStrategies.get(strategy) || this.consensusStrategies.get('adaptive')!;

    // Calculate dynamic weights based on context and strategy
    const weights = this.calculateF9DynamicWeights(f9Responses, analysisContext, consensusStrategy);

    // Build consensus using F9-enhanced algorithm
    const consensus = await this.executeF9ConsensusAlgorithm(
      f9Responses,
      weights,
      threshold,
      consensusStrategy
    );

    // Calculate F9-specific metrics
    const f9Metrics = this.calculateF9Metrics(f9Responses, weights, consensus);

    const processingTime = Date.now() - startTime;
    this.updatePerformanceMetrics(processingTime, f9Metrics.qualityScore);

    return {
      ...consensus,
      processingTime,
      f9Metrics
    };
  }

  private classifyF9Responses(responses: AgentResponse[]): F9ExpertResponse[] {
    return responses.map(response => {
      const isF9Expert = response.metadata?.agentType === 'f9_claude_expert';
      const expertiseArea = response.metadata?.expertiseArea || response.metadata?.agentName || 'General';
      
      return {
        agentResponse: response,
        isF9Expert,
        expertiseArea,
        workflowRelevance: this.calculateWorkflowRelevance(response),
        qualityRelevance: this.calculateQualityRelevance(response)
      };
    });
  }

  private calculateWorkflowRelevance(response: AgentResponse): number {
    const content = response.response.toLowerCase();
    const workflowKeywords = [
      'workflow', 'process', 'automation', 'efficiency', 'optimization',
      'claude', 'mcp', 'hook', 'tool', 'integration', 'development'
    ];
    
    const keywordMatches = workflowKeywords.filter(keyword => content.includes(keyword)).length;
    return Math.min(1.0, keywordMatches / 5); // Normalize to 0-1
  }

  private calculateQualityRelevance(response: AgentResponse): number {
    const content = response.response.toLowerCase();
    const qualityKeywords = [
      'quality', 'clean', 'solid', 'pattern', 'architecture', 'design',
      'test', 'validation', 'refactor', 'maintainable', 'principle'
    ];
    
    const keywordMatches = qualityKeywords.filter(keyword => content.includes(keyword)).length;
    return Math.min(1.0, keywordMatches / 5); // Normalize to 0-1
  }

  private analyzeRequestContext(prompt: string): {
    workflowFocus: number;
    qualityFocus: number;
    integrationFocus: number;
    performanceFocus: number;
  } {
    const promptLower = prompt.toLowerCase();
    
    const workflowKeywords = ['workflow', 'process', 'automation', 'efficiency', 'optimize'];
    const qualityKeywords = ['quality', 'clean', 'test', 'validate', 'review'];
    const integrationKeywords = ['tool', 'mcp', 'integration', 'hook', 'system'];
    const performanceKeywords = ['performance', 'speed', 'fast', 'efficient', 'responsive'];

    return {
      workflowFocus: this.calculateKeywordDensity(promptLower, workflowKeywords),
      qualityFocus: this.calculateKeywordDensity(promptLower, qualityKeywords),
      integrationFocus: this.calculateKeywordDensity(promptLower, integrationKeywords),
      performanceFocus: this.calculateKeywordDensity(promptLower, performanceKeywords)
    };
  }

  private calculateKeywordDensity(text: string, keywords: string[]): number {
    const words = text.split(/\s+/).length;
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    return Math.min(1.0, matches / Math.max(1, words / 20)); // Normalize by text length
  }

  private calculateF9DynamicWeights(
    responses: F9ExpertResponse[],
    context: any,
    strategy: F9ConsensusStrategy
  ): {
    traditionalWeight: number;
    f9Weight: number;
    individualWeights: Map<string, number>;
  } {
    const traditionalResponses = responses.filter(r => !r.isF9Expert);
    const f9Response = responses.find(r => r.isF9Expert);

    let traditionalWeight = 0.70;
    let f9Weight = 0.30;

    if (strategy.dynamicWeighting) {
      // Adjust weights based on context and strategy
      switch (strategy.mode) {
        case 'workflow_focused':
          traditionalWeight = 0.40;
          f9Weight = 0.60;
          break;
        case 'quality_focused':
          traditionalWeight = 0.85;
          f9Weight = 0.15;
          break;
        case 'adaptive':
          // Adaptive weighting based on context analysis
          const workflowWeight = context.workflowFocus + context.integrationFocus + context.performanceFocus;
          const qualityWeight = context.qualityFocus;
          
          if (workflowWeight > qualityWeight) {
            f9Weight = Math.min(0.70, 0.30 + (workflowWeight * 0.4));
            traditionalWeight = 1.0 - f9Weight;
          } else {
            traditionalWeight = Math.min(0.85, 0.70 + (qualityWeight * 0.15));
            f9Weight = 1.0 - traditionalWeight;
          }
          break;
      }
    }

    // Calculate individual expert weights
    const individualWeights = new Map<string, number>();
    
    // Distribute traditional weight among 5 traditional experts
    const traditionalIndividualWeight = traditionalWeight / traditionalResponses.length;
    traditionalResponses.forEach(response => {
      // Adjust individual weight based on relevance and confidence
      const relevanceBoost = (response.qualityRelevance + response.workflowRelevance) / 2;
      const confidenceBoost = response.agentResponse.confidence;
      const adjustedWeight = traditionalIndividualWeight * (0.5 + relevanceBoost * 0.3 + confidenceBoost * 0.2);
      individualWeights.set(response.agentResponse.agentId, adjustedWeight);
    });

    // F9 expert gets full F9 weight
    if (f9Response) {
      individualWeights.set(f9Response.agentResponse.agentId, f9Weight);
    }

    return {
      traditionalWeight,
      f9Weight,
      individualWeights
    };
  }

  private async executeF9ConsensusAlgorithm(
    responses: F9ExpertResponse[],
    weights: any,
    threshold: number,
    strategy: F9ConsensusStrategy
  ): Promise<ConsensusResult> {
    const traditionalResponses = responses.filter(r => !r.isF9Expert);
    const f9Response = responses.find(r => r.isF9Expert);

    // Synthesize traditional expert consensus
    const traditionalConsensus = await this.synthesizeTraditionalConsensus(traditionalResponses);
    
    // Get F9 expert analysis
    const f9Analysis = f9Response ? f9Response.agentResponse.response : '';

    // Create integrated consensus
    const integratedResponse = this.createIntegratedF9Response(
      traditionalConsensus,
      f9Analysis,
      weights,
      strategy
    );

    // Calculate overall confidence
    const overallConfidence = this.calculateF9OverallConfidence(responses, weights);

    // Determine consensus method
    const consensusMethod = f9Response ? 'f9_enhanced_weighted' : 'traditional_weighted';

    return {
      finalResponse: integratedResponse,
      confidence: overallConfidence,
      processingTime: 0, // Will be set by caller
      participatingAgents: responses.map(r => r.agentResponse.agentId),
      consensusMethod,
      reasoning: this.generateF9ConsensusReasoning(responses, weights, strategy)
    };
  }

  private async synthesizeTraditionalConsensus(responses: F9ExpertResponse[]): Promise<string> {
    if (responses.length === 0) return '';

    const expertAreas = responses.map(r => ({
      area: r.expertiseArea,
      content: r.agentResponse.response,
      confidence: r.agentResponse.confidence,
      qualityRelevance: r.qualityRelevance
    }));

    // Group by expertise area and synthesize
    const synthesis = expertAreas.map(expert => {
      return `**${expert.area}** (Confidence: ${(expert.confidence * 100).toFixed(0)}%):\n${expert.content}`;
    }).join('\n\n');

    return synthesis;
  }

  private createIntegratedF9Response(
    traditionalConsensus: string,
    f9Analysis: string,
    weights: any,
    strategy: F9ConsensusStrategy
  ): string {
    if (!f9Analysis) {
      return traditionalConsensus;
    }

    const traditionalWeight = weights.traditionalWeight;
    const f9Weight = weights.f9Weight;

    return `# Integrated 6-Expert Analysis

## Expert Coordination Summary
Combining traditional software engineering excellence (${(traditionalWeight * 100).toFixed(0)}% influence) with Claude Code workflow optimization (${(f9Weight * 100).toFixed(0)}% influence).

## Traditional Software Engineering Guidance
${traditionalConsensus}

## Claude Code Workflow Optimization
${f9Analysis}

## Integrated Implementation Strategy

### Immediate Actions
1. **Foundation**: Apply traditional engineering principles for code quality and architecture
2. **Enhancement**: Integrate F9 Claude Code optimizations for workflow efficiency
3. **Validation**: Ensure both quality standards and workflow performance targets are met

### Long-term Strategy
- **Quality Maintenance**: Continuous adherence to proven software engineering principles
- **Process Optimization**: Ongoing refinement of Claude Code workflows and tool integration
- **Performance Monitoring**: Track both code quality metrics and development efficiency gains

### Expected Outcomes
- **Code Quality**: Maintained at professional standards through traditional expertise
- **Development Speed**: Enhanced through optimized Claude Code workflows
- **Team Productivity**: Improved through integrated quality and efficiency practices
- **Maintainability**: Ensured through balanced approach to traditional principles and modern tooling

---
*Generated by F9 Enhanced 6-Expert Consensus Engine with ${strategy.mode} strategy*`;
  }

  private calculateF9OverallConfidence(
    responses: F9ExpertResponse[],
    weights: any
  ): number {
    let weightedConfidence = 0;
    let totalWeight = 0;

    responses.forEach(response => {
      const weight = weights.individualWeights.get(response.agentResponse.agentId) || 0;
      weightedConfidence += response.agentResponse.confidence * weight;
      totalWeight += weight;
    });

    const baseConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

    // Boost confidence for comprehensive 6-expert analysis
    const comprehensiveBoost = 0.05;
    
    // Additional boost for high agreement between traditional and F9 experts
    const f9Response = responses.find(r => r.isF9Expert);
    const traditionalResponses = responses.filter(r => !r.isF9Expert);
    
    let agreementBoost = 0;
    if (f9Response && traditionalResponses.length > 0) {
      const avgTraditionalConfidence = traditionalResponses.reduce((sum, r) => sum + r.agentResponse.confidence, 0) / traditionalResponses.length;
      const confidenceDifference = Math.abs(f9Response.agentResponse.confidence - avgTraditionalConfidence);
      agreementBoost = Math.max(0, 0.03 - confidenceDifference * 0.1);
    }

    return Math.min(0.98, baseConfidence + comprehensiveBoost + agreementBoost);
  }

  private generateF9ConsensusReasoning(
    responses: F9ExpertResponse[],
    weights: any,
    strategy: F9ConsensusStrategy
  ): string {
    const traditionalCount = responses.filter(r => !r.isF9Expert).length;
    const hasF9Expert = responses.some(r => r.isF9Expert);

    let reasoning = `F9 Enhanced Consensus using ${strategy.mode} strategy with ${responses.length} expert${responses.length > 1 ? 's' : ''}`;
    
    if (hasF9Expert) {
      reasoning += ` (${traditionalCount} traditional + 1 F9 Claude Code expert)`;
    } else {
      reasoning += ` (${traditionalCount} traditional experts only)`;
    }

    reasoning += `. Weighting: Traditional ${(weights.traditionalWeight * 100).toFixed(0)}%`;
    
    if (hasF9Expert) {
      reasoning += `, F9 Workflow ${(weights.f9Weight * 100).toFixed(0)}%`;
    }

    if (strategy.dynamicWeighting) {
      reasoning += '. Dynamic weighting applied based on request context and expert relevance.';
    }

    if (strategy.contextAware) {
      reasoning += ' Context-aware analysis incorporated for optimal expert coordination.';
    }

    return reasoning;
  }

  private calculateF9Metrics(
    responses: F9ExpertResponse[],
    weights: any,
    consensus: ConsensusResult
  ): F9ConsensusMetrics {
    const traditionalResponses = responses.filter(r => !r.isF9Expert);
    const f9Response = responses.find(r => r.isF9Expert);

    // Calculate quality score based on traditional expert confidence and relevance
    const qualityScore = traditionalResponses.length > 0
      ? traditionalResponses.reduce((sum, r) => sum + r.agentResponse.confidence * r.qualityRelevance, 0) / traditionalResponses.length
      : 0;

    // Calculate workflow optimization score based on F9 expert and workflow relevance
    const workflowOptimizationScore = f9Response
      ? f9Response.agentResponse.confidence * f9Response.workflowRelevance
      : traditionalResponses.reduce((sum, r) => sum + r.agentResponse.confidence * r.workflowRelevance, 0) / Math.max(1, traditionalResponses.length);

    // Calculate consensus strength (agreement between experts)
    const confidences = responses.map(r => r.agentResponse.confidence);
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const confidenceVariance = confidences.reduce((sum, conf) => sum + Math.pow(conf - avgConfidence, 2), 0) / confidences.length;
    const consensusStrength = Math.max(0, 1.0 - confidenceVariance);

    return {
      traditionalExpertWeight: weights.traditionalWeight,
      f9ExpertWeight: weights.f9Weight,
      qualityScore,
      workflowOptimizationScore,
      integratedConfidence: consensus.confidence,
      consensusStrength
    };
  }

  private updatePerformanceMetrics(processingTime: number, qualityScore: number): void {
    this.performanceMetrics.consensusTime.push(processingTime);
    this.performanceMetrics.qualityScores.push(qualityScore);

    // Keep only last 100 measurements
    if (this.performanceMetrics.consensusTime.length > 100) {
      this.performanceMetrics.consensusTime = this.performanceMetrics.consensusTime.slice(-100);
      this.performanceMetrics.qualityScores = this.performanceMetrics.qualityScores.slice(-100);
    }
  }

  // Public analysis methods

  async analyzeConsensusQuality(
    responses: AgentResponse[],
    consensus: ConsensusResult & { f9Metrics: F9ConsensusMetrics }
  ): Promise<{
    overallQuality: number;
    expertAgreement: number;
    workflowIntegration: number;
    recommendations: string[];
  }> {
    const f9Responses = this.classifyF9Responses(responses);
    
    const overallQuality = (consensus.f9Metrics.qualityScore + consensus.f9Metrics.workflowOptimizationScore) / 2;
    const expertAgreement = consensus.f9Metrics.consensusStrength;
    const workflowIntegration = consensus.f9Metrics.workflowOptimizationScore;

    const recommendations: string[] = [];
    
    if (overallQuality < 0.7) {
      recommendations.push('Consider refining expert selection for better quality coverage');
    }
    if (expertAgreement < 0.6) {
      recommendations.push('Expert disagreement detected - may need additional analysis');
    }
    if (workflowIntegration < 0.5) {
      recommendations.push('Workflow optimization potential not fully utilized');
    }
    if (consensus.confidence < 0.8) {
      recommendations.push('Consider gathering additional expert input for higher confidence');
    }

    return {
      overallQuality,
      expertAgreement,
      workflowIntegration,
      recommendations
    };
  }

  getConsensusStrategies(): string[] {
    return Array.from(this.consensusStrategies.keys());
  }

  updateConsensusStrategy(name: string, strategy: F9ConsensusStrategy): void {
    this.consensusStrategies.set(name, strategy);
  }

  getPerformanceMetrics(): {
    avgConsensusTime: number;
    avgQualityScore: number;
    totalConsensuses: number;
  } {
    const times = this.performanceMetrics.consensusTime;
    const qualities = this.performanceMetrics.qualityScores;

    return {
      avgConsensusTime: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      avgQualityScore: qualities.length > 0 ? qualities.reduce((sum, score) => sum + score, 0) / qualities.length : 0,
      totalConsensuses: times.length
    };
  }

  // Advanced consensus algorithms

  async buildAdaptiveConsensus(
    responses: AgentResponse[],
    requestContext: any,
    threshold: number = 0.7
  ): Promise<ConsensusResult & { f9Metrics: F9ConsensusMetrics }> {
    // Determine optimal strategy based on request context
    const optimalStrategy = this.determineOptimalStrategy(requestContext);
    
    return await this.buildF9EnhancedConsensus(
      responses,
      requestContext.prompt || '',
      threshold,
      optimalStrategy
    );
  }

  private determineOptimalStrategy(context: any): string {
    const prompt = (context.prompt || '').toLowerCase();
    
    if (prompt.includes('workflow') || prompt.includes('process') || prompt.includes('optimization')) {
      return 'workflow_focused';
    }
    if (prompt.includes('quality') || prompt.includes('review') || prompt.includes('validation')) {
      return 'quality_focused';
    }
    if (prompt.includes('balance') || prompt.includes('comprehensive')) {
      return 'balanced';
    }
    
    return 'adaptive';
  }

  async buildWeightedConsensus(
    responses: AgentResponse[],
    customWeights: Map<string, number>,
    threshold: number = 0.7
  ): Promise<ConsensusResult> {
    // Use custom weights instead of calculated ones
    let weightedResponse = '';
    let totalWeight = 0;
    let weightedConfidence = 0;

    responses.forEach(response => {
      const weight = customWeights.get(response.agentId) || 0;
      if (weight > 0) {
        weightedResponse += `${response.response}\n\n`;
        weightedConfidence += response.confidence * weight;
        totalWeight += weight;
      }
    });

    const finalConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

    return {
      finalResponse: weightedResponse.trim(),
      confidence: finalConfidence,
      processingTime: 0,
      participatingAgents: responses.map(r => r.agentId),
      consensusMethod: 'custom_weighted',
      reasoning: `Custom weighted consensus with user-defined expert weights. Total weight: ${totalWeight.toFixed(2)}`
    };
  }
}