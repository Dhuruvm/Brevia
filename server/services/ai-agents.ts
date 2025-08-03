import { huggingFace } from "./huggingface";
import { vectorDB } from "./vector-db";
import { storage } from "../storage";
import type { 
  AgentType, 
  InsertAgentWorkflow, 
  InsertMessage, 
  InsertSource, 
  InsertAgentLog,
  WorkflowStatus 
} from "@shared/schema";

export interface AgentStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

export interface AgentContext {
  sessionId: string;
  query: string;
  sources?: string[];
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected steps: AgentStep[] = [];
  protected workflowId?: string;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
  }

  abstract execute(context: AgentContext): Promise<string>;

  protected async initializeWorkflow(sessionId: string): Promise<void> {
    const workflow = await storage.createWorkflow({
      sessionId,
      agentType: this.agentType,
      status: 'planning',
      currentStep: 'initialization',
      steps: this.steps,
      progress: 0
    });
    this.workflowId = workflow.id;
  }

  protected async updateWorkflowStatus(
    status: WorkflowStatus, 
    currentStep?: string, 
    progress?: number
  ): Promise<void> {
    if (!this.workflowId) return;

    await storage.updateWorkflow(this.workflowId, {
      status,
      currentStep,
      progress,
      steps: this.steps
    });
  }

  protected async logMessage(sessionId: string, level: string, message: string, metadata?: any): Promise<void> {
    await storage.createLog({
      sessionId,
      level,
      message,
      metadata
    });
  }

  protected async updateStep(stepId: string, status: AgentStep['status'], result?: any, error?: string): Promise<void> {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
      step.result = result;
      step.error = error;
      
      if (status === 'running' && !step.startTime) {
        step.startTime = new Date();
      } else if ((status === 'completed' || status === 'error') && !step.endTime) {
        step.endTime = new Date();
      }
    }
  }
}

export class ResearchAgent extends BaseAgent {
  constructor() {
    super('research');
    this.steps = [
      { id: 'planning', name: 'Query Planning', status: 'pending' },
      { id: 'discovery', name: 'Source Discovery', status: 'pending' },
      { id: 'analysis', name: 'Content Analysis', status: 'pending' },
      { id: 'synthesis', name: 'Synthesis & Validation', status: 'pending' }
    ];
  }

  async execute(context: AgentContext): Promise<string> {
    await this.initializeWorkflow(context.sessionId);
    
    try {
      // Step 1: Query Planning
      await this.updateStep('planning', 'running');
      await this.updateWorkflowStatus('planning', 'Query Planning', 10);
      await this.logMessage(context.sessionId, 'info', 'Starting research query planning');
      
      const researchPlan = await this.planResearch(context.query);
      await this.updateStep('planning', 'completed', researchPlan);
      
      // Step 2: Source Discovery
      await this.updateStep('discovery', 'running');
      await this.updateWorkflowStatus('searching', 'Source Discovery', 30);
      await this.logMessage(context.sessionId, 'info', 'Discovering relevant sources');
      
      const sources = await this.discoverSources(context.sessionId, researchPlan);
      await this.updateStep('discovery', 'completed', { sourceCount: sources.length });
      
      // Step 3: Content Analysis
      await this.updateStep('analysis', 'running');
      await this.updateWorkflowStatus('analyzing', 'Content Analysis', 60);
      await this.logMessage(context.sessionId, 'info', `Processing ${sources.length} sources`);
      
      const analysis = await this.analyzeContent(sources);
      await this.updateStep('analysis', 'completed', analysis);
      
      // Step 4: Synthesis
      await this.updateStep('synthesis', 'running');
      await this.updateWorkflowStatus('generating', 'Synthesis & Validation', 85);
      await this.logMessage(context.sessionId, 'info', 'Synthesizing research findings');
      
      const report = await this.synthesizeReport(context.query, analysis, sources);
      await this.updateStep('synthesis', 'completed', { reportLength: report.length });
      
      await this.updateWorkflowStatus('completed', 'Research Complete', 100);
      await this.logMessage(context.sessionId, 'info', 'Research task completed successfully');
      
      return report;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateWorkflowStatus('error', 'Error', 0);
      await this.logMessage(context.sessionId, 'error', `Research failed: ${errorMessage}`);
      throw error;
    }
  }

  private async planResearch(query: string): Promise<string[]> {
    const planningPrompt = `
You are a research planning assistant. Break down this research query into 3-5 key areas to investigate:

Query: "${query}"

Provide a JSON array of research areas as strings.
Example: ["area1", "area2", "area3"]
`;

    const response = await huggingFace.mistral7b(planningPrompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback to basic areas
    }
    
    return [
      "Current state and definitions",
      "Recent developments and trends", 
      "Key technologies and methods",
      "Applications and use cases",
      "Future outlook and predictions"
    ];
  }

  private async discoverSources(sessionId: string, researchAreas: string[]): Promise<string[]> {
    // Simulate source discovery with some realistic research sources
    const mockSources = [
      {
        title: "Advanced AI Agent Architectures in 2025",
        url: "https://arxiv.org/abs/2501.00001",
        sourceType: "research_paper",
        content: "Comprehensive analysis of multi-agent systems and autonomous reasoning capabilities..."
      },
      {
        title: "Hugging Face Transformers: State of the Art Models",
        url: "https://huggingface.co/blog/transformers-state-of-the-art",
        sourceType: "web",
        content: "Latest developments in transformer architectures including Llama 4, Falcon 3..."
      },
      {
        title: "Enterprise AI Adoption Trends 2025",
        url: "https://research.example.com/ai-trends-2025",
        sourceType: "web", 
        content: "Industry report on AI integration, performance benchmarks, and adoption patterns..."
      }
    ];

    const sources: string[] = [];
    
    for (const mockSource of mockSources) {
      const source = await storage.createSource({
        sessionId,
        title: mockSource.title,
        url: mockSource.url,
        sourceType: mockSource.sourceType,
        content: mockSource.content,
        metadata: { researchAreas }
      });
      
      sources.push(source.content || "");
      
      // Add to vector database for future searches
      if (source.content) {
        const embedding = await huggingFace.sentenceTransformers([source.content]);
        await vectorDB.addDocument({
          id: source.id,
          content: source.content,
          metadata: { title: source.title, url: source.url, sourceType: source.sourceType },
          embedding: embedding[0]
        });
      }
    }
    
    return sources;
  }

