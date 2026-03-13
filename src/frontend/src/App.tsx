import { useCallback, useEffect, useRef, useState } from "react";
import { TradingViewChart } from "./components/TradingViewChart";
import { TradingViewTechAnalysis } from "./components/TradingViewTechAnalysis";
import { TradingViewTicker } from "./components/TradingViewTicker";

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
}

interface Coin {
  id: string;
  name: string;
  sym: string;
  icon: string;
  color: string;
  bg: string;
  basePrice: number;
}

interface SignalHistoryItem {
  sig: string;
  cls: string;
  price: string;
  conf: number;
  time: string;
  pair: string;
}

interface IndicatorState {
  rsiVal: string;
  rsiSig: string;
  rsiCls: string;
  rsiPct: number;
  macdVal: string;
  macdSig: string;
  macdCls: string;
  macdPct: number;
  emaVal: string;
  emaSig: string;
  emaCls: string;
  emaPct: number;
  bbVal: string;
  bbSig: string;
  bbCls: string;
  bbPct: number;
}

interface SignalState {
  sig: "buy" | "sell" | "neutral";
  confidence: number;
  strength: number;
  bullPct: number;
  reason: string;
  entry: string;
  tp: string;
  sl: string;
  showEE: boolean;
}

interface PnlState {
  total: number;
  trades: number;
  wins: number;
  best: number;
  worst: number;
}

interface PriceState {
  price: number;
  pct: number;
}

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const COINS: Coin[] = [
  {
    id: "btc",
    name: "Bitcoin",
    sym: "BTC/USDT",
    icon: "₿",
    color: "#f7931a",
    bg: "#1f1200",
    basePrice: 87340,
  },
  {
    id: "eth",
    name: "Ethereum",
    sym: "ETH/USDT",
    icon: "Ξ",
    color: "#627eea",
    bg: "#0d1025",
    basePrice: 3412,
  },
  {
    id: "sol",
    name: "Solana",
    sym: "SOL/USDT",
    icon: "◎",
    color: "#9945ff",
    bg: "#150a25",
    basePrice: 193.5,
  },
  {
    id: "bnb",
    name: "BNB",
    sym: "BNB/USDT",
    icon: "B",
    color: "#f3ba2f",
    bg: "#1f1a00",
    basePrice: 418,
  },
  {
    id: "xrp",
    name: "XRP",
    sym: "XRP/USDT",
    icon: "✕",
    color: "#00aae4",
    bg: "#001520",
    basePrice: 0.618,
  },
  {
    id: "doge",
    name: "Dogecoin",
    sym: "DOGE/USDT",
    icon: "Ð",
    color: "#c2a633",
    bg: "#1c1800",
    basePrice: 0.188,
  },
  {
    id: "ada",
    name: "Cardano",
    sym: "ADA/USDT",
    icon: "₳",
    color: "#0033ad",
    bg: "#000820",
    basePrice: 0.45,
  },
  {
    id: "avax",
    name: "Avalanche",
    sym: "AVAX/USDT",
    icon: "A",
    color: "#e84142",
    bg: "#200808",
    basePrice: 36.5,
  },
  {
    id: "dot",
    name: "Polkadot",
    sym: "DOT/USDT",
    icon: "●",
    color: "#e6007a",
    bg: "#1a0010",
    basePrice: 7.2,
  },
  {
    id: "matic",
    name: "Polygon",
    sym: "MATIC/USDT",
    icon: "⬡",
    color: "#8247e5",
    bg: "#110a1f",
    basePrice: 0.72,
  },
  {
    id: "link",
    name: "Chainlink",
    sym: "LINK/USDT",
    icon: "⬡",
    color: "#375bd2",
    bg: "#050d25",
    basePrice: 14.8,
  },
  {
    id: "ltc",
    name: "Litecoin",
    sym: "LTC/USDT",
    icon: "Ł",
    color: "#bfbbbb",
    bg: "#1a1a1a",
    basePrice: 83,
  },
  {
    id: "uni",
    name: "Uniswap",
    sym: "UNI/USDT",
    icon: "🦄",
    color: "#ff007a",
    bg: "#1a0010",
    basePrice: 9.8,
  },
  {
    id: "atom",
    name: "Cosmos",
    sym: "ATOM/USDT",
    icon: "⚛",
    color: "#2e3148",
    bg: "#0a0b14",
    basePrice: 8.4,
  },
  {
    id: "trx",
    name: "TRON",
    sym: "TRX/USDT",
    icon: "T",
    color: "#ef0027",
    bg: "#1a0005",
    basePrice: 0.128,
  },
  {
    id: "near",
    name: "NEAR",
    sym: "NEAR/USDT",
    icon: "N",
    color: "#00c08b",
    bg: "#001a12",
    basePrice: 5.2,
  },
  {
    id: "apt",
    name: "Aptos",
    sym: "APT/USDT",
    icon: "A",
    color: "#00d4c2",
    bg: "#001a18",
    basePrice: 9.1,
  },
  {
    id: "arb",
    name: "Arbitrum",
    sym: "ARB/USDT",
    icon: "Ⓐ",
    color: "#12aaff",
    bg: "#001520",
    basePrice: 1.05,
  },
  {
    id: "op",
    name: "Optimism",
    sym: "OP/USDT",
    icon: "⊕",
    color: "#ff0420",
    bg: "#1a0003",
    basePrice: 2.1,
  },
  {
    id: "fil",
    name: "Filecoin",
    sym: "FIL/USDT",
    icon: "⬡",
    color: "#0090ff",
    bg: "#001020",
    basePrice: 5.8,
  },
];

const DEMO_SIG_TICKS = 30;

// ── BINANCE PRICE FETCHER ─────────────────────────────────────────────────────
const BINANCE_SYMBOLS_MAP: Record<string, string> = {
  btc: "BTCUSDT",
  eth: "ETHUSDT",
  sol: "SOLUSDT",
  bnb: "BNBUSDT",
  xrp: "XRPUSDT",
  doge: "DOGEUSDT",
  ada: "ADAUSDT",
  avax: "AVAXUSDT",
  dot: "DOTUSDT",
  matic: "MATICUSDT",
  link: "LINKUSDT",
  ltc: "LTCUSDT",
  uni: "UNIUSDT",
  atom: "ATOMUSDT",
  trx: "TRXUSDT",
  near: "NEARUSDT",
  apt: "APTUSDT",
  arb: "ARBUSDT",
  op: "OPUSDT",
  fil: "FILUSDT",
};

