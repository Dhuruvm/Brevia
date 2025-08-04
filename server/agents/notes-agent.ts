import { BaseAgent, AgentConfig, AgentStep, AgentResult } from '../core/agent-base';
import { pluginManager } from '../core/plugin-manager';
import { storage } from '../storage';

export class NotesAgent extends BaseAgent {
  constructor(workflowId: string, sessionId: string) {
    const config: AgentConfig = {
      id: 'notes-agent',
      type: 'notes',
      models: {
        primary: 'phi-3-medium',
        fallback: 'mistral-7b',
        embedding: 'sentence-transformer'
      },
      maxTokens: 2048,
      temperature: 0.4,
      timeoutMs: 120000, // 2 minutes
      retries: 2
    };
    super(config, workflowId, sessionId);
  }

  defineWorkflow(task: string): AgentStep[] {
    return [
      {
        id: 'analyze_input',
        name: 'Input Analysis',
        description: 'Analyze input type and content structure',
        status: 'pending'
      },
      {
        id: 'extract_content',
        name: 'Content Extraction',
        description: 'Extract and clean content from various sources',
        status: 'pending'
      },
      {
        id: 'identify_key_points',
        name: 'Key Point Identification',
        description: 'Identify and rank important information',
        status: 'pending'
      },
      {
        id: 'structure_notes',
        name: 'Note Structuring',
        description: 'Organize content into structured notes',
        status: 'pending'
      },
      {
        id: 'enhance_notes',
        name: 'Note Enhancement',
        description: 'Add summaries, questions, and cross-references',
        status: 'pending'
      },
      {
        id: 'format_output',
        name: 'Output Formatting',
        description: 'Format notes in requested style',
        status: 'pending'
      }
    ];
  }

  async executeStep(step: AgentStep, context: any): Promise<any> {
    switch (step.id) {
      case 'analyze_input':
        return await this.analyzeInput(context.task);
      case 'extract_content':
        return await this.extractContent(context.task, context.step_analyze_input);
      case 'identify_key_points':
        return await this.identifyKeyPoints(context.step_extract_content);
      case 'structure_notes':
        return await this.structureNotes(context.step_identify_key_points);
      case 'enhance_notes':
        return await this.enhanceNotes(context.step_structure_notes);
      case 'format_output':
        return await this.formatOutput(context.step_enhance_notes, context.task);
      default:
        throw new Error(`Unknown step: ${step.id}`);
    }
  }

  private async analyzeInput(task: string): Promise<any> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const prompt = `
Analyze this note-taking request:

"${task}"

Determine:
1. Input type (text, url, pdf, video, audio, multiple sources)
2. Note style needed (bullet points, outline, mind map, summary, detailed)
3. Content complexity (simple, moderate, complex)
4. Special requirements (citations, timestamps, questions)

Format as JSON:
{
  "input_type": "text|url|pdf|video|audio|multiple",
  "note_style": "bullets|outline|mindmap|summary|detailed",
  "complexity": "simple|moderate|complex",
  "requirements": ["citations", "timestamps"]
}`;

    const response = await llm.execute(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse input analysis, using defaults');
    }
    
