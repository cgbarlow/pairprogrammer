// F8 Slash-Commands Type Definitions
// Performance-optimized types for <100ms command processing

import type { 
  Agent, 
  AgentType, 
  MOARequest, 
  MOAResponse 
} from '../types/index.js';
import type { 
  HookManager, 
  HookEvent, 
  HookResult 
} from '../hooks/types.js';
import type { MOACoordinator } from '../agents/MOACoordinator.js';

// Core Command Types
export interface ParsedCommand {
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

export interface CommandArgument {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'code' | 'path';
  required: boolean;
  validated: boolean;
}

export interface CommandFlag {
  name: string;
  value?: string | boolean;
  shorthand?: string;
  description: string;
}

export interface CommandContext {
  workingDirectory: string;
  environment: 'development' | 'staging' | 'production';
  sessionId: string;
  userPreferences: UserPreferences;
  timestamp: number;
}

// Command Registry Types
export interface SlashCommand {
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

export interface CommandHandler {
  execute(context: CommandExecutionContext): Promise<CommandResult>;
  validate(args: CommandArgument[]): ValidationResult;
  getHelp(): HelpContent;
  canHandle(command: ParsedCommand): boolean;
}

export interface CommandExecutionContext {
  command: ParsedCommand;
  moaCoordinator: MOACoordinator;
  hookManager: HookManager;
  cliInterface: CLIInterface;
  environment: ExecutionEnvironment;
}

export type CommandCategory = 
  | 'analysis' 
  | 'optimization' 
  | 'review' 
  | 'moa' 
  | 'system' 
  | 'help';

// Result Types
export interface CommandResult {
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

export interface ResultDetails {
  moaAnalysis?: MOACommandResult;
  astAnalysis?: any;
  hookResults?: HookResult[];
  performanceMetrics?: PerformanceMetrics;
}

// MOA Integration Types
export interface MOACommandResult {
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

export interface MOARequestContext {
  originalCommand: string;
  targetCode?: string;
  analysisType?: string;
  optimizationGoals?: string[];
  reviewCriteria?: string[];
  customPrompt?: string;
}

// CLI Interface Types
export interface CLIInterface {
  processInput(input: string): Promise<void>;
  displayResult(result: CommandResult): Promise<void>;
  displayHelp(help: HelpContent): Promise<void>;
  displayError(error: CommandError): Promise<void>;
  promptForInput(prompt: InputPrompt): Promise<string>;
  showProgress(operation: string): ProgressIndicator;
  enableAutoCompletion(): void;
  setTheme(theme: CLITheme): void;
}

export interface CLITheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Help System Types
export interface HelpContent {
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

export interface ArgumentHelp {
  name: string;
  description: string;
  required: boolean;
  type: string;
  defaultValue?: any;
}

export interface FlagHelp {
  name: string;
  description: string;
  shorthand?: string;
  type: string;
  defaultValue?: any;
}

export interface CommandExample {
  description: string;
  command: string;
  expectedOutput?: string;
  notes?: string;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  validatedAt: number;
}

export interface ValidationError {
  code: string;
  message: string;
  argument?: string;
  suggestedFix?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  argument?: string;
}

// Definition Types
export interface ArgumentDefinition {
  name: string;
  description: string;
  required: boolean;
  type: string;
  defaultValue?: any;
  validation?: (value: any) => boolean;
}

export interface FlagDefinition {
  name: string;
  description: string;
  shorthand?: string;
  type: string;
  defaultValue?: any;
  validation?: (value: any) => boolean;
}

// Performance Types
export interface ParsingMetrics {
  avgParseTime: number;
  maxParseTime: number;
  totalCommandsParsed: number;
  parseSuccessRate: number;
  validationSuccessRate: number;
  autoCompletionHitRate: number;
  lastUpdated: number;
}

export interface PerformanceHint {
  operation: string;
  optimizationStrategy: string;
  expectedImprovement: string;
  conditions: string[];
}

export interface PerformanceMetrics {
  commandExecutionTime: number;
  moaProcessingTime?: number;
  hookProcessingTime?: number;
  totalAgentsUsed?: number;
  cacheHitRate?: number;
}

// Integration Types
export interface IntegrationConfig {
  requiredAgents: AgentType[];
  optionalAgents: AgentType[];
  hookBindings: HookBinding[];
  cacheStrategy: CacheStrategy;
  timeoutMs: number;
}

export interface HookBinding {
  hookType: string;
  phase: 'pre' | 'post';
  required: boolean;
  timeout: number;
}

export type CacheStrategy = 'none' | 'memory' | 'disk' | 'hybrid';

// User Preferences
export interface UserPreferences {
  theme: CLITheme;
  autoCompletion: boolean;
  verboseOutput: boolean;
  defaultAgents: AgentType[];
  hookPreferences: HookPreferences;
  performanceReporting: boolean;
}

export interface HookPreferences {
  enablePreHooks: boolean;
  enablePostHooks: boolean;
  autoFormat: boolean;
}

// Error Types
export interface CommandError {
  code: string;
  message: string;
  suggestions?: string[];
  context?: any;
}

// Input Types
export interface InputPrompt {
  message: string;
  type: 'text' | 'number' | 'boolean' | 'choice';
  choices?: string[];
  validation?: (value: string) => boolean;
}

export interface ProgressIndicator {
  stop(): void;
  update(message: string): void;
}

// Environment Types
export interface ExecutionEnvironment {
  workingDirectory: string;
  nodeEnv: string;
  systemInfo?: SystemInfo;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  memoryUsage: NodeJS.MemoryUsage;
}

// Search Types
export interface SearchResult {
  command: SlashCommand;
  relevanceScore: number;
  matchedTerms: string[];
  context: string;
}

// Event Types
export interface CommandEvent {
  type: 'command-started' | 'command-completed' | 'command-failed';
  command: ParsedCommand;
  result?: CommandResult;
  timestamp: number;
  duration?: number;
}

// Hook Integration Types
export interface HookIntegrationMetrics {
  avgHookProcessingTime: number;
  hooksTriggeredPerCommand: number;
  hookSuccessRate: number;
  commandsWithHooks: number;
  totalHookExecutions: number;
}

// Command-Specific Argument Types
export interface AnalysisCommandArgs {
  code: string;
  type: 'ast' | 'performance' | 'quality' | 'security';
  depth: 'shallow' | 'deep' | 'comprehensive';
  format: 'json' | 'markdown' | 'interactive';
}

export interface OptimizationCommandArgs {
  code: string;
  goals: OptimizationGoal[];
  constraints: OptimizationConstraint[];
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
}

export type OptimizationGoal = 
  | 'performance' 
  | 'memory' 
  | 'readability' 
  | 'maintainability';

export interface OptimizationConstraint {
  type: string;
  value: any;
  description: string;
}

export interface ReviewCommandArgs {
  code: string;
  criteria: ReviewCriteria[];
  reviewers: AgentType[];
  format: 'detailed' | 'summary' | 'checklist';
}

export type ReviewCriteria = 
  | 'code-quality' 
  | 'security' 
  | 'performance' 
  | 'best-practices' 
  | 'maintainability';

export interface MOACommandArgs {
  prompt: string;
  agents?: AgentType[];
  consensus?: number;
  template?: string;
  context?: Record<string, any>;
}

// Interface Contracts
export interface CommandParser {
  parseCommand(input: string): Promise<ParsedCommand>;
  validateCommand(command: ParsedCommand): ValidationResult;
  getSuggestions(partial: string): string[];
  getParsingMetrics(): ParsingMetrics;
}

export interface CommandRegistry {
  registerCommand(command: SlashCommand): Promise<void>;
  findCommand(name: string): SlashCommand | null;
  getAllCommands(): SlashCommand[];
  getCommandsByCategory(category: CommandCategory): SlashCommand[];
  generateHelp(commandName?: string): HelpContent;
}

export interface MOAIntegration {
  processMOACommand(command: ParsedCommand): Promise<MOACommandResult>;
  selectOptimalAgents(commandType: string): AgentType[];
  convertCommandContext(context: CommandContext): MOARequestContext;
  getCachedResult(command: ParsedCommand): MOACommandResult | null;
}

export interface HookIntegration {
  triggerPreCommandHooks(command: ParsedCommand): Promise<HookResult[]>;
  triggerPostCommandHooks(result: CommandResult): Promise<HookResult[]>;
  bindHooksToCommand(commandName: string, hooks: any[]): Promise<void>;
  emitCommandEvent(event: CommandEvent): Promise<void>;
  getHookPerformanceMetrics(): HookIntegrationMetrics;
}

export interface HelpSystem {
  generateCommandHelp(commandName: string): HelpContent;
  generateCategoryHelp(category: CommandCategory): HelpContent;
  generateFullHelp(): HelpContent;
  searchCommands(query: string): SearchResult[];
  getSimilarCommands(commandName: string): string[];
  launchInteractiveHelp(): Promise<void>;
  generateUsageExamples(commandName: string): CommandExample[];
}