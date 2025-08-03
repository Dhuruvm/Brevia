// Client-side AI service utilities and helpers

export interface ModelConfig {
  name: string;
  provider: "huggingface" | "openai" | "anthropic";
  endpoint?: string;
  maxTokens: number;
  supportedTasks: string[];
}

export const AI_MODELS: Record<string, ModelConfig> = {
  "llama-3.3-70b": {
    name: "Meta-Llama-3.3-70B-Instruct",
    provider: "huggingface",
    maxTokens: 4096,
    supportedTasks: ["text-generation", "reasoning", "analysis"]
  },
  "falcon3-10b": {
    name: "tiiuae/Falcon3-10B-Instruct",
    provider: "huggingface", 
    maxTokens: 2048,
    supportedTasks: ["text-generation", "summarization"]
  },
  "mistral-7b": {
    name: "mistralai/Mistral-7B-Instruct-v0.1",
    provider: "huggingface",
    maxTokens: 2048,
    supportedTasks: ["text-generation", "classification", "summarization"]
  }
};

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface AgentCapabilities {
  research: {
    multiSource: boolean;
    webSearch: boolean;
    pdfAnalysis: boolean;
    citationGeneration: boolean;
    vectorSearch: boolean;
  };
  notes: {
    textProcessing: boolean;
    pdfParsing: boolean;
    videoTranscription: boolean;
    urlExtraction: boolean;
    structuredOutput: boolean;
  };
  documents: {
    templateSelection: boolean;
    contentGeneration: boolean;
    formatting: boolean;
    exportFormats: string[];
  };
  resume: {
    atsOptimization: boolean;
    templateVariety: boolean;
    skillHighlighting: boolean;
    industrySpecific: boolean;
  };
  presentations: {
    slideGeneration: boolean;
    designTemplates: boolean;
    contentSuggestions: boolean;
    exportFormats: string[];
  };
}

export const AGENT_CAPABILITIES: AgentCapabilities = {
  research: {
    multiSource: true,
    webSearch: true, 
    pdfAnalysis: true,
    citationGeneration: true,
    vectorSearch: true
  },
  notes: {
    textProcessing: true,
    pdfParsing: true,
    videoTranscription: true,
    urlExtraction: true,
    structuredOutput: true
  },
  documents: {
    templateSelection: true,
    contentGeneration: true,
    formatting: true,
    exportFormats: ["pdf", "docx", "html", "md"]
  },
  resume: {
    atsOptimization: true,
    templateVariety: true,
    skillHighlighting: true,
    industrySpecific: true
  },
  presentations: {
    slideGeneration: true,
    designTemplates: true,
    contentSuggestions: true,
    exportFormats: ["pptx", "pdf", "html"]
  }
};

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function generateSessionTitle(agentType: string, query?: string): string {
  const timestamp = new Date().toLocaleDateString();
  
  if (query && query.length > 0) {
    const truncated = query.length > 50 ? query.substring(0, 47) + "..." : query;
    return `${agentType.charAt(0).toUpperCase() + agentType.slice(1)}: ${truncated}`;
  }
  
  return `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Session - ${timestamp}`;
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function extractKeywords(text: string, limit: number = 10): string[] {
  // Simple keyword extraction (in production, use more sophisticated NLP)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 3);
    
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
}

export function validateSlashCommand(input: string): {
  isValid: boolean;
  command?: string;
  args?: string;
} {
  if (!input.startsWith("/")) {
    return { isValid: false };
  }
  
  const parts = input.slice(1).split(" ");
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ");
  
  const validCommands = ["research", "summarize", "generate", "analyze", "create"];
  
  if (validCommands.includes(command)) {
    return { isValid: true, command, args };
  }
  
  return { isValid: false };
}
