import assert from "node:assert/strict";
import test from "node:test";
import {
  auditHash,
  calculateExposure,
  calculateMatchScore,
  calculateRisk,
  canonicalJson,
  formatMoney,
  normalizeTaxId,
  sanitizeSpreadsheetCell,
  validateInvoiceUpload,
  verifyAuditChain,
} from "../lib/invoice-engine.mjs";

test("calculează expunerea numai pentru facturile deschise", () => {
  assert.equal(calculateExposure([
    { status: "Critică", amountMinor: 5831000 },
    { status: "Aprobată", amountMinor: 10000 },
    { status: "Ridicat", amountMinor: 3189250 },
  ]), 9020250);
});

test("clasifică reconcilierea exactă și respinge moneda diferită", () => {
  assert.deepEqual(calculateMatchScore({ documentExact: true, partyExact: true, currencyMatch: true, amountDeltaMinor: 0, dateDeltaDays: 0, referenceSimilarity: 1 }), { score: 10000, classification: "EXACT" });
  assert.deepEqual(calculateMatchScore({ documentExact: true, partyExact: true, currencyMatch: false, amountDeltaMinor: 0, dateDeltaDays: 0 }), { score: 0, classification: "CONFLICT" });
});

test("validarea uploadului blochează XML extern și fișiere mari", () => {
  assert.equal(validateInvoiceUpload("invoice.xml", "<!DOCTYPE x [<!ENTITY y SYSTEM 'file:///etc/passwd'>]>").code, "UNSAFE_XML");
  assert.equal(validateInvoiceUpload("invoice.pdf", "pdf").code, "FORMAT_NOT_ALLOWED");
  assert.equal(validateInvoiceUpload("invoice.xml", "<Invoice/>", 6 * 1024 * 1024).code, "FILE_TOO_LARGE");
  assert.equal(validateInvoiceUpload("invoice.xml", "<Invoice/>").valid, true);
});

test("formatul monetar este localizat și auditul folosește SHA-256 determinist", async () => {
  assert.match(formatMoney(5831000), /58\.310,00/);
  const event = { action: "INVOICE_APPROVED", entity: "NVL-7712", actor: "Andrei Popescu" };
  const first = await auditHash("0".repeat(64), event);
  const repeated = await auditHash("0".repeat(64), event);
  const changed = await auditHash("f".repeat(64), event);
  assert.equal(first.length, 64);
  assert.equal(first, repeated);
  assert.notEqual(first, changed);
});

test("canonicalizarea, normalizarea și exportul sunt sigure", () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, b: 3 } }), '{"a":{"b":3,"y":2},"z":1}');
  assert.equal(normalizeTaxId("ro 18.472.931"), "RO18472931");
  assert.equal(sanitizeSpreadsheetCell("=HYPERLINK(\"https://evil.test\")"), "'=HYPERLINK(\"https://evil.test\")");
  assert.equal(sanitizeSpreadsheetCell("Nova Logistic SRL"), "Nova Logistic SRL");
});

test("motorul de risc este explicabil și plafonat", () => {
  assert.deepEqual(calculateRisk([
    { code: "DUPLICATE", points: 35, evidence: "same fingerprint" },
    { code: "TAX_INVALID", points: 30, evidence: "total mismatch" },
  ]), {
    score: 65,
    level: "HIGH",
    signals: [
      { code: "DUPLICATE", points: 35, evidence: "same fingerprint" },
      { code: "TAX_INVALID", points: 30, evidence: "total mismatch" },
    ],
  });
  assert.equal(calculateRisk([{ code: "A", points: 130, evidence: "cap" }]).score, 100);
});

test("verificarea lanțului detectează alterarea unui eveniment", async () => {
  const genesis = "0".repeat(64);
  const payloadA = { action: "IMPORTED", entity: "INV-1" };
  const hashA = await auditHash(genesis, payloadA);
  const payloadB = { action: "APPROVED", entity: "INV-1" };
  const hashB = await auditHash(hashA, payloadB);
  assert.equal(await verifyAuditChain([{ payload: payloadA, hash: hashA }, { payload: payloadB, hash: hashB }]), true);
  assert.equal(await verifyAuditChain([{ payload: { ...payloadA, entity: "INV-2" }, hash: hashA }, { payload: payloadB, hash: hashB }]), false);
});
