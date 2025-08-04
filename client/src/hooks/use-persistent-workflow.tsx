import { useState, useEffect, useRef } from 'react';

interface WorkflowData {
  id: string;
  sessionId?: string;
  session?: { id: string };
  agentType: string;
  task?: string;
  status: string;
  currentStep?: number;
  steps?: any[];
}

// Hook to persist workflow data and prevent flickering
export function usePersistentWorkflow(activeWorkflows: WorkflowData[]) {
  const [persistedWorkflows, setPersistedWorkflows] = useState<WorkflowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (activeWorkflows && activeWorkflows.length > 0) {
      setPersistedWorkflows(activeWorkflows);
      setIsLoading(false);
    } else if (persistedWorkflows.length > 0) {
      // Delay clearing workflows to prevent flicker
      timeoutRef.current = setTimeout(() => {
        setPersistedWorkflows([]);
        setIsLoading(false);
      }, 2000); // 2-second delay before clearing
    } else {
      setIsLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeWorkflows]);

  return {
    workflows: persistedWorkflows,
    isLoading
  };
}

// Hook for debounced loading states
export function useStableLoading(isLoading: boolean, delay: number = 500) {
  const [stableLoading, setStableLoading] = useState(isLoading);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isLoading) {
      // Show loading immediately
      setStableLoading(true);
    } else {
      // Delay hiding loading to prevent flicker
      timeoutRef.current = setTimeout(() => {
        setStableLoading(false);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return stableLoading;
}