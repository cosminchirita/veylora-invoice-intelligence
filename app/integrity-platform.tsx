"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { auditHash, calculateExposure, sanitizeSpreadsheetCell, validateInvoiceUpload } from "../lib/invoice-engine.mjs";
import { initialAudit, initialInvoices, navGroups, type AuditEvent, type Invoice, type Severity, type View } from "../lib/demo-data";
import { I18nProvider, LanguageSelector, useI18n } from "./i18n-provider";

type Filter = "all" | "critical" | "today";

const NAV_LABELS: Record<View, string> = {
  overview: "Overview",
  invoices: "Invoices",
  reconciliation: "Reconciliation",
  cases: "Cases",
  efactura: "e-Factura",
  suppliers: "Suppliers",
  analytics: "Analytics",
  audit: "Audit log",
  integrations: "Integrations",
  settings: "Settings",
};

function riskClass(severity: Severity) {
  return severity === "Critic" ? "critical" : severity === "Ridicat" ? "high" : severity === "Mediu" ? "medium" : "low";
}

function Sparkline({ values, tone }: { values: number[]; tone: string }) {
  return <div className={`sparkline ${tone}`} aria-hidden="true">{values.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>;
}

function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

export function IntegrityPlatform() {
  return <I18nProvider><PlatformContent /></I18nProvider>;
}

function PlatformContent() {
  const { domain, localeTag, money, t } = useI18n();
  const [activeView, setActiveView] = useState<View>("overview");
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [comment, setComment] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [auditEvents, setAuditEvents] = useState(initialAudit);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleInvoices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(localeTag);
    return invoices.filter((invoice) => {
      const searchable = `${invoice.supplier} ${invoice.id} ${invoice.cif} ${domain(invoice.reason)}`.toLocaleLowerCase(localeTag);
      const matchesSearch = !query || searchable.includes(query);
      const matchesFilter = filter === "all" || (filter === "critical" && invoice.severity === "Critic") || (filter === "today" && invoice.due === "Astăzi");
      return matchesSearch && matchesFilter;
    });
  }, [domain, filter, invoices, localeTag, search]);

  const exposure = calculateExposure(initialInvoices.slice(0, 4));
  const kpis = [
    { label: t("Integrity score"), value: new Intl.NumberFormat(localeTag, { minimumFractionDigits: 1 }).format(94.2), suffix: "/100", note: t("+2.1 vs previous period"), tone: "positive", spark: [34, 42, 39, 55, 49, 66, 73] },
    { label: t("Requires decision"), value: "18", suffix: t("invoices"), note: t("6 critical · 4 due today"), tone: "warning", spark: [58, 48, 61, 52, 44, 38, 31] },
    { label: t("Financial impact"), value: money(24_873_040).replace(/\s?RON|RON\s?/u, "").trim(), suffix: "RON", note: t("Exposed amount, not confirmed loss"), tone: "neutral", spark: [29, 41, 37, 52, 48, 57, 43] },
    { label: t("e-Invoice delivery"), value: new Intl.NumberFormat(localeTag, { style: "percent", minimumFractionDigits: 1 }).format(0.987), suffix: "", note: t("154 of 156 accepted by ANAF"), tone: "positive", spark: [62, 68, 63, 74, 78, 76, 84] },
  ];

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  }

  async function appendAudit(action: string, entity: string, result: string) {
    const previousHash = auditEvents[0]?.hash.padEnd(64, "0") ?? "0".repeat(64);
    const base = { action, entity, actor: "Andrei Popescu", result };
    const hash = await auditHash(previousHash, base);
    const nextSequence = Number(auditEvents[0]?.id.split("-")[1] ?? 8094) + 1;
    setAuditEvents((current) => [{ id: `EV-${nextSequence}`, time: "29 Jul 2026, now", ...base, hash }, ...current]);
  }

  async function approveInvoice() {
    if (!selectedInvoice || (selectedInvoice.risk >= 90 && !verified)) return;
    setInvoices((items) => items.map((invoice) => invoice.id === selectedInvoice.id ? { ...invoice, status: "Aprobată", reason: "Decizie confirmată de operator" } : invoice));
    await appendAudit("Invoice approved", selectedInvoice.id, `Success${comment ? " · comment recorded" : ""}`);
    setSelectedInvoice((invoice) => invoice ? { ...invoice, status: "Aprobată", reason: "Decizie confirmată de operator" } : invoice);
    setApproveOpen(false);
    setVerified(false);
    setComment("");
    notify(t("The invoice was approved. The decision and evidence were recorded in the audit log."));
  }

  async function processUpload() {
    if (!uploadFile) {
      setUploadError(t("Select an XML, CSV or JSON file."));
      return;
    }
    const content = await uploadFile.text();
    const validation = validateInvoiceUpload(uploadFile.name, content, uploadFile.size);
    const validationMessages: Record<string, string> = {
      FORMAT_NOT_ALLOWED: t("Only XML, CSV or JSON files are accepted."),
      FILE_TOO_LARGE: t("The file exceeds the 5 MB limit."),
      UNSAFE_XML: t("The XML file contains unsafe external declarations."),
      EMPTY_FILE: t("The file is empty."),
    };
    if (!validation.valid) {
      setUploadError(validationMessages[validation.code] ?? validation.message);
      return;
    }
    if (invoices.some((invoice) => uploadFile.name.toLowerCase().includes(invoice.id.toLowerCase()))) {
      setUploadError(t("This document already exists. The duplicate import was stopped safely."));
      return;
    }
    const imported: Invoice = {
      id: `IMP-${String(invoices.length + 101).padStart(4, "0")}`,
      supplier: "Imported supplier",
      cif: "Validation pending",
      reason: "Document validated · reconciliation in progress",
      amountMinor: 0,
      risk: 0,
      severity: "Scăzut",
      due: "—",
      status: "Processing",
      anaf: "Not submitted",
      confidence: 0,
      match: "In progress",
    };
    setInvoices((items) => [imported, ...items]);
    await appendAudit("Document imported", imported.id, "Structural validation passed");
    setUploadOpen(false);
    setUploadFile(null);
    setUploadError("");
    notify(t("The document was validated and added to the reconciliation flow."));
  }

  async function exportAudit() {
    const rows = [[t("Event"), t("Date and time"), t("Actor"), t("Action"), t("Entity"), t("Result"), "Hash"], ...auditEvents.map((event) => [event.id, domain(event.time), event.actor, domain(event.action), event.entity, domain(event.result), event.hash])];
    const csv = rows.map((row) => row.map((cell) => `"${sanitizeSpreadsheetCell(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `veylora-audit-evidence-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    await appendAudit("Audit exported", "AUDIT-2026-07-29", `${auditEvents.length} events`);
    notify(t("The audit report was generated with CSV formula protection."));
  }

  function selectView(view: View) {
    setActiveView(view);
    setMobileNav(false);
    setSelectedInvoice(null);
  }

  return (
    <div className="platform-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <button className="sidebar-close" onClick={() => setMobileNav(false)} aria-label={t("Close menu")}>×</button>
        <div className="brand"><span className="brand-mark">VY</span><span><strong>Veylora</strong><small>INVOICE INTELLIGENCE</small></span></div>
        <div className="workspace-card"><span className="workspace-avatar">NR</span><span><strong>Nordic Retail</strong><small>România SRL</small></span><button aria-label={t("Change organisation")}>⌄</button></div>
        <nav aria-label={t("Primary navigation")}>
          {navGroups.map((group, groupIndex) => (
            <div className="nav-group" key={groupIndex}>
              {group.map((item) => (
                <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => selectView(item.id as View)}>
                  <span className="nav-icon">{item.icon}</span><span>{t(NAV_LABELS[item.id as View])}</span>{"badge" in item && <em>{item.badge}</em>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-trust"><div className="trust-ring">✓</div><div><strong>{t("Verified audit")}</strong><small>{t("Integrity chain intact · 8,094 events")}</small></div></div>
        <div className="user-mini"><span>AP</span><div><strong>Andrei Popescu</strong><small>{t("Administrator")}</small></div><button aria-label={t("User menu")}>•••</button></div>
      </aside>

      {mobileNav && <button className="mobile-backdrop" onClick={() => setMobileNav(false)} aria-label={t("Close menu")} />}

      <section className="app-stage">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)} aria-label={t("Open menu")}>☰</button>
          <button className="environment" onClick={() => notify(t("This is a demo environment with synthetic data."))}><span /> {t("Environment: Secure demo")} <b>⌄</b></button>
          <label className="global-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Search invoice number, tax ID or supplier…")} aria-label={t("Global search")} /><kbd>⌘ K</kbd></label>
          <div className="top-actions">
            <LanguageSelector />
            <button className="icon-button" aria-label={t("Help")} onClick={() => notify(t("The demo guide is available in docs/DEMO_GUIDE.md."))}>?</button>
            <button className="icon-button notification" aria-label={t("Notifications")} onClick={() => notify(t("You have 3 demo notifications; none are sent to external services."))}>♧<i /></button>
            <div className="top-profile">AP</div>
          </div>
        </header>

        <main className="main-content">
          {activeView === "overview" && (
            <>
              <div className="page-heading">
                <div><p className="eyebrow">{t("WEDNESDAY, 29 JULY")}</p><h1>{t("Good morning, Andrei")}</h1><p>{t("You have")} <strong>18 {t("invoices")}</strong> {t("requiring a decision, with a potential impact of")} <strong>{money(exposure)}</strong>.</p></div>
                <div className="heading-actions"><div className="sync-pill"><span /> {t("Simulated SPV")} <small>{t("demo data")}</small></div><button className="secondary-button" onClick={() => notify(t("The demo period is fixed to the last 30 days."))}>{t("Last 30 days")}⌄</button><button className="primary-button" onClick={() => setUploadOpen(true)}>＋ {t("Upload invoice")}</button></div>
              </div>

              <section className="kpi-grid" aria-label={t("Key indicators")}>
                {kpis.map((kpi, index) => <button className="kpi-card" key={kpi.label} onClick={() => index === 1 && setFilter("critical")} title={kpi.note}><div className="kpi-title"><span>{kpi.label}</span><i>i</i></div><div className="kpi-value"><strong>{kpi.value}</strong><span>{kpi.suffix}</span></div><div className={`kpi-note ${kpi.tone}`}>{index === 0 || index === 3 ? "↗" : index === 1 ? "↓" : "•"} {kpi.note}</div><Sparkline values={kpi.spark} tone={kpi.tone} /></button>)}
              </section>

              <div className="dashboard-grid">
                <section className="panel attention-panel">
                  <div className="panel-head"><div><h2>{t("Needs your attention")}</h2><p>{t("Prioritised by risk, due date and financial impact")}</p></div><button className="text-button" onClick={() => selectView("cases")}>{t("View all cases")} →</button></div>
                  <div className="table-toolbar"><div className="segment-control">{(["all", "critical", "today"] as Filter[]).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{t(item === "all" ? "All" : item === "critical" ? "Critical" : "Today")} <span>{item === "all" ? 18 : item === "critical" ? 6 : 4}</span></button>)}</div><button className="filter-button" onClick={() => { setFilter("critical"); notify(t("The critical-invoice filter has been applied.")); }}>≡ {t("Filters")}</button></div>
                  <InvoiceTable invoices={visibleInvoices.slice(0, 5)} onAnalyze={setSelectedInvoice} />
                </section>

                <aside className="insight-column">
                  <section className="panel flow-card"><div className="panel-head compact"><div><h2>{t("e-Invoice flow")}</h2><p>{t("Today · 156 documents")}</p></div><button className="dots" aria-label={t("e-Invoice flow")}>•••</button></div><div className="delivery-row"><div className="donut"><span><strong>{new Intl.NumberFormat(localeTag, { style: "percent", minimumFractionDigits: 1 }).format(0.987)}</strong><small>{t("delivered")}</small></span></div><div className="delivery-legend"><p><i className="dot accepted" />{t("Accepted")} <b>154</b></p><p><i className="dot pending" />{t("Processing")} <b>1</b></p><p><i className="dot rejected" />{t("Rejected")} <b>1</b></p></div></div><button className="warning-link" onClick={() => selectView("efactura")}><span>!</span><div><strong>{t("1 rejected transmission")}</strong><small>{t("ANAF code: BR-RO-120")}</small></div><b>→</b></button></section>
                  <section className="panel match-card"><div className="panel-head compact"><div><h2>{t("Automated reconciliation")}</h2><p>{t("Invoice ↔ ERP ↔ payment")}</p></div><StatusPill tone="success">91.6%</StatusPill></div><div className="stack-bar"><span className="matched" style={{ width: "91.6%" }} /><span className="partial" style={{ width: "6%" }} /><span className="unmatched" style={{ width: "2.4%" }} /></div><div className="match-stats"><div><strong>1,284</strong><small>{t("Exact")}</small></div><div><strong>84</strong><small>{t("Partial")}</small></div><div><strong>34</strong><small>{t("Unmatched")}</small></div></div><button className="full-outline" onClick={() => selectView("reconciliation")}>{t("Open reconciliation")} <span>→</span></button></section>
                </aside>
              </div>

              <section className="activity-strip"><div className="activity-title"><span className="pulse-icon">⌁</span><div><strong>{t("Recent activity")}</strong><small>{t("Real-time updates")}</small></div></div>{auditEvents.slice(0, 3).map((event, index) => <div className="activity-item" key={event.id}><span className={`activity-avatar a${index}`}>{event.actor.split(" ").map((name) => name[0]).join("").slice(0, 2)}</span><p><strong>{event.actor}</strong> {domain(event.action).toLocaleLowerCase(localeTag)} <b>{event.entity}</b><small>{domain(event.time)}</small></p></div>)}</section>
            </>
          )}

          {activeView !== "overview" && <WorkspaceView view={activeView} invoices={visibleInvoices} auditEvents={auditEvents} onAnalyze={setSelectedInvoice} onUpload={() => setUploadOpen(true)} onExport={exportAudit} onNotify={notify} />}
        </main>
      </section>

      {selectedInvoice && <InvoiceDrawer invoice={selectedInvoice} onClose={() => { setSelectedInvoice(null); setCompareOpen(false); }} onApprove={() => setApproveOpen(true)} onCompare={() => setCompareOpen(true)} onCase={() => { void appendAudit("Case opened", selectedInvoice.id, "Assigned to Ioana Marinescu"); notify(t("Case C-2026-0184 was assigned to Ioana Marinescu.")); }} />}
      {compareOpen && selectedInvoice && <DocumentComparisonModal invoice={selectedInvoice} onClose={() => setCompareOpen(false)} />}

      {approveOpen && selectedInvoice && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="approve-title"><div className="modal-card">
          <button className="modal-close" onClick={() => setApproveOpen(false)} aria-label={t("Close")}>×</button><span className="modal-icon">✓</span>
          <h2 id="approve-title">{t("Confirm approval")}</h2><p>{t("Invoice {id} from {supplier}, amounting to {amount}.", { id: selectedInvoice.id, supplier: selectedInvoice.supplier, amount: money(selectedInvoice.amountMinor) })}</p>
          {selectedInvoice.risk >= 90 && <label className="verification-check"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /><span><strong>{t("I reviewed the flagged evidence")}</strong><small>{t("The risk is critical ({risk}/100). Confirmation is required.", { risk: selectedInvoice.risk })}</small></span></label>}
          <label className="field-label">{t("Comment (optional)")}<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("Add audit context…")} /></label>
          <div className="modal-actions"><button className="secondary-button" onClick={() => setApproveOpen(false)}>{t("Cancel")}</button><button className="primary-button" disabled={selectedInvoice.risk >= 90 && !verified} onClick={approveInvoice}>{t("Approve and record")}</button></div>
        </div></div>
      )}

      {uploadOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-card upload-card">
          <button className="modal-close" onClick={() => setUploadOpen(false)} aria-label={t("Close")}>×</button><span className="modal-icon upload">⇧</span>
          <h2 id="upload-title">{t("Upload documents")}</h2><p>{t("Secure import for e-Invoice XML, ERP CSV or JSON. Maximum 5 MB.")}</p>
          <button className={`drop-zone ${uploadFile ? "has-file" : ""}`} onClick={() => fileRef.current?.click()}><span>{uploadFile ? "✓" : "＋"}</span><strong>{uploadFile ? uploadFile.name : t("Choose a file")}</strong><small>{uploadFile ? t("{size} KB · ready for validation", { size: (uploadFile.size / 1024).toFixed(1) }) : t("XML, CSV or JSON · anti-XXE check included")}</small></button>
          <input ref={fileRef} hidden type="file" accept=".xml,.csv,.json" onChange={(event) => { setUploadFile(event.target.files?.[0] ?? null); setUploadError(""); }} />
          {uploadError && <div className="inline-error">! {uploadError}</div>}<div className="privacy-note">▣ {t("The file is treated as untrusted data and validated before processing.")}</div>
          <div className="modal-actions"><button className="secondary-button" onClick={() => setUploadOpen(false)}>{t("Cancel")}</button><button className="primary-button" onClick={processUpload}>{t("Validate and import")}</button></div>
        </div></div>
      )}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}<button onClick={() => setToast("")} aria-label={t("Close notification")}>×</button></div>}
    </div>
  );
}

