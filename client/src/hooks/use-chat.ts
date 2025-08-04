import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { 
  ChatSession, 
  Message, 
  AgentWorkflow, 
  Source, 
  AgentLog 
} from "@shared/schema";

type AgentType = 'research' | 'notes' | 'documents' | 'resume' | 'presentation';

interface SessionData {
  session: ChatSession;
  messages: Message[];
  workflow: AgentWorkflow | null;
  sources: Source[];
  logs: AgentLog[];
}

export function useChat(sessionId: string | null) {
  const queryClient = useQueryClient();
  const [pollingEnabled, setPollingEnabled] = useState(false);

  // Get session data
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["/api/sessions", sessionId],
    enabled: !!sessionId,
    refetchInterval: pollingEnabled ? 2000 : false, // Poll every 2 seconds when active
  });

  // Get workflow status for real-time updates
  const { data: workflow } = useQuery({
    queryKey: ["/api/workflows", sessionId],
    enabled: !!sessionId && pollingEnabled,
    refetchInterval: 1000, // Poll workflow more frequently
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async ({ agentType, title }: { agentType: AgentType; title: string }) => {
      const response = await apiRequest("POST", "/api/sessions", { agentType, title });
      return response.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      const response = await apiRequest("POST", "/api/agents/execute", { 
        sessionId, 
        task: content,
        agentType: "research"
      });
      return response.json();
    },
    onSuccess: () => {
      // Start polling for updates
      setPollingEnabled(true);
      
      // Invalidate session data to refetch messages
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      
      // Stop polling after 2 minutes (in case agent completes)
      setTimeout(() => setPollingEnabled(false), 120000);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      setPollingEnabled(false);
    },
  });

  // Stop polling when workflow is completed or error
  useEffect(() => {
    if (workflow && (workflow.status === "completed" || workflow.status === "error")) {
      setPollingEnabled(false);
      // Final refresh of session data
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
    }
  }, [workflow, queryClient, sessionId]);

  const createSession = async (agentType: AgentType, title: string) => {
    try {
      return await createSessionMutation.mutateAsync({ agentType, title });
    } catch (error) {
      console.error("Failed to create session:", error);
      return null;
    }
  };

  const sendMessage = async (sessionId: string, content: string) => {
    try {
      await sendMessageMutation.mutateAsync({ sessionId, content });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return {
    currentSession: sessionData?.session || null,
    messages: sessionData?.messages || [],
    workflow: workflow || sessionData?.workflow || null,
    sources: sessionData?.sources || [],
    logs: sessionData?.logs || [],
    isLoading,
    createSession,
    sendMessage,
    isCreatingSession: createSessionMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
  };
}
