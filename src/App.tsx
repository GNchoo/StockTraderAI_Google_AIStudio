import React, { useState, useEffect } from "react";
import { 
  Play, 
  Square, 
  Activity, 
  Wallet, 
  Briefcase, 
  History, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Log {
  timestamp: string;
  mode: "real" | "virtual";
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface PortfolioItem {
  ticker: string;
  quantity: number;
}

interface TradingStatus {
  isRunning: boolean;
  mode: "real" | "virtual";
  balance: number;
  portfolio: PortfolioItem[];
  logs: Log[];
  lastUpdate: string;
}

export default function App() {
  const [status, setStatus] = useState<TradingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [performanceData, setPerformanceData] = useState<any[]>([]);

  const fetchStatus = async () => {
    try {
      const [statusRes, perfRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/performance")
      ]);
      
      if (!statusRes.ok || !perfRes.ok) {
        throw new Error(`Server error: ${statusRes.status} / ${perfRes.status}`);
      }

      const statusData = await statusRes.json();
      const perfData = await perfRes.json();
      setStatus(statusData);
      setPerformanceData(perfData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrading = async () => {
    try {
      const res = await fetch("/api/toggle", { method: "POST" });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to toggle trading", err);
    }
  };

  const switchMode = async (mode: "real" | "virtual") => {
    try {
      const res = await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to switch mode", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="w-12 h-12 mb-4 text-[#141414]" />
          <p className="text-sm uppercase tracking-widest">시스템 초기화 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-[#141414] pb-8">
        <div>
          <h1 className="text-4xl font-serif italic mb-2">StockTrader AI</h1>
          <p className="font-mono text-xs opacity-60 uppercase tracking-tighter">
            자율 주행 트레이딩 엔진 v1.0.4 // KIS API 통합 완료
          </p>
        </div>
        
        <div className="flex items-center gap-6 mt-6 md:mt-0">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] opacity-50 uppercase">트레이딩 모드</span>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => switchMode("virtual")}
                className={cn(
                  "px-2 py-1 font-mono text-[10px] border border-[#141414]",
                  status?.mode === "virtual" ? "bg-[#141414] text-[#E4E3E0]" : "opacity-40"
                )}
              >
                가상투자
              </button>
              <button 
                onClick={() => switchMode("real")}
                className={cn(
                  "px-2 py-1 font-mono text-[10px] border border-[#141414]",
                  status?.mode === "real" ? "bg-red-600 text-white border-red-600" : "opacity-40"
                )}
              >
                실전투자
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] opacity-50 uppercase">시스템 상태</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", status?.isRunning ? "bg-green-600" : "bg-red-600")} />
              <span className="font-mono text-sm uppercase font-bold">
                {status?.isRunning ? "운영 중" : "대기 중"}
              </span>
            </div>
          </div>
          
          <button
            onClick={toggleTrading}
            className={cn(
              "flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase font-bold transition-all border border-[#141414]",
              status?.isRunning 
                ? "bg-[#141414] text-[#E4E3E0] hover:bg-opacity-90" 
                : "bg-transparent text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
            )}
          >
            {status?.isRunning ? (
              <><Square className="w-4 h-4 fill-current" /> 엔진 중지</>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> 엔진 시작</>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Portfolio */}
        <div className="lg:col-span-4 space-y-8">
          {/* Balance Card */}
          <section className="border border-[#141414] p-6 bg-white/50">
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Wallet className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase tracking-widest">가용 자본</span>
            </div>
            <div className="text-4xl font-mono font-bold">
              ₩{status?.balance.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-green-600 font-mono text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>오늘 +2.4%</span>
            </div>
          </section>

          {/* Portfolio List */}
          <section className="border border-[#141414] overflow-hidden">
            <div className="bg-[#141414] text-[#E4E3E0] p-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase tracking-widest">현재 포트폴리오</span>
            </div>
            <div className="divide-y divide-[#141414]">
              {status?.portfolio.length === 0 ? (
                <div className="p-8 text-center opacity-40 italic text-sm">보유 종목 없음</div>
              ) : (
                status?.portfolio.map((item) => (
                  <div key={item.ticker} className="p-4 flex justify-between items-center hover:bg-white/40 transition-colors">
                    <div>
                      <div className="font-bold text-lg">{item.ticker}</div>
                      <div className="font-mono text-[10px] opacity-50">KOSPI 시장</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{item.quantity} 주</div>
                      <div className="text-xs text-green-600">+1.2%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Chart & Logs */}
        <div className="lg:col-span-8 space-y-8">
          {/* Performance Chart */}
          <section className="border border-[#141414] p-6 bg-white/50 h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 opacity-50">
                <TrendingUp className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-widest">수익률 히스토리</span>
              </div>
              <div className="flex gap-4 font-mono text-[10px]">
                <span className="text-green-600">● 자산</span>
                <span className="opacity-40">○ 벤치마크</span>
              </div>
            </div>
            <div className="h-full pb-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#141414" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontFamily: 'monospace'}} 
                    dy={10}
                  />
                  <YAxis 
                    hide 
                    domain={['dataMin - 1000', 'dataMax + 1000']} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: 0, border: '1px solid #141414', fontFamily: 'monospace', fontSize: '10px'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#141414" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Activity Logs */}
          <section className="border border-[#141414] flex flex-col h-[400px]">
            <div className="bg-[#141414] text-[#E4E3E0] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-widest">실행 로그</span>
              </div>
              <span className="font-mono text-[10px] opacity-50">실시간 피드</span>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] divide-y divide-[#141414]/10">
              {status?.logs.length === 0 ? (
                <div className="p-8 text-center opacity-40 italic">활동 대기 중...</div>
              ) : (
                status?.logs.slice().reverse().map((log, i) => (
                  <div key={i} className="p-3 flex gap-4 hover:bg-white/40 transition-colors">
                    <span className="opacity-30 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                    </span>
                    <div className="flex items-start gap-2 flex-1">
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-1.5 py-0.5 text-[8px] font-bold rounded",
                            log.mode === "real" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {log.mode === "real" ? "실전" : "가상"}
                          </span>
                          {log.type === 'success' && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                          {log.type === 'warning' && <TrendingDown className="w-3 h-3 text-orange-600" />}
                          {log.type === 'error' && <AlertCircle className="w-3 h-3 text-red-600" />}
                          {log.type === 'info' && <Info className="w-3 h-3 text-blue-600" />}
                        </div>
                        <span className={cn(
                          log.type === 'success' && "text-green-700 font-bold",
                          log.type === 'warning' && "text-orange-700",
                          log.type === 'error' && "text-red-700"
                        )}>
                          {log.message}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#141414] flex justify-between items-center font-mono text-[10px] opacity-40">
        <div>© 2026 STOCKTRADER AI // 퀀트 리서치 그룹</div>
        <div className="flex gap-6">
          <span>지연시간: 42MS</span>
          <span>가동률: 99.9%</span>
          <span>API: 연결됨</span>
        </div>
      </footer>
    </div>
  );
}

const mockChartData = [
  { time: "09:00", value: 10000000 },
  { time: "10:00", value: 10050000 },
  { time: "11:00", value: 10030000 },
  { time: "12:00", value: 10120000 },
  { time: "13:00", value: 10080000 },
  { time: "14:00", value: 10150000 },
  { time: "15:00", value: 10240000 },
  { time: "15:30", value: 10245000 },
];
