# Security Policy

Factura Integrity is currently a client-facing demonstration, not a production financial system. Use synthetic data only. Do not upload real invoices, personal data, banking information, authentication material, or confidential business records.

## Supported versions

Security fixes are provided for the latest release on the `main` branch.

| Version | Supported |
| --- | --- |
| Latest `0.1.x` | Yes |
| Earlier versions | No |

## Reporting a vulnerability

Do not disclose vulnerabilities in public issues, pull requests, discussions, screenshots, or logs.

Use GitHub's **Private vulnerability reporting** from the repository's **Security** tab. Include:

- the affected version or commit;
- a concise description and potential impact;
- reproducible steps or a minimal proof of concept;
- suggested mitigations, if known;
- whether any data or accounts may have been exposed.

If private vulnerability reporting is unavailable, contact the repository owner privately through the contact method shown on their GitHub profile. Never send secrets or real financial documents as evidence; use sanitized or synthetic examples.

The maintainers will acknowledge the report, assess severity, coordinate remediation, and publish a security advisory when appropriate. Response and remediation times depend on impact and project capacity; no fixed service-level commitment applies to this demo.

## Security boundaries

The hosted demo uses simulated data and integrations. It does not represent production-grade connectivity to ANAF/SPV, ERP systems, banks, identity providers, or an audited financial ledger. Before production use, the deployment requires a dedicated security review covering at least:

- strong identity, tenant isolation, and role-based authorization;
- encryption and managed secret storage;
- data minimization, retention, deletion, and data-subject workflows;
- tamper-evident audit trails and privileged-action monitoring;
- rate limits, abuse prevention, backup, recovery, and incident response;
- third-party, infrastructure, and regulatory risk assessments.

## Safe testing

Test only against systems and accounts you own or have explicit permission to assess. Avoid denial-of-service testing, social engineering, persistence, automated scanning of unrelated infrastructure, and access to other users' data. Stop testing and report immediately if sensitive information is encountered.
