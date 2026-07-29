## Summary

Describe what changed, why it is needed, and the user or operational impact.

## Verification

List the checks performed and any important test scenarios.

- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] `pnpm test`

## Risk and privacy review

- [ ] The change contains no credentials, tokens, real invoices, personal data, or confidential customer information.
- [ ] Authorization, input validation, auditability, and failure modes were considered where relevant.
- [ ] New dependencies are necessary, maintained, and pinned through the lockfile.
- [ ] User-facing or architectural changes are documented.
- [ ] Screenshots or recordings are attached for visual changes and contain only synthetic data.

## Deployment and rollback

Describe configuration changes, migration requirements, observability impact, and how to roll back safely. Write "Not applicable" when none are required.

## Related issue

Closes #
