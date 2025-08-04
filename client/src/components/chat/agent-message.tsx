import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkflowAnimation } from "./workflow-animation";
import { CheckCircle, Clock, AlertCircle, User, Bot, ChevronDown, RotateCcw, FileText } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AgentMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: {
      workflowId?: string;
      agentType?: string;
      success?: boolean;
      confidence?: number;
      sources?: number;
      steps?: any[];
      currentStep?: number;
      status?: string;
      error?: boolean;
    };
    createdAt: string;
  };
  messageIndex: number;
  totalMessages: number;
  actionCount: number;
}

export function AgentMessage({ message, messageIndex, totalMessages, actionCount }: AgentMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const messageTime = new Date(message.createdAt);
      const diffMs = now.getTime() - messageTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        setTimeAgo('just now');
      } else if (diffMins === 1) {
        setTimeAgo('1 minute ago');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minutes ago`);
      } else {
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) {
          setTimeAgo('1 hour ago');
        } else {
          setTimeAgo(`${diffHours} hours ago`);
        }
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [message.createdAt]);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg p-3">
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  const hasWorkflow = message.metadata?.workflowId && message.metadata?.steps;
  const isCompleted = message.metadata?.status === 'completed';
  const isFailed = message.metadata?.error || message.metadata?.status === 'failed';

  return (
    <div className="mb-6">
      <Card className="border-l-4 border-l-blue-500">
        {/* Header with message counter and time */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : isFailed ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm">
                    {totalMessages} message{totalMessages !== 1 ? 's' : ''} & {actionCount} action{actionCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{timeAgo}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Workflow animation if available */}
              {hasWorkflow && (
                <WorkflowAnimation
                  workflowId={message.metadata!.workflowId!}
                  agentType={message.metadata!.agentType || 'AI'}
                  task={message.content.substring(0, 100)}
                  status={message.metadata!.status as any || 'completed'}
                  steps={message.metadata!.steps || []}
                  currentStep={message.metadata!.currentStep || 0}
                  onRollback={() => {
                    // Handle rollback
                    console.log('Rollback requested');
                  }}
                  onViewChanges={() => {
                    // Handle view changes
                    console.log('View changes requested');
                  }}
                />
              )}

              {/* Message content */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    {message.metadata?.error ? (
                      <div className="text-red-500 whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                    
                    {/* Metadata badges */}
                    {message.metadata && !message.metadata.error && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.metadata.agentType && (
                          <Badge variant="secondary" className="text-xs">
                            {message.metadata.agentType}
                          </Badge>
                        )}
                        {message.metadata.confidence && (
                          <Badge variant="outline" className="text-xs">
                            Confidence: {Math.round(message.metadata.confidence * 100)}%
                          </Badge>
                        )}
                        {message.metadata.sources && message.metadata.sources > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.sources} source{message.metadata.sources !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons for completed tasks */}
              {isCompleted && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Rollback here
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}