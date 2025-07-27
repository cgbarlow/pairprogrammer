// F1 MOA System - Few-Shot Prompting System with Expert Templates

import type { PromptTemplate, PromptExample, TemplatePerformance } from '../types/index.js';

export class PromptingSystem {
  private templates: Map<string, PromptTemplate> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎯 Initializing Few-Shot Prompting System...');
    
    // Load expert templates
    await this.loadExpertTemplates();
    
    this.isInitialized = true;
    console.log(`🎯 Prompting System initialized with ${this.templates.size} templates`);
  }

  private async loadExpertTemplates(): Promise<void> {
    const expertTemplates: PromptTemplate[] = [
      {
        id: 'code-analysis',
        name: 'Code Analysis Expert',
        category: 'development',
        template: `You are a senior software engineer analyzing code for quality, performance, and maintainability.

Context: {{context}}
Code to analyze: {{code}}

Provide analysis in this format:
1. Code Quality: Rate 1-10 and explain
2. Performance Issues: List specific concerns
3. Security Risks: Identify vulnerabilities
4. Maintainability: Suggest improvements
5. Best Practices: Recommendations

Examples:
{{examples}}

Analysis:`,
        variables: ['context', 'code', 'examples'],
        examples: [
          {
            input: { 
              context: 'REST API endpoint',
              code: 'app.get("/users", (req, res) => { const users = db.query("SELECT * FROM users"); res.json(users); });',
              examples: 'Previous analysis showed SQL injection risks'
            },
            expectedOutput: '1. Code Quality: 3/10 - Missing error handling, SQL injection vulnerability\n2. Performance Issues: No pagination, synchronous DB call\n3. Security Risks: SQL injection vulnerability\n4. Maintainability: Add error handling, use prepared statements\n5. Best Practices: Use async/await, add input validation'
          }
        ],
        performance: {
          successRate: 0.92,
          avgResponseTime: 150,
          usageCount: 0,
          lastUsed: 0
        }
      },
      {
        id: 'architecture-design',
        name: 'System Architecture Expert',
        category: 'design',
        template: `You are a system architect designing scalable, maintainable software systems.

Requirements: {{requirements}}
Constraints: {{constraints}}
Scale: {{scale}}

Design a system architecture covering:
1. High-level Architecture: Components and relationships
2. Data Flow: How information moves through the system
3. Technology Stack: Recommended technologies and why
4. Scalability: How the system handles growth
5. Security: Security considerations and measures

Examples:
{{examples}}

Architecture Design:`,
        variables: ['requirements', 'constraints', 'scale', 'examples'],
        examples: [
          {
            input: {
              requirements: 'Real-time chat application',
              constraints: 'Budget-conscious, 6-month timeline',
              scale: '10,000 concurrent users',
              examples: 'Previous designs used microservices for chat systems'
            },
            expectedOutput: '1. High-level Architecture: API Gateway + Chat Service + User Service + WebSocket Server\n2. Data Flow: Client -> Gateway -> Chat Service -> WebSocket broadcasts\n3. Technology Stack: Node.js, Socket.io, Redis, PostgreSQL\n4. Scalability: Horizontal scaling with load balancers, Redis clustering\n5. Security: JWT authentication, rate limiting, message encryption'
          }
        ],
        performance: {
          successRate: 0.88,
          avgResponseTime: 200,
          usageCount: 0,
          lastUsed: 0
        }
      },
      {
        id: 'performance-optimization',
        name: 'Performance Optimization Expert',
        category: 'optimization',
        template: `You are a performance optimization specialist identifying bottlenecks and improvement opportunities.

System Description: {{system}}
Performance Metrics: {{metrics}}
Issues Observed: {{issues}}

Provide optimization recommendations:
1. Bottleneck Analysis: Identify primary performance constraints
2. Quick Wins: Immediate improvements with high impact
3. Long-term Optimizations: Strategic performance improvements
4. Monitoring: Key metrics to track
5. Implementation Priority: Order of implementation

Examples:
{{examples}}

Optimization Plan:`,
        variables: ['system', 'metrics', 'issues', 'examples'],
        examples: [
          {
            input: {
              system: 'E-commerce web application',
              metrics: 'Response time: 3s, Database queries: 50+ per request',
              issues: 'Slow page loads, high database load',
              examples: 'Previous optimizations reduced queries by 80%'
            },
            expectedOutput: '1. Bottleneck Analysis: N+1 query problem, missing database indexes\n2. Quick Wins: Add database indexes, implement query caching\n3. Long-term Optimizations: Database query optimization, CDN implementation\n4. Monitoring: Response time, query count, cache hit rate\n5. Implementation Priority: Indexes first, then caching, then CDN'
          }
        ],
        performance: {
          successRate: 0.95,
          avgResponseTime: 180,
          usageCount: 0,
          lastUsed: 0
        }
      },
      {
        id: 'security-audit',
        name: 'Security Audit Expert',
        category: 'security',
        template: `You are a cybersecurity expert conducting a comprehensive security audit.

Application Type: {{appType}}
Technologies Used: {{technologies}}
Risk Level: {{riskLevel}}

Conduct security audit covering:
1. Authentication & Authorization: Access control mechanisms
2. Data Protection: Encryption and data handling
3. Input Validation: Protection against injection attacks
4. Infrastructure Security: Server and network security
5. Compliance: Regulatory requirements and standards

Examples:
{{examples}}

Security Audit Report:`,
        variables: ['appType', 'technologies', 'riskLevel', 'examples'],
        examples: [
          {
            input: {
              appType: 'Financial trading platform',
              technologies: 'React, Node.js, PostgreSQL, AWS',
              riskLevel: 'High - handles financial data',
              examples: 'Previous audits found JWT token exposure'
            },
            expectedOutput: '1. Authentication & Authorization: Implement MFA, use short-lived tokens\n2. Data Protection: Encrypt sensitive data at rest and in transit\n3. Input Validation: Sanitize all inputs, use parameterized queries\n4. Infrastructure Security: WAF, DDoS protection, regular security updates\n5. Compliance: PCI DSS compliance required, audit logging'
          }
        ],
        performance: {
          successRate: 0.91,
          avgResponseTime: 220,
          usageCount: 0,
          lastUsed: 0
        }
      },
      {
        id: 'testing-strategy',
        name: 'Testing Strategy Expert',
        category: 'quality',
        template: `You are a QA engineer designing comprehensive testing strategies.

Application: {{application}}
Testing Goals: {{goals}}
Timeline: {{timeline}}

Design testing strategy including:
1. Test Pyramid: Unit, integration, and E2E test distribution
2. Test Cases: Critical scenarios to cover
3. Automation Strategy: What to automate and tools to use
4. Performance Testing: Load and stress testing approach
5. Quality Gates: Criteria for release readiness

Examples:
{{examples}}

Testing Strategy:`,
        variables: ['application', 'goals', 'timeline', 'examples'],
        examples: [
          {
            input: {
              application: 'Mobile banking app',
              goals: 'Ensure security and reliability',
              timeline: '3-month development cycle',
              examples: 'Previous banking apps required 90% test coverage'
            },
            expectedOutput: '1. Test Pyramid: 70% unit tests, 20% integration, 10% E2E\n2. Test Cases: Authentication flows, transaction processing, error handling\n3. Automation Strategy: Automated CI/CD pipeline with Jest, Cypress\n4. Performance Testing: Load testing with 10k concurrent users\n5. Quality Gates: 90% coverage, all critical tests pass, security scan clean'
          }
        ],
        performance: {
          successRate: 0.89,
          avgResponseTime: 190,
          usageCount: 0,
          lastUsed: 0
        }
      },
      {
        id: 'code-review',
        name: 'Code Review Expert',
        category: 'development',
        template: `You are a senior developer conducting a thorough code review.

Code Context: {{context}}
Code Changes: {{changes}}
Review Focus: {{focus}}

Provide detailed code review covering:
1. Code Quality: Readability, maintainability, conventions
2. Logic Issues: Bugs, edge cases, error handling
3. Performance: Efficiency concerns and optimizations
4. Security: Potential vulnerabilities
5. Suggestions: Specific improvements with examples

Examples:
{{examples}}

Code Review:`,
        variables: ['context', 'changes', 'focus', 'examples'],
        examples: [
          {
            input: {
              context: 'User authentication module',
              changes: 'Added password hashing and JWT token generation',
              focus: 'Security and error handling',
              examples: 'Previous reviews caught weak password policies'
            },
            expectedOutput: '1. Code Quality: Good separation of concerns, clear naming\n2. Logic Issues: Missing error handling for database failures\n3. Performance: Consider caching JWT tokens for better performance\n4. Security: Use stronger password hashing algorithm (bcrypt with higher rounds)\n5. Suggestions: Add input validation, implement rate limiting'
          }
        ],
        performance: {
          successRate: 0.94,
          avgResponseTime: 160,
          usageCount: 0,
          lastUsed: 0
        }
      }
    ];

    // Add templates to the map
    for (const template of expertTemplates) {
      this.templates.set(template.id, template);
      console.log(`📝 Loaded template: ${template.name}`);
    }
  }

  async applyTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    console.log(`🎯 Applying template: ${template.name}`);
    
    // Validate required variables
    for (const variable of template.variables) {
      if (!(variable in variables)) {
        throw new Error(`Missing required variable: ${variable}`);
      }
    }

    // Replace variables in template
    let prompt = template.template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Add examples if not provided
    if (!variables.examples && template.examples.length > 0) {
      const examplesText = template.examples
        .slice(0, 2) // Use first 2 examples
        .map(example => `Input: ${JSON.stringify(example.input)}\nOutput: ${example.expectedOutput}`)
        .join('\n\n');
      prompt = prompt.replace('{{examples}}', examplesText);
    }

    // Update usage metrics
    template.performance.usageCount++;
    template.performance.lastUsed = Date.now();

    return prompt;
  }

  async evaluateResponse(
    templateId: string, 
    variables: Record<string, string>, 
    actualOutput: string
  ): Promise<{ score: number; feedback: string }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Find matching example for evaluation
    const matchingExample = template.examples.find(example => {
      return Object.keys(example.input).every(key => 
        variables[key] && variables[key].includes(example.input[key])
      );
    });

    if (!matchingExample) {
      return {
        score: 0.5,
        feedback: 'No matching example found for evaluation'
      };
    }

    // Simple similarity scoring (in production, use more sophisticated methods)
    const score = this.calculateSimilarity(actualOutput, matchingExample.expectedOutput);
    
    // Update template performance
    const success = score > 0.7;
    template.performance.successRate = 
      (template.performance.successRate + (success ? 1 : 0)) / 2;

    // Update example with actual result
    matchingExample.actualOutput = actualOutput;
    matchingExample.success = success;

    return {
      score,
      feedback: success 
        ? 'Response meets expected quality standards'
        : 'Response could be improved - check format and completeness'
    };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    );
  }

  async addCustomTemplate(template: Omit<PromptTemplate, 'performance'>): Promise<void> {
    const fullTemplate: PromptTemplate = {
      ...template,
      performance: {
        successRate: 0,
        avgResponseTime: 0,
        usageCount: 0,
        lastUsed: 0
      }
    };

    this.templates.set(template.id, fullTemplate);
    console.log(`📝 Added custom template: ${template.name}`);
  }

  getTemplatePerformance(): Array<{ templateId: string; performance: TemplatePerformance }> {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      templateId: id,
      performance: template.performance
    }));
  }

  async optimizeTemplate(templateId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Analyze successful examples to optimize template
    const successfulExamples = template.examples.filter(example => example.success);
    
    if (successfulExamples.length > 0) {
      console.log(`🔧 Optimizing template ${template.name} based on ${successfulExamples.length} successful examples`);
      
      // In production, this would use ML to optimize the template
      // For now, we just update the performance metrics
      template.performance.successRate = Math.min(template.performance.successRate + 0.1, 1.0);
    }
  }
}