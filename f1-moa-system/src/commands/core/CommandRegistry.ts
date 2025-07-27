// F8 Command Registry - Dynamic Discovery & Management
// <30ms command discovery and routing with intelligent caching

import type {
  CommandRegistry,
  SlashCommand,
  CommandCategory,
  HelpContent,
  ArgumentHelp,
  FlagHelp,
  CommandExample,
  SearchResult,
  CommandHandler,
  ArgumentDefinition,
  FlagDefinition
} from '../types.js';

export class F8CommandRegistry implements CommandRegistry {
  private commands: Map<string, SlashCommand> = new Map();
  private categories: Map<CommandCategory, SlashCommand[]> = new Map();
  private aliases: Map<string, string> = new Map();
  private helpCache: Map<string, HelpContent> = new Map();
  private searchCache: Map<string, SearchResult[]> = new Map();
  
  constructor() {
    this.initializeBuiltInCommands();
    this.setupCacheCleanup();
  }

  async registerCommand(command: SlashCommand): Promise<void> {
    // Validate command before registration
    this.validateCommand(command);
    
    // Register main command
    this.commands.set(command.name, command);
    
    // Register aliases
    for (const alias of command.aliases) {
      if (this.aliases.has(alias) || this.commands.has(alias)) {
        throw new Error(`Alias conflict: '${alias}' is already registered`);
      }
      this.aliases.set(alias, command.name);
    }
    
    // Add to category
    if (!this.categories.has(command.category)) {
      this.categories.set(command.category, []);
    }
    this.categories.get(command.category)!.push(command);
    
    // Clear related caches
    this.clearCaches();
    
    console.log(`📝 F8: Registered command /${command.name} (${command.category})`);
  }

  findCommand(name: string): SlashCommand | null {
    // Direct command name lookup (O(1))
    if (this.commands.has(name)) {
      return this.commands.get(name)!;
    }
    
    // Alias lookup (O(1))
    if (this.aliases.has(name)) {
      const realName = this.aliases.get(name)!;
      return this.commands.get(realName) || null;
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
      // Check cache first
      const cacheKey = `command-${commandName}`;
      if (this.helpCache.has(cacheKey)) {
        return this.helpCache.get(cacheKey)!;
      }
      
      const command = this.findCommand(commandName);
      if (!command) {
        throw new Error(`Command not found: ${commandName}`);
      }
      
      const help = this.generateCommandHelp(command);
      this.helpCache.set(cacheKey, help);
      return help;
    }
    
    // Generate full help
    const cacheKey = 'full-help';
    if (this.helpCache.has(cacheKey)) {
      return this.helpCache.get(cacheKey)!;
    }
    
    const help = this.generateFullHelp();
    this.helpCache.set(cacheKey, help);
    return help;
  }

  searchCommands(query: string): SearchResult[] {
    // Check search cache
    if (this.searchCache.has(query)) {
      return this.searchCache.get(query)!;
    }
    
    const results: SearchResult[] = [];
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return results;
    }
    
    for (const command of this.commands.values()) {
      const relevanceScore = this.calculateRelevance(normalizedQuery, command);
      
      if (relevanceScore > 0) {
        const matchedTerms = this.getMatchedTerms(normalizedQuery, command);
        results.push({
          command,
          relevanceScore,
          matchedTerms,
          context: this.generateSearchContext(normalizedQuery, command)
        });
      }
    }
    
    // Sort by relevance score (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Cache the results
    this.searchCache.set(query, results);
    
