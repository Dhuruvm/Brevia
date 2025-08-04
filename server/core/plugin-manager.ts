import { storage } from '../storage';
import type { Plugin, InsertPlugin } from '@shared/schema';

export interface PluginInterface {
  name: string;
  type: 'llm' | 'embedding' | 'tool' | 'parser';
  provider: string;
  initialize(config: any): Promise<void>;
  execute(input: any, params?: any): Promise<any>;
  getPerformanceMetrics(): any;
}

export class PluginManager {
  private plugins: Map<string, PluginInterface> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Load all enabled plugins from database
    const dbPlugins = await storage.getPlugins();
    
    for (const dbPlugin of dbPlugins) {
      if (dbPlugin.enabled) {
        await this.loadPlugin(dbPlugin);
      }
    }

    // Register default Hugging Face plugins
    await this.registerDefaultPlugins();
    
    this.initialized = true;
    console.log(`🔌 Plugin Manager initialized with ${this.plugins.size} plugins`);
  }

  private async registerDefaultPlugins() {
    // Default LLM plugins
    const defaultLLMs = [
      {
        name: 'mistral-7b',
        type: 'llm' as const,
        provider: 'huggingface',
        model_name: 'mistralai/Mistral-7B-Instruct-v0.1',
        config: {
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9
        }
      },
      {
        name: 'phi-3-medium',
        type: 'llm' as const,
        provider: 'huggingface',
        model_name: 'microsoft/Phi-3-medium-4k-instruct',
        config: {
          max_tokens: 4096,
          temperature: 0.6,
          top_p: 0.95
        }
      },
      {
        name: 'llama-3.1-8b',
        type: 'llm' as const,
        provider: 'huggingface',
        model_name: 'meta-llama/Llama-3.1-8B-Instruct',
        config: {
          max_tokens: 8192,
          temperature: 0.7,
          top_p: 0.9
        }
      }
    ];

    // Default embedding plugins
    const defaultEmbeddings = [
      {
        name: 'bge-small',
        type: 'embedding' as const,
        provider: 'huggingface',
        model_name: 'BAAI/bge-small-en-v1.5',
        config: {
          dimensions: 384,
          normalize: true
        }
      },
      {
        name: 'sentence-transformer',
        type: 'embedding' as const,
        provider: 'huggingface',
        model_name: 'sentence-transformers/all-MiniLM-L6-v2',
        config: {
          dimensions: 384,
          normalize: true
        }
      }
    ];

    // Register all default plugins
    for (const plugin of [...defaultLLMs, ...defaultEmbeddings]) {
      try {
        const existingPlugin = await storage.getPlugin(plugin.name);
        if (!existingPlugin) {
          await storage.createPlugin(plugin);
          console.log(`📦 Registered default plugin: ${plugin.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to register plugin ${plugin.name}:`, error);
      }
    }
  }

  private async loadPlugin(dbPlugin: Plugin) {
    try {
      let pluginImpl: PluginInterface;

      switch (dbPlugin.provider) {
        case 'huggingface':
          pluginImpl = await this.createHuggingFacePlugin(dbPlugin);
          break;
        default:
          console.warn(`⚠️ Unknown plugin provider: ${dbPlugin.provider}`);
          return;
      }

      await pluginImpl.initialize(dbPlugin.config);
      this.plugins.set(dbPlugin.name, pluginImpl);
      console.log(`✅ Loaded plugin: ${dbPlugin.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to load plugin ${dbPlugin.name}:`, error);
    }
  }

  private async createHuggingFacePlugin(dbPlugin: Plugin): Promise<PluginInterface> {
    return new HuggingFacePlugin(dbPlugin);
  }

  async getPlugin(name: string): Promise<PluginInterface | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.plugins.get(name);
  }

  async getAllPlugins(): Promise<PluginInterface[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return Array.from(this.plugins.values());
  }

  async getPluginsByType(type: string): Promise<PluginInterface[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return Array.from(this.plugins.values()).filter(p => p.type === type);
  }

  async registerPlugin(plugin: InsertPlugin): Promise<void> {
    await storage.createPlugin(plugin);
    
    // Load the plugin if enabled
    if (plugin.enabled) {
      const dbPlugin = await storage.getPlugin(plugin.name);
      if (dbPlugin) {
        await this.loadPlugin(dbPlugin);
      }
    }
  }

  async updatePluginMetrics(pluginName: string, metrics: any): Promise<void> {
    const dbPlugin = await storage.getPlugin(pluginName);
    if (dbPlugin) {
      await storage.updatePlugin(dbPlugin.id, {
        performance_metrics: metrics,
        updatedAt: new Date()
      });
    }
  }
}

class HuggingFacePlugin implements PluginInterface {
  name: string;
  type: 'llm' | 'embedding' | 'tool' | 'parser';
  provider = 'huggingface';
  private config: any;
  private metrics = {
    requests: 0,
    total_tokens: 0,
    avg_response_time: 0,
    errors: 0
  };

  constructor(dbPlugin: Plugin) {
    this.name = dbPlugin.name;
    this.type = dbPlugin.type as any;
    this.config = dbPlugin.config;
  }

  async initialize(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
    console.log(`🤗 Initialized Hugging Face plugin: ${this.name}`);
  }

  async execute(input: any, params?: any): Promise<any> {
    const startTime = Date.now();
    this.metrics.requests++;

    try {
      let result;
      
      if (this.type === 'llm') {
        result = await this.executeLLM(input, params);
      } else if (this.type === 'embedding') {
        result = await this.executeEmbedding(input, params);
      } else {
        throw new Error(`Unsupported plugin type: ${this.type}`);
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.metrics.avg_response_time = 
        (this.metrics.avg_response_time * (this.metrics.requests - 1) + responseTime) / this.metrics.requests;

      return result;
      
    } catch (error) {
      this.metrics.errors++;
      console.error(`❌ Plugin ${this.name} execution failed:`, error);
      throw error;
    }
  }

  private async executeLLM(input: string, params?: any): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY not found');
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.config.model_name}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: input,
          parameters: {
            max_new_tokens: params?.max_tokens || this.config.max_tokens || 1024,
            temperature: params?.temperature || this.config.temperature || 0.7,
            top_p: params?.top_p || this.config.top_p || 0.9,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (Array.isArray(result) && result[0]?.generated_text) {
      const generatedText = result[0].generated_text;
      this.metrics.total_tokens += this.estimateTokens(generatedText);
      return generatedText;
    }
    
    throw new Error('Unexpected response format from Hugging Face API');
  }

  private async executeEmbedding(input: string | string[], params?: any): Promise<number[][]> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY not found');
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.config.model_name}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: Array.isArray(input) ? input : [input],
          options: {
            wait_for_model: true
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result;
    }
    
    throw new Error('Unexpected response format from Hugging Face API');
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  getPerformanceMetrics() {
    return { ...this.metrics };
  }
}

export const pluginManager = new PluginManager();