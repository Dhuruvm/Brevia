import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  duration?: number;
  error?: string;
  details?: string;
}

interface WorkflowDisplayProps {
  workflowId: string;
  steps: WorkflowStep[];
  isComplete: boolean;
  className?: string;
}

export default function WorkflowDisplay({ 
  workflowId, 
  steps, 
  isComplete,
  className 
}: WorkflowDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(!isComplete);
  const [visibleSteps, setVisibleSteps] = useState<WorkflowStep[]>([]);

  // Animate steps appearing one by one
  useEffect(() => {
    if (steps.length === 0) return;
    
    const showStepsSequentially = async () => {
      for (let i = 0; i < steps.length; i++) {
        setTimeout(() => {
          setVisibleSteps(prev => [...prev, steps[i]]);
        }, i * 200);
      }
    };

    showStepsSequentially();
  }, [steps.length]);

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10';
      case 'running':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10';
      case 'failed':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/10';
    }
  };

  if (visibleSteps.length === 0) return null;

  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="font-medium text-sm">
            Workflow Progress {isComplete && '(Complete)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {visibleSteps.filter(s => s.status === 'completed').length}/{visibleSteps.length} steps
          </span>
          {isComplete ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Loader className="w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>
      </button>

      {/* Steps */}
      {isExpanded && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {visibleSteps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "p-4 transition-all duration-300 ease-out transform",
                getStepColor(step.status),
                "animate-in slide-in-from-left-2"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(step.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {step.name}
                    </h4>
                    {step.duration && (
                      <span className="text-xs text-gray-500">
                        {step.duration}ms
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {step.status === 'running' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Details */}
                  {step.details && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {step.details}
                    </p>
                  )}
                  
                  {/* Error */}
                  {step.error && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Error: {step.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}