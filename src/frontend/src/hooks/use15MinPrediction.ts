import { useCallback, useEffect, useRef, useState } from "react";

const PREDICTION_INTERVAL = 900; // 15 minutes in seconds
const BINANCE_KLINE_URL = "https://api.binance.com/api/v3/klines";

/** Returns seconds remaining until the next 15-minute wall-clock boundary (:00, :15, :30, :45) */
function secondsToNext15MinBoundary(): number {
  const nowMs = Date.now();
  const intervalMs = PREDICTION_INTERVAL * 1000;
  const msUntilNext = intervalMs - (nowMs % intervalMs);
  return Math.max(1, Math.round(msUntilNext / 1000));
}

export interface CoinPrediction {
  coinId: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  predictedMove: number;
  predictedPrice: number;
  currentPrice: number;
  rsiScore: number;
  emaScore: number;
  macdScore: number;
  bbScore: number;
  buyPrice: number;
  sellPrice: number;
  targetPrice: number;
  stopLossPrice: number;
}

export interface PredictionState {
  predictions: CoinPrediction[];
  nextRefreshIn: number;
  lastUpdated: string;
}

const BINANCE_SYMBOLS: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  BNB: "BNBUSDT",
  XRP: "XRPUSDT",
  DOGE: "DOGEUSDT",
  ADA: "ADAUSDT",
  AVAX: "AVAXUSDT",
  DOT: "DOTUSDT",
  MATIC: "MATICUSDT",
  LINK: "LINKUSDT",
  LTC: "LTCUSDT",
  UNI: "UNIUSDT",
  ATOM: "ATOMUSDT",
  TRX: "TRXUSDT",
  NEAR: "NEARUSDT",
  APT: "APTUSDT",
  ARB: "ARBUSDT",
  OP: "OPUSDT",
  FIL: "FILUSDT",
};

function ema(arr: number[], period: number): number | null {
  if (arr.length < period) return null;
  const k = 2 / (period + 1);
  let val = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < arr.length; i++) val = arr[i] * k + val * (1 - k);
  return val;
}

function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  let ag = gain / period;
  let al = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(0, d)) / period;
    al = (al * (period - 1) + Math.max(0, -d)) / period;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

function macdValues(closes: number[]): {
  macd: number;
  signal: number;
  hist: number;
} {
  if (closes.length < 26) return { macd: 0, signal: 0, hist: 0 };
  const macdSeries: number[] = [];
  for (let i = 26; i <= closes.length; i++) {
    const a = ema(closes.slice(0, i), 12);
    const b = ema(closes.slice(0, i), 26);
    if (a !== null && b !== null) macdSeries.push(a - b);
  }
  const e12 = ema(closes, 12) ?? 0;
  const e26 = ema(closes, 26) ?? 0;
  const macdLine = e12 - e26;
  const signalLine = ema(macdSeries, 9) ?? 0;
  return { macd: macdLine, signal: signalLine, hist: macdLine - signalLine };
}