    // Fallback analysis
    return {
      input_type: task.includes('http') ? 'url' : 'text',
      note_style: 'outline',
      complexity: 'moderate',
      requirements: []
    };
  }

  private async extractContent(task: string, analysis: any): Promise<any> {
    let content = '';
    let metadata = {};

    switch (analysis.input_type) {
      case 'url':
        const urlMatch = task.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          content = await this.extractFromUrl(urlMatch[0]);
          metadata = { source_url: urlMatch[0], type: 'web_content' };
        }
        break;
      
      case 'pdf':
        // In production, would use PDF parsing library
        content = 'PDF content extraction would be implemented here';
        metadata = { type: 'pdf_content' };
        break;
      
      case 'video':
        // In production, would use video transcription
        content = 'Video transcription would be implemented here';
        metadata = { type: 'video_transcript' };
        break;
      
      case 'text':
      default:
        content = task;
        metadata = { type: 'direct_text' };
        break;
    }

    return {
      content,
      metadata,
      word_count: content.split(/\s+/).length,
      estimated_reading_time: Math.ceil(content.split(/\s+/).length / 200)
    };
  }

  private async extractFromUrl(url: string): Promise<string> {
    // Simulate web content extraction
    // In production, would use libraries like Puppeteer or newspaper3k
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        // Basic text extraction (in production would use proper parser)
        const textContent = html.replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 5000); // Limit for processing
        return textContent;
      }
    } catch (error) {
      console.warn('Failed to fetch URL content:', error);
    }
    
    return `Content from ${url} - [URL extraction would be implemented with proper web scraping tools]`;
  }

  private async identifyKeyPoints(contentData: any): Promise<any> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const prompt = `
Analyze this content and identify key points:

Content: "${contentData.content}"

Extract:
1. Main topics (3-7 primary subjects)
2. Key facts and data points
3. Important concepts and definitions
4. Action items or takeaways
5. Questions that arise from the content

Rank by importance (1-5 scale) and format as JSON:
{
  "main_topics": [
    {"topic": "topic name", "importance": 5, "details": "brief description"}
  ],
  "key_facts": [
    {"fact": "fact statement", "importance": 4}
  ],
  "concepts": [
    {"concept": "concept name", "definition": "definition", "importance": 3}
  ],
  "action_items": ["item1", "item2"],
  "questions": ["question1", "question2"]
}`;

    const response = await llm.execute(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse key points, using fallback');
    }
    
    // Fallback key point extraction
    const sentences = contentData.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
    return {
      main_topics: [
        { topic: 'General Content', importance: 3, details: 'Content analysis' }
      ],
      key_facts: sentences.slice(0, 3).map((s: string) => ({ fact: s.trim(), importance: 3 })),
      concepts: [],
      action_items: [],
      questions: [`What are the main implications of this content?`]
    };
  }

  private async structureNotes(keyPoints: any): Promise<any> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const prompt = `
Create structured notes from these key points:

Main Topics: ${JSON.stringify(keyPoints.main_topics)}
Key Facts: ${JSON.stringify(keyPoints.key_facts)}
Concepts: ${JSON.stringify(keyPoints.concepts)}
Action Items: ${JSON.stringify(keyPoints.action_items)}
Questions: ${JSON.stringify(keyPoints.questions)}

Create a hierarchical outline structure:
- Use ## for main topics
- Use - for subtopics and facts
- Use > for important quotes or highlights
- Use [ ] for action items
- Use ? for questions

Generate clean, organized notes in markdown format.`;

    const structuredNotes = await llm.execute(prompt, { max_tokens: 1500 });
    
    return {
      structured_content: structuredNotes,
      hierarchy: this.extractHierarchy(structuredNotes),
      sections: keyPoints.main_topics.length,
      total_items: keyPoints.key_facts.length + keyPoints.concepts.length + keyPoints.action_items.length
    };
  }

  private async enhanceNotes(structuredNotes: any): Promise<any> {
    const llm = await pluginManager.getPlugin(this.config.models.primary);
    if (!llm) throw new Error('Primary LLM not available');

    const prompt = `
Enhance these notes with additional value:

${structuredNotes.structured_content}

Add:
1. A brief executive summary (2-3 sentences)
2. Key takeaways section
3. Related topics to explore
4. Memory aids or mnemonics if applicable
5. Cross-references between sections

Keep the original structure but add these enhancements clearly marked.`;

    const enhancedContent = await llm.execute(prompt, { max_tokens: 2000 });
    
    return {
      enhanced_content: enhancedContent,
      enhancements: ['summary', 'takeaways', 'related_topics', 'cross_references'],
      quality_score: this.assessContentQuality(enhancedContent)
    };
  }

  private async formatOutput(enhancedNotes: any, originalTask: string): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    
    const content = enhancedNotes?.enhanced_content || 'No content available';
    const qualityScore = enhancedNotes?.quality_score || 0;
    
    const finalNotes = `# Notes - ${timestamp}

## Source
${originalTask}

${content}

---
*Generated by Brevia AI Notes Agent*
*Quality Score: ${(qualityScore * 100).toFixed(0)}%*`;

    // Store the notes as a document
    await this.storeDocument({
      workflowId: this.workflowId,
      sessionId: this.sessionId,
      type: 'note',
      title: `Notes - ${timestamp}`,
      content: finalNotes,
      format: 'markdown',
      structure: {
        sections: enhancedNotes.enhancements,
        hierarchy_depth: 3
      },
      metadata: {
        source_task: originalTask,
        enhancements: enhancedNotes.enhancements,
        generated_at: new Date().toISOString()
      },
      quality_score: enhancedNotes.quality_score
    });

    return finalNotes;
  }

  async synthesizeResult(stepOutputs: any[]): Promise<AgentResult> {
    const finalNotes = stepOutputs && stepOutputs.length > 0 ? stepOutputs[stepOutputs.length - 1] : 'No content generated';
    
    return {
      success: true,
      content: finalNotes,
      metadata: {
        confidence: 0.90,
        processingTime: Date.now() - this.startTime.getTime(),
        tokensUsed: this.estimateTokens(finalNotes),
        modelsUsed: [this.config.models.primary]
      }
    };
  }

  private extractHierarchy(content: string): any {
    const lines = content.split('\n');
    const hierarchy = {
      h2: 0,
      h3: 0,
      bullets: 0,
      quotes: 0,
      actions: 0
    };

    for (const line of lines) {
      if (line.startsWith('## ')) hierarchy.h2++;
      else if (line.startsWith('### ')) hierarchy.h3++;
      else if (line.startsWith('- ')) hierarchy.bullets++;
      else if (line.startsWith('> ')) hierarchy.quotes++;
      else if (line.includes('[ ]')) hierarchy.actions++;
    }

    return hierarchy;
  }
}