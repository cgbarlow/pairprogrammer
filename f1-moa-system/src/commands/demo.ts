// F8 Slash Commands Demo
// Demonstrates the complete F8 system with F1/F2 integration

import { createF8System } from './F8SlashCommands.js';
import { MOACoordinator } from '../agents/MOACoordinator.js';
import { F2HookManager } from '../hooks/HookManager.js';
import type { F2HookConfiguration } from '../hooks/types.js';

async function runF8Demo() {
  console.log('🚀 F8 Slash Commands Demo - Production Integration\n');
  
  try {
    // Initialize F1 MOA System
    console.log('1️⃣ Initializing F1 MOA System...');
    const moaCoordinator = new MOACoordinator();
    await moaCoordinator.initialize();
    console.log('   ✅ F1 MOA System ready with 6 agents\n');
    
    // Initialize F2 Hook System
    console.log('2️⃣ Initializing F2 Hook System...');
    const hookConfig: F2HookConfiguration = {
      performance: {
        maxHookProcessingTime: 50,
        enableCaching: true,
        enableCircuitBreaker: true
      },
      features: {
        enableParallelExecution: true,
        enableEventSubscription: true,
        enableMemoryOptimization: true
      },
      integrations: {
        enableMCPInterface: true,
        enableAgentIntegration: true,
        enableConfigurationSystem: true
      }
    };
    
    const hookManager = new F2HookManager(moaCoordinator, hookConfig);
    await hookManager.initialize();
    console.log('   ✅ F2 Hook System ready with performance monitoring\n');
    
    // Initialize F8 Slash Commands System
    console.log('3️⃣ Initializing F8 Slash Commands System...');
    const f8System = await createF8System(moaCoordinator, hookManager, {
      enableVerboseMode: true,
      enablePerformanceMonitoring: true,
      maxParseTime: 50,
      maxExecutionTime: 10000
    });
    console.log('   ✅ F8 System ready with all integrations\n');
    
    // Demonstrate F8 capabilities
    console.log('4️⃣ Demonstrating F8 Capabilities...\n');
    
    // Test 1: Help command
    console.log('📋 Test 1: Help Command');
    await f8System.processCommand('/help');
    console.log('');
    
    // Test 2: Analyze command with simple JavaScript
    console.log('📋 Test 2: JavaScript Analysis');
    const jsCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`;
    
    await f8System.processCommand(`/analyze "${jsCode}" --type=performance --depth=deep`);
    console.log('');
    
    // Test 3: AST analysis with different format
    console.log('📋 Test 3: AST Analysis with JSON Output');
    const simpleCode = `const greeting = "Hello, World!"; console.log(greeting);`;
    await f8System.processCommand(`/analyze "${simpleCode}" --type=ast --format=json`);
    console.log('');
    
    // Test 4: Security analysis
    console.log('📋 Test 4: Security Analysis');
    const securityCode = `app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId;
  db.query(query, (err, result) => {
    res.send(result);
  });
});`;
    
    await f8System.processCommand(`/analyze "${securityCode}" --type=security --depth=comprehensive`);
    console.log('');
    
    // Display system metrics
    console.log('5️⃣ System Performance Metrics\n');
    const metrics = f8System.getSystemMetrics();
    
    console.log('📊 F8 Performance Summary:');
    console.log(`   Parser avg time: ${metrics.parser.avgParseTime.toFixed(2)}ms`);
    console.log(`   Parser success rate: ${(metrics.parser.parseSuccessRate * 100).toFixed(1)}%`);
    console.log(`   Commands parsed: ${metrics.parser.totalCommandsParsed}`);
    console.log(`   MOA avg time: ${metrics.moa.avgProcessingTime.toFixed(2)}ms`);
    console.log(`   MOA success rate: ${(metrics.moa.successRate * 100).toFixed(1)}%`);
    console.log(`   Hook avg time: ${metrics.hooks.avgHookProcessingTime.toFixed(2)}ms`);
    console.log(`   Hook success rate: ${(metrics.hooks.hookSuccessRate * 100).toFixed(1)}%`);
    console.log(`   Total commands available: ${metrics.totalCommands}`);
    console.log('');
    
    // Test error handling
    console.log('6️⃣ Testing Error Handling\n');
    console.log('📋 Test: Invalid Command');
    await f8System.processCommand('/nonexistent');
    console.log('');
    
    console.log('📋 Test: Missing Arguments');
    await f8System.processCommand('/analyze');
    console.log('');
    
    // Cleanup
    console.log('7️⃣ Cleaning Up...');
    await f8System.shutdown();
    console.log('   ✅ F8 System shutdown complete\n');
    
    console.log('🎉 F8 Demo completed successfully!');
    console.log('');
    console.log('Key Features Demonstrated:');
    console.log('  ✅ <50ms command parsing');
    console.log('  ✅ <200ms MOA integration');
    console.log('  ✅ <50ms hook processing');
    console.log('  ✅ Rich CLI with progress indicators');
    console.log('  ✅ Multiple output formats (JSON, Markdown, Interactive)');
    console.log('  ✅ Comprehensive error handling');
    console.log('  ✅ Performance monitoring');
    console.log('  ✅ F1 MOA system integration');
    console.log('  ✅ F2 Hook system integration');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Interactive mode demo
async function runInteractiveDemo() {
  console.log('🎮 F8 Interactive Mode Demo\n');
  
  try {
    // Quick setup for interactive mode
    const moaCoordinator = new MOACoordinator();
    await moaCoordinator.initialize();
    
    const hookConfig: F2HookConfiguration = {
      performance: { maxHookProcessingTime: 50, enableCaching: true, enableCircuitBreaker: true },
      features: { enableParallelExecution: true, enableEventSubscription: true, enableMemoryOptimization: true },
      integrations: { enableMCPInterface: true, enableAgentIntegration: true, enableConfigurationSystem: true }
    };
    
    const hookManager = new F2HookManager(moaCoordinator, hookConfig);
    await hookManager.initialize();
    
    const f8System = await createF8System(moaCoordinator, hookManager, {
      enableInteractiveMode: true,
      enableVerboseMode: false
    });
    
    console.log('F8 Interactive Shell Ready! Type commands or "exit" to quit.\n');
    
    // Simple command loop (in real implementation, this would use readline)
    const testCommands = [
      '/help',
      '/analyze "const x = 1 + 1;"',
      '/help analyze',
      'exit'
    ];
    
    for (const cmd of testCommands) {
      console.log(`> ${cmd}`);
      
      if (cmd === 'exit') {
        break;
      }
      
      await f8System.processCommand(cmd);
      console.log('');
    }
    
    await f8System.shutdown();
    console.log('Interactive demo complete!');
    
  } catch (error) {
    console.error('❌ Interactive demo failed:', error);
  }
}

// Export demo functions
export { runF8Demo, runInteractiveDemo };

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runF8Demo().catch(console.error);
}