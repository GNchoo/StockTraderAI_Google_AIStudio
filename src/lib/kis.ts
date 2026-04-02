import axios from "axios";

/**
 * Korea Investment & Securities (KIS) API Broker
 */

export class KISBroker {
  private appKey: string;
  private appSecret: string;
  private cano: string;
  private acntPrdtCd: string;
  private accessToken: string | null = null;
  private wsApprovalKey: string | null = null;
  private isMock: boolean = false;
  private isVirtual: boolean = true;
  private baseUrl: string;
  private wsUrl: string;
  private ws: any = null;
  private subscribedTickers: Set<string> = new Set();
  private onPriceUpdate: ((ticker: string, price: number) => void) | null = null;

  constructor(mode: string = "virtual") {
    // Robust mode parsing: 1, true, virtual -> virtual / 0, false, real -> real
    const normalizedMode = mode.toLowerCase().trim();
    this.isVirtual = normalizedMode === "virtual" || normalizedMode === "1" || normalizedMode === "true" || normalizedMode === "";
    
    console.log(`[KIS] KIS_MODE from env: ${process.env.KIS_MODE}`);
    console.log(`[KIS] Initializing Broker in ${this.isVirtual ? "VIRTUAL" : "REAL"} mode`);
    
    // Log available KIS env vars for debugging
    console.log("[KIS] Available KIS environment variables:", 
      Object.keys(process.env).filter(k => k.toUpperCase().startsWith("KIS"))
    );

    // Helper to find env var case-insensitively or partially
    const getEnv = (prefixes: string[]) => {
      for (const prefix of prefixes) {
        // Exact match first
        if (process.env[prefix]) return { name: prefix, value: process.env[prefix] };
        // Case-insensitive match
        const foundKey = Object.keys(process.env).find(k => k.toUpperCase() === prefix.toUpperCase());
        if (foundKey) return { name: foundKey, value: process.env[foundKey] };
        // Partial match (for truncated key names in UI)
        const partialKey = Object.keys(process.env).find(k => prefix.toUpperCase().startsWith(k.toUpperCase()) && k.length > 10);
        if (partialKey) return { name: partialKey, value: process.env[partialKey] };
      }
      return { name: "NOT_FOUND", value: "" };
    };

    const cleanValue = (val: string) => (val || "").trim().replace(/^["']|["']$/g, "");

    if (this.isVirtual) {
      console.log("[KIS] Searching for VIRTUAL environment variables...");
      const keyInfo = getEnv(["KIS_VIRTUAL_APP_KEY", "KIS_VIRTUAL_APP_K"]);
      const secretInfo = getEnv(["KIS_VIRTUAL_APP_SECRET", "KIS_VIRTUAL_APP_S"]);
      const canoInfo = getEnv(["KIS_VIRTUAL_CANO"]);
      
      console.log(`- AppKey found in: ${keyInfo.name}`);
      console.log(`- AppSecret found in: ${secretInfo.name}`);
      console.log(`- Cano found in: ${canoInfo.name}`);

      this.appKey = cleanValue(keyInfo.value);
      this.appSecret = cleanValue(secretInfo.value);
      this.cano = cleanValue(canoInfo.value);
      this.acntPrdtCd = cleanValue(process.env.KIS_VIRTUAL_ACNT_PRDT_CD || "01");
      this.baseUrl = "https://openapivts.koreainvestment.com:29443";
      this.wsUrl = "ws://ops.koreainvestment.com:31000";
    } else {
      console.log("[KIS] Searching for REAL environment variables...");
      const keyInfo = getEnv(["KIS_REAL_APP_KEY"]);
      const secretInfo = getEnv(["KIS_REAL_APP_SECRET", "KIS_REAL_APP_SEC"]);
      const canoInfo = getEnv(["KIS_REAL_CANO"]);

      console.log(`- AppKey found in: ${keyInfo.name}`);
      console.log(`- AppSecret found in: ${secretInfo.name}`);
      console.log(`- Cano found in: ${canoInfo.name}`);

      this.appKey = cleanValue(keyInfo.value);
      this.appSecret = cleanValue(secretInfo.value);
      this.cano = cleanValue(canoInfo.value);
      this.acntPrdtCd = cleanValue(process.env.KIS_REAL_ACNT_PRDT_CD || "01");
      this.baseUrl = "https://openapi.koreainvestment.com:9443";
      this.wsUrl = "ws://ops.koreainvestment.com:21000";
    }

    this.isMock = !this.appKey || !this.appSecret;
  }

  setPriceUpdateCallback(callback: (ticker: string, price: number) => void) {
    this.onPriceUpdate = callback;
  }

  async connectWebSocket() {
    if (this.isMock || !this.wsApprovalKey) return;
    if (this.ws) return; // Already connected

    // In a real environment, we'd use a WebSocket library
    // For this applet, we'll simulate the WebSocket behavior to avoid external library issues
    // but follow the KIS protocol logic
    console.log("Connecting to KIS WebSocket...");
    
    // Simulation of WebSocket behavior
    this.ws = {
      send: (data: string) => console.log("WS Send:", data),
      close: () => {
        this.ws = null;
        this.subscribedTickers.clear();
      }
    };
  }

  async subscribe(ticker: string) {
    if (this.isMock || !this.ws) return;
    if (this.subscribedTickers.has(ticker)) return; // Avoid redundant subscription

    const request = {
      header: {
        approval_key: this.wsApprovalKey,
        custtype: "P",
        tr_type: "1",
        "content-type": "utf-8"
      },
      body: {
        input: {
          tr_id: "H0STCNT0", // KOSPI Real-time price
          tr_key: ticker
        }
      }
    };

    this.ws.send(JSON.stringify(request));
    this.subscribedTickers.add(ticker);
    console.log(`Subscribed to ${ticker} via WebSocket`);
  }

  async unsubscribe(ticker: string) {
    if (this.isMock || !this.ws) return;
    if (!this.subscribedTickers.has(ticker)) return;

    const request = {
      header: {
        approval_key: this.wsApprovalKey,
        custtype: "P",
        tr_type: "2", // Unsubscribe
        "content-type": "utf-8"
      },
      body: {
        input: {
          tr_id: "H0STCNT0",
          tr_key: ticker
        }
      }
    };

    this.ws.send(JSON.stringify(request));
    this.subscribedTickers.delete(ticker);
    console.log(`Unsubscribed from ${ticker} via WebSocket`);
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      console.log("Disconnected KIS WebSocket");
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async authenticate() {
    if (this.isMock) {
      console.log("KIS Broker is in MOCK mode (missing keys)");
      return;
    }

    try {
      console.log(`[KIS] Attempting Auth for ${this.isVirtual ? "VIRTUAL" : "REAL"} mode`);
      console.log(`[KIS] Token URL: ${this.baseUrl}/oauth2/tokenP`);
      console.log(`[KIS] Account: ${this.cano}-${this.acntPrdtCd}`);
      if (this.appKey) {
        console.log(`[KIS] AppKey (masked): ${this.appKey.substring(0, 8)}...${this.appKey.substring(this.appKey.length - 4)}`);
        console.log(`[KIS] AppKey Length: ${this.appKey.length}`);
      } else {
        console.error("[KIS] AppKey is EMPTY. Check your environment variables.");
      }

      await this.delay(500);
      // 1. Get Access Token (OAuth2)
      // Official KIS Token request (Personal)
      const tokenRes = await axios.post(`${this.baseUrl}/oauth2/tokenP`, {
        grant_type: "client_credentials",
        appkey: this.appKey,
        appsecret: this.appSecret,
      }, {
        headers: { 
          "Content-Type": "application/json; charset=UTF-8"
        }
      });
      
      if (tokenRes.data.access_token) {
        this.accessToken = tokenRes.data.access_token;
      } else {
        throw new Error(`Token response missing access_token: ${JSON.stringify(tokenRes.data)}`);
      }

      // 2. Get WebSocket Approval Key
      await this.delay(500);
      const wsKeyRes = await axios.post(`${this.baseUrl}/oauth2/Approval`, {
        grant_type: "client_credentials",
        appkey: this.appKey,
        secretkey: this.appSecret,
      }, {
        headers: { 
          "Content-Type": "application/json; charset=UTF-8"
        }
      });
      
      if (wsKeyRes.data.approval_key) {
        this.wsApprovalKey = wsKeyRes.data.approval_key;
      } else {
        throw new Error(`WS Key response missing approval_key: ${JSON.stringify(wsKeyRes.data)}`);
      }
      
      console.log(`KIS [${this.isVirtual ? "Virtual" : "Real"}] Auth Successful`);
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error(`[KIS] Authentication FAILED [${status}]`);
      console.error(`[KIS] Error Detail:`, JSON.stringify(data || error.message));
      
      if (status === 403) {
        console.error("--------------------------------------------------");
        console.error("💡 KIS 403 (EGW00103) 해결 팁:");
        console.error(`1. 현재 모드: ${this.isVirtual ? "모의투자(VIRTUAL)" : "실전투자(REAL)"}`);
        console.error(`2. 사용 중인 AppKey: ${this.appKey ? "설정됨" : "비어있음"}`);
        console.error(`3. AppKey 앞 8자리: ${this.appKey.substring(0, 8)}...`);
        console.error(`4. AppSecret 앞 8자리: ${this.appSecret.substring(0, 8)}...`);
        console.error("5. 확인 사항: AI Studio 'Secrets' 설정에서 다음 값이 정확한지 확인하세요.");
        if (this.isVirtual) {
          console.log("   - KIS_VIRTUAL_APP_KEY (반드시 '모의투자'용 키여야 함)");
          console.log("   - KIS_VIRTUAL_APP_SECRET");
          console.log("   - KIS_VIRTUAL_CANO (계좌번호 8자리)");
        } else {
          console.log("   - KIS_REAL_APP_KEY (반드시 '실전투자'용 키여야 함)");
          console.log("   - KIS_REAL_APP_SECRET");
          console.log("   - KIS_REAL_CANO (계좌번호 8자리)");
        }
        console.error("6. 주의: 실전키를 모의모드에 넣거나 그 반대인 경우 403이 발생합니다.");
        console.error("7. KIS API 서비스 신청 여부: 한국투자증권 홈페이지에서 'Open API 서비스 신청'이 완료되었는지 확인하세요.");
        console.error("8. 계좌번호 확인: CANO는 계좌번호 앞 8자리입니다. 뒤 2자리는 ACNT_PRDT_CD(기본 01)입니다.");
        console.error("9. 키 복사 확인: 키 앞뒤에 따옴표(\")나 공백이 포함되지 않았는지 확인하세요.");
        console.error("--------------------------------------------------");
      }
      
      this.isMock = true;
    }
  }

  async getStockPrice(ticker: string): Promise<number> {
    if (this.isMock) {
      return 50000 + Math.random() * 10000;
    }

    try {
      await this.delay(1000);
      const trId = "FHKST01010100"; // 시세 조회 tr_id는 실전/모의 관계없이 동일
      const response = await axios.get(`${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`, {
        params: {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: ticker,
        },
        headers: {
          authorization: `Bearer ${this.accessToken}`,
          appkey: this.appKey,
          appsecret: this.appSecret,
          tr_id: trId,
          custtype: "P",
        },
      });
      return parseInt(response.data.output.stck_prpr);
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error);
      return 0;
    }
  }

  async getHistoricalData(ticker: string, days: number = 30): Promise<number[]> {
    if (this.isMock) {
      const data = [];
      let lastPrice = 50000;
      for (let i = 0; i < days; i++) {
        lastPrice += (Math.random() - 0.5) * 1000;
        data.push(lastPrice);
      }
      return data;
    }

    try {
      await this.delay(1000);
      const trId = "FHKST01010400"; // 시세 조회 tr_id는 실전/모의 관계없이 동일
      const formatDate = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}${m}${day}`;
      };
      const endDate = formatDate(new Date());
      const startDate = formatDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
      const response = await axios.get(`${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-daily-price`, {
        params: {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: ticker,
          FID_INPUT_DATE_1: startDate,
          FID_INPUT_DATE_2: endDate,
          FID_PERIOD_DIV_CODE: "D",
          FID_ORG_ADJ_PRC: "1",
        },
        headers: {
          authorization: `Bearer ${this.accessToken}`,
          appkey: this.appKey,
          appsecret: this.appSecret,
          tr_id: trId,
          custtype: "P",
        },
      });
      return response.data.output.map((item: any) => parseInt(item.stck_clpr)).reverse().slice(-days);
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      return Array(days).fill(0);
    }
  }

  private async getHashKey(body: object): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/uapi/hashkey`,
        body,
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            appkey: this.appKey,
            appsecret: this.appSecret,
          },
        }
      );
      return response.data.BODY ?? "";
    } catch (error) {
      console.error("[KIS] hashkey 획득 실패:", error);
      return "";
    }
  }

  async placeOrder(ticker: string, quantity: number, type: "BUY" | "SELL"): Promise<boolean> {
    if (this.isMock) {
      console.log(`[MOCK] ${type} order placed for ${ticker}: ${quantity} shares`);
      return true;
    }

    try {
      await this.delay(1000);
      const trId = this.isVirtual 
        ? (type === "BUY" ? "VTTC0802U" : "VTTC0801U") 
        : (type === "BUY" ? "TTTC0802U" : "TTTC0801U");

      const orderBody = {
        CANO: this.cano,
        ACNT_PRDT_CD: this.acntPrdtCd,
        PDNO: ticker,
        ORD_DVSN: "01", // Market Price
        ORD_QTY: quantity.toString(),
        ORD_UNPR: "0",
      };
      const hashkey = await this.getHashKey(orderBody);

      const response = await axios.post(
        `${this.baseUrl}/uapi/domestic-stock/v1/trading/order-cash`,
        orderBody,
        {
          headers: {
            authorization: `Bearer ${this.accessToken}`,
            appkey: this.appKey,
            appsecret: this.appSecret,
            tr_id: trId,
            "Content-Type": "application/json; charset=UTF-8",
            hashkey: hashkey,
            custtype: "P",
          },
        }
      );

      return response.data.rt_cd === "0";
    } catch (error) {
      console.error(`Error placing ${type} order for ${ticker}:`, error);
      return false;
    }
  }
}
