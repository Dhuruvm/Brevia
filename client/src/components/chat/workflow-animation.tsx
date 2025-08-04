import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle, Loader2, RotateCcw, FileText } from "lucide-react";

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  logs?: string[];
  output?: any;
  error?: string;
}

interface WorkflowAnimationProps {
  workflowId: string;
  agentType: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  currentStep: number;
  onRollback?: () => void;
  onViewChanges?: () => void;
}

export function WorkflowAnimation({
  workflowId,
  agentType,
  task,
  status,
  steps,
  currentStep,
  onRollback,
  onViewChanges
}: WorkflowAnimationProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [currentStepLogs, setCurrentStepLogs] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [persistedSteps, setPersistedSteps] = useState<WorkflowStep[]>([]);
  const [allLogs, setAllLogs] = useState<Record<string, string[]>>({});

  // Persist steps to prevent disappearing
  useEffect(() => {
    if (steps && steps.length > 0) {
      setPersistedSteps(prevSteps => {
        const newSteps = [...prevSteps];
        steps.forEach(step => {
          const existingIndex = newSteps.findIndex(s => s.id === step.id);
          if (existingIndex >= 0) {
            // Update existing step but keep its logs
            newSteps[existingIndex] = { ...step, logs: newSteps[existingIndex].logs || step.logs };
          } else {
            newSteps.push(step);
          }
        });
        return newSteps;
      });
    }
  }, [steps]);

  // Auto-expand current running step
  useEffect(() => {
    const displaySteps = persistedSteps.length > 0 ? persistedSteps : steps;
    if (currentStep < displaySteps.length) {
      const currentStepId = displaySteps[currentStep]?.id;
      if (currentStepId && displaySteps[currentStep]?.status === 'running') {
        setExpandedSteps(prev => new Set(prev).add(currentStepId));
      }
    }
  }, [currentStep, steps, persistedSteps]);

  // Simulate real-time log streaming for current step with persistence
  useEffect(() => {
    const displaySteps = persistedSteps.length > 0 ? persistedSteps : steps;
    if (status === 'running' && currentStep < displaySteps.length) {
      const step = displaySteps[currentStep];
      if (step?.status === 'running') {
        const stepId = step.id;
        
        // Skip if we already have logs for this step
        if (allLogs[stepId] && allLogs[stepId].length > 0) {
          return;
        }
        
        // Simulate streaming logs with more realistic content
        const logs = [
          `🚀 Starting ${step.name}...`,
          `🔍 Analyzing ${agentType} requirements...`,
          `📝 Processing task: "${task.substring(0, 50)}${task.length > 50 ? '...' : ''}"`,
          `⚙️ Executing workflow step ${currentStep + 1} of ${displaySteps.length}`,
          `🤖 ${agentType} agent processing request...`,
          `📊 Gathering relevant information...`,
          `🔄 Generating comprehensive response...`,
          `✨ Finalizing results...`
        ];

        let logIndex = 0;
        const interval = setInterval(() => {
          if (logIndex < logs.length) {
            const newLog = logs[logIndex];
            setAllLogs(prev => ({
              ...prev,
              [stepId]: [...(prev[stepId] || []), newLog]
            }));
            setCurrentStepLogs(prev => [...prev, newLog]);
            logIndex++;
          } else {
            clearInterval(interval);
          }
        }, 2000); // Slower timing for better readability

        return () => clearInterval(interval);
      }
    }
  }, [status, currentStep, steps, persistedSteps, agentType, task, allLogs]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepDuration = (step: WorkflowStep) => {
    if (step.startTime && step.endTime) {
      const duration = step.endTime.getTime() - step.startTime.getTime();
      return `${Math.round(duration / 1000)}s`;
    }
    if (step.startTime && step.status === 'running') {
      const duration = Date.now() - step.startTime.getTime();
      return `${Math.round(duration / 1000)}s`;
    }
    return null;
  };

  const displaySteps = persistedSteps.length > 0 ? persistedSteps : steps;
  const completedSteps = displaySteps.filter(s => s.status === 'completed').length;
  const totalSteps = displaySteps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {status === 'running' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : status === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : status === 'failed' ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">
                  {status === 'completed' ? 'Completed migration task' : 
                   status === 'running' ? 'Working on migration...' :
                   status === 'failed' ? 'Task failed' : 'Preparing task...'}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {completedSteps}/{totalSteps} steps
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {status === 'completed' && (
                <div className="flex gap-2">
                  {onRollback && (
                    <Button size="sm" variant="outline" onClick={onRollback} className="h-7 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback here
                    </Button>
                  )}
                  {onViewChanges && (
                    <Button size="sm" variant="outline" onClick={onViewChanges} className="h-7 text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Changes
                    </Button>
                  )}
                </div>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="px-4">
                <Progress value={progressPercentage} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
              </div>

              {/* Steps list */}
              <ScrollArea className="max-h-96">
                <div className="space-y-2 px-4">
                  {displaySteps.map((step, index) => (
                    <div key={step.id} className="space-y-2">
                      <div
                        className={`flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer
                          ${step.status === 'running' ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' :
                            step.status === 'completed' ? 'bg-green-50 dark:bg-green-950/20' :
                            step.status === 'failed' ? 'bg-red-50 dark:bg-red-950/20' :
                            'hover:bg-muted/50'}`}
                        onClick={() => toggleStep(step.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {getStepIcon(step)}
                          <span className="text-sm font-medium">{step.name}</span>
                          {getStepDuration(step) && (
                            <Badge variant="outline" className="text-xs h-5">
                              {getStepDuration(step)}
                            </Badge>
                          )}
                        </div>
                        {(step.logs?.length || (step.status === 'running' && currentStepLogs.length)) ? (
                          <ChevronRight className={`h-3 w-3 transition-transform ${
                            expandedSteps.has(step.id) ? 'rotate-90' : ''
                          }`} />
                        ) : null}
                      </div>

                      {/* Step logs */}
                      {expandedSteps.has(step.id) && (
                        <div className="ml-6 space-y-1">
                          <div className="bg-muted/30 rounded-md p-3 text-xs font-mono">
                            {step.status === 'running' && index === currentStep ? (
                              <div className="space-y-1">
                                {currentStepLogs.map((log, logIndex) => (
                                  <div key={logIndex} className="flex items-center gap-2 animate-in slide-in-from-left-2">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                    <span>{log}</span>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Processing...</span>
                                </div>
                              </div>
                            ) : step.logs?.length ? (
                              <div className="space-y-1">
                                {step.logs.map((log, logIndex) => (
                                  <div key={logIndex} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                    <span>{log}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">No logs available</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}


