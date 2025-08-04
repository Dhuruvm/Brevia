import { useState, useEffect, useRef } from 'react';

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

interface WorkflowData {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  agentType: string;
  task: string;
  currentStep: number;
}

export function usePersistentWorkflow(workflowId: string | undefined) {
  const [persistedWorkflow, setPersistedWorkflow] = useState<WorkflowData | null>(null);
  const [allSteps, setAllSteps] = useState<WorkflowStep[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimer = useRef<NodeJS.Timeout>();

  // Clear hide timer when workflow becomes active
  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
    }
  };

  // Set timer to hide workflow after completion
  const scheduleHide = () => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setIsVisible(false);
    }, 10000); // Hide after 10 seconds of completion
  };

  // Update persisted workflow data
  const updateWorkflow = (workflow: WorkflowData | null) => {
    if (!workflow) return;

    setPersistedWorkflow(prev => {
      const updated = { ...workflow };
      
      // Preserve all steps we've seen
      if (prev) {
        const mergedSteps = [...prev.steps];
        workflow.steps.forEach(newStep => {
          const existingIndex = mergedSteps.findIndex(s => s.id === newStep.id);
          if (existingIndex >= 0) {
            mergedSteps[existingIndex] = { ...newStep };
          } else {
            mergedSteps.push(newStep);
          }
        });
        updated.steps = mergedSteps;
      }

      return updated;
    });

    // Update all steps collection
    if (workflow.steps?.length > 0) {
      setAllSteps(prev => {
        const merged = [...prev];
        workflow.steps.forEach(step => {
          const existingIndex = merged.findIndex(s => s.id === step.id);
          if (existingIndex >= 0) {
            merged[existingIndex] = { ...step };
          } else {
            merged.push(step);
          }
        });
        return merged;
      });
    }

    // Show workflow when active
    if (workflow.status === 'running' || workflow.status === 'pending') {
      setIsVisible(true);
      clearHideTimer();
    } else if (workflow.status === 'completed' || workflow.status === 'failed') {
      setIsVisible(true);
      scheduleHide();
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  return {
    persistedWorkflow,
    allSteps,
    isVisible,
    updateWorkflow,
    showWorkflow: () => {
      setIsVisible(true);
      clearHideTimer();
    },
    hideWorkflow: () => setIsVisible(false)
  };
}