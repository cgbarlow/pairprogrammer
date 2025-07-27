// F2 Hook System - Core Type Definitions

export interface HookManager {
  // Core processing with sub-50ms guarantee
  processHook(event: HookEvent): Promise<HookResult>;
  
  // Batch processing for efficiency
  processBatch(events: HookEvent[]): Promise<HookResult[]>;
  
  // Performance monitoring
  getPerformanceMetrics(): HookPerformanceMetrics;
  
  // Lifecycle management
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface HookEvent {
  type: HookType;
  phase: 'pre' | 'post';
  operation: OperationType;
  context: HookContext;
  timestamp: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

export interface HookResult {
  success: boolean;
  processingTime: number;
  data?: any;
  errors?: HookError[];
  metadata: HookMetadata;
  cached?: boolean;
}

export interface HookError {
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface HookMetadata {
  hookId: string;
  executionId: string;
  agentsInvolved?: string[];
  cacheHit?: boolean;
  retryCount?: number;
}

// Hook processing performance metrics
export interface HookPerformanceMetrics {
  avgProcessingTime: number;
  maxProcessingTime: number;
  minProcessingTime: number;
  totalHooksProcessed: number;
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
  lastUpdated: number;
  performanceBreakdown: PerformanceBreakdown;
}

export interface PerformanceBreakdown {
  critical: number; // avg time for critical hooks
  high: number;     // avg time for high priority hooks
  medium: number;   // avg time for medium priority hooks
  low: number;      // avg time for low priority hooks
}

// Hook context for coordination
export interface HookContext {
  operationType: OperationType;
  filePath?: string;
  command?: string;
  agentId?: string;
  sessionId: string;
  environment: string;
  userId?: string;
  metadata: Record<string, any>;
}

// Operation types supported by hooks
export type OperationType = 
  | 'file-read' | 'file-write' | 'file-edit'
  | 'command-execute' | 'agent-spawn' | 'agent-coordinate'
  | 'mcp-request' | 'mcp-response'
  | 'session-start' | 'session-end'
  | 'consensus-build' | 'consensus-validate'
  | 'memory-store' | 'memory-retrieve'
  | 'error-handling'
  | 'custom';

// Hook types matching CLAUDE.md specifications
export type HookType = 
  | 'pre-task' | 'post-task'
  | 'pre-edit' | 'post-edit'
  | 'pre-command' | 'post-command'
  | 'pre-search' | 'post-search'
  | 'agent-spawn' | 'agent-coordinate'
  | 'mcp-request' | 'mcp-response'
  | 'session-start' | 'session-end'
  | 'consensus-pre' | 'consensus-post'
  | 'memory-pre' | 'memory-post'
  | 'custom';

export type HookPhase = 'pre' | 'post';

// Hook definition and registration
export interface Hook {
  id: string;
  name: string;
  type: HookType;
  phase: HookPhase;
  priority: number;
  enabled: boolean;
  handler: HookHandler;
  dependencies: string[];
  configuration: HookConfig;
  metadata: HookRegistrationMetadata;
  version: string;
}

export interface HookHandler {
  execute(event: HookEvent): Promise<HookResult>;
  canHandle(event: HookEvent): boolean;
  getMetadata(): HookHandlerMetadata;
  id?: string;
}

export interface HookHandlerMetadata {
  name: string;
  version: string;
  description: string;
  supportedEvents: HookType[];
  performanceHints: PerformanceHint[];
}

export interface PerformanceHint {
  operation: string;
  expectedTime: number;
  cpuIntensive: boolean;
  memoryIntensive: boolean;
}

export interface HookRegistrationMetadata {
  registeredAt: number;
  registeredBy: string;
  source: 'built-in' | 'config' | 'dynamic';
  category: string;
  tags: string[];
}

// Hook configuration
export interface HookConfig {
  timeout: number;
  retries: number;
  fallbackEnabled: boolean;
  cacheEnabled: boolean;
  cacheTTL?: number;
  parallelExecution: boolean;
  dependencies: string[];
  environment: string[];
  conditions: HookCondition[];
}

export interface HookCondition {
  type: 'file-exists' | 'env-var' | 'agent-available' | 'custom';
  condition: string;
  negate?: boolean;
}

// Configuration System Interfaces
export interface ConfigurationSystem {
  // CLAUDE.md integration
  loadClaudeConfig(): Promise<ClaudeConfiguration>;
  
  // hooks.yaml support
  loadHookConfig(): Promise<HookConfiguration>;
  
  // Dynamic reconfiguration
  reloadConfig(): Promise<void>;
  
  // Validation
  validateConfig(): ConfigValidationResult;
  
  // File watching
  watchConfig(callback: ConfigChangeCallback): void;
}

export interface ClaudeConfiguration {
  // Agent configurations
  agents: AgentConfiguration[];
  
  // Swarm settings
  swarm: SwarmConfiguration;
  
  // Hook preferences
  hooks: HookPreferences;
  
  // Performance settings
  performance: PerformanceConfiguration;
  
  // Environment settings
  environment: EnvironmentSettings;
}

export interface AgentConfiguration {
  type: string;
  name: string;
  capabilities: string[];
  hooks: AgentHookBinding[];
  performance: AgentPerformanceConfig;
}

export interface AgentHookBinding {
  hookType: HookType;
  enabled: boolean;
  priority: number;
  configuration: Record<string, any>;
}

export interface AgentPerformanceConfig {
  maxResponseTime: number;
  maxConcurrency: number;
  cacheStrategy: 'none' | 'memory' | 'disk' | 'hybrid';
}

export interface SwarmConfiguration {
  topology: 'mesh' | 'hierarchical' | 'ring' | 'star';
  maxAgents: number;
  strategy: 'balanced' | 'specialized' | 'adaptive';
  coordination: CoordinationConfig;
}

export interface CoordinationConfig {
  consensusThreshold: number;
  maxCoordinationTime: number;
  fallbackStrategy: 'independent' | 'leader' | 'majority';
}

export interface HookPreferences {
  enabled: boolean;
  maxProcessingTime: number;
  parallelExecution: boolean;
  cacheEnabled: boolean;
  defaultPriority: 'critical' | 'high' | 'medium' | 'low';
  errorHandling: ErrorHandlingConfig;
}

export interface ErrorHandlingConfig {
  retryCount: number;
  retryDelay: number;
  fallbackEnabled: boolean;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number;
}

export interface PerformanceConfiguration {
  maxMemoryUsage: number;
  maxCpuUsage: number;
  performanceMonitoring: boolean;
  metricsRetention: number;
  optimizationEnabled: boolean;
}

export interface EnvironmentSettings {
  name: string;
  variables: Record<string, string>;
  features: string[];
  restrictions: string[];
}

export interface HookConfiguration {
  // Hook definitions
  hooks: HookDefinition[];
  
  // Global settings
  settings: GlobalHookSettings;
  
  // Environment-specific configs
  environments: EnvironmentConfiguration[];
  
  // Version and metadata
  version: string;
  metadata: ConfigMetadata;
}

export interface HookDefinition {
  name: string;
  type: HookType;
  phase: HookPhase;
  enabled: boolean;
  priority: number;
  configuration: HookConfig;
  handler: string; // Handler class name or path
  description?: string;
}

export interface GlobalHookSettings {
  maxProcessingTime: number;
  parallelExecution: boolean;
  cacheEnabled: boolean;
  retryPolicy: RetryPolicy;
  circuitBreaker: CircuitBreakerConfig;
  monitoring: MonitoringConfig;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  threshold: number;
  timeout: number;
  resetTimeout: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  tracing: boolean;
}

export interface EnvironmentConfiguration {
  name: string;
  inherits?: string;
  variables: Record<string, string>;
  hooks: HookOverride[];
}

export interface HookOverride {
  name: string;
  enabled?: boolean;
  configuration?: Partial<HookConfig>;
}

export interface ConfigMetadata {
  version: string;
  createdAt: number;
  lastModified: number;
  author: string;
  description: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigError[];
  warnings: ConfigWarning[];
}

export interface ConfigError {
  path: string;
  message: string;
  code: string;
}

export interface ConfigWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export type ConfigChangeCallback = (change: ConfigChange) => void;

export interface ConfigChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  oldValue?: any;
  newValue?: any;
}

// Hook Registry Interfaces
export interface HookRegistry {
  // Hook registration
  registerHook(hook: Hook): Promise<void>;
  unregisterHook(hookId: string): Promise<void>;
  
  // Discovery
  discoverHooks(): Promise<Hook[]>;
  
  // Lifecycle management
  enableHook(hookId: string): Promise<void>;
  disableHook(hookId: string): Promise<void>;
  
  // Querying
  getHooks(filter?: HookFilter): Hook[];
  getHookByType(type: HookType): Hook[];
  getHookById(id: string): Hook | null;
  
  // Dependencies
  resolveDependencies(hooks: Hook[]): Hook[];
  validateDependencies(hook: Hook): DependencyValidationResult;
}

export interface HookFilter {
  type?: HookType;
  phase?: HookPhase;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  enabled?: boolean;
  category?: string;
  tags?: string[];
}

export interface DependencyValidationResult {
  valid: boolean;
  missingDependencies: string[];
  circularDependencies: string[];
}

// Event System Interfaces
export interface EventSystem {
  // Event emission
  emitHookEvent(event: HookEvent): Promise<void>;
  
  // Event subscription
  subscribe(eventType: string, handler: EventHandler): string; // returns subscription id
  unsubscribe(subscriptionId: string): void;
  
  // Batch processing
  emitBatch(events: HookEvent[]): Promise<void>;
  
  // Event history
  getEventHistory(filter?: EventFilter): HookEvent[];
  
  // Event replay
  replayEvents(filter: EventFilter): Promise<void>;
}

export interface EventHandler {
  handle(event: HookEvent): Promise<EventResult>;
  canHandle(event: HookEvent): boolean;
  priority: number;
  id: string;
}

export interface EventResult {
  handled: boolean;
  continue: boolean; // Whether to continue event propagation
  data?: any;
  errors?: Error[];
  processingTime: number;
}

export interface EventFilter {
  type?: HookType;
  operation?: OperationType;
  timeRange?: { start: number; end: number };
  agentId?: string;
  sessionId?: string;
}

// Agent Integration Interfaces
export interface AgentIntegration {
  // Hook agent coordination with F1 MOA
  coordinateWithMOA(request: HookCoordinationRequest): Promise<AgentResponse[]>;
  
  // Agent-specific hooks
  registerAgentHooks(agentId: string, hooks: Hook[]): Promise<void>;
  
  // Hook context sharing
  shareHookContext(context: HookContext): Promise<void>;
  
  // Agent performance integration
  updateAgentMetrics(metrics: AgentHookMetrics): Promise<void>;
  
  // Agent availability
  getAvailableAgents(capabilities?: string[]): Promise<string[]>;
}

export interface HookCoordinationRequest {
  hookEvent: HookEvent;
  requiredAgents: string[]; // Using specific agent IDs instead of types
  coordinationStrategy: CoordinationStrategy;
  timeout: number;
  fallbackStrategy?: CoordinationStrategy;
}

export interface CoordinationStrategy {
  type: 'parallel' | 'sequential' | 'consensus' | 'round-robin';
  agents: string[];
  timeout: number;
  consensusThreshold?: number;
  fallbackStrategy?: CoordinationStrategy;
}

// Hook-specific agent metrics
export interface AgentHookMetrics {
  agentId: string;
  hooksTriggered: number;
  avgHookResponseTime: number;
  hookSuccessRate: number;
  lastHookExecution: number;
  hookTypes: Record<string, number>; // count by hook type
}

// Import from F1 system
export interface AgentResponse {
  agentId: string;
  response: string;
  confidence: number;
  reasoning: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// MCP Interface
export interface MCPHookInterface {
  // MCP protocol compliance
  handleMCPRequest(request: MCPRequest): Promise<MCPResponse>;
  
  // Hook exposure via MCP
  exposeHook(hook: Hook): Promise<MCPCapability>;
  
  // MCP event integration
  forwardMCPEvent(event: MCPEvent): Promise<void>;
  
  // Protocol validation
  validateMCPCompliance(): ComplianceResult;
  
  // Capability management
  getCapabilities(): MCPHookCapability[];
}

export interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, any>;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface MCPCapability {
  name: string;
  version: string;
  description: string;
  methods: string[];
}

export interface MCPHookCapability extends MCPCapability {
  hookTypes: HookType[];
  supportedOperations: string[];
  performanceGuarantees: PerformanceGuarantee[];
}

export interface PerformanceGuarantee {
  operation: string;
  maxTime: number;
  successRate: number;
  conditions: string[];
}

export interface ComplianceResult {
  compliant: boolean;
  version: string;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
  recommendation?: string;
}

// Circuit Breaker Interface
export interface CircuitBreaker {
  isOpen(): boolean;
  isClosed(): boolean;
  isHalfOpen(): boolean;
  recordSuccess(): void;
  recordFailure(): void;
  getState(): CircuitBreakerState;
  getMetrics(): CircuitBreakerMetrics;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgResponseTime: number;
}

// Cache Interface
export interface CachedResult {
  result: HookResult;
  timestamp: number;
  ttl: number;
  isExpired(): boolean;
}

// F2 Hook Configuration
export interface F2HookConfiguration {
  claude: ClaudeConfiguration;
  hooks: HookConfiguration;
  performance: F2PerformanceConfig;
  security: F2SecurityConfig;
}

export interface F2PerformanceConfig {
  maxHookProcessingTime: number;
  maxConcurrentHooks: number;
  cacheSize: number;
  metricsRetention: number;
  optimizationInterval: number;
}

export interface F2SecurityConfig {
  sandboxEnabled: boolean;
  permissionValidation: boolean;
  auditLogging: boolean;
  encryptionEnabled: boolean;
  trustedSources: string[];
}