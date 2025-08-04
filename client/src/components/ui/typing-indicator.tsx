import { useState, useEffect } from "react";
import { Brain, Zap, Bot } from "lucide-react";

interface TypingIndicatorProps {
  message?: string;
  agentType?: string;
  currentStep?: string;
}

export default function TypingIndicator({ 
  message = "AI is thinking...", 
  agentType = "assistant",
  currentStep
}: TypingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getAgentMessage = () => {
    if (currentStep) return currentStep;
    
    switch (agentType) {
      case 'research':
        return "Researching your query";
      case 'notes':
        return "Processing your content";
      case 'documents':
        return "Creating your document";
      case 'resume':
        return "Building your resume";
      case 'presentation':
        return "Designing your presentation";
      default:
        return message;
    }
  };

  return (
    <div className="message-fade-in w-full px-4 py-6 bg-[var(--ai-message-bg)]">
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* AI Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>

        {/* Typing Content */}
        <div className="flex-1 min-w-0">
          {agentType && agentType !== 'assistant' && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {agentType} agent
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-[var(--ai-message-text)]">
                {getAgentMessage()}{dots}
              </span>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Zap className="h-3 w-3" />
                <span>Powered by Llama 3.3 70B</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
