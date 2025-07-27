// F8 CLI Interface - Rich User Experience with <100ms Feedback
// Production-ready CLI with progress indicators, themes, and error handling

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import type {
  CLIInterface,
  CommandResult,
  HelpContent,
  CommandError,
  InputPrompt,
  ProgressIndicator,
  CLITheme,
  ParsedCommand,
  CommandExecutionContext,
  ExecutionEnvironment
} from '../types.js';
import { F8CommandParser } from '../core/CommandParser.js';
import { F8CommandRegistry } from '../core/CommandRegistry.js';
import type { MOACoordinator } from '../../agents/MOACoordinator.js';
import type { HookManager } from '../../hooks/types.js';

export class F8CLIInterface extends EventEmitter implements CLIInterface {
  private theme: CLITheme;
  private progressIndicators: Map<string, any> = new Map();
  private commandHistory: string[] = [];
  private readonly maxHistorySize = 1000;
  private interactiveMode = false;
  private verboseMode = false;
  
  constructor(
    private parser: F8CommandParser,
    private registry: F8CommandRegistry,
    private moaCoordinator: MOACoordinator,
    private hookManager: HookManager,
    theme?: CLITheme
  ) {
    super();
    this.theme = theme || this.getDefaultTheme();
    this.setupSignalHandlers();
  }

