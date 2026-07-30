# Roadmap to production

This roadmap evolves the demo into a controlled, observable, and auditable financial platform. The sequence is intentional: security and data foundations precede advanced automation. Timelines are estimates and must be agreed after a technical workshop with the first client.

## Current state — v0.1 demo

Available:

- responsive interface for the dashboard, invoices, reconciliation, cases, e-Invoice, suppliers, analytics, audit, and integrations;
- deterministic demonstration matching engine;
- explainable comparison of two documents;
- local XML, CSV, and JSON import with a 5 MB limit and basic anti-XXE protection;
- human confirmation before approving a critical-risk invoice;
- temporary audit events and CSV export protected against formula injection;
- automated tests for core functions and application rendering.

Not yet available:

- application-level authentication and authorization;
- multi-tenant persistence;
- live ANAF/SPV, ERP, or banking connectors;
- asynchronous processing, queues, retry handling, and distributed idempotency;
- secret management, operational encryption, and backups;
- a trained and validated ML model;
- production SLA/SLO commitments, observability, and incident procedures.

## Phase 1 — Pilot foundation

**Objective:** an isolated environment in which the client can evaluate the workflow with a minimal, controlled dataset.

- multi-tenant architecture with `tenant_id` enforced at every layer;
- managed PostgreSQL, migrations, and schemas for invoices, documents, cases, decisions, and events;
- encrypted object storage for original documents;
- SSO/OIDC, MFA, RBAC, and `Operator`, `Approver`, `Auditor`, and `Administrator` roles;
- separation of duties for high-impact cases;
- secret manager, rotation, and credential inventory;
- versioned API, strict validation, size limits, and malware scanning;
- persistent append-only audit log with correlation IDs;
- CI/CD with separated environments, dependency scans, and policy gates;
- backups, tested restoration, and a deletion procedure;
- synthetic dataset and reproducible seed for demonstrations.

**Exit criterion:** isolation, authorization, backup/restore tests, and the threat model are approved; there is no write access to client systems.

## Phase 2 — ANAF/SPV and e-Invoice connector

**Objective:** live, read-only, resilient, and traceable ingestion of documents and responses.

- clarify the applicable technical contract and authorization flow;
- manage certificates and tokens in a secret manager without log exposure;
- incremental synchronization with a watermark plus periodic full reconciliation;
- idempotency by external identifier and document hash;
- processing queue, retry with backoff, dead-letter queue, and controlled replay;
- store original payloads, responses, and provenance metadata;
- map error codes and provide an outage runbook;
- apply traffic limits and protection against duplicates and reordering;
- monitor synchronization delay, errors, and credential expiry.

**Exit criterion:** imports are compared with SPV over a pilot period without loss or duplication, and every document is traceable to its source response.

## Phase 3 — ERP connectors

**Objective:** read-only invoice–purchase-order–goods-receipt reconciliation.

- canonical contract for suppliers, orders, receipts, invoices, cost centers, and statuses;
- initial adapter for the client's ERP, such as SAP S/4HANA or SmartBill;
- versioned mappings and rules for currency, VAT, tolerances, units, and credit notes;
- controls for latency and missing data;
- three-way matching with field- and line-level explanations;
- deterministic reprocessing after mapping corrections;
- configuration portal with four-eyes approval for material thresholds.

**Exit criterion:** results on the labelled sample meet agreed thresholds, and exceptions are explainable and reproducible.

## Phase 4 — Banking data and payment reconciliation

**Objective:** match payments without initiating them.

- select a channel: Open Banking, bank API, MT940/camt.053, or controlled import;
- manage consent, authorization expiry, and read-only privileges;
- tokenize or mask IBANs and minimize transaction descriptions;
- apply idempotency and transaction deduplication;
- support one-to-one, one-to-many, partial-payment, and fee reconciliation;
- alert on supplier account changes with separate verification;
- add controls against business email compromise;
- enforce strict separation from any payment-initiation service.

**Exit criterion:** coverage and false positives are measured over a complete financial cycle; the application cannot initiate transfers.

## Phase 5 — Validated AI/ML

**Objective:** reduce manual triage without removing human control.

- rule and model registry with model cards;
- governed labelled dataset separated by period and supplier;
- anomaly detector for amount, frequency, account, and behavior;
- semantic line similarity only after deterministic value validation;
- confidence calibration and an abstention mechanism;
- explanations grounded in feature contributions and source documents;
- segment-level evaluation, shadow mode, and champion/challenger comparison;
- drift monitoring and per-version rollback;
- human feedback used only after verification and quality control.

**Exit criterion:** metrics and thresholds are approved by financial control, privacy, and security owners, while consequential actions remain human-in-the-loop.

## Phase 6 — Hardening and general availability

**Objective:** predictable operation for multiple clients and production volumes.

- SLOs for availability, latency, data freshness, and processing rate;
- dashboards, actionable alerts, tracing, and connector-level metrics;
- autoscaling, backpressure, and tenant-level limits;
- load tests, chaos testing, and disaster recovery;
- contractual RPO/RTO targets and restoration exercises;
- independent penetration testing and finding remediation;
- incident procedures, on-call rotation, and client communication;
- periodic access, secret, retention, and subprocessor reviews;
- operational documentation, training, and onboarding/offboarding criteria.

**Exit criterion:** SLOs are demonstrated during a stability period, security findings are closed, and runbooks have been exercised.

## Priority cross-cutting backlog

### Security

- threat model for uploads, connectors, multi-tenancy, and exports;
- antivirus checks, content sniffing, and compressed-archive controls;
- object-level authorization and IDOR testing;
- CSP, CSRF, rate limiting, and session protection;
- SBOM, artifact signing, and build provenance.

### Privacy and compliance

- processing-activity record and DPIA;
- configurable retention matrix with legal hold;
- residency and subprocessors by client;
- export/deletion workflows and request auditing;
- clear policies for using data with AI services.

### Auditability

- immutable, versioned events;
- signatures or HMAC, key rotation, and periodic verification;
- snapshots of rules and data used for each decision;
- signed exports and an independent verifier;
- documented time zones, clock synchronization, and causal ordering.

### Product experience

- guided onboarding with separated demo data;
- saved filters, search, and role-specific queues;
- accessible and printable document comparison;
- structured decision justifications;
- notifications that reveal no sensitive data;
- WCAG 2.2 AA accessibility and testing with finance users.

## Pilot success indicators

- median time to first review and case closure;
- percentage of invoices reconciled without conflict;
- precision, recall, and abstention rate for each alert type;
- value of confirmed duplicates without presenting it as guaranteed savings;
- operator correction rate for recommendations;
- data freshness and connector error count;
- percentage of decisions with complete evidence and justification;
- isolation or unauthorized-access incidents: target zero.

## Release principles

1. synthetic data before real data;
2. read-only connectors before any write-back;
3. shadow mode before automation;
4. one limited-volume workflow before expansion;
5. tested rollback before promotion;
6. commercial claims supported only by measured pilot metrics.
