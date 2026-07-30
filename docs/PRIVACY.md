# Privacy and data protection

This document describes the privacy principles for Veylora Invoice Intelligence and distinguishes demo capabilities from the requirements of a real implementation. It is not legal advice; the controller must confirm applicable obligations with its data protection officer and legal advisers.

## Demo status

- uses synthetic data embedded in the interface;
- has no live ANAF/SPV, ERP, or banking connectors;
- provides no operational persistence for imported invoices;
- state and events created in the interface are temporary;
- authentication for the presentation site is not equivalent to production application identity and authorization;
- must not be used with real invoices, national identifiers, IBANs, contracts, or other confidential information.

## Roles and responsibilities

Roles are established contractually for each client deployment:

- the client is generally the controller for its invoices and user data;
- the platform provider may act as a processor and process only documented instructions;
- hosting, observability, OCR, and AI providers are subprocessors and must be listed, assessed, and contracted;
- the lawful basis, purpose, and responsibilities for ANAF, ERP, and banking sources are documented separately.

Before a pilot, the processing inventory, data-processing agreement, subprocessor list, and—where risk requires it—a data protection impact assessment (DPIA) must be completed.

## Data categories

Data may include:

- supplier tax identifiers and commercial data;
- names, roles, and contact details of authorized people;
- invoice numbers, lines, quantities, prices, VAT, and due dates;
- IBANs and payment information;
- purchase orders, goods receipts, and ERP identifiers;
- e-Invoice messages and response codes;
- decisions, comments, actor identity, and audit events;
- technical security metadata such as IP address, session, and correlation ID.

An invoice may accidentally contain personal data in free-text fields or attachments. These fields require additional controls and must not be sent to AI services by default.

## Purpose limitation and minimization

Data is processed only for ingestion, validation, reconciliation, variance detection, case management, and audit. Mandatory principles:

- collect only the fields required for each control;
- separate the raw document from its normalized representation;
- exclude invoice bodies, tokens, certificates, and secrets from logs;
- aggregate or pseudonymize analytics data where possible;
- use synthetic data in development and test environments;
- make support access to client data temporary, justified, and audited.

## Retention and deletion

The “7 years” value displayed in the demo is an example policy, not a universal legal rule. In production, the client approves a retention matrix by category and jurisdiction.

| Category | Proposed starting policy | Notes |
| --- | --- | --- |
| original fiscal document | applicable legal obligation and client policy | use WORM or immutable retention where required |
| normalized data and reconciliation | aligned with the document and dispute period | may be reduced after case closure |
| cases and decisions | applicable financial-control and audit requirements | includes reason and actor |
| operational logs | 30–90 days | no sensitive financial content |
| security logs | 180–365 days, risk-based | access restricted to the security team |
| temporary/OCR files | minutes or hours | delete immediately after validated processing |
| backups | contractually defined window | automatic expiry and audited restoration |

Deletion must propagate through primary storage, indexes, caches, and backups within a documented window. A legal hold suspends deletion only for the necessary objects and period. Deletion and expiry are themselves audited events.

## Data-subject rights

The production architecture must support controlled search, export, correction, restriction, and deletion of personal data where fiscal obligations and the lawful basis permit. Requests are authenticated, approved, and recorded. The audit log is not rewritten; it may retain a minimal pseudonymized reference to the action performed.

## Security and access

Minimum production requirements:

- SSO/OIDC with MFA and session policies;
- RBAC/ABAC and separation of duties across operator, approver, auditor, and administrator roles;
- strict organization-level isolation across APIs, data, caches, and objects;
- TLS in transit and managed-key encryption at rest;
- secret-manager storage, rotation, and non-exportable access;
- protection against malware, XML external entities, decompression bombs, and polyglot files;
- short-lived signed document URLs;
- rate limiting, CSRF protection, and authorization checks for every object;
- masking of sensitive data in the interface and exports;
- encrypted backups and periodic restoration tests.

## Isolation, residency, and transfers

Data location, replication, backup, and observability services must be agreed before onboarding. Transfers outside the area approved by the client require an appropriate legal mechanism and provider assessment. Dedicated keys, verified logical separation, and regional deployment options are recommended for clients with strict requirements.

## AI and data use

- client data is not used to train general models without explicit agreement and a lawful basis;
- transfer to an AI provider is disabled by default until privacy and contractual assessment is complete;
- fields are minimized and pseudonymized before inference;
- prompts and responses are retained no longer than necessary;
- an LLM never receives ANAF tokens, ERP credentials, or full banking data;
- generated results are labelled and do not replace the source document;
- rights, retention, and deletion requirements also apply to derived data.

## Audit and transparency

A production audit event must contain the actor, action, object, time, reason, outcome, policy version, and correlation ID. Full document values are excluded. Access to the audit log and audit exports is also audited.

The demo hash chain is insufficient for non-repudiation. Depending on client requirements, production requires append-only storage, signatures or HMAC with rotated keys, trusted timestamps, and independent verification.

## Incidents and security breaches

The operating plan must cover detection, classification, containment, evidence preservation, impact assessment, stakeholder notification, and remediation. Notification deadlines are defined according to contractual roles and applicable law. Exercises should include cross-tenant access, export leakage, and connector compromise.

## Checklist before using real data

- [ ] data classification and the processing-activity record are approved;
- [ ] lawful bases, the data-processing agreement, and subprocessors are documented;
- [ ] a DPIA has been assessed and completed where required;
- [ ] residency, transfers, and encryption-key arrangements are agreed;
- [ ] SSO, MFA, roles, and separation of duties are tested;
- [ ] the retention matrix and end-to-end deletion are validated;
- [ ] logs and observability have been reviewed for sensitive data;
- [ ] connectors begin read-only and use least-privilege credentials;
- [ ] incident procedures and contacts are established;
- [ ] the pilot dataset is minimized and approved by the client.