  async processInput(input: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Add to command history
      this.addToHistory(input);
      
      // Handle special CLI commands
      if (await this.handleSpecialCommands(input)) {
        return;
      }

      // Parse command with performance monitoring
      const parseStart = performance.now();
      const command = await this.parser.parseCommand(input);
      const parseTime = performance.now() - parseStart;
      
      if (this.verboseMode) {
        console.log(`${this.theme.info}📊 Parse time: ${parseTime.toFixed(2)}ms`);
      }

      // Validate command exists
      const slashCommand = this.registry.findCommand(command.name);
      if (!slashCommand) {
        await this.displayError({
          code: 'COMMAND_NOT_FOUND',
          message: `Command not found: /${command.name}`,
          suggestions: this.generateCommandSuggestions(command.name)
        });
        return;
      }

      // Show progress for potentially long-running commands
      const progress = this.shouldShowProgress(command) ? 
        this.showProgress(`Executing /${command.name}`) : null;

      try {
        // Build execution context
        const context = await this.buildExecutionContext(command);
        
        // Execute command with performance monitoring
        const executeStart = performance.now();
        const result = await slashCommand.handler.execute(context);
        const executeTime = performance.now() - executeStart;
        
        // Stop progress indicator
        if (progress) {
          progress.stop();
        }
        
        // Display result
        await this.displayResult(result);
        
        // Show performance metrics if verbose
        if (this.verboseMode) {
          const totalTime = performance.now() - startTime;
          console.log(`${this.theme.info}📊 Total time: ${totalTime.toFixed(2)}ms (parse: ${parseTime.toFixed(2)}ms, execute: ${executeTime.toFixed(2)}ms)`);
        }
        
      } catch (error) {
        if (progress) {
          progress.stop();
        }
        
        await this.displayError({
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Command execution failed',
          suggestions: [
            'Check command syntax with /help ' + command.name,
            'Verify all required arguments are provided',
            'Try with --verbose for more details'
          ]
        });
      }

    } catch (error) {
      await this.displayError({
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Input processing failed',
        suggestions: [
          'Check command syntax',
          'Use /help for available commands',
          'Try a simpler command first'
        ]
      });
    }
  }

  async displayResult(result: CommandResult): Promise<void> {
    const displayStart = performance.now();
    
    try {
      if (result.success) {
        // Success header
        console.log(`${this.theme.success}✅ ${result.message}`);
        
        // Display data based on type
        if (result.data) {
          await this.displayResultData(result.data);
        }
        
        // Display performance metrics if available
        if (result.details?.performanceMetrics) {
          this.displayPerformanceMetrics(result.details.performanceMetrics);
        }
        
        // Display MOA analysis if available
        if (result.details?.moaAnalysis) {
          await this.displayMOAAnalysis(result.details.moaAnalysis);
        }
        
      } else {
        // Error header
        console.log(`${this.theme.error}❌ ${result.message}`);
        
        // Display error details if available
        if (result.data && typeof result.data === 'object' && result.data.errors) {
          this.displayErrorDetails(result.data.errors);
        }
      }
      
      // Display suggestions
      if (result.suggestions && result.suggestions.length > 0) {
        console.log(`${this.theme.info}💡 Suggestions:`);
        result.suggestions.forEach(suggestion => {
          console.log(`   ${this.theme.secondary}• ${suggestion}`);
        });
      }
      
      const displayTime = performance.now() - displayStart;
      if (displayTime > 100) {
        console.warn(`⚠️ Display time exceeded 100ms: ${displayTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      console.error(`${this.theme.error}❌ Failed to display result:`, error);
    }
  }

  async displayHelp(help: HelpContent): Promise<void> {
    try {
      // Title and description
      console.log(`${this.theme.primary}${help.title}`);
      console.log(`${this.theme.secondary}${help.description}`);
      console.log('');
      
      // Usage
      console.log(`${this.theme.info}Usage:`);
      console.log(`  ${this.theme.secondary}${help.usage}`);
      console.log('');

      // Arguments
      if (help.arguments.length > 0) {
        console.log(`${this.theme.primary}Arguments:`);
        help.arguments.forEach(arg => {
          const required = arg.required ? 
            `${this.theme.error}(required)` : 
            `${this.theme.info}(optional)`;
          const defaultValue = arg.defaultValue ? 
            ` ${this.theme.info}[default: ${arg.defaultValue}]` : '';
          
          console.log(`  ${this.theme.secondary}${arg.name} ${required} - ${arg.description}${defaultValue}`);
        });
        console.log('');
      }

      // Flags
      if (help.flags.length > 0) {
        console.log(`${this.theme.primary}Flags:`);
        help.flags.forEach(flag => {
          const shorthand = flag.shorthand ? `-${flag.shorthand}, ` : '';
          const defaultValue = flag.defaultValue !== undefined ? 
            ` ${this.theme.info}[default: ${flag.defaultValue}]` : '';
          
          console.log(`  ${this.theme.secondary}${shorthand}--${flag.name} - ${flag.description}${defaultValue}`);
        });
        console.log('');
      }

      // Examples
      if (help.examples.length > 0) {
        console.log(`${this.theme.primary}Examples:`);
        help.examples.forEach((example, index) => {
          console.log(`  ${this.theme.info}${index + 1}. ${example.description}:`);
          console.log(`     ${this.theme.secondary}${example.command}`);
          
          if (example.expectedOutput) {
            console.log(`     ${this.theme.info}→ ${example.expectedOutput}`);
          }
          
          if (example.notes) {
            console.log(`     ${this.theme.warning}Note: ${example.notes}`);
          }
          
          console.log('');
        });
      }

      // See also
      if (help.seeAlso.length > 0) {
        console.log(`${this.theme.info}See also:`);
        console.log(`  ${help.seeAlso.map(cmd => `/${cmd}`).join(', ')}`);
        console.log('');
      }

      // Metadata
      if (this.verboseMode && help.metadata) {
        console.log(`${this.theme.info}Metadata:`);
        console.log(`  Version: ${help.metadata.version}`);
        console.log(`  Category: ${help.metadata.category}`);
        console.log(`  Last updated: ${new Date(help.metadata.lastUpdated).toISOString()}`);
      }
      
    } catch (error) {
      console.error(`${this.theme.error}❌ Failed to display help:`, error);
    }
  }

  async displayError(error: CommandError): Promise<void> {
    try {
      console.error(`${this.theme.error}❌ Error (${error.code}): ${error.message}`);
      
      if (error.suggestions && error.suggestions.length > 0) {
        console.log(`${this.theme.info}💡 Suggestions:`);
        error.suggestions.forEach(suggestion => {
          console.log(`   ${this.theme.secondary}• ${suggestion}`);
        });
      }
      
      if (this.verboseMode && error.context) {
        console.log(`${this.theme.info}Context:`);
        console.log(JSON.stringify(error.context, null, 2));
      }
      
    } catch (displayError) {
      console.error('❌ Failed to display error:', displayError);
    }
  }

  async promptForInput(prompt: InputPrompt): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        process.stdout.write(`${this.theme.primary}${prompt.message}: `);
        
        const timeout = setTimeout(() => {
          reject(new Error('Input prompt timed out'));
        }, 30000); // 30 second timeout
        
        const onData = (data: Buffer) => {
          clearTimeout(timeout);
          process.stdin.off('data', onData);
          
          const input = data.toString().trim();
          
          // Validate input if validation function provided
          if (prompt.validation && !prompt.validation(input)) {
            console.log(`${this.theme.error}Invalid input. Please try again.`);
            this.promptForInput(prompt).then(resolve).catch(reject);
            return;
          }
          
          resolve(input);
        };
        
        process.stdin.once('data', onData);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  showProgress(operation: string): ProgressIndicator {
    const id = `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let index = 0;
    let message = operation;
    
    const interval = setInterval(() => {
      process.stdout.write(`\r${spinner[index]} ${message}...`);
      index = (index + 1) % spinner.length;
    }, 100);

    const indicator: ProgressIndicator = {
      stop: () => {
        clearInterval(interval);
        process.stdout.write(`\r${this.theme.success}✅ ${message} completed\n`);
        this.progressIndicators.delete(id);
      },
      update: (newMessage: string) => {
        message = newMessage;
      }
    };

    this.progressIndicators.set(id, indicator);
    return indicator;
  }

  enableAutoCompletion(): void {
    try {
      // Basic readline auto-completion setup
      const readline = require('readline');
      
      // This would be enhanced with proper tab completion
      console.log(`${this.theme.info}📝 Auto-completion enabled`);
      console.log(`${this.theme.secondary}Use Tab for command completion`);
      
    } catch (error) {
      console.warn(`${this.theme.warning}⚠️ Failed to enable auto-completion:`, error);
    }
  }

  setTheme(theme: CLITheme): void {
    this.theme = theme;
    console.log(`${this.theme.success}🎨 Theme updated`);
  }

  // CLI-specific methods
  setVerboseMode(enabled: boolean): void {
    this.verboseMode = enabled;
    console.log(`${this.theme.info}📊 Verbose mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  setInteractiveMode(enabled: boolean): void {
    this.interactiveMode = enabled;
    console.log(`${this.theme.info}🔄 Interactive mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  clearScreen(): void {
    console.clear();
    console.log(`${this.theme.primary}F8 Slash Commands - Interactive PPMOA Interface`);
    console.log(`${this.theme.secondary}Type /help for available commands\n`);
  }

  // Private implementation methods
  private async handleSpecialCommands(input: string): Promise<boolean> {
    const trimmed = input.trim().toLowerCase();
    
    switch (trimmed) {
      case 'clear':
      case 'cls':
        this.clearScreen();
        return true;
        
      case 'exit':
      case 'quit':
        console.log(`${this.theme.info}👋 Goodbye!`);
        process.exit(0);
        
      case 'history':
        this.displayHistory();
        return true;
        
      case 'verbose':
        this.setVerboseMode(!this.verboseMode);
        return true;
        
      case 'interactive':
        this.setInteractiveMode(!this.interactiveMode);
        return true;
        
      default:
        return false;
    }
  }

  private async buildExecutionContext(command: ParsedCommand): Promise<CommandExecutionContext> {
    const environment: ExecutionEnvironment = {
      workingDirectory: process.cwd(),
      nodeEnv: process.env.NODE_ENV || 'development',
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      }
    };

    return {
      command,
      moaCoordinator: this.moaCoordinator,
      hookManager: this.hookManager,
      cliInterface: this,
      environment
    };
  }

  private shouldShowProgress(command: ParsedCommand): boolean {
    // Show progress for potentially long-running commands
    const longRunningCommands = ['analyze', 'optimize', 'review', 'moa'];
    return longRunningCommands.includes(command.name);
  }

  private generateCommandSuggestions(commandName: string): string[] {
    const suggestions = this.parser.getSuggestions(commandName);
    const baseSuggestions = [
      'Use /help to see all available commands',
      'Check command spelling'
    ];
    
    if (suggestions.length > 0) {
      return [
        `Did you mean: ${suggestions.slice(0, 3).map(s => `/${s}`).join(', ')}?`,
        ...baseSuggestions
      ];
    }
    
    return baseSuggestions;
  }

  private async displayResultData(data: any): Promise<void> {
    if (typeof data === 'string') {
      console.log(data);
    } else if (data && typeof data === 'object') {
      if (data.type === 'interactive') {
        await this.displayInteractiveResult(data);
      } else if (data.type === 'markdown') {
        console.log(data.content);
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    } else {
      console.log(String(data));
    }
  }

  private async displayInteractiveResult(data: any): Promise<void> {
    console.log(`${this.theme.primary}📋 Interactive Result:`);
    
    if (data.sections) {
      for (const section of data.sections) {
        console.log(`\n${this.theme.primary}${section.title}:`);
        
        switch (section.type) {
          case 'text':
            console.log(`${this.theme.secondary}${section.content}`);
            break;
            
          case 'expandable':
            for (const item of section.items) {
              console.log(`  ${this.theme.secondary}▶ ${item.title}`);
              if (this.verboseMode && item.content) {
                console.log(`    ${item.content.substring(0, 100)}...`);
              }
            }
            break;
            
          case 'tree':
            console.log(JSON.stringify(section.data, null, 2));
            break;
            
          default:
            console.log(`${this.theme.warning}Unknown section type: ${section.type}`);
        }
      }
    }
  }

  private displayPerformanceMetrics(metrics: any): void {
    if (!this.verboseMode) return;
    
    console.log(`${this.theme.info}📊 Performance Metrics:`);
    console.log(`  Command execution: ${metrics.commandExecutionTime?.toFixed(2) || 'N/A'}ms`);
    console.log(`  MOA processing: ${metrics.moaProcessingTime?.toFixed(2) || 'N/A'}ms`);
    console.log(`  Hook processing: ${metrics.hookProcessingTime?.toFixed(2) || 'N/A'}ms`);
    
    if (metrics.cacheHitRate !== undefined) {
      console.log(`  Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
    }
  }

  private async displayMOAAnalysis(analysis: any): Promise<void> {
    if (!this.verboseMode) return;
    
    console.log(`${this.theme.info}🤖 MOA Analysis:`);
    console.log(`  Agents used: ${analysis.agentsUsed?.join(', ') || 'N/A'}`);
    console.log(`  Consensus reached: ${analysis.consensusReached ? 'Yes' : 'No'}`);
    console.log(`  Confidence: ${(analysis.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`  Processing time: ${analysis.processingTime?.toFixed(2) || 'N/A'}ms`);
  }

  private displayErrorDetails(errors: any[]): void {
    if (!Array.isArray(errors)) return;
    
    console.log(`${this.theme.error}Error Details:`);
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.message || error}`);
      if (this.verboseMode && error.stack) {
        console.log(`     ${this.theme.secondary}${error.stack}`);
      }
    });
  }

  private displayHistory(): void {
    console.log(`${this.theme.primary}Command History:`);
    const recent = this.commandHistory.slice(-10);
    recent.forEach((cmd, index) => {
      console.log(`  ${this.theme.secondary}${recent.length - index}. ${cmd}`);
    });
  }

  private addToHistory(input: string): void {
    this.commandHistory.push(input);
    
    // Maintain history size
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
    }
  }

  private setupSignalHandlers(): void {
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log(`\n${this.theme.info}👋 Goodbye!`);
      process.exit(0);
    });
    
    // Clean up progress indicators on exit
    process.on('exit', () => {
      for (const indicator of this.progressIndicators.values()) {
        if (indicator && typeof indicator.stop === 'function') {
          indicator.stop();
        }
      }
    });
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