  private async analyzeContent(sources: string[]): Promise<any> {
    const analysisPrompt = `
Analyze these research sources and extract key insights:

${sources.slice(0, 3).map((source, i) => `Source ${i + 1}: ${source.substring(0, 500)}...`).join('\n\n')}

Provide analysis in this format:
- Key themes
- Important findings  
- Notable trends
- Performance data/benchmarks
`;

    const analysis = await huggingFace.llama3_70b(analysisPrompt);
    return { summary: analysis, sourceCount: sources.length };
  }

  private async synthesizeReport(query: string, analysis: any, sources: string[]): Promise<string> {
    const synthesisPrompt = `
Create a comprehensive research report based on this analysis:

Research Query: "${query}"
Key Analysis: ${analysis.summary}
Sources Analyzed: ${sources.length}

Structure the report with:
1. Executive Summary
2. Key Findings
3. Detailed Analysis
4. Performance Benchmarks (if available)
5. Future Implications
6. Sources and Citations

Make it professional and well-structured.
`;

    return await huggingFace.llama3_70b(synthesisPrompt);
  }
}

export class NotesAgent extends BaseAgent {
  constructor() {
    super('notes');
    this.steps = [
      { id: 'parsing', name: 'Content Parsing', status: 'pending' },
      { id: 'structuring', name: 'Note Structuring', status: 'pending' },
      { id: 'formatting', name: 'Format Generation', status: 'pending' }
    ];
  }

  async execute(context: AgentContext): Promise<string> {
    await this.initializeWorkflow(context.sessionId);
    
    try {
      await this.updateWorkflowStatus('analyzing', 'Parsing Content', 20);
      // Implementation for notes generation
      const notes = await huggingFace.mistral7b(`Generate structured notes from: ${context.query}`);
      
      await this.updateWorkflowStatus('completed', 'Notes Generated', 100);
      return notes;
      
    } catch (error) {
      await this.updateWorkflowStatus('error', 'Error', 0);
      throw error;
    }
  }
}

export class DocumentAgent extends BaseAgent {
  constructor() {
    super('documents');
    this.steps = [
      { id: 'outlining', name: 'Document Outlining', status: 'pending' },
      { id: 'writing', name: 'Content Writing', status: 'pending' },
      { id: 'formatting', name: 'Document Formatting', status: 'pending' }
    ];
  }

  async execute(context: AgentContext): Promise<string> {
    await this.initializeWorkflow(context.sessionId);
    
    try {
      await this.updateWorkflowStatus('generating', 'Creating Document', 50);
      const document = await huggingFace.llama3_70b(`Create a professional document for: ${context.query}`);
      
      await this.updateWorkflowStatus('completed', 'Document Generated', 100);
      return document;
      
    } catch (error) {
      await this.updateWorkflowStatus('error', 'Error', 0);
      throw error;
    }
  }
}

export class ResumeAgent extends BaseAgent {
  constructor() {
    super('resume');
    this.steps = [
      { id: 'analysis', name: 'Profile Analysis', status: 'pending' },
      { id: 'template', name: 'Template Selection', status: 'pending' },
      { id: 'generation', name: 'Resume Generation', status: 'pending' }
    ];
  }

  async execute(context: AgentContext): Promise<string> {
    await this.initializeWorkflow(context.sessionId);
    
    try {
      await this.updateWorkflowStatus('generating', 'Building Resume', 50);
      const resume = await huggingFace.mistral7b(`Create a professional resume for: ${context.query}`);
      
      await this.updateWorkflowStatus('completed', 'Resume Generated', 100);
      return resume;
      
    } catch (error) {
      await this.updateWorkflowStatus('error', 'Error', 0);
      throw error;
    }
  }
}

export class PresentationAgent extends BaseAgent {
  constructor() {
    super('presentations');
    this.steps = [
      { id: 'planning', name: 'Presentation Planning', status: 'pending' },
      { id: 'slides', name: 'Slide Creation', status: 'pending' },
      { id: 'design', name: 'Design Application', status: 'pending' }
    ];
  }

  async execute(context: AgentContext): Promise<string> {
    await this.initializeWorkflow(context.sessionId);
    
    try {
      await this.updateWorkflowStatus('generating', 'Creating Slides', 50);
      const presentation = await huggingFace.llama3_70b(`Create a presentation outline for: ${context.query}`);
      
      await this.updateWorkflowStatus('completed', 'Presentation Generated', 100);
      return presentation;
      
    } catch (error) {
      await this.updateWorkflowStatus('error', 'Error', 0);
      throw error;
    }
  }
}

// Agent factory
export function createAgent(agentType: AgentType): BaseAgent {
  switch (agentType) {
    case 'research':
      return new ResearchAgent();
    case 'notes':
      return new NotesAgent();
    case 'documents':
      return new DocumentAgent();
    case 'resume':
      return new ResumeAgent();
    case 'presentations':
      return new PresentationAgent();
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}
