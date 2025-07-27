// F1 MOA System - End-to-End Tests

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MOACoordinator } from '../../src/agents/MOACoordinator.js';
import { F1MCPServer } from '../../src/mcp/server.js';
import WebSocket from 'ws';
import type { MOARequest, MCPMessage } from '../../src/types/index.js';

describe('F1 MOA System E2E Tests', () => {
  let coordinator: MOACoordinator;
  let mcpServer: F1MCPServer;
  let client: WebSocket;
  
  beforeAll(async () => {
    // Initialize MOA coordinator
    coordinator = new MOACoordinator();
    await coordinator.initialize();
    
    // Start MCP server on test port
    mcpServer = new F1MCPServer(8081);
    await mcpServer.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  afterAll(async () => {
    if (client) {
      client.close();
    }
    await mcpServer.stop();
    await coordinator.shutdown();
  });

  describe('6-Agent MOA Coordination', () => {
    it('should spawn and coordinate 6 agents successfully', async () => {
      const agents = coordinator.getAgentStatus();
      
      expect(agents).toHaveLength(6);
      expect(agents.map(a => a.type)).toEqual(
        expect.arrayContaining(['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'validator'])
      );
      
      // All agents should be idle initially
      agents.forEach(agent => {
        expect(agent.status).toBe('idle');
        expect(agent.capabilities).toBeInstanceOf(Array);
        expect(agent.capabilities.length).toBeGreaterThan(0);
      });
    });

    it('should process requests with parallel agent execution', async () => {
      const request: MOARequest = {
        id: 'test-parallel-1',
        prompt: 'Analyze the performance implications of using nested loops in JavaScript',
        consensusThreshold: 0.7
      };

      const startTime = Date.now();
      const response = await coordinator.processRequest(request);
      const processingTime = Date.now() - startTime;

      expect(response.requestId).toBe(request.id);
      expect(response.result.finalResponse).toContain('performance');
      expect(response.result.confidence).toBeGreaterThan(0.7);
      expect(response.agentResponses.length).toBe(6);
      expect(response.processingTime).toBeLessThan(500); // Should be fast with parallel processing
      expect(processingTime).toBeLessThan(1000); // E2E time limit
      
      // Verify all agents participated
      const agentTypes = response.agentResponses.map(r => r.metadata?.agentType);
      expect(agentTypes).toEqual(
        expect.arrayContaining(['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'validator'])
      );
    });

    it('should achieve <300ms consensus time target', async () => {
      const request: MOARequest = {
        id: 'test-performance-1',
        prompt: 'Quick code review: function add(a, b) { return a + b; }',
        consensusThreshold: 0.6
      };

      const response = await coordinator.processRequest(request);
      
      expect(response.result.processingTime).toBeLessThan(300);
      expect(response.result.confidence).toBeGreaterThan(0.6);
      console.log(`✅ Consensus achieved in ${response.result.processingTime}ms`);
    });

    it('should handle different consensus methods', async () => {
      const request: MOARequest = {
        id: 'test-consensus-1',
        prompt: 'Should we use TypeScript or JavaScript for a new project?',
        consensusThreshold: 0.8
      };

      const response = await coordinator.processRequest(request);
      
      expect(response.result.consensusMethod).toBeOneOf(['weighted', 'majority', 'expert', 'hybrid']);
      expect(response.result.reasoning).toContain('consensus');
      expect(response.result.participatingAgents).toHaveLength(6);
    });

    it('should handle agent specialization correctly', async () => {
      const request: MOARequest = {
        id: 'test-specialization-1',
        prompt: 'Optimize this database query: SELECT * FROM users WHERE age > 25',
        requiredAgentTypes: ['optimizer', 'analyst', 'coder']
      };

      const response = await coordinator.processRequest(request);
      
      expect(response.agentResponses.length).toBe(3);
      const agentTypes = response.agentResponses.map(r => r.metadata?.agentType);
      expect(agentTypes).toEqual(expect.arrayContaining(['optimizer', 'analyst', 'coder']));
      
      // Responses should be relevant to the agent types
      const optimizerResponse = response.agentResponses.find(r => r.metadata?.agentType === 'optimizer');
      expect(optimizerResponse?.response).toContain('optimization');
    });
  });

  describe('AST Analysis Integration', () => {
    it('should perform AST analysis when requested', async () => {
      const request: MOARequest = {
        id: 'test-ast-1',
        prompt: 'function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }',
        astAnalysis: true
      };

      const response = await coordinator.processRequest(request);
      
      expect(response.astAnalysis).toBeDefined();
      expect(response.astAnalysis!.language).toBe('javascript');
      expect(response.astAnalysis!.nodes.length).toBeGreaterThan(0);
      expect(response.astAnalysis!.complexity).toBeGreaterThan(0);
      expect(response.astAnalysis!.parseTime).toBeLessThan(100);
      
      // Should detect recursion pattern
      const patterns = response.astAnalysis!.patterns;
      expect(patterns.some(p => p.type.includes('function') || p.description.includes('recursion'))).toBe(true);
    });

    it('should detect performance patterns in code', async () => {
      const codeWithIssues = `
        for (let i = 0; i < 1000; i++) {
          for (let j = 0; j < 1000; j++) {
            console.log(i + j);
          }
        }
      `;

      const request: MOARequest = {
        id: 'test-ast-patterns-1',
        prompt: codeWithIssues,
        astAnalysis: true
      };

      const response = await coordinator.processRequest(request);
      
      expect(response.astAnalysis!.patterns.some(p => p.type === 'nested_loops')).toBe(true);
      expect(response.astAnalysis!.complexity).toBeGreaterThan(2);
    });
  });

  describe('Prompt Template System', () => {
    it('should apply expert templates correctly', async () => {
      const request: MOARequest = {
        id: 'test-template-1',
        prompt: 'Review this authentication code',
        usePromptTemplate: 'code-review',
        context: {
          context: 'User authentication module',
          changes: 'Added JWT token validation',
          focus: 'Security and performance'
        }
      };

      const response = await coordinator.processRequest(request);
      
      expect(response.metadata.templateUsed).toBe('code-review');
      expect(response.result.finalResponse).toContain('Code Quality');
      expect(response.result.finalResponse).toContain('Security');
    });
  });

  describe('MCP Server Integration', () => {
    it('should establish WebSocket connection', async () => {
      return new Promise<void>((resolve, reject) => {
        client = new WebSocket('ws://localhost:8081');
        
        client.on('open', () => {
          expect(client.readyState).toBe(WebSocket.OPEN);
          resolve();
        });
        
        client.on('error', reject);
        
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    });

    it('should handle MCP capabilities request', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPMessage = {
          type: 'request',
          id: 'test-capabilities',
          method: 'capabilities'
        };

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          const response: MCPMessage = JSON.parse(data.toString());
          
          if (response.id === 'test-capabilities') {
            expect(response.type).toBe('response');
            expect(response.result.capabilities).toBeInstanceOf(Array);
            expect(response.result.capabilities.length).toBeGreaterThan(0);
            
            const capabilityNames = response.result.capabilities.map((c: any) => c.name);
            expect(capabilityNames).toEqual(expect.arrayContaining([
              'moa_processing',
              'agent_management', 
              'ast_analysis',
              'prompt_templates',
              'system_monitoring'
            ]));
            
            resolve();
          }
        });

        setTimeout(() => reject(new Error('Response timeout')), 5000);
      });
    });

    it('should process MOA requests via MCP', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPMessage = {
          type: 'request',
          id: 'test-mcp-moa',
          method: 'moa_process',
          params: {
            prompt: 'Simple test request',
            consensusThreshold: 0.7
          }
        };

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          const response: MCPMessage = JSON.parse(data.toString());
          
          if (response.id === 'test-mcp-moa') {
            expect(response.type).toBe('response');
            expect(response.result.result).toBeDefined();
            expect(response.result.result.finalResponse).toContain('test');
            expect(response.result.result.confidence).toBeGreaterThan(0);
            expect(response.result.agentResponses.length).toBe(6);
            
            resolve();
          }
        });

        setTimeout(() => reject(new Error('Response timeout')), 10000);
      });
    });

    it('should handle health checks', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPMessage = {
          type: 'request',
          id: 'test-health',
          method: 'health_check'
        };

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          const response: MCPMessage = JSON.parse(data.toString());
          
          if (response.id === 'test-health') {
            expect(response.result.status).toBe('healthy');
            expect(response.result.moaSystem).toBe('operational');
            expect(response.result.activeAgents).toBe(6);
            expect(response.result.uptime).toBeGreaterThan(0);
            
            resolve();
          }
        });

        setTimeout(() => reject(new Error('Response timeout')), 5000);
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance targets', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        id: `perf-test-${i}`,
        prompt: `Performance test ${i}: Optimize this code snippet`,
        consensusThreshold: 0.7
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => coordinator.processRequest(req))
      );
      const totalTime = Date.now() - startTime;

      // All requests should complete successfully
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.result.confidence).toBeGreaterThan(0.7);
        expect(response.agentResponses).toHaveLength(6);
      });

      // Performance targets
      const avgResponseTime = responses.reduce((sum, r) => sum + r.processingTime, 0) / responses.length;
      const throughput = requests.length / (totalTime / 1000);

      expect(avgResponseTime).toBeLessThan(300); // <300ms consensus target
      expect(throughput).toBeGreaterThan(5); // >5 requests/second
      
      console.log(`✅ Performance: ${avgResponseTime.toFixed(1)}ms avg, ${throughput.toFixed(1)} req/s`);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
        coordinator.processRequest({
          id: `concurrent-${i}`,
          prompt: `Concurrent test ${i}`,
          consensusThreshold: 0.6
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.result.confidence).toBeGreaterThan(0.6);
      });

      // Concurrent processing should be faster than sequential
      expect(totalTime).toBeLessThan(1500); // Should complete in <1.5s
      console.log(`✅ Concurrent processing: ${totalTime}ms for 5 requests`);
    });
  });

  describe('System Metrics', () => {
    it('should provide accurate system metrics', async () => {
      // Process a few requests to generate metrics
      await coordinator.processRequest({
        id: 'metrics-test-1',
        prompt: 'Test request for metrics',
        consensusThreshold: 0.7
      });

      const metrics = coordinator.getSystemMetrics();
      
      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
      expect(metrics.activeAgents).toBe(6);
      expect(metrics.consensusRate).toBeGreaterThan(0);
    });
  });
});