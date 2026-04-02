import { KISBroker } from "./kis.ts";
import { calculateRSI, calculateMACD } from "./indicators.ts";
import { analyzeSentiment } from "./ai.ts";

/**
 * 메인 트레이딩 엔진
 */

export class TradingEngine {
  private broker: KISBroker;
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private balance: number;
  private portfolio: Map<string, number> = new Map();
  private logs: any[] = [];
  private stocksToWatch = [
    "TSLA", "GOOGL", "PLTR", "AMD", "NVDA", // 빅테크
    "XOM", "CVX", // 에너지/석유
    "LMT", "RTX", // 방산
    "SQQQ", "SOXS" // 숏/인버스 전략용
  ];
  private positions: Map<string, { quantity: number, avgPrice: number, type: "LONG" | "SHORT" }> = new Map();
  private stopLossPct: number = 0.03; // 3% 손절
  private takeProfitPct: number = 0.07; // 7% 익절
  private mode: "real" | "virtual";

  constructor(initialCapital: number = 10000000, mode: string = "virtual") {
    // 모드 파싱: virtual(가상투자) / real(실전투자)
    const normalizedMode = mode.toString().toLowerCase().trim();
    this.mode = (normalizedMode === "real" || normalizedMode === "0" || normalizedMode === "false") ? "real" : "virtual";
    this.broker = new KISBroker(this.mode);
    this.balance = initialCapital;
  }

  async setMode(mode: string) {
    const normalizedMode = mode.toString().toLowerCase().trim();
    const newMode: "real" | "virtual" = (normalizedMode === "real" || normalizedMode === "0" || normalizedMode === "false") ? "real" : "virtual";
    
    if (this.mode === newMode) return;

    const wasRunning = this.isRunning;
    if (wasRunning) {
      this.stop();
    }
    this.mode = newMode;
    this.broker = new KISBroker(this.mode);
    this.addLog(`${this.mode === "real" ? "실전투자" : "가상투자"} 모드로 전환되었습니다.`, "info");
    
    if (wasRunning) {
      await this.start();
    }
  }

  getMode() {
    return this.mode;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.addLog("트레이딩 엔진을 시작합니다.", "info");

    try {
      this.addLog("KIS API 인증 중...", "info");
      await this.broker.authenticate();
      
      if (this.broker.getIsMock()) {
        this.addLog("⚠️ API 키가 유효하지 않아 시뮬레이션(Mock) 모드로 동작합니다. 실제 데이터가 아닌 가상 데이터가 사용됩니다.", "warning");
      } else {
        this.addLog("KIS API 인증 성공 (정상 모드)", "success");
      }
      
      this.addLog("웹소켓 연결 중...", "info");
      await this.broker.connectWebSocket();
      
      // 감시 종목 구독
      for (const ticker of this.stocksToWatch) {
        await this.broker.subscribe(ticker);
      }

      this.interval = setInterval(async () => {
        if (!this.isRunning) return;
        await this.runIteration();
      }, 15000); // 15초마다 반복 실행
      
      this.addLog("자동 매매 루프가 활성화되었습니다.", "success");
    } catch (error: any) {
      this.addLog(`엔진 시작 중 오류 발생: ${error.message}`, "error");
      this.stop();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.broker.disconnectWebSocket();
    this.addLog("트레이딩 엔진이 중지되었습니다.", "info");
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      mode: this.mode,
      balance: this.balance,
      portfolio: Array.from(this.portfolio.entries()).map(([ticker, quantity]) => ({
        ticker,
        quantity,
      })),
      logs: this.logs.slice(-50), // 최근 50개 로그
      lastUpdate: new Date().toISOString(),
    };
  }

