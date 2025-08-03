import { Brain, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AgentType } from "@shared/schema";

interface TopNavbarProps {
  selectedAgent: AgentType;
  onAgentSelect: (agent: AgentType) => void;
}

export default function TopNavbar({ selectedAgent, onAgentSelect }: TopNavbarProps) {
  const agentModes = [
    { id: "research" as AgentType, label: "Research Agent" },
    { id: "notes" as AgentType, label: "Notes Gen" },
    { id: "documents" as AgentType, label: "Docs Gen" },
    { id: "resume" as AgentType, label: "Resume" },
    { id: "presentations" as AgentType, label: "Slides" },
  ];

  return (
    <nav className="bg-card/95 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 gemini-glass">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gemini-gradient rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Brevia AI
          </h1>
        </div>
        
        {/* Mode Selector */}
        <div className="hidden md:flex bg-muted/50 rounded-xl p-1.5 border border-border/50">
          {agentModes.map((mode) => (
            <Button
              key={mode.id}
              variant="ghost"
              size="sm"
              onClick={() => onAgentSelect(mode.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                selectedAgent === mode.id
                  ? "bg-primary text-primary-foreground shadow-sm gemini-button"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Model Status */}
        <div className="hidden lg:flex items-center space-x-2 bg-muted/50 rounded-xl px-3 py-2 border border-border/50">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Llama 3.3 70B</span>
        </div>
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted/70 border border-border/50"
        >
          <Sun className="w-4 h-4 text-muted-foreground" />
        </Button>
        
        {/* Account */}
        <Avatar className="w-8 h-8 gemini-gradient cursor-pointer shadow-md">
          <AvatarFallback className="text-xs font-semibold text-white bg-transparent">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
