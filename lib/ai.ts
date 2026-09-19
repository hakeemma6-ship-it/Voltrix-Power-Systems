/**
 * lib/ai.ts — GoogleGenAI singleton for Next.js API routes.
 */

import { GoogleGenAI } from '@google/genai';

declare global {
    // eslint-disable-next-line no-var
    var __voltrix_ai: GoogleGenAI | null;
}

if (typeof global.__voltrix_ai === 'undefined') {
    global.__voltrix_ai = null;
    try {
        if (process.env.GEMINI_API_KEY) {
            global.__voltrix_ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            });
            console.log('[AI] GoogleGenAI initialized.');
        } else {
            console.warn('[AI] GEMINI_API_KEY not set. AI will run in fallback mode.');
        }
    } catch (e) {
        console.error('[AI] Failed to initialize GoogleGenAI:', e);
    }
}

export const ai: GoogleGenAI | null = global.__voltrix_ai;
