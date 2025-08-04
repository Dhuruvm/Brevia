import { BaseAgent, AgentConfig, AgentStep, AgentResult } from '../core/agent-base';
import { pluginManager } from '../core/plugin-manager';
import { storage } from '../storage';
import type { Source } from '@shared/schema';

export class ResearchAgent extends BaseAgent {
  constructor(workflowId: string, sessionId: string) {
    const config: AgentConfig = {
      id: 'research-agent',
      type: 'research',
      models: {
        primary: 'mistral-7b',
        fallback: 'phi-3-medium',
        embedding: 'bge-small'
      },
      maxTokens: 4096,
      temperature: 0.6,
      timeoutMs: 300000, // 5 minutes
      retries: 3
    };
    super(config, workflowId, sessionId);
  }

  defineWorkflow(task: string): AgentStep[] {
    return [
      {
        id: 'analyze_query',
        name: 'Query Analysis',
        description: 'Analyze research query and extract key topics',
        status: 'pending'
      },
      {
        id: 'plan_research',
        name: 'Research Planning',
        description: 'Create research strategy and identify source types',
        status: 'pending'
      },
      {
        id: 'gather_sources',
        name: 'Source Collection',
        description: 'Collect sources from web, knowledge base, and user files',
        status: 'pending'
      },
      {
        id: 'validate_sources',
        name: 'Source Validation',
        description: 'Assess credibility and relevance of collected sources',
        status: 'pending'
      },
      {
        id: 'extract_insights',
        name: 'Insight Extraction',
        description: 'Extract key insights and facts from validated sources',
        status: 'pending'
      },
      {
        id: 'synthesize_research',
        name: 'Research Synthesis',
        description: 'Synthesize findings into structured research report',
        status: 'pending'
      },
      {
        id: 'generate_citations',
        name: 'Citation Generation',
        description: 'Generate proper citations and references',
        status: 'pending'
      }
    ];
  }

