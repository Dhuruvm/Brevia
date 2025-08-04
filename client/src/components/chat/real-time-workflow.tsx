import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Brain, 
  Search, 
  Globe, 
  FileText, 
  Lightbulb,
  Target,
  Zap
} from "lucide-react";

interface RealTimeStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  realTimeLogs: string[];
  searchResults?: any[];
  thinking?: string[];
  objectives?: string[];
  progress: number;
}

interface RealTimeWorkflowProps {
  workflowId: string;
  agentType: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  isVisible: boolean;
}

export function RealTimeWorkflow({
  workflowId,
  agentType,
  task,
  status,
  isVisible
}: RealTimeWorkflowProps) {
  const [steps, setSteps] = useState<RealTimeStep[]>([]);
  const [currentThinking, setCurrentThinking] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize workflow steps based on agent type
  useEffect(() => {
    if (status === 'running' && steps.length === 0) {
      const agentSteps = getAgentWorkflowSteps(agentType);
      setSteps(agentSteps);
      startWorkflowExecution(agentSteps);
    }
  }, [status, agentType]);

  // Auto-scroll to latest logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps, currentThinking]);

  const getAgentWorkflowSteps = (agentType: string): RealTimeStep[] => {
    const baseSteps = {
      research: [
        {
          id: 'thinking',
          name: '🧠 Understanding Query',
          description: 'Analyzing your request and determining research objectives',
          thinking: [
            'Breaking down the query components...',
            'Identifying key research areas...',
            'Planning search strategy...',
            'Setting research objectives...'
          ],
          objectives: []
        },
        {
          id: 'planning', 
          name: '🎯 Research Planning',
          description: 'Creating comprehensive research strategy',
          thinking: [
            'Mapping information sources...',
            'Prioritizing search terms...',
            'Setting validation criteria...'
          ],
          objectives: ['Define search scope', 'Identify authoritative sources', 'Plan validation strategy']
        },
        {
          id: 'searching',
          name: '🔍 Web Search',
          description: 'Searching multiple sources for relevant information',
          thinking: [],
          objectives: ['Search academic sources', 'Find recent publications', 'Cross-reference data']
        },
        {
          id: 'analysis',
          name: '📊 Data Analysis', 
          description: 'Analyzing and validating collected information',
          thinking: [],
          objectives: ['Verify source credibility', 'Extract key insights', 'Identify patterns']
        },
        {
          id: 'synthesis',
          name: '✨ Synthesis',
          description: 'Combining insights into comprehensive response',
          thinking: [],
          objectives: ['Organize findings', 'Create logical structure', 'Generate final response']
        }
      ],
      notes: [
        {
          id: 'analysis',
          name: '🧠 Content Analysis',
          description: 'Understanding and analyzing your content',
          thinking: [
            'Parsing input content...',
            'Identifying key themes...',
            'Determining note structure...'
          ],
          objectives: ['Extract main topics', 'Identify supporting details', 'Plan note organization']
        },
        {
          id: 'extraction',
          name: '📝 Key Point Extraction',
          description: 'Extracting important information and concepts',
          thinking: [],
          objectives: ['Identify core concepts', 'Extract actionable items', 'Find supporting evidence']
        },
        {
          id: 'structuring',
          name: '🏗️ Note Structuring',
          description: 'Organizing information into clear notes',
          thinking: [],
          objectives: ['Create hierarchical structure', 'Group related concepts', 'Add cross-references']
        },
        {
          id: 'enhancement',
          name: '✨ Enhancement',
          description: 'Adding summaries and improving clarity',
          thinking: [],
          objectives: ['Add executive summary', 'Include key takeaways', 'Create memory aids']
        }
      ]
    };

    return (baseSteps[agentType as keyof typeof baseSteps] || baseSteps.research).map((step, index) => ({
      ...step,
      status: 'pending' as const,
      realTimeLogs: [],
      searchResults: [],
      progress: 0
    }));
  };

  const startWorkflowExecution = async (workflowSteps: RealTimeStep[]) => {
    for (let i = 0; i < workflowSteps.length; i++) {
      const step = workflowSteps[i];
      
      // Update step to running
      setSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'running', startTime: new Date() } : s
      ));

      // Simulate real-time thinking and execution
      await executeStepWithRealTime(step, i);

      // Mark step as completed
      setSteps(prev => prev.map((s, idx) => 
        idx === i ? { 
          ...s, 
          status: 'completed', 
          endTime: new Date(),
          progress: 100 
        } : s
      ));

      // Update overall progress
      setOverallProgress(((i + 1) / workflowSteps.length) * 100);
    }
  };

  const executeStepWithRealTime = async (step: RealTimeStep, stepIndex: number) => {
    const stepId = step.id;
    
    // Show thinking process
    if (step.thinking && step.thinking.length > 0) {
      for (const thought of step.thinking) {
        setCurrentThinking(thought);
        await addRealTimeLog(stepIndex, `💭 ${thought}`);
        await delay(1500);
      }
    }

    // Show objectives
    if (step.objectives && step.objectives.length > 0) {
      for (const objective of step.objectives) {
        await addRealTimeLog(stepIndex, `🎯 Objective: ${objective}`);
        await delay(1000);
      }
    }

    // Simulate step-specific actions
    await simulateStepExecution(stepIndex, stepId);
  };

  const simulateStepExecution = async (stepIndex: number, stepId: string) => {
    switch (stepId) {
      case 'thinking':
        await addRealTimeLog(stepIndex, '🔍 Analyzing query structure...');
        await delay(1000);
        await addRealTimeLog(stepIndex, '📋 Identifying research requirements...');
        await delay(1200);
        await addRealTimeLog(stepIndex, '✅ Query analysis complete');
        break;

      case 'planning':
        await addRealTimeLog(stepIndex, '📝 Creating search strategy...');
        await delay(1000);
        await addRealTimeLog(stepIndex, '🔗 Mapping information sources...');
        await delay(1500);
        await addRealTimeLog(stepIndex, '✅ Research plan finalized');
        break;

      case 'searching':
        const searchQueries = [
          'Latest AI trends 2025',
          'Machine learning breakthroughs',
          'Industry expert opinions',
          'Academic research papers'
        ];
        
        for (const query of searchQueries) {
          await addRealTimeLog(stepIndex, `🔍 Searching: "${query}"`);
          await delay(800);
          await addRealTimeLog(stepIndex, `📊 Found 12 relevant sources for "${query}"`);
          await delay(600);
        }
        await addRealTimeLog(stepIndex, '✅ Search phase completed');
        break;

      case 'analysis':
        await addRealTimeLog(stepIndex, '🔍 Validating source credibility...');
        await delay(1200);
        await addRealTimeLog(stepIndex, '📊 Extracting key data points...');
        await delay(1500);
        await addRealTimeLog(stepIndex, '🔗 Cross-referencing information...');
        await delay(1000);
        await addRealTimeLog(stepIndex, '✅ Analysis complete - 94% confidence');
        break;

      case 'synthesis':
        await addRealTimeLog(stepIndex, '🏗️ Organizing findings...');
        await delay(1000);
        await addRealTimeLog(stepIndex, '📝 Creating response structure...');
        await delay(1200);
        await addRealTimeLog(stepIndex, '✨ Generating final insights...');
        await delay(1500);
        await addRealTimeLog(stepIndex, '✅ Synthesis complete');
        break;

      case 'extraction':
        await addRealTimeLog(stepIndex, '🔍 Identifying key concepts...');
        await delay(1000);
        await addRealTimeLog(stepIndex, '📝 Extracting main points...');
        await delay(1200);
        await addRealTimeLog(stepIndex, '✅ Key points extracted');
        break;

      case 'structuring':
        await addRealTimeLog(stepIndex, '🏗️ Creating note hierarchy...');
        await delay(1200);
        await addRealTimeLog(stepIndex, '🔗 Adding cross-references...');
        await delay(1000);
        await addRealTimeLog(stepIndex, '✅ Structure complete');
        break;

      case 'enhancement':
        await addRealTimeLog(stepIndex, '✨ Adding executive summary...');
        await delay(1000);
        await addRealTimeLog(stepIndex, '🎯 Creating key takeaways...');
        await delay(1200);
        await addRealTimeLog(stepIndex, '✅ Enhancement complete');
        break;
    }
  };

  const addRealTimeLog = async (stepIndex: number, log: string) => {
    setSteps(prev => prev.map((step, idx) => 
      idx === stepIndex 
        ? { ...step, realTimeLogs: [...step.realTimeLogs, log] }
        : step
    ));
    await delay(200); // Small delay for smooth animation
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getStepIcon = (step: RealTimeStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="border border-border/50 bg-card/95 backdrop-blur-sm mb-4">
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {status === 'running' ? (
                  <Brain className="h-4 w-4 animate-pulse text-blue-500" />
                ) : status === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">
                  {status === 'running' ? `${agentType} Agent is thinking...` : 
                   status === 'completed' ? 'Analysis Complete' : 'Preparing...'}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {Math.round(overallProgress)}% complete
              </Badge>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="px-4">
                <Progress value={overallProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Processing "{task.slice(0, 50)}..."</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
              </div>

              {/* Current Thinking */}
              {currentThinking && status === 'running' && (
                <div className="px-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Brain className="h-4 w-4 animate-pulse" />
                      <span className="text-sm font-medium">Currently thinking:</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{currentThinking}</p>
                  </div>
                </div>
              )}

              {/* Workflow Steps */}
              <ScrollArea className="max-h-96">
                <div className="space-y-3 px-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="space-y-2">
                      <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors
                        ${step.status === 'running' ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' :
                          step.status === 'completed' ? 'bg-green-50 dark:bg-green-950/20' :
                          step.status === 'failed' ? 'bg-red-50 dark:bg-red-950/20' :
                          'bg-muted/30'}`}>
                        
                        <div className="flex items-center gap-2 flex-1">
                          {getStepIcon(step)}
                          <div>
                            <div className="text-sm font-medium">{step.name}</div>
                            <div className="text-xs text-muted-foreground">{step.description}</div>
                          </div>
                        </div>
                        
                        {step.status === 'running' && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {step.progress}%
                          </div>
                        )}
                      </div>

                      {/* Real-time Logs */}
                      {step.realTimeLogs.length > 0 && (
                        <div className="ml-6 bg-muted/30 rounded-lg p-3">
                          <div className="space-y-1 text-xs font-mono">
                            {step.realTimeLogs.map((log, logIndex) => (
                              <div 
                                key={logIndex} 
                                className="flex items-start gap-2 animate-in slide-in-from-left-2"
                              >
                                <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                <span className="text-foreground/80">{log}</span>
                              </div>
                            ))}
                            {step.status === 'running' && (
                              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Processing...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}