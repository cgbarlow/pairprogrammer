# F8 Slash Commands Integration

Production-ready CLI interface for PPMOA with seamless F1 MOA and F2 Hook system integration. Delivers <100ms command processing with intuitive user experience and comprehensive command discovery.

## 🚀 Key Features

- **⚡ Lightning Performance**: <50ms command parsing, <200ms MOA processing, <50ms hook integration
- **🤖 MOA Integration**: Seamless bridge to F1 6-agent MOA system with intelligent agent selection
- **🔗 Hook Integration**: F2 Hook system integration with pre/post command hooks and event publishing
- **🎨 Rich CLI**: Progress indicators, themes, auto-completion, and interactive help
- **📊 Performance Monitoring**: Real-time metrics and optimization recommendations
- **🛡️ Error Handling**: Circuit breakers, fallback mechanisms, and user-friendly error messages

## 📋 Available Commands

### `/analyze` - Code Analysis
Comprehensive code analysis using AST parsing and MOA agent consensus.

```bash
/analyze <code> [--type=ast|performance|quality|security] [--depth=shallow|deep|comprehensive] [--format=json|markdown|interactive]
```

**Examples:**
```bash
# Basic AST analysis
/analyze "function hello() { return 'world'; }" --type=ast

# Performance analysis with deep insights
/analyze "for(let i=0; i<1000000; i++) { console.log(i); }" --type=performance --depth=deep

# Security analysis of web endpoint
/analyze "app.get('/user', (req, res) => { res.send(req.query.name); })" --type=security

# Comprehensive analysis with JSON output
/analyze "./src/app.js" --type=quality --depth=comprehensive --format=json
```

### `/help` - Interactive Help
Intelligent help system with search and discovery.

```bash
/help [command] [--interactive] [--search=query]
```

**Examples:**
```bash
# General help
/help

# Command-specific help
/help analyze

# Interactive help mode
/help --interactive

# Search for commands
/help --search=optimization
```

## 🏗️ Architecture

### Core Components

1. **Command Parser** (`F8CommandParser`)
   - <50ms parsing guarantee
   - Smart tokenization with quote handling
   - Intelligent auto-completion
   - Performance caching

2. **Command Registry** (`F8CommandRegistry`)
   - Dynamic command discovery
   - Category organization
   - Alias support
   - Search functionality

3. **MOA Integration** (`F8MOAIntegration`)
   - F1 MOA system bridge
   - Optimal agent selection
   - Result caching
   - <200ms processing target

4. **Hook Integration** (`F8HookIntegration`)
   - F2 Hook system bridge
   - Pre/post command hooks
   - Event publishing
   - <50ms processing target

5. **CLI Interface** (`F8CLIInterface`)
   - Rich output formatting
   - Progress indicators
   - Theme support
   - Interactive features

### Integration Stack

```
┌─────────────────────────────────────────┐
│         F8 Slash Commands               │
├─────────────────────────────────────────┤
│  Parser → Registry → CLI → Integration  │
├─────────────────────────────────────────┤
│         F2 Hook System                  │
│       (Event Integration)               │
├─────────────────────────────────────────┤
│         F1 MOA System                   │
│      (6-Agent Foundation)               │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { createF8System } from './commands/index.js';
import { MOACoordinator } from './agents/MOACoordinator.js';
import { F2HookManager } from './hooks/HookManager.js';

// Initialize F1 and F2 systems
const moaCoordinator = new MOACoordinator();
await moaCoordinator.initialize();

const hookManager = new F2HookManager(moaCoordinator, {
  performance: { maxHookProcessingTime: 50 }
});
await hookManager.initialize();

// Create F8 system
const f8System = await createF8System(moaCoordinator, hookManager, {
  enableVerboseMode: true,
  enablePerformanceMonitoring: true
});

// Process commands
await f8System.processCommand('/analyze "const x = 1 + 1;" --type=ast');
```

### Advanced Configuration

```typescript
const f8System = await createF8System(moaCoordinator, hookManager, {
  enableVerboseMode: true,
  enableInteractiveMode: true,
  maxParseTime: 50,
  maxExecutionTime: 10000,
  enablePerformanceMonitoring: true,
  theme: {
    primary: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    // ... custom theme
  }
});
```

## 📊 Performance Targets

| Component | Target | Typical |
|-----------|---------|---------|
| Command Parsing | <50ms | ~20ms |
| MOA Processing | <200ms | ~150ms |
| Hook Processing | <50ms | ~30ms |
| Help Generation | <50ms | ~25ms |
| Total Response | <300ms | ~200ms |

## 🛠️ Command Development

### Creating Custom Commands

```typescript
import { SlashCommand, CommandHandler } from './types.js';

const customCommand: SlashCommand = {
  name: 'custom',
  aliases: ['c'],
  description: 'Custom command example',
  category: 'system',
  usage: '/custom <input> [--flag=value]',
  examples: [
    {
      description: 'Basic usage',
      command: '/custom "hello world"',
      expectedOutput: 'Processed: hello world'
    }
  ],
  arguments: [
    {
      name: 'input',
      description: 'Input to process',
      required: true,
      type: 'string'
    }
  ],
  flags: [
    {
      name: 'flag',
      description: 'Example flag',
      type: 'string',
      defaultValue: 'default'
    }
  ],
  handler: new CustomCommandHandler(),
  metadata: {
    version: '1.0.0',
    author: 'Custom',
    performanceHints: [],
    integration: {
      requiredAgents: ['researcher'],
      optionalAgents: [],
      hookBindings: [],
      cacheStrategy: 'memory',
      timeoutMs: 5000
    }
  }
};

// Register the command
await f8System.registerCustomCommand(customCommand);
```

### Command Handler Implementation

