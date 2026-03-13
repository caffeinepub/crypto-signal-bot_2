import { useEffect, useRef } from "react";

interface Props {
  symbol: string;
}

export function TradingViewTicker({ symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: "100%",
      locale: "en",
      dateRange: "12M",
      colorTheme: "dark",
      trendLineColor: "rgba(41, 98, 255, 1)",
      underLineColor: "rgba(41, 98, 255, 0.3)",
      underLineBottomColor: "rgba(41, 98, 255, 0)",
      isTransparent: true,
      autosize: true,
    });
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ height: "80px", width: "100%" }}
    />
  );
}
