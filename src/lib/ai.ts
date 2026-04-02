import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      console.warn("[AI] GEMINI_API_KEY is missing. AI features will be limited.");
    } else {
      console.log(`[AI] Gemini API Key found (masked): ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function analyzeSentiment(stockName: string, news: string[]): Promise<{
  score: number; // -1 to 1
  summary: string;
  recommendation: "BUY" | "SELL" | "HOLD";
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { score: 0, summary: "Gemini API key not set", recommendation: "HOLD" };
  }

  const ai = getAI();
  const prompt = `Analyze the sentiment for the stock "${stockName}" based on the following news headlines:
${news.join("\n")}

Provide a JSON response with:
1. "score": a number from -1 (very negative) to 1 (very positive).
2. "summary": a brief summary of the sentiment (max 2 sentences).
3. "recommendation": one of "BUY", "SELL", or "HOLD".

Response format: {"score": number, "summary": "string", "recommendation": "BUY" | "SELL" | "HOLD"}`;

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response.text || "{}");
      return {
        score: result.score || 0,
        summary: result.summary || "No summary available",
        recommendation: result.recommendation || "HOLD",
      };
    } catch (error: any) {
      const status = error?.status || error?.code;
      if ((status === 429 || status === 503) && attempt < maxRetries - 1) {
        const waitSec = Math.pow(2, attempt + 1) * 15; // 30s, 60s
        console.warn(`[AI] Rate limited (${status}), retrying in ${waitSec}s... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
        continue;
      }
      console.error("AI Analysis error:", error);
      return { score: 0, summary: "Error analyzing sentiment", recommendation: "HOLD" };
    }
  }
  return { score: 0, summary: "Max retries exceeded", recommendation: "HOLD" };
}
