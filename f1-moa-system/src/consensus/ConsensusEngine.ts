// F1 MOA System - Consensus Engine with <300ms Target

import type { AgentResponse, ConsensusResult } from '../types/index.js';

export class ConsensusEngine {
  private readonly TARGET_CONSENSUS_TIME = 300; // ms

  async buildConsensus(
    responses: AgentResponse[],
    threshold: number = 0.7
  ): Promise<ConsensusResult> {
    const startTime = Date.now();
    
    if (responses.length === 0) {
      throw new Error('No agent responses provided for consensus');
    }

    console.log(`🤝 Building consensus from ${responses.length} agent responses...`);

    // Single response - return immediately
    if (responses.length === 1) {
      const processingTime = Date.now() - startTime;
      return {
        finalResponse: responses[0].response,
        confidence: responses[0].confidence,
        processingTime,
        participatingAgents: [responses[0].agentId],
        consensusMethod: 'weighted',
        reasoning: 'Single agent response - no consensus needed'
      };
    }

    // Multiple responses - apply consensus algorithms
    const consensusResult = await this.applyConsensusAlgorithm(responses, threshold);
    const processingTime = Date.now() - startTime;

    // Log performance
    if (processingTime > this.TARGET_CONSENSUS_TIME) {
      console.warn(`⚠️ Consensus took ${processingTime}ms (target: ${this.TARGET_CONSENSUS_TIME}ms)`);
    } else {
      console.log(`✅ Consensus reached in ${processingTime}ms`);
    }

    return {
      ...consensusResult,
      processingTime,
      participatingAgents: responses.map(r => r.agentId)
    };
  }

  private async applyConsensusAlgorithm(
    responses: AgentResponse[],
    threshold: number
  ): Promise<Omit<ConsensusResult, 'processingTime' | 'participatingAgents'>> {
    // Try multiple consensus methods and pick the best
    const methods = [
      () => this.weightedConsensus(responses, threshold),
      () => this.majorityConsensus(responses, threshold),
      () => this.expertConsensus(responses, threshold),
      () => this.hybridConsensus(responses, threshold)
    ];

    let bestResult: Omit<ConsensusResult, 'processingTime' | 'participatingAgents'> | null = null;
    let bestConfidence = 0;

    for (const method of methods) {
      try {
        const result = await method();
        if (result.confidence > bestConfidence && result.confidence >= threshold) {
          bestResult = result;
          bestConfidence = result.confidence;
        }
      } catch (error) {
        console.warn('Consensus method failed:', error);
      }
    }

    if (!bestResult) {
      // Fallback to weighted consensus with lower threshold
      bestResult = await this.weightedConsensus(responses, 0.5);
    }

    return bestResult;
  }

  private async weightedConsensus(
    responses: AgentResponse[],
    threshold: number
  ): Promise<Omit<ConsensusResult, 'processingTime' | 'participatingAgents'>> {
    // Weight responses by confidence and agent performance
    const weightedResponses = responses.map(response => {
      const agentWeight = this.calculateAgentWeight(response);
      return {
        response,
        weight: response.confidence * agentWeight,
        score: response.confidence * agentWeight
      };
    });

    // Sort by weight
    weightedResponses.sort((a, b) => b.weight - a.weight);

    // Take top responses that meet threshold
    const qualifyingResponses = weightedResponses.filter(wr => wr.score >= threshold);
    
    if (qualifyingResponses.length === 0) {
      // Use top response if none meet threshold
      const topResponse = weightedResponses[0];
      return {
        finalResponse: topResponse.response.response,
        confidence: topResponse.score,
        consensusMethod: 'weighted',
        reasoning: 'Weighted consensus using top-scoring response (below threshold)'
      };
    }

    // Synthesize responses from qualifying agents
    const synthesizedResponse = this.synthesizeResponses(
      qualifyingResponses.map(wr => wr.response)
    );

    const avgConfidence = qualifyingResponses.reduce((sum, wr) => sum + wr.score, 0) / qualifyingResponses.length;

    return {
      finalResponse: synthesizedResponse,
      confidence: Math.min(avgConfidence, 1.0),
      consensusMethod: 'weighted',
      reasoning: `Weighted consensus from ${qualifyingResponses.length} qualifying agents`
    };
  }

  private async majorityConsensus(
    responses: AgentResponse[],
    threshold: number
  ): Promise<Omit<ConsensusResult, 'processingTime' | 'participatingAgents'>> {
    // Group similar responses
    const groups = this.groupSimilarResponses(responses);
    
    // Find majority group
    let majorityGroup = groups[0];
    for (const group of groups) {
      if (group.responses.length > majorityGroup.responses.length) {
        majorityGroup = group;
      }
    }

    const majorityRatio = majorityGroup.responses.length / responses.length;
    const avgConfidence = majorityGroup.responses.reduce((sum, r) => sum + r.confidence, 0) / majorityGroup.responses.length;
    
    const confidence = majorityRatio * avgConfidence;

    if (confidence < threshold) {
      throw new Error(`Majority consensus confidence ${confidence} below threshold ${threshold}`);
    }

    const synthesizedResponse = this.synthesizeResponses(majorityGroup.responses);

    return {
      finalResponse: synthesizedResponse,
      confidence,
      consensusMethod: 'majority',
      reasoning: `Majority consensus from ${majorityGroup.responses.length}/${responses.length} agents`
    };
  }

