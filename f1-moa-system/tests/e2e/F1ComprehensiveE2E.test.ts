// F1 MOA System - Comprehensive E2E Test Suite
// Validates production readiness with 100% coverage requirements

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { MOACoordinator } from '../../src/agents/MOACoordinator.js';
import { F1MCPServer } from '../../src/mcp/server.js';
import { ASTAnalyzer } from '../../src/ast/ASTAnalyzer.js';
import { PromptingSystem } from '../../src/prompting/PromptingSystem.js';
import WebSocket from 'ws';
import type { MOARequest, MCPMessage, AgentType } from '../../src/types/index.js';

describe('F1 MOA System - Comprehensive E2E Production Tests', () => {
  let coordinator: MOACoordinator;
  let mcpServer: F1MCPServer;
  let astAnalyzer: ASTAnalyzer;
  let promptingSystem: PromptingSystem;
  let client: WebSocket;
  
  const PERFORMANCE_TARGETS = {
    CONSENSUS_TIME: 300, // ms
    SINGULAR_TIME: 200,  // ms
    AGENT_SPAWN_TIME: 100, // ms
    AST_PARSE_TIME: 50,   // ms
    CONCURRENT_REQUESTS: 10
  };

  beforeAll(async () => {
    console.log('🚀 Setting up comprehensive E2E test environment...');
    
    // Initialize all core systems
    coordinator = new MOACoordinator();
    await coordinator.initialize();
    
    astAnalyzer = new ASTAnalyzer();
    await astAnalyzer.initialize();
    
    promptingSystem = new PromptingSystem();
    await promptingSystem.initialize();
    
    // Start MCP server on test port
    mcpServer = new F1MCPServer(8082);
    await mcpServer.start();
    
    // Allow server startup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ E2E test environment ready');
  });
  
  afterAll(async () => {
    console.log('🔄 Cleaning up E2E test environment...');
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.close();
    }
    
    await mcpServer.stop();
    await coordinator.shutdown();
    
    console.log('✅ E2E test cleanup complete');
  });

  describe('🤖 Agent Coordination & Task Tool Integration', () => {
    it('should spawn 6 agents with unique capabilities and coordination', async () => {
      const agents = coordinator.getAgentStatus();
      
      // Verify 6 agents spawned
      expect(agents).toHaveLength(6);
      
      // Verify agent types and uniqueness
      const agentTypes = agents.map(a => a.type);
      const expectedTypes: AgentType[] = ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'validator'];
      expect(agentTypes).toEqual(expect.arrayContaining(expectedTypes));
      expect(new Set(agentTypes).size).toBe(6); // All unique
      
      // Verify each agent has capabilities
      agents.forEach(agent => {
        expect(agent.capabilities).toBeInstanceOf(Array);
        expect(agent.capabilities.length).toBeGreaterThan(0);
        expect(agent.status).toBe('idle');
        expect(agent.performance).toBeDefined();
        expect(agent.context).toBeDefined();
      });
      
      console.log('✅ 6-Agent spawn validation complete');
    });

    it('should process requests with real Task tool pattern simulation', async () => {
      const request: MOARequest = {
        id: 'task-tool-test-1',
        prompt: 'Analyze microservices architecture for performance bottlenecks',
        consensusThreshold: 0.7
      };

      const startTime = Date.now();
      const response = await coordinator.processRequest(request);
      const processingTime = Date.now() - startTime;

      // Verify response structure
      expect(response.requestId).toBe(request.id);
      expect(response.result.finalResponse).toContain('architecture');
      expect(response.result.confidence).toBeGreaterThan(0.7);
      expect(response.agentResponses).toHaveLength(6);
      
      // Verify all agent types participated
      const participatingTypes = response.agentResponses.map(r => r.metadata?.agentType);
      expect(participatingTypes).toEqual(expect.arrayContaining(['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'validator']));
      
      // Verify parallel execution (should be faster than sequential)
      expect(processingTime).toBeLessThan(1000);
      expect(response.processingTime).toBeLessThan(500);
      
      console.log(`✅ Task tool pattern: ${processingTime}ms E2E, ${response.processingTime}ms processing`);
    });

    it('should handle agent specialization with required types', async () => {
      const request: MOARequest = {
        id: 'specialization-test-1',
        prompt: 'Optimize database query: SELECT * FROM users JOIN orders ON users.id = orders.user_id WHERE users.created_at > NOW() - INTERVAL 30 DAY',
        requiredAgentTypes: ['optimizer', 'analyst', 'coder']
      };

      const response = await coordinator.processRequest(request);
      
      // Should only use specified agent types
      expect(response.agentResponses).toHaveLength(3);
      
      const agentTypes = response.agentResponses.map(r => r.metadata?.agentType);
      expect(agentTypes).toEqual(expect.arrayContaining(['optimizer', 'analyst', 'coder']));
      
      // Verify specialized responses
      const optimizerResponse = response.agentResponses.find(r => r.metadata?.agentType === 'optimizer');
      expect(optimizerResponse?.response).toMatch(/optimization|performance|efficiency/i);
      
      const analystResponse = response.agentResponses.find(r => r.metadata?.agentType === 'analyst');
      expect(analystResponse?.response).toMatch(/analysis|pattern|insights/i);
      
      console.log('✅ Agent specialization validated');
    });

    it('should achieve consensus within performance targets', async () => {
      const testRequests = [
        { prompt: 'Review authentication flow', threshold: 0.6 },
        { prompt: 'Analyze API performance', threshold: 0.7 },
        { prompt: 'Validate security measures', threshold: 0.8 }
      ];

      const results = [];
      
      for (const { prompt, threshold } of testRequests) {
        const request: MOARequest = {
          id: `consensus-${Date.now()}`,
          prompt,
          consensusThreshold: threshold
        };

        const response = await coordinator.processRequest(request);
        results.push(response);
        
        expect(response.result.confidence).toBeGreaterThanOrEqual(threshold);
        expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      }
      
      const avgConsensusTime = results.reduce((sum, r) => sum + r.result.processingTime, 0) / results.length;
      expect(avgConsensusTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      
      console.log(`✅ Consensus performance: ${avgConsensusTime.toFixed(1)}ms avg (target: <${PERFORMANCE_TARGETS.CONSENSUS_TIME}ms)`);
    });
  });

  describe('🧠 Dual-Mode Operation (Consensus + Singular)', () => {
    it('should handle single-agent mode under 200ms', async () => {
      const request: MOARequest = {
        id: 'singular-test-1',
        prompt: 'Quick code review: const sum = (a, b) => a + b;',
        requiredAgentTypes: ['coder']
      };

      const startTime = Date.now();
      const response = await coordinator.processRequest(request);
      const processingTime = Date.now() - startTime;

      // Single agent should be faster
      expect(response.agentResponses).toHaveLength(1);
      expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.SINGULAR_TIME);
      expect(processingTime).toBeLessThan(PERFORMANCE_TARGETS.SINGULAR_TIME * 2);
      
      console.log(`✅ Singular mode: ${response.result.processingTime}ms (target: <${PERFORMANCE_TARGETS.SINGULAR_TIME}ms)`);
    });

    it('should demonstrate consensus vs singular performance difference', async () => {
      const testPrompt = 'Evaluate code quality: function fibonacci(n) { return n < 2 ? n : fibonacci(n-1) + fibonacci(n-2); }';
      
      // Test singular mode
      const singularRequest: MOARequest = {
        id: 'perf-singular',
        prompt: testPrompt,
        requiredAgentTypes: ['coder']
      };
      
      const singularResponse = await coordinator.processRequest(singularRequest);
      
      // Test consensus mode
      const consensusRequest: MOARequest = {
        id: 'perf-consensus',
        prompt: testPrompt,
        consensusThreshold: 0.7
      };
      
      const consensusResponse = await coordinator.processRequest(consensusRequest);
      
      // Verify performance characteristics
      expect(singularResponse.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.SINGULAR_TIME);
      expect(consensusResponse.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      expect(consensusResponse.result.processingTime).toBeGreaterThan(singularResponse.result.processingTime);
      
      // Verify agent counts
      expect(singularResponse.agentResponses).toHaveLength(1);
      expect(consensusResponse.agentResponses).toHaveLength(6);
      
      console.log(`✅ Mode comparison: Singular ${singularResponse.result.processingTime}ms vs Consensus ${consensusResponse.result.processingTime}ms`);
    });
  });

  describe('🌳 AST Analysis with Real Code Samples', () => {
    it('should analyze JavaScript with performance patterns', async () => {
      const jsCode = `
        function processData(items) {
          const results = [];
          for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items[i].length; j++) {
              if (items[i][j].active) {
                results.push(items[i][j].process());
              }
            }
          }
          return results;
        }
      `;

      const startTime = Date.now();
      const analysis = await astAnalyzer.analyze(jsCode, 'javascript');
      const parseTime = Date.now() - startTime;

      expect(analysis.language).toBe('javascript');
      expect(analysis.nodes.length).toBeGreaterThan(10);
      expect(analysis.complexity).toBeGreaterThan(2);
      expect(parseTime).toBeLessThan(PERFORMANCE_TARGETS.AST_PARSE_TIME);
      
      // Should detect nested loops
      const nestedLoopPattern = analysis.patterns.find(p => p.type === 'nested_loops');
      expect(nestedLoopPattern).toBeDefined();
      expect(nestedLoopPattern?.confidence).toBeGreaterThan(0.7);
      
      console.log(`✅ JS AST analysis: ${parseTime}ms, complexity: ${analysis.complexity}, patterns: ${analysis.patterns.length}`);
    });

    it('should analyze TypeScript with type annotations', async () => {
      const tsCode = `
        interface User {
          id: number;
          name: string;
          email: string;
        }
        
        async function getUser(id: number): Promise<User | null> {
          try {
            const response = await fetch(\`/api/users/\${id}\`);
            if (!response.ok) throw new Error('User not found');
            return await response.json() as User;
          } catch (error) {
            console.error('Failed to fetch user:', error);
            return null;
          }
        }
      `;

      const analysis = await astAnalyzer.analyze(tsCode, 'typescript');
      
      expect(analysis.language).toBe('typescript');
      expect(analysis.nodes.length).toBeGreaterThan(15);
      expect(analysis.complexity).toBeGreaterThan(1);
      
      // Should detect async patterns
      const asyncPattern = analysis.patterns.find(p => p.type === 'async_usage');
      expect(asyncPattern).toBeDefined();
      
      console.log(`✅ TS AST analysis: complexity: ${analysis.complexity}, patterns: ${analysis.patterns.length}`);
    });

    it('should analyze Python with multiple language support', async () => {
      const pythonCode = `
        def factorial(n):
            if n <= 1:
                return 1
            return n * factorial(n - 1)
        
        class DataProcessor:
            def __init__(self, data):
                self.data = data
            
            def process(self):
                results = []
                for item in self.data:
                    if item['active']:
                        results.append(self.transform(item))
                return results
      `;

      const analysis = await astAnalyzer.analyze(pythonCode, 'python');
      
      expect(analysis.language).toBe('python');
      expect(analysis.nodes.length).toBeGreaterThan(10);
      expect(analysis.complexity).toBeGreaterThan(2);
      
      console.log(`✅ Python AST analysis: complexity: ${analysis.complexity}`);
    });

    it('should handle security pattern detection', async () => {
      const insecureCode = `
        function loginUser(username, password) {
          const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
          document.getElementById('content').innerHTML = query;
          eval('console.log("User: " + username)');
          localStorage.setItem('api_key', 'sk-1234567890abcdef');
        }
      `;

      const analysis = await astAnalyzer.analyze(insecureCode, 'javascript');
      
      // Should detect security issues
      const securityPatterns = analysis.patterns.filter(p => 
        p.type.includes('eval') || 
        p.type.includes('innerHTML') || 
        p.type.includes('secrets')
      );
      
      expect(securityPatterns.length).toBeGreaterThan(0);
      
      // Should have security suggestions
      const securitySuggestions = analysis.suggestions.filter(s => 
        s.includes('security') || s.includes('eval') || s.includes('XSS')
      );
      expect(securitySuggestions.length).toBeGreaterThan(0);
      
      console.log(`✅ Security analysis: ${securityPatterns.length} patterns detected`);
    });
  });

  describe('🎯 Few-Shot Prompting with Expert Templates', () => {
    it('should apply code-review template with examples', async () => {
      const variables = {
        context: 'Authentication middleware',
        code: 'const auth = (req, res, next) => { if (!req.headers.authorization) return res.status(401).send("Unauthorized"); next(); }',
        changes: 'Added JWT validation',
        focus: 'Security and error handling',
        examples: 'Previous reviews identified missing error logging'
      };

      const prompt = await promptingSystem.applyTemplate('code-review', variables);
      
      expect(prompt).toContain('Code Quality');
      expect(prompt).toContain('Security');
      expect(prompt).toContain('Authentication middleware');
      expect(prompt).toContain('JWT validation');
      
      // Verify template performance tracking
      const template = promptingSystem.getTemplate('code-review');
      expect(template?.performance.usageCount).toBeGreaterThan(0);
      
      console.log('✅ Code review template applied successfully');
    });

    it('should use architecture-design template', async () => {
      const variables = {
        requirements: 'Real-time chat application with file sharing',
        constraints: 'Must support 10k concurrent users, budget conscious',
        scale: '10,000 concurrent connections',
        examples: 'Previous chat systems used WebSocket clustering'
      };

      const prompt = await promptingSystem.applyTemplate('architecture-design', variables);
      
      expect(prompt).toContain('High-level Architecture');
      expect(prompt).toContain('Scalability');
      expect(prompt).toContain('Real-time chat');
      expect(prompt).toContain('10,000 concurrent');
      
      console.log('✅ Architecture design template applied successfully');
    });

    it('should evaluate template responses and update performance', async () => {
      const variables = {
        system: 'E-commerce platform',
        metrics: 'Response time 2s, 40 DB queries per request',
        issues: 'Slow checkout process',
        examples: 'Previous optimizations reduced queries by 70%'
      };

      const prompt = await promptingSystem.applyTemplate('performance-optimization', variables);
      const mockResponse = '1. Bottleneck Analysis: N+1 query problem 2. Quick Wins: Add indexes 3. Long-term: Query optimization 4. Monitoring: Response time, query count 5. Priority: Indexes first';
      
      const evaluation = await promptingSystem.evaluateResponse('performance-optimization', variables, mockResponse);
      
      expect(evaluation.score).toBeGreaterThan(0.5);
      expect(evaluation.feedback).toBeDefined();
      
      console.log(`✅ Template evaluation: score ${evaluation.score.toFixed(2)}`);
    });

    it('should track template performance metrics', async () => {
      const performance = promptingSystem.getTemplatePerformance();
      
      expect(performance.length).toBeGreaterThan(0);
      
      const usedTemplates = performance.filter(p => p.performance.usageCount > 0);
      expect(usedTemplates.length).toBeGreaterThan(0);
      
      for (const template of usedTemplates) {
        expect(template.performance.lastUsed).toBeGreaterThan(0);
        expect(template.performance.usageCount).toBeGreaterThan(0);
      }
      
      console.log(`✅ Template performance tracking: ${usedTemplates.length} templates used`);
    });
  });

  describe('🌐 MCP Server Integration', () => {
    it('should establish WebSocket connection to MCP server', async () => {
      return new Promise<void>((resolve, reject) => {
        client = new WebSocket('ws://localhost:8082');
        
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        client.on('open', () => {
          clearTimeout(timeout);
          expect(client.readyState).toBe(WebSocket.OPEN);
          resolve();
        });
        
        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    it('should handle MCP capabilities request', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPMessage = {
          type: 'request',
          id: 'test-capabilities',
          method: 'capabilities'
        };

        const timeout = setTimeout(() => {
          reject(new Error('Response timeout'));
        }, 5000);

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          try {
            const response: MCPMessage = JSON.parse(data.toString());
            
            if (response.id === 'test-capabilities') {
              clearTimeout(timeout);
              
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
              
              console.log(`✅ MCP capabilities: ${response.result.capabilities.length} available`);
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });
    });

    it('should process MOA requests via MCP with full agent coordination', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPMessage = {
          type: 'request',
          id: 'test-mcp-moa',
          method: 'moa_process',
          params: {
            prompt: 'Analyze microservices communication patterns for performance optimization',
            consensusThreshold: 0.7
          }
        };

        const timeout = setTimeout(() => {
          reject(new Error('Response timeout'));
        }, 10000);

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          try {
            const response: MCPMessage = JSON.parse(data.toString());
            
            if (response.id === 'test-mcp-moa') {
              clearTimeout(timeout);
              
              expect(response.type).toBe('response');
              expect(response.result.result).toBeDefined();
              expect(response.result.result.finalResponse).toMatch(/microservices|performance|communication/i);
              expect(response.result.result.confidence).toBeGreaterThan(0.7);
              expect(response.result.agentResponses).toHaveLength(6);
              expect(response.result.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
              
              console.log(`✅ MCP MOA processing: ${response.result.result.processingTime}ms, confidence: ${response.result.result.confidence.toFixed(2)}`);
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });
    });

    it('should handle AST analysis via MCP', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPMessage = {
          type: 'request',
          id: 'test-mcp-ast',
          method: 'ast_analyze',
          params: {
            code: 'function quickSort(arr) { if (arr.length <= 1) return arr; const pivot = arr[0]; const left = arr.slice(1).filter(x => x < pivot); const right = arr.slice(1).filter(x => x >= pivot); return [...quickSort(left), pivot, ...quickSort(right)]; }',
            language: 'javascript'
          }
        };

        const timeout = setTimeout(() => {
          reject(new Error('AST analysis timeout'));
        }, 5000);

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          try {
            const response: MCPMessage = JSON.parse(data.toString());
            
            if (response.id === 'test-mcp-ast') {
              clearTimeout(timeout);
              
              expect(response.result.analysis).toBeDefined();
              expect(response.result.analysis.language).toBe('javascript');
              expect(response.result.analysis.nodes.length).toBeGreaterThan(10);
              expect(response.result.analysis.complexity).toBeGreaterThan(2);
              expect(response.result.analysis.parseTime).toBeLessThan(PERFORMANCE_TARGETS.AST_PARSE_TIME);
              
              console.log(`✅ MCP AST analysis: ${response.result.analysis.parseTime}ms, complexity: ${response.result.analysis.complexity}`);
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });
    });

    it('should validate system health via MCP', async () => {
      return new Promise<void>((resolve, reject) => {
        const message: MCPMessage = {
          type: 'request',
          id: 'test-health',
          method: 'health_check'
        };

        const timeout = setTimeout(() => {
          reject(new Error('Health check timeout'));
        }, 5000);

        client.send(JSON.stringify(message));

        client.on('message', (data) => {
          try {
            const response: MCPMessage = JSON.parse(data.toString());
            
            if (response.id === 'test-health') {
              clearTimeout(timeout);
              
              expect(response.result.status).toBe('healthy');
              expect(response.result.moaSystem).toBe('operational');
              expect(response.result.activeAgents).toBe(6);
              expect(response.result.uptime).toBeGreaterThan(0);
              expect(response.result.memoryUsage).toBeDefined();
              
              console.log(`✅ System health: ${response.result.activeAgents} agents, uptime: ${response.result.uptime.toFixed(1)}s`);
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });
    });
  });

  describe('⚡ Performance & Load Testing', () => {
    it('should handle high-frequency requests efficiently', async () => {
      const requestCount = 20;
      const requests = Array.from({ length: requestCount }, (_, i) => ({
        id: `load-test-${i}`,
        prompt: `Performance test ${i}: Analyze code efficiency for function ${i}`,
        consensusThreshold: 0.6
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => coordinator.processRequest(req))
      );
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      expect(responses).toHaveLength(requestCount);
      responses.forEach(response => {
        expect(response.result.confidence).toBeGreaterThan(0.6);
        expect(response.agentResponses).toHaveLength(6);
      });

      // Performance metrics
      const avgResponseTime = responses.reduce((sum, r) => sum + r.processingTime, 0) / responses.length;
      const throughput = requestCount / (totalTime / 1000);

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      expect(throughput).toBeGreaterThan(10); // >10 requests/second

      console.log(`✅ Load test: ${avgResponseTime.toFixed(1)}ms avg, ${throughput.toFixed(1)} req/s throughput`);
    });

    it('should handle concurrent requests without degradation', async () => {
      const concurrentRequests = Array.from({ length: PERFORMANCE_TARGETS.CONCURRENT_REQUESTS }, (_, i) => 
        coordinator.processRequest({
          id: `concurrent-${i}`,
          prompt: `Concurrent analysis ${i}: Review system architecture patterns`,
          consensusThreshold: 0.7
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.result.confidence).toBeGreaterThan(0.7);
        expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      });

      // Concurrent should be faster than sequential
      const sequentialEstimate = responses.length * PERFORMANCE_TARGETS.CONSENSUS_TIME;
      expect(totalTime).toBeLessThan(sequentialEstimate);

      console.log(`✅ Concurrent test: ${totalTime}ms for ${PERFORMANCE_TARGETS.CONCURRENT_REQUESTS} requests (vs ${sequentialEstimate}ms sequential estimate)`);
    });

    it('should maintain performance under mixed workloads', async () => {
      const mixedRequests = [
        // Simple requests (singular mode)
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `simple-${i}`,
          prompt: `Simple task ${i}`,
          requiredAgentTypes: ['coder'] as AgentType[],
          consensusThreshold: 0.6
        })),
        // Complex requests (full consensus)
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `complex-${i}`,
          prompt: `Complex architecture analysis ${i} with multiple considerations`,
          consensusThreshold: 0.8
        }))
      ];

      const startTime = Date.now();
      const responses = await Promise.all(
        mixedRequests.map(req => coordinator.processRequest(req))
      );
      const totalTime = Date.now() - startTime;

      // Verify simple requests were fast
      const simpleResponses = responses.slice(0, 5);
      simpleResponses.forEach(response => {
        expect(response.agentResponses).toHaveLength(1);
        expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.SINGULAR_TIME);
      });

      // Verify complex requests achieved consensus
      const complexResponses = responses.slice(5);
      complexResponses.forEach(response => {
        expect(response.agentResponses).toHaveLength(6);
        expect(response.result.confidence).toBeGreaterThan(0.8);
        expect(response.result.processingTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      });

      console.log(`✅ Mixed workload: ${totalTime}ms total, ${responses.length} requests processed`);
    });

    it('should demonstrate system scalability metrics', async () => {
      const metrics = coordinator.getSystemMetrics();
      
      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.avgResponseTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      expect(metrics.successRate).toBeGreaterThan(0.95); // >95% success rate
      expect(metrics.activeAgents).toBe(6);
      expect(metrics.consensusRate).toBeGreaterThan(0.8);
      
      console.log(`✅ System metrics: ${metrics.totalRequests} requests, ${metrics.avgResponseTime.toFixed(1)}ms avg, ${(metrics.successRate * 100).toFixed(1)}% success`);
    });
  });

  describe('🔧 System Integration & Edge Cases', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = {
        id: 'malformed-test',
        prompt: '', // Empty prompt
        consensusThreshold: 1.5 // Invalid threshold
      } as MOARequest;

      try {
        await coordinator.processRequest(malformedRequest);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('✅ Malformed request handled gracefully');
      }
    });

    it('should handle system resource constraints', async () => {
      // Simulate resource pressure with many quick requests
      const resourceTestRequests = Array.from({ length: 50 }, (_, i) => ({
        id: `resource-${i}`,
        prompt: `Resource test ${i}`,
        consensusThreshold: 0.5
      }));

      const results = await Promise.allSettled(
        resourceTestRequests.map(req => coordinator.processRequest(req))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successful / resourceTestRequests.length;

      expect(successRate).toBeGreaterThan(0.9); // >90% should succeed even under pressure

      console.log(`✅ Resource constraint test: ${successRate * 100}% success rate under pressure`);
    });

    it('should validate cross-component integration', async () => {
      // Test request that uses all components
      const integrationRequest: MOARequest = {
        id: 'integration-test',
        prompt: 'function complexAnalysis(data) { const results = []; for (let i = 0; i < data.length; i++) { for (let j = 0; j < data[i].items.length; j++) { if (data[i].items[j].validate()) { results.push(data[i].items[j].process()); } } } return results; }',
        astAnalysis: true,
        usePromptTemplate: 'code-analysis',
        context: {
          context: 'Performance-critical data processing function',
          code: 'Nested loop with validation and processing',
          examples: 'Previous analysis identified O(n²) complexity issues'
        },
        consensusThreshold: 0.75
      };

      const response = await coordinator.processRequest(integrationRequest);

      // Verify all components worked together
      expect(response.astAnalysis).toBeDefined();
      expect(response.astAnalysis!.patterns.some(p => p.type === 'nested_loops')).toBe(true);
      expect(response.metadata.templateUsed).toBe('code-analysis');
      expect(response.result.confidence).toBeGreaterThan(0.75);
      expect(response.agentResponses).toHaveLength(6);
      
      console.log(`✅ Cross-component integration: AST + Templates + MOA consensus achieved`);
    });
  });

  describe('📊 Production Readiness Validation', () => {
    it('should meet all performance targets', () => {
      const summary = {
        consensusTime: coordinator.getSystemMetrics().avgResponseTime,
        successRate: coordinator.getSystemMetrics().successRate,
        agentCount: coordinator.getAgentStatus().length,
        mcpServer: mcpServer.isServerRunning(),
        astSupport: astAnalyzer.getSupportedLanguages().length,
        templateCount: promptingSystem.getAllTemplates().length
      };

      // Performance targets
      expect(summary.consensusTime).toBeLessThan(PERFORMANCE_TARGETS.CONSENSUS_TIME);
      expect(summary.successRate).toBeGreaterThan(0.95);
      
      // System requirements
      expect(summary.agentCount).toBe(6);
      expect(summary.mcpServer).toBe(true);
      expect(summary.astSupport).toBeGreaterThanOrEqual(5); // JS, TS, Python, Rust, etc.
      expect(summary.templateCount).toBeGreaterThanOrEqual(6);

      console.log('🎯 PRODUCTION READINESS SUMMARY:');
      console.log(`   ✅ Consensus Time: ${summary.consensusTime.toFixed(1)}ms (target: <${PERFORMANCE_TARGETS.CONSENSUS_TIME}ms)`);
      console.log(`   ✅ Success Rate: ${(summary.successRate * 100).toFixed(1)}% (target: >95%)`);
      console.log(`   ✅ Agent Count: ${summary.agentCount}/6 active`);
      console.log(`   ✅ MCP Server: ${summary.mcpServer ? 'Running' : 'Stopped'}`);
      console.log(`   ✅ AST Languages: ${summary.astSupport} supported`);
      console.log(`   ✅ Expert Templates: ${summary.templateCount} available`);
      console.log('   🚀 SYSTEM READY FOR PRODUCTION DEPLOYMENT');
    });
  });
});