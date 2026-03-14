import { useState } from "react";
import type { CoinPrediction } from "../hooks/use15MinPrediction";

function fmtPrice(p: number): string {
  if (p >= 1000) return `$${Math.round(p).toLocaleString()}`;
  if (p < 1) return `$${p.toFixed(5)}`;
  return `$${p.toFixed(2)}`;
}

function fmtCountdown(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface Props {
  predictions: CoinPrediction[];
  nextRefreshIn: number;
  lastUpdated: string;
  coinMeta: Record<string, { icon: string; name: string; color: string }>;
}

export function PredictionsPanel({
  predictions,
  nextRefreshIn,
  lastUpdated,
  coinMeta,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const sigColor = (sig: string) =>
    sig === "BUY"
      ? "var(--cb-green)"
      : sig === "SELL"
        ? "var(--cb-red)"
        : "var(--cb-yellow)";

  const sigBg = (sig: string) =>
    sig === "BUY"
      ? "rgba(0,255,136,0.08)"
      : sig === "SELL"
        ? "rgba(255,48,96,0.08)"
        : "rgba(255,204,0,0.08)";

  const progress = ((900 - nextRefreshIn) / 900) * 100;

  return (
    <div
      data-ocid="predictions.panel"
      style={{
        background: "var(--cb-card)",
        border: "1px solid var(--cb-border2)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: collapsed ? "none" : "1px solid var(--cb-border)",
          background: "rgba(0,229,255,0.03)",
          cursor: "pointer",
          width: "100%",
          border: "none",
          outline: "none",
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--cb-cyan)",
              textTransform: "uppercase",
            }}
          >
            ⚡ 15-Min Trade Predictions
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--cb-muted)",
            }}
          >
            Updated: {lastUpdated || "--:--"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Global countdown */}
          <div
            data-ocid="predictions.timer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--cb-border2)",
              borderRadius: 8,
              padding: "4px 10px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background:
                  nextRefreshIn < 60 ? "var(--cb-red)" : "var(--cb-cyan)",
                animation: "livePulse 1.4s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 700,
                color: nextRefreshIn < 60 ? "var(--cb-red)" : "var(--cb-cyan)",
              }}
            >
              {fmtCountdown(nextRefreshIn)}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 9,
                color: "var(--cb-muted)",
                letterSpacing: 1,
              }}
            >
              NEXT REFRESH
            </span>
          </div>
          <span
            data-ocid="predictions.toggle"
            style={{
              color: "var(--cb-muted)",
              fontSize: 16,
              padding: 4,
              lineHeight: 1,
              transition: "transform 0.2s",
              transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
              display: "inline-block",
            }}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Progress bar */}
      {!collapsed && (
        <div
          style={{
            height: 2,
            background: "var(--cb-dim)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, var(--cb-cyan), var(--cb-purple))",
              transition: "width 1s linear",
            }}
          />
        </div>
      )}

      {/* Table */}
      {!collapsed && (
        <div style={{ overflowX: "auto" }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 100px 80px 80px 110px 80px 90px",
              gap: 0,
              padding: "8px 16px",
              borderBottom: "1px solid var(--cb-border)",
              minWidth: 680,
            }}
          >
            {[
              "Coin",
              "Price",
              "Signal",
              "Confidence",
              "Target",
              "Est. Move",
              "Refresh In",
            ].map((h) => (
              <div
                key={h}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--cb-muted)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div
            data-ocid="predictions.list"
            style={{ maxHeight: 320, overflowY: "auto", minWidth: 680 }}
          >
            {predictions.length === 0 ? (
              <div
                data-ocid="predictions.empty_state"
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--cb-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                }}
              >
                Warming up prediction engine...
              </div>
            ) : (
              predictions.map((pred, idx) => {
                const meta = coinMeta[pred.coinId];
                const moveSign = pred.predictedMove >= 0 ? "+" : "";
                return (
                  <div
                    key={pred.coinId}
                    data-ocid={`predictions.item.${idx + 1}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "140px 100px 80px 80px 110px 80px 90px",
                      gap: 0,
                      padding: "9px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      alignItems: "center",
                      background:
                        idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.1)",
                      transition: "background 0.2s",
                    }}
                  >
                    {/* Coin */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: 13,
                          color: meta?.color ?? "var(--cb-cyan)",
                        }}
                      >
                        {meta?.icon ?? pred.coinId.toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--cb-text)",
                          }}
                        >
                          {pred.coinId.toUpperCase()}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 9,
                            color: "var(--cb-muted)",
                          }}
                        >
                          {meta?.name ?? ""}
                        </div>
                      </div>
                    </div>

                    {/* Current Price */}
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--cb-text)",
                      }}
                    >
                      {fmtPrice(pred.currentPrice)}
                    </div>

                    {/* Signal */}
                    <div>
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: 10,
                          fontWeight: 700,
                          color: sigColor(pred.signal),
                          background: sigBg(pred.signal),
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: `1px solid ${sigColor(pred.signal)}33`,
                        }}
                      >
                        {pred.signal}
                      </span>
                    </div>

                    {/* Confidence */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: "var(--cb-dim)",
                          borderRadius: 2,
                          overflow: "hidden",
                          maxWidth: 36,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pred.confidence}%`,
                            background: sigColor(pred.signal),
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 700,
                          color: sigColor(pred.signal),
                        }}
                      >
                        {Math.round(pred.confidence)}%
                      </span>
                    </div>

                    {/* Predicted Target */}
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color:
                          pred.predictedMove >= 0
                            ? "var(--cb-green)"
                            : "var(--cb-red)",
                      }}
                    >
                      {fmtPrice(pred.predictedPrice)}
                    </div>

                    {/* Est. Move */}
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          pred.predictedMove >= 0
                            ? "var(--cb-green)"
                            : "var(--cb-red)",
                      }}
                    >
                      {moveSign}
                      {pred.predictedMove.toFixed(2)}%
                    </div>

                    {/* Refresh In */}
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--cb-muted)",
                      }}
                    >
                      {fmtCountdown(nextRefreshIn)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Disclaimer */}
          <div
            data-ocid="predictions.disclaimer"
            style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--cb-border)",
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "var(--cb-muted)",
              lineHeight: 1.5,
            }}
          >
            ⚠️ DISCLAIMER: Predictions are algorithmic estimates for demo
            purposes only. Not financial advice.
          </div>
        </div>
      )}
    </div>
  );
}
