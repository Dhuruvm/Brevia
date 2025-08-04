import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  Globe, 
  FileText, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  ChevronDown,
  ExternalLink,
  Clock,
  Database,
  Code,
  Eye,
  Download
} from "lucide-react";

interface ResearchStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: string;
  endTime?: string;
  logs: string[];
  results?: any;
  curlCommand?: string;
  response?: {
    status: number;
    headers: Record<string, string>;
    content: string;
    size: string;
    duration: number;
  };
}

interface ResearchWorkflowProps {
  query: string;
  isActive: boolean;
  onComplete?: (results: any) => void;
}

export function ResearchWorkflow({ query, isActive, onComplete }: ResearchWorkflowProps) {
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize research steps when query changes
  useEffect(() => {
    if (query && isActive) {
      initializeResearch();
    }
  }, [query, isActive]);

  const initializeResearch = () => {
    const researchSteps: ResearchStep[] = [
      {
        id: "parse-query",
        name: "Parse Research Query",
        description: `Analyzing: "${query}"`,
        status: 'pending',
        progress: 0,
        logs: []
      },
      {
        id: "web-search",
        name: "Web Search & Data Collection",
        description: "Searching multiple sources for relevant information",
        status: 'pending',
        progress: 0,
        logs: []
      },
      {
        id: "content-extraction",
        name: "Content Extraction & Analysis",
        description: "Extracting and analyzing content from sources",
        status: 'pending',
        progress: 0,
        logs: []
      },
      {
        id: "source-verification",
        name: "Source Verification",
        description: "Verifying credibility and relevance of sources",
        status: 'pending',
        progress: 0,
        logs: []
      },
      {
        id: "synthesis",
        name: "Research Synthesis",
        description: "Compiling comprehensive research report",
        status: 'pending',
        progress: 0,
        logs: []
      }
    ];

    setSteps(researchSteps);
    setCurrentStep(0);
    setExpandedSteps(new Set(['parse-query']));
    
    // Start the research process
    startResearchProcess(researchSteps);
  };

  const startResearchProcess = async (initialSteps: ResearchStep[]) => {
    const updatedSteps = [...initialSteps];

    // Step 1: Parse Query
    updatedSteps[0] = {
      ...updatedSteps[0],
      status: 'running',
      startTime: new Date().toISOString(),
      logs: ['Initializing research session...', 'Parsing query components...', 'Identifying key search terms...']
    };
    setSteps([...updatedSteps]);
    setCurrentStep(0);

    await simulateProgress(0, updatedSteps);

    // Step 2: Web Search
    updatedSteps[1] = {
      ...updatedSteps[1],
      status: 'running',
      startTime: new Date().toISOString(),
      logs: [
        'Starting web search...',
        `curl -X GET "https://api.search.com/v1/search?q=${encodeURIComponent(query)}"`,
        'Fetching results from multiple search engines...'
      ],
      curlCommand: `curl -X GET "https://api.search.com/v1/search?q=${encodeURIComponent(query)}" \\
  -H "User-Agent: Brevia-Research-Agent/1.0" \\
  -H "Accept: application/json"`
    };
    setSteps([...updatedSteps]);
    setCurrentStep(1);
    setExpandedSteps(new Set(['web-search']));

    await simulateWebSearch(1, updatedSteps);

    // Step 3: Content Extraction
    updatedSteps[2] = {
      ...updatedSteps[2],
      status: 'running',
      startTime: new Date().toISOString(),
      logs: [
        'Extracting content from discovered sources...',
        'curl -X GET "https://example.com/research-article"',
        'Parsing HTML content...',
        'Extracting text and metadata...'
      ]
    };
    setSteps([...updatedSteps]);
    setCurrentStep(2);
    setExpandedSteps(new Set(['content-extraction']));

    await simulateContentExtraction(2, updatedSteps);

    // Step 4: Source Verification
    updatedSteps[3] = {
      ...updatedSteps[3],
      status: 'running',
      startTime: new Date().toISOString(),
      logs: [
        'Verifying source credibility...',
        'Checking domain authority...',
        'Analyzing content quality...',
        'Calculating relevance scores...'
      ]
    };
    setSteps([...updatedSteps]);
    setCurrentStep(3);
    setExpandedSteps(new Set(['source-verification']));

    await simulateVerification(3, updatedSteps);

    // Step 5: Synthesis
    updatedSteps[4] = {
      ...updatedSteps[4],
      status: 'running',
      startTime: new Date().toISOString(),
      logs: [
        'Synthesizing research findings...',
        'Organizing information by relevance...',
        'Generating research report...',
        'Formatting with source citations...'
      ]
    };
    setSteps([...updatedSteps]);
    setCurrentStep(4);
    setExpandedSteps(new Set(['synthesis']));

    await simulateSynthesis(4, updatedSteps);

    // Complete the research
    if (onComplete) {
      onComplete({
        query,
        sources: 5,
        credibilityScore: 0.94,
        totalTime: '2.3s',
        findings: 'Research completed successfully'
      });
    }
  };

  const simulateProgress = async (stepIndex: number, currentSteps: ResearchStep[]) => {
    const step = currentSteps[stepIndex];
    
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      currentSteps[stepIndex] = {
        ...step,
        progress,
        logs: [
          ...step.logs,
          progress === 20 ? 'Tokenizing query...' :
          progress === 40 ? 'Identifying entities...' :
          progress === 60 ? 'Generating search variants...' :
          progress === 80 ? 'Preparing search strategy...' :
          progress === 100 ? 'Query analysis complete ✓' : ''
        ].filter(Boolean)
      };
      
      if (progress === 100) {
        currentSteps[stepIndex].status = 'completed';
        currentSteps[stepIndex].endTime = new Date().toISOString();
      }
      
      setSteps([...currentSteps]);
    }
  };

  const simulateWebSearch = async (stepIndex: number, currentSteps: ResearchStep[]) => {
    const step = currentSteps[stepIndex];
    
    for (let progress = 0; progress <= 100; progress += 25) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const newLogs = progress === 25 ? ['Response: 200 OK', 'Found 847 results'] :
                     progress === 50 ? ['Filtering for relevance...', 'Processing top 20 results'] :
                     progress === 75 ? ['Extracting URLs and metadata...', 'Found 5 high-quality sources'] :
                     progress === 100 ? ['Web search complete ✓', 'Ready for content extraction'] : [];
      
      currentSteps[stepIndex] = {
        ...step,
        progress,
        logs: [...step.logs, ...newLogs],
        response: progress === 25 ? {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-ratelimit-remaining': '99'
          },
          content: JSON.stringify({ results: 847, sources: 5 }),
          size: '2.4KB',
          duration: 340
        } : step.response
      };
      
      if (progress === 100) {
        currentSteps[stepIndex].status = 'completed';
        currentSteps[stepIndex].endTime = new Date().toISOString();
      }
      
      setSteps([...currentSteps]);
    }
  };

  const simulateContentExtraction = async (stepIndex: number, currentSteps: ResearchStep[]) => {
    const step = currentSteps[stepIndex];
    
    for (let progress = 0; progress <= 100; progress += 33) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newLogs = progress === 33 ? ['Response: 200 OK', 'Content-Length: 45KB', 'Extracting main content...'] :
                     progress === 66 ? ['Cleaning HTML markup...', 'Identifying key paragraphs...'] :
                     progress === 100 ? ['Extracted 15,000 words', 'Content extraction complete ✓'] : [];
      
      currentSteps[stepIndex] = {
        ...step,
        progress,
        logs: [...step.logs, ...newLogs]
      };
      
      if (progress === 100) {
        currentSteps[stepIndex].status = 'completed';
        currentSteps[stepIndex].endTime = new Date().toISOString();
      }
      
      setSteps([...currentSteps]);
    }
  };

  const simulateVerification = async (stepIndex: number, currentSteps: ResearchStep[]) => {
    const step = currentSteps[stepIndex];
    
    for (let progress = 0; progress <= 100; progress += 25) {
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const newLogs = progress === 25 ? ['Domain Authority: 85/100', 'Author credentials verified'] :
                     progress === 50 ? ['Cross-referencing facts...', 'Checking publication dates'] :
                     progress === 75 ? ['Calculating credibility scores...', 'Relevance analysis complete'] :
                     progress === 100 ? ['Average credibility: 94%', 'Source verification complete ✓'] : [];
      
      currentSteps[stepIndex] = {
        ...step,
        progress,
        logs: [...step.logs, ...newLogs]
      };
      
      if (progress === 100) {
        currentSteps[stepIndex].status = 'completed';
        currentSteps[stepIndex].endTime = new Date().toISOString();
      }
      
      setSteps([...currentSteps]);
    }
  };

  const simulateSynthesis = async (stepIndex: number, currentSteps: ResearchStep[]) => {
    const step = currentSteps[stepIndex];
    
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const newLogs = progress === 20 ? ['Organizing by topic relevance...'] :
                     progress === 40 ? ['Generating executive summary...'] :
                     progress === 60 ? ['Adding source citations...'] :
                     progress === 80 ? ['Formatting final report...'] :
                     progress === 100 ? ['Research synthesis complete ✓', 'Report ready for review'] : [];
      
      currentSteps[stepIndex] = {
        ...step,
        progress,
        logs: [...step.logs, ...newLogs]
      };
      
      if (progress === 100) {
        currentSteps[stepIndex].status = 'completed';
        currentSteps[stepIndex].endTime = new Date().toISOString();
      }
      
      setSteps([...currentSteps]);
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const getStepIcon = (step: ResearchStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepDuration = (step: ResearchStep) => {
    if (step.startTime && step.endTime) {
      const duration = new Date(step.endTime).getTime() - new Date(step.startTime).getTime();
      return `${(duration / 1000).toFixed(1)}s`;
    }
    return null;
  };

  const overallProgress = steps.length > 0 ? (steps.filter(s => s.status === 'completed').length / steps.length) * 100 : 0;

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  if (!query || !isActive) return null;

  return (
    <Card className="w-full border-blue-200 dark:border-blue-800">
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Research in Progress</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Real-time Web Search
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="space-y-4">
              {/* Query Display */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                  <Globe className="h-4 w-4" />
                  <span>Researching:</span>
                </div>
                <p className="text-sm mt-1 font-mono">{query}</p>
              </div>

              {/* Overall Progress */}
              <div className="px-2">
                <Progress value={overallProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Research Progress</span>
                  <span>{Math.round(overallProgress)}% Complete</span>
                </div>
              </div>

              {/* Research Steps */}
              <ScrollArea className="max-h-96">
                <div className="space-y-3 px-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="space-y-2">
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer
                          ${step.status === 'running' ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' :
                            step.status === 'completed' ? 'bg-green-50 dark:bg-green-950/20' :
                            step.status === 'failed' ? 'bg-red-50 dark:bg-red-950/20' :
                            'hover:bg-muted/50'}`}
                        onClick={() => toggleStep(step.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {getStepIcon(step)}
                          <div>
                            <div className="text-sm font-medium">{step.name}</div>
                            <div className="text-xs text-muted-foreground">{step.description}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {step.status === 'running' && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              {step.progress}%
                            </div>
                          )}
                          {getStepDuration(step) && (
                            <Badge variant="outline" className="text-xs h-5">
                              {getStepDuration(step)}
                            </Badge>
                          )}
                          {step.logs.length > 0 && (
                            <ChevronDown className={`h-3 w-3 transition-transform ${
                              expandedSteps.has(step.id) ? 'rotate-180' : ''
                            }`} />
                          )}
                        </div>
                      </div>

                      {/* Step Details */}
                      {expandedSteps.has(step.id) && step.logs.length > 0 && (
                        <div className="ml-6 space-y-2">
                          {/* Curl Command */}
                          {step.curlCommand && (
                            <div className="bg-gray-950 text-green-400 rounded-md p-3 text-xs font-mono">
                              <div className="flex items-center gap-2 mb-2">
                                <Code className="h-3 w-3" />
                                <span className="text-gray-400">HTTP Request:</span>
                              </div>
                              <pre className="whitespace-pre-wrap">{step.curlCommand}</pre>
                            </div>
                          )}
                          
                          {/* Response Details */}
                          {step.response && (
                            <div className="bg-muted/30 rounded-md p-3 text-xs">
                              <div className="flex items-center gap-2 mb-2">
                                <Eye className="h-3 w-3" />
                                <span className="font-medium">Response:</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>Status: <span className="text-green-600">{step.response.status}</span></div>
                                <div>Size: {step.response.size}</div>
                                <div>Duration: {step.response.duration}ms</div>
                                <div>Type: {step.response.headers['content-type']}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Logs */}
                          <div className="bg-muted/30 rounded-md p-3 text-xs font-mono">
                            <div className="space-y-1">
                              {step.logs.map((log, logIndex) => (
                                <div key={logIndex} className="flex items-start gap-2">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                  <span className="text-foreground/80">
                                    {typeof log === 'object' ? JSON.stringify(log) : String(log)}
                                  </span>
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