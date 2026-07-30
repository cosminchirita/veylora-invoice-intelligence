import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders Veylora Invoice Intelligence", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Veylora Invoice Intelligence/);
  assert.match(html, /Explainable Invoice Control/);
  assert.match(html, /Integrity score/);
  assert.match(html, /aria-label="Language"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("document comparison is wired to an accessible dialog", async () => {
  const source = await readFile(new URL("../app/integrity-platform.tsx", import.meta.url), "utf8");
  assert.match(source, /className="compare-button" onClick=\{onCompare\}/);
  assert.match(source, /function DocumentComparisonModal/);
  assert.match(source, /aria-labelledby="comparison-title"/);
  assert.match(source, /5 of 6 key fields are identical/);
});

test("ships four European interface languages with English as the fallback", async () => {
  const source = await readFile(new URL("../lib/i18n.ts", import.meta.url), "utf8");
  assert.match(source, /SUPPORTED_LOCALES = \["en", "ro", "de", "fr"\]/);
  assert.match(source, /Română/);
  assert.match(source, /Deutsch/);
  assert.match(source, /Français/);
  assert.match(source, /translations\[locale\]\[source\] \?\? source/);
});
