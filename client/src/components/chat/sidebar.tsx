import { useState } from "react";
import { Plus, MessageSquare, Trash2, Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onRenameSession
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleEditStart = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleEditSave = () => {
    if (editingSessionId && editingTitle.trim() && onRenameSession) {
      onRenameSession(editingSessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleEditCancel = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
    }
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const dateKey = formatDate(session.createdAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-80 bg-background border-r border-border z-50 transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <Button 
              onClick={onNewChat}
              className="w-full justify-start gap-3 h-11"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              New chat
            </Button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-2">
              {Object.entries(groupedSessions).map(([dateGroup, sessionsInGroup]) => (
                <div key={dateGroup}>
                  {dateGroup && (
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      {dateGroup}
                    </div>
                  )}
                  
                  {sessionsInGroup.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg p-3 text-sm cursor-pointer transition-colors",
                        currentSessionId === session.id 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-accent/50 text-foreground"
                      )}
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      
                      {editingSessionId === session.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="h-6 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave();
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            autoFocus
                            onBlur={handleEditSave}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSave();
                            }}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCancel();
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 truncate">
                            {session.title}
                          </span>
                          
                          {/* Action buttons - only show on hover */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            {onRenameSession && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-accent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditStart(session);
                                }}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {onDeleteSession && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {sessions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              Brevia AI
            </div>
          </div>
        </div>
      </div>
    </>
  );
}