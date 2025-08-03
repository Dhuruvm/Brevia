import { Search, StickyNote, FileText, UserCheck, Presentation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AgentType, ChatSession } from "@shared/schema";

interface LeftSidebarProps {
  selectedAgent: AgentType;
  onAgentSelect: (agent: AgentType) => void;
  currentSession: ChatSession | null;
}

export default function LeftSidebar({ selectedAgent, onAgentSelect, currentSession }: LeftSidebarProps) {
  const agents = [
    {
      id: "research" as AgentType,
      name: "Research Agent",
      description: "Multi-source research & validation",
      icon: Search,
      color: "text-primary",
      bgColor: "bg-primary/10 border-primary/20",
      badges: ["Active", "Flagship"]
    },
    {
      id: "notes" as AgentType,
      name: "Notes Generator", 
      description: "Text, PDFs, video, links",
      icon: StickyNote,
      color: "text-secondary",
      bgColor: "bg-gray-800/30"
    },
    {
      id: "documents" as AgentType,
      name: "Document Generator",
      description: "Custom reports & docs", 
      icon: FileText,
      color: "text-accent",
      bgColor: "bg-gray-800/30"
    },
    {
      id: "resume" as AgentType,
      name: "Resume Generator",
      description: "Professional templates",
      icon: UserCheck,
      color: "text-yellow-500",
      bgColor: "bg-gray-800/30"
    },
    {
      id: "presentations" as AgentType,
      name: "Presentation Generator",
      description: "AI-powered slides",
      icon: Presentation,
      color: "text-pink-500", 
      bgColor: "bg-gray-800/30"
    }
  ];

  const recentSessions = [
    { title: "AI Agent Research Project", time: "2 hours ago", type: "Research" },
    { title: "Quarterly Report Generation", time: "1 day ago", type: "Documents" },
    { title: "Conference Presentation", time: "3 days ago", type: "Slides" }
  ];

  const activeModels = [
    { name: "Llama 3.3 70B", status: "Primary", statusColor: "bg-green-400" },
    { name: "Falcon3-10B", status: "Fallback", statusColor: "bg-yellow-400" }
  ];

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-xl border-r border-border p-4 overflow-y-auto gemini-glass">
      {/* Agent Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          AI Agents
        </h3>
        <div className="space-y-2">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent === agent.id;
            
            return (
              <Card
                key={agent.id}
                className={`p-3 cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
                  isSelected ? "bg-primary/10 border-primary/30 shadow-md" : "bg-muted/20 border-border/50"
                } rounded-xl`}
                onClick={() => onAgentSelect(agent.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${isSelected ? 'bg-primary/20 shadow-sm' : 'bg-muted/50'} rounded-xl flex items-center justify-center transition-all`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-foreground">{agent.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{agent.description}</div>
                  </div>
                </div>
                {agent.badges && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {agent.badges.map((badge) => (
                      <Badge
                        key={badge}
                        variant={badge === "Active" ? "default" : "secondary"}
                        className={`text-xs ${
                          badge === "Active" 
                            ? "bg-primary/20 text-primary border-primary/30" 
                            : "bg-muted/50 text-muted-foreground border-border/50"
                        }`}
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Recent Sessions
        </h3>
        <div className="space-y-2">
          {recentSessions.map((session, index) => (
            <Card 
              key={index}
              className="p-3 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-all border-border/50 rounded-xl"
            >
              <div className="text-sm font-medium truncate text-foreground">{session.title}</div>
              <div className="text-xs text-muted-foreground">{session.time} • {session.type}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Models */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Active Models
        </h3>
        <div className="space-y-2">
          {activeModels.map((model, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/50"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 ${model.statusColor} rounded-full`} />
                <span className="text-xs font-medium text-foreground">{model.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{model.status}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
