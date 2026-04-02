import axios from "axios";

/**
 * 한국투자증권 (KIS) API 브로커
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
    // 모드 파싱: virtual(가상투자) / real(실전투자)
    const normalizedMode = mode.toLowerCase().trim();
    this.isVirtual = normalizedMode === "virtual" || normalizedMode === "1" || normalizedMode === "true" || normalizedMode === "";
    
    console.log(`[KIS] 환경 변수 KIS_MODE: ${process.env.KIS_MODE}`);
    console.log(`[KIS] 브로커 초기화 모드: ${this.isVirtual ? "가상투자(VIRTUAL)" : "실전투자(REAL)"}`);
    
    // 디버깅을 위한 KIS 관련 환경 변수 출력
    console.log("[KIS] 감지된 KIS 환경 변수 목록:", 
      Object.keys(process.env).filter(k => k.toUpperCase().startsWith("KIS"))
    );

    // 환경 변수를 대소문자 구분 없이 또는 부분 일치로 찾는 헬퍼 함수
    const getEnv = (prefixes: string[]) => {
      for (const prefix of prefixes) {
        // 정확한 일치 확인
        if (process.env[prefix]) return { name: prefix, value: process.env[prefix] };
        // 대소문자 구분 없이 확인
        const foundKey = Object.keys(process.env).find(k => k.toUpperCase() === prefix.toUpperCase());
        if (foundKey) return { name: foundKey, value: process.env[foundKey] };
        // 부분 일치 확인 (UI에서 잘린 경우 대비)
        const partialKey = Object.keys(process.env).find(k => prefix.toUpperCase().startsWith(k.toUpperCase()) && k.length > 10);
        if (partialKey) return { name: partialKey, value: process.env[partialKey] };
      }
      return { name: "NOT_FOUND", value: "" };
    };

    const cleanValue = (val: string) => (val || "").trim().replace(/^["']|["']$/g, "");

    if (this.isVirtual) {
      console.log("[KIS] 가상투자 환경 변수 검색 중...");
      const keyInfo = getEnv(["KIS_VIRTUAL_APP_KEY", "KIS_VIRTUAL_APP_K"]);
      const secretInfo = getEnv(["KIS_VIRTUAL_APP_SECRET", "KIS_VIRTUAL_APP_S"]);
      const canoInfo = getEnv(["KIS_VIRTUAL_CANO"]);
      
      console.log(`- AppKey 발견 위치: ${keyInfo.name}`);
      console.log(`- AppSecret 발견 위치: ${secretInfo.name}`);
      console.log(`- Cano 발견 위치: ${canoInfo.name}`);

      this.appKey = cleanValue(keyInfo.value);
      this.appSecret = cleanValue(secretInfo.value);
      this.cano = cleanValue(canoInfo.value);
      this.acntPrdtCd = cleanValue(process.env.KIS_VIRTUAL_ACNT_PRDT_CD || "01");
      this.baseUrl = "https://openapivts.koreainvestment.com:29443";
      this.wsUrl = "ws://ops.koreainvestment.com:31000";
    } else {
      console.log("[KIS] 실전투자 환경 변수 검색 중...");
      const keyInfo = getEnv(["KIS_REAL_APP_KEY"]);
      const secretInfo = getEnv(["KIS_REAL_APP_SECRET", "KIS_REAL_APP_SEC"]);
      const canoInfo = getEnv(["KIS_REAL_CANO"]);

      console.log(`- AppKey 발견 위치: ${keyInfo.name}`);
      console.log(`- AppSecret 발견 위치: ${secretInfo.name}`);
      console.log(`- Cano 발견 위치: ${canoInfo.name}`);

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
    if (this.ws) return; // 이미 연결됨

    // 실제 환경에서는 WebSocket 라이브러리를 사용하지만, 
    // 여기서는 KIS 프로토콜 로직을 따르는 시뮬레이션을 사용합니다.
    console.log("KIS 웹소켓 연결 시도 중...");
    
    this.ws = {
      send: (data: string) => console.log("WS 전송 데이터:", data),
      close: () => {
        this.ws = null;
        this.subscribedTickers.clear();
      }
    };
  }

  async subscribe(ticker: string) {
    if (this.isMock || !this.ws) return;
    if (this.subscribedTickers.has(ticker)) return; 

    const request = {
      header: {
        approval_key: this.wsApprovalKey,
        custtype: "P",
        tr_type: "1",
        "content-type": "utf-8"
      },
      body: {
        input: {
          tr_id: "H0STCNT0", // KOSPI 실시간 체결가
          tr_key: ticker
        }
      }
    };

    this.ws.send(JSON.stringify(request));
    this.subscribedTickers.add(ticker);
    console.log(`웹소켓 구독 완료: ${ticker}`);
  }

  async unsubscribe(ticker: string) {
    if (this.isMock || !this.ws) return;
    if (!this.subscribedTickers.has(ticker)) return;

    const request = {
      header: {
        approval_key: this.wsApprovalKey,
        custtype: "P",
        tr_type: "2", // 구독 해제
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
    console.log(`웹소켓 구독 해제: ${ticker}`);
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      console.log("KIS 웹소켓 연결 종료");
    }
  }

  getIsMock(): boolean {
    return this.isMock;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async authenticate() {
    if (this.isMock) {
      console.log("KIS 브로커가 MOCK 모드로 동작 중입니다 (API 키 누락)");
      return;
    }

    try {
      console.log(`[KIS] ${this.isVirtual ? "가상투자" : "실전투자"} 모드 인증 시도 중...`);
      console.log(`[KIS] 토큰 URL: ${this.baseUrl}/oauth2/tokenP`);
      console.log(`[KIS] 계좌 정보: ${this.cano}-${this.acntPrdtCd}`);
      if (this.appKey) {
        console.log(`[KIS] AppKey (마스킹): ${this.appKey.substring(0, 8)}...${this.appKey.substring(this.appKey.length - 4)}`);
      } else {
        console.error("[KIS] AppKey가 비어 있습니다. 환경 변수를 확인하세요.");
      }

      await this.delay(500);
      // 1. 접근 토큰 획득 (OAuth2)
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
        throw new Error(`토큰 응답에 access_token이 없습니다: ${JSON.stringify(tokenRes.data)}`);
      }

      // 2. 웹소켓 접속키 획득
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
        throw new Error(`웹소켓 접속키 응답에 approval_key가 없습니다: ${JSON.stringify(wsKeyRes.data)}`);
      }
      
      console.log(`KIS [${this.isVirtual ? "가상투자" : "실전투자"}] 인증 성공`);
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error(`[KIS] 인증 실패 [상태 코드: ${status}]`);
      console.error(`[KIS] 오류 상세:`, JSON.stringify(data || error.message));
      
      if (status === 403) {
        console.error("--------------------------------------------------");
        console.error("💡 KIS 403 (EGW00103) 해결 팁:");
        console.error(`1. 현재 모드: ${this.isVirtual ? "모의투자(VIRTUAL)" : "실전투자(REAL)"}`);
        console.error(`2. 사용 중인 AppKey: ${this.appKey ? "설정됨" : "비어있음"}`);
        console.error("3. 확인 사항: AI Studio 'Secrets' 설정에서 다음 값이 정확한지 확인하세요.");
        if (this.isVirtual) {
          console.log("   - KIS_VIRTUAL_APP_KEY (반드시 '모의투자'용 키여야 함)");
          console.log("   - KIS_VIRTUAL_APP_SECRET");
          console.log("   - KIS_VIRTUAL_CANO (계좌번호 앞 8자리)");
        } else {
          console.log("   - KIS_REAL_APP_KEY (반드시 '실전투자'용 키여야 함)");
          console.log("   - KIS_REAL_APP_SECRET");
          console.log("   - KIS_REAL_CANO (계좌번호 앞 8자리)");
        }
        console.error("4. 주의: 실전키를 모의모드에 넣거나 그 반대인 경우 403이 발생합니다.");
        console.error("5. KIS API 서비스 신청 여부: 한국투자증권 홈페이지에서 'Open API 서비스 신청'이 완료되었는지 확인하세요.");
        console.error("--------------------------------------------------");
      }
      
      this.isMock = true;
    }
  }

  async getStockPrice(ticker: string): Promise<number> {
    if (this.isMock) {
      return 50000 + Math.random() * 10000;
    }

    const isUS = /^[A-Z]/.test(ticker);

    try {
      await this.delay(400);
      let url = "";
      let params = {};
      let trId = "";

      if (isUS) {
        // 미국 주식 현재가 (해외주식)
        url = `${this.baseUrl}/uapi/overseas-stock/v1/quotations/price`;
        // 가상투자용 현재가 TR ID: VHHDFS76200200 (지연시세 포함 안정적)
        trId = this.isVirtual ? "VHHDFS76200200" : "HHDFS00000300";
        
        // 종목별 거래소 구분 (공식 문서 기준: NASD, NYSE, AMEX)
        let excd = "NASD"; 
        const nysStocks = ["XOM", "CVX", "LMT", "RTX", "PLTR"];
        const amsStocks = []; 
        
        if (nysStocks.includes(ticker)) excd = "NYSE";
        else if (amsStocks.includes(ticker)) excd = "AMEX";

        params = {
          AUTH: "",
          EXCD: excd,
          SYMB: ticker,
        };
      } else {
        // 국내 주식 현재가
        url = `${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`;
        trId = this.isVirtual ? "VHKST01010100" : "FHKST01010100";
        params = {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: ticker,
        };
      }

      const response = await axios.get(url, {
        params,
        headers: {
          authorization: `Bearer ${this.accessToken}`,
          appkey: this.appKey,
          appsecret: this.appSecret,
          tr_id: trId,
        },
      });

      if (isUS) {
        if (response.data && response.data.output && response.data.output.last) {
          return parseFloat(response.data.output.last);
        }
      } else {
        if (response.data && response.data.output && response.data.output.stck_prpr) {
          return parseInt(response.data.output.stck_prpr);
        }
      }

      const errorMsg = response.data?.msg1 || response.data?.rt_cd || "응답 데이터 없음";
      console.warn(`[KIS] ${ticker} 가격 데이터 수집 실패:`, errorMsg);
      return 0;
    } catch (error: any) {
      console.error(`[KIS] ${ticker} 가격 조회 중 네트워크 오류:`, error.message);
      return 0;
    }
  }

  async getHistoricalData(ticker: string, days: number = 30): Promise<{ data: number[], message?: string }> {
    if (this.isMock) {
      const data = [];
      let lastPrice = 50000;
      for (let i = 0; i < days; i++) {
        lastPrice += (Math.random() - 0.5) * 1000;
        data.push(lastPrice);
      }
      return { data };
    }

    const isUS = /^[A-Z]/.test(ticker);

    try {
      await this.delay(400);
      let url = "";
      let params = {};
      let trId = "";

      if (isUS) {
        // 미국 주식 일봉 (해외주식)
        url = `${this.baseUrl}/uapi/overseas-stock/v1/quotations/dailyprice`;
        trId = this.isVirtual ? "VHHDFS76240300" : "HHDFS76240300";
        
        let excd = "NASD";
        if (["XOM", "CVX", "LMT", "RTX", "PLTR"].includes(ticker)) excd = "NYSE";

        params = {
          AUTH: "",
          EXCD: excd,
          SYMB: ticker,
          GUBN: "0", 
          BYMD: "",
          MODP: "1",
        };
      } else {
        // 국내 주식 일봉
        url = `${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-daily-price`;
        trId = "FHKST01010400";
        params = {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: ticker,
          FID_PERIOD_DIV_CODE: "D",
          FID_ORG_ADJ_PRC: "1",
        };
      }

      const response = await axios.get(url, {
        params,
        headers: {
          authorization: `Bearer ${this.accessToken}`,
          appkey: this.appKey,
          appsecret: this.appSecret,
          tr_id: trId,
        },
      });

      if (response.data && Array.isArray(response.data.output)) {
        let prices: number[] = [];
        if (isUS) {
          prices = response.data.output
            .filter((item: any) => item && item.clos)
            .map((item: any) => parseFloat(item.clos))
            .reverse();
        } else {
          prices = response.data.output
            .filter((item: any) => item && item.stck_clpr)
            .map((item: any) => parseInt(item.stck_clpr))
            .reverse();
        }
        
        if (prices.length === 0) {
          return { data: [], message: response.data.msg1 || "데이터가 비어있습니다." };
        }
        return { data: prices.slice(-days) };
      } else {
        let msg = response.data?.msg1 || response.data?.rt_cd || "응답 데이터 형식 오류";
        return { data: [], message: msg };
      }
    } catch (error: any) {
      return { data: [], message: error.message || "네트워크 오류" };
    }
  }

  async placeOrder(ticker: string, quantity: number, type: "BUY" | "SELL"): Promise<boolean> {
    if (this.isMock) {
      console.log(`[MOCK] ${ticker} ${type === "BUY" ? "매수" : "매도"} 주문 시뮬레이션: ${quantity}주`);
      return true;
    }

    try {
      await this.delay(400);
      const trId = this.isVirtual 
        ? (type === "BUY" ? "VTTC0802U" : "VTTC0801U") 
        : (type === "BUY" ? "TTTC0802U" : "TTTC0801U");

      const response = await axios.post(`${this.baseUrl}/uapi/domestic-stock/v1/trading/order-cash`, {
        CANO: this.cano,
        ACNT_PRDT_CD: this.acntPrdtCd,
        PDNO: ticker,
        ORD_DVSN: "01", // 시장가
        ORD_QTY: quantity.toString(),
        ORD_UNPR: "0",
      }, {
        headers: {
          authorization: `Bearer ${this.accessToken}`,
          appkey: this.appKey,
          appsecret: this.appSecret,
          tr_id: trId,
        },
      });

      return response.data.rt_cd === "0";
    } catch (error) {
      console.error(`[KIS] ${ticker} ${type} 주문 중 오류:`, error);
      return false;
    }
  }
}
