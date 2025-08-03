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
    <nav className="bg-brevia-dark/80 backdrop-blur-xl border-b border-gray-800/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Brevia AI
          </h1>
        </div>
        
        {/* Mode Selector */}
        <div className="hidden md:flex bg-gray-800/50 rounded-lg p-1">
          {agentModes.map((mode) => (
            <Button
              key={mode.id}
              variant="ghost"
              size="sm"
              onClick={() => onAgentSelect(mode.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedAgent === mode.id
                  ? "bg-primary/20 text-primary"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Model Status */}
        <div className="hidden lg:flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-gray-300">Llama 3.3 70B</span>
        </div>
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50"
        >
          <Sun className="w-4 h-4 text-gray-400" />
        </Button>
        
        {/* Account */}
        <Avatar className="w-8 h-8 bg-gradient-to-br from-accent to-secondary cursor-pointer">
          <AvatarFallback className="text-xs font-semibold text-white bg-transparent">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
