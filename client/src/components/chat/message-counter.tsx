import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, MessageSquare, Zap } from "lucide-react";

interface MessageCounterProps {
  messageCount: number;
  actionCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  title?: string;
  subtitle?: string;
}

export function MessageCounter({
  messageCount,
  actionCount,
  isExpanded,
  onToggle,
  title = "Agent Session",
  subtitle
}: MessageCounterProps) {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      className="w-full justify-between h-auto p-4 hover:bg-muted/50"
    >
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium text-sm">
            Brevia Research Agent
          </span>
        </div>
        {subtitle && (
          <span className="text-xs text-muted-foreground text-left line-clamp-1">
            {subtitle}
          </span>
        )}
      </div>
      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
    </Button>
  );
}