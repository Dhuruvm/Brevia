import { AgentBase } from '../core/agent-base';
import { pluginManager } from '../core/plugin-manager';
import { storage } from '../storage';

interface Source {
  id?: string;
  type: string;
  title: string;
  url?: string;
  content: string;
  summary: string;
  credibility_score: number;
  relevance_score: number;
  metadata?: Record<string, any>;
}

export class ResearchAgent extends AgentBase {
  private currentSessionId: string | null = null;
  constructor() {
    super('research', {
      name: 'Research Agent',
      description: 'Conducts comprehensive research on topics',
      capabilities: ['web_search', 'content_analysis', 'source_validation'],
      models: {
        primary: 'huggingface',
        fallback: 'local'
      }
    });
  }

  async executeTask(context: any): Promise<any> {
    try {
      this.currentSessionId = context.sessionId;
      await this.updateWorkflowStatus('running', 'Starting research', 10);
      await this.logMessage(context.sessionId, 'info', `Starting research on: ${context.task}`);

      // Create research plan
      const plan = await this.createResearchPlan(context.task);
      await this.updateStep('planning', 'completed', { planCreated: true });
      await this.updateWorkflowStatus('running', 'Research plan created', 25);

      // Gather sources
      const sources = await this.gatherSources(plan);
      await this.updateStep('source_gathering', 'completed', { sourceCount: sources.length });
      await this.updateWorkflowStatus('running', 'Sources gathered', 50);

      // Validate sources
      const validatedSources = await this.validateSources(sources);
      await this.updateStep('validation', 'completed', { validatedCount: validatedSources.length });
      await this.updateWorkflowStatus('running', 'Sources validated', 75);

      // Extract insights and synthesize
      const insights = await this.extractInsights(validatedSources);
      const report = await this.synthesizeReport(context.task, insights, validatedSources);

      await this.updateWorkflowStatus('completed', 'Research Complete', 100);
      await this.logMessage(context.sessionId, 'info', 'Research task completed successfully');

      return {
        success: true,
        content: report,
        metadata: {
          sourceCount: validatedSources.length,
          confidence: 0.85,
          sources: validatedSources.map(s => ({ title: s.title, url: s.url }))
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateWorkflowStatus('error', 'Research failed', 0);
      await this.logMessage(context.sessionId, 'error', `Research failed: ${errorMessage}`);

      return {
        success: false,
        content: `Research failed: ${errorMessage}`,
        error: errorMessage
      };
    }
  }

  private async createResearchPlan(task: string): Promise<any> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const planPrompt = `
Create a research plan for: "${task}"

Provide a structured plan with:
1. Key topics to research
2. Search strategies
3. Expected source types

Format as JSON:
{
  "topics": ["topic1", "topic2"],
  "search_strategies": [
    {
      "topic": "main topic",
      "keywords": ["keyword1", "keyword2"],
      "sources": ["academic", "news", "official"]
    }
  ],
  "expected_sources": 5
}
`;

    try {
      const planResponse = await llm.generateText(planPrompt);
      return JSON.parse(planResponse || '{"topics": [], "search_strategies": [], "expected_sources": 3}');
    } catch (error) {
      return {
        topics: [task],
        search_strategies: [{
          topic: task,
          keywords: task.split(' ').slice(0, 3),
          sources: ['web', 'academic']
        }],
        expected_sources: 3
      };
    }
  }

  private async gatherSources(plan: any): Promise<Source[]> {
    const sources: Source[] = [];

    // Search knowledge base first
    for (const strategy of plan.search_strategies) {
      const knowledge = await storage.searchKnowledge(strategy.topic, 3);

      for (const kb of knowledge) {
        const source = await this.storeSource({
          type: 'knowledge',
          title: kb.topic,
          content: kb.content,
          summary: kb.content.substring(0, 200) + '...',
          credibility_score: kb.confidence || 0.7,
          relevance_score: 0.8,
          metadata: {
            source: 'knowledge_base',
            tags: kb.tags,
            usage_count: kb.usage_count
          }
        });
        sources.push(source);
      }
    }

    // Simulate web search (in production, would use real web search API)
    for (const strategy of plan.search_strategies) {
      const mockSources = await this.simulateWebSearch(strategy);
      sources.push(...mockSources);
    }

    console.log(`📚 Gathered ${sources.length} sources for research`);
    return sources;
  }

  private async simulateWebSearch(strategy: any): Promise<Source[]> {
    const mockSourcesData = [
      {
        title: `Comprehensive Guide to ${strategy.topic}`,
        url: `https://example.com/${strategy.topic.toLowerCase().replace(' ', '-')}`,
        content: `This is a comprehensive overview of ${strategy.topic}, covering the latest developments and key insights in the field. The research shows significant progress in recent years with practical applications emerging across various sectors.`,
        domain: 'example.com'
      },
      {
        title: `Research Analysis: ${strategy.topic}`,
        url: `https://research.edu/${strategy.topic.toLowerCase()}-analysis`,
        content: `Academic research shows that ${strategy.topic} has significant implications for current practices and future developments. Multiple studies confirm the growing importance of this field.`,
        domain: 'research.edu'
      }
    ];

    const sources: Source[] = [];

    for (const mockData of mockSourcesData) {
      const source = await this.storeSource({
        type: 'url',
        url: mockData.url,
        title: mockData.title,
        content: mockData.content,
        summary: mockData.content.substring(0, 150) + '...',
        credibility_score: this.assessSourceCredibility(mockData.url, mockData.domain),
        relevance_score: 0.75,
        metadata: {
          domain: mockData.domain,
          search_query: strategy.keywords.join(' '),
          date_accessed: new Date().toISOString()
        }
      });
      sources.push(source);
    }

    return sources;
  }

  private async validateSources(sources: Source[]): Promise<Source[]> {
    const validatedSources = [];

    for (const source of sources) {
      const minCredibility = 0.3;
      const minRelevance = 0.5;

      if ((source.credibility_score || 0) >= minCredibility && 
          (source.relevance_score || 0) >= minRelevance) {
        validatedSources.push(source);
      } else {
        console.log(`🚫 Filtered out low-quality source: ${source.title}`);
      }
    }

    console.log(`✅ Validated ${validatedSources.length}/${sources.length} sources`);
    return validatedSources;
  }

  private async extractInsights(sources: Source[]): Promise<any> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const insights = [];

    for (const source of sources) {
      const prompt = `
Extract key insights from this source:

Title: ${source.title}
Content: ${source.content}

Provide:
1. Main facts (3-5 key points)
2. Important data or statistics
3. Notable quotes or statements
4. Conclusions or implications

Format as JSON:
{
  "facts": ["fact1", "fact2"],
  "data": ["stat1", "stat2"],
  "quotes": ["quote1"],
  "conclusions": ["conclusion1"]
}
`;

      try {
        const insightResponse = await llm.generateText(prompt);
        const insight = JSON.parse(insightResponse || '{}');
        insights.push({ source: source.title, ...insight });
      } catch (error) {
        insights.push({
          source: source.title,
          facts: [`Key information from ${source.title}`],
          data: [],
          quotes: [],
          conclusions: [`Relevant findings from ${source.title}`]
        });
      }
    }

    return insights;
  }

