import { Badge } from "@/components/ui/badge";
import type { WorkflowStatus } from "@shared/schema";

interface AgentStatusPillProps {
  status: WorkflowStatus | "idle";
}

export default function AgentStatusPill({ status }: AgentStatusPillProps) {
  const getStatusConfig = (status: WorkflowStatus | "idle") => {
    switch (status) {
      case "planning":
        return {
          label: "Planning",
          className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          showPulse: true
        };
      case "searching":
        return {
          label: "Searching", 
          className: "bg-primary/20 text-primary border-primary/30",
          showPulse: true
        };
      case "analyzing":
        return {
          label: "Analyzing",
          className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", 
          showPulse: true
        };
      case "generating":
        return {
          label: "Generating",
          className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          showPulse: true
        };
      case "completed":
        return {
          label: "Completed",
          className: "bg-green-500/20 text-green-400 border-green-500/30",
          showPulse: false
        };
      case "error":
        return {
          label: "Error",
          className: "bg-red-500/20 text-red-400 border-red-500/30",
          showPulse: false
        };
      case "idle":
      default:
        return {
          label: "Ready",
          className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
          showPulse: false
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      className={`text-xs border flex items-center space-x-1 ${config.className}`}
    >
      {config.showPulse && (
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}
