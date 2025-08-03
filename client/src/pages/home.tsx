import { useState } from "react";
import TopNavbar from "@/components/layout/top-navbar";
import LeftSidebar from "@/components/layout/left-sidebar";
import CenterPanel from "@/components/layout/center-panel";
import RightPanel from "@/components/layout/right-panel";
import { useAgents } from "@/hooks/use-agents";
import { useChat } from "@/hooks/use-chat";
import type { AgentType } from "@shared/schema";

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("research");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const { agents } = useAgents();
  const { 
    currentSession, 
    messages, 
    workflow, 
    sources, 
    logs, 
    createSession, 
    sendMessage 
  } = useChat(currentSessionId);

  const handleAgentSelect = async (agentType: AgentType) => {
    setSelectedAgent(agentType);
    
    // Create new session for the selected agent
    const title = `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Session`;
    const session = await createSession(agentType, title);
    if (session) {
      setCurrentSessionId(session.id);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) {
      // Create a new session if none exists
      const title = `${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Session`;
      const session = await createSession(selectedAgent, title);
      if (session) {
        setCurrentSessionId(session.id);
        await sendMessage(session.id, content);
      }
    } else {
      await sendMessage(currentSessionId, content);
    }
  };

  return (
    <div className="min-h-screen bg-brevia-dark text-gray-100 overflow-hidden">
      <TopNavbar 
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
      />
      
      <div className="flex h-[calc(100vh-73px)]">
        <LeftSidebar 
          selectedAgent={selectedAgent}
          onAgentSelect={handleAgentSelect}
          currentSession={currentSession}
        />
        
        <CenterPanel
          selectedAgent={selectedAgent}
          session={currentSession}
          messages={messages}
          workflow={workflow}
          onSendMessage={handleSendMessage}
        />
        
        <RightPanel
          session={currentSession}
          sources={sources}
          logs={logs}
          workflow={workflow}
        />
      </div>
    </div>
  );
}
