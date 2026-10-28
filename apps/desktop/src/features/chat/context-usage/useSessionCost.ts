import { useEffect, useState } from "react";
import type { SessionCostSummary, UiMessage } from "@pi-desktop/shared";
import { api } from "../../../lib/api";

/** Read the durable ledger, independently of the currently loaded transcript page. */
export function useSessionCost(sessionId: string | undefined, messages: UiMessage[], running: boolean) {
  const [result, setResult] = useState<{ sessionId: string; cost?: SessionCostSummary }>();
  // Token deltas don't trigger reads; final usage reports and run settlement do.
  const revision = messages.filter(message => message.usage).map(message =>
    `${message.id}:${message.usage?.totalTokens}:${message.usage?.cost?.total}`,
  ).join("|");
  useEffect(() => {
    if (!sessionId) return;
    let disposed = false;
    let request = 0;
    const refresh = () => {
      const current = ++request;
      void api.getSession(sessionId, { messageLimit: 1, contentLimit: 1 }).then(
        ({ session }) => { if (!disposed && current === request) setResult({ sessionId, cost: session?.sessionCost }); },
        () => { if (!disposed && current === request) setResult({ sessionId }); },
      );
    };
    refresh();
    // While active, background child usage and persistence can settle without
    // a new transcript row. Refresh the ledger, never infer bills from deltas.
    const timer = running ? window.setInterval(refresh, 5000) : undefined;
    return () => { disposed = true; if (timer !== undefined) window.clearInterval(timer); };
  }, [sessionId, revision, running]);
  return result?.sessionId === sessionId ? result?.cost : undefined;
}