  async executeStep(step: AgentStep, context: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      switch (step.id) {
        case 'analyze_query':
          return await this.analyzeQuery(context.task);
        case 'plan_research':
          return await this.planResearch(context.task, context.step_analyze_query);
        case 'gather_sources':
          return await this.gatherSources(context.step_plan_research);
        case 'validate_sources':
          return await this.validateSources(context.step_gather_sources);
        case 'extract_insights':
          return await this.extractInsights(context.step_validate_sources);
        case 'synthesize_research':
          return await this.synthesizeResearch(context.step_extract_insights, context.task);
        case 'generate_citations':
          return await this.generateCitations(context.step_synthesize_research);
        default:
          throw new Error(`Unknown step: ${step.id}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Research Agent step ${step.id} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  private async analyzeQuery(task: string): Promise<any> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const prompt = `
Analyze this research query and extract key information:

Query: "${task}"

Please provide:
1. Main research topics (3-5 keywords)
2. Research scope (broad/focused/specific)
3. Expected information types (facts, analysis, opinions, data)
4. Potential source types needed (academic, news, web, government)
5. Research complexity level (1-5)

Format as JSON:
{
  "topics": ["topic1", "topic2"],
  "scope": "broad|focused|specific",
  "info_types": ["facts", "analysis"],
  "source_types": ["academic", "news"],
  "complexity": 3
}`;

    const response = await llm.execute(prompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return {
        topics: this.extractTopics(task),
        scope: 'focused',
        info_types: ['facts', 'analysis'],
        source_types: ['web', 'academic'],
        complexity: 3
      };
    } catch (error) {
      console.warn('Failed to parse query analysis, using fallback');
      return {
        topics: this.extractTopics(task),
        scope: 'focused',
        info_types: ['facts'],
        source_types: ['web'],
        complexity: 2
      };
    }
  }

  private async planResearch(task: string, analysis: any): Promise<any> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const prompt = `
Create a research plan for: "${task}"

Analysis shows:
- Topics: ${analysis.topics.join(', ')}
- Scope: ${analysis.scope}
- Complexity: ${analysis.complexity}/5

Create a structured research plan with:
1. Research questions (3-5 specific questions)
2. Search strategies for each topic
3. Priority sources to target
4. Information organization approach

Format as JSON:
{
  "research_questions": ["question1", "question2"],
  "search_strategies": [
    {"topic": "topic1", "keywords": ["key1", "key2"], "sources": ["source1"]}
  ],
  "priority_sources": ["source_type1", "source_type2"],
  "organization_approach": "chronological|thematic|comparative"
}`;

    const response = await llm.execute(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse research plan, using fallback');
    }
    
    // Fallback plan
    return {
      research_questions: [
        `What are the key aspects of ${analysis.topics[0]}?`,
        `How does ${analysis.topics[0]} impact current trends?`,
        `What are the latest developments in ${analysis.topics[0]}?`
      ],
      search_strategies: analysis.topics.map((topic: string) => ({
        topic,
        keywords: [topic, `${topic} research`, `${topic} analysis`],
        sources: ['web', 'academic']
      })),
      priority_sources: analysis.source_types,
      organization_approach: 'thematic'
    };
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
    // This would be replaced with real web search API calls
    const mockSourcesData = [
      {
        title: `Comprehensive Guide to ${strategy.topic}`,
        url: `https://example.com/${strategy.topic.toLowerCase().replace(' ', '-')}`,
        content: `This is a comprehensive overview of ${strategy.topic}, covering the latest developments and key insights in the field.`,
        domain: 'example.com'
      },
      {
        title: `Research Analysis: ${strategy.topic}`,
        url: `https://research.edu/${strategy.topic.toLowerCase()}-analysis`,
        content: `Academic research shows that ${strategy.topic} has significant implications for current practices and future developments.`,
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
      // Apply validation criteria
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
}`;

      try {
        const response = await llm.execute(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const insight = JSON.parse(jsonMatch[0]);
          insight.source_id = source.id;
          insight.source_title = source.title;
          insights.push(insight);
        }
      } catch (error) {
        console.warn(`Failed to extract insights from source: ${source.title}`);
        // Add basic insight
        insights.push({
          source_id: source.id,
          source_title: source.title,
          facts: [source.summary || 'Content analysis unavailable'],
          data: [],
          quotes: [],
          conclusions: []
        });
      }
    }

    return insights;
  }

  private async synthesizeResearch(insights: any[], task: string): Promise<string> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const allFacts = insights.flatMap(i => i.facts);
    const allData = insights.flatMap(i => i.data);
    const allConclusions = insights.flatMap(i => i.conclusions);

    const prompt = `
Create a comprehensive research report on: "${task}"

Based on these research findings:

Key Facts:
${allFacts.map((fact, i) => `${i + 1}. ${fact}`).join('\n')}

Data Points:
${allData.map((data, i) => `${i + 1}. ${data}`).join('\n')}

Conclusions:
${allConclusions.map((conclusion, i) => `${i + 1}. ${conclusion}`).join('\n')}

Structure the report with:
1. Executive Summary
2. Key Findings
3. Detailed Analysis
4. Data and Statistics
5. Implications and Conclusions
6. Recommendations

Write a comprehensive, well-structured report in markdown format.`;

    const report = await llm.execute(prompt, { max_tokens: 3000 });
    
    // Store the research report as a document
    await this.storeDocument({
      type: 'research',
      title: `Research Report: ${task}`,
      content: report,
      format: 'markdown',
      structure: {
        sections: ['summary', 'findings', 'analysis', 'data', 'conclusions', 'recommendations']
      },
      metadata: {
        source_count: insights.length,
        research_depth: 'comprehensive',
        generated_at: new Date().toISOString()
      },
      quality_score: this.assessContentQuality(report)
    });

    return report;
  }

  private async generateCitations(report: string): Promise<any> {
    const sources = await storage.getSources(this.workflowId);
    
    const citations = sources.map((source, index) => ({
      id: index + 1,
      title: source.title,
      url: source.url,
      type: source.type,
      accessed: source.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    }));

    // Add citations to the end of the report
    const citationSection = '\n\n## References\n\n' + 
      citations.map(c => 
        `${c.id}. ${c.title}${c.url ? `. Available at: ${c.url}` : ''}. Accessed: ${c.accessed}`
      ).join('\n');

    return {
      report_with_citations: report + citationSection,
      citations: citations
    };
  }

  async synthesizeResult(stepOutputs: any[]): Promise<AgentResult> {
    const finalOutput = stepOutputs[stepOutputs.length - 1]; // Citations output
    const sources = await storage.getSources(this.workflowId);
    
    return {
      success: true,
      content: finalOutput.report_with_citations,
      metadata: {
        sources: sources,
        citations: finalOutput.citations,
        confidence: 0.85,
        processingTime: Date.now() - this.startTime.getTime(),
        tokensUsed: this.estimateTokens(finalOutput.report_with_citations),
        modelsUsed: [this.config.models.primary]
      }
    };
  }

  private extractTopics(text: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const topics = words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
    return [...new Set(topics)]; // Remove duplicates
  }
}