const ALLOWED_EXTENSIONS = new Set(["xml", "csv", "json"]);

export function formatMoney(minorUnits, currency = "RON") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minorUnits / 100);
}

export function calculateExposure(invoices) {
  return invoices
    .filter((invoice) => invoice.status !== "Aprobată")
    .reduce((sum, invoice) => sum + invoice.amountMinor, 0);
}

export function calculateMatchScore(features) {
  if (!features.currencyMatch) return { score: 0, classification: "CONFLICT" };
  const tolerance = Math.max(features.toleranceMinor ?? 100, 1);
  const amountPoints = Math.max(
    0,
    Math.round(3000 * (1 - Math.min(features.amountDeltaMinor, tolerance) / tolerance)),
  );
  const datePoints = Math.max(0, Math.round(1000 * (1 - Math.min(features.dateDeltaDays, 30) / 30)));
  const score = Math.min(
    10000,
    (features.documentExact ? 3000 : 0) +
      (features.partyExact ? 2000 : 0) +
      amountPoints + datePoints + 500 +
      Math.round(500 * (features.referenceSimilarity ?? 0)),
  );
  const classification = score >= 9500 ? "EXACT" : score >= 7500 ? "PROBABLE" : "UNMATCHED";
  return { score, classification };
}

export function validateInvoiceUpload(filename, content, sizeBytes = content.length) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return { valid: false, code: "FORMAT_NOT_ALLOWED", message: "Sunt acceptate doar fișiere XML, CSV sau JSON." };
  }
  if (sizeBytes > 5 * 1024 * 1024) {
    return { valid: false, code: "FILE_TOO_LARGE", message: "Fișierul depășește limita de 5 MB." };
  }
  if (/<!DOCTYPE|<!ENTITY|SYSTEM\s+["']/i.test(content)) {
    return { valid: false, code: "UNSAFE_XML", message: "Fișierul XML conține declarații externe nesigure." };
  }
  if (!content.trim()) {
    return { valid: false, code: "EMPTY_FILE", message: "Fișierul este gol." };
  }
  return { valid: true, code: "VALID", message: "Fișier validat și pregătit pentru reconciliere." };
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function auditHash(previousHash, event) {
  const input = new TextEncoder().encode(`${previousHash}|${canonicalJson(event)}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function sanitizeSpreadsheetCell(value) {
  const text = String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export function normalizeTaxId(value) {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function calculateRisk(signals) {
  const score = Math.min(100, signals.reduce((total, signal) => total + Math.max(0, signal.points), 0));
  const level = score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
  return { score, level, signals: signals.map(({ code, points, evidence }) => ({ code, points, evidence })) };
}

export async function verifyAuditChain(events, genesisHash = "0".repeat(64)) {
  let previousHash = genesisHash;
  for (const event of events) {
    const calculated = await auditHash(previousHash, event.payload);
    if (calculated !== event.hash) return false;
    previousHash = event.hash;
  }
  return true;
}
