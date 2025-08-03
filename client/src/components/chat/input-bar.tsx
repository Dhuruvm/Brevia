import { useState, useRef } from "react";
import { Paperclip, Mic, Send, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { AgentType } from "@shared/schema";

interface InputBarProps {
  onSendMessage: (content: string) => Promise<void>;
  isProcessing: boolean;
  selectedAgent: AgentType;
}

export default function InputBar({ onSendMessage, isProcessing, selectedAgent }: InputBarProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const slashCommands = [
    {
      command: "/research",
      description: "Start a research session",
      icon: Search,
      color: "text-primary"
    },
    {
      command: "/summarize",
      description: "Summarize documents or content", 
      icon: FileText,
      color: "text-secondary"
    },
    {
      command: "/generate",
      description: "Generate content based on prompt",
      icon: FileText,
      color: "text-accent"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const message = input.trim();
    setInput("");
    setShowSuggestions(false);
    
    await onSendMessage(message);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Show slash command suggestions
    if (value.startsWith("/") && value.length > 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (command: string) => {
    setInput(command + " ");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && input.length === 0) {
      e.preventDefault();
      setShowSuggestions(!showSuggestions);
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const getPlaceholder = () => {
    switch (selectedAgent) {
      case "research":
        return "Ask me to research anything... (try /research, /summarize)";
      case "notes":
        return "Upload files or paste content to generate notes...";
      case "documents":
        return "Describe the document you want me to create...";
      case "resume":
        return "Tell me about your experience and target role...";
      case "presentations":
        return "What presentation topic should I help you with...";
      default:
        return "Ask Brevia anything... (try /research, /summarize, /generate)";
    }
  };

  return (
    <div className="p-6 bg-brevia-dark/60 backdrop-blur-xl border-t border-gray-800/50">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Slash Command Suggestions */}
          {showSuggestions && (
            <Card className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800/95 backdrop-blur-xl border-gray-700/50 p-2">
              <div className="space-y-1">
                {slashCommands
                  .filter(cmd => cmd.command.toLowerCase().includes(input.toLowerCase().slice(1)))
                  .map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <div
                        key={cmd.command}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => handleSuggestionClick(cmd.command)}
                      >
                        <Icon className={`w-4 h-4 ${cmd.color}`} />
                        <div>
                          <div className="text-sm font-medium">{cmd.command}</div>
                          <div className="text-xs text-gray-400">{cmd.description}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-center space-x-3 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 focus-within:border-primary/50 transition-colors">
              {/* File Upload */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2 rounded-lg hover:bg-gray-700/50"
                title="Upload files"
              >
                <Paperclip className="w-4 h-4 text-gray-400" />
              </Button>
              
              {/* Input Field */}
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className="flex-1 bg-transparent border-0 text-sm placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isProcessing}
              />
              
              {/* Voice Input */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2 rounded-lg hover:bg-gray-700/50"
                title="Voice input"
              >
                <Mic className="w-4 h-4 text-gray-400" />
              </Button>
              
              {/* Send Button */}
              <Button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-lg text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </form>
          
          {/* Input Status */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded text-xs">Tab</kbd> for commands</span>
              <span>•</span>
              <span>Voice input available</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Llama 3.3 70B</span>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
