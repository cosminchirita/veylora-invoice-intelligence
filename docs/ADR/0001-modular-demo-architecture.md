# ADR 0001: Modular demo architecture with an explicit production boundary

- **Status:** Accepted
- **Date:** 2026-07-29
- **Decision owners:** Architecture, engineering, security and product

## Context

Veylora Invoice Intelligence must be easy to clone, open in VS Code, run locally and demonstrate to a prospective client. The current scope is an interactive product demo with synthetic Romanian invoice data, deterministic examples and no real financial-system credentials.

At the same time, the product story includes sensitive invoice processing, ANAF/SPV and ERP integrations, bank/payment reconciliation, human approval and audit evidence. Implementing those concerns as if browser state were authoritative would create misleading security and reliability claims. Building a full distributed platform before validating the workflow would make the demo expensive and difficult to understand.

We therefore need a boundary that preserves a small, dependable demonstration while making the production evolution unambiguous.

## Decision

We will use a **modular demo architecture**:

1. The repository's runnable demo remains a single web application with synthetic data and a small, side-effect-free domain engine.
2. Deterministic business helpers—money formatting/calculation, upload pre-validation, reconciliation scoring and demo audit chaining—remain independent of React so they can be unit tested.
3. UI presentation models and fixtures are not treated as database schemas or API contracts.
4. All hosted-demo integrations and operational indicators are visibly simulated. Real documents and credentials are out of scope.
5. Security- or finance-relevant production actions will be server-authoritative. Browser-only approval, audit, ingestion and matching logic will not be promoted to production.
6. Production will begin as a **modular monolith plus asynchronous workers**, backed by a transactional database, encrypted object storage and a durable event transport. Modules will be separated by domain API and ownership, not prematurely deployed as independent microservices.
7. Domain changes and integration events will use a transactional outbox; consumers will be idempotent. Delivery is at least once.
8. Reconciliation results will include canonical input revisions, deterministic features, reason codes and rule/configuration versions. AI/ML may assist candidate generation or anomaly prioritization, but it will not silently make payment-authorizing decisions.
9. Production audit evidence will use canonical serialization, HMAC-SHA-256 chaining with KMS-managed versioned keys, immutable checkpoints and continuous verification. The demo checksum is explicitly non-cryptographic.

## Why this option

- A single runnable application minimizes setup risk and keeps the client demonstration fast.
- A pure domain-engine boundary allows meaningful tests without a backend or browser.
- A modular monolith is simpler to transact, secure and operate than early microservices while team and throughput boundaries are still unknown.
- An outbox and idempotent consumers address the most important distributed-systems failure modes without pretending the transport provides exactly-once delivery.
- Versioned deterministic reconciliation is explainable to finance teams and reproducible for auditors.
- The explicit demo/production distinction prevents synthetic status cards and in-memory audit entries from being interpreted as certified controls.

## Alternatives considered

### Full microservices from the start

Rejected for the demo and initial production phase. It increases deployment, observability, identity and data-consistency complexity before workload and ownership boundaries are proven. Modules may be extracted later when independent scaling, regulatory isolation or team ownership justifies it.

### Browser-only/static application as the final architecture

Rejected for production. It cannot securely hold connector credentials, enforce tenant authorization, serialize decisions, provide durable audit evidence or guarantee workflow consistency.

### Non-deterministic AI as the primary reconciliation authority

Rejected. Model output alone is not stable enough for repeatable financial controls. ML can provide bounded signals with a model version and evidence, but deterministic invariants and human policy remain authoritative.

### Synchronous calls to every external system

Rejected as the integration backbone. External outages and rate limits would couple user-facing workflows to ANAF, ERP and banking availability. Durable ingestion, retries, idempotency and explicit reconciliation state provide safer degradation.

## Consequences

### Positive

- The repository stays approachable and demo-ready.
- Business examples are testable and reproducible.
- Production requirements are documented before clients rely on them.
- The first production deployment can preserve transactional consistency while workers isolate slow or unreliable integrations.
- Future service extraction can follow observed load and organizational boundaries.

### Trade-offs

- The demo resets on refresh and cannot support collaborative reviews.
- Some production interfaces are documented rather than executable.
- The same concept has different demo and production implementations (for example audit chaining), so labels and documentation must remain precise.
- A modular monolith requires enforced module boundaries to avoid becoming a tightly coupled codebase.

## Guardrails

- No real credentials, access tokens, client invoices or personal data enter fixtures, tests or repository history.
- Demo deployments display a demo/synthetic-data notice and do not claim production compliance.
- The UI must not label the current 32-bit demo checksum as SHA-256; either change the label to “demo checksum” or implement and verify the real algorithm server-side.
- New scoring behavior requires rule versioning and test vectors. Threshold changes are policy changes and must be audited in production.
- All future write APIs require authenticated tenant context, authorization, optimistic concurrency and idempotency.
- Module APIs own their data; read models may duplicate data but cannot authorize commands.
- Extraction to a service requires an operational reason, an owner, SLOs, a versioned contract and a migration/recovery plan.

## Evolution path

1. Keep the current demo stable, tested and synthetic.
2. Introduce canonical domain types, repository interfaces and server-side command handlers behind feature flags.
3. Add a transactional database, migrations, tenant scope, OIDC/RBAC and encrypted object storage.
4. Add durable ingestion workers, an outbox/inbox pattern, connector cursors and dead-letter handling.
5. Implement cryptographic audit chains, checkpoints, verification jobs and retention/legal-hold workflows.
6. Validate deterministic reconciliation with representative, de-identified client datasets and signed-off accounting tolerances.
7. Add ANAF/ERP/bank connectors in isolated environments with secrets management, observability and contract tests.
8. Extract services only when scaling, availability, residency or ownership requirements make the cost worthwhile.

## Verification

This decision is satisfied when the demo remains runnable without external systems, domain helpers have automated tests, production-only controls are not presented as implemented, and proposed production changes follow the boundaries and delivery semantics documented in `docs/ARCHITECTURE.md` and `docs/DOMAIN_MODEL.md`.