```typescript
class CustomCommandHandler implements CommandHandler {
  async execute(context: CommandExecutionContext): Promise<CommandResult> {
    const { command } = context;
    const input = command.arguments[0]?.value as string;
    
    return {
      success: true,
      data: `Processed: ${input}`,
      message: 'Custom command executed successfully',
      metadata: {
        executionTime: 10,
        commandName: 'custom',
        timestamp: Date.now()
      }
    };
  }

  validate(args: CommandArgument[]): ValidationResult {
    // Validation logic
    return {
      valid: args.length > 0,
      errors: [],
      warnings: [],
      suggestions: [],
      validatedAt: Date.now()
    };
  }

  getHelp(): HelpContent {
    // Help content
  }

  canHandle(command: ParsedCommand): boolean {
    return command.name === 'custom';
  }
}
```

## 🔧 Advanced Features

### Performance Monitoring

```typescript
// Get system metrics
const metrics = f8System.getSystemMetrics();
console.log('Parser performance:', metrics.parser);
console.log('MOA performance:', metrics.moa);
console.log('Hook performance:', metrics.hooks);

// Enable verbose monitoring
f8System.setVerboseMode(true);
```

### Custom Hooks

```typescript
const hookIntegration = f8System.getHookIntegration();

// Bind custom hooks to commands
await hookIntegration.bindHooksToCommand('analyze', [
  {
    id: 'custom-pre-hook',
    name: 'Custom Pre Hook',
    type: 'pre-command',
    phase: 'pre',
    handler: {
      execute: async (event) => {
        console.log('Custom pre-command logic');
        return { success: true, data: {} };
      }
    },
    // ... hook configuration
  }
]);
```

### Interactive Mode

```typescript
// Enable interactive mode
f8System.setInteractiveMode(true);

// The CLI will provide:
// - Tab completion
// - Command history
// - Progressive help
// - Real-time suggestions
```

## 🧪 Testing

### Running the Demo

```typescript
import { runF8Demo, runInteractiveDemo } from './demo.js';

// Run comprehensive demo
await runF8Demo();

// Run interactive demo
await runInteractiveDemo();
```

### Unit Testing Commands

```typescript
import { F8CommandParser } from './core/CommandParser.js';

const parser = new F8CommandParser();

// Test parsing
const command = await parser.parseCommand('/analyze "test code" --type=ast');
expect(command.name).toBe('analyze');
expect(command.arguments[0].value).toBe('test code');

// Test validation
const validation = parser.validateCommand(command);
expect(validation.valid).toBe(true);
```

## 🚀 Production Deployment

### Environment Setup

```bash
# Install dependencies
npm install

# Build the system
npm run build

# Run tests
npm test

# Start F8 system
npm run start:f8
```

### Configuration

```json
{
  "f8": {
    "performance": {
      "maxParseTime": 50,
      "maxExecutionTime": 10000,
      "enableCaching": true
    },
    "features": {
      "enableVerboseMode": false,
      "enableInteractiveMode": true,
      "enablePerformanceMonitoring": true
    },
    "integrations": {
      "f1": {
        "enabled": true,
        "agents": ["researcher", "analyst", "coder", "optimizer", "coordinator", "validator"]
      },
      "f2": {
        "enabled": true,
        "maxHookProcessingTime": 50
      }
    }
  }
}
```

## 📈 Performance Optimization

### Caching Strategies

- **Command Cache**: Parsed commands cached for repeated use
- **MOA Cache**: MOA results cached for identical requests
- **Help Cache**: Help content cached for fast access
- **Search Cache**: Search results cached for performance

### Memory Management

- **LRU Caches**: Automatic cleanup of least recently used entries
- **TTL Expiration**: Time-based cache invalidation
- **Size Limits**: Configurable cache size limits
- **Memory Monitoring**: Real-time memory usage tracking

### Network Optimization

- **Request Batching**: Multiple operations batched together
- **Connection Pooling**: Efficient connection reuse
- **Compression**: Gzip compression for large responses
- **CDN Integration**: Static assets served from CDN

## 🔒 Security

### Input Validation

- **Command Sanitization**: All commands validated and sanitized
- **Argument Validation**: Type checking and bounds validation
- **Flag Validation**: Whitelist-based flag validation
- **Code Analysis**: Safe code analysis without execution

### Access Control

- **Command Permissions**: Role-based command access
- **Rate Limiting**: Prevent command flooding
- **Audit Logging**: Complete command execution logs
- **Session Management**: Secure session handling

## 🐛 Troubleshooting

### Common Issues

1. **Slow Performance**
   ```bash
   # Enable verbose mode to see timing
   f8System.setVerboseMode(true);
   
   # Check system metrics
   const metrics = f8System.getSystemMetrics();
   ```

2. **Command Not Found**
   ```bash
   # List all commands
   /help
   
   # Search for similar commands
   /help --search=partial-name
   ```

3. **Parsing Errors**
   ```bash
   # Check command syntax
   /help command-name
   
   # Use quotes for complex arguments
   /analyze "complex code with spaces"
   ```

### Debug Mode

```typescript
// Enable debug mode
const f8System = await createF8System(moaCoordinator, hookManager, {
  enableVerboseMode: true,
  enablePerformanceMonitoring: true
});

// Check component status
console.log('Parser metrics:', f8System.getParser().getParsingMetrics());
console.log('Registry commands:', f8System.getRegistry().getAllCommands().length);
```

## 📚 API Reference

See the TypeScript definitions in `types.ts` for complete API documentation.

## 🤝 Contributing

1. Follow the existing architecture patterns
2. Maintain <100ms performance targets
3. Add comprehensive tests
4. Update documentation
5. Follow TypeScript strict mode

## 📄 License

Part of the PPMOA project. See main project license.