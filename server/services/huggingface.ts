// Hugging Face API integration for various AI models
export interface HuggingFaceConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ModelResponse {
  generated_text?: string;
  error?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
}

export class HuggingFaceService {
  private config: HuggingFaceConfig;

  constructor() {
    this.config = {
      apiKey: process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "",
      baseUrl: "https://api-inference.huggingface.co"
    };
  }

  async generateText(
    model: string, 
    prompt: string, 
    options: {
      max_new_tokens?: number;
      temperature?: number;
      top_p?: number;
      do_sample?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options.max_new_tokens || 512,
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            do_sample: options.do_sample !== false,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (Array.isArray(result) && result[0]?.generated_text) {
        return result[0].generated_text;
      }
      
      throw new Error("Invalid response format from Hugging Face API");
    } catch (error) {
      console.error("Hugging Face API error:", error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateEmbeddings(
    model: string,
    texts: string[]
  ): Promise<number[][]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: texts,
          options: {
            wait_for_model: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const embeddings = await response.json();
      return Array.isArray(embeddings[0]) ? embeddings : [embeddings];
    } catch (error) {
      console.error("Embedding generation error:", error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Specialized model methods
  async llama3_70b(prompt: string): Promise<string> {
    return this.generateText("meta-llama/Llama-2-70b-chat-hf", prompt, {
      max_new_tokens: 1024,
      temperature: 0.7
    });
  }

  async falcon3_10b(prompt: string): Promise<string> {
    return this.generateText("tiiuae/falcon-7b-instruct", prompt, {
      max_new_tokens: 512,
      temperature: 0.6
    });
  }

  async mistral7b(prompt: string): Promise<string> {
    return this.generateText("mistralai/Mistral-7B-Instruct-v0.1", prompt, {
      max_new_tokens: 512,
      temperature: 0.7
    });
  }

  async sentenceTransformers(texts: string[]): Promise<number[][]> {
    return this.generateEmbeddings("sentence-transformers/all-MiniLM-L6-v2", texts);
  }
}

export const huggingFace = new HuggingFaceService();
