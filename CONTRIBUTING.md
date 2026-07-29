# Contributing

Thank you for helping improve Factura Integrity. Contributions should keep the demo understandable, secure, auditable, and safe to run with synthetic data.

## Before you start

- Search existing issues before opening a new one.
- Discuss substantial product, architecture, data-model, or dependency changes in an issue first.
- Report vulnerabilities privately according to `SECURITY.md`.
- Never commit credentials, tokens, `.env` files, real invoices, personal data, or customer information.

## Local setup

Requirements:

- Node.js 22;
- pnpm 10 (the CI currently uses 10.14.0).

```bash
corepack enable
corepack prepare pnpm@10.14.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Use synthetic fixtures only. Environment-specific values belong in an ignored local `.env` file; document required keys in `.env.example` without values.

## Quality checks

Run the same checks enforced by CI before opening a pull request:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm test
```

Add or update tests for behavior changes. For UI changes, verify the relevant desktop and narrow viewport flows and attach sanitized screenshots.

## Change guidelines

- Keep pull requests focused and explain the user impact and trade-offs.
- Preserve explainability for automated risk signals and human review paths.
- Validate untrusted input at system boundaries and fail safely.
- Do not log document contents, secrets, personal data, or banking data.
- Make privileged and financial decisions attributable and auditable.
- Avoid introducing production claims for simulated integrations or demo behavior.
- Commit lockfile changes with dependency changes.

## Pull requests

Complete the pull request template, link the relevant issue, and describe verification, risks, privacy impact, migrations, deployment, and rollback. At least one maintainer review is required. CI and security checks must pass before merge.

By participating, you agree to follow `CODE_OF_CONDUCT.md`.
