import { useQuery } from "@tanstack/react-query";
import type { AgentType } from "@shared/schema";

interface Agent {
  id: AgentType;
  name: string;
  description: string;
  status: "active" | "idle" | "error";
  capabilities: string[];
}

export function useAgents() {
  const agents: Agent[] = [
    {
      id: "research",
      name: "Research Agent", 
      description: "Multi-source research with validation and citation",
      status: "active",
      capabilities: ["web_search", "pdf_analysis", "source_validation", "citation_generation"]
    },
    {
      id: "notes",
      name: "Notes Generator",
      description: "Generate structured notes from various input formats",
      status: "idle",
      capabilities: ["text_processing", "pdf_parsing", "video_transcription", "url_extraction"]
    },
    {
      id: "documents", 
      name: "Document Generator",
      description: "Create professional documents and reports",
      status: "idle",
      capabilities: ["document_formatting", "template_selection", "content_generation", "export_options"]
    },
    {
      id: "resume",
      name: "Resume Generator",
      description: "Build professional resumes with industry templates",
      status: "idle", 
      capabilities: ["template_selection", "ats_optimization", "skill_highlighting", "format_export"]
    },
    {
      id: "presentations",
      name: "Presentation Generator",
      description: "Create engaging presentations with AI-generated content",
      status: "idle",
      capabilities: ["slide_generation", "content_creation", "design_templates", "export_formats"]
    }
  ];

  return {
    agents,
    isLoading: false,
    error: null
  };
}