async function fetchBinancePrices(): Promise<Record<string, number> | null> {
  try {
    const symbols = JSON.stringify(Object.values(BINANCE_SYMBOLS_MAP));
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(symbols)}`,
    );
    if (!res.ok) return null;
    const data: Array<{ symbol: string; price: string }> = await res.json();
    const prices: Record<string, number> = {};
    for (const [coinId, sym] of Object.entries(BINANCE_SYMBOLS_MAP)) {
      const entry = data.find((d) => d.symbol === sym);
      if (entry) prices[coinId] = Number.parseFloat(entry.price);
    }
    return prices;
  } catch {
    return null;
  }
}

// ── MATH HELPERS ─────────────────────────────────────────────────────────────
function calcEma(arr: number[], p: number): number | null {
  if (arr.length < p) return null;
  const k = 2 / (p + 1);
  let e = arr.slice(0, p).reduce((a, b) => a + b, 0) / p;
  for (let i = p; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

function calcRsi(closes: number[], p = 14): number {
  if (closes.length < p + 1) return 50;
  let g = 0;
  let l = 0;
  for (let i = 1; i <= p; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) g += d;
    else l -= d;
  }
  let ag = g / p;
  let al = l / p;
  for (let i = p + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (p - 1) + (d > 0 ? d : 0)) / p;
    al = (al * (p - 1) + (d < 0 ? -d : 0)) / p;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

function calcMacd(closes: number[]): {
  macd: number;
  signal: number;
  hist: number;
} {
  if (closes.length < 26) return { macd: 0, signal: 0, hist: 0 };
  const e12 = calcEma(closes, 12) ?? 0;
  const e26 = calcEma(closes, 26) ?? 0;
  const m = e12 - e26;
  const ms: number[] = [];
  for (let i = 26; i <= closes.length; i++) {
    const a = calcEma(closes.slice(0, i), 12);
    const b = calcEma(closes.slice(0, i), 26);
    if (a !== null && b !== null) ms.push(a - b);
  }
  const sig = calcEma(ms, 9) ?? 0;
  return { macd: m, signal: sig, hist: m - sig };
}

function calcBollinger(
  closes: number[],
  p = 20,
): { upper: number; lower: number; middle: number; pos: number } {
  if (closes.length < p) return { upper: 0, lower: 0, middle: 0, pos: 0.5 };
  const sl = closes.slice(-p);
  const mean = sl.reduce((a, b) => a + b, 0) / p;
  const std = Math.sqrt(sl.reduce((s, v) => s + (v - mean) ** 2, 0) / p);
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const price = closes[closes.length - 1];
  return {
    upper,
    lower,
    middle: mean,
    pos: Math.max(0, Math.min(1, (price - lower) / (upper - lower || 1))),
  };
}

const TV_SYMBOLS: Record<string, string> = {
  btc: "BINANCE:BTCUSDT",
  eth: "BINANCE:ETHUSDT",
  sol: "BINANCE:SOLUSDT",
  bnb: "BINANCE:BNBUSDT",
  xrp: "BINANCE:XRPUSDT",
  doge: "BINANCE:DOGEUSDT",
  ada: "BINANCE:ADAUSDT",
  avax: "BINANCE:AVAXUSDT",
  dot: "BINANCE:DOTUSDT",
  matic: "BINANCE:MATICUSDT",
  link: "BINANCE:LINKUSDT",
  ltc: "BINANCE:LTCUSDT",
  uni: "BINANCE:UNIUSDT",
  atom: "BINANCE:ATOMUSDT",
  trx: "BINANCE:TRXUSDT",
  near: "BINANCE:NEARUSDT",
  apt: "BINANCE:APTUSDT",
  arb: "BINANCE:ARBUDST",
  op: "BINANCE:OPUSDT",
  fil: "BINANCE:FILUSDT",
};
function fmtPrice(p: number): string {
  if (p >= 1000)
    return `$${p.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  if (p < 1) return `$${p.toFixed(5)}`;
  return `$${p.toFixed(2)}`;
}

function fmtPriceShort(p: number): string {
  if (p >= 1000) return `$${Math.round(p).toLocaleString()}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

// ── INIT CANDLES ─────────────────────────────────────────────────────────────
function initCandles(): Record<string, Candle[]> {
  const bufs: Record<string, Candle[]> = {};
  for (const c of COINS) {
    bufs[c.id] = [];
    for (let i = 0; i < 80; i++) {
      const p = c.basePrice * (1 + (Math.random() - 0.5) * 0.06);
      bufs[c.id].push({
        time: Date.now() - (80 - i) * 60000,
        open: p * (1 - Math.random() * 0.003),
        high: p * (1 + Math.random() * 0.004),
        low: p * (1 - Math.random() * 0.004),
        close: p,
        vol: Math.random() * 1000,
      });
    }
  }
  return bufs;
}

// ── MINI SPARKLINE ───────────────────────────────────────────────────────────
function MiniSpark({ closes, isUp }: { closes: number[]; isUp: boolean }) {
  if (closes.length < 2)
    return (
      <svg className="sparkline" viewBox="0 0 48 24">
        <title>Spark</title>
      </svg>
    );
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const w = 48;
  const h = 24;
  const pts = closes
    .map((v, i) => {
      const x = (i / (closes.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const col = isUp ? "var(--cb-green)" : "var(--cb-red)";
  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: 48, height: 24 }}
    >
      <title>Price sparkline</title>
      <polyline
        points={pts}
        fill="none"
        stroke={col}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── CONFIDENCE BAR ───────────────────────────────────────────────────────────
function ConfBar({
  label,
  pct,
  cls,
  color,
}: { label: string; pct: number; cls: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          fontSize: 10,
          color: "var(--cb-muted)",
          minWidth: 72,
          fontFamily: "var(--font-body)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: 5,
          background: "var(--cb-dim)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 3,
            width: `${pct}%`,
            background:
              cls === "buy"
                ? "linear-gradient(90deg,#00cc66,var(--cb-green))"
                : cls === "sell"
                  ? "linear-gradient(90deg,#cc0033,var(--cb-red))"
                  : "linear-gradient(90deg,#cc9900,var(--cb-yellow))",
            transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 12,
          fontWeight: 700,
          minWidth: 34,
          textAlign: "right",
          color,
        }}
      >
        {Math.round(pct)}%
      </div>
    </div>
  );
}

// ── INDICATOR CARD ───────────────────────────────────────────────────────────
function IndCard({
  name,
  val,
  sig,
  cls,
  pct,
}: { name: string; val: string; sig: string; cls: string; pct: number }) {
  const color =
    cls === "bullish"
      ? "var(--cb-green)"
      : cls === "bearish"
        ? "var(--cb-red)"
        : "var(--cb-yellow)";
  const topBg =
    cls === "bullish"
      ? "linear-gradient(90deg,var(--cb-green),#00cc66)"
      : cls === "bearish"
        ? "linear-gradient(90deg,var(--cb-red),#cc0033)"
        : "linear-gradient(90deg,var(--cb-yellow),#cc9900)";
  return (
    <div
      style={{
        background: "var(--cb-card)",
        border: "1px solid var(--cb-border)",
        borderRadius: 11,
        padding: "12px 14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          borderRadius: "2px 2px 0 0",
          background: topBg,
        }}
      />
      <div
        style={{
          fontSize: 8,
          color: "var(--cb-muted)",
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 6,
          fontFamily: "var(--font-body)",
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: 4,
          color,
        }}
      >
        {val}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 10,
          fontWeight: 600,
          color,
        }}
      >
        {sig}
      </div>
      <div
        style={{
          marginTop: 8,
          height: 3,
          background: "var(--cb-dim)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            width: `${pct}%`,
            background: color,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // mutable refs (no re-render)
  const candleBuffersRef = useRef<Record<string, Candle[]>>(initCandles());
  const pricesRef = useRef<Record<string, number>>(
    Object.fromEntries(COINS.map((c) => [c.id, c.basePrice])),
  );
  const tickCountRef = useRef(0);
  const pnlRef = useRef<PnlState>({
    total: 0,
    trades: 0,
    wins: 0,
    best: 0,
    worst: 0,
  });
  const sigHistRef = useRef<SignalHistoryItem[]>([]);
  const sigCountRef = useRef(0);
  const activeChartTabRef = useRef(0);

  // state for rendering
  const [activeCoinId, setActiveCoinId] = useState("btc");
  const [pairPrices, setPairPrices] = useState<Record<string, PriceState>>(
    Object.fromEntries(
      COINS.map((c) => [c.id, { price: c.basePrice, pct: 0 }]),
    ),
  );
  const [heroPct, setHeroPct] = useState(0);
  const [countdown, setCountdown] = useState(DEMO_SIG_TICKS * 2);
  const [sigCount, setSigCount] = useState(0);
  const [indicators, setIndicators] = useState<IndicatorState>({
    rsiVal: "50.0",
    rsiSig: "→ NEUTRAL",
    rsiCls: "neutral-i",
    rsiPct: 50,
    macdVal: "0.00",
    macdSig: "→ NEUTRAL",
    macdCls: "neutral-i",
    macdPct: 50,
    emaVal: "0.00%",
    emaSig: "→ NEUTRAL",
    emaCls: "neutral-i",
    emaPct: 50,
    bbVal: "50%",
    bbSig: "→ MID BAND",
    bbCls: "neutral-i",
    bbPct: 50,
  });
  const [signal, setSignal] = useState<SignalState>({
    sig: "neutral",
    confidence: 0,
    strength: 0,
    bullPct: 50,
    reason: "Warming up signal engine…",
    entry: "--",
    tp: "--",
    sl: "--",
    showEE: false,
  });
  const [pnl, setPnl] = useState<PnlState>({
    total: 0,
    trades: 0,
    wins: 0,
    best: 0,
    worst: 0,
  });
  const [signalHistory, setSignalHistory] = useState<SignalHistoryItem[]>([]);
  const [toast, setToast] = useState<{
    msg: string;
    cls: string;
    show: boolean;
  }>({ msg: "", cls: "", show: false });
  const [activeChartTab, setActiveChartTab] = useState(0);
  const [clock, setClock] = useState("");
  const [tickerData, setTickerData] = useState<
    Array<{ id: string; price: string; pct: string; up: boolean }>
  >([]);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── computeIndicators ───────────────────────────────────────────────────────
  const computeIndicators = useCallback((coinId: string): IndicatorState => {
    const closes = candleBuffersRef.current[coinId].map((c) => c.close);
    const price = closes[closes.length - 1];

    const r = calcRsi(closes);
    const m = calcMacd(closes);
    const e20 = calcEma(closes, 20);
    const e50 = calcEma(closes, 50);
    const bb = calcBollinger(closes);

    // RSI
    const rsiCls = r < 40 ? "bullish" : r > 60 ? "bearish" : "neutral-i";
    const rsiSig =
      r < 30
        ? "🔥 OVERSOLD"
        : r > 70
          ? "❄️ OVERBOUGHT"
          : r < 45
            ? "↗ BULLISH"
            : r > 55
              ? "↘ BEARISH"
              : "→ NEUTRAL";

    // MACD
    const macdCls =
      m.macd > 0 && m.hist > 0
        ? "bullish"
        : m.macd < 0 && m.hist < 0
          ? "bearish"
          : "neutral-i";
    const macdSig = m.hist > 0 ? "↗ BULLISH CROSS" : "↘ BEARISH CROSS";
    const macdPct = Math.min(100, Math.max(0, 50 + (m.macd / price) * 5000));

    // EMA
    let emaVal = "0.00%";
    let emaSig = "→ NEUTRAL";
    let emaCls = "neutral-i";
    let emaPct = 50;
    if (e20 !== null && e50 !== null) {
      const diff = ((e20 - e50) / e50) * 100;
      emaCls = diff > 0 ? "bullish" : "bearish";
      emaVal = `${(diff > 0 ? "+" : "") + diff.toFixed(2)}%`;
      emaSig = diff > 0 ? "↗ GOLDEN CROSS" : "↘ DEATH CROSS";
      emaPct = Math.min(100, Math.max(0, 50 + diff * 4));
    }

    // Bollinger
    const bbCls =
      bb.pos < 0.2 ? "bullish" : bb.pos > 0.8 ? "bearish" : "neutral-i";
    const bbSig =
      bb.pos < 0.2
        ? "↗ NEAR LOWER"
        : bb.pos > 0.8
          ? "↘ NEAR UPPER"
          : "→ MID BAND";

    return {
      rsiVal: r.toFixed(1),
      rsiSig,
      rsiCls,
      rsiPct: r,
      macdVal: m.macd.toFixed(2),
      macdSig,
      macdCls,
      macdPct,
      emaVal,
      emaSig,
      emaCls,
      emaPct,
      bbVal: `${Math.round(bb.pos * 100)}%`,
      bbSig,
      bbCls,
      bbPct: bb.pos * 100,
    };
  }, []);

  // ── generateSignal ──────────────────────────────────────────────────────────
  const generateSignal = useCallback((coinId: string) => {
    const closes = candleBuffersRef.current[coinId].map((c) => c.close);
    const price = closes[closes.length - 1];

    const r = calcRsi(closes);
    const m = calcMacd(closes);
    const e20 = calcEma(closes, 20);
    const e50 = calcEma(closes, 50);
    const bb = calcBollinger(closes);

    let bull = 0;
    let bear = 0;
    const reasons: string[] = [];

    if (r < 30) {
      bull += 3;
      reasons.push(`RSI oversold (${r.toFixed(1)})`);
    } else if (r < 42) {
      bull += 1.5;
      reasons.push("RSI dipping low");
    } else if (r > 70) {
      bear += 3;
      reasons.push(`RSI overbought (${r.toFixed(1)})`);
    } else if (r > 58) {
      bear += 1.5;
      reasons.push("RSI elevated");
    }

    if (m.macd > 0 && m.hist > 0) {
      bull += 2;
      reasons.push("MACD bullish crossover");
    } else if (m.macd < 0 && m.hist < 0) {
      bear += 2;
      reasons.push("MACD bearish crossover");
    }
    if (m.hist > 0) bull += 0.5;
    else bear += 0.5;

    if (e20 !== null && e50 !== null) {
      if (e20 > e50 && price > e20) {
        bull += 2;
        reasons.push("Golden cross confirmed");
      } else if (e20 < e50 && price < e20) {
        bear += 2;
        reasons.push("Death cross confirmed");
      } else if (price > e20) bull += 1;
      else bear += 1;
    }

    if (bb.pos < 0.15) {
      bull += 2;
      reasons.push("Bouncing off lower BB");
    } else if (bb.pos > 0.85) {
      bear += 2;
      reasons.push("Rejected at upper BB");
    } else if (bb.pos > 0.5) bull += 0.5;
    else bear += 0.5;

    bull += Math.random() * 1.5;
    bear += Math.random() * 1.5;

    const total = bull + bear;
    const conf = Math.min(94, Math.abs(bull - bear) * 8 + 42);
    const str = Math.min(92, total * 7 + 30);
    const bullPct = Math.round((bull / total) * 100);

    let sig: "buy" | "sell" | "neutral" = "neutral";
    if (bull > bear + 2.5) sig = "buy";
    else if (bear > bull + 2.5) sig = "sell";

    const tp = price * (sig === "buy" ? 1.025 : 0.975);
    const sl = price * (sig === "buy" ? 0.988 : 1.012);

    setSignal({
      sig,
      confidence: conf,
      strength: str,
      bullPct,
      reason: reasons.slice(0, 3).join(" · ") || "Analyzing…",
      entry: fmtPrice(price),
      tp: fmtPrice(tp),
      sl: fmtPrice(sl),
      showEE: sig !== "neutral",
    });

    // P&L update
    if (sig !== "neutral") {
      const outcome = Math.random();
      const pnlChange = outcome > 0.42 ? price * 0.018 : -price * 0.01;
      const prev = pnlRef.current;
      const next: PnlState = {
        total: prev.total + pnlChange,
        trades: prev.trades + 1,
        wins: prev.wins + (pnlChange > 0 ? 1 : 0),
        best: Math.max(prev.best, pnlChange),
        worst: Math.min(prev.worst, pnlChange),
      };
      pnlRef.current = next;
      setPnl({ ...next });
      sigCountRef.current++;
      setSigCount(sigCountRef.current);
    }

    // history
    const t = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const item: SignalHistoryItem = {
      sig,
      cls: sig,
      price: fmtPriceShort(price),
      conf: Math.round(conf),
      time: t,
      pair: coinId.toUpperCase(),
    };
    sigHistRef.current = [item, ...sigHistRef.current].slice(0, 20);
    setSignalHistory([...sigHistRef.current]);
  }, []);

  // ── TICK ────────────────────────────────────────────────────────────────────
  const activeCoinIdRef = useRef(activeCoinId);
  useEffect(() => {
    activeCoinIdRef.current = activeCoinId;
  }, [activeCoinId]);

  useEffect(() => {
    const interval = setInterval(() => {
      // update prices — fetch real Binance prices every 5 ticks (10s), drift in between
      if (tickCountRef.current % 5 === 0) {
        fetchBinancePrices().then((live) => {
          if (live) {
            for (const c of COINS) {
              if (live[c.id]) pricesRef.current[c.id] = live[c.id];
            }
          }
        });
      }
      for (const c of COINS) {
        const vol = c.id === "doge" || c.id === "xrp" ? 0.0005 : 0.0003;
        const drift = (Math.random() - 0.5) * vol;
        pricesRef.current[c.id] = Math.max(
          pricesRef.current[c.id] * (1 + drift),
          0.0001,
        );

        const buf = candleBuffersRef.current[c.id];
        const last = buf[buf.length - 1];
        if (Date.now() - last.time > 60000) {
          buf.push({
            time: Date.now(),
            open: pricesRef.current[c.id],
            high: pricesRef.current[c.id],
            low: pricesRef.current[c.id],
            close: pricesRef.current[c.id],
            vol: Math.random() * 500,
          });
          if (buf.length > 120) buf.shift();
        } else {
          last.close = pricesRef.current[c.id];
          last.high = Math.max(last.high, pricesRef.current[c.id]);
          last.low = Math.min(last.low, pricesRef.current[c.id]);
        }
      }

      tickCountRef.current++;
      const tc = tickCountRef.current;
      const cd = Math.max(0, (DEMO_SIG_TICKS - (tc % DEMO_SIG_TICKS)) * 2);
      setCountdown(cd);

      // update pair prices state
      const newPairs: Record<string, PriceState> = {};
      for (const c of COINS) {
        const price = pricesRef.current[c.id];
        const buf = candleBuffersRef.current[c.id];
        const old = buf.length > 1 ? buf[buf.length - 2].close : price;
        newPairs[c.id] = { price, pct: ((price - old) / old) * 100 };
      }
      setPairPrices(newPairs);

      // hero pct
      const coinId = activeCoinIdRef.current;
      const buf0 = candleBuffersRef.current[coinId];
      const baseP = buf0[0]?.close || pricesRef.current[coinId];
      setHeroPct(((pricesRef.current[coinId] - baseP) / baseP) * 100);

      // indicators
      setIndicators(computeIndicators(coinId));

      // ticker
      const td = COINS.map((c) => {
        const price = pricesRef.current[c.id];
        const buf = candleBuffersRef.current[c.id];
        const old =
          buf.length > 1 ? buf[Math.max(0, buf.length - 10)].close : price;
        const up = price >= old;
        const pct = (((price - old) / old) * 100).toFixed(2);
        return { id: c.id, price: fmtPriceShort(price), pct, up };
      });
      setTickerData(td);

      // generate signal
      if (tc % DEMO_SIG_TICKS === 0) generateSignal(coinId);
    }, 2000);

    return () => clearInterval(interval);
  }, [computeIndicators, generateSignal]);

  // clock
  useEffect(() => {
    const id = setInterval(
      () => setClock(new Date().toLocaleTimeString()),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  // initial render — fetch real prices from Binance on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional once-on-mount
  useEffect(() => {
    fetchBinancePrices().then((live) => {
      if (live) {
        for (const c of COINS) {
          if (live[c.id]) {
            pricesRef.current[c.id] = live[c.id];
            // Re-seed candle buffers with real price
            const buf = candleBuffersRef.current[c.id];
            for (const candle of buf) {
              const ratio = live[c.id] / c.basePrice;
              candle.open *= ratio;
              candle.high *= ratio;
              candle.low *= ratio;
              candle.close *= ratio;
            }
          }
        }
        const newPairs: Record<string, PriceState> = {};
        for (const c of COINS) {
          newPairs[c.id] = { price: pricesRef.current[c.id], pct: 0 };
        }
        setPairPrices(newPairs);
      }
    });
    setIndicators(computeIndicators(activeCoinId));
    setTimeout(() => generateSignal(activeCoinId), 2000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── switchCoin ───────────────────────────────────────────────────────────────
  const switchCoin = useCallback(
    (id: string) => {
      setActiveCoinId(id);
      setIndicators(computeIndicators(id));
    },
    [computeIndicators],
  );

  // ── manualTrade ──────────────────────────────────────────────────────────────
  const manualTrade = useCallback((type: "buy" | "sell") => {
    const coinId = activeCoinIdRef.current;
    const price = pricesRef.current[coinId];
    const msg =
      type === "buy"
        ? `✅ BUY order placed @ ${fmtPriceShort(price)}`
        : `💰 SELL order placed @ ${fmtPriceShort(price)}`;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, cls: type, show: true });
    toastTimerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      3200,
    );

    const pnlChange = (Math.random() > 0.4 ? 1 : -1) * price * 0.015;
    const prev = pnlRef.current;
    const next: PnlState = {
      total: prev.total + pnlChange,
      trades: prev.trades + 1,
      wins: prev.wins + (pnlChange > 0 ? 1 : 0),
      best: Math.max(prev.best, pnlChange),
      worst: Math.min(prev.worst, pnlChange),
    };
    pnlRef.current = next;
    setPnl({ ...next });

    const t = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const item: SignalHistoryItem = {
      sig: type,
      cls: type,
      price: fmtPriceShort(price),
      conf: 72,
      time: t,
      pair: coinId.toUpperCase(),
    };
    sigHistRef.current = [item, ...sigHistRef.current].slice(0, 20);
    setSignalHistory([...sigHistRef.current]);
  }, []);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const tvSymbol = TV_SYMBOLS[activeCoinId] ?? "BINANCE:BTCUSDT";
  const activeCoin = COINS.find((c) => c.id === activeCoinId)!;
  const activePrice = pairPrices[activeCoinId]?.price ?? activeCoin.basePrice;
  const sigLabels = {
    buy: "STRONG BUY",
    sell: "STRONG SELL",
    neutral: "HOLD / WAIT",
  };
  const sigSubs = {
    buy: "Entry signal detected — consider long",
    sell: "Exit/short signal — consider sell",
    neutral: "Mixed signals — wait for clearer setup",
  };
  const sigIcons = { buy: "🟢", sell: "🔴", neutral: "🟡" };
  const countdownM = Math.floor(countdown / 60);
  const countdownS = countdown % 60;
  const winRate = pnl.trades
    ? `${Math.round((pnl.wins / pnl.trades) * 100)}%`
    : "--%";

  const sigColor =
    signal.sig === "buy"
      ? "var(--cb-green)"
      : signal.sig === "sell"
        ? "var(--cb-red)"
        : "var(--cb-yellow)";

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      {/* TOAST */}
      <div
        data-ocid="signal.toast"
        style={{
          position: "fixed",
          top: 70,
          left: "50%",
          transform: toast.show
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(-20px)",
          background: "var(--cb-card)",
          border: `1px solid ${toast.cls === "buy" ? "var(--cb-green)" : "var(--cb-red)"}`,
          borderRadius: 12,
          padding: "11px 22px",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 600,
          zIndex: 9998,
          opacity: toast.show ? 1 : 0,
          transition: "all 0.35s",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          boxShadow:
            toast.cls === "buy"
              ? "0 8px 32px rgba(0,0,0,0.6),0 0 30px rgba(0,255,136,0.15)"
              : "0 8px 32px rgba(0,0,0,0.6),0 0 30px rgba(255,48,96,0.15)",
          color: toast.cls === "buy" ? "var(--cb-green)" : "var(--cb-red)",
        }}
      >
        {toast.msg}
      </div>

      {/* HEADER */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "14px 20px",
          background: "rgba(5,13,28,0.95)",
          borderBottom: "1px solid var(--cb-border2)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(24px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: 3,
              background:
                "linear-gradient(90deg, var(--cb-cyan), #4488ff, var(--cb-purple))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CRYPTOBOT PRO
          </div>
          <div
            style={{
              background:
                "linear-gradient(90deg, var(--cb-orange), var(--cb-yellow))",
              color: "#000",
              fontFamily: "var(--font-heading)",
              fontSize: 9,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 4,
              letterSpacing: 1.5,
              animation: "badgePulse 2s ease-in-out infinite",
            }}
          >
            DEMO
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--cb-green)",
                boxShadow: "0 0 12px var(--cb-green)",
                animation: "livePulse 1.4s ease-in-out infinite",
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--cb-green)",
                letterSpacing: 1.5,
              }}
            >
              LIVE PRICES
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--cb-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {clock}
          </div>
        </div>
      </header>

      {/* TICKER */}
      <div
        style={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          background: "rgba(5,13,28,0.95)",
          borderBottom: "1px solid var(--cb-border)",
          padding: "7px 0",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            gap: 40,
            animation: "tickerScroll 28s linear infinite",
          }}
        >
          {[...tickerData, ...tickerData].map((t, i) => (
            <span
              key={`${t.id}-${i}`}
              style={{ fontSize: 11, color: "var(--cb-muted)" }}
            >
              {t.id.toUpperCase()}{" "}
              <strong
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 10,
                  color: t.up ? "var(--cb-green)" : "var(--cb-red)",
                }}
              >
                {t.price} {t.up ? "▲" : "▼"}
                {Math.abs(Number.parseFloat(t.pct))}%
              </strong>
            </span>
          ))}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          maxWidth: 1600,
          margin: "0 auto",
        }}
        className="crypto-main"
      >
        {/* LEFT SIDEBAR */}
        <aside
          style={{ borderRight: "1px solid var(--cb-border)", padding: 16 }}
          className="sidebar-left"
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 9,
              letterSpacing: 2.5,
              color: "var(--cb-muted)",
              textTransform: "uppercase",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Markets
            <span
              style={{ flex: 1, height: 1, background: "var(--cb-border)" }}
            />
          </div>

          {/* PAIR LIST */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 20,
            }}
          >
            {COINS.map((c, idx) => {
              const ps = pairPrices[c.id] ?? { price: c.basePrice, pct: 0 };
              const isUp = ps.pct >= 0;
              const buf = candleBuffersRef.current[c.id];
              const sparkPts = buf.slice(-12).map((b) => b.close);
              return (
                <button
                  type="button"
                  key={c.id}
                  data-ocid={`markets.pair.item.${idx + 1}`}
                  onClick={() => switchCoin(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background:
                      activeCoinId === c.id
                        ? "rgba(0,229,255,0.04)"
                        : "var(--cb-card)",
                    font: "inherit",
                    width: "100%",
                    textAlign: "left",
                    border: `1px solid ${activeCoinId === c.id ? "rgba(0,229,255,0.2)" : "var(--cb-border)"}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background:
                        activeCoinId === c.id
                          ? "var(--cb-cyan)"
                          : "var(--cb-border2)",
                      borderRadius: "2px 0 0 2px",
                    }}
                  />
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-heading)",
                      fontSize: 12,
                      fontWeight: 900,
                      background: c.bg,
                      color: c.color,
                      flexShrink: 0,
                    }}
                  >
                    {c.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 700,
                        fontSize: 13,
                        lineHeight: 1,
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--cb-muted)",
                        marginTop: 1,
                      }}
                    >
                      {c.sym}
                    </div>
                  </div>
                  <MiniSpark closes={sparkPts} isUp={isUp} />
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: isUp ? "var(--cb-green)" : "var(--cb-red)",
                      }}
                    >
                      {fmtPriceShort(ps.price)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        marginTop: 2,
                        color: isUp ? "var(--cb-green)" : "var(--cb-red)",
                      }}
                    >
                      {isUp ? "▲" : "▼"}
                      {Math.abs(ps.pct).toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* BOT SETTINGS */}
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 9,
              letterSpacing: 2.5,
              color: "var(--cb-muted)",
              textTransform: "uppercase",
              marginBottom: 10,
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Bot Settings
            <span
              style={{ flex: 1, height: 1, background: "var(--cb-border)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                label: "SIGNAL INTERVAL",
                val: "12 MINUTES",
                col: "var(--cb-cyan)",
              },
              {
                label: "STRATEGY",
                val: "RSI + MACD + EMA + BB",
                col: "var(--cb-text)",
                small: true,
              },
              {
                label: "RISK PER TRADE",
                val: "1.2% SL / 2.5% TP",
                col: "var(--cb-yellow)",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "var(--cb-card)",
                  border: "1px solid var(--cb-border)",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--cb-muted)",
                    letterSpacing: 1.5,
                    fontFamily: "var(--font-body)",
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: s.small ? 11 : 15,
                    color: s.col,
                  }}
                >
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER COLUMN */}
        <section
          style={{ padding: 16, borderRight: "1px solid var(--cb-border)" }}
          className="center-col"
        >
          {/* STATS STRIP */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              {
                label: "Price",
                val: fmtPriceShort(activePrice),
                col: "var(--cb-cyan)",
              },
              {
                label: "24h Change",
                val: `${(heroPct >= 0 ? "+" : "") + heroPct.toFixed(2)}%`,
                col: heroPct >= 0 ? "var(--cb-green)" : "var(--cb-red)",
              },
              {
                label: "Signals Today",
                val: sigCount.toString(),
                col: "var(--cb-purple)",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "var(--cb-card)",
                  border: "1px solid var(--cb-border)",
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    color: "var(--cb-muted)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontFamily: "var(--font-body)",
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: s.col,
                  }}
                >
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          {/* SIGNAL HERO */}
          <div
            data-ocid="signal.hero.panel"
            style={{
              borderRadius: 14,
              padding: 20,
              marginBottom: 14,
              border: `1px solid ${signal.sig === "buy" ? "rgba(0,255,136,0.3)" : signal.sig === "sell" ? "rgba(255,48,96,0.3)" : "rgba(255,215,0,0.25)"}`,
              background:
                signal.sig === "buy"
                  ? "radial-gradient(ellipse at top left, rgba(0,255,136,0.08), transparent 70%), linear-gradient(135deg, #030f0a, #020810)"
                  : signal.sig === "sell"
                    ? "radial-gradient(ellipse at top left, rgba(255,48,96,0.08), transparent 70%), linear-gradient(135deg, #0f0308, #020810)"
                    : "radial-gradient(ellipse at top left, rgba(255,215,0,0.05), transparent 70%), linear-gradient(135deg, #0d0c02, #020810)",
              boxShadow:
                signal.sig === "buy"
                  ? "0 0 40px rgba(0,255,136,0.08), inset 0 0 40px rgba(0,255,136,0.03)"
                  : signal.sig === "sell"
                    ? "0 0 40px rgba(255,48,96,0.08), inset 0 0 40px rgba(255,48,96,0.03)"
                    : "none",
              transition: "all 0.6s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 8,
                  letterSpacing: 2,
                  color: "var(--cb-muted)",
                }}
              >
                ⚡ BOT SIGNAL — 12MIN INTERVAL
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "rgba(0,0,0,0.4)",
                  padding: "3px 10px",
                  borderRadius: 20,
                  border: "1px solid var(--cb-border2)",
                  color: "var(--cb-cyan)",
                }}
              >
                Next: {String(countdownM).padStart(2, "0")}:
                {String(countdownS).padStart(2, "0")}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 38,
                  lineHeight: 1,
                  animation: "iconBounce 2s ease-in-out infinite",
                }}
              >
                {sigIcons[signal.sig]}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 26,
                    fontWeight: 900,
                    letterSpacing: 2,
                    lineHeight: 1,
                    color: sigColor,
                    textShadow:
                      signal.sig === "buy"
                        ? "0 0 30px rgba(0,255,136,0.6)"
                        : signal.sig === "sell"
                          ? "0 0 30px rgba(255,48,96,0.6)"
                          : "none",
                  }}
                >
                  {sigLabels[signal.sig]}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "var(--cb-muted)",
                    marginTop: 2,
                  }}
                >
                  {sigSubs[signal.sig]}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <ConfBar
                label="Confidence"
                pct={signal.confidence}
                cls={signal.sig}
                color={sigColor}
              />
              <ConfBar
                label="Signal Strength"
                pct={signal.strength}
                cls={signal.sig}
                color={sigColor}
              />
              <ConfBar
                label="Bull Score"
                pct={signal.bullPct}
                cls="buy"
                color="var(--cb-green)"
              />
            </div>
            <div
              style={{
                background: "rgba(0,0,0,0.35)",
                borderRadius: 8,
                padding: "10px 14px",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--cb-text)",
                lineHeight: 1.6,
                borderLeft: `3px solid ${sigColor}`,
                marginBottom: signal.showEE ? 14 : 0,
              }}
            >
              {signal.reason}
            </div>
            {signal.showEE && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 6,
                }}
              >
                {[
                  { label: "Entry", val: signal.entry, col: "var(--cb-cyan)" },
                  {
                    label: "Take Profit",
                    val: signal.tp,
                    col: "var(--cb-green)",
                  },
                  { label: "Stop Loss", val: signal.sl, col: "var(--cb-red)" },
                  {
                    label: "Risk/Reward",
                    val: "1:2.1",
                    col: "var(--cb-purple)",
                  },
                ].map((e) => (
                  <div
                    key={e.label}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 8,
                      padding: "10px 8px",
                      border: "1px solid var(--cb-border)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        color: "var(--cb-muted)",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        marginBottom: 4,
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {e.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: 11,
                        fontWeight: 700,
                        color: e.col,
                      }}
                    >
                      {e.val}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHART */}
          <div
            style={{
              background: "var(--cb-card)",
              border: "1px solid var(--cb-border)",
              borderRadius: 14,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 9,
                  letterSpacing: 2,
                  color: "var(--cb-muted)",
                }}
              >
                📊 PRICE CHART + SIGNALS
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["1M", "5M", "15M"].map((lbl, i) => (
                  <div
                    key={lbl}
                    data-ocid={`chart.tab.${i + 1}`}
                    onClick={() => {
                      setActiveChartTab(i);
                      activeChartTabRef.current = i;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setActiveChartTab(i);
                        activeChartTabRef.current = i;
                      }
                    }}
                    role="tab"
                    tabIndex={0}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontFamily: "var(--font-heading)",
                      fontSize: 8,
                      border: `1px solid ${activeChartTab === i ? "var(--cb-cyan)" : "var(--cb-border2)"}`,
                      color:
                        activeChartTab === i
                          ? "var(--cb-cyan)"
                          : "var(--cb-muted)",
                      background:
                        activeChartTab === i
                          ? "rgba(0,229,255,0.06)"
                          : "transparent",
                      cursor: "pointer",
                      letterSpacing: 1,
                      transition: "all 0.15s",
                    }}
                  >
                    {lbl}
                  </div>
                ))}
              </div>
            </div>
            <TradingViewChart symbol={tvSymbol} />
          </div>

          {/* INDICATORS */}
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 9,
              letterSpacing: 2.5,
              color: "var(--cb-muted)",
              textTransform: "uppercase",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Technical Indicators
            <span
              style={{ flex: 1, height: 1, background: "var(--cb-border)" }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 14,
            }}
            className="ind-grid"
          >
            <IndCard
              name="RSI (14)"
              val={indicators.rsiVal}
              sig={indicators.rsiSig}
              cls={indicators.rsiCls}
              pct={indicators.rsiPct}
            />
            <IndCard
              name="MACD"
              val={indicators.macdVal}
              sig={indicators.macdSig}
              cls={indicators.macdCls}
              pct={indicators.macdPct}
            />
            <IndCard
              name="EMA 20/50"
              val={indicators.emaVal}
              sig={indicators.emaSig}
              cls={indicators.emaCls}
              pct={indicators.emaPct}
            />
            <IndCard
              name="BOLLINGER"
              val={indicators.bbVal}
              sig={indicators.bbSig}
              cls={indicators.bbCls}
              pct={indicators.bbPct}
            />
          </div>

          {/* TRADINGVIEW TECHNICAL ANALYSIS */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 9,
                letterSpacing: 2.5,
                color: "var(--cb-muted)",
                textTransform: "uppercase",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Live Technical Analysis
              <span
                style={{ flex: 1, height: 1, background: "var(--cb-border)" }}
              />
            </div>
            <TradingViewTechAnalysis symbol={tvSymbol} />
          </div>

          {/* BUY/SELL BUTTONS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              data-ocid="signal.buy_button"
              onClick={() => manualTrade("buy")}
              style={{
                padding: 16,
                borderRadius: 12,
                border: "none",
                fontFamily: "var(--font-heading)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "linear-gradient(135deg,#00bb55,#00ff88)",
                color: "#000",
                boxShadow: "0 4px 22px rgba(0,255,136,0.28)",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "none";
              }}
            >
              ▲ &nbsp;BUY NOW
            </button>
            <button
              type="button"
              data-ocid="signal.sell_button"
              onClick={() => manualTrade("sell")}
              style={{
                padding: 16,
                borderRadius: 12,
                border: "none",
                fontFamily: "var(--font-heading)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "linear-gradient(135deg,#bb0030,#ff3060)",
                color: "#fff",
                boxShadow: "0 4px 22px rgba(255,48,96,0.28)",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "none";
              }}
            >
              ▼ &nbsp;SELL NOW
            </button>
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside style={{ padding: 16 }} className="sidebar-right">
          {/* P&L */}
          <div
            data-ocid="pnl.panel"
            style={{
              background: "linear-gradient(135deg,#060f22,#04080f)",
              border: "1px solid var(--cb-border2)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  color: "var(--cb-muted)",
                  letterSpacing: 2,
                  fontFamily: "var(--font-heading)",
                }}
              >
                DEMO P&L
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--cb-yellow)",
                  background: "rgba(255,215,0,0.1)",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                PAPER TRADING
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 26,
                fontWeight: 900,
                color: pnl.total >= 0 ? "var(--cb-green)" : "var(--cb-red)",
              }}
            >
              {pnl.total >= 0 ? "+" : ""} ${Math.abs(pnl.total).toFixed(2)}
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "var(--cb-muted)",
                marginTop: 2,
              }}
            >
              Starting balance: $10,000
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 12,
              }}
            >
              {[
                { label: "WIN RATE", val: winRate, col: "var(--cb-green)" },
                {
                  label: "TRADES",
                  val: pnl.trades.toString(),
                  col: "var(--cb-cyan)",
                },
                {
                  label: "BEST",
                  val: `+$${pnl.best.toFixed(2)}`,
                  col: "var(--cb-green)",
                },
                {
                  label: "WORST",
                  val: `$${pnl.worst.toFixed(2)}`,
                  col: "var(--cb-red)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: 8,
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--cb-muted)",
                      fontFamily: "var(--font-body)",
                      letterSpacing: 1,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 13,
                      fontWeight: 700,
                      marginTop: 2,
                      color: s.col,
                    }}
                  >
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIGNAL HISTORY */}
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 9,
              letterSpacing: 2.5,
              color: "var(--cb-muted)",
              textTransform: "uppercase",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Signal History
            <span
              style={{ flex: 1, height: 1, background: "var(--cb-border)" }}
            />
          </div>
          <div
            data-ocid="history.list"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {signalHistory.length === 0 ? (
              <div
                style={{
                  color: "var(--cb-muted)",
                  fontSize: 11,
                  textAlign: "center",
                  padding: 24,
                  fontFamily: "var(--font-body)",
                }}
              >
                Waiting for signals…
              </div>
            ) : (
              signalHistory.map((h, i) => (
                <div
                  key={`${h.time}-${h.sig}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.2)",
                    borderLeft: `3px solid ${h.cls === "buy" ? "var(--cb-green)" : h.cls === "sell" ? "var(--cb-red)" : "var(--cb-yellow)"}`,
                    animation: "histSlide 0.4s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--cb-muted)",
                      minWidth: 42,
                    }}
                  >
                    {h.time}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 46,
                      color:
                        h.cls === "buy"
                          ? "var(--cb-green)"
                          : h.cls === "sell"
                            ? "var(--cb-red)"
                            : "var(--cb-yellow)",
                    }}
                  >
                    {h.sig.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, flex: 1 }}>
                    {h.pair} {h.price}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--cb-muted)" }}>
                    {h.conf}%
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "var(--cb-muted)",
              textAlign: "center",
              padding: "12px 0",
              lineHeight: 1.6,
              borderTop: "1px solid var(--cb-border)",
              marginTop: 14,
            }}
          >
            ⚠️ Demo mode only. All prices are simulated.
            <br />
            Not financial advice.
          </div>
        </aside>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          padding: "12px 16px",
          borderTop: "1px solid var(--cb-border)",
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "var(--cb-muted)",
        }}
      >
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--cb-cyan)" }}
        >
          caffeine.ai
        </a>
      </footer>

      {/* Responsive grid styles via style tag */}
      <style>{`
        .crypto-main {
          grid-template-columns: 1fr;
        }
        .sidebar-right {
          display: none;
        }
        @media (min-width: 900px) {
          .crypto-main {
            grid-template-columns: 320px 1fr;
          }
          .sidebar-right {
            display: block;
          }
        }
        @media (min-width: 1200px) {
          .crypto-main {
            grid-template-columns: 320px 1fr 300px;
          }
        }
        .ind-grid {
          grid-template-columns: 1fr 1fr;
        }
        @media (min-width: 600px) {
          .ind-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 599px) {
          .ee-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
