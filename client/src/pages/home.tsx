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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileRightPanel, setShowMobileRightPanel] = useState(false);
  
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
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <TopNavbar 
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
        onToggleRightPanel={() => setShowMobileRightPanel(!showMobileRightPanel)}
      />
      
      <div className="flex h-[calc(100vh-73px)] relative">
        {/* Mobile/Tablet - Left Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <LeftSidebar 
            selectedAgent={selectedAgent}
            onAgentSelect={handleAgentSelect}
            currentSession={currentSession}
            onClose={() => setShowMobileSidebar(false)}
          />
        </div>

        {/* Mobile Overlay */}
        {showMobileSidebar && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}
        
        {/* Center Panel - Always visible */}
        <div className="flex-1 flex flex-col min-w-0">
          <CenterPanel
            selectedAgent={selectedAgent}
            session={currentSession}
            messages={messages}
            workflow={workflow}
            onSendMessage={handleSendMessage}
            onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
            onToggleRightPanel={() => setShowMobileRightPanel(!showMobileRightPanel)}
          />
        </div>
        
        {/* Mobile/Tablet - Right Panel */}
        <div className={`
          fixed inset-y-0 right-0 z-50 w-80 transform transition-transform duration-300 ease-in-out xl:relative xl:translate-x-0
          ${showMobileRightPanel ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <RightPanel
            session={currentSession}
            sources={sources}
            logs={logs}
            workflow={workflow}
            onClose={() => setShowMobileRightPanel(false)}
          />
        </div>

        {/* Mobile Right Panel Overlay */}
        {showMobileRightPanel && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
            onClick={() => setShowMobileRightPanel(false)}
          />
        )}
      </div>
    </div>
  );
}
