/**
 * server/ragEngine.ts
 * Simple client-side semantic retrieval and keyword matching engine using GoogleGenAI.
 */

import { KNOWLEDGE_BASE_CHUNKS, KnowledgeChunk } from '../src/data/knowledgeBase';

// Simple in-memory cache for document embeddings
const cachedEmbeddings: Record<string, number[]> = {};
let activeEmbeddingModel = 'gemini-embedding-001';

/**
 * Pre-embeds all static knowledge base documents on system startup.
 */
export async function syncKnowledgeBaseOnBoot(ai: any, mongoDb?: any): Promise<void> {
    if (!ai) {
        console.warn('[RAG Engine] AI client not provided. Semantic embeddings skipped.');
        return;
    }

    // Determine supported embedding model on boot
    try {
        await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: 'test',
        });
        activeEmbeddingModel = 'gemini-embedding-001';
        console.log('[RAG Engine] Dynamic verification: gemini-embedding-001 is supported.');
    } catch (e1: any) {
        console.warn('[RAG Engine] gemini-embedding-001 verification failed, trying legacy model. error:', e1.message || e1);
        try {
            await ai.models.embedContent({
                model: 'text-embedding-004',
                contents: 'test',
            });
            activeEmbeddingModel = 'text-embedding-004';
            console.log('[RAG Engine] Dynamic verification: text-embedding-004 is supported.');
        } catch (e2: any) {
            console.warn('[RAG Engine] All embedding models failed to load. Falling back to keyword search of content.');
            activeEmbeddingModel = '';
        }
    }

    if (!activeEmbeddingModel) return;

    try {
        let embeddedCount = 0;
        for (const chunk of KNOWLEDGE_BASE_CHUNKS) {
            if (!cachedEmbeddings[chunk.id]) {
                const response = await ai.models.embedContent({
                    model: activeEmbeddingModel,
                    contents: chunk.content,
                });

                const values = response?.embedding?.values;
                if (values && Array.isArray(values)) {
                    cachedEmbeddings[chunk.id] = values;
                    embeddedCount++;
                }
            }
        }
        console.log(`[RAG Engine] Successfully synchronized and embedded ${embeddedCount} chunks from static KB using model: "${activeEmbeddingModel}".`);
    } catch (err: any) {
        console.error('[RAG Engine] Error synchronization embeddings on boot:', err.message || err);
    }
}

/**
 * Searches the knowledge base by generating a query embedding and calculating
 * cosine similarity against search targets (falling back to term frequency if AI fails).
 */
export async function searchKnowledgeBase(
    ai: any,
    query: string,
    limit: number = 5
): Promise<Array<{ chunk: KnowledgeChunk; score: number }>> {
    if (!query) return [];

    const cleanQuery = query.toLowerCase().trim();

    // Try semantic search if AI is active and we have cached embeddings
    if (ai && activeEmbeddingModel && Object.keys(cachedEmbeddings).length > 0) {
        try {
            const response = await ai.models.embedContent({
                model: activeEmbeddingModel,
                contents: cleanQuery,
            });

            const queryVector = response?.embedding?.values;
            if (queryVector && Array.isArray(queryVector)) {
                const results = KNOWLEDGE_BASE_CHUNKS.map(chunk => {
                    const chunkVector = cachedEmbeddings[chunk.id];
                    if (!chunkVector) return { chunk, score: 0 };

                    // Calculate Cosine Similarity
                    let dotProduct = 0;
                    let normA = 0;
                    let normB = 0;

                    for (let i = 0; i < queryVector.length; i++) {
                        dotProduct += queryVector[i] * chunkVector[i];
                        normA += queryVector[i] * queryVector[i];
                        normB += chunkVector[i] * chunkVector[i];
                    }

                    const score = normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
                    return { chunk, score };
                });

                // Filter and sort results
                return results
                    .filter(r => r.score > 0.15) // Relevance threshold
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit);
            }
        } catch (err: any) {
            console.warn('[RAG Engine] Semantic retrieval failed, falling back to manual keyword lookup:', err.message || err);
        }
    }

    // Fallback Rule: Keyword / Term frequency matching
    const queryTerms = cleanQuery.split(/\s+/).filter(t => t.length > 2);
    const textResults = KNOWLEDGE_BASE_CHUNKS.map(chunk => {
        let score = 0;
        const searchTarget = (chunk.title + ' ' + chunk.category + ' ' + chunk.content).toLowerCase();

        for (const term of queryTerms) {
            if (searchTarget.includes(term)) {
                score += 1.0;
                // Boost score if keyword is in title
                if (chunk.title.toLowerCase().includes(term)) {
                    score += 0.5;
                }
            }
        }

        return { chunk, score };
    });

    return textResults
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
