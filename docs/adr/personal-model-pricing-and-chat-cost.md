# ADR: Personal fork: model pricing overrides and chat cost display

- Status: Accepted
- Date: 2026-10-28

## Context

The runtime already records native token costs and physical request identities,
but the desktop does not expose their total or allow custom gateway rates.

## Decision

Add an optional `costOverride` to the existing provider-local ModelBinding JSON.
Its input/output/cacheRead/cacheWrite fields are nonnegative USD per million
tokens. Host validation rejects invalid prices; persistence uses the existing
provider config and requires no schema migration. The central model binding
projection installs these as explicit flat native prices, replacing tiers.
Absent overrides preserve existing pricing. Existing recorded costs are never
repriced; edits apply to future requests. Provider copies preserve overrides.

Expose optional `sessionCost` on SessionDetail: `knownCost` and
`unpricedRequests`. Host-core derives it from the durable turn ledger across
all turns, independent of transcript pagination. Physical request identities
are deduplicated, and legacy aggregates remain separate rather than replacing
one another. Missing/invalid pricing is counted, never presented as free.
Forked conversations start without the source conversation's billing ledger.
The read boundary drains pending persistence writes before serving the total.

The composer context control displays the USD estimate and the inspector
explains incomplete pricing. Reads are scoped to the active session and stale
responses are ignored. While running, a bounded transcript read refreshes the
ledger every five seconds; final usage and run settlement also refresh it.
Native/remote hosts that do not supply the additive field show unavailable.

This does not change the process model, pricing authority, usage identities,
provider request shape, or the existing Bedrock cache-key compatibility fix.

## Consequences

The estimate reflects recorded request prices, rather than a provider invoice.
Missing rates remain explicit, and price edits do not reprice historical bills.
The optional fields preserve older providers and hosts without a migration.
