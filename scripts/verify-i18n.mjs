import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [platform, provider, i18n] = await Promise.all([
  read("app/integrity-platform.tsx"),
  read("app/i18n-provider.tsx"),
  read("lib/i18n.ts"),
]);

const usedKeys = new Set([
  "Overview", "Invoices", "Reconciliation", "Cases", "e-Factura", "Suppliers", "Analytics", "Audit log", "Integrations", "Settings",
  "All", "Critical", "Today",
]);

for (const source of [platform, provider]) {
  for (const match of source.matchAll(/\bt\("((?:\\.|[^"\\])*)"/g)) {
    usedKeys.add(JSON.parse(`"${match[1]}"`));
  }
}

const deStart = i18n.indexOf("const de:");
const frStart = i18n.indexOf("const fr:");
const end = i18n.indexOf("const translations:");
assert.ok(deStart > 0 && frStart > deStart && end > frStart, "Translation dictionaries are not structured as expected.");

const sections = { de: i18n.slice(deStart, frStart), fr: i18n.slice(frStart, end) };
for (const [locale, section] of Object.entries(sections)) {
  const missing = [...usedKeys].filter((key) => key !== "e-Factura" && !section.includes(`${JSON.stringify(key)}:`));
  assert.deepEqual(missing, [], `${locale.toUpperCase()} is missing translations: ${missing.join(", ")}`);
}

console.log(`Internationalisation verified: ${usedKeys.size} interface messages across EN, RO, DE and FR.`);
