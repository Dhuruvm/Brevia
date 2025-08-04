import { storage } from '../storage';
import type { Workflow, AgentLog, Source, Document, KnowledgeBase } from '@shared/schema';

export interface AgentConfig {
  id: string;
  type: string;
  models: {
    primary: string;
    fallback?: string;
    embedding?: string;
  };
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  retries: number;
}

export interface AgentStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
  confidence?: number;
}

export interface AgentResult {
  success: boolean;
  content: string;
  metadata: {
    sources?: Source[];
    citations?: string[];
    confidence: number;
    processingTime: number;
    tokensUsed: number;
    modelsUsed: string[];
  };
  error?: string;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected workflowId: string;
  protected sessionId: string;
  protected steps: AgentStep[] = [];
  protected startTime: Date = new Date();

  constructor(config: AgentConfig, workflowId: string, sessionId: string) {
    this.config = config;
    this.workflowId = workflowId;
    this.sessionId = sessionId;
  }

  // Abstract methods that each agent must implement
  abstract defineWorkflow(task: string): AgentStep[];
  abstract executeStep(step: AgentStep, context: any): Promise<any>;
  abstract synthesizeResult(stepOutputs: any[]): Promise<AgentResult>;

  // Core execution method
  async execute(task: string): Promise<AgentResult> {
    try {
      console.log(`🤖 ${this.config.type} Agent starting execution for task: ${task}`);
      
      // Define workflow steps
      this.steps = this.defineWorkflow(task);
      await this.updateWorkflowSteps();

      // Execute steps sequentially
      const stepOutputs: any[] = [];
      let context = { task, sessionId: this.sessionId };

      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        
        try {
          console.log(`📋 Executing step: ${step.name}`);
          
          step.status = 'running';
          step.startTime = new Date();
          await this.updateWorkflowSteps();
          await this.logStep(step, 'started', null, null);

          const output = await this.executeStep(step, context);
          
          step.output = output;
          step.status = 'completed';
          step.endTime = new Date();
          stepOutputs.push(output);
          
          // Update context with step output
          context = { ...context, [`step_${step.id}`]: output };
          
          await this.updateWorkflowSteps();
          await this.logStep(step, 'completed', null, output);
          
          console.log(`✅ Step completed: ${step.name}`);
          
        } catch (error) {
          console.error(`❌ Step failed: ${step.name}`, error);
          
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : String(error);
          step.endTime = new Date();
          
          await this.updateWorkflowSteps();
          await this.logStep(step, 'failed', error instanceof Error ? error.message : String(error), null);
          
          // Decide whether to continue or fail completely
          if (step.name.includes('critical') || step.name.includes('required')) {
            throw error;
          }
          
          // Mark as skipped and continue
          step.status = 'skipped';
        }
      }

      // Synthesize final result
      const result = await this.synthesizeResult(stepOutputs);
      
      // Update workflow as completed
      await this.completeWorkflow(result);
      
      console.log(`🎉 ${this.config.type} Agent completed successfully`);
      return result;
      
    } catch (error) {
      console.error(`💥 ${this.config.type} Agent failed:`, error);
      
      const failedResult: AgentResult = {
        success: false,
        content: '',
        metadata: {
          confidence: 0,
          processingTime: Date.now() - this.startTime.getTime(),
          tokensUsed: 0,
          modelsUsed: []
        },
        error: error instanceof Error ? error.message : String(error)
      };
      
      await this.completeWorkflow(failedResult);
      return failedResult;
    }
  }

  // Workflow management methods
  protected async updateWorkflowSteps() {
    await storage.updateWorkflow(this.workflowId, {
      steps: this.steps,
      currentStep: this.steps.findIndex(s => s.status === 'running') || 0
    });
  }

  protected async completeWorkflow(result: AgentResult) {
    await storage.updateWorkflow(this.workflowId, {
      status: result.success ? 'completed' : 'failed',
      result: result,
      confidence: result.metadata.confidence,
      completedAt: new Date()
    });
  }

  // Logging methods
  protected async logStep(step: AgentStep, status: string, error: string | null, output: any) {
    await storage.createAgentLog({
      workflowId: this.workflowId,
      agentType: this.config.type,
      step: step.name,
      input: step.input,
      output: output,
      model_used: this.config.models.primary,
      tokens_used: this.estimateTokens(output),
      duration: step.endTime && step.startTime ? 
        step.endTime.getTime() - step.startTime.getTime() : 0,
      success: status === 'completed',
      error: error
    });
  }

  // Helper methods
  protected estimateTokens(text: any): number {
    if (typeof text !== 'string') {
      text = JSON.stringify(text);
    }
    return Math.ceil(text.length / 4); // Rough estimation
  }

  protected async storeSource(source: Omit<Source, 'id' | 'createdAt'>) {
    const storedSource = await storage.createSource({
      ...source,
      workflowId: this.workflowId
    });
    return storedSource;
  }

  protected async storeDocument(doc: Omit<Document, 'id' | 'createdAt'>) {
    const storedDoc = await storage.createDocument({
      ...doc,
      sessionId: this.sessionId,
      workflowId: this.workflowId
    });
    return storedDoc;
  }

  protected async storeKnowledge(knowledge: Omit<KnowledgeBase, 'id' | 'createdAt' | 'updatedAt'>) {
    const storedKnowledge = await storage.createKnowledge({
      ...knowledge
    });
    return storedKnowledge;
  }

  // Quality assessment methods
  protected assessContentQuality(content: string): number {
    // Basic quality scoring algorithm
    let score = 0.5; // Base score
    
    // Length factor
    if (content.length > 500) score += 0.1;
    if (content.length > 2000) score += 0.1;
    
    // Structure factor
    if (content.includes('\n')) score += 0.05;
    if (content.match(/#{1,6}\s/g)) score += 0.1; // Headers
    if (content.includes('**') || content.includes('*')) score += 0.05; // Formatting
    
    // Citation factor
    const citations = content.match(/\[[^\]]+\]/g) || [];
    score += Math.min(citations.length * 0.02, 0.1);
    
    // Readability (basic)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = content.length / sentences.length;
    if (avgSentenceLength > 10 && avgSentenceLength < 25) score += 0.05;
    
    return Math.min(score, 1.0);
  }

  protected assessSourceCredibility(url: string, domain?: string): number {
    // Basic credibility scoring
    let score = 0.5; // Base score
    
    if (domain) {
      // Academic sources
      if (domain.includes('.edu') || domain.includes('.ac.')) score += 0.3;
      if (domain.includes('scholar.google') || domain.includes('arxiv.org')) score += 0.3;
      
      // News sources
      if (['bbc.com', 'reuters.com', 'ap.org', 'npr.org'].includes(domain)) score += 0.2;
      
      // Government sources
      if (domain.includes('.gov')) score += 0.25;
      
      // Wikipedia (moderate)
      if (domain.includes('wikipedia.org')) score += 0.1;
      
      // Social media (lower)
      if (['twitter.com', 'facebook.com', 'reddit.com'].includes(domain)) score -= 0.1;
    }
    
    // HTTPS factor
    if (url.startsWith('https://')) score += 0.05;
    
    return Math.max(0.1, Math.min(score, 1.0));re, 1.0));
  }
}