  private async expertConsensus(
    responses: AgentResponse[],
    threshold: number
  ): Promise<Omit<ConsensusResult, 'processingTime' | 'participatingAgents'>> {
    // Identify expert agents based on task relevance and past performance
    const expertResponses = responses.filter(response => {
      const agentWeight = this.calculateAgentWeight(response);
      return agentWeight > 0.8 && response.confidence > 0.85;
    });

    if (expertResponses.length === 0) {
      throw new Error('No expert agents identified for expert consensus');
    }

    const avgConfidence = expertResponses.reduce((sum, r) => r.confidence, 0) / expertResponses.length;
    
    if (avgConfidence < threshold) {
      throw new Error(`Expert consensus confidence ${avgConfidence} below threshold ${threshold}`);
    }

    const synthesizedResponse = this.synthesizeResponses(expertResponses);

    return {
      finalResponse: synthesizedResponse,
      confidence: avgConfidence,
      consensusMethod: 'expert',
      reasoning: `Expert consensus from ${expertResponses.length} expert agents`
    };
  }

  private async hybridConsensus(
    responses: AgentResponse[],
    threshold: number
  ): Promise<Omit<ConsensusResult, 'processingTime' | 'participatingAgents'>> {
    // Combine weighted and majority approaches
    const weightedResult = await this.weightedConsensus(responses, threshold * 0.8);
    const majorityResult = await this.majorityConsensus(responses, threshold * 0.8);

    // Average the confidence scores
    const hybridConfidence = (weightedResult.confidence + majorityResult.confidence) / 2;

    if (hybridConfidence < threshold) {
      throw new Error(`Hybrid consensus confidence ${hybridConfidence} below threshold ${threshold}`);
    }

    // Combine responses intelligently
    const hybridResponse = this.combineResponses([
      weightedResult.finalResponse,
      majorityResult.finalResponse
    ]);

    return {
      finalResponse: hybridResponse,
      confidence: hybridConfidence,
      consensusMethod: 'hybrid',
      reasoning: 'Hybrid consensus combining weighted and majority methods'
    };
  }

  private calculateAgentWeight(response: AgentResponse): number {
    // Calculate agent weight based on metadata and response quality
    const baseWeight = 1.0;
    const metadata = response.metadata || {};
    
    // Factor in agent type expertise
    let typeWeight = 1.0;
    if (metadata.agentType) {
      // Higher weight for specialized agents
      const specializedTypes = ['coordinator', 'validator', 'coder'];
      if (specializedTypes.includes(metadata.agentType)) {
        typeWeight = 1.2;
      }
    }

    // Factor in response time (faster = better up to a point)
    let timeWeight = 1.0;
    if (metadata.responseTime && metadata.responseTime < 200) {
      timeWeight = 1.1;
    }

    return Math.min(baseWeight * typeWeight * timeWeight, 2.0);
  }

  private groupSimilarResponses(responses: AgentResponse[]): Array<{
    responses: AgentResponse[];
    similarity: number;
  }> {
    const groups: Array<{ responses: AgentResponse[]; similarity: number }> = [];

    for (const response of responses) {
      let addedToGroup = false;
      
      for (const group of groups) {
        const similarity = this.calculateSimilarity(
          response.response,
          group.responses[0].response
        );
        
        if (similarity > 0.7) {
          group.responses.push(response);
          group.similarity = (group.similarity + similarity) / 2;
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push({
          responses: [response],
          similarity: 1.0
        });
      }
    }

    return groups.sort((a, b) => b.responses.length - a.responses.length);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation based on common words
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  private synthesizeResponses(responses: AgentResponse[]): string {
    if (responses.length === 1) {
      return responses[0].response;
    }

    // Extract key points from each response
    const keyPoints = responses.map(r => this.extractKeyPoints(r.response));
    const allPoints = keyPoints.flat();
    
    // Remove duplicates and rank by frequency
    const pointCounts = new Map<string, number>();
    for (const point of allPoints) {
      pointCounts.set(point, (pointCounts.get(point) || 0) + 1);
    }
    
    // Sort by frequency and take top points
    const topPoints = Array.from(pointCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([point]) => point);

    // Combine into coherent response
    return `Synthesized response: ${topPoints.join('. ')}.`;
  }

  private extractKeyPoints(response: string): string[] {
    // Simple extraction - split by sentences and filter meaningful ones
    return response
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.includes('based on'))
      .slice(0, 3);
  }

  private combineResponses(responses: string[]): string {
    // Intelligent combination of multiple response strings
    const sentences = responses.flatMap(r => 
      r.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5)
    );
    
    // Remove duplicates and combine
    const uniqueSentences = [...new Set(sentences)];
    return uniqueSentences.slice(0, 3).join('. ') + '.';
  }
}