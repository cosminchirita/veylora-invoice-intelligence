# AI and automated decision governance

Veylora Invoice Intelligence is designed as a **decision-support system**, not as an autonomous authority for approving, rejecting, recording, or paying an invoice. In the demo, results are produced from deterministic rules and preconfigured data. No trained ML model is included.

## Principles

1. **Human control proportional to risk.** A critical alert must not be approved automatically.
2. **Explanation before decision.** The user sees the signal, evidence, and relevant sources.
3. **Probability and impact remain separate.** Confidence and severity are not synonyms.
4. **Verifiable provenance.** Every result identifies the data, rule or model, and version used.
5. **Reproducibility.** The same input and version must produce the same result for deterministic components.
6. **Contestability.** Authorized users can correct a result and document the reason.
7. **Data minimization.** Models receive only the attributes required for the stated purpose.
8. **Fail-safe behavior.** Missing data, an unavailable source, or model degradation leads to review, never automatic approval.

## Confidence, risk score, and severity

The three concepts must be displayed and evaluated separately:

| Concept | Question answered | Example | Use |
| --- | --- | --- | --- |
| Confidence | How strongly does the evidence support the finding? | 96% confidence that two documents are similar | determines whether the result may be recommended or must be reviewed |
| Risk score | How significant is the variance in the current context? | 92/100 | prioritizes the work queue; it is not a fraud probability |
| Severity | What level of operational response is required? | Critical | applies thresholds, service targets, and additional approvals |

Interpretation rules:

- `96% confidence` does not mean a `96% probability of fraud`;
- high risk may result from significant financial impact even when confidence is moderate;
- a low-confidence result must not be presented as a categorical conclusion;
- thresholds must be calibrated against each client's data and risk tolerance;
- no single value may permanently block a supplier or determine a legal consequence.

## Proposed automation levels

| Level | Example | Minimum control |
| --- | --- | --- |
| A0 — information | display e-Invoice status | source traceability |
| A1 — recommendation | flag a potential duplicate | explanation and contest option |
| A2 — triage | prioritize cases | approved thresholds and monitoring |
| A3 — reversible action | place an item temporarily on hold | authorized role, audit event, and expiry |
| A4 — financial action | approval or payment | outside the default scope; requires additional controls and explicit approval |

The demo operates at A0–A1 and simulates part of the A2 workflow. It performs no real banking or accounting action.

## Recommendation provenance

In production, every evaluation must preserve at least:

- the invoice identifier and normalized document version;
- source identifiers for SPV, ERP, supplier registry, and payment;
- ingestion timestamps and data-schema version;
- the fields used, or referenceable hashes of those fields;
- rule, model, vocabulary, and threshold-configuration versions;
- intermediate scores and the final explanation;
- the actor or service that triggered the evaluation;
- the human decision, reason, corrections, and related case;
- the run identifier and an end-to-end correlation ID.

Missing data must remain explicitly marked as missing rather than being silently imputed. Reprocessing must not overwrite an earlier evaluation; it creates a new version linked to the previous one.

## Model cards and component registry

Every component contributing to a recommendation requires a model card, including deterministic rules. The card is versioned with the code and contains:

- name, owner, and version;
- intended purpose and prohibited uses;
- input sources and data categories;
- outputs, thresholds, and score semantics;
- the population and period used for validation;
- global metrics and metrics for relevant segments;
- known limitations and failure modes;
- human-review requirements;
- approval and change history;
- monitoring, rollback, and retirement strategy.

### Current model card: `rules-v1.8` (demo)

| Field | Value |
| --- | --- |
| Type | deterministic demonstration engine |
| Purpose | illustrate reconciliation and explanations in the interface |
| Inputs | document identifier, supplier identity, currency, amount delta, date delta, and reference similarity |
| Outputs | matching score and `EXACT`, `PROBABLE`, `UNMATCHED`, or `CONFLICT` classification |
| Code thresholds | `EXACT ≥ 95%`, `PROBABLE ≥ 75%`; a currency mismatch produces `CONFLICT` |
| Statistical calibration | none; interface values are demonstrative |
| Permitted use | demonstrations, local testing, and product discussions |
| Prohibited use | real financial decisions, fraud allegations, or legal assessment of suppliers |

This card does not validate an ML model and must not be presented as evidence of production accuracy.

## Pre-production evaluation

Before a version may influence a real financial process, the following are mandatory:

1. define acceptable errors and the cost of false positives and false negatives;
2. create a representative evaluation set separated from development data;
3. measure precision, recall, abstention rate, and time saved across supplier and document categories;
4. validate thresholds with finance and risk/compliance teams;
5. test missing data, corrupted documents, currencies, and unusual VAT regimes;
6. perform adversarial testing for duplicates, manipulated data, and prompt injection if an LLM is introduced;
7. run in shadow mode with no operational impact before any automation;
8. obtain formal approval from product, security, privacy, and financial-control owners.

## Monitoring and incidents

Production monitoring must include:

- score distributions and alert rates;
- operator acceptance, rejection, and correction rates;
- precision and recall on subsequently labelled samples;
- field and supplier drift;
- version-to-version differences before promotion;
- latency, errors, abstentions, and unavailable sources;
- segments with disproportionate false-positive rates;
- unauthorized access or unusual exports.

When degradation or an incident occurs, the system enters a safe mode: it stops affected recommendations, preserves data and versions for investigation, rolls back to the approved version, and directs cases to manual control.

## Future use of an LLM

An LLM may assist with evidence summaries or search, but it must not be the source of truth for amounts, VAT, identities, or ANAF states. If introduced:

- inputs are treated as untrusted data;
- financial extraction is validated through schemas and deterministic rules;
- responses cite the source documents;
- prompts, model, and parameters are versioned;
- client data is not used for training without a lawful basis and explicit agreement;
- the model may abstain or state uncertainty;
- the financial decision remains separate from generated text.
