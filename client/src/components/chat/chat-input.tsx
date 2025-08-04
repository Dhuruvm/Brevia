import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, Mic, Sparkles, FileText, Search, Lightbulb, Presentation } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string, agentType?: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const RESEARCH_ACTIONS = [
  { 
    icon: Search, 
    label: "Web Search", 
    prompt: "Search the web for", 
    action: "search",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  { 
    icon: FileText, 
    label: "Deep Analysis", 
    prompt: "Analyze in detail", 
    action: "analyze",
    color: "bg-green-500 hover:bg-green-600"
  },
  { 
    icon: Lightbulb, 
    label: "Research Report", 
    prompt: "Create research report on", 
    action: "report",
    color: "bg-purple-500 hover:bg-purple-600"
  }
];

export function ChatInput({ value, onChange, onSubmit, isLoading, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(value, selectedAgent);
    setSelectedAgent("");
  };

  const handleQuickAction = (action: typeof RESEARCH_ACTIONS[0]) => {
    const prompt = `${action.prompt}: `;
    onChange(prompt);
    setSelectedAgent(action.action);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {RESEARCH_ACTIONS.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 text-xs whitespace-nowrap rounded-full transition-all
                ${selectedAgent === action.action 
                  ? `${action.color} text-white shadow-md` 
                  : 'hover:bg-muted/50'}`}
              onClick={() => handleQuickAction(action)}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4">
        {selectedAgent && (
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              {RESEARCH_ACTIONS.find(a => a.action === selectedAgent)?.label} Mode
            </Badge>
          </div>
        )}
        
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Brevia to research anything..."
              className="min-h-[44px] max-h-[200px] resize-none pr-12 rounded-xl border-border/50 bg-muted/20 focus:bg-background transition-colors"
              disabled={disabled}
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted/50"
                disabled={disabled}
              >
                <Paperclip className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted/50"
                disabled={disabled}
              >
                <Mic className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading || disabled}
            size="sm"
            className="h-[44px] w-[44px] rounded-xl bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Press ⏎ to send, ⇧⏎ for new line</span>
          <span>{value.length}/2000</span>
        </div>
      </div>
    </div>
  );
}