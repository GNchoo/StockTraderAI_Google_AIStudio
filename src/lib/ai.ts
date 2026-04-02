import { GoogleGenAI } from "@google/genai";

/**
 * Google Gemini AI를 이용한 시장 감성 분석
 */

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    let apiKey = process.env.GEMINI_API_KEY || "";
    
    // .env.example의 플레이스홀더 값 확인
    if (apiKey === "MY_GEMINI_API_KEY" || !apiKey) {
      console.warn("[AI] GEMINI_API_KEY가 누락되었거나 유효하지 않습니다. AI 기능이 제한됩니다.");
      apiKey = ""; // API 오류 방지를 위해 비움
    } else {
      console.log(`[AI] Gemini API 키 로드 완료 (마스킹): ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function analyzeSentiment(stockName: string, news: string[]): Promise<{
  score: number; // -1 ~ 1
  summary: string;
  recommendation: "BUY" | "SELL" | "HOLD";
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return { score: 0, summary: "Gemini API 키가 설정되지 않았습니다.", recommendation: "HOLD" };
  }

  const ai = getAI();
  const prompt = `다음 뉴스 헤드라인과 시장 상황을 바탕으로 "${stockName}" 주식에 대한 시장 심리를 아주 정밀하게 분석해줘:
${news.join("\n")}

분석 시 다음 사항을 고려해줘:
- 해당 종목의 실적 발표, 시장 전망, 애널리스트 리포트의 뉘앙스.
- 글로벌 거시 경제 상황(환율, 금리) 및 반도체/기술주 섹터의 전반적인 투자 심리.
- 뉴스 헤드라인의 강도(매우 긍정, 긍정, 중립, 부정, 매우 부정).

다음 JSON 형식으로 응답해줘:
1. "score": -1.0(매우 부정/하락장)에서 1.0(매우 긍정/상승장) 사이의 소수점 숫자 (예: 0.45, -0.12). 0.0은 엄격하게 중립일 때만 사용해줘.
2. "summary": 심리 분석 요약 (최대 2문장, 구체적인 근거 포함).
3. "recommendation": "BUY", "SELL", "HOLD" 중 하나.

응답 형식: {"score": number, "summary": "string", "recommendation": "BUY" | "SELL" | "HOLD"}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response.text) {
      throw new Error("AI로부터 빈 응답을 받았습니다.");
    }

    const result = JSON.parse(response.text);
    return {
      score: result.score ?? 0,
      summary: result.summary || "요약 정보 없음",
      recommendation: result.recommendation || "HOLD",
    };
  } catch (error: any) {
    console.error("[AI] 분석 중 오류 발생:", error.message || error);
    return { score: 0, summary: "심리 분석 중 오류가 발생했습니다.", recommendation: "HOLD" };
  }
}
