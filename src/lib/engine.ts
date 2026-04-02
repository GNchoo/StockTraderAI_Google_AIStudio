import { KISBroker } from "./kis.ts";
import { calculateRSI, calculateMACD } from "./indicators.ts";
import { analyzeSentiment } from "./ai.ts";

/**
 * Main Trading Engine
 */

export class TradingEngine {
  private broker: KISBroker;
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private balance: number;
  private portfolio: Map<string, number> = new Map();
  private logs: any[] = [];
  private stocksToWatch = ["005930", "000660", "035420", "035720"]; // Samsung, SK Hynix, Naver, Kakao
  private mode: "real" | "virtual";

  constructor(initialCapital: number = 10000000, mode: string = "virtual") {
    // Robust mode parsing: 1, true, virtual -> virtual / 0, false, real -> real
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
    this.addLog(`Switched to ${this.mode} mode`, "info");
    
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
    this.addLog("Trading engine started", "info");

    await this.broker.authenticate();
    await this.broker.connectWebSocket();
    
    // Subscribe to all watch stocks once
    for (const ticker of this.stocksToWatch) {
      await this.broker.subscribe(ticker);
    }

    this.interval = setInterval(async () => {
      if (!this.isRunning) return;
      await this.runIteration();
    }, 60000); // Check every 60 seconds to respect API rate limits
  }

  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.broker.disconnectWebSocket();
    this.addLog("Trading engine stopped", "info");
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
      logs: this.logs.slice(-50), // Last 50 logs
      lastUpdate: new Date().toISOString(),
    };
  }

  private async runIteration() {
    for (const ticker of this.stocksToWatch) {
      try {
        // Delay between stocks to respect KIS rate limit (초당 거래건수 제한)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const currentPrice = await this.broker.getStockPrice(ticker);
        const historicalData = await this.broker.getHistoricalData(ticker, 50);

        // Technical Analysis
        const rsi = calculateRSI(historicalData, 14);
        const currentRSI = rsi[rsi.length - 1];

        const macdData = calculateMACD(historicalData);
        const currentMACD = macdData.macd[macdData.macd.length - 1];
        const currentSignal = macdData.signal[macdData.signal.length - 1];

        // AI Sentiment Analysis (Mock news for now)
        const sentiment = await analyzeSentiment(ticker, [
          `${ticker} reports record earnings`,
          `Market volatility increases for tech stocks`,
        ]);

        // Decision Logic
        let decision: "BUY" | "SELL" | "HOLD" = "HOLD";

        // Buy Signal: RSI < 30 (oversold) + MACD crossover + Positive AI sentiment
        if (currentRSI < 35 && currentMACD > currentSignal && sentiment.score > 0.2) {
          decision = "BUY";
        }
        // Sell Signal: RSI > 70 (overbought) + MACD crossunder + Negative AI sentiment
        else if (currentRSI > 65 && currentMACD < currentSignal && sentiment.score < -0.2) {
          decision = "SELL";
        }

        if (decision === "BUY" && this.balance > currentPrice) {
          const quantity = Math.floor((this.balance * 0.1) / currentPrice); // 10% of balance
          if (quantity > 0) {
            await this.broker.placeOrder(ticker, quantity, "BUY");
            this.balance -= quantity * currentPrice;
            this.portfolio.set(ticker, (this.portfolio.get(ticker) || 0) + quantity);
            this.addLog(`BUY ${quantity} shares of ${ticker} at ${currentPrice.toLocaleString()}`, "success");
          }
        } else if (decision === "SELL" && this.portfolio.has(ticker)) {
          const quantity = this.portfolio.get(ticker) || 0;
          if (quantity > 0) {
            await this.broker.placeOrder(ticker, quantity, "SELL");
            this.balance += quantity * currentPrice;
            this.portfolio.delete(ticker);
            this.addLog(`SELL ${quantity} shares of ${ticker} at ${currentPrice.toLocaleString()}`, "warning");
          }
        }
      } catch (error) {
        console.error(`Error processing ${ticker}:`, error);
      }
    }
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
