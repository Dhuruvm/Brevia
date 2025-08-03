import { Brain, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import TypingIndicator from "@/components/ui/typing-indicator";
import type { AgentWorkflow } from "@shared/schema";

interface AgentWorkflowProps {
  workflow: AgentWorkflow;
}

export default function AgentWorkflow({ workflow }: AgentWorkflowProps) {
  const steps = workflow.steps as any[] || [];
  
  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="w-3 h-3 text-green-400" />;
      case "running":
        return <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />;
    }
  };

  const getStepTime = (step: any) => {
    if (step.status === "completed" && step.startTime && step.endTime) {
      const duration = new Date(step.endTime).getTime() - new Date(step.startTime).getTime();
      return `${(duration / 1000).toFixed(1)}s`;
    }
    if (step.status === "running") {
      return "Running";
    }
    return "";
  };

  return (
    <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 p-4 animate-slide-up">
      <div className="flex items-center space-x-2 mb-3">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Agent Workflow</span>
        {workflow.status === "generating" && (
          <div className="ml-auto">
            <TypingIndicator />
          </div>
        )}
      </div>
      
      {workflow.progress !== undefined && workflow.progress > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs text-gray-400">{workflow.progress}%</span>
          </div>
          <Progress value={workflow.progress} className="h-1" />
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              step.status === "completed" ? "bg-green-500/20" :
              step.status === "running" ? "bg-primary/20" :
              step.status === "error" ? "bg-red-500/20" :
              "bg-gray-700/50"
            }`}>
              {getStepIcon(step.status)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{step.name}</div>
              {step.result?.description && (
                <div className="text-xs text-gray-400">{step.result.description}</div>
              )}
              {step.error && (
                <div className="text-xs text-red-400">{step.error}</div>
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {getStepTime(step)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
