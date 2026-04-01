/**
 * Technical Indicators for Stock Trading
 */

export function calculateSMA(data: number[], period: number): number[] {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

export function calculateEMA(data: number[], period: number): number[] {
  const ema = [];
  const k = 2 / (period + 1);
  let prevEma = data[0];
  ema.push(prevEma);

  for (let i = 1; i < data.length; i++) {
    const currentEma = data[i] * k + prevEma * (1 - k);
    ema.push(currentEma);
    prevEma = currentEma;
  }
  return ema;
}

export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi = [];
  const gains = [];
  const losses = [];

  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < period; i++) rsi.push(NaN);

  for (let i = period; i < data.length; i++) {
    const rs = avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));

    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
  }

  return rsi;
}

export function calculateMACD(data: number[], fast: number = 12, slow: number = 26, signal: number = 9) {
  const emaFast = calculateEMA(data, fast);
  const emaSlow = calculateEMA(data, slow);
  const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signal);

  // Pad signal line with NaNs
  const paddedSignalLine = Array(macdLine.length - signalLine.length).fill(NaN).concat(signalLine);

  return {
    macd: macdLine,
    signal: paddedSignalLine,
    histogram: macdLine.map((m, i) => m - paddedSignalLine[i]),
  };
}
