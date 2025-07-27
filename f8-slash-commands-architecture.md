# F8 Slash-Commands Integration Architecture

## Executive Summary

The F8 Slash-Commands Integration system provides a comprehensive CLI interface for PPMOA slash commands, building on the robust F1 MOA System and F2 Hook System foundations. This architecture delivers <100ms command processing with intuitive user experience, seamless integration patterns, and comprehensive command discovery.

## System Overview

### Architecture Stack
```
┌─────────────────────────────────────────────────────────────┐
│                F8 Slash-Commands Integration                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Command Parser  │◄─┤ Command Registry│◄─┤ CLI Interface│ │
│  │ (<50ms parsing) │  │ (Discovery &    │  │ (User I/O)  ││ │
│  │                 │  │  Management)    │  │             ││ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                      │                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ MOA Integration │  │ Hook Integration│  │ Help System ││ │
│  │ (F1 Bridge)     │  │ (F2 Bridge)     │  │ (Discovery) ││ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────────────────────┐
              │     F2 Hook System          │
              │   (Event Integration)       │
              └─────────────────────────────┘
                            │
              ┌─────────────────────────────┐
              │     F1 MOA System           │
              │   (6-Agent Foundation)      │
              └─────────────────────────────┘
```

## Core Components Architecture

### 1. Command Parser (<50ms Processing)

**Performance Target: <50ms command parsing and validation**

```typescript
interface CommandParser {
  // Core parsing with sub-50ms guarantee
  parseCommand(input: string): Promise<ParsedCommand>;
  
  // Validation pipeline
  validateCommand(command: ParsedCommand): ValidationResult;
  
  // Auto-completion support
  getSuggestions(partial: string): string[];
  
  // Performance monitoring
  getParsingMetrics(): ParsingMetrics;
}

interface ParsedCommand {
  name: string;
  arguments: CommandArgument[];
  flags: CommandFlag[];
  context: CommandContext;
  metadata: {
    rawInput: string;
    parseTime: number;
    validationTime: number;
    suggestions?: string[];
  };
}

interface CommandArgument {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'code' | 'path';
  required: boolean;
  validated: boolean;
}

interface CommandFlag {
  name: string;
  value?: string | boolean;
  shorthand?: string;
  description: string;
}

interface CommandContext {
  workingDirectory: string;
  environment: 'development' | 'staging' | 'production';
  sessionId: string;
  userPreferences: UserPreferences;
  timestamp: number;
}
```

**Key Features:**
- **Lightning Parser**: Sub-20ms parsing for simple commands
- **Smart Validation**: Context-aware argument validation
- **Auto-completion**: Intelligent command and argument suggestions
- **Error Recovery**: Graceful handling of malformed commands

### 2. Command Registry (Discovery & Management)

**Performance Target: <30ms command discovery and routing**

```typescript
interface CommandRegistry {
  // Command registration
  registerCommand(command: SlashCommand): Promise<void>;
  
  // Discovery and routing
  findCommand(name: string): SlashCommand | null;
  getAllCommands(): SlashCommand[];
  
  // Category management
  getCommandsByCategory(category: CommandCategory): SlashCommand[];
  
  // Help generation
  generateHelp(commandName?: string): HelpContent;
}

interface SlashCommand {
  name: string;
  aliases: string[];
  description: string;
  category: CommandCategory;
  usage: string;
  examples: CommandExample[];
  arguments: ArgumentDefinition[];
  flags: FlagDefinition[];
  handler: CommandHandler;
  metadata: {
    version: string;
    author: string;
    performanceHints: PerformanceHint[];
    integration: IntegrationConfig;
  };
}

interface CommandHandler {
  execute(context: CommandExecutionContext): Promise<CommandResult>;
  validate(args: CommandArgument[]): ValidationResult;
  getHelp(): HelpContent;
  canHandle(command: ParsedCommand): boolean;
}

interface CommandExecutionContext {
  command: ParsedCommand;
  moaCoordinator: MOACoordinator;
  hookManager: F2HookManager;
  cliInterface: CLIInterface;
  environment: ExecutionEnvironment;
}

type CommandCategory = 
  | 'analysis' 
  | 'optimization' 
  | 'review' 
  | 'moa' 
  | 'system' 
  | 'help';
```

**Registry Features:**
- **Dynamic Loading**: Commands loaded on-demand for performance
- **Category Organization**: Logical grouping for discovery
- **Alias Support**: Multiple names for user convenience
- **Version Management**: Command versioning and compatibility

### 3. MOA Integration (F1 Bridge)

**Performance Target: <200ms MOA request processing**

```typescript
interface MOAIntegration {
  // Bridge slash commands to MOA requests
  processMOACommand(command: ParsedCommand): Promise<MOACommandResult>;
  
  // Agent selection and coordination
  selectOptimalAgents(commandType: string): AgentType[];
  
  // Context conversion
  convertCommandContext(context: CommandContext): MOARequestContext;
  
  // Performance optimization
  getCachedResult(command: ParsedCommand): MOACommandResult | null;
}

interface MOACommandResult {
  moaResponse: MOAResponse;
  processingTime: number;
  agentsUsed: AgentType[];
  consensusReached: boolean;
  cacheUsed: boolean;
  metadata: {
    requestId: string;
    commandName: string;
    accuracy: number;
    confidence: number;
  };
}

interface MOARequestContext {
  originalCommand: string;
  targetCode?: string;
  analysisType?: string;
  optimizationGoals?: string[];
  reviewCriteria?: string[];
  customPrompt?: string;
}
```

**MOA Integration Features:**
- **Smart Agent Selection**: Choose optimal agents based on command type
- **Context Preservation**: Maintain command context through MOA processing
- **Result Caching**: Cache MOA results for repeated commands
- **Performance Monitoring**: Track MOA integration performance

### 4. Hook Integration (F2 Bridge)

**Performance Target: <50ms hook processing per command**

```typescript
interface HookIntegration {
  // Trigger hooks around command execution
  triggerPreCommandHooks(command: ParsedCommand): Promise<HookResult[]>;
  triggerPostCommandHooks(result: CommandResult): Promise<HookResult[]>;
  
  // Command-specific hook binding
  bindHooksToCommand(commandName: string, hooks: Hook[]): Promise<void>;
  
  // Event integration
  emitCommandEvent(event: CommandEvent): Promise<void>;
  
  // Performance tracking
  getHookPerformanceMetrics(): HookIntegrationMetrics;
}

interface CommandEvent {
  type: 'command-started' | 'command-completed' | 'command-failed';
  command: ParsedCommand;
  result?: CommandResult;
  timestamp: number;
  duration?: number;
}

interface HookIntegrationMetrics {
  avgHookProcessingTime: number;
  hooksTriggeredPerCommand: number;
  hookSuccessRate: number;
  commandsWithHooks: number;
  totalHookExecutions: number;
}
```

**Hook Integration Features:**
- **Pre/Post Hooks**: Execute hooks before and after command execution
- **Command Binding**: Bind specific hooks to specific commands
- **Event Publishing**: Publish command events for system-wide awareness
- **Performance Tracking**: Monitor hook integration performance

### 5. CLI Interface (User Interaction)

**Performance Target: <100ms user feedback**

