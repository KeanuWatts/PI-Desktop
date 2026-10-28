import assert from "node:assert/strict";
import test from "node:test";
import { formatSessionCost } from "../src/lib/session-cost.ts";

test("chat cost formats known, zero, tiny, and partially priced totals honestly", () => {
  assert.equal(formatSessionCost({ knownCost: 1.25, unpricedRequests: 0 }), "≈$1.2500");
  assert.equal(formatSessionCost({ knownCost: 0, unpricedRequests: 0 }), "≈$0.0000");
  assert.equal(formatSessionCost({ knownCost: 0.00001, unpricedRequests: 0 }), "<$0.0001");
  assert.equal(formatSessionCost({ knownCost: 1.23459, unpricedRequests: 2 }), "≥$1.2345");
  assert.equal(formatSessionCost({ knownCost: 0, unpricedRequests: 1 }), "—");
});
test("missing or malformed cost metadata is never displayed as zero", () => {
  assert.equal(formatSessionCost(undefined), "—");
  for (const knownCost of [-1, NaN, Infinity]) assert.equal(formatSessionCost({ knownCost, unpricedRequests: 0 }), "—");
  for (const unpricedRequests of [-1, 0.5, NaN]) assert.equal(formatSessionCost({ knownCost: 1, unpricedRequests }), "—");
});
