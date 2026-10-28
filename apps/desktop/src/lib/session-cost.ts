import type { SessionCostSummary } from "@pi-desktop/shared";

/** Never turn missing/invalid prices into a claim of free use. */
export function formatSessionCost(cost: SessionCostSummary | undefined): string {
  if (!cost || !Number.isFinite(cost.knownCost) || cost.knownCost < 0 ||
      !Number.isInteger(cost.unpricedRequests) || cost.unpricedRequests < 0) return "—";
  if (cost.unpricedRequests > 0 && cost.knownCost === 0) return "—";
  if (cost.unpricedRequests === 0 && cost.knownCost > 0 && cost.knownCost < 0.0001) return "<$0.0001";
  const shown = cost.unpricedRequests > 0 && cost.knownCost <= Number.MAX_VALUE / 10000 ? Math.floor(cost.knownCost * 10000) / 10000 : cost.knownCost;
  return `${cost.unpricedRequests > 0 ? "≥" : "≈"}$${shown.toFixed(4)}`;
}
