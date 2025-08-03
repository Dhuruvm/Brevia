// Simple in-memory vector database for development
// In production, this would be replaced with Chroma, Pinecone, or Weaviate

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
}

export class SimpleVectorDB {
  private documents: Map<string, VectorDocument> = new Map();

  async addDocument(doc: VectorDocument): Promise<void> {
    this.documents.set(doc.id, doc);
  }

  async addDocuments(docs: VectorDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.addDocument(doc);
    }
  }

  async search(
    queryEmbedding: number[], 
    limit: number = 10,
    minSimilarity: number = 0.7
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      
      if (similarity >= minSimilarity) {
        results.push({ document: doc, similarity });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async delete(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  getDocumentCount(): number {
    return this.documents.size;
  }
}

export const vectorDB = new SimpleVectorDB();
