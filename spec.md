# CryptoBot Pro — Live Demo

## Current State
The dashboard has a center column where the TradingView price chart and the Signal Hero (BUY/SELL/HOLD) are both keyed to `activeCoinId`, but they are placed hundreds of lines apart. The chart is below the BOT SIGNAL ALL COINS table, while the Signal Hero is above it. There is no single unified per-coin view.

## Requested Changes (Diff)

### Add
- A new `CoinChartSignal` combined section at the top of the center content column (above PredictionsPanel) that shows, for the currently selected coin:
  1. Coin header row: icon, name, symbol, live price, % change, signal badge
  2. TradingView price chart (existing `TradingViewChart` component) with 1M/5M/15M interval tabs
  3. BUY/SELL/HOLD signal block — confidence bars, entry/TP/SL grid, signal reason — from current `signal` state
- This section should update instantly when a different coin is clicked in the sidebar

### Modify
- Move the existing chart `<div>` and Signal Hero `<div>` into the new combined section (or replicate the JSX there), so the per-coin chart+signal is a coherent unit at the top of the main content area
- Retain the existing BOT SIGNAL ALL COINS table and PredictionsPanel below it
- Ensure the section has a clear visual heading: "COIN CHART + SIGNALS — [COIN NAME]"

### Remove
- Remove the standalone chart div and signal hero div from their current scattered positions in the center column (after moving them to the new combined section to avoid duplication)

## Implementation Plan
1. Extract the Signal Hero JSX block (~lines 1717–1921) and Chart JSX block (~lines 2160–2240) into a new combined `<div>` placed just below the stats strip, ordered as: coin header → chart → signal
2. Add a prominent section label that shows the active coin name
3. Remove the original positions of those two blocks
4. Validate the build
