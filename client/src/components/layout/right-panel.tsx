import { Download, FileText, FileImage, FileCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatSession, Source, AgentLog, Workflow } from "@shared/schema";

interface RightPanelProps {
  session: ChatSession | null;
  sources: Source[];
  logs: AgentLog[];
  workflow: Workflow | null;
  onClose?: () => void;
}

export default function RightPanel({ session, sources, logs, workflow, onClose }: RightPanelProps) {
  const handleExport = async (format: string) => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/export/${session.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Create download link
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'pdf':
        return <FileText className="w-3 h-3" />;
      case 'web':
        return <FileCode className="w-3 h-3" />;
      case 'research_paper':
        return <FileText className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getSourceColor = (sourceType: string) => {
    switch (sourceType) {
      case 'pdf':
        return 'text-red-400';
      case 'web':
        return 'text-blue-400';
      case 'research_paper':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const artifacts: Array<{
    name: string;
    description: string;
    status: string;
    statusColor: string;
    metadata: string | null;
  }> = [
    {
      name: "Research Summary",
      description: "AI Agents 2025 Report • 2,847 words",
      status: "Complete",
      statusColor: "bg-primary/20 text-primary",
      metadata: "23 sources"
    },
    {
      name: "Mind Map", 
      description: "Visual concept map • Interactive",
      status: "Generating",
      statusColor: "bg-yellow-500/20 text-yellow-400",
      metadata: null
    },
    {
      name: "Citation Database",
      description: "23 sources • APA format",
      status: "Ready",
      statusColor: "bg-accent/20 text-accent", 
      metadata: null
    }
  ];

  return (
    <aside className="w-full h-full bg-card/60 backdrop-blur-xl border-l border-border overflow-y-auto gemini-glass">
      {/* Mobile Header with Close Button */}
      <div className="flex items-center justify-between p-4 border-b border-border xl:hidden">
        <h2 className="text-lg font-semibold text-foreground">Results & Outputs</h2>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 rounded-xl bg-muted/50 hover:bg-muted/70"
          onClick={onClose}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Desktop Results Header */}
      <div className="hidden xl:block p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Results & Outputs</h3>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted/70 border border-border/50"
          >
            <Download className="w-3 h-3 text-muted-foreground" />
          </Button>
        </div>
        
        {/* Export Options */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="px-3 py-2 bg-muted/50 text-xs rounded-xl hover:bg-muted/70 border border-border/50"
            onClick={() => handleExport('pdf')}
          >
            <FileText className="w-3 h-3 text-red-500 mr-1" />
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-3 py-2 bg-muted/50 text-xs rounded-xl hover:bg-muted/70 border border-border/50"
            onClick={() => handleExport('docx')}
          >
            <FileText className="w-3 h-3 text-blue-500 mr-1" />
            DOCX
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-3 py-2 bg-muted/50 text-xs rounded-xl hover:bg-muted/70 border border-border/50"
            onClick={() => handleExport('md')}
          >
            <FileCode className="w-3 h-3 text-muted-foreground mr-1" />
            MD
          </Button>
        </div>
      </div>

      {/* Source Timeline */}
      <div className="p-4 border-b border-border">
        <h4 className="text-sm font-medium mb-3 text-foreground">Source Timeline</h4>
        <ScrollArea className="max-h-48">
          <div className="space-y-3">
            {sources.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No sources found yet
              </div>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate text-foreground">{source.title}</div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {source.url ? new URL(source.url).hostname : 'Local'} • {
                        source.createdAt ? new Date(source.createdAt).toLocaleTimeString() : 'Recently'
                      }
                    </div>
                    {source.content && (
                      <div className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">
                        {source.content.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Generated Artifacts */}
      <div className="p-4 border-b border-border">
        <h4 className="text-sm font-medium mb-3 text-foreground">Generated Artifacts</h4>
        <div className="space-y-3">
          {workflow && workflow.status === "completed" ? artifacts.map((artifact, index) => (
            <Card 
              key={index}
              className="p-3 cursor-pointer hover:bg-muted/40 transition-all bg-muted/20 border-border/50 rounded-xl"
            >
              <div className="flex items-center space-x-2 mb-2">
                {getSourceIcon(artifact.name.toLowerCase())}
                <span className="text-sm font-medium text-foreground">{artifact.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{artifact.description}</div>
              <div className="flex space-x-2">
                <Badge className={`text-xs ${artifact.statusColor} border-border/50`}>
                  {artifact.status}
                </Badge>
                {artifact.metadata && (
                  <Badge className="text-xs bg-muted/50 text-muted-foreground border-border/50">
                    {typeof artifact.metadata === 'object' 
                      ? JSON.stringify(artifact.metadata) 
                      : String(artifact.metadata)
                    }
                  </Badge>
                )}
              </div>
            </Card>
          )) : (
            <div className="text-xs text-muted-foreground text-center py-4">
              Complete a task to see generated artifacts
            </div>
          )}
        </div>
      </div>

      {/* Agent Logs */}
      <div className="p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Agent Logs</h4>
        <ScrollArea className="max-h-64">
          <div className="space-y-2 text-xs">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">
                No logs available
              </div>
            ) : (
              logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start space-x-2">
                  <span className="text-muted-foreground/70 font-mono flex-shrink-0">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}
                  </span>
                  <span className={`flex-shrink-0 ${
                    log.success === false ? 'text-red-500' : 
                    log.success === true ? 'text-green-500' :
                    'text-blue-500'
                  }`}>
                    {log.success === false ? 'ERROR' : log.success === true ? 'SUCCESS' : 'INFO'}
                  </span>
                  <span className="text-foreground flex-1 min-w-0 break-words">
                    {log.error || log.step || 'Agent activity'}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
