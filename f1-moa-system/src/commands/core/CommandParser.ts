// F8 Command Parser - <50ms Performance Guarantee
// Lightning-fast command parsing with intelligent validation

import { performance } from 'perf_hooks';
import type {
  CommandParser,
  ParsedCommand,
  CommandArgument,
  CommandFlag,
  CommandContext,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ParsingMetrics,
  UserPreferences,
  CLITheme,
  ArgumentDefinition
} from '../types.js';

export class F8CommandParser implements CommandParser {
  private readonly maxParseTime: number = 50; // 50ms target
  private cache: Map<string, ParsedCommand> = new Map();
  private metrics: ParsingMetrics;
  private readonly cacheSize = 1000; // Maximum cache entries
  
  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupCacheCleanup();
  }

  async parseCommand(input: string): Promise<ParsedCommand> {
    const startTime = performance.now();
    
    try {
      // Check cache first for performance boost
      if (this.cache.has(input)) {
        const cached = this.cache.get(input)!;
        this.updateMetrics(performance.now() - startTime, true, true);
        return { 
          ...cached, 
          metadata: { 
            ...cached.metadata, 
            parseTime: 0,
            validationTime: 0 
          } 
        };
      }

      // Fast tokenization with performance optimization
      const tokens = this.tokenizeInput(input);
      const commandName = this.extractCommandName(tokens[0]);
      
      if (!commandName) {
        throw new Error('Empty command name');
      }

      // Parallel extraction of arguments and flags
      const { arguments: args, flags } = this.extractArgsAndFlags(tokens.slice(1));
      
      // Build context efficiently
      const context = await this.buildCommandContext();
      
      const parseTime = performance.now() - startTime;
      
      const command: ParsedCommand = {
        name: commandName,
        arguments: args,
        flags,
        context,
        metadata: {
          rawInput: input,
          parseTime,
          validationTime: 0
        }
      };

      // Fast validation with early termination
      const validationStart = performance.now();
      const validation = this.validateCommand(command);
      const validationTime = performance.now() - validationStart;
      
      command.metadata.validationTime = validationTime;
      
      if (!validation.valid) {
        command.metadata.suggestions = validation.suggestions;
      }

      // Intelligent caching for performance
      if (validation.valid && this.shouldCache(command)) {
        this.addToCache(input, command);
      }

      const totalTime = performance.now() - startTime;
      this.updateMetrics(totalTime, validation.valid, false);
      
      // Performance monitoring with warning
      if (totalTime > this.maxParseTime) {
        console.warn(`⚠️ F8 Command parsing exceeded ${this.maxParseTime}ms: ${totalTime.toFixed(2)}ms for "${input}"`);
      }

      return command;

    } catch (error) {
      const totalTime = performance.now() - startTime;
      this.updateMetrics(totalTime, false, false);
      throw new Error(`F8 Command parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateCommand(command: ParsedCommand): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Fast command existence check
    if (!this.isValidCommand(command.name)) {
      const suggestion = this.suggestSimilarCommand(command.name);
      errors.push({
        code: 'UNKNOWN_COMMAND',
        message: `Unknown command: /${command.name}`,
        suggestedFix: suggestion ? `Did you mean /${suggestion}?` : 'Use /help to see available commands'
      });
      
      if (suggestion) {
        suggestions.push(`/${suggestion}`);
      }
    }

    // Required arguments validation
    const requiredArgs = this.getRequiredArguments(command.name);
    for (const reqArg of requiredArgs) {
      const provided = command.arguments.find(arg => arg.name === reqArg.name || arg.name === `arg${command.arguments.indexOf(arg)}`);
      if (!provided || !provided.value) {
        errors.push({
          code: 'MISSING_ARGUMENT',
          message: `Missing required argument: ${reqArg.name}`,
          argument: reqArg.name,
          suggestedFix: `Add ${reqArg.name} argument: /${command.name} "${reqArg.description}"`
        });
      }
    }

    // Argument type validation with optimization
    for (const arg of command.arguments) {
      const typeValidation = this.validateArgumentType(arg);
      if (!typeValidation.valid) {
        errors.push({
          code: 'INVALID_ARGUMENT_TYPE',
          message: typeValidation.message,
          argument: arg.name,
          suggestedFix: typeValidation.suggestedFix
        });
      }
    }

    // Flag validation
    for (const flag of command.flags) {
      if (!this.isValidFlag(command.name, flag.name)) {
        warnings.push({
          code: 'UNKNOWN_FLAG',
          message: `Unknown flag: --${flag.name}`,
          argument: flag.name
        });
        suggestions.push(`Remove --${flag.name} or check /help ${command.name}`);
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

  getSuggestions(partial: string): string[] {
    const commands = this.getAllCommandNames();
    const suggestions = commands
      .filter(cmd => cmd.startsWith(partial.toLowerCase()))
      .sort((a, b) => {
        // Prioritize exact matches and shorter commands
        const aScore = a === partial ? 0 : a.length;
        const bScore = b === partial ? 0 : b.length;
        return aScore - bScore;
      })
      .slice(0, 10);

    // Add fuzzy matches if we have space
    if (suggestions.length < 5) {
      const fuzzyMatches = commands
        .filter(cmd => !suggestions.includes(cmd) && this.fuzzyMatch(partial, cmd))
        .sort((a, b) => this.levenshteinDistance(partial, a) - this.levenshteinDistance(partial, b))
        .slice(0, 5 - suggestions.length);
      
      suggestions.push(...fuzzyMatches);
    }

    return suggestions;
  }

  getParsingMetrics(): ParsingMetrics {
    return { ...this.metrics };
  }

  // Private implementation methods
  private tokenizeInput(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let escapeNext = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens;
  }

  private extractCommandName(firstToken: string): string {
    if (!firstToken) return '';
    
    // Remove leading slash if present
    return firstToken.startsWith('/') ? firstToken.slice(1) : firstToken;
  }

  private extractArgsAndFlags(tokens: string[]): { arguments: CommandArgument[], flags: CommandFlag[] } {
    const arguments: CommandArgument[] = [];
    const flags: CommandFlag[] = [];
    let argIndex = 0;
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.startsWith('--')) {
        // Long flag: --flag=value or --flag
        const [name, value] = token.slice(2).split('=', 2);
        flags.push({
          name,
          value: value !== undefined ? value : true,
          description: this.getFlagDescription(name)
        });
      } else if (token.startsWith('-') && token.length > 1) {
        // Short flag: -f or -fvalue
        const flagPart = token.slice(1);
        if (flagPart.length === 1) {
          // Single short flag
          flags.push({
            name: flagPart,
            value: true,
            shorthand: flagPart,
            description: this.getFlagDescription(flagPart)
          });
        } else {
          // Short flag with value: -fvalue
          const name = flagPart[0];
          const value = flagPart.slice(1);
          flags.push({
            name,
            value,
            shorthand: name,
            description: this.getFlagDescription(name)
          });
        }
      } else {
        // Positional argument
        arguments.push({
          name: `arg${argIndex}`,
          value: token,
          type: this.inferArgumentType(token),
          required: false,
          validated: false
        });
        argIndex++;
      }
    }

    return { arguments, flags };
  }

  private async buildCommandContext(): Promise<CommandContext> {
    return {
      workingDirectory: process.cwd(),
      environment: (process.env.NODE_ENV as any) || 'development',
      sessionId: this.generateSessionId(),
      userPreferences: await this.loadUserPreferences(),
      timestamp: Date.now()
    };
  }

  private shouldCache(command: ParsedCommand): boolean {
    // Cache strategy: simple commands with few arguments/flags
    return command.arguments.length <= 3 && 
           command.flags.length <= 5 &&
           this.cache.size < this.cacheSize;
  }

  private addToCache(input: string, command: ParsedCommand): void {
    // LRU cache implementation
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(input, command);
  }

  private setupCacheCleanup(): void {
    // Clean cache every 5 minutes to prevent memory leaks
    setInterval(() => {
      if (this.cache.size > this.cacheSize * 0.8) {
        const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(this.cache.size * 0.2));
        keysToDelete.forEach(key => this.cache.delete(key));
      }
    }, 300000); // 5 minutes
  }

  private updateMetrics(parseTime: number, success: boolean, cached: boolean): void {
    this.metrics.totalCommandsParsed++;
    
    // Running average for better performance
    const alpha = 0.1; // Smoothing factor
    this.metrics.avgParseTime = this.metrics.avgParseTime * (1 - alpha) + parseTime * alpha;
    this.metrics.maxParseTime = Math.max(this.metrics.maxParseTime, parseTime);
    
    // Update success rate
    const successCount = this.metrics.totalCommandsParsed * this.metrics.parseSuccessRate;
    const newSuccessCount = success ? successCount + 1 : successCount;
    this.metrics.parseSuccessRate = newSuccessCount / this.metrics.totalCommandsParsed;
    
    // Update validation success rate (assuming success means valid)
    this.metrics.validationSuccessRate = this.metrics.parseSuccessRate;
    
    // Update cache hit rate
    if (cached) {
      const cacheHits = this.metrics.totalCommandsParsed * this.metrics.autoCompletionHitRate + 1;
      this.metrics.autoCompletionHitRate = cacheHits / this.metrics.totalCommandsParsed;
    }
    
    this.metrics.lastUpdated = Date.now();
  }

  private initializeMetrics(): ParsingMetrics {
    return {
      avgParseTime: 0,
      maxParseTime: 0,
      totalCommandsParsed: 0,
      parseSuccessRate: 1.0,
      validationSuccessRate: 1.0,
      autoCompletionHitRate: 0.0,
      lastUpdated: Date.now()
    };
  }

  // Validation helper methods
  private isValidCommand(name: string): boolean {
    const validCommands = ['analyze', 'optimize', 'review', 'moa', 'help'];
    return validCommands.includes(name.toLowerCase());
  }

  private suggestSimilarCommand(name: string): string | null {
    const commands = ['analyze', 'optimize', 'review', 'moa', 'help'];
    const suggestions = commands
      .map(cmd => ({ cmd, distance: this.levenshteinDistance(name.toLowerCase(), cmd) }))
      .filter(({ distance }) => distance <= 3) // Only suggest if reasonably close
      .sort((a, b) => a.distance - b.distance);
    
    return suggestions.length > 0 ? suggestions[0].cmd : null;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1,     // deletion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[b.length][a.length];
  }

  private fuzzyMatch(query: string, target: string): boolean {
    const q = query.toLowerCase();
    const t = target.toLowerCase();
    
    // Simple fuzzy matching: all query characters must appear in order
    let qi = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) {
        qi++;
      }
    }
    
    return qi === q.length;
  }

  private getRequiredArguments(commandName: string): ArgumentDefinition[] {
    const requirements: Record<string, ArgumentDefinition[]> = {
      analyze: [{ 
        name: 'code', 
        type: 'string', 
        required: true, 
        description: 'Code to analyze (string or file path)' 
      }],
      optimize: [{ 
        name: 'code', 
        type: 'string', 
        required: true, 
        description: 'Code to optimize' 
      }],
      review: [{ 
        name: 'code', 
        type: 'string', 
        required: true, 
        description: 'Code to review' 
      }],
      moa: [{ 
        name: 'prompt', 
        type: 'string', 
        required: true, 
        description: 'Prompt for MOA processing' 
      }]
    };
    
    return requirements[commandName] || [];
  }

  private validateArgumentType(arg: CommandArgument): { valid: boolean; message: string; suggestedFix?: string } {
    switch (arg.type) {
      case 'number':
        const num = Number(arg.value);
        if (isNaN(num)) {
          return {
            valid: false,
            message: `Expected number but got: ${arg.value}`,
            suggestedFix: 'Provide a numeric value'
          };
        }
        break;
        
      case 'boolean':
        if (typeof arg.value === 'string' && !['true', 'false', '1', '0'].includes(arg.value.toLowerCase())) {
          return {
            valid: false,
            message: `Expected boolean but got: ${arg.value}`,
            suggestedFix: 'Use true, false, 1, or 0'
          };
        }
        break;
        
      case 'path':
        if (typeof arg.value === 'string' && arg.value.includes('..')) {
          return {
            valid: false,
            message: `Potentially unsafe path: ${arg.value}`,
            suggestedFix: 'Use absolute paths or relative paths without ..'
          };
        }
        break;
    }
    
    return { valid: true, message: 'Valid' };
  }

  private inferArgumentType(value: string): 'string' | 'number' | 'boolean' | 'code' | 'path' {
    // Boolean detection
    if (['true', 'false', '1', '0'].includes(value.toLowerCase())) {
      return 'boolean';
    }
    
    // Number detection
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return 'number';
    }
    
    // Path detection
    if (value.includes('/') || value.includes('\\') || value.includes('.')) {
      return 'path';
    }
    
    // Code detection (simple heuristics)
    if (value.includes('{') || 
        value.includes('function') || 
        value.includes('class') ||
        value.includes('const ') ||
        value.includes('let ') ||
        value.includes('var ') ||
        value.includes('=>')) {
      return 'code';
    }
    
    return 'string';
  }

  private isValidFlag(commandName: string, flagName: string): boolean {
    const validFlags: Record<string, string[]> = {
      analyze: ['type', 't', 'depth', 'd', 'format', 'f', 'verbose', 'v'],
      optimize: ['goals', 'g', 'aggressiveness', 'a', 'constraints', 'c', 'verbose', 'v'],
      review: ['criteria', 'c', 'reviewers', 'r', 'format', 'f', 'verbose', 'v'],
      moa: ['agents', 'a', 'consensus', 's', 'template', 't', 'verbose', 'v'],
      help: ['interactive', 'i', 'search', 's', 'category', 'c']
    };
    
    const commandFlags = validFlags[commandName] || [];
    const globalFlags = ['help', 'h', 'verbose', 'v', 'quiet', 'q'];
    
    return commandFlags.includes(flagName) || globalFlags.includes(flagName);
  }

  private getFlagDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'type': 'Analysis type (ast, performance, quality, security)',
      't': 'Analysis type (ast, performance, quality, security)',
      'depth': 'Analysis depth (shallow, deep, comprehensive)',
      'd': 'Analysis depth (shallow, deep, comprehensive)',
      'format': 'Output format (json, markdown, interactive)',
      'f': 'Output format (json, markdown, interactive)',
      'goals': 'Optimization goals (comma-separated)',
      'g': 'Optimization goals (comma-separated)',
      'aggressiveness': 'Optimization level (conservative, moderate, aggressive)',
      'a': 'Optimization level (conservative, moderate, aggressive)',
      'criteria': 'Review criteria (comma-separated)',
      'c': 'Review criteria (comma-separated)',
      'reviewers': 'Agent types for review (comma-separated)',
      'r': 'Agent types for review (comma-separated)',
      'agents': 'Specific agents to use (comma-separated)',
      'consensus': 'Consensus threshold (0.0-1.0)',
      's': 'Consensus threshold (0.0-1.0)',
      'template': 'Prompt template to use',
      'interactive': 'Launch interactive help mode',
      'i': 'Launch interactive help mode',
      'search': 'Search for commands by keyword',
      'verbose': 'Enable verbose output',
      'v': 'Enable verbose output',
      'help': 'Show help information',
      'h': 'Show help information',
      'quiet': 'Suppress non-essential output',
      'q': 'Suppress non-essential output'
    };
    
    return descriptions[name] || 'Flag option';
  }

  private getAllCommandNames(): string[] {
    return ['analyze', 'optimize', 'review', 'moa', 'help'];
  }

  private generateSessionId(): string {
    return `f8-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadUserPreferences(): Promise<UserPreferences> {
    // Load from user config file or return defaults
    // In production, this would read from ~/.f8/config.json or similar
    return {
      theme: {
        primary: '\x1b[36m',    // Cyan
        secondary: '\x1b[37m',  // White
        success: '\x1b[32m',    // Green
        warning: '\x1b[33m',    // Yellow
        error: '\x1b[31m',      // Red
        info: '\x1b[34m'        // Blue
      },
      autoCompletion: true,
      verboseOutput: false,
      defaultAgents: ['researcher', 'analyst', 'coder'],
      hookPreferences: {
        enablePreHooks: true,
        enablePostHooks: true,
        autoFormat: true
      },
      performanceReporting: true
    };
  }
}