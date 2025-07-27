// F1 MOA System - MCP Server for Claude Code Integration

import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type { MCPMessage, MCPCapability } from '../types/index.js';
import { MOACoordinator } from '../agents/MOACoordinator.js';

export class F1MCPServer {
  private server: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private moaCoordinator: MOACoordinator;
  private isRunning = false;

  constructor(private port: number = 8080) {
    this.server = new WebSocketServer({ port: this.port });
    this.moaCoordinator = new MOACoordinator();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🚀 Starting F1 MCP Server...');
    
    // Initialize MOA system
    await this.moaCoordinator.initialize();

    // Setup WebSocket handlers
    this.server.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      this.clients.set(clientId, ws);
      
      console.log(`🔗 Client connected: ${clientId}`);

      ws.on('message', async (data: Buffer) => {
        try {
          const message: MCPMessage = JSON.parse(data.toString());
          await this.handleMessage(clientId, message);
        } catch (error) {
          console.error('❌ Error handling message:', error);
          this.sendError(ws, 'Invalid message format', -32700);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`🔌 Client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send initialization message
      this.sendMessage(ws, {
        type: 'notification',
        method: 'initialized',
        params: {
          serverInfo: {
            name: 'F1 MOA System',
            version: '1.0.0',
            capabilities: this.getCapabilities()
          }
        }
      });
    });

    this.isRunning = true;
    console.log(`✅ F1 MCP Server running on port ${this.port}`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🔄 Stopping F1 MCP Server...');
    
    // Close all client connections
    for (const [clientId, ws] of this.clients) {
      ws.close();
      console.log(`🔌 Closed connection: ${clientId}`);
    }
    this.clients.clear();

    // Shutdown MOA system
    await this.moaCoordinator.shutdown();

    // Close server
    this.server.close();
    this.isRunning = false;
    
    console.log('✅ F1 MCP Server stopped');
  }

  private async handleMessage(clientId: string, message: MCPMessage): Promise<void> {
    const ws = this.clients.get(clientId);
    if (!ws) return;

    console.log(`📨 Received ${message.method} from client ${clientId}`);

    try {
      switch (message.method) {
        case 'capabilities':
          await this.handleCapabilities(ws, message);
          break;
          
        case 'moa_process':
          await this.handleMOAProcess(ws, message);
          break;
          
        case 'agent_status':
          await this.handleAgentStatus(ws, message);
          break;
          
        case 'system_metrics':
          await this.handleSystemMetrics(ws, message);
          break;
          
        case 'ast_analyze':
          await this.handleASTAnalyze(ws, message);
          break;
          
        case 'prompt_template':
          await this.handlePromptTemplate(ws, message);
          break;
          
        case 'health_check':
          await this.handleHealthCheck(ws, message);
          break;
          
        default:
          this.sendError(ws, `Unknown method: ${message.method}`, -32601, message.id);
      }
    } catch (error) {
      console.error(`❌ Error handling ${message.method}:`, error);
      this.sendError(ws, error instanceof Error ? error.message : String(error), -32603, message.id);
    }
  }

  private async handleCapabilities(ws: WebSocket, message: MCPMessage): Promise<void> {
    this.sendResponse(ws, message.id!, {
      capabilities: this.getCapabilities()
    });
  }

  private async handleMOAProcess(ws: WebSocket, message: MCPMessage): Promise<void> {
    const { prompt, context, requiredAgentTypes, maxProcessingTime, consensusThreshold, astAnalysis, usePromptTemplate } = message.params!;

    const request = {
      id: uuidv4(),
      prompt,
      context,
      requiredAgentTypes,
      maxProcessingTime,
      consensusThreshold,
      astAnalysis,
      usePromptTemplate
    };

    const response = await this.moaCoordinator.processRequest(request);
    
    this.sendResponse(ws, message.id!, {
      result: response
    });
  }

  private async handleAgentStatus(ws: WebSocket, message: MCPMessage): Promise<void> {
    const agents = this.moaCoordinator.getAgentStatus();
    
    this.sendResponse(ws, message.id!, {
      agents: agents.map(agent => ({
        id: agent.id,
        type: agent.type,
        name: agent.name,
        status: agent.status,
        capabilities: agent.capabilities,
        performance: agent.performance
      }))
    });
  }

  private async handleSystemMetrics(ws: WebSocket, message: MCPMessage): Promise<void> {
    const metrics = this.moaCoordinator.getSystemMetrics();
    
    this.sendResponse(ws, message.id!, {
      metrics
    });
  }

  private async handleASTAnalyze(ws: WebSocket, message: MCPMessage): Promise<void> {
    const { code, language } = message.params!;
    
    // Access the AST analyzer through the coordinator
    const analysis = await (this.moaCoordinator as any).astAnalyzer.analyze(code, language);
    
    this.sendResponse(ws, message.id!, {
      analysis
    });
  }

  private async handlePromptTemplate(ws: WebSocket, message: MCPMessage): Promise<void> {
    const { action, templateId, variables, template } = message.params!;
    
    // Access the prompting system through the coordinator
    const promptingSystem = (this.moaCoordinator as any).promptingSystem;

    switch (action) {
      case 'apply':
        const prompt = await promptingSystem.applyTemplate(templateId, variables);
        this.sendResponse(ws, message.id!, { prompt });
        break;
        
      case 'list':
        const templates = promptingSystem.getAllTemplates();
        this.sendResponse(ws, message.id!, { templates });
        break;
        
      case 'get':
        const singleTemplate = promptingSystem.getTemplate(templateId);
        this.sendResponse(ws, message.id!, { template: singleTemplate });
        break;
        
      case 'add':
        await promptingSystem.addCustomTemplate(template);
        this.sendResponse(ws, message.id!, { success: true });
        break;
        
      default:
        throw new Error(`Unknown prompt template action: ${action}`);
    }
  }

  private async handleHealthCheck(ws: WebSocket, message: MCPMessage): Promise<void> {
    const status = {
      status: 'healthy',
      timestamp: Date.now(),
      moaSystem: 'operational',
      activeAgents: this.moaCoordinator.getAgentStatus().length,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
    
    this.sendResponse(ws, message.id!, status);
  }

  private getCapabilities(): MCPCapability[] {
    return [
      {
        name: 'moa_processing',
        version: '1.0.0',
        description: '6-Agent MOA processing with consensus building',
        methods: ['moa_process']
      },
      {
        name: 'agent_management',
        version: '1.0.0',
        description: 'Agent status monitoring and management',
        methods: ['agent_status']
      },
      {
        name: 'ast_analysis',
        version: '1.0.0',
        description: 'Tree-sitter based AST analysis for multiple languages',
        methods: ['ast_analyze']
      },
      {
        name: 'prompt_templates',
        version: '1.0.0',
        description: 'Expert prompt templates for specialized tasks',
        methods: ['prompt_template']
      },
      {
        name: 'system_monitoring',
        version: '1.0.0',
        description: 'System metrics and health monitoring',
        methods: ['system_metrics', 'health_check']
      }
    ];
  }

  private sendMessage(ws: WebSocket, message: MCPMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendResponse(ws: WebSocket, id: string, result: any): void {
    this.sendMessage(ws, {
      type: 'response',
      id,
      method: undefined,
      result
    });
  }

  private sendError(ws: WebSocket, message: string, code: number, id?: string): void {
    this.sendMessage(ws, {
      type: 'response',
      id,
      method: undefined,
      error: {
        code,
        message
      }
    });
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }
}

// CLI entry point for running the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  const server = new F1MCPServer(port);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🔄 Graceful shutdown initiated...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🔄 Graceful shutdown initiated...');
    await server.stop();
    process.exit(0);
  });

  server.start().catch(error => {
    console.error('❌ Failed to start F1 MCP Server:', error);
    process.exit(1);
  });
}