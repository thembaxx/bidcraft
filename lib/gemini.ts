import { GoogleGenAI } from '@google/genai';

export function getGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { timeout: 45_000 },
  });
}
