# Localization

Veylora Invoice Intelligence is English-first and currently supports four interface locales:

| Code | Interface language | Formatting locale |
| --- | --- | --- |
| `en` | English | `en-GB` |
| `ro` | Romanian | `ro-RO` |
| `de` | German | `de-DE` |
| `fr` | French | `fr-FR` |

## Runtime behaviour

- Server-rendered and first-visit content uses English.
- The language selector updates the interface without a page reload.
- The selected language is stored locally as `veylora.locale`.
- The document `lang` attribute follows the active locale for assistive technology.
- Currency, percentages, counts and display dates use the corresponding `Intl` locale.
- English remains the fallback if a translation key is unavailable.

The preference contains no personal or financial data and is not transmitted to an external service.

## Architecture

- `lib/i18n.ts` contains locale metadata, interface translations, domain-value translations and formatting helpers.
- `app/i18n-provider.tsx` owns locale state, persistence and the accessible language selector.
- Components request translated copy through `useI18n()` and keep business-state values independent from display labels.
- `scripts/verify-i18n.mjs` fails when a used message lacks an explicit German or French translation.

## Adding a language

1. Add the locale code to `SUPPORTED_LOCALES`, `LANGUAGE_OPTIONS` and `LOCALE_TAGS`.
2. Add a complete translation dictionary and domain mappings.
3. Extend the metadata alternate locales in `app/layout.tsx`.
4. Update `scripts/verify-i18n.mjs` to include the new dictionary in its coverage check.
5. Run the full quality gate with `pnpm check`.

Regulatory identifiers, legal entity names, invoice identifiers, tax identifiers, hashes and currency codes are intentionally not translated.
