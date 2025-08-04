import { storage } from '../storage';
import { ResearchAgent } from '../agents/research-agent';
import { NotesAgent } from '../agents/notes-agent';
import { pluginManager } from './plugin-manager';
import type { Workflow } from '@shared/schema';

export type AgentType = 'research' | 'notes' | 'documents' | 'resume' | 'presentation';

export interface TaskRequest {
  task: string;
  agentType: AgentType;
  sessionId: string;
  userId: string;
  context?: any;
}

export interface TaskResult {
  workflowId: string;
  success: boolean;
  content: string;
  metadata: any;
  error?: string;
}

export class AgentOrchestrator {
  private activeWorkflows: Map<string, any> = new Map();

  async initialize() {
    // Initialize plugin manager first
    await pluginManager.initialize();
    console.log('🎯 Agent Orchestrator initialized');
  }

  async executeTask(request: TaskRequest): Promise<TaskResult> {
    console.log(`🚀 Starting ${request.agentType} task: ${request.task.substring(0, 100)}...`);

    try {
      // Create workflow record
      const workflow = await this.createWorkflow(request);
      
      // Get appropriate agent
      const agent = this.createAgent(request.agentType, workflow.id, request.sessionId);
      
      if (!agent) {
        throw new Error(`Agent type "${request.agentType}" not implemented`);
      }

      // Store active workflow
      this.activeWorkflows.set(workflow.id, {
        agent,
        request,
        startTime: new Date()
      });

      // Execute the agent workflow
      const result = await agent.execute(request.task);

      // Remove from active workflows
      this.activeWorkflows.delete(workflow.id);

      console.log(`✅ ${request.agentType} task completed successfully`);

      return {
        workflowId: workflow.id,
        success: result.success,
        content: result.content,
        metadata: result.metadata,
        error: result.error
      };

    } catch (error) {
      console.error(`❌ ${request.agentType} task failed:`, error);
      
      return {
        workflowId: '',
        success: false,
        content: '',
        metadata: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async createWorkflow(request: TaskRequest): Promise<Workflow> {
    const workflow = await storage.createWorkflow({
      sessionId: request.sessionId,
      agentType: request.agentType,
      task: request.task,
      status: 'pending',
      steps: [], // Will be populated by the agent
      currentStep: 0
    });

    return workflow;
  }

  private createAgent(agentType: AgentType, workflowId: string, sessionId: string): any {
    switch (agentType) {
      case 'research':
        return new ResearchAgent(workflowId, sessionId);
      case 'notes':
        return new NotesAgent(workflowId, sessionId);
      case 'documents':
        // TODO: Implement DocumentAgent
        throw new Error('Document agent not yet implemented');
      case 'resume':
        // TODO: Implement ResumeAgent
        throw new Error('Resume agent not yet implemented');
      case 'presentation':
        // TODO: Implement PresentationAgent
        throw new Error('Presentation agent not yet implemented');
      default:
        return null;
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<any> {
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const active = this.activeWorkflows.get(workflowId);
    
    return {
      id: workflow.id,
      status: workflow.status,
      agentType: workflow.agentType,
      task: workflow.task,
      currentStep: workflow.currentStep,
      steps: workflow.steps,
      confidence: workflow.confidence,
      startedAt: workflow.startedAt,
      completedAt: workflow.completedAt,
      isActive: !!active,
      result: workflow.result
    };
  }

  async getActiveWorkflows(): Promise<any[]> {
    const workflows = [];
    
    for (const [workflowId, workflowData] of this.activeWorkflows) {
      const status = await this.getWorkflowStatus(workflowId);
      workflows.push({
        ...status,
        runtime: Date.now() - workflowData.startTime.getTime()
      });
    }

    return workflows;
  }

  async cancelWorkflow(workflowId: string): Promise<boolean> {
    const active = this.activeWorkflows.get(workflowId);
    if (active) {
      // In production, would implement proper cancellation
      this.activeWorkflows.delete(workflowId);
      
      // Update workflow status
      await storage.updateWorkflow(workflowId, {
        status: 'failed',
        completedAt: new Date(),
        result: { success: false, error: 'Cancelled by user' }
      });

      return true;
    }

    return false;
  }

  // Auto-detection of agent type based on task content
  async detectAgentType(task: string): Promise<AgentType> {
    const llm = await pluginManager.getPlugin('mistral-7b');
    if (!llm) {
      // Fallback to simple keyword detection
      return this.simpleAgentTypeDetection(task);
    }

    const prompt = `
Analyze this task and determine the most appropriate AI agent type:

Task: "${task}"

Agent types available:
- research: For gathering information, analyzing sources, creating research reports
- notes: For creating notes from content, summarizing, organizing information
- documents: For creating formal documents, reports, articles
- resume: For creating or updating resumes and CVs
- presentation: For creating presentation content and slides

Return only the agent type name (research, notes, documents, resume, or presentation).`;

    try {
      const response = await llm.execute(prompt);
      const agentType = response.trim().toLowerCase();
      
      if (['research', 'notes', 'documents', 'resume', 'presentation'].includes(agentType)) {
        return agentType as AgentType;
      }
    } catch (error) {
      console.warn('Failed to detect agent type using LLM, using fallback');
    }

    return this.simpleAgentTypeDetection(task);
  }

  private simpleAgentTypeDetection(task: string): AgentType {
    const taskLower = task.toLowerCase();
    
    // Research keywords
    if (taskLower.includes('research') || taskLower.includes('analyze') || 
        taskLower.includes('investigate') || taskLower.includes('study') ||
        taskLower.includes('find information') || taskLower.includes('sources')) {
      return 'research';
    }
    
    // Notes keywords
    if (taskLower.includes('notes') || taskLower.includes('summarize') || 
        taskLower.includes('take notes') || taskLower.includes('summary') ||
        taskLower.includes('outline') || taskLower.includes('bullet points')) {
      return 'notes';
    }
    
    // Resume keywords
    if (taskLower.includes('resume') || taskLower.includes('cv') || 
        taskLower.includes('curriculum vitae') || taskLower.includes('job application')) {
      return 'resume';
    }
    
    // Presentation keywords
    if (taskLower.includes('presentation') || taskLower.includes('slides') || 
        taskLower.includes('powerpoint') || taskLower.includes('pitch deck')) {
      return 'presentation';
    }
    
    // Document keywords or default
    if (taskLower.includes('document') || taskLower.includes('report') || 
        taskLower.includes('article') || taskLower.includes('write')) {
      return 'documents';
    }
    
    // Default to research for ambiguous tasks
    return 'research';
  }
}

export const agentOrchestrator = new AgentOrchestrator();