function bollingerPos(closes: number[], period = 20): number {
  if (closes.length < period) return 0.5;
  const sl = closes.slice(-period);
  const mean = sl.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(sl.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const price = closes[closes.length - 1];
  return Math.max(0, Math.min(1, (price - lower) / (upper - lower || 1)));
}

function computePrediction(coinId: string, closes: number[]): CoinPrediction {
  const price = closes[closes.length - 1];

  const rsiVal = rsi(closes, 14);
  let rsiScore = 0;
  if (rsiVal < 30) rsiScore = 1;
  else if (rsiVal < 45) rsiScore = 0.5;
  else if (rsiVal > 70) rsiScore = -1;
  else if (rsiVal > 55) rsiScore = -0.5;

  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  let emaScore = 0;
  if (ema9 !== null && ema21 !== null) {
    const diff = (ema9 - ema21) / ema21;
    emaScore = Math.max(-1, Math.min(1, diff * 50));
  }

  const { macd: macdLine, signal: sigLine, hist } = macdValues(closes);
  let macdScore = 0;
  if (macdLine > sigLine && hist > 0)
    macdScore = Math.min(1, (hist / price) * 5000);
  else if (macdLine < sigLine && hist < 0)
    macdScore = Math.max(-1, (hist / price) * 5000);

  const bbPos = bollingerPos(closes);
  const bbScore = -(bbPos - 0.5) * 2;

  const composite =
    rsiScore * 0.3 + emaScore * 0.25 + macdScore * 0.3 + bbScore * 0.15;

  let signal: "BUY" | "SELL" | "HOLD";
  if (composite > 0.05) signal = "BUY";
  else if (composite < -0.05) signal = "SELL";
  else signal = "HOLD";

  const rawConfidence = Math.abs(composite) * 100;
  const confidence = Math.min(99, Math.max(60, rawConfidence * 2.5 + 55));
  const predictedMove = composite * 3;
  const predictedPrice = price * (1 + predictedMove / 100);

  const STOP_LOSS_PCT = 0.012;
  const TAKE_PROFIT_PCT = Math.max(0.025, Math.abs(predictedMove) / 100);
  const buyPrice = price;
  const sellPrice = price;
  let targetPrice: number;
  let stopLossPrice: number;

  if (signal === "BUY") {
    targetPrice = price * (1 + TAKE_PROFIT_PCT);
    stopLossPrice = price * (1 - STOP_LOSS_PCT);
  } else if (signal === "SELL") {
    targetPrice = price * (1 - TAKE_PROFIT_PCT);
    stopLossPrice = price * (1 + STOP_LOSS_PCT);
  } else {
    targetPrice = price * (1 + TAKE_PROFIT_PCT);
    stopLossPrice = price * (1 - STOP_LOSS_PCT);
  }

  return {
    coinId,
    signal,
    confidence,
    predictedMove,
    predictedPrice,
    currentPrice: price,
    rsiScore,
    emaScore,
    macdScore,
    bbScore,
    buyPrice,
    sellPrice,
    targetPrice,
    stopLossPrice,
  };
}

async function fetchBinanceKlines(
  symbol: string,
  limit = 100,
): Promise<number[] | null> {
  try {
    const url = `${BINANCE_KLINE_URL}?symbol=${symbol}&interval=15m&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((k: unknown[]) => Number.parseFloat(k[4] as string));
  } catch {
    return null;
  }
}

export function use15MinPrediction(
  getPriceHistory: (coinId: string) => number[],
  coinIds: string[],
): PredictionState {
  const [predictions, setPredictions] = useState<CoinPrediction[]>([]);
  const [nextRefreshIn, setNextRefreshIn] = useState(
    secondsToNext15MinBoundary,
  );
  const [lastUpdated, setLastUpdated] = useState("");
  const klineCache = useRef<Record<string, number[]>>({});
  const coinIdsRef = useRef(coinIds);
  const getPriceHistoryRef = useRef(getPriceHistory);

  useEffect(() => {
    coinIdsRef.current = coinIds;
  }, [coinIds]);
  useEffect(() => {
    getPriceHistoryRef.current = getPriceHistory;
  }, [getPriceHistory]);

  const recalculate = useCallback(async () => {
    const ids = coinIdsRef.current;
    const getHistory = getPriceHistoryRef.current;
    const preds: CoinPrediction[] = [];

    for (const id of ids) {
      const symbol = BINANCE_SYMBOLS[id];
      let closes: number[] | null = null;

      if (symbol) {
        const live = await fetchBinanceKlines(symbol, 100);
        if (live && live.length >= 30) {
          closes = live;
          klineCache.current[id] = live;
        }
      }

      if (!closes && klineCache.current[id]?.length >= 30) {
        closes = klineCache.current[id];
      }

      if (!closes || closes.length < 10) {
        const hist = getHistory(id);
        if (hist.length >= 10) closes = hist;
      }

      if (!closes || closes.length < 10) continue;
      preds.push(computePrediction(id, closes));
    }

    preds.sort((a, b) => {
      const order = { BUY: 0, SELL: 1, HOLD: 2 };
      if (order[a.signal] !== order[b.signal])
        return order[a.signal] - order[b.signal];
      return b.confidence - a.confidence;
    });

    setPredictions(preds);
    setLastUpdated(
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // Countdown timer always derived from wall-clock so it matches real 15-min candle close times
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = secondsToNext15MinBoundary();
      setNextRefreshIn(remaining);
      // When a new 15-min candle opens (remaining resets near 900), refresh predictions
      if (remaining >= PREDICTION_INTERVAL - 2) {
        recalculate();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [recalculate]);

  // Background refresh every 30s to keep signals fresh mid-candle
  useEffect(() => {
    const interval = setInterval(recalculate, 30000);
    return () => clearInterval(interval);
  }, [recalculate]);

  return { predictions, nextRefreshIn, lastUpdated };
}