```typescript
interface CLIInterface {
  // Command input and processing
  processInput(input: string): Promise<void>;
  
  // Output formatting and display
  displayResult(result: CommandResult): Promise<void>;
  displayHelp(help: HelpContent): Promise<void>;
  displayError(error: CommandError): Promise<void>;
  
  // Interactive features
  promptForInput(prompt: InputPrompt): Promise<string>;
  showProgress(operation: string): ProgressIndicator;
  
  // User experience
  enableAutoCompletion(): void;
  setTheme(theme: CLITheme): void;
}

interface CommandResult {
  success: boolean;
  data: any;
  message: string;
  details?: ResultDetails;
  suggestions?: string[];
  metadata: {
    executionTime: number;
    commandName: string;
    timestamp: number;
  };
}

interface ResultDetails {
  moaAnalysis?: MOACommandResult;
  astAnalysis?: any;
  hookResults?: HookResult[];
  performanceMetrics?: PerformanceMetrics;
}

interface CLITheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}
```

**CLI Features:**
- **Rich Output**: Formatted output with colors and styling
- **Progress Indicators**: Visual feedback for long-running operations
- **Auto-completion**: Tab completion for commands and arguments
- **Error Handling**: User-friendly error messages and suggestions

### 6. Help System (Command Discovery)

**Performance Target: <50ms help generation**

```typescript
interface HelpSystem {
  // Help content generation
  generateCommandHelp(commandName: string): HelpContent;
  generateCategoryHelp(category: CommandCategory): HelpContent;
  generateFullHelp(): HelpContent;
  
  // Search and discovery
  searchCommands(query: string): SearchResult[];
  getSimilarCommands(commandName: string): string[];
  
  // Interactive help
  launchInteractiveHelp(): Promise<void>;
  generateUsageExamples(commandName: string): CommandExample[];
}

interface HelpContent {
  title: string;
  description: string;
  usage: string;
  arguments: ArgumentHelp[];
  flags: FlagHelp[];
  examples: CommandExample[];
  seeAlso: string[];
  metadata: {
    lastUpdated: number;
    version: string;
    category: CommandCategory;
  };
}

interface SearchResult {
  command: SlashCommand;
  relevanceScore: number;
  matchedTerms: string[];
  context: string;
}

interface CommandExample {
  description: string;
  command: string;
  expectedOutput?: string;
  notes?: string;
}
```

**Help System Features:**
- **Smart Search**: Fuzzy search with relevance scoring
- **Interactive Mode**: Step-by-step help guidance
- **Context-Aware**: Help tailored to current context
- **Example Generation**: Practical usage examples

## TypeScript Interface Definitions

### Core Slash Commands Types

```typescript
// Command processing performance
interface ParsingMetrics {
  avgParseTime: number;
  maxParseTime: number;
  totalCommandsParsed: number;
  parseSuccessRate: number;
  validationSuccessRate: number;
  autoCompletionHitRate: number;
  lastUpdated: number;
}

// User preferences and settings
interface UserPreferences {
  theme: CLITheme;
  autoCompletion: boolean;
  verboseOutput: boolean;
  defaultAgents: AgentType[];
  hookPreferences: HookPreferences;
  performanceReporting: boolean;
}

// Command validation
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  validatedAt: number;
}

interface ValidationError {
  code: string;
  message: string;
  argument?: string;
  suggestedFix?: string;
}

// Performance optimization
interface PerformanceHint {
  operation: string;
  optimizationStrategy: string;
  expectedImprovement: string;
  conditions: string[];
}

// Integration configuration
interface IntegrationConfig {
  requiredAgents: AgentType[];
  optionalAgents: AgentType[];
  hookBindings: HookBinding[];
  cacheStrategy: CacheStrategy;
  timeoutMs: number;
}

interface HookBinding {
  hookType: string;
  phase: 'pre' | 'post';
  required: boolean;
  timeout: number;
}

type CacheStrategy = 'none' | 'memory' | 'disk' | 'hybrid';
```

### Command-Specific Types

```typescript
// Analysis command types
interface AnalysisCommandArgs {
  code: string;
  type: 'ast' | 'performance' | 'quality' | 'security';
  depth: 'shallow' | 'deep' | 'comprehensive';
  format: 'json' | 'markdown' | 'interactive';
}

// Optimization command types
interface OptimizationCommandArgs {
  code: string;
  goals: OptimizationGoal[];
  constraints: OptimizationConstraint[];
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
}

type OptimizationGoal = 
  | 'performance' 
  | 'memory' 
  | 'readability' 
  | 'maintainability';

interface OptimizationConstraint {
  type: string;
  value: any;
  description: string;
}

// Review command types
interface ReviewCommandArgs {
  code: string;
  criteria: ReviewCriteria[];
  reviewers: AgentType[];
  format: 'detailed' | 'summary' | 'checklist';
}

type ReviewCriteria = 
  | 'code-quality' 
  | 'security' 
  | 'performance' 
  | 'best-practices' 
  | 'maintainability';

// MOA command types
interface MOACommandArgs {
  prompt: string;
  agents?: AgentType[];
  consensus?: number;
  template?: string;
  context?: Record<string, any>;
}
```

## Command Implementation Classes

### 1. Core Command Parser Implementation

