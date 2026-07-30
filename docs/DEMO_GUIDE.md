# Demonstration guide

This guide provides a 5–7 minute walkthrough of **Veylora Invoice Intelligence** for a prospective client, technical partner, or evaluator. The current version is a functional demo using synthetic data: it does not transmit documents to ANAF, read from an ERP, or initiate bank payments.

## Demonstration objective

In fewer than seven minutes, the audience should understand three things:

1. the platform brings invoices, reconciliation, and e-Invoice responses into one workspace;
2. every alert presents evidence and keeps severity separate from confidence;
3. the human decision and its context can be traced in the audit log.

## Preparation

- start the application according to the README;
- use a browser window of at least 1280 × 800 px;
- do not upload real invoices, personal data, or confidential business information;
- reload the page before the demonstration to restore the initial dataset;
- keep demo invoice `NVL-7712` available as the primary reference.

## Recommended walkthrough — 5–7 minutes

### 0:00–0:45 — Context and value

Open **Overview** and briefly explain the problem:

> Finance teams verify the same information across SPV, the ERP, and bank statements. Veylora Invoice Intelligence brings those signals together, prioritizes financial impact, and preserves a trace of every decision.

Point out, without reading every value:

- the integrity score;
- the number of invoices requiring a decision;
- the exposed financial impact;
- the e-Invoice flow and automated reconciliation status.

State that the values are demonstrative and do not represent an active ANAF connection.

### 0:45–2:15 — Explainable alert

In **Needs your attention**, select **Analyze** for `NVL-7712`.

Present:

- **Critical** severity and the `92/100` risk score;
- the flag reason: a potential duplicate;
- `96%` confidence as a measure distinct from severity;
- verifiable evidence: tax ID, amount, date, and line similarity;
- the score composition: rules, anomalies, supplier history, and data quality.

Suggested wording:

> Severity estimates consequence and operational priority. Confidence indicates how strongly the evidence supports the finding. An alert may have a high impact but modest confidence, in which case it must be sent for review.

### 2:15–3:30 — Document comparison

Select **Compare documents**.

Highlight the comparison between `NVL-7712` and `NVL-7688`:

- supplier, tax ID, date, total, and lines are identical;
- the document number differs;
- the displayed similarity is `99.4%`;
- the recommendation is to review the original document, not to reject it automatically.

Close the comparison with **Got it · close**.

### 3:30–4:30 — Human control

Select **Approve invoice** and show that a critical-risk approval is blocked until the evidence review is confirmed. Add a demo comment, for example:

> Reissue confirmed against the original document; the previous invoice was cancelled.

Confirm only if you want to demonstrate decision recording. Alternatively, use **Open case** to present escalation to an investigation.

Key message:

> The system recommends and explains; approval remains the responsibility of an authorized user.

### 4:30–5:30 — Auditability

Open **Audit log** and show:

- the actor, time, action, entity, and outcome;
- the demo hash linkage between events;
- CSV export with protection against executable spreadsheet formulas.

Explain the boundary: the demo chain detects accidental changes during the current session, but it is not yet a persistent, signed, or externally anchored cryptographic ledger.

### 5:30–6:30 — Import and integrations

Open **Upload invoice** and present the XML, CSV, and JSON formats, the 5 MB limit, and anti-XXE validation. Do not upload a real document during a public presentation.

Then open **Integrations** to show the ANAF/SPV, ERP, and banking directions. State explicitly that these are demo cards and that production connectors are covered by the roadmap.

### 6:30–7:00 — Close

Finish with the business outcome:

> Veylora Invoice Intelligence reduces triage time, explains why an invoice was flagged, and preserves an auditable decision. The next step is an isolated pilot using minimized data and read-only connectors to the client's systems.

## Frequently asked questions

### Is it already connected to ANAF?

No. The interface simulates SPV/e-Invoice states. A live connector requires the applicable API contract, authentication, certificate or token management, retry handling, idempotency, and monitoring.

### Does it use artificial intelligence?

The demo uses a deterministic reconciliation engine and preconfigured data to produce explanations. The current version does not include a trained ML model that makes financial decisions. The proposed architecture can later support anomaly and similarity models governed according to `AI_GOVERNANCE.md`.

### Can it approve or pay invoices automatically?

No. The demo simulates approval in the interface and does not initiate payments. Production requires roles, separation of duties, approval policies, and client-specific controls.

### Is the data persisted?

Not in this version. State is local and temporary. Reloading the page may restore the initial demo dataset.

### Is it production-ready?

Not yet. It is a presentation-ready, testable demo. Production requirements are described in `ROADMAP.md`, with privacy and governance conditions covered in the dedicated documents.

## Claims to avoid during a presentation

- that the platform is certified or approved by ANAF;
- that the scores are statistically validated ML predictions;
- that the current audit log provides legal non-repudiation;
- that demo data is persistently stored, encrypted, or isolated per client;
- that the product can replace human financial, legal, or tax controls.
