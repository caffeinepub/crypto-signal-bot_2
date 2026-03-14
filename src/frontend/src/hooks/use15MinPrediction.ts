import { useCallback, useEffect, useRef, useState } from "react";

const PREDICTION_INTERVAL = 900; // 15 minutes in seconds

export interface CoinPrediction {
  coinId: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  predictedMove: number; // % change
  predictedPrice: number;
  currentPrice: number;
  rsiScore: number;
  emaScore: number;
  macdScore: number;
  bbScore: number;
}

export interface PredictionState {
  predictions: CoinPrediction[];
  nextRefreshIn: number; // seconds
  lastUpdated: string;
}

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
  const e12 = ema(closes, 12) ?? 0;
  const e26 = ema(closes, 26) ?? 0;
  const macdLine = e12 - e26;
  const macdSeries: number[] = [];
  for (let i = 26; i <= closes.length; i++) {
    const a = ema(closes.slice(0, i), 12);
    const b = ema(closes.slice(0, i), 26);
    if (a !== null && b !== null) macdSeries.push(a - b);
  }
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
    macdScore = Math.min(1, (hist / price) * 100);
  else if (macdLine < sigLine && hist < 0)
    macdScore = Math.max(-1, (hist / price) * 100);

  const bbPos = bollingerPos(closes);
  const bbScore = -(bbPos - 0.5) * 2;

  const composite =
    rsiScore * 0.25 + emaScore * 0.3 + macdScore * 0.3 + bbScore * 0.15;

  // Scale raw composite (typically 0.01-0.2) up to a visible 55-99% range.
  // rawConfidence 0-100; multiply by 3 and add 45-point base so weak signals
  // show ~60% and strong signals (raw>=18) hit 99%.
  const rawConfidence = Math.abs(composite) * 100;
  const confidence = Math.min(99, Math.max(55, rawConfidence * 3 + 45));

  let signal: "BUY" | "SELL" | "HOLD";
  if (composite > 0.15) signal = "BUY";
  else if (composite < -0.15) signal = "SELL";
  else signal = "HOLD";

  const predictedMove = composite * 2.5;
  const predictedPrice = price * (1 + predictedMove / 100);

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
  };
}

export function use15MinPrediction(
  getPriceHistory: (coinId: string) => number[],
  coinIds: string[],
): PredictionState {
  const [predictions, setPredictions] = useState<CoinPrediction[]>([]);
  const [nextRefreshIn, setNextRefreshIn] = useState(PREDICTION_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState("");
  const refreshCounterRef = useRef(PREDICTION_INTERVAL);

  const recalculate = useCallback(() => {
    const preds = coinIds
      .map((id) => {
        const closes = getPriceHistory(id);
        if (closes.length < 10) return null;
        return computePrediction(id, closes);
      })
      .filter(Boolean) as CoinPrediction[];

    preds.sort((a, b) => b.confidence - a.confidence);
    setPredictions(preds);
    setLastUpdated(
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, [getPriceHistory, coinIds]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshCounterRef.current -= 1;
      if (refreshCounterRef.current <= 0) {
        refreshCounterRef.current = PREDICTION_INTERVAL;
        recalculate();
      }
      setNextRefreshIn(refreshCounterRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [recalculate]);

  useEffect(() => {
    const interval = setInterval(recalculate, 30000);
    return () => clearInterval(interval);
  }, [recalculate]);

  return { predictions, nextRefreshIn, lastUpdated };
}
