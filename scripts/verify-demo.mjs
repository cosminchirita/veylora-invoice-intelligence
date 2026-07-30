import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { calculateExposure, validateInvoiceUpload } from "../lib/invoice-engine.mjs";

await import("./verify-i18n.mjs");

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [xml, json, csv, unsafeXml, dataSource, uiSource, i18nSource] = await Promise.all([
  read("samples/valid-invoice.xml"),
  read("samples/valid-invoice.json"),
  read("samples/erp-ledger.csv"),
  read("samples/rejected-xxe.xml"),
  read("lib/demo-data.ts"),
  read("app/integrity-platform.tsx"),
  read("lib/i18n.ts"),
]);

assert.equal(validateInvoiceUpload("valid-invoice.xml", xml).valid, true);
assert.equal(validateInvoiceUpload("valid-invoice.json", json).valid, true);
assert.equal(validateInvoiceUpload("erp-ledger.csv", csv).valid, true);
assert.equal(validateInvoiceUpload("rejected-xxe.xml", unsafeXml).code, "UNSAFE_XML");

const seededMinorUnits = [5_831_000, 3_189_250, 1_249_560, 14_603_230];
assert.equal(calculateExposure(seededMinorUnits.map((amountMinor) => ({ amountMinor, status: "Deschisă" }))), 24_873_040);
assert.match(dataSource, /DEMO_DATA_SOURCE\s*=\s*"SYNTHETIC_DEMO"/);
assert.match(uiSource, /Environment: Secure demo/);
assert.match(uiSource, /LanguageSelector/);
assert.match(i18nSource, /SUPPORTED_LOCALES = \["en", "ro", "de", "fr"\]/);
assert.doesNotMatch(uiSource, /Environment: Production/);

for (const expected of ["README.md", "SECURITY.md", "docs/ARCHITECTURE.md", ".github/workflows/ci.yml"]) {
  await read(expected);
}

console.log(`Demo integrity verified from ${join("samples", "valid-invoice.xml")}.`);