    return results.slice(0, 10); // Limit to top 10 results
  }

  getSimilarCommands(commandName: string): string[] {
    const allCommands = this.getAllCommands();
    const similarities = allCommands
      .filter(cmd => cmd.name !== commandName)
      .map(cmd => ({
        name: cmd.name,
        similarity: this.calculateCommandSimilarity(commandName, cmd)
      }))
      .filter(item => item.similarity > 0.3) // Threshold for similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => item.name);
    
    return similarities;
  }

  // Private implementation methods
  private validateCommand(command: SlashCommand): void {
    if (!command.name || typeof command.name !== 'string') {
      throw new Error('Command must have a valid name');
    }
    
    if (!command.handler || typeof command.handler.execute !== 'function') {
      throw new Error('Command must have a valid handler with execute method');
    }
    
    if (!command.category) {
      throw new Error('Command must have a category');
    }
    
    // Validate arguments
    for (const arg of command.arguments) {
      if (!arg.name || !arg.description) {
        throw new Error(`Invalid argument definition in command '${command.name}'`);
      }
    }
    
    // Validate flags
    for (const flag of command.flags) {
      if (!flag.name || !flag.description) {
        throw new Error(`Invalid flag definition in command '${command.name}'`);
      }
    }
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
    const categories = Array.from(this.categories.keys()).sort();
    const sections = categories.map(category => {
      const commands = this.getCommandsByCategory(category);
      return `**${category.toUpperCase()}**\n${commands
        .map(cmd => `  /${cmd.name}${cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : ''} - ${cmd.description}`)
        .join('\n')}`;
    });

    const description = `F8 Slash Commands - Interactive PPMOA Interface

Available Commands:

${sections.join('\n\n')}

Use \`/help <command>\` for detailed information about a specific command.
Use \`/help --search <query>\` to search for commands by keyword.`;

    return {
      title: 'F8 Slash Commands Help',
      description,
      usage: '/help [command] [--interactive] [--search=query] [--category=category]',
      arguments: [
        {
          name: 'command',
          description: 'Specific command to get help for',
          required: false,
          type: 'string'
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
          type: 'string'
        },
        {
          name: 'category',
          description: 'Show commands in specific category',
          shorthand: 'c',
          type: 'string'
        }
      ],
      examples: [
        { 
          description: 'Show help for analyze command', 
          command: '/help analyze' 
        },
        { 
          description: 'Search for optimization commands', 
          command: '/help --search=optimize' 
        },
        { 
          description: 'Show all analysis commands', 
          command: '/help --category=analysis' 
        },
        { 
          description: 'Launch interactive help', 
          command: '/help --interactive' 
        }
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
    const relatedCommands = this.getCommandsByCategory(command.category)
      .filter(cmd => cmd.name !== command.name)
      .map(cmd => cmd.name)
      .slice(0, 3);
    
    // Add commands with similar functionality
    const similarCommands = this.getSimilarCommands(command.name)
      .filter(name => !relatedCommands.includes(name))
      .slice(0, 2);
    
    return [...relatedCommands, ...similarCommands];
  }

  private calculateRelevance(query: string, command: SlashCommand): number {
    let score = 0;
    const queryTerms = query.split(/\s+/).filter(term => term.length > 0);
    
    for (const term of queryTerms) {
      // Exact name match (highest score)
      if (command.name.toLowerCase() === term) {
        score += 100;
      }
      // Name starts with term
      else if (command.name.toLowerCase().startsWith(term)) {
        score += 80;
      }
      // Name contains term
      else if (command.name.toLowerCase().includes(term)) {
        score += 60;
      }
      // Alias match
      else if (command.aliases.some(alias => alias.toLowerCase().includes(term))) {
        score += 70;
      }
      // Description match
      else if (command.description.toLowerCase().includes(term)) {
        score += 40;
      }
      // Category match
      else if (command.category.toLowerCase().includes(term)) {
        score += 30;
      }
      // Example match
      else if (command.examples.some(ex => 
        ex.description.toLowerCase().includes(term) || 
        ex.command.toLowerCase().includes(term)
      )) {
        score += 20;
      }
    }
    
    return score;
  }

  private getMatchedTerms(query: string, command: SlashCommand): string[] {
    const terms = new Set<string>();
    const queryTerms = query.split(/\s+/).filter(term => term.length > 0);
    
    for (const term of queryTerms) {
      if (command.name.toLowerCase().includes(term)) {
        terms.add('name');
      }
      if (command.aliases.some(alias => alias.toLowerCase().includes(term))) {
        terms.add('alias');
      }
      if (command.description.toLowerCase().includes(term)) {
        terms.add('description');
      }
      if (command.category.toLowerCase().includes(term)) {
        terms.add('category');
      }
    }
    
    return Array.from(terms);
  }

  private generateSearchContext(query: string, command: SlashCommand): string {
    const contexts: string[] = [];
    
    // Add relevant parts of description
    const description = command.description.toLowerCase();
    const queryTerms = query.split(/\s+/).filter(term => term.length > 0);
    
    for (const term of queryTerms) {
      const index = description.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 20);
        const end = Math.min(description.length, index + term.length + 20);
        let context = command.description.substring(start, end);
        
        if (start > 0) context = '...' + context;
        if (end < description.length) context = context + '...';
        
        contexts.push(context);
      }
    }
    
    return contexts.join(' | ') || command.description.substring(0, 100);
  }

  private calculateCommandSimilarity(commandName: string, otherCommand: SlashCommand): number {
    let similarity = 0;
    
    // Category similarity
    if (this.findCommand(commandName)?.category === otherCommand.category) {
      similarity += 0.4;
    }
    
    // Name similarity (using Levenshtein distance)
    const nameDistance = this.levenshteinDistance(commandName, otherCommand.name);
    const maxLength = Math.max(commandName.length, otherCommand.name.length);
    const nameSimilarity = 1 - (nameDistance / maxLength);
    similarity += nameSimilarity * 0.3;
    
    // Description similarity (simple word overlap)
    const sourceDesc = this.findCommand(commandName)?.description || '';
    const targetDesc = otherCommand.description;
    const descSimilarity = this.calculateTextSimilarity(sourceDesc, targetDesc);
    similarity += descSimilarity * 0.3;
    
    return similarity;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
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

  private clearCaches(): void {
    this.helpCache.clear();
    this.searchCache.clear();
  }

  private setupCacheCleanup(): void {
    // Clean caches every 10 minutes
    setInterval(() => {
      // Clear search cache (it can grow large)
      this.searchCache.clear();
      
      // Keep help cache but limit size
      if (this.helpCache.size > 50) {
        const entries = Array.from(this.helpCache.entries());
        this.helpCache.clear();
        
        // Keep most recent 25 entries
        entries
          .sort((a, b) => b[1].metadata.lastUpdated - a[1].metadata.lastUpdated)
          .slice(0, 25)
          .forEach(([key, value]) => this.helpCache.set(key, value));
      }
    }, 600000); // 10 minutes
  }

  private initializeBuiltInCommands(): void {
    // Built-in commands will be registered by the command handlers
    // This is called during construction to set up the registry
    console.log('🚀 F8 Command Registry initialized');
  }
}