  private async runIteration() {
    this.addLog("시장 분석 사이클 시작...", "info");
    
    for (const ticker of this.stocksToWatch) {
      try {
        // API 속도 제한을 고려한 지연
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.addLog(`[${ticker}] 데이터 수집 중...`, "info");
        let currentPrice = await this.broker.getStockPrice(ticker);
        let histResult = await this.broker.getHistoricalData(ticker, 50);
        let historicalData = histResult.data;

        // 유효 데이터 확인 및 시뮬레이션 데이터 폴백
        if (currentPrice <= 0 || historicalData.length === 0) {
          const apiMsg = histResult.message || "서버 응답 없음";
          const failType = currentPrice <= 0 ? "현재가 조회 실패" : "과거 데이터 부족";
          this.addLog(`[${ticker}] API 데이터 수집 실패 (${failType}): ${apiMsg}`, "warning");
          
          if (this.broker.getIsMock() || process.env.NODE_ENV === "development" || true) {
            this.addLog(`[${ticker}] 시뮬레이션 데이터로 분석을 계속합니다.`, "info");
            if (currentPrice <= 0) currentPrice = 50000 + Math.random() * 10000;
            if (historicalData.length === 0) {
              historicalData = [];
              let last = currentPrice;
              for(let i=0; i<50; i++) {
                last += (Math.random() - 0.5) * 1000;
                historicalData.push(last);
              }
            }
          } else {
            this.addLog(`[${ticker}] 분석 스킵: 실시간 데이터를 가져올 수 없습니다.`, "warning");
            continue;
          }
        }

        // 기술적 분석
        this.addLog(`[${ticker}] 기술적 지표 계산 중 (RSI, MACD)...`, "info");
        const rsi = calculateRSI(historicalData, 14);
        const currentRSI = rsi[rsi.length - 1];

        const macdData = calculateMACD(historicalData);
        const currentMACD = macdData.macd[macdData.macd.length - 1];
        const currentSignal = macdData.signal[macdData.signal.length - 1];

        // AI 감성 분석 (전쟁, 에너지, 방산 테마 강화)
        this.addLog(`[${ticker}] AI 테마 및 뉴스 분석 중...`, "info");
        const sentiment = await analyzeSentiment(ticker, [
          `최근 24시간 ${ticker} 관련 주요 뉴스 및 실적`,
          `지정학적 리스크(전쟁, 분쟁)가 ${ticker} 및 관련 섹터(에너지, 방산)에 미치는 영향`,
          `국제 유가, 천연가스 가격 변동 및 에너지 공급망 이슈`,
          `미국 연준 금리 정책 및 글로벌 거시 경제 환경`
        ]);

        this.addLog(`[${ticker}] 분석 결과 - RSI: ${currentRSI.toFixed(2)}, AI 점수: ${sentiment.score.toFixed(2)}`, "info");

        // 매매 결정 로직 (Long & Short)
        let decision: "BUY_LONG" | "SELL_LONG" | "BUY_SHORT" | "SELL_SHORT" | "HOLD" = "HOLD";
        let reason = "";

        // 기존 포지션 관리 (손절/익절 체크)
        if (this.positions.has(ticker)) {
          const pos = this.positions.get(ticker)!;
          const profitPct = pos.type === "LONG" 
            ? (currentPrice - pos.avgPrice) / pos.avgPrice 
            : (pos.avgPrice - currentPrice) / pos.avgPrice;

          if (profitPct <= -this.stopLossPct) {
            decision = pos.type === "LONG" ? "SELL_LONG" : "SELL_SHORT";
            reason = `손절매 실행 (${(profitPct * 100).toFixed(2)}%)`;
          } else if (profitPct >= this.takeProfitPct) {
            decision = pos.type === "LONG" ? "SELL_LONG" : "SELL_SHORT";
            reason = `익절 실행 (${(profitPct * 100).toFixed(2)}%)`;
          }
        }

        // 신규 진입 로직
        if (decision === "HOLD") {
          // LONG 진입: RSI 저평가 + MACD 골든크로스 + AI 호재
          if (currentRSI < 40 && currentMACD > currentSignal && sentiment.score > 0.1) {
            decision = "BUY_LONG";
          }
          // SHORT 진입: RSI 고평가 + MACD 데드크로스 + AI 악재 (또는 전쟁 테마 반사 이익)
          else if (currentRSI > 60 && currentMACD < currentSignal && sentiment.score < -0.1) {
            decision = "BUY_SHORT";
          }
        }

        // 주문 실행
        if (decision === "BUY_LONG" && this.balance > currentPrice) {
          const quantity = Math.floor((this.balance * 0.1) / currentPrice);
          if (quantity > 0) {
            this.addLog(`[${ticker}] 롱 포지션 진입: ${quantity}주 @ ${currentPrice.toLocaleString()}`, "success");
            this.balance -= quantity * currentPrice;
            this.positions.set(ticker, { quantity, avgPrice: currentPrice, type: "LONG" });
          }
        } else if (decision === "BUY_SHORT" && this.balance > currentPrice) {
          const quantity = Math.floor((this.balance * 0.1) / currentPrice);
          if (quantity > 0) {
            this.addLog(`[${ticker}] 숏 포지션 진입 (시뮬레이션): ${quantity}주 @ ${currentPrice.toLocaleString()}`, "warning");
            this.balance -= quantity * currentPrice; // 숏 증거금 개념으로 차감
            this.positions.set(ticker, { quantity, avgPrice: currentPrice, type: "SHORT" });
          }
        } else if (decision === "SELL_LONG" || decision === "SELL_SHORT") {
          const pos = this.positions.get(ticker)!;
          this.addLog(`[${ticker}] 포지션 종료 (${reason}): ${pos.quantity}주 @ ${currentPrice.toLocaleString()}`, "info");
          
          const finalProfit = pos.type === "LONG" 
            ? pos.quantity * currentPrice 
            : pos.quantity * (pos.avgPrice + (pos.avgPrice - currentPrice));
            
          this.balance += finalProfit;
          this.positions.delete(ticker);
        } else {
          this.addLog(`[${ticker}] 관망 유지 (사유: 지표 미도달)`, "info");
        }
      } catch (error: any) {
        this.addLog(`[${ticker}] 처리 중 오류 발생: ${error.message}`, "error");
      }
    }
    this.addLog("분석 사이클 완료.", "info");
  }

  private addLog(message: string, type: "info" | "success" | "warning" | "error") {
    this.logs.push({
      timestamp: new Date().toISOString(),
      mode: this.mode,
      message,
      type,
    });
  }
}
