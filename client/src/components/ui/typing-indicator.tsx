import { Brain, Zap } from "lucide-react";

interface TypingIndicatorProps {
  message?: string;
  agentType?: string;
}

export default function TypingIndicator({ 
  message = "AI is thinking...", 
  agentType = "assistant" 
}: TypingIndicatorProps) {
  const getAgentMessage = () => {
    switch (agentType) {
      case 'research':
        return "Researching your query...";
      case 'notes':
        return "Processing your content...";
      case 'documents':
        return "Creating your document...";
      case 'resume':
        return "Building your resume...";
      case 'presentation':
        return "Designing your presentation...";
      default:
        return message;
    }
  };

  return (
    <div className="flex items-center space-x-3 text-muted-foreground p-4 rounded-2xl bg-muted/30 border border-border/50">
      <div className="flex items-center space-x-2">
        <Brain className="h-4 w-4 animate-pulse text-blue-500" />
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-sm font-medium text-foreground">{getAgentMessage()}</span>
        <div className="flex items-center space-x-2 text-xs">
          <Zap className="h-3 w-3" />
          <span>Powered by Llama 3.3 70B</span>
        </div>
      </div>
    </div>
  );
}