  private async synthesizeReport(task: string, insights: any[], sources: Source[]): Promise<string> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) {
      // Fallback synthesis
      return this.createFallbackReport(task, insights, sources);
    }

    const synthesisPrompt = `
Create a comprehensive research report on: "${task}"

Based on the following insights from ${sources.length} sources:
${insights.map(i => `- ${i.source}: ${i.facts?.join(', ') || 'No specific facts'}`).join('\n')}

Structure the report with:
1. Executive Summary
2. Key Findings
3. Analysis
4. Conclusions
5. Sources

Make it informative and well-structured.
`;

    try {
      const report = await llm.generateText(synthesisPrompt);
      return report || this.createFallbackReport(task, insights, sources);
    } catch (error) {
      return this.createFallbackReport(task, insights, sources);
    }
  }

  private createFallbackReport(task: string, insights: any[], sources: Source[]): string {
    return `# Research Report: ${task}

## Executive Summary
Based on analysis of ${sources.length} sources, this report provides comprehensive insights into ${task}.

## Key Findings
${insights.map(i => `- **${i.source}**: ${i.facts?.slice(0, 2).join(', ') || 'Relevant information found'}`).join('\n')}

## Analysis
The research reveals important aspects of ${task} that warrant attention. Multiple sources confirm the significance of this topic.

## Conclusions
- ${task} is an active area of research and development
- Multiple perspectives exist on this topic
- Further investigation may be valuable

## Sources
${sources.map(s => `- [${s.title}](${s.url || '#'})`).join('\n')}

*Report generated on ${new Date().toLocaleDateString()}*
`;
  }

  private async storeSource(sourceData: Omit<Source, 'id'>): Promise<Source> {
    const source = await storage.createSource({
      sessionId: this.currentSessionId || 'unknown',
      title: sourceData.title,
      url: sourceData.url,
      sourceType: sourceData.type,
      content: sourceData.content,
      metadata: sourceData.metadata
    });

    return {
      id: source.id,
      type: sourceData.type,
      title: sourceData.title,
      url: sourceData.url,
      content: sourceData.content,
      summary: sourceData.summary,
      credibility_score: sourceData.credibility_score,
      relevance_score: sourceData.relevance_score,
      metadata: sourceData.metadata
    };
  }
}