function InvoiceTable({ invoices, onAnalyze }: { invoices: Invoice[]; onAnalyze: (invoice: Invoice) => void }) {
  const { domain, money, t } = useI18n();
  if (!invoices.length) return <div className="empty-state"><span>✓</span><h3>{t("No invoices match the filters")}</h3><p>{t("Reset the search or change the filter to view documents.")}</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>{t("Supplier / invoice")}</th><th>{t("Flag reason")}</th><th>{t("Amount")}</th><th>{t("Risk")}</th><th>{t("Due")}</th><th /></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><div className="supplier-cell"><span>{invoice.supplier.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><div><strong>{invoice.supplier}</strong><small>{invoice.id} · {invoice.cif}</small></div></div></td><td><div className="reason-cell"><i className={riskClass(invoice.severity)}>!</i><span>{domain(invoice.reason)}<small>{domain(invoice.match)} · {t("Confidence").toLocaleLowerCase()} {invoice.confidence || "—"}%</small></span></div></td><td className="money-cell">{money(invoice.amountMinor)}</td><td><span className={`risk-badge ${riskClass(invoice.severity)}`}><i />{domain(invoice.severity)} <b>{invoice.risk}</b></span></td><td><span className={invoice.due === "Astăzi" ? "due-today" : ""}>{domain(invoice.due)}</span></td><td><button className="analyze-button" onClick={() => onAnalyze(invoice)}>{t("Analyse")} <span>→</span></button></td></tr>)}</tbody></table></div>;
}

function InvoiceDrawer({ invoice, onClose, onApprove, onCompare, onCase }: { invoice: Invoice; onClose: () => void; onApprove: () => void; onCompare: () => void; onCase: () => void }) {
  const { domain, money, t } = useI18n();
  const approved = invoice.status === "Aprobată";
  return <div className="drawer-layer"><button className="drawer-backdrop" onClick={onClose} aria-label={t("Close details")} /><aside className="invoice-drawer" role="dialog" aria-modal="true" aria-labelledby="invoice-title"><header><div><p>{t("SUPPLIER INVOICE")}</p><h2 id="invoice-title">{invoice.id}</h2><span>{invoice.supplier} · {invoice.cif}</span></div><button onClick={onClose} aria-label={t("Close")}>×</button></header><div className="invoice-summary"><div><small>{t("Invoice total")}</small><strong>{money(invoice.amountMinor)}</strong></div><div><small>{t("ANAF status")}</small><StatusPill tone="success">● {domain(invoice.anaf)}</StatusPill></div><div><small>{t("Reconciliation")}</small><StatusPill tone={invoice.match === "Exactă" ? "success" : "warning"}>{domain(invoice.match)}</StatusPill></div></div><section className="risk-hero"><div className={`risk-score ${riskClass(invoice.severity)}`}><strong>{invoice.risk}</strong><small>/100</small></div><div><p>{t("RISK SCORE")} · {domain(invoice.severity).toLocaleUpperCase()}</p><h3>{t("Why was it flagged?")}</h3><span>{domain(invoice.reason)}</span></div></section><section className="evidence-card"><div className="section-title"><h3>{t("Verified evidence")}</h3><StatusPill tone="info">{t("Confidence")} {invoice.confidence || "—"}%</StatusPill></div>{invoice.id === "NVL-7712" ? <ul className="evidence-list"><li><span>✓</span><div><strong>{t("Same supplier tax ID")}</strong><small>{t("RO18472931 in both documents")}</small></div></li><li><span>✓</span><div><strong>{t("Same total amount")}</strong><small>{money(5_831_000)} · {t("zero difference")}</small></div></li><li><span>✓</span><div><strong>{t("Same issue date")}</strong><small>{t("24 July 2026")}</small></div></li><li><span>≋</span><div><strong>{t("Nearly identical line items")}</strong><small>{t("99.4% semantic similarity")}</small></div></li></ul> : <ul className="evidence-list"><li><span>✓</span><div><strong>{t("Supplier identity verified")}</strong><small>{t("Normalised and valid tax ID")}</small></div></li><li><span>≋</span><div><strong>{t("rules-v1.8 reconciliation")}</strong><small>{domain(invoice.match)} · {t("deterministic result")}</small></div></li><li><span>!</span><div><strong>{t("Material variance")}</strong><small>{domain(invoice.reason)}</small></div></li></ul>}<button className="compare-button" onClick={onCompare}>{t("Compare documents")} <span>↗</span></button></section><section className="breakdown"><h3>{t("Score composition")}</h3><div><span>{t("Deterministic rules")} <b>45%</b></span><i><em style={{ width: "45%" }} /></i></div><div><span>{t("Anomalies")} <b>25%</b></span><i><em style={{ width: "25%" }} /></i></div><div><span>{t("Supplier history")} <b>20%</b></span><i><em style={{ width: "20%" }} /></i></div><div><span>{t("Data quality")} <b>10%</b></span><i><em style={{ width: "10%" }} /></i></div></section><div className="ai-disclaimer">◇ {t("Automated recommendation generated by rules-v1.8. Review the documents before deciding.")}</div><footer><button className="secondary-button" onClick={onCase}>{t("Open case")}</button><button className="primary-button" onClick={onApprove} disabled={approved}>{approved ? t("Approved") : t("Approve invoice")}</button></footer></aside></div>;
}

function DocumentComparisonModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { money, t } = useI18n();
  const referenceId = invoice.id === "NVL-7712" ? "NVL-7688" : `ERP-${invoice.id}`;
  const rows = [
    [t("Supplier"), invoice.supplier, invoice.supplier, "same"],
    [t("Tax ID"), invoice.cif, invoice.cif, "same"],
    [t("Document number"), invoice.id, referenceId, "different"],
    [t("Issue date"), t("24 July 2026"), t("24 July 2026"), "same"],
    [t("Total"), money(invoice.amountMinor), money(invoice.amountMinor), "same"],
    [t("Currency"), "RON", "RON", "same"],
  ];
  return <div className="comparison-layer" role="dialog" aria-modal="true" aria-labelledby="comparison-title"><button className="comparison-backdrop" onClick={onClose} aria-label={t("Close")} /><section className="comparison-modal"><header><div><p>{t("DOCUMENT COMPARISON")}</p><h2 id="comparison-title">{invoice.id} <span>vs.</span> {referenceId}</h2><small>{t("rules-v1.8 engine · deterministic analysis · {confidence}% confidence", { confidence: invoice.confidence || 96 })}</small></div><button onClick={onClose} aria-label={t("Close")}>×</button></header><div className="comparison-alert"><span>!</span><div><strong>{t("Potential duplicate detected")}</strong><small>{t("5 of 6 key fields are identical. The document number is the only material difference.")}</small></div><StatusPill tone="warning">{t("Review required")}</StatusPill></div><div className="document-headings"><div><span>{t("CURRENT DOCUMENT")}</span><strong>{invoice.id}</strong><small>{t("Imported from SPV · 29 July 2026")}</small></div><i>⇄</i><div><span>{t("REFERENCE DOCUMENT")}</span><strong>{referenceId}</strong><small>{t("Invoice register · 24 July 2026")}</small></div></div><div className="comparison-table" role="table" aria-label={t("Differences between documents")}><div className="comparison-row heading" role="row"><span>{t("Field")}</span><span>{invoice.id}</span><span>{referenceId}</span><span>{t("Result")}</span></div>{rows.map(([label, current, reference, result]) => <div className={`comparison-row ${result}`} role="row" key={label}><strong>{label}</strong><span>{current}</span><span>{reference}</span><span>{result === "same" ? `✓ ${t("Identical")}` : `! ${t("Different")}`}</span></div>)}</div><section className="line-comparison"><div><h3>{t("Line-item comparison")}</h3><StatusPill tone="info">{t("99.4% similarity")}</StatusPill></div><p><span>{t("Domestic road transport")}</span><b>{money(3_250_000)}</b><em>{t("Identical")}</em></p><p><span>{t("Handling and storage")}</span><b>{money(1_650_000)}</b><em>{t("Identical")}</em></p><p><span>{t("VAT 19%")}</span><b>{money(931_000)}</b><em>{t("Identical")}</em></p></section><footer><p>{t("Recommendation: review the original document and confirm whether it is a legitimate reissue.")}</p><button className="primary-button" onClick={onClose}>{t("Understood · close")}</button></footer></section></div>;
}

function WorkspaceView({ view, invoices, auditEvents, onAnalyze, onUpload, onExport, onNotify }: { view: View; invoices: Invoice[]; auditEvents: AuditEvent[]; onAnalyze: (invoice: Invoice) => void; onUpload: () => void; onExport: () => void; onNotify: (message: string) => void }) {
  const { domain, localeTag, t } = useI18n();
  const titles: Record<View, [string, string]> = {
    overview: [t("Overview"), ""],
    invoices: [t("Invoices"), t("All documents normalised from SPV and ERP")],
    reconciliation: [t("Reconciliation"), t("Explainable matches between invoice, ERP and payment")],
    cases: [t("Cases"), t("Work queue for variances and decisions")],
    efactura: ["e-Factura", t("Submission, validation and ANAF responses")],
    suppliers: [t("Suppliers"), t("Risk profiles and commercial history")],
    analytics: [t("Analytics"), t("Integrity and performance indicators")],
    audit: [t("Audit log"), t("Append-only history with a verifiable integrity chain")],
    integrations: [t("Integrations"), t("Connect operational data sources")],
    settings: [t("Settings"), t("Thresholds, roles and retention policies")],
  };
  if (view === "audit") return <section className="workspace-page"><PageHeader title={titles[view][0]} subtitle={titles[view][1]} action={<button className="primary-button" onClick={onExport}>↓ {t("Export evidence")}</button>} /><div className="audit-proof"><div><span className="proof-icon">✓</span><div><strong>{t("Integrity chain verified")}</strong><small>{t("{count} events · last check 1 minute ago", { count: auditEvents.length.toLocaleString(localeTag) })}</small></div></div><code>SHA-256 · {auditEvents[0]?.hash}…</code></div><section className="panel workspace-panel"><div className="table-wrap"><table><thead><tr><th>{t("Event")}</th><th>{t("Date and time")}</th><th>{t("Actor")}</th><th>{t("Action")}</th><th>{t("Entity")}</th><th>{t("Result")}</th><th>{t("Evidence")}</th></tr></thead><tbody>{auditEvents.map((event) => <tr key={event.id}><td className="mono">{event.id}</td><td>{domain(event.time)}</td><td>{event.actor}</td><td><strong>{domain(event.action)}</strong></td><td className="mono">{event.entity}</td><td><StatusPill tone="success">{domain(event.result)}</StatusPill></td><td><code>{event.hash}</code></td></tr>)}</tbody></table></div></section></section>;
  if (view === "reconciliation") return <section className="workspace-page"><PageHeader title={titles[view][0]} subtitle={titles[view][1]} action={<button className="primary-button" onClick={() => onNotify(t("The demo reconciliation completed: 1,284 exact matches, 118 for review."))}>▶ {t("Run reconciliation")}</button>} /><div className="recon-summary"><div><small>{t("Invoices processed")}</small><strong>{new Intl.NumberFormat(localeTag).format(1402)}</strong><span>{t("last 30 days")}</span></div><div><small>{t("Exact matches")}</small><strong>{new Intl.NumberFormat(localeTag).format(1284)}</strong><span className="green">91.6%</span></div><div><small>{t("Requires review")}</small><strong>118</strong><span className="orange">8.4%</span></div><div><small>{t("Reconciled value")}</small><strong>4.82M</strong><span>RON</span></div></div><section className="panel workspace-panel"><div className="panel-head"><div><h2>{t("Recent results")}</h2><p>{t("Versioned scores and explainable factors")}</p></div><StatusPill tone="info">rules-v1.8</StatusPill></div><InvoiceTable invoices={invoices} onAnalyze={onAnalyze} /></section></section>;
  if (view === "integrations") {
    const integrations = [["SPV / ANAF", t("Simulated"), t("Demo sync 3 minutes ago"), "◆"], ["SAP S/4HANA", t("Simulated"), t("1,402 demo documents"), "S"], ["Banca Transilvania", t("Not configured"), t("Read-only connector available on the roadmap"), "BT"], ["SmartBill", t("Not configured"), t("Invoice and payment import on the roadmap"), "SB"]];
    return <section className="workspace-page"><PageHeader title={titles[view][0]} subtitle={titles[view][1]} /><div className="integration-grid">{integrations.map((item) => <section className="panel integration-card" key={item[0]}><span className="integration-logo">{item[3]}</span><div><h3>{item[0]}</h3><p>{item[2]}</p></div><StatusPill tone={item[1] === t("Simulated") ? "info" : "neutral"}>{item[1]}</StatusPill><button className="full-outline" onClick={() => onNotify(t("{name} is shown in demo mode; no data is sent externally.", { name: item[0] }))}>{t("Demo details")} →</button></section>)}</div></section>;
  }
  return <section className="workspace-page"><PageHeader title={titles[view][0]} subtitle={titles[view][1]} action={view === "invoices" ? <button className="primary-button" onClick={onUpload}>＋ {t("Upload invoice")}</button> : undefined} />{view === "efactura" && <div className="service-banner success"><span>✓</span><div><strong>{t("The SPV simulator is operating normally")}</strong><small>{t("Synthetic data · no connection to ANAF in this demo")}</small></div></div>}{view === "analytics" ? <AnalyticsView /> : view === "suppliers" ? <SupplierView onNotify={onNotify} /> : view === "settings" ? <SettingsView onNotify={onNotify} /> : <section className="panel workspace-panel"><div className="panel-head"><div><h2>{view === "cases" ? t("Open cases") : view === "efactura" ? t("Simulated documents") : t("Invoice register")}</h2><p>{t("Synthetic demonstration data")}</p></div><button className="filter-button" onClick={() => onNotify(t("Demo filters use the All, Critical and Today selections from the dashboard."))}>≡ {t("Filters")}</button></div><InvoiceTable invoices={invoices} onAnalyze={onAnalyze} /></section>}</section>;
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className="workspace-heading"><div><p className="eyebrow">VEYLORA INVOICE INTELLIGENCE</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function AnalyticsView() {
  const { localeTag, t } = useI18n();
  return <><div className="recon-summary"><div><small>{t("Integrity score")}</small><strong>{new Intl.NumberFormat(localeTag, { minimumFractionDigits: 1 }).format(94.2)}</strong><span className="green">+2.1</span></div><div><small>{t("Average decision time")}</small><strong>2h 14m</strong><span className="green">−18 min</span></div><div><small>{t("Duplicates prevented")}</small><strong>47</strong><span>248,730 RON</span></div><div><small>{t("Rule precision")}</small><strong>96.8%</strong><span>{t("verified sample")}</span></div></div><section className="panel chart-panel"><div className="panel-head"><div><h2>{t("Integrity trend")}</h2><p>{t("Daily score and variance volume")}</p></div><StatusPill tone="success">{t("Positive trend")}</StatusPill></div><div className="bar-chart">{[58, 66, 61, 74, 69, 83, 78, 86, 82, 91, 88, 94].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{index + 18} {t("Jul")}</small></div>)}</div></section></>;
}

