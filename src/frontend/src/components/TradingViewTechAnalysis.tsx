import { useEffect, useRef } from "react";

interface Props {
  symbol: string;
}

export function TradingViewTechAnalysis({ symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: "1m",
      width: "100%",
      isTransparent: true,
      height: 450,
      symbol: symbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    });
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ height: "450px", width: "100%" }}
    />
  );
}
