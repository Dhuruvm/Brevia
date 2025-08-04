import { queryClient } from './queryClient';

export interface AgentTaskRequest {
  task: string;
  agentType?: 'research' | 'notes' | 'documents' | 'resume' | 'presentation';
  sessionId: string;
}

export interface AgentTaskResult {
  success: boolean;
  content: string;
  agentType: string;
  workflowId: string;
  metadata: {
    confidence: number;
    processingTime: number;
    tokensUsed: number;
    modelsUsed: string[];
    sources?: any[];
    citations?: any[];
  };
  error?: string;
}

export interface WorkflowStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agentType: string;
  task: string;
  currentStep: number;
  steps: any[];
  confidence?: number;
  startedAt: string;
  completedAt?: string;
  isActive: boolean;
  result?: any;
}

export class AgentService {
  static async executeAgent(request: AgentTaskRequest): Promise<AgentTaskResult> {
    const response = await fetch('/api/agents/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Agent execution failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async detectAgentType(task: string): Promise<string> {
    const response = await fetch('/api/agents/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task }),
    });

    if (!response.ok) {
      throw new Error(`Agent detection failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.agentType;
  }

  static async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    const response = await fetch(`/api/workflows/${workflowId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get workflow status: ${response.statusText}`);
    }

    return response.json();
  }

  static async getActiveWorkflows(): Promise<WorkflowStatus[]> {
    const response = await fetch('/api/workflows/active');

    if (!response.ok) {
      throw new Error(`Failed to get active workflows: ${response.statusText}`);
    }

    return response.json();
  }

  static async cancelWorkflow(workflowId: string): Promise<boolean> {
    const response = await fetch(`/api/workflows/${workflowId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel workflow: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success;
  }

  static async getSessionDocuments(sessionId: string): Promise<any[]> {
    const response = await fetch(`/api/sessions/${sessionId}/documents`);

    if (!response.ok) {
      throw new Error(`Failed to get documents: ${response.statusText}`);
    }

    return response.json();
  }

  static async getAgentMetrics(agentType: string): Promise<any[]> {
    const response = await fetch(`/api/agents/${agentType}/metrics`);

    if (!response.ok) {
      throw new Error(`Failed to get agent metrics: ${response.statusText}`);
    }

    return response.json();
  }

  static async getPlugins(): Promise<any[]> {
    const response = await fetch('/api/plugins');

    if (!response.ok) {
      throw new Error(`Failed to get plugins: ${response.statusText}`);
    }

    return response.json();
  }

  static async getSystemHealth(): Promise<any> {
    const response = await fetch('/api/health');

    if (!response.ok) {
      throw new Error(`Failed to get system health: ${response.statusText}`);
    }

    return response.json();
  }
}

// Agent type configurations
export const AGENT_CONFIGS = {
  research: {
    name: 'Research Agent',
    description: 'Conducts comprehensive research and analysis',
    icon: '🔍',
    color: 'blue',
    capabilities: [
      'Web research and source validation',
      'Academic paper analysis',
      'Data synthesis and reporting',
      'Citation generation'
    ]
  },
  notes: {
    name: 'Notes Agent',
    description: 'Creates structured notes from any content',
    icon: '📝',
    color: 'green',
    capabilities: [
      'Content summarization',
      'Structured note organization',
      'Key point extraction',
      'Cross-references and links'
    ]
  },
  documents: {
    name: 'Document Agent',
    description: 'Generates professional documents and reports',
    icon: '📄',
    color: 'purple',
    capabilities: [
      'Report generation',
      'Document formatting',
      'Content structuring',
      'Professional writing'
    ]
  },
  resume: {
    name: 'Resume Agent',
    description: 'Creates and optimizes resumes and CVs',
    icon: '👤',
    color: 'orange',
    capabilities: [
      'Resume optimization',
      'Skills highlighting',
      'Format customization',
      'ATS compatibility'
    ]
  },
  presentation: {
    name: 'Presentation Agent',
    description: 'Designs presentation content and slides',
    icon: '📊',
    color: 'red',
    capabilities: [
      'Slide content creation',
      'Visual storytelling',
      'Data visualization',
      'Presentation flow'
    ]
  }
};