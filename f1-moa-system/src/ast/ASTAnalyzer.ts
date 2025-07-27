// F1 MOA System - Tree-sitter AST Analysis for Real-time Parsing

import Parser from 'tree-sitter';
// @ts-ignore - Tree-sitter language bindings don't have types
import JavaScript from 'tree-sitter-javascript';
// @ts-ignore - Tree-sitter language bindings don't have types
import TypeScript from 'tree-sitter-typescript';
// @ts-ignore - Tree-sitter language bindings don't have types
import Python from 'tree-sitter-python';
// @ts-ignore - Tree-sitter language bindings don't have types
import Rust from 'tree-sitter-rust';
import type { ASTAnalysis, ASTNode, CodePattern } from '../types/index.js';

export class ASTAnalyzer {
  private parsers: Map<string, Parser> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🌳 Initializing Tree-sitter parsers...');

    // Initialize parsers for supported languages
    const languages = [
      { name: 'javascript', parser: JavaScript },
      { name: 'typescript', parser: TypeScript.typescript },
      { name: 'tsx', parser: TypeScript.tsx },
      { name: 'python', parser: Python },
      { name: 'rust', parser: Rust }
    ];

    for (const { name, parser } of languages) {
      try {
        const treeParser = new Parser();
        treeParser.setLanguage(parser);
        this.parsers.set(name, treeParser);
        console.log(`✅ ${name} parser initialized`);
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${name} parser:`, error);
      }
    }

    this.isInitialized = true;
    console.log(`🌳 AST Analyzer initialized with ${this.parsers.size} languages`);
  }

  async analyze(code: string, language?: string): Promise<ASTAnalysis> {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Auto-detect language if not provided
    const detectedLanguage = language || this.detectLanguage(code);
    const parser = this.parsers.get(detectedLanguage);

    if (!parser) {
      throw new Error(`Unsupported language: ${detectedLanguage}`);
    }

    console.log(`🔍 Analyzing ${detectedLanguage} code (${code.length} chars)...`);

    try {
      // Parse the code
      const tree = parser.parse(code);
      const rootNode = tree.rootNode;

      // Extract AST nodes
      const nodes = this.extractNodes(rootNode, code);

      // Calculate complexity
      const complexity = this.calculateComplexity(nodes);

      // Identify patterns
      const patterns = this.identifyPatterns(nodes, code);

      // Generate suggestions
      const suggestions = this.generateSuggestions(patterns, complexity);

      const parseTime = Date.now() - startTime;

      const analysis: ASTAnalysis = {
        language: detectedLanguage,
        nodes,
        complexity,
        patterns,
        suggestions,
        parseTime
      };

      console.log(`✅ AST analysis completed in ${parseTime}ms (${nodes.length} nodes, complexity: ${complexity})`);
      return analysis;

    } catch (error) {
      console.error('❌ AST analysis failed:', error);
      throw new Error(`AST analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private detectLanguage(code: string): string {
    // Simple heuristics for language detection
    if (code.includes('import type') || code.includes('interface ') || code.includes(': string')) {
      return 'typescript';
    }
    if (code.includes('import ') && code.includes('from ') && code.includes('function ')) {
      return 'javascript';
    }
    if (code.includes('def ') && code.includes('import ')) {
      return 'python';
    }
    if (code.includes('fn ') && code.includes('struct ')) {
      return 'rust';
    }

    // Default to JavaScript
    return 'javascript';
  }

  private extractNodes(node: any, code: string): ASTNode[] {
    const nodes: ASTNode[] = [];
    
    const traverse = (currentNode: any) => {
      const astNode: ASTNode = {
        type: currentNode.type,
        text: code.slice(currentNode.startIndex, currentNode.endIndex),
        startPosition: {
          row: currentNode.startPosition.row,
          column: currentNode.startPosition.column
        },
        endPosition: {
          row: currentNode.endPosition.row,
          column: currentNode.endPosition.column
        },
        children: [],
        metadata: {
          isNamed: currentNode.isNamed,
          hasError: currentNode.hasError,
          isMissing: currentNode.isMissing
        }
      };

      nodes.push(astNode);

      // Process children
      for (let i = 0; i < currentNode.childCount; i++) {
        const child = currentNode.child(i);
        const childNode = traverse(child);
        astNode.children.push(childNode);
      }

      return astNode;
    };

    traverse(node);
    return nodes;
  }

  private calculateComplexity(nodes: ASTNode[]): number {
    let complexity = 0;

    for (const node of nodes) {
      switch (node.type) {
        case 'if_statement':
        case 'while_statement':
        case 'for_statement':
        case 'switch_statement':
          complexity += 1;
          break;
        case 'try_statement':
        case 'catch_clause':
          complexity += 1;
          break;
        case 'function_declaration':
        case 'method_definition':
        case 'arrow_function':
          complexity += 1;
          break;
        case 'class_declaration':
          complexity += 2;
          break;
        case 'nested_identifier':
          complexity += 0.5;
          break;
      }
    }

    return Math.round(complexity * 10) / 10;
  }

  private identifyPatterns(nodes: ASTNode[], code: string): CodePattern[] {
    const patterns: CodePattern[] = [];

    // Identify common patterns
    patterns.push(...this.findFunctionPatterns(nodes));
    patterns.push(...this.findAsyncPatterns(nodes, code));
    patterns.push(...this.findErrorHandlingPatterns(nodes));
    patterns.push(...this.findPerformancePatterns(nodes, code));
    patterns.push(...this.findSecurityPatterns(nodes, code));

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private findFunctionPatterns(nodes: ASTNode[]): CodePattern[] {
    const patterns: CodePattern[] = [];
    const functionNodes = nodes.filter(n => 
      ['function_declaration', 'method_definition', 'arrow_function'].includes(n.type)
    );

    if (functionNodes.length > 10) {
      patterns.push({
        type: 'high_function_count',
        confidence: 0.8,
        description: `High number of functions detected (${functionNodes.length})`,
        location: { start: 0, end: 0 },
        suggestions: ['Consider modularizing code', 'Break into smaller files', 'Use class-based organization']
      });
    }

    // Check for long functions
    for (const funcNode of functionNodes) {
      const lineCount = funcNode.endPosition.row - funcNode.startPosition.row;
      if (lineCount > 50) {
        patterns.push({
          type: 'long_function',
          confidence: 0.9,
          description: `Long function detected (${lineCount} lines)`,
          location: { 
            start: funcNode.startPosition.row, 
            end: funcNode.endPosition.row 
          },
          suggestions: ['Break function into smaller pieces', 'Extract helper functions', 'Simplify logic']
        });
      }
    }

    return patterns;
  }

  private findAsyncPatterns(nodes: ASTNode[], code: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    // Find async/await usage
    const asyncNodes = nodes.filter(n => n.text.includes('async') || n.text.includes('await'));
    
    if (asyncNodes.length > 0) {
      patterns.push({
        type: 'async_usage',
        confidence: 0.85,
        description: `Async/await patterns detected (${asyncNodes.length} instances)`,
        location: { start: 0, end: 0 },
        suggestions: ['Ensure proper error handling', 'Consider Promise.all for parallel operations', 'Add timeout handling']
      });
    }

    // Check for Promise chains
    if (code.includes('.then(') && code.includes('.catch(')) {
      patterns.push({
        type: 'promise_chain',
        confidence: 0.7,
        description: 'Promise chains detected',
        location: { start: 0, end: 0 },
        suggestions: ['Consider converting to async/await', 'Simplify promise chains']
      });
    }

    return patterns;
  }

  private findErrorHandlingPatterns(nodes: ASTNode[]): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    const tryNodes = nodes.filter(n => n.type === 'try_statement');
    const totalFunctions = nodes.filter(n => 
      ['function_declaration', 'method_definition', 'arrow_function'].includes(n.type)
    ).length;

    if (totalFunctions > 0 && tryNodes.length / totalFunctions < 0.3) {
      patterns.push({
        type: 'insufficient_error_handling',
        confidence: 0.6,
        description: 'Potentially insufficient error handling',
        location: { start: 0, end: 0 },
        suggestions: ['Add try-catch blocks', 'Implement error boundaries', 'Add input validation']
      });
    }

    return patterns;
  }

  private findPerformancePatterns(nodes: ASTNode[], code: string): CodePattern[] {
    const patterns: CodePattern[] = [];

    // Check for nested loops
    const loops = nodes.filter(n => 
      ['for_statement', 'while_statement', 'for_in_statement'].includes(n.type)
    );

    for (const loop of loops) {
      const nestedLoops = loop.children.filter(child => 
        ['for_statement', 'while_statement', 'for_in_statement'].includes(child.type)
      );
      
      if (nestedLoops.length > 0) {
        patterns.push({
          type: 'nested_loops',
          confidence: 0.8,
          description: 'Nested loops detected - potential performance issue',
          location: { 
            start: loop.startPosition.row, 
            end: loop.endPosition.row 
          },
          suggestions: ['Consider algorithm optimization', 'Use more efficient data structures', 'Cache repeated calculations']
        });
      }
    }

    // Check for frequent string concatenation
    if (code.match(/\+\s*["']/g) && code.match(/\+\s*["']/g)!.length > 5) {
      patterns.push({
        type: 'string_concatenation',
        confidence: 0.7,
        description: 'Frequent string concatenation detected',
        location: { start: 0, end: 0 },
        suggestions: ['Use template literals', 'Use array.join()', 'Consider StringBuilder pattern']
      });
    }

    return patterns;
  }

  private findSecurityPatterns(nodes: ASTNode[], code: string): CodePattern[] {
    const patterns: CodePattern[] = [];

    // Check for eval usage
    if (code.includes('eval(')) {
      patterns.push({
        type: 'eval_usage',
        confidence: 0.9,
        description: 'eval() usage detected - security risk',
        location: { start: 0, end: 0 },
        suggestions: ['Avoid eval()', 'Use safe parsing methods', 'Validate input strictly']
      });
    }

    // Check for innerHTML usage
    if (code.includes('innerHTML')) {
      patterns.push({
        type: 'innerhtml_usage',
        confidence: 0.7,
        description: 'innerHTML usage detected - potential XSS risk',
        location: { start: 0, end: 0 },
        suggestions: ['Use textContent instead', 'Sanitize HTML input', 'Use DOM methods']
      });
    }

    // Check for hardcoded secrets pattern
    const secretPatterns = [
      /password\s*[:=]\s*["'][^"']*["']/gi,
      /api[_-]?key\s*[:=]\s*["'][^"']*["']/gi,
      /token\s*[:=]\s*["'][^"']*["']/gi
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(code)) {
        patterns.push({
          type: 'hardcoded_secrets',
          confidence: 0.8,
          description: 'Potential hardcoded secrets detected',
          location: { start: 0, end: 0 },
          suggestions: ['Use environment variables', 'Use secure credential storage', 'Remove sensitive data']
        });
        break;
      }
    }

    return patterns;
  }

  private generateSuggestions(patterns: CodePattern[], complexity: number): string[] {
    const suggestions: string[] = [];

    // Complexity-based suggestions
    if (complexity > 20) {
      suggestions.push('High complexity detected - consider refactoring');
      suggestions.push('Break down complex functions into smaller ones');
    }

    if (complexity > 10) {
      suggestions.push('Add comprehensive unit tests');
      suggestions.push('Consider adding documentation');
    }

    // Pattern-based suggestions
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    for (const pattern of highConfidencePatterns.slice(0, 3)) {
      suggestions.push(...pattern.suggestions);
    }

    // Remove duplicates
    return [...new Set(suggestions)];
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.parsers.keys());
  }

  async analyzeMultiple(codeFiles: Array<{ code: string; language?: string; filename?: string }>): Promise<ASTAnalysis[]> {
    console.log(`🔍 Analyzing ${codeFiles.length} files...`);
    
    const analyses = await Promise.all(
      codeFiles.map(file => this.analyze(file.code, file.language))
    );

    console.log(`✅ Completed analysis of ${codeFiles.length} files`);
    return analyses;
  }
}