import { useState } from "react";
import { Pause, Square, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AgentStatusPill from "@/components/ui/agent-status-pill";
import AgentWorkflow from "@/components/chat/agent-workflow";
import Message from "@/components/chat/message";
import InputBar from "@/components/chat/input-bar";
import type { AgentType, ChatSession, Message as MessageType, AgentWorkflow as WorkflowType } from "@shared/schema";

interface CenterPanelProps {
  selectedAgent: AgentType;
  session: ChatSession | null;
  messages: MessageType[];
  workflow: WorkflowType | null;
  onSendMessage: (content: string) => Promise<void>;
}

export default function CenterPanel({ 
  selectedAgent, 
  session, 
  messages, 
  workflow, 
  onSendMessage 
}: CenterPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (content: string) => {
    setIsProcessing(true);
    try {
      await onSendMessage(content);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAgentDisplayName = (agentType: AgentType): string => {
    const names = {
      research: "Research Agent",
      notes: "Notes Generator", 
      documents: "Document Generator",
      resume: "Resume Generator",
      presentations: "Presentation Generator"
    };
    return names[agentType] || agentType;
  };

  const getCurrentTask = (): string => {
    if (!workflow) return "Ready to assist";
    if (workflow.status === "completed") return "Task completed successfully";
    if (workflow.status === "error") return "Error occurred during processing";
    return workflow.currentStep || "Processing...";
  };

  return (
    <main className="flex-1 flex flex-col bg-background/60">
      {/* Agent Status Bar */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border px-6 py-3 gemini-glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">{getAgentDisplayName(selectedAgent)}</span>
              <AgentStatusPill status={workflow?.status || "idle"} />
            </div>
            <div className="text-xs text-muted-foreground">
              {getCurrentTask()}
            </div>
          </div>
          
          {workflow && workflow.status !== "completed" && workflow.status !== "error" && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-xl bg-muted/50 hover:bg-muted/70 border border-border/50"
              >
                <Pause className="w-3 h-3 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-xl bg-muted/50 hover:bg-muted/70 border border-border/50"
              >
                <Square className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-md p-8 text-center bg-card/50 border-border/50 rounded-2xl gemini-glass shadow-lg">
              <div className="w-12 h-12 gemini-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-semibold mb-2 text-foreground">
                Welcome to {getAgentDisplayName(selectedAgent)}
              </div>
              <div className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Ask me anything to get started. I can help with research, analysis, and content generation using advanced AI models.
              </div>
              <div className="text-xs text-muted-foreground/70 bg-muted/30 rounded-lg px-3 py-2">
                Try: "Research the latest AI trends in 2025"
              </div>
            </Card>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            
            {workflow && workflow.status !== "completed" && workflow.status !== "error" && (
              <AgentWorkflow workflow={workflow} />
            )}
          </>
        )}
      </div>

      {/* Input Bar */}
      <InputBar 
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        selectedAgent={selectedAgent}
      />
    </main>
  );
}
