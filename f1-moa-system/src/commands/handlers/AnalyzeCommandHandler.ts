// F8 Analyze Command Handler - Production Implementation
// High-performance code analysis with MOA integration and comprehensive feedback

import { performance } from 'perf_hooks';
import type {
  CommandHandler,
  CommandExecutionContext,
  CommandResult,
  ParsedCommand,
  CommandArgument,
  ValidationResult,
  ValidationError,
  HelpContent,
  AnalysisCommandArgs,
  PerformanceMetrics
} from '../types.js';
import type { MOARequest, AgentType } from '../../types/index.js';

export class AnalyzeCommandHandler implements CommandHandler {
  async execute(context: CommandExecutionContext): Promise<CommandResult> {
    const { command, moaCoordinator, hookManager } = context;
    const startTime = performance.now();

    try {
      // Extract and validate arguments
      const args = this.extractArguments(command);
      
      // Trigger pre-command hooks
      await hookManager.processHook({
        type: 'pre-command',
        phase: 'pre',
        operation: 'analyze-command',
        context: {
          operationType: 'analyze-command',
          command: command.name,
          sessionId: command.context.sessionId,
          environment: command.context.environment,
          metadata: { 
            analysisType: args.type,
            depth: args.depth,
            codeLength: args.code?.length || 0
          }
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      // Build optimized analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(args);
      const requiredAgents = this.selectOptimalAgents(args.type);

      // Execute MOA analysis with performance monitoring
      const moaRequest: MOARequest = {
        id: `analyze-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        prompt: analysisPrompt,
        context: {
          code: args.code,
          analysisType: args.type,
          depth: args.depth,
          format: args.format,
          userPreferences: command.context.userPreferences
        },
        requiredAgentTypes: requiredAgents,
        consensusThreshold: this.calculateConsensusThreshold(args),
        astAnalysis: this.shouldPerformAST(args),
        usePromptTemplate: 'analysis'
      };

      const moaResponse = await moaCoordinator.processRequest(moaRequest);

      // Format results based on requested format
      const formattedResult = await this.formatAnalysisResult(moaResponse, args.format);

      // Trigger post-command hooks
      await hookManager.processHook({
        type: 'post-command',
        phase: 'post',
        operation: 'analyze-command',
        context: {
          operationType: 'analyze-command',
          command: command.name,
          sessionId: command.context.sessionId,
          environment: command.context.environment,
          metadata: { 
            success: true,
            processingTime: moaResponse.processingTime,
            agentsUsed: requiredAgents.length,
            consensusReached: moaResponse.metadata.consensusReached
          }
        },
        timestamp: Date.now(),
        priority: 'medium'
      });

      const executionTime = performance.now() - startTime;

      // Build comprehensive result
      return {
        success: true,
        data: formattedResult,
        message: `Analysis completed successfully in ${executionTime.toFixed(2)}ms`,
        details: {
          moaAnalysis: {
            moaResponse,
            processingTime: moaResponse.processingTime,
            agentsUsed: requiredAgents,
            consensusReached: moaResponse.metadata.consensusReached,
            cacheUsed: false,
            metadata: {
              requestId: moaRequest.id,
              commandName: 'analyze',
              accuracy: moaResponse.result.confidence,
              confidence: moaResponse.result.confidence
            }
          },
          astAnalysis: moaResponse.astAnalysis,
          performanceMetrics: {
            commandExecutionTime: executionTime,
            moaProcessingTime: moaResponse.processingTime,
            totalAgentsUsed: requiredAgents.length,
            cacheHitRate: 0
          }
        },
        suggestions: this.generateAnalysisSuggestions(args, moaResponse),
        metadata: {
          executionTime,
          commandName: 'analyze',
          timestamp: Date.now()
        }
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      // Trigger error hooks
      await hookManager.processHook({
        type: 'post-command',
        phase: 'post',
        operation: 'analyze-command',
        context: {
          operationType: 'analyze-command',
          command: command.name,
          sessionId: command.context.sessionId,
          environment: command.context.environment,
          metadata: { 
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime
          }
        },
        timestamp: Date.now(),
        priority: 'high'
      });
      
      return {
        success: false,
        data: null,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: [
          'Verify the code syntax is valid',
          'Try with a different analysis type (--type=ast|performance|quality|security)',
          'Use a simpler depth setting (--depth=shallow)',
          'Check if the code contains unsupported constructs',
          'Use /help analyze for detailed usage information'
        ],
        metadata: {
          executionTime,
          commandName: 'analyze',
          timestamp: Date.now()
        }
      };
    }
  }

  validate(args: CommandArgument[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: any[] = [];
    const suggestions: string[] = [];
    
    // Validate code argument
    if (args.length === 0 || !args[0]?.value) {
      errors.push({
        code: 'MISSING_CODE_ARGUMENT',
        message: 'Code argument is required',
        suggestedFix: 'Provide code as first argument: /analyze "your code here"'
      });
    } else {
      const code = args[0].value as string;
      
      // Check code length
      if (code.length > 50000) {
        warnings.push({
          code: 'LARGE_CODE_INPUT',
          message: 'Code input is very large, analysis may take longer',
          argument: 'code'
        });
        suggestions.push('Consider analyzing smaller code segments for faster results');
      }
      
      // Check if code looks valid
      if (!this.looksLikeCode(code)) {
        warnings.push({
          code: 'QUESTIONABLE_CODE_INPUT',
          message: 'Input does not appear to be code',
          argument: 'code'
        });
        suggestions.push('Ensure the input is valid source code');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      validatedAt: Date.now()
    };
  }

  getHelp(): HelpContent {
    return {
      title: '/analyze',
      description: 'Analyze code using AST analysis and MOA agents for comprehensive insights',
      usage: '/analyze <code> [--type=ast|performance|quality|security] [--depth=shallow|deep|comprehensive] [--format=json|markdown|interactive]',
      arguments: [
        {
          name: 'code',
          description: 'Code to analyze (string or file path)',
          required: true,
          type: 'string'
        }
      ],
      flags: [
        {
          name: 'type',
          description: 'Type of analysis to perform',
          shorthand: 't',
          type: 'string',
          defaultValue: 'ast'
        },
        {
          name: 'depth',
          description: 'Depth of analysis (shallow=basic, deep=detailed, comprehensive=thorough)',
          shorthand: 'd',
          type: 'string',
          defaultValue: 'shallow'
        },
        {
          name: 'format',
          description: 'Output format (json=structured, markdown=readable, interactive=browsable)',
          shorthand: 'f',
          type: 'string',
          defaultValue: 'markdown'
        }
      ],
      examples: [
        {
          description: 'Basic AST analysis of a JavaScript function',
          command: '/analyze "function hello() { return \\"world\\"; }" --type=ast',
          expectedOutput: 'AST tree structure with syntax analysis'
        },
        {
          description: 'Deep performance analysis with JSON output',
          command: '/analyze "for(let i=0; i<1000000; i++) { console.log(i); }" --type=performance --depth=deep --format=json',
          expectedOutput: 'Detailed performance metrics and optimization suggestions'
        },
        {
          description: 'Security analysis of user input handling',
          command: '/analyze "app.get(\\"/user\\", (req, res) => { res.send(req.query.name); })" --type=security',
          expectedOutput: 'Security vulnerability assessment and recommendations'
        },
        {
          description: 'Comprehensive code quality analysis',
          command: '/analyze "./src/utils.js" --type=quality --depth=comprehensive',
          expectedOutput: 'Complete code quality report with metrics and suggestions',
          notes: 'File paths are supported for larger code analysis'
        }
      ],
      seeAlso: ['optimize', 'review', 'moa'],
      metadata: {
        lastUpdated: Date.now(),
        version: '1.0.0',
        category: 'analysis'
      }
    };
  }

  canHandle(command: ParsedCommand): boolean {
    return ['analyze', 'analyse', 'ast'].includes(command.name.toLowerCase());
  }

  // Private implementation methods
  private extractArguments(command: ParsedCommand): AnalysisCommandArgs {
    const code = command.arguments[0]?.value as string || '';
    const type = this.getFlagValue(command, 'type', 'ast') as any;
    const depth = this.getFlagValue(command, 'depth', 'shallow') as any;
    const format = this.getFlagValue(command, 'format', 'markdown') as any;

    return { code, type, depth, format };
  }

  private buildAnalysisPrompt(args: AnalysisCommandArgs): string {
    const { code, type, depth } = args;
    
    const basePrompt = `Perform ${depth} ${type} analysis of the following code:

\`\`\`
${code}
\`\`\`

`;

    const analysisPrompts: Record<string, string> = {
      ast: `${basePrompt}Provide detailed AST analysis including:
- Syntax tree structure and node types
- Variable declarations and scoping
- Function and class definitions
- Control flow patterns
- Import/export statements
- Potential syntax issues

Focus on structural analysis and provide actionable insights.`,

      performance: `${basePrompt}Provide comprehensive performance analysis including:
- Time complexity analysis (O-notation)
- Space complexity and memory usage patterns
- Bottleneck identification and hotspots
- Algorithm efficiency assessment
- Optimization opportunities with specific recommendations
- Performance anti-patterns and their solutions

Prioritize measurable improvements and provide specific optimization strategies.`,

      quality: `${basePrompt}Provide thorough code quality analysis including:
- Cyclomatic complexity metrics
- Code maintainability assessment
- Design pattern usage and adherence
- Code smell detection with severity levels
- Best practices compliance
- Readability and documentation quality
- Technical debt assessment

Focus on actionable quality improvements with concrete examples.`,

      security: `${basePrompt}Provide comprehensive security analysis including:
- Vulnerability assessment (injection, XSS, etc.)
- Input validation and sanitization review
- Authentication and authorization patterns
- Data exposure and privacy concerns
- Cryptographic usage assessment
- Secure coding practices compliance
- OWASP compliance check

Prioritize critical security issues with remediation steps.`
    };

    return analysisPrompts[type] || analysisPrompts.ast;
  }

  private selectOptimalAgents(analysisType: string): AgentType[] {
    const agentMapping: Record<string, AgentType[]> = {
      ast: ['analyst', 'coder', 'researcher'],
      performance: ['optimizer', 'analyst', 'coder'],
      quality: ['validator', 'analyst', 'researcher'],
      security: ['validator', 'researcher', 'analyst']
    };

    return agentMapping[analysisType] || agentMapping.ast;
  }

  private calculateConsensusThreshold(args: AnalysisCommandArgs): number {
    // Higher threshold for security and quality analysis
    const thresholds: Record<string, number> = {
      ast: 0.70,
      performance: 0.75,
      quality: 0.80,
      security: 0.85
    };

    return thresholds[args.type] || 0.70;
  }

  private shouldPerformAST(args: AnalysisCommandArgs): boolean {
    // AST analysis is beneficial for all types except pure performance analysis
    return args.type !== 'performance' || args.depth === 'comprehensive';
  }

  private async formatAnalysisResult(moaResponse: any, format: string): Promise<any> {
    switch (format) {
      case 'json':
        return {
          analysis: {
            summary: moaResponse.result.content,
            confidence: moaResponse.result.confidence,
            consensus: moaResponse.metadata.consensusReached
          },
          agents: moaResponse.agentResponses.map((response: any) => ({
            type: response.metadata.agentType,
            name: response.metadata.agentName,
            confidence: response.confidence,
            response: response.response,
            responseTime: response.metadata.responseTime
          })),
          metadata: {
            processingTime: moaResponse.processingTime,
            timestamp: moaResponse.metadata.timestamp,
            requestId: moaResponse.requestId
          },
          astAnalysis: moaResponse.astAnalysis
        };
        
      case 'interactive':
        return {
          type: 'interactive',
          sections: [
            {
              title: 'Analysis Summary',
              type: 'text',
              content: moaResponse.result.content
            },
            {
              title: 'Agent Insights',
              type: 'expandable',
              items: moaResponse.agentResponses.map((response: any) => ({
                title: `${response.metadata.agentName} (${(response.confidence * 100).toFixed(1)}% confidence)`,
                content: response.response,
                metadata: {
                  responseTime: `${response.metadata.responseTime}ms`,
                  reasoning: response.reasoning
                }
              }))
            },
            {
              title: 'AST Structure',
              type: 'tree',
              data: moaResponse.astAnalysis,
              expandable: true
            }
          ],
          navigation: true,
          metadata: {
            totalAgents: moaResponse.agentResponses.length,
            processingTime: moaResponse.processingTime
          }
        };
        
      case 'markdown':
      default:
        return this.createMarkdownReport(moaResponse);
    }
  }

  private createMarkdownReport(moaResponse: any): string {
    const sections = [
      '# Code Analysis Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      `**Processing Time:** ${moaResponse.processingTime}ms`,
      `**Agents Consulted:** ${moaResponse.agentResponses.length}`,
      `**Consensus Reached:** ${moaResponse.metadata.consensusReached ? '✅ Yes' : '❌ No'}`,
      `**Overall Confidence:** ${(moaResponse.result.confidence * 100).toFixed(1)}%`,
      '',
      '## Executive Summary',
      '',
      moaResponse.result.content,
      '',
      '## Detailed Agent Analysis',
      ''
    ];

    // Add each agent's analysis
    moaResponse.agentResponses.forEach((response: any) => {
      sections.push(`### ${response.metadata.agentName} (${response.metadata.agentType})`);
      sections.push('');
      sections.push(`**Confidence Level:** ${(response.confidence * 100).toFixed(1)}%`);
      sections.push(`**Response Time:** ${response.metadata.responseTime}ms`);
      sections.push('');
      sections.push('#### Analysis');
      sections.push(response.response);
      sections.push('');
      sections.push('#### Reasoning');
      sections.push(response.reasoning);
      sections.push('');
      sections.push('---');
      sections.push('');
    });

    // Add AST analysis if available
    if (moaResponse.astAnalysis) {
      sections.push('## AST Analysis');
      sections.push('');
      sections.push('```json');
      sections.push(JSON.stringify(moaResponse.astAnalysis, null, 2));
      sections.push('```');
      sections.push('');
    }

    // Add performance metadata
    sections.push('## Performance Metadata');
    sections.push('');
    sections.push(`- **Total Processing Time:** ${moaResponse.processingTime}ms`);
    sections.push(`- **Agent Response Times:** ${moaResponse.agentResponses.map((r: any) => `${r.metadata.agentName}: ${r.metadata.responseTime}ms`).join(', ')}`);
    sections.push(`- **Consensus Algorithm:** ${moaResponse.metadata.consensusReached ? 'Successful' : 'Partial'}`);
    
    return sections.join('\n');
  }

  private generateAnalysisSuggestions(args: AnalysisCommandArgs, moaResponse: any): string[] {
    const suggestions: string[] = [];
    
    // Performance-based suggestions
    if (moaResponse.processingTime > 5000) {
      suggestions.push('Consider analyzing smaller code segments for faster results');
    }
    
    // Confidence-based suggestions
    if (moaResponse.result.confidence < 0.8) {
      suggestions.push('Try a different analysis type or depth for more confident results');
    }
    
    // Type-specific suggestions
    switch (args.type) {
      case 'ast':
        suggestions.push('Use /optimize for performance improvements based on this analysis');
        break;
      case 'performance':
        suggestions.push('Consider /review for code quality assessment');
        break;
      case 'quality':
        suggestions.push('Use /analyze --type=security for security assessment');
        break;
      case 'security':
        suggestions.push('Follow up with /analyze --type=quality for comprehensive review');
        break;
    }
    
    // Format-specific suggestions
    if (args.format === 'json') {
      suggestions.push('Use --format=interactive for browsable results');
    }
    
    return suggestions;
  }

  private looksLikeCode(content: string): boolean {
    // Enhanced code detection heuristics
    const codeIndicators = [
      /function\s+\w+\s*\(/i,
      /class\s+\w+/i,
      /(?:const|let|var)\s+\w+\s*=/,
      /=>\s*[{(]/,
      /import\s+.*from/i,
      /export\s+(?:default\s+)?/i,
      /{[\s\S]*}/,
      /\(\s*\)\s*=>/,
      /if\s*\([^)]*\)\s*{/,
      /for\s*\([^)]*\)\s*{/,
      /while\s*\([^)]*\)\s*{/,
      /switch\s*\([^)]*\)\s*{/,
      /try\s*{[\s\S]*}\s*catch/i,
      /async\s+function/i,
      /await\s+/i
    ];
    
    const codeScore = codeIndicators.reduce((score, pattern) => {
      return score + (pattern.test(content) ? 1 : 0);
    }, 0);
    
    // Consider it code if it matches at least 2 patterns or has typical code structure
    return codeScore >= 2 || this.hasCodeStructure(content);
  }

  private hasCodeStructure(content: string): boolean {
    // Check for balanced braces, parentheses, and semicolons
    const braceCount = (content.match(/{/g) || []).length - (content.match(/}/g) || []).length;
    const parenCount = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length;
    const hasSemicolons = /;/.test(content);
    const hasNewlines = /\n/.test(content);
    
    return Math.abs(braceCount) <= 1 && Math.abs(parenCount) <= 1 && (hasSemicolons || hasNewlines);
  }

  private getFlagValue(command: ParsedCommand, flagName: string, defaultValue: string): string {
    const flag = command.flags.find(f => f.name === flagName);
    return flag ? String(flag.value) : defaultValue;
  }
}