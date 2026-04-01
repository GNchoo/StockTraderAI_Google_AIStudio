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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
  } catch (error) {
    console.error("AI Analysis error:", error);
    return { score: 0, summary: "Error analyzing sentiment", recommendation: "HOLD" };
  }
}
