import { Download, FileText, FileImage, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatSession, Source, AgentLog, AgentWorkflow } from "@shared/schema";

interface RightPanelProps {
  session: ChatSession | null;
  sources: Source[];
  logs: AgentLog[];
  workflow: AgentWorkflow | null;
}

export default function RightPanel({ session, sources, logs, workflow }: RightPanelProps) {
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

  const artifacts = [
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
    <aside className="w-80 bg-brevia-dark/60 backdrop-blur-xl border-l border-gray-800/50 overflow-y-auto">
      {/* Results Header */}
      <div className="p-4 border-b border-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Results & Outputs</h3>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50"
          >
            <Download className="w-3 h-3 text-gray-400" />
          </Button>
        </div>
        
        {/* Export Options */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="px-2 py-1 bg-gray-800/50 text-xs rounded-lg hover:bg-gray-700/50"
            onClick={() => handleExport('pdf')}
          >
            <FileText className="w-3 h-3 text-red-400 mr-1" />
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 py-1 bg-gray-800/50 text-xs rounded-lg hover:bg-gray-700/50"
            onClick={() => handleExport('docx')}
          >
            <FileText className="w-3 h-3 text-blue-400 mr-1" />
            DOCX
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 py-1 bg-gray-800/50 text-xs rounded-lg hover:bg-gray-700/50"
            onClick={() => handleExport('md')}
          >
            <FileCode className="w-3 h-3 text-gray-400 mr-1" />
            MD
          </Button>
        </div>
      </div>

      {/* Source Timeline */}
      <div className="p-4 border-b border-gray-800/50">
        <h4 className="text-sm font-medium mb-3">Source Timeline</h4>
        <ScrollArea className="max-h-48">
          <div className="space-y-3">
            {sources.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">
                No sources found yet
              </div>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{source.title}</div>
                    <div className="text-xs text-gray-400 mb-1">
                      {source.url ? new URL(source.url).hostname : 'Local'} • {
                        source.addedAt ? new Date(source.addedAt).toLocaleTimeString() : 'Recently'
                      }
                    </div>
                    {source.content && (
                      <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">
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
      <div className="p-4 border-b border-gray-800/50">
        <h4 className="text-sm font-medium mb-3">Generated Artifacts</h4>
        <div className="space-y-3">
          {workflow && workflow.status === "completed" ? artifacts.map((artifact, index) => (
            <Card 
              key={index}
              className="p-3 cursor-pointer hover:bg-gray-700/30 transition-all bg-gray-800/30 border-gray-700/50"
            >
              <div className="flex items-center space-x-2 mb-2">
                {getSourceIcon(artifact.name.toLowerCase())}
                <span className="text-sm font-medium">{artifact.name}</span>
              </div>
              <div className="text-xs text-gray-400 mb-2">{artifact.description}</div>
              <div className="flex space-x-2">
                <Badge className={`text-xs ${artifact.statusColor}`}>
                  {artifact.status}
                </Badge>
                {artifact.metadata && (
                  <Badge className="text-xs bg-gray-700/50 text-gray-300">
                    {artifact.metadata}
                  </Badge>
                )}
              </div>
            </Card>
          )) : (
            <div className="text-xs text-gray-500 text-center py-4">
              Complete a task to see generated artifacts
            </div>
          )}
        </div>
      </div>

      {/* Agent Logs */}
      <div className="p-4">
        <h4 className="text-sm font-medium mb-3">Agent Logs</h4>
        <ScrollArea className="max-h-64">
          <div className="space-y-2 text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No logs available
              </div>
            ) : (
              logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start space-x-2">
                  <span className="text-gray-500 font-mono flex-shrink-0">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}
                  </span>
                  <span className={`flex-shrink-0 ${
                    log.level === 'error' ? 'text-red-400' : 
                    log.level === 'info' ? 'text-primary' :
                    log.level === 'debug' ? 'text-secondary' :
                    'text-accent'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-gray-300 flex-1 min-w-0 break-words">
                    {log.message}
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