```typescript
export class F8CommandParser implements CommandParser {
  private readonly maxParseTime: number = 50; // 50ms target
  private cache: Map<string, ParsedCommand> = new Map();
  private metrics: ParsingMetrics;

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  async parseCommand(input: string): Promise<ParsedCommand> {
    const startTime = performance.now();
    
    try {
      // Check cache first for performance
      if (this.cache.has(input)) {
        const cached = this.cache.get(input)!;
        this.updateMetrics(performance.now() - startTime, true, true);
        return { ...cached, metadata: { ...cached.metadata, parseTime: 0 } };
      }

      // Parse command structure
      const parts = this.tokenizeInput(input);
      const commandName = parts[0]?.replace('/', '') || '';
      
      if (!commandName) {
        throw new Error('Empty command name');
      }

      // Extract arguments and flags
      const { arguments: args, flags } = this.extractArgsAndFlags(parts.slice(1));
      
      // Build context
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

      // Validate parsed command
      const validationStart = performance.now();
      const validation = this.validateCommand(command);
      const validationTime = performance.now() - validationStart;
      
      command.metadata.validationTime = validationTime;
      
      if (!validation.valid) {
        command.metadata.suggestions = validation.suggestions;
      }

      // Cache successful parses
      if (validation.valid && this.shouldCache(command)) {
        this.cache.set(input, command);
      }

      const totalTime = performance.now() - startTime;
      this.updateMetrics(totalTime, validation.valid, false);
      
      // Warn if exceeding performance target
      if (totalTime > this.maxParseTime) {
        console.warn(`⚠️ Command parsing exceeded ${this.maxParseTime}ms: ${totalTime.toFixed(2)}ms`);
      }

      return command;

    } catch (error) {
      const totalTime = performance.now() - startTime;
      this.updateMetrics(totalTime, false, false);
      throw new Error(`Command parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateCommand(command: ParsedCommand): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate command exists
    if (!this.isValidCommand(command.name)) {
      errors.push({
        code: 'UNKNOWN_COMMAND',
        message: `Unknown command: /${command.name}`,
        suggestedFix: this.suggestSimilarCommand(command.name)
      });
    }

    // Validate required arguments
    const requiredArgs = this.getRequiredArguments(command.name);
    for (const reqArg of requiredArgs) {
      const provided = command.arguments.find(arg => arg.name === reqArg.name);
      if (!provided) {
        errors.push({
          code: 'MISSING_ARGUMENT',
          message: `Missing required argument: ${reqArg.name}`,
          argument: reqArg.name,
          suggestedFix: `Add ${reqArg.name} argument`
        });
      }
    }

    // Validate argument types
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
    return commands
      .filter(cmd => cmd.startsWith(partial))
      .sort((a, b) => a.length - b.length)
      .slice(0, 10);
  }

  private tokenizeInput(input: string): string[] {
    // Smart tokenization that handles quoted strings
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
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

  private extractArgsAndFlags(tokens: string[]): { arguments: CommandArgument[], flags: CommandFlag[] } {
    const arguments: CommandArgument[] = [];
    const flags: CommandFlag[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.startsWith('--')) {
        // Long flag
        const [name, value] = token.slice(2).split('=');
        flags.push({
          name,
          value: value || true,
          description: this.getFlagDescription(name)
        });
      } else if (token.startsWith('-')) {
        // Short flag
        const name = token.slice(1);
        flags.push({
          name,
          value: true,
          shorthand: name,
          description: this.getFlagDescription(name)
        });
      } else {
        // Positional argument
        arguments.push({
          name: `arg${arguments.length}`,
          value: token,
          type: this.inferArgumentType(token),
          required: false,
          validated: false
        });
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
    // Cache simple, valid commands
    return command.arguments.length <= 3 && 
           command.flags.length <= 5;
  }

  private updateMetrics(parseTime: number, success: boolean, cached: boolean): void {
    this.metrics.totalCommandsParsed++;
    this.metrics.avgParseTime = (this.metrics.avgParseTime + parseTime) / 2;
    this.metrics.maxParseTime = Math.max(this.metrics.maxParseTime, parseTime);
    
    if (success) {
      const successCount = this.metrics.totalCommandsParsed * this.metrics.parseSuccessRate + 1;
      this.metrics.parseSuccessRate = successCount / this.metrics.totalCommandsParsed;
    }
    
    if (cached) {
      const cacheHits = this.metrics.totalCommandsParsed * this.metrics.autoCompletionHitRate + 1;
      this.metrics.autoCompletionHitRate = cacheHits / this.metrics.totalCommandsParsed;
    }
    
    this.metrics.lastUpdated = Date.now();
  }

  getParsingMetrics(): ParsingMetrics {
    return { ...this.metrics };
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

  // Helper methods (implementation details)
  private isValidCommand(name: string): boolean {
    const validCommands = ['analyze', 'optimize', 'review', 'moa', 'help'];
    return validCommands.includes(name);
  }

  private suggestSimilarCommand(name: string): string {
    // Simple similarity algorithm
    const commands = ['analyze', 'optimize', 'review', 'moa', 'help'];
    return commands.reduce((best, cmd) => {
      const distance = this.levenshteinDistance(name, cmd);
      const bestDistance = this.levenshteinDistance(name, best);
      return distance < bestDistance ? cmd : best;
    });
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[b.length][a.length];
  }

  private getRequiredArguments(commandName: string): ArgumentDefinition[] {
    // Command-specific required arguments
    const requirements: Record<string, ArgumentDefinition[]> = {
      analyze: [{ name: 'code', type: 'string', required: true, description: 'Code to analyze' }],
      optimize: [{ name: 'code', type: 'string', required: true, description: 'Code to optimize' }],
      review: [{ name: 'code', type: 'string', required: true, description: 'Code to review' }],
      moa: [{ name: 'prompt', type: 'string', required: true, description: 'Prompt for MOA processing' }]
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
        if (typeof arg.value === 'string' && !['true', 'false'].includes(arg.value.toLowerCase())) {
          return {
            valid: false,
            message: `Expected boolean but got: ${arg.value}`,
            suggestedFix: 'Use true or false'
          };
        }
        break;
    }
    
    return { valid: true, message: 'Valid' };
  }

  private inferArgumentType(value: string): 'string' | 'number' | 'boolean' | 'code' | 'path' {
    if (value === 'true' || value === 'false') return 'boolean';
    if (!isNaN(Number(value))) return 'number';
    if (value.includes('/') || value.includes('\\')) return 'path';
    if (value.includes('{') || value.includes('function') || value.includes('class')) return 'code';
    return 'string';
  }

  private getFlagDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'verbose': 'Enable verbose output',
      'format': 'Output format',
      'depth': 'Analysis depth',
      'help': 'Show help information'
    };
    
    return descriptions[name] || 'Flag option';
  }

  private getAllCommandNames(): string[] {
    return ['analyze', 'optimize', 'review', 'moa', 'help'];
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadUserPreferences(): Promise<UserPreferences> {
    // Load from user config file or defaults
    return {
      theme: {
        primary: '#00ff00',
        secondary: '#ffffff',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
        info: '#00ffff'
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
```

### 2. Command Registry Implementation

```typescript
export class F8CommandRegistry implements CommandRegistry {
  private commands: Map<string, SlashCommand> = new Map();
  private categories: Map<CommandCategory, SlashCommand[]> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.initializeBuiltInCommands();
  }

  async registerCommand(command: SlashCommand): Promise<void> {
    // Register main command
    this.commands.set(command.name, command);
    
    // Register aliases
    for (const alias of command.aliases) {
      this.aliases.set(alias, command.name);
    }
    
    // Add to category
    if (!this.categories.has(command.category)) {
      this.categories.set(command.category, []);
    }
    this.categories.get(command.category)!.push(command);
    
    console.log(`📝 Registered command: /${command.name} (${command.category})`);
  }

  findCommand(name: string): SlashCommand | null {
    // Check direct command name
    if (this.commands.has(name)) {
      return this.commands.get(name)!;
    }
    
    // Check aliases
    if (this.aliases.has(name)) {
      const realName = this.aliases.get(name)!;
      return this.commands.get(realName)!;
    }
    
    return null;
  }

  getAllCommands(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(category: CommandCategory): SlashCommand[] {
    return this.categories.get(category) || [];
  }

  generateHelp(commandName?: string): HelpContent {
    if (commandName) {
      const command = this.findCommand(commandName);
      if (!command) {
        throw new Error(`Command not found: ${commandName}`);
      }
      
      return this.generateCommandHelp(command);
    }
    
    return this.generateFullHelp();
  }

  private generateCommandHelp(command: SlashCommand): HelpContent {
    return {
      title: `/${command.name}`,
      description: command.description,
      usage: command.usage,
      arguments: command.arguments.map(arg => ({
        name: arg.name,
        description: arg.description,
        required: arg.required,
        type: arg.type,
        defaultValue: arg.defaultValue
      })),
      flags: command.flags.map(flag => ({
        name: flag.name,
        description: flag.description,
        shorthand: flag.shorthand,
        type: flag.type,
        defaultValue: flag.defaultValue
      })),
      examples: command.examples,
      seeAlso: this.getSeeAlsoCommands(command),
      metadata: {
        lastUpdated: Date.now(),
        version: command.metadata.version,
        category: command.category
      }
    };
  }

  private generateFullHelp(): HelpContent {
    const categories = Array.from(this.categories.keys());
    const description = `Available Commands:\n\n${categories.map(cat => 
      `${cat.toUpperCase()}:\n${this.getCommandsByCategory(cat)
        .map(cmd => `  /${cmd.name} - ${cmd.description}`)
        .join('\n')}`
    ).join('\n\n')}`;

    return {
      title: 'F8 Slash Commands Help',
      description,
      usage: 'Use /help <command> for detailed help on a specific command',
      arguments: [],
      flags: [],
      examples: [
        { description: 'Show help for analyze command', command: '/help analyze' },
        { description: 'List all commands', command: '/help' }
      ],
      seeAlso: [],
      metadata: {
        lastUpdated: Date.now(),
        version: '1.0.0',
        category: 'help'
      }
    };
  }

  private getSeeAlsoCommands(command: SlashCommand): string[] {
    // Find related commands in the same category
    return this.getCommandsByCategory(command.category)
      .filter(cmd => cmd.name !== command.name)
      .map(cmd => cmd.name)
      .slice(0, 3);
  }

  private initializeBuiltInCommands(): void {
    // Register core built-in commands
    const builtInCommands: SlashCommand[] = [
      {
        name: 'analyze',
        aliases: ['analyse', 'ast'],
        description: 'Analyze code using AST analysis and MOA agents',
        category: 'analysis',
        usage: '/analyze <code> [--type=ast|performance|quality|security] [--depth=shallow|deep|comprehensive] [--format=json|markdown|interactive]',
        examples: [
          {
            description: 'Analyze JavaScript function',
            command: '/analyze "function hello() { return \\"world\\"; }" --type=ast',
            expectedOutput: 'AST analysis with function structure'
          },
          {
            description: 'Deep performance analysis',
            command: '/analyze ./src/app.js --type=performance --depth=deep',
            expectedOutput: 'Performance bottlenecks and optimization suggestions'
          }
        ],
        arguments: [
          {
            name: 'code',
            description: 'Code to analyze (string or file path)',
            required: true,
            type: 'string',
            validation: (value: any) => typeof value === 'string' && value.length > 0
          }
        ],
        flags: [
          {
            name: 'type',
            description: 'Type of analysis to perform',
            shorthand: 't',
            type: 'string',
            defaultValue: 'ast',
            validation: (value: any) => ['ast', 'performance', 'quality', 'security'].includes(value)
          },
          {
            name: 'depth',
            description: 'Depth of analysis',
            shorthand: 'd',
            type: 'string',
            defaultValue: 'shallow',
            validation: (value: any) => ['shallow', 'deep', 'comprehensive'].includes(value)
          },
          {
            name: 'format',
            description: 'Output format',
            shorthand: 'f',
            type: 'string',
            defaultValue: 'markdown',
            validation: (value: any) => ['json', 'markdown', 'interactive'].includes(value)
          }
        ],
        handler: new AnalyzeCommandHandler(),
        metadata: {
          version: '1.0.0',
          author: 'F8 System',
          performanceHints: [
            {
              operation: 'ast-parsing',
              optimizationStrategy: 'cache-parsed-trees',
              expectedImprovement: '60% faster for repeated analysis',
              conditions: ['same file analyzed multiple times']
            }
          ],
          integration: {
            requiredAgents: ['analyst', 'researcher'],
            optionalAgents: ['coder'],
            hookBindings: [
              { hookType: 'pre-edit', phase: 'pre', required: false, timeout: 30 },
              { hookType: 'post-edit', phase: 'post', required: true, timeout: 50 }
            ],
            cacheStrategy: 'hybrid',
            timeoutMs: 5000
          }
        }
      },
      
      {
        name: 'optimize',
        aliases: ['opt', 'perf'],
        description: 'Optimize code for performance, memory, or readability',
        category: 'optimization',
        usage: '/optimize <code> [--goals=performance,memory,readability] [--aggressiveness=conservative|moderate|aggressive]',
        examples: [
          {
            description: 'Optimize for performance',
            command: '/optimize "for(let i=0; i<arr.length; i++)" --goals=performance',
            expectedOutput: 'Optimized loop with performance improvements'
          }
        ],
        arguments: [
          {
            name: 'code',
            description: 'Code to optimize',
            required: true,
            type: 'string',
            validation: (value: any) => typeof value === 'string' && value.length > 0
          }
        ],
        flags: [
          {
            name: 'goals',
            description: 'Optimization goals (comma-separated)',
            shorthand: 'g',
            type: 'string',
            defaultValue: 'performance',
            validation: (value: any) => {
              const goals = value.split(',');
              return goals.every((goal: string) => 
                ['performance', 'memory', 'readability', 'maintainability'].includes(goal.trim())
              );
            }
          },
          {
            name: 'aggressiveness',
            description: 'Optimization aggressiveness level',
            shorthand: 'a',
            type: 'string',
            defaultValue: 'moderate',
            validation: (value: any) => ['conservative', 'moderate', 'aggressive'].includes(value)
          }
        ],
        handler: new OptimizeCommandHandler(),
        metadata: {
          version: '1.0.0',
          author: 'F8 System',
          performanceHints: [
            {
              operation: 'optimization-analysis',
              optimizationStrategy: 'parallel-goal-processing',
              expectedImprovement: '40% faster for multiple goals',
              conditions: ['multiple optimization goals specified']
            }
          ],
          integration: {
            requiredAgents: ['optimizer', 'coder'],
            optionalAgents: ['analyst'],
            hookBindings: [
              { hookType: 'pre-command', phase: 'pre', required: true, timeout: 20 }
            ],
            cacheStrategy: 'memory',
            timeoutMs: 8000
          }
        }
      },

      {
        name: 'review',
        aliases: ['rev', 'check'],
        description: 'Review code quality, security, and best practices',
        category: 'review',
        usage: '/review <code> [--criteria=code-quality,security,performance] [--reviewers=analyst,validator] [--format=detailed|summary]',
        examples: [
          {
            description: 'Security-focused code review',
            command: '/review ./auth.js --criteria=security --format=detailed',
            expectedOutput: 'Detailed security analysis with recommendations'
          }
        ],
        arguments: [
          {
            name: 'code',
            description: 'Code to review',
            required: true,
            type: 'string',
            validation: (value: any) => typeof value === 'string' && value.length > 0
          }
        ],
        flags: [
          {
            name: 'criteria',
            description: 'Review criteria (comma-separated)',
            shorthand: 'c',
            type: 'string',
            defaultValue: 'code-quality,best-practices',
            validation: (value: any) => {
              const criteria = value.split(',');
              return criteria.every((criterion: string) => 
                ['code-quality', 'security', 'performance', 'best-practices', 'maintainability'].includes(criterion.trim())
              );
            }
          },
          {
            name: 'reviewers',
            description: 'Agent types to use for review',
            shorthand: 'r',
            type: 'string',
            defaultValue: 'analyst,validator',
            validation: (value: any) => {
              const reviewers = value.split(',');
              return reviewers.every((reviewer: string) => 
                ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'validator'].includes(reviewer.trim())
              );
            }
          },
          {
            name: 'format',
            description: 'Review output format',
            shorthand: 'f',
            type: 'string',
            defaultValue: 'detailed',
            validation: (value: any) => ['detailed', 'summary', 'checklist'].includes(value)
          }
        ],
        handler: new ReviewCommandHandler(),
        metadata: {
          version: '1.0.0',
          author: 'F8 System',
          performanceHints: [
            {
              operation: 'multi-criteria-review',
              optimizationStrategy: 'parallel-reviewer-execution',
              expectedImprovement: '50% faster for multiple reviewers',
              conditions: ['multiple reviewers specified']
            }
          ],
          integration: {
            requiredAgents: ['validator'],
            optionalAgents: ['analyst', 'researcher', 'coder'],
            hookBindings: [
              { hookType: 'pre-task', phase: 'pre', required: true, timeout: 40 },
              { hookType: 'post-task', phase: 'post', required: true, timeout: 30 }
            ],
            cacheStrategy: 'disk',
            timeoutMs: 12000
          }
        }
      },

      {
        name: 'moa',
        aliases: ['consensus', 'agents'],
        description: 'Direct MOA consensus processing with custom prompts',
        category: 'moa',
        usage: '/moa <prompt> [--agents=researcher,analyst,coder] [--consensus=0.7] [--template=analysis|optimization]',
        examples: [
          {
            description: 'Get consensus on architecture decision',
            command: '/moa "Should we use microservices or monolith?" --agents=researcher,analyst --consensus=0.8',
            expectedOutput: 'Agent consensus with confidence scores'
          }
        ],
        arguments: [
          {
            name: 'prompt',
            description: 'Prompt for MOA processing',
            required: true,
            type: 'string',
            validation: (value: any) => typeof value === 'string' && value.length > 0
          }
        ],
        flags: [
          {
            name: 'agents',
            description: 'Specific agents to use (comma-separated)',
            shorthand: 'a',
            type: 'string',
            defaultValue: 'researcher,analyst,coder',
            validation: (value: any) => {
              const agents = value.split(',');
              return agents.every((agent: string) => 
                ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'validator'].includes(agent.trim())
              );
            }
          },
          {
            name: 'consensus',
            description: 'Consensus threshold (0.0-1.0)',
            shorthand: 's',
            type: 'number',
            defaultValue: 0.7,
            validation: (value: any) => {
              const num = Number(value);
              return !isNaN(num) && num >= 0.0 && num <= 1.0;
            }
          },
          {
            name: 'template',
            description: 'Prompt template to use',
            shorthand: 't',
            type: 'string',
            validation: (value: any) => ['analysis', 'optimization', 'review', 'custom'].includes(value)
          }
        ],
        handler: new MOACommandHandler(),
        metadata: {
          version: '1.0.0',
          author: 'F8 System',
          performanceHints: [
            {
              operation: 'consensus-building',
              optimizationStrategy: 'parallel-agent-processing',
              expectedImprovement: '70% faster with parallel execution',
              conditions: ['multiple agents specified']
            }
          ],
          integration: {
            requiredAgents: ['coordinator'],
            optionalAgents: ['researcher', 'coder', 'analyst', 'optimizer', 'validator'],
            hookBindings: [
              { hookType: 'mcp-request', phase: 'pre', required: true, timeout: 50 },
              { hookType: 'mcp-response', phase: 'post', required: true, timeout: 30 }
            ],
            cacheStrategy: 'hybrid',
            timeoutMs: 15000
          }
        }
      },

      {
        name: 'help',
        aliases: ['h', '?'],
        description: 'Show help information for commands',
        category: 'help',
        usage: '/help [command] [--interactive] [--search=query]',
        examples: [
          {
            description: 'Show help for specific command',
            command: '/help analyze',
            expectedOutput: 'Detailed help for the analyze command'
          },
          {
            description: 'Interactive help mode',
            command: '/help --interactive',
            expectedOutput: 'Step-by-step interactive help'
          },
          {
            description: 'Search for commands',
            command: '/help --search=optimize',
            expectedOutput: 'Commands related to optimization'
          }
        ],
        arguments: [
          {
            name: 'command',
            description: 'Specific command to get help for',
            required: false,
            type: 'string',
            validation: (value: any) => !value || typeof value === 'string'
          }
        ],
        flags: [
          {
            name: 'interactive',
            description: 'Launch interactive help mode',
            shorthand: 'i',
            type: 'boolean',
            defaultValue: false
          },
          {
            name: 'search',
            description: 'Search for commands by keyword',
            shorthand: 's',
            type: 'string',
            validation: (value: any) => !value || typeof value === 'string'
          }
        ],
        handler: new HelpCommandHandler(),
        metadata: {
          version: '1.0.0',
          author: 'F8 System',
          performanceHints: [
            {
              operation: 'help-generation',
              optimizationStrategy: 'template-caching',
              expectedImprovement: '80% faster for repeated help requests',
              conditions: ['same help content requested multiple times']
            }
          ],
          integration: {
            requiredAgents: [],
            optionalAgents: [],
            hookBindings: [],
            cacheStrategy: 'memory',
            timeoutMs: 2000
          }
        }
      }
    ];

    // Register all built-in commands
    builtInCommands.forEach(command => {
      this.registerCommand(command);
    });
  }
}
```

## Command Handler Implementations

### 1. Analyze Command Handler

```typescript
class AnalyzeCommandHandler implements CommandHandler {
  async execute(context: CommandExecutionContext): Promise<CommandResult> {
    const { command, moaCoordinator, hookManager, cliInterface } = context;
    const startTime = performance.now();

    try {
      // Extract command arguments
      const code = command.arguments[0]?.value as string;
      const type = this.getFlagValue(command, 'type', 'ast');
      const depth = this.getFlagValue(command, 'depth', 'shallow');
      const format = this.getFlagValue(command, 'format', 'markdown');

      // Trigger pre-command hooks
      await hookManager.processHook({
        type: 'pre-command',
        phase: 'pre',
        operation: 'command-execute',
        context: {
          operationType: 'command-execute',
          command: command.name,
          sessionId: command.context.sessionId,
          environment: command.context.environment,
          metadata: { commandArgs: command.arguments }
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      // Determine analysis strategy based on parameters
      const analysisPrompt = this.buildAnalysisPrompt(code, type, depth);
      const requiredAgents = this.selectAgentsForAnalysis(type);

      // Execute MOA analysis
      const moaRequest: MOARequest = {
        id: `analyze-${Date.now()}`,
        prompt: analysisPrompt,
        context: {
          code,
          analysisType: type,
          depth,
          format
        },
        requiredAgentTypes: requiredAgents,
        consensusThreshold: 0.75,
        astAnalysis: type === 'ast' || type === 'comprehensive',
        usePromptTemplate: type === 'performance' ? 'optimization' : 'analysis'
      };

      const moaResponse = await moaCoordinator.processRequest(moaRequest);

      // Format output based on requested format
      const formattedResult = await this.formatAnalysisResult(moaResponse, format);

      // Trigger post-command hooks
      await hookManager.processHook({
        type: 'post-command',
        phase: 'post',
        operation: 'command-execute',
        context: {
          operationType: 'command-execute',
          command: command.name,
          sessionId: command.context.sessionId,
          environment: command.context.environment,
          metadata: { 
            result: formattedResult,
            processingTime: moaResponse.processingTime
          }
        },
        timestamp: Date.now(),
        priority: 'medium'
      });

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        data: formattedResult,
        message: `Analysis completed successfully (${executionTime.toFixed(2)}ms)`,
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
          }
        },
        metadata: {
          executionTime,
          commandName: 'analyze',
          timestamp: Date.now()
        }
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        data: null,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: [
          'Check if the code syntax is valid',
          'Try with a different analysis type',
          'Use --help analyze for usage information'
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
    
    if (args.length === 0 || !args[0]?.value) {
      errors.push({
        code: 'MISSING_CODE_ARGUMENT',
        message: 'Code argument is required',
        suggestedFix: 'Provide code as first argument: /analyze "your code here"'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      suggestions: [],
      validatedAt: Date.now()
    };
  }

  getHelp(): HelpContent {
    return {
      title: '/analyze',
      description: 'Analyze code using AST analysis and MOA agents',
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
          type: 'string',
          defaultValue: 'ast'
        },
        {
          name: 'depth',
          description: 'Depth of analysis',
          type: 'string',
          defaultValue: 'shallow'
        },
        {
          name: 'format',
          description: 'Output format',
          type: 'string',
          defaultValue: 'markdown'
        }
      ],
      examples: [
        {
          description: 'Analyze JavaScript function',
          command: '/analyze "function hello() { return \\"world\\"; }" --type=ast'
        },
        {
          description: 'Deep performance analysis',
          command: '/analyze ./src/app.js --type=performance --depth=deep'
        }
      ],
      seeAlso: ['optimize', 'review'],
      metadata: {
        lastUpdated: Date.now(),
        version: '1.0.0',
        category: 'analysis'
      }
    };
  }

  canHandle(command: ParsedCommand): boolean {
    return command.name === 'analyze' || 
           command.name === 'analyse' || 
           command.name === 'ast';
  }

  private buildAnalysisPrompt(code: string, type: string, depth: string): string {
    const basePrompt = `Analyze the following code:

\`\`\`
${code}
\`\`\`

`;

    switch (type) {
      case 'ast':
        return basePrompt + `Provide ${depth} AST analysis including:
- Syntax tree structure
- Node types and relationships
- Scoping and variable usage
- Function and class definitions`;
        
      case 'performance':
        return basePrompt + `Provide ${depth} performance analysis including:
- Time complexity analysis
- Memory usage patterns
- Potential bottlenecks
- Optimization opportunities`;
        
      case 'quality':
        return basePrompt + `Provide ${depth} code quality analysis including:
- Code complexity metrics
- Maintainability assessment
- Code smell detection
- Best practices compliance`;
        
      case 'security':
        return basePrompt + `Provide ${depth} security analysis including:
- Vulnerability assessment
- Input validation checks
- Authentication/authorization issues
- Secure coding practices`;
        
      default:
        return basePrompt + `Provide comprehensive analysis covering structure, performance, quality, and security aspects.`;
    }
  }

  private selectAgentsForAnalysis(type: string): AgentType[] {
    const baseAgents: AgentType[] = ['analyst', 'researcher'];
    
    switch (type) {
      case 'ast':
        return [...baseAgents, 'coder'];
      case 'performance':
        return [...baseAgents, 'optimizer'];
      case 'quality':
        return [...baseAgents, 'validator'];
      case 'security':
        return [...baseAgents, 'validator', 'researcher'];
      default:
        return [...baseAgents, 'coder', 'optimizer'];
    }
  }

  private async formatAnalysisResult(moaResponse: MOAResponse, format: string): Promise<any> {
    switch (format) {
      case 'json':
        return {
          analysis: moaResponse.result,
          agents: moaResponse.agentResponses,
          metadata: moaResponse.metadata,
          astAnalysis: moaResponse.astAnalysis
        };
        
      case 'interactive':
        return {
          type: 'interactive',
          sections: this.createInteractiveSections(moaResponse),
          navigation: true
        };
        
      case 'markdown':
      default:
        return this.createMarkdownReport(moaResponse);
    }
  }

  private createMarkdownReport(moaResponse: MOAResponse): string {
    const sections = [
      '# Code Analysis Report',
      '',
      `**Analysis completed at:** ${new Date().toISOString()}`,
      `**Processing time:** ${moaResponse.processingTime}ms`,
      `**Agents used:** ${moaResponse.agentResponses.length}`,
      `**Consensus reached:** ${moaResponse.metadata.consensusReached ? 'Yes' : 'No'}`,
      '',
      '## Results',
      '',
      moaResponse.result.content,
      '',
      '## Agent Responses',
      ''
    ];

    moaResponse.agentResponses.forEach(response => {
      sections.push(`### ${response.metadata.agentName} (${response.metadata.agentType})`);
      sections.push(`**Confidence:** ${(response.confidence * 100).toFixed(1)}%`);
      sections.push(`**Response Time:** ${response.metadata.responseTime}ms`);
      sections.push('');
      sections.push(response.response);
      sections.push('');
      sections.push(`**Reasoning:** ${response.reasoning}`);
      sections.push('');
    });

    if (moaResponse.astAnalysis) {
      sections.push('## AST Analysis');
      sections.push('');
      sections.push('```json');
      sections.push(JSON.stringify(moaResponse.astAnalysis, null, 2));
      sections.push('```');
    }

    return sections.join('\n');
  }

  private createInteractiveSections(moaResponse: MOAResponse): any[] {
    return [
      {
        title: 'Summary',
        type: 'text',
        content: moaResponse.result.content
      },
      {
        title: 'Agent Details',
        type: 'expandable',
        items: moaResponse.agentResponses.map(response => ({
          title: `${response.metadata.agentName} (${(response.confidence * 100).toFixed(1)}%)`,
          content: response.response,
          metadata: response.metadata
        }))
      },
      {
        title: 'AST Analysis',
        type: 'tree',
        data: moaResponse.astAnalysis,
        expandable: true
      }
    ];
  }

  private getFlagValue(command: ParsedCommand, flagName: string, defaultValue: string): string {
    const flag = command.flags.find(f => f.name === flagName);
    return flag ? String(flag.value) : defaultValue;
  }
}
```

## Integration Patterns with F1 and F2

### 1. F1 MOA System Integration

```typescript
export class F8MOAIntegration implements MOAIntegration {
  constructor(
    private moaCoordinator: MOACoordinator,
    private commandRegistry: F8CommandRegistry
  ) {}

  async processMOACommand(command: ParsedCommand): Promise<MOACommandResult> {
    const startTime = performance.now();
    
    // Convert command to MOA request
    const moaRequest = await this.convertToMOARequest(command);
    
    // Process through F1 MOA system
    const moaResponse = await this.moaCoordinator.processRequest(moaRequest);
    
    const processingTime = performance.now() - startTime;
    
    return {
      moaResponse,
      processingTime,
      agentsUsed: moaRequest.requiredAgentTypes || [],
      consensusReached: moaResponse.metadata.consensusReached,
      cacheUsed: false,
      metadata: {
        requestId: moaRequest.id,
        commandName: command.name,
        accuracy: moaResponse.result.confidence,
        confidence: moaResponse.result.confidence
      }
    };
  }

  selectOptimalAgents(commandType: string): AgentType[] {
    const agentMapping: Record<string, AgentType[]> = {
      'analyze': ['analyst', 'researcher', 'coder'],
      'optimize': ['optimizer', 'coder', 'analyst'],
      'review': ['validator', 'analyst', 'researcher'],
      'moa': ['coordinator', 'researcher', 'analyst']
    };
    
    return agentMapping[commandType] || ['researcher', 'analyst'];
  }

  convertCommandContext(context: CommandContext): MOARequestContext {
    return {
      originalCommand: context.workingDirectory,
      targetCode: this.extractCodeFromContext(context),
      analysisType: this.inferAnalysisType(context),
      optimizationGoals: this.extractOptimizationGoals(context),
      reviewCriteria: this.extractReviewCriteria(context)
    };
  }

  getCachedResult(command: ParsedCommand): MOACommandResult | null {
    // Implement caching logic
    return null;
  }

  private async convertToMOARequest(command: ParsedCommand): Promise<MOARequest> {
    const slashCommand = this.commandRegistry.findCommand(command.name);
    if (!slashCommand) {
      throw new Error(`Command not found: ${command.name}`);
    }

    return {
      id: `slash-${command.name}-${Date.now()}`,
      prompt: this.buildPromptFromCommand(command),
      context: this.convertCommandContext(command.context),
      requiredAgentTypes: slashCommand.metadata.integration.requiredAgents,
      consensusThreshold: 0.7,
      astAnalysis: command.name === 'analyze',
      usePromptTemplate: this.selectPromptTemplate(command.name)
    };
  }

  private buildPromptFromCommand(command: ParsedCommand): string {
    // Build appropriate prompt based on command and arguments
    switch (command.name) {
      case 'analyze':
        return `Analyze the following code: ${command.arguments[0]?.value}`;
      case 'optimize':
        return `Optimize the following code: ${command.arguments[0]?.value}`;
      case 'review':
        return `Review the following code: ${command.arguments[0]?.value}`;
      case 'moa':
        return command.arguments[0]?.value as string;
      default:
        return `Process the following: ${command.arguments[0]?.value}`;
    }
  }

  private selectPromptTemplate(commandName: string): string | undefined {
    const templateMapping: Record<string, string> = {
      'analyze': 'analysis',
      'optimize': 'optimization',
      'review': 'review'
    };
    
    return templateMapping[commandName];
  }

  private extractCodeFromContext(context: CommandContext): string | undefined {
    // Extract code from context metadata
    return undefined;
  }

  private inferAnalysisType(context: CommandContext): string | undefined {
    // Infer analysis type from context
    return undefined;
  }

  private extractOptimizationGoals(context: CommandContext): string[] | undefined {
    // Extract optimization goals from context
    return undefined;
  }

  private extractReviewCriteria(context: CommandContext): string[] | undefined {
    // Extract review criteria from context
    return undefined;
  }
}
```

### 2. F2 Hook System Integration

```typescript
export class F8HookIntegration implements HookIntegration {
  constructor(
    private hookManager: F2HookManager,
    private commandRegistry: F8CommandRegistry
  ) {}

  async triggerPreCommandHooks(command: ParsedCommand): Promise<HookResult[]> {
    const event: HookEvent = {
      type: 'pre-command',
      phase: 'pre',
      operation: 'command-execute',
      context: {
        operationType: 'command-execute',
        command: command.name,
        sessionId: command.context.sessionId,
        environment: command.context.environment,
        metadata: {
          arguments: command.arguments,
          flags: command.flags
        }
      },
      timestamp: Date.now(),
      priority: 'high'
    };

    return [await this.hookManager.processHook(event)];
  }

  async triggerPostCommandHooks(result: CommandResult): Promise<HookResult[]> {
    const event: HookEvent = {
      type: 'post-command',
      phase: 'post',
      operation: 'command-execute',
      context: {
        operationType: 'command-execute',
        command: result.metadata.commandName,
        sessionId: 'current-session',
        environment: 'production',
        metadata: {
          result: result.data,
          success: result.success,
          executionTime: result.metadata.executionTime
        }
      },
      timestamp: Date.now(),
      priority: 'medium'
    };

    return [await this.hookManager.processHook(event)];
  }

  async bindHooksToCommand(commandName: string, hooks: Hook[]): Promise<void> {
    // Register command-specific hooks
    for (const hook of hooks) {
      await this.hookManager.registry.registerHook({
        ...hook,
        metadata: {
          ...hook.metadata,
          boundToCommand: commandName
        }
      });
    }
  }

  async emitCommandEvent(event: CommandEvent): Promise<void> {
    const hookEvent: HookEvent = {
      type: event.type === 'command-started' ? 'pre-command' : 'post-command',
      phase: event.type === 'command-started' ? 'pre' : 'post',
      operation: 'command-execute',
      context: {
        operationType: 'command-execute',
        sessionId: 'current-session',
        environment: 'production',
        metadata: event
      },
      timestamp: event.timestamp,
      priority: 'medium'
    };

    await this.hookManager.processHook(hookEvent);
  }

  getHookPerformanceMetrics(): HookIntegrationMetrics {
    const hookMetrics = this.hookManager.getPerformanceMetrics();
    
    return {
      avgHookProcessingTime: hookMetrics.avgProcessingTime,
      hooksTriggeredPerCommand: 2, // Pre and post hooks
      hookSuccessRate: hookMetrics.successRate,
      commandsWithHooks: this.getCommandsWithHooksCount(),
      totalHookExecutions: hookMetrics.totalHooksProcessed
    };
  }

  private getCommandsWithHooksCount(): number {
    // Count commands that have hooks bound to them
    return this.commandRegistry.getAllCommands()
      .filter(cmd => cmd.metadata.integration.hookBindings.length > 0)
      .length;
  }
}
```

## CLI Interface Implementation

```typescript
export class F8CLIInterface implements CLIInterface {
  private theme: CLITheme;
  private progressIndicators: Map<string, any> = new Map();

  constructor(theme?: CLITheme) {
    this.theme = theme || this.getDefaultTheme();
  }

  async processInput(input: string): Promise<void> {
    try {
      // Parse and execute command
      const parser = new F8CommandParser();
      const command = await parser.parseCommand(input);
      
      // Validate command
      const registry = new F8CommandRegistry();
      const slashCommand = registry.findCommand(command.name);
      
      if (!slashCommand) {
        await this.displayError({
          code: 'COMMAND_NOT_FOUND',
          message: `Command not found: /${command.name}`,
          suggestions: ['Use /help to see available commands']
        });
        return;
      }

      // Execute command
      const context: CommandExecutionContext = {
        command,
        moaCoordinator: new MOACoordinator(),
        hookManager: new F2HookManager(new MOACoordinator(), {} as any),
        cliInterface: this,
        environment: {
          workingDirectory: process.cwd(),
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      };

      const result = await slashCommand.handler.execute(context);
      await this.displayResult(result);

    } catch (error) {
      await this.displayError({
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestions: ['Check command syntax', 'Use /help for assistance']
      });
    }
  }

  async displayResult(result: CommandResult): Promise<void> {
    if (result.success) {
      console.log(`${this.theme.success}✅ ${result.message}`);
      
      if (result.data) {
        if (typeof result.data === 'string') {
          console.log(result.data);
        } else if (result.data.type === 'interactive') {
          await this.displayInteractiveResult(result.data);
        } else {
          console.log(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.details?.performanceMetrics) {
        console.log(`${this.theme.info}⏱️  Execution time: ${result.metadata.executionTime.toFixed(2)}ms`);
      }
    } else {
      console.log(`${this.theme.error}❌ ${result.message}`);
      
      if (result.suggestions) {
        console.log(`${this.theme.info}💡 Suggestions:`);
        result.suggestions.forEach(suggestion => {
          console.log(`   - ${suggestion}`);
        });
      }
    }
  }

  async displayHelp(help: HelpContent): Promise<void> {
    console.log(`${this.theme.primary}${help.title}`);
    console.log(`${this.theme.secondary}${help.description}`);
    console.log('');
    console.log(`${this.theme.info}Usage: ${help.usage}`);
    console.log('');

    if (help.arguments.length > 0) {
      console.log(`${this.theme.primary}Arguments:`);
      help.arguments.forEach(arg => {
        const required = arg.required ? '(required)' : '(optional)';
        console.log(`  ${arg.name} ${required} - ${arg.description}`);
      });
      console.log('');
    }

    if (help.flags.length > 0) {
      console.log(`${this.theme.primary}Flags:`);
      help.flags.forEach(flag => {
        const shorthand = flag.shorthand ? `-${flag.shorthand}, ` : '';
        console.log(`  ${shorthand}--${flag.name} - ${flag.description}`);
      });
      console.log('');
    }

    if (help.examples.length > 0) {
      console.log(`${this.theme.primary}Examples:`);
      help.examples.forEach(example => {
        console.log(`  ${example.description}:`);
        console.log(`  ${this.theme.secondary}${example.command}`);
        console.log('');
      });
    }

    if (help.seeAlso.length > 0) {
      console.log(`${this.theme.info}See also: ${help.seeAlso.map(cmd => `/${cmd}`).join(', ')}`);
    }
  }

  async displayError(error: CommandError): Promise<void> {
    console.error(`${this.theme.error}❌ Error: ${error.message}`);
    
    if (error.suggestions) {
      console.log(`${this.theme.info}💡 Suggestions:`);
      error.suggestions.forEach(suggestion => {
        console.log(`   - ${suggestion}`);
      });
    }
  }

  async promptForInput(prompt: InputPrompt): Promise<string> {
    // Implement interactive prompting
    process.stdout.write(`${this.theme.primary}${prompt.message}: `);
    
    return new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }

  showProgress(operation: string): ProgressIndicator {
    const id = `progress-${Date.now()}`;
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let index = 0;
    
    const interval = setInterval(() => {
      process.stdout.write(`\r${spinner[index]} ${operation}...`);
      index = (index + 1) % spinner.length;
    }, 100);

    const indicator = {
      stop: () => {
        clearInterval(interval);
        process.stdout.write(`\r${this.theme.success}✅ ${operation} completed\n`);
        this.progressIndicators.delete(id);
      },
      update: (message: string) => {
        operation = message;
      }
    };

    this.progressIndicators.set(id, indicator);
    return indicator;
  }

  enableAutoCompletion(): void {
    // Implement tab completion
    console.log(`${this.theme.info}Auto-completion enabled`);
  }

  setTheme(theme: CLITheme): void {
    this.theme = theme;
  }

  private async displayInteractiveResult(data: any): Promise<void> {
    console.log(`${this.theme.primary}Interactive Result:`);
    
    for (const section of data.sections) {
      console.log(`\n${this.theme.primary}${section.title}:`);
      
      switch (section.type) {
        case 'text':
          console.log(section.content);
          break;
        case 'expandable':
          for (const item of section.items) {
            console.log(`  ${this.theme.secondary}▶ ${item.title}`);
          }
          break;
        case 'tree':
          console.log(JSON.stringify(section.data, null, 2));
          break;
      }
    }
  }

  private getDefaultTheme(): CLITheme {
    return {
      primary: '\x1b[36m',    // Cyan
      secondary: '\x1b[37m',  // White
      success: '\x1b[32m',    // Green
      warning: '\x1b[33m',    // Yellow
      error: '\x1b[31m',      // Red
      info: '\x1b[34m'        // Blue
    };
  }
}
```

## Performance Optimization Strategy

### 1. Command Processing Optimization (<100ms)

- **Fast Path Parsing**: Critical commands bypass complex validation
- **Intelligent Caching**: Cache parsed commands and MOA results
- **Parallel Execution**: Execute hooks and agents concurrently
- **Smart Agent Selection**: Choose optimal agents based on command type

### 2. Memory Usage Optimization

- **Command Result Caching**: Cache frequent command results
- **Lazy Loading**: Load command handlers only when needed
- **Memory Monitoring**: Track and optimize memory usage
- **Garbage Collection**: Automatic cleanup of expired cache entries

### 3. User Experience Optimization

- **Progressive Loading**: Show progress for long-running commands
- **Auto-completion**: Intelligent command and argument suggestions
- **Error Recovery**: Helpful error messages with suggestions
- **Interactive Help**: Step-by-step guidance for complex commands

## Security Considerations

### 1. Command Validation

- **Input Sanitization**: Strict validation of all command inputs
- **Command Whitelist**: Only registered commands are executable
- **Argument Type Checking**: Strong typing for all arguments
- **Permission System**: Role-based access to sensitive commands

### 2. Execution Security

- **Sandboxed Execution**: Commands run in isolated environments
- **Resource Limits**: CPU and memory limits for command execution
- **Audit Logging**: Comprehensive logging of all command executions
- **Error Handling**: Secure error messages without information leakage

## Production Readiness

### 1. Monitoring & Observability

- **Performance Metrics**: Real-time command performance monitoring
- **Usage Analytics**: Track command usage patterns and performance
- **Error Tracking**: Detailed error monitoring and alerting
- **Health Checks**: Automatic system health verification

### 2. Reliability & Resilience

- **Circuit Breaker**: Automatic failure protection for command execution
- **Retry Logic**: Intelligent retry strategies for failed commands
- **Fallback Mechanisms**: Graceful degradation for system failures
- **Load Balancing**: Distribute command processing across instances

### 3. Scalability

- **Horizontal Scaling**: Support for multiple CLI instances
- **Resource Management**: Efficient resource utilization and cleanup
- **Performance Tuning**: Configurable performance parameters
- **Capacity Planning**: Tools for capacity planning and optimization

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- Command Parser with <50ms guarantee
- Command Registry with built-in commands
- Basic CLI interface
- Performance monitoring

### Phase 2: MOA Integration (Week 3)
- F1 MOA system integration
- Agent selection optimization
- Context conversion
- Result caching

### Phase 3: Hook Integration (Week 4)
- F2 Hook system integration
- Pre/post command hooks
- Event publishing
- Performance tracking

### Phase 4: Advanced Features (Week 5-6)
- Interactive help system
- Auto-completion
- Advanced error handling
- Security implementation

### Phase 5: Production Features (Week 7-8)
- Comprehensive monitoring
- Performance optimization
- Security hardening
- Documentation and testing

## Success Metrics

- **Performance**: Command processing <100ms (99th percentile)
- **User Experience**: <50ms help generation, intelligent auto-completion
- **Integration**: Seamless F1/F2 compatibility with <200ms MOA processing
- **Reliability**: 99.9% uptime and command success rate
- **Scalability**: Support for 1000+ concurrent command executions

This architecture provides a robust, high-performance foundation for the F8 Slash-Commands Integration system while maintaining full compatibility with the existing F1 MOA and F2 Hook infrastructures, delivering an intuitive and powerful CLI experience for PPMOA users.