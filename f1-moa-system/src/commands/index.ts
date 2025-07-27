// F8 Slash Commands - Main Export Index
// Production-ready F8 system with all components

// Main system
export { F8SlashCommands, createF8System } from './F8SlashCommands.js';
export type { F8Configuration } from './F8SlashCommands.js';

// Core components
export { F8CommandParser } from './core/CommandParser.js';
export { F8CommandRegistry } from './core/CommandRegistry.js';

// CLI interface
export { F8CLIInterface } from './cli/CLIInterface.js';

// Integrations
export { F8MOAIntegration } from './integration/MOAIntegration.js';
export { F8HookIntegration } from './integration/HookIntegration.js';

// Command handlers
export { AnalyzeCommandHandler } from './handlers/AnalyzeCommandHandler.js';

// Types
export type * from './types.js';

// Re-export key types for convenience
export type {
  SlashCommand,
  CommandHandler,
  ParsedCommand,
  CommandResult,
  CommandExecutionContext,
  CLIInterface,
  CommandRegistry,
  CommandParser,
  MOAIntegration,
  HookIntegration
} from './types.js';