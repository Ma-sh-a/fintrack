import { RISK_WEIGHTS } from "./marketData";

export function enrichAsset(asset) {
  const quantity = Number(asset.quantity || 0);
  const currentPrice = Number(asset.currentPrice || 0);
  const purchasePrice = Number(asset.purchasePrice || 0);
  const value = quantity * currentPrice;
  const cost = quantity * purchasePrice;
  const pnl = value - cost;
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
  return { ...asset, value, cost, pnl, pnlPct };
}

export function portfolioTotals(enrichedAssets) {
  const totalValue = enrichedAssets.reduce((s, a) => s + a.value, 0);
  const totalCost = enrichedAssets.reduce((s, a) => s + a.cost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  return { totalValue, totalCost, totalPnl, totalPnlPct };
}

export function calcRiskScore(enrichedAssets) {
  const totalValue = enrichedAssets.reduce((s, a) => s + a.value, 0);
  if (totalValue === 0) return null;
  const weighted = enrichedAssets.reduce(
    (s, a) => s + (RISK_WEIGHTS[a.type] || 2) * a.value,
    0,
  );
  return weighted / totalValue;
}

export function groupSum(items, keyFn, valueFn) {
  const PALETTE = [
    "#832D51",
    "#EA6993",
    "#447A5F",
    "#F6C94D",
    "#CFDD9D",
    "#F8CAE4",
  ];
  const map = new Map();
  items.forEach((it) => {
    const key = keyFn(it) || "Не указано";
    map.set(key, (map.get(key) || 0) + valueFn(it));
  });
  return Array.from(map.entries()).map(([name, value], i) => ({
    name,
    value,
    color: PALETTE[i % PALETTE.length],
  }));
}