function SupplierView({ onNotify }: { onNotify: (message: string) => void }) {
  const { t } = useI18n();
  const suppliers: Array<[string, string, number, string]> = [["Nova Logistic SRL", "RO18472931", 78, t("2 cases")], ["Delta Facility SRL", "RO37290415", 84, t("1 critical case")], ["Meditech Supplies SRL", "RO32740188", 63, t("1 variance")], ["Arco Construct SA", "RO45820133", 12, t("No variances")]];
  return <div className="supplier-grid">{suppliers.map((supplier) => <section className="panel supplier-card" key={supplier[0]}><div className="supplier-card-head"><span>{supplier[0].split(" ").map((item) => item[0]).join("").slice(0, 2)}</span><div><h3>{supplier[0]}</h3><p>{supplier[1]}</p></div></div><div className="supplier-risk"><span>{t("Current risk")}</span><strong>{supplier[2]}/100</strong><i><em style={{ width: `${supplier[2]}%` }} /></i></div><footer><span>{supplier[3]}</span><button onClick={() => onNotify(t("Demo profile {name} has a score of {score}/100.", { name: supplier[0], score: supplier[2] }))}>{t("View profile")} →</button></footer></section>)}</div>;
}

function SettingsView({ onNotify }: { onNotify: (message: string) => void }) {
  const { t } = useI18n();
  return <section className="panel settings-card"><div className="settings-section"><div><h3>{t("Exact-match threshold")}</h3><p>{t("Minimum score for automatic conflict-free matching")}</p></div><label><input defaultValue="95" aria-label={t("Exact-match threshold")} /> %</label></div><div className="settings-section"><div><h3>{t("Financial tolerance")}</h3><p>{t("Maximum accepted difference for a probable match")}</p></div><label><input defaultValue="1.00" aria-label={t("Financial tolerance")} /> RON</label></div><div className="settings-section"><div><h3>{t("Human decision for critical risk")}</h3><p>{t("Blocks approval until the evidence is confirmed")}</p></div><button className="toggle active" onClick={() => onNotify(t("Human-in-the-loop control remains mandatory in the demo."))} aria-label={t("Human decision required")}><span /></button></div><div className="settings-section"><div><h3>{t("Document retention")}</h3><p>{t("Raw documents are removed according to the organisation's policy")}</p></div><label><input defaultValue="7" aria-label={t("Document retention")} /> {t("years")}</label></div><footer><button className="primary-button" onClick={() => onNotify(t("The demo policy was validated locally; this demo has no persistence."))}>{t("Save policy")}</button></footer></section>;
}
