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
      console.log(`🤖 ${this.config.type} Agent starting execution for task: ${task.substring(0, 100)}...`);
      
      // Define workflow steps
      this.steps = this.defineWorkflow(task);
      console.log(`📋 Defined ${this.steps.length} workflow steps`);
      await this.updateWorkflowSteps();

      // Execute steps sequentially with progress tracking
      const stepOutputs: any[] = [];
      let context = { task, sessionId: this.sessionId };
      let completedSteps = 0;

      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        const stepProgress = ((i / this.steps.length) * 100).toFixed(0);
        
        try {
          console.log(`📋 Executing step ${i + 1}/${this.steps.length}: ${step.name} (${stepProgress}%)`);
          
          step.status = 'running';
          step.startTime = new Date();
          
          // Add real-time logs for thinking process
          await this.addRealTimeLog(step, `🧠 Starting ${step.name.toLowerCase()}...`);
          await this.updateWorkflowSteps();
          await this.logStep(step, 'started', null, null);

          // Execute step with timeout protection
          const output = await this.executeStepWithTimeout(step, context, 60000); // 1 minute per step
          
          step.output = output;
          step.status = 'completed';
          step.endTime = new Date();
          stepOutputs.push(output);
          completedSteps++;
          
          // Update context with step output
          context = { ...context, [`step_${step.id}`]: output };
          
          // Add completion log
          await this.addRealTimeLog(step, `✅ ${step.name} completed successfully`);
          await this.updateWorkflowSteps();
          await this.logStep(step, 'completed', null, output);
          
          const stepTime = step.endTime.getTime() - step.startTime.getTime();
          console.log(`✅ Step completed: ${step.name} (${stepTime}ms)`);
          
        } catch (error) {
          console.error(`❌ Step failed: ${step.name}`, error);
          
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : String(error);
          step.endTime = new Date();
          
          await this.addRealTimeLog(step, `❌ ${step.name} failed: ${step.error}`);
          await this.updateWorkflowSteps();
          await this.logStep(step, 'failed', error instanceof Error ? error.message : String(error), null);
          
          // Decide whether to continue or fail completely
          const isCritical = step.name.toLowerCase().includes('critical') || 
                           step.name.toLowerCase().includes('required') ||
                           step.name.toLowerCase().includes('essential');
          
          if (isCritical) {
            throw error;
          }
          
          // Create fallback output for non-critical steps
          const fallbackOutput = this.createFallbackOutput(step, error);
          stepOutputs.push(fallbackOutput);
          
          // Mark as skipped and continue
          step.status = 'skipped';
          await this.addRealTimeLog(step, `⏭️ Skipping non-critical step, continuing workflow...`);
        }
      }

      console.log(`📊 Workflow execution summary: ${completedSteps}/${this.steps.length} steps completed successfully`);

      // Ensure we have outputs for synthesis
      if (stepOutputs.length === 0) {
        throw new Error('No step outputs available for synthesis');
      }

      // Synthesize final result
      console.log('🔄 Synthesizing final result...');
      const result = await this.synthesizeResult(stepOutputs);
      
      // Ensure result has required properties
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid result from synthesis step');
      }

      // Add workflow completion metadata
      result.metadata = {
        ...result.metadata,
        workflow_steps: this.steps.length,
        completed_steps: completedSteps,
        success_rate: (completedSteps / this.steps.length * 100).toFixed(1) + '%',
        execution_time: Date.now() - this.startTime.getTime(),
        workflow_completed: true
      };
      
      // Update workflow as completed
      await this.completeWorkflow(result);
      
      console.log(`🎉 ${this.config.type} Agent completed successfully - ${completedSteps}/${this.steps.length} steps executed`);
      return result;
      
    } catch (error) {
      console.error(`💥 ${this.config.type} Agent failed:`, error);
      
      // Mark any running steps as failed
      for (const step of this.steps) {
        if (step.status === 'running') {
          step.status = 'failed';
          step.error = 'Agent execution terminated';
          step.endTime = new Date();
        }
      }
      await this.updateWorkflowSteps();
      
      const failedResult: AgentResult = {
        success: false,
        content: error instanceof Error ? error.message : String(error),
        metadata: {
          confidence: 0,
          processingTime: Date.now() - this.startTime.getTime(),
          tokensUsed: 0,
          modelsUsed: [],
          workflow_steps: this.steps.length,
          completed_steps: this.steps.filter(s => s.status === 'completed').length,
          workflow_completed: false,
          failure_reason: error instanceof Error ? error.message : String(error)
        },
        error: error instanceof Error ? error.message : String(error)
      };
      
      await this.completeWorkflow(failedResult);
      return failedResult;
    }
  }

  private async executeStepWithTimeout(step: AgentStep, context: any, timeoutMs: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Step "${step.name}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await this.executeStep(step, context);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private createFallbackOutput(step: AgentStep, error: any): any {
    return {
      step_id: step.id,
      step_name: step.name,
      status: 'fallback',
      error: error instanceof Error ? error.message : String(error),
      fallback_data: `Fallback data for ${step.name}`,
      timestamp: new Date().toISOString()
    };
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
    if (!text) return 0;
    if (typeof text !== 'string') {
      try {
        text = JSON.stringify(text);
      } catch (error) {
        return 0;
      }
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
  // Real-time logging method
  protected async addRealTimeLog(step: AgentStep, logMessage: string) {
    try {
      if (!step.logs) step.logs = [];
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // Just time part
      step.logs.push(`[${timestamp}] ${logMessage}`);
      
      // Update workflow with new logs - but don't wait for it to avoid blocking
      this.updateWorkflowSteps().catch(error => {
        console.warn('Failed to update workflow logs:', error);
      });
      
      // Small delay to make logs visible
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn('Failed to add real-time log:', error);
    }
  }

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
    
    return Math.max(0.1, Math.min(score, 1.0));
  }
}