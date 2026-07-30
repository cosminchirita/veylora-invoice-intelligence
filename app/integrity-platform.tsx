"use client";

import { useMemo, useRef, useState } from "react";
import { auditHash, calculateExposure, formatMoney, sanitizeSpreadsheetCell, validateInvoiceUpload } from "../lib/invoice-engine.mjs";
import { initialAudit, initialInvoices, kpis, navGroups, type AuditEvent, type Invoice, type Severity, type View } from "../lib/demo-data";

function riskClass(severity: Severity) {
  return severity === "Critic" ? "critical" : severity === "Ridicat" ? "high" : severity === "Mediu" ? "medium" : "low";
}

function Sparkline({ values, tone }: { values: number[]; tone: string }) {
  return <div className={`sparkline ${tone}`} aria-hidden="true">{values.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>;
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

export function IntegrityPlatform() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<"Toate" | "Critice" | "Astăzi">("Toate");
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
    const query = search.trim().toLocaleLowerCase("ro-RO");
    return invoices.filter((invoice) => {
      const matchesSearch = !query || `${invoice.supplier} ${invoice.id} ${invoice.cif} ${invoice.reason}`.toLocaleLowerCase("ro-RO").includes(query);
      const matchesFilter = filter === "Toate" || (filter === "Critice" && invoice.severity === "Critic") || (filter === "Astăzi" && invoice.due === "Astăzi");
      return matchesSearch && matchesFilter;
    });
  }, [filter, invoices, search]);

  const exposure = calculateExposure(initialInvoices.slice(0, 4));

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  }

  async function appendAudit(action: string, entity: string, result: string) {
    const previousHash = auditEvents[0]?.hash.padEnd(64, "0") ?? "0".repeat(64);
    const base = { action, entity, actor: "Andrei Popescu", result };
    const hash = await auditHash(previousHash, base);
    const nextSequence = Number(auditEvents[0]?.id.split("-")[1] ?? 8094) + 1;
    setAuditEvents((current) => [{ id: `EV-${nextSequence}`, time: "29 iul. 2026, acum", ...base, hash }, ...current]);
  }

  async function approveInvoice() {
    if (!selectedInvoice) return;
    if (selectedInvoice.risk >= 90 && !verified) return;
    setInvoices((items) => items.map((invoice) => invoice.id === selectedInvoice.id ? { ...invoice, status: "Aprobată", reason: "Decizie confirmată de operator" } : invoice));
    await appendAudit("Factură aprobată", selectedInvoice.id, `Succes${comment ? " · comentariu înregistrat" : ""}`);
    setSelectedInvoice((invoice) => invoice ? { ...invoice, status: "Aprobată" } : invoice);
    setApproveOpen(false);
    setVerified(false);
    setComment("");
    notify("Factura a fost aprobată. Decizia și dovezile au fost înregistrate în jurnalul de audit.");
  }

  async function processUpload() {
    if (!uploadFile) { setUploadError("Selectează un fișier XML, CSV sau JSON."); return; }
    const content = await uploadFile.text();
    const validation = validateInvoiceUpload(uploadFile.name, content, uploadFile.size);
    if (!validation.valid) { setUploadError(validation.message); return; }
    if (invoices.some((invoice) => uploadFile.name.toLowerCase().includes(invoice.id.toLowerCase()))) {
      setUploadError("Acest document există deja. Importul duplicat a fost oprit în siguranță.");
      return;
    }
    const imported: Invoice = { id: `IMP-${String(invoices.length + 101).padStart(4, "0")}`, supplier: "Furnizor importat", cif: "În curs de validare", reason: "Document validat · reconciliere în curs", amountMinor: 0, risk: 0, severity: "Scăzut", due: "—", status: "În procesare", anaf: "Netransmisă", confidence: 0, match: "În curs" };
    setInvoices((items) => [imported, ...items]);
    await appendAudit("Document importat", imported.id, "Validare structurală reușită");
    setUploadOpen(false);
    setUploadFile(null);
    setUploadError("");
    notify("Documentul a fost validat și introdus în fluxul de reconciliere.");
  }

  async function exportAudit() {
    const rows = [["Eveniment", "Data", "Actor", "Acțiune", "Entitate", "Rezultat", "Hash"], ...auditEvents.map((event) => [event.id, event.time, event.actor, event.action, event.entity, event.result, event.hash])];
    const csv = rows.map((row) => row.map((cell) => `"${sanitizeSpreadsheetCell(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "veylora-audit-evidence.csv"; anchor.click(); URL.revokeObjectURL(url);
    await appendAudit("Audit exportat", "AUDIT-2026-07-29", `${auditEvents.length} evenimente`);
    notify("Raportul de audit a fost generat cu protecție pentru formule CSV.");
  }

  function selectView(view: View) {
    setActiveView(view);
    setMobileNav(false);
    setSelectedInvoice(null);
  }

  return (
    <div className="platform-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <button className="sidebar-close" onClick={() => setMobileNav(false)} aria-label="Închide meniul">×</button>
        <div className="brand"><span className="brand-mark">VY</span><span><strong>Veylora</strong><small>INVOICE INTELLIGENCE</small></span></div>
        <div className="workspace-card"><span className="workspace-avatar">NR</span><span><strong>Nordic Retail</strong><small>România SRL</small></span><button aria-label="Schimbă organizația">⌄</button></div>
        <nav aria-label="Navigație principală">
          {navGroups.map((group, groupIndex) => <div className="nav-group" key={groupIndex}>{group.map((item) => <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => selectView(item.id as View)}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{"badge" in item && <em>{item.badge}</em>}</button>)}</div>)}
        </nav>
        <div className="sidebar-trust"><div className="trust-ring">✓</div><div><strong>Audit verificat</strong><small>Lanț intact · 8.094 evenimente</small></div></div>
        <div className="user-mini"><span>AP</span><div><strong>Andrei Popescu</strong><small>Administrator</small></div><button aria-label="Meniu utilizator">•••</button></div>
      </aside>

      {mobileNav && <button className="mobile-backdrop" onClick={() => setMobileNav(false)} aria-label="Închide meniul" />}

      <section className="app-stage">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Deschide meniul">☰</button>
          <button className="environment" onClick={() => notify("Acesta este un mediu demonstrativ cu date sintetice.")}><span /> Mediu: Demo securizat <b>⌄</b></button>
          <label className="global-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută număr, CIF sau furnizor…" aria-label="Căutare globală" /><kbd>⌘ K</kbd></label>
          <div className="top-actions"><button className="icon-button" aria-label="Ajutor" onClick={() => notify("Ghidul demonstrativ este disponibil în docs/DEMO_GUIDE.md.")}>?</button><button className="icon-button notification" aria-label="Notificări" onClick={() => notify("Ai 3 notificări demonstrative; nu sunt trimise către servicii externe.")}>♧<i /></button><div className="top-profile">AP</div></div>
        </header>

        <main className="main-content">
          {activeView === "overview" && (
            <>
              <div className="page-heading">
                <div><p className="eyebrow">MIERCURI, 29 IULIE</p><h1>Bună dimineața, Andrei</h1><p>Ai <strong>18 facturi</strong> care necesită o decizie, cu impact potențial de <strong>{formatMoney(exposure)}</strong>.</p></div>
                <div className="heading-actions"><div className="sync-pill"><span /> SPV simulat <small>date demonstrative</small></div><button className="secondary-button" onClick={() => notify("Perioada demonstrativă este fixată la ultimele 30 de zile.")}>Ultimele 30 zile⌄</button><button className="primary-button" onClick={() => setUploadOpen(true)}>＋ Încarcă factură</button></div>
              </div>

              <section className="kpi-grid" aria-label="Indicatori principali">
                {kpis.map((kpi, index) => <button className="kpi-card" key={kpi.label} onClick={() => index === 1 && setFilter("Critice")} title={kpi.note}><div className="kpi-title"><span>{kpi.label}</span><i>i</i></div><div className="kpi-value"><strong>{kpi.value}</strong><span>{kpi.suffix}</span></div><div className={`kpi-note ${kpi.tone}`}>{index === 0 || index === 3 ? "↗" : index === 1 ? "↓" : "•"} {kpi.note}</div><Sparkline values={kpi.spark} tone={kpi.tone} /></button>)}
              </section>

              <div className="dashboard-grid">
                <section className="panel attention-panel">
                  <div className="panel-head"><div><h2>Necesită atenția ta</h2><p>Prioritizate după risc, termen și impact financiar</p></div><button className="text-button" onClick={() => selectView("cases")}>Vezi toate cazurile →</button></div>
                  <div className="table-toolbar"><div className="segment-control">{(["Toate", "Critice", "Astăzi"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item} <span>{item === "Toate" ? 18 : item === "Critice" ? 6 : 4}</span></button>)}</div><button className="filter-button" onClick={() => { setFilter("Critice"); notify("Filtrul pentru facturi critice a fost aplicat."); }}>≡ Filtre</button></div>
                  <InvoiceTable invoices={visibleInvoices.slice(0, 5)} onAnalyze={setSelectedInvoice} />
                </section>

                <aside className="insight-column">
                  <section className="panel flow-card"><div className="panel-head compact"><div><h2>Flux e-Factura</h2><p>Astăzi · 156 documente</p></div><button className="dots">•••</button></div><div className="delivery-row"><div className="donut"><span><strong>98,7%</strong><small>livrate</small></span></div><div className="delivery-legend"><p><i className="dot accepted" />Acceptate <b>154</b></p><p><i className="dot pending" />În procesare <b>1</b></p><p><i className="dot rejected" />Respinse <b>1</b></p></div></div><button className="warning-link" onClick={() => selectView("efactura")}><span>!</span><div><strong>1 transmitere respinsă</strong><small>Cod ANAF: BR-RO-120</small></div><b>→</b></button></section>
                  <section className="panel match-card"><div className="panel-head compact"><div><h2>Reconciliere automată</h2><p>Factură ↔ ERP ↔ plată</p></div><StatusPill tone="success">91,6%</StatusPill></div><div className="stack-bar"><span className="matched" style={{ width: "91.6%" }} /><span className="partial" style={{ width: "6%" }} /><span className="unmatched" style={{ width: "2.4%" }} /></div><div className="match-stats"><div><strong>1.284</strong><small>Exacte</small></div><div><strong>84</strong><small>Parțiale</small></div><div><strong>34</strong><small>Fără corespondent</small></div></div><button className="full-outline" onClick={() => selectView("reconciliation")}>Deschide reconcilierea <span>→</span></button></section>
                </aside>
              </div>

              <section className="activity-strip"><div className="activity-title"><span className="pulse-icon">⌁</span><div><strong>Activitate recentă</strong><small>Actualizări în timp real</small></div></div>{auditEvents.slice(0, 3).map((event, index) => <div className="activity-item" key={event.id}><span className={`activity-avatar a${index}`}>{event.actor.split(" ").map((name) => name[0]).join("").slice(0, 2)}</span><p><strong>{event.actor}</strong> {event.action.toLocaleLowerCase("ro-RO")} <b>{event.entity}</b><small>{event.time}</small></p></div>)}</section>
            </>
          )}

          {activeView !== "overview" && <WorkspaceView view={activeView} invoices={visibleInvoices} auditEvents={auditEvents} onAnalyze={setSelectedInvoice} onUpload={() => setUploadOpen(true)} onExport={exportAudit} onNotify={notify} />}
        </main>
      </section>

      {selectedInvoice && <InvoiceDrawer invoice={selectedInvoice} onClose={() => { setSelectedInvoice(null); setCompareOpen(false); }} onApprove={() => setApproveOpen(true)} onCompare={() => setCompareOpen(true)} onCase={() => { void appendAudit("Caz deschis", selectedInvoice.id, "Atribuit Ioana Marinescu"); notify("Cazul C-2026-0184 a fost atribuit lui Ioana Marinescu."); }} />}

      {compareOpen && selectedInvoice && <DocumentComparisonModal invoice={selectedInvoice} onClose={() => setCompareOpen(false)} />}

      {approveOpen && selectedInvoice && <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="approve-title"><div className="modal-card"><button className="modal-close" onClick={() => setApproveOpen(false)} aria-label="Închide">×</button><span className="modal-icon">✓</span><h2 id="approve-title">Confirmă aprobarea</h2><p>Factura <strong>{selectedInvoice.id}</strong> de la {selectedInvoice.supplier}, în valoare de <strong>{formatMoney(selectedInvoice.amountMinor)}</strong>.</p>{selectedInvoice.risk >= 90 && <label className="verification-check"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /><span><strong>Am verificat dovezile semnalate</strong><small>Riscul este critic ({selectedInvoice.risk}/100). Confirmarea este obligatorie.</small></span></label>}<label className="field-label">Comentariu (opțional)<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Adaugă context pentru audit…" /></label><div className="modal-actions"><button className="secondary-button" onClick={() => setApproveOpen(false)}>Renunță</button><button className="primary-button" disabled={selectedInvoice.risk >= 90 && !verified} onClick={approveInvoice}>Aprobă și înregistrează</button></div></div></div>}

      {uploadOpen && <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-card upload-card"><button className="modal-close" onClick={() => setUploadOpen(false)} aria-label="Închide">×</button><span className="modal-icon upload">⇧</span><h2 id="upload-title">Încarcă documente</h2><p>Import securizat pentru XML e-Factura, CSV ERP sau JSON. Maximum 5 MB.</p><button className={`drop-zone ${uploadFile ? "has-file" : ""}`} onClick={() => fileRef.current?.click()}><span>{uploadFile ? "✓" : "＋"}</span><strong>{uploadFile ? uploadFile.name : "Alege un fișier"}</strong><small>{uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB · pregătit pentru validare` : "XML, CSV sau JSON · verificare anti-XXE inclusă"}</small></button><input ref={fileRef} hidden type="file" accept=".xml,.csv,.json" onChange={(event) => { setUploadFile(event.target.files?.[0] ?? null); setUploadError(""); }} />{uploadError && <div className="inline-error">! {uploadError}</div>}<div className="privacy-note">▣ Fișierul este tratat ca date neîncrezătoare și validat înainte de procesare.</div><div className="modal-actions"><button className="secondary-button" onClick={() => setUploadOpen(false)}>Renunță</button><button className="primary-button" onClick={processUpload}>Validează și importă</button></div></div></div>}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}<button onClick={() => setToast("")} aria-label="Închide notificarea">×</button></div>}
    </div>
  );
}

function InvoiceTable({ invoices, onAnalyze }: { invoices: Invoice[]; onAnalyze: (invoice: Invoice) => void }) {
  if (!invoices.length) return <div className="empty-state"><span>✓</span><h3>Nicio factură nu corespunde filtrelor</h3><p>Resetează căutarea sau schimbă filtrul pentru a vedea documentele.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>Furnizor / factură</th><th>Motivul semnalării</th><th>Valoare</th><th>Risc</th><th>Termen</th><th /></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><div className="supplier-cell"><span>{invoice.supplier.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><div><strong>{invoice.supplier}</strong><small>{invoice.id} · {invoice.cif}</small></div></div></td><td><div className="reason-cell"><i className={riskClass(invoice.severity)}>!</i><span>{invoice.reason}<small>{invoice.match} · confidence {invoice.confidence || "—"}%</small></span></div></td><td className="money-cell">{formatMoney(invoice.amountMinor)}</td><td><span className={`risk-badge ${riskClass(invoice.severity)}`}><i />{invoice.severity} <b>{invoice.risk}</b></span></td><td><span className={invoice.due === "Astăzi" ? "due-today" : ""}>{invoice.due}</span></td><td><button className="analyze-button" onClick={() => onAnalyze(invoice)}>Analizează <span>→</span></button></td></tr>)}</tbody></table></div>;
}

function InvoiceDrawer({ invoice, onClose, onApprove, onCompare, onCase }: { invoice: Invoice; onClose: () => void; onApprove: () => void; onCompare: () => void; onCase: () => void }) {
  return <div className="drawer-layer"><button className="drawer-backdrop" onClick={onClose} aria-label="Închide detaliile" /><aside className="invoice-drawer" role="dialog" aria-modal="true" aria-labelledby="invoice-title"><header><div><p>FACTURĂ FURNIZOR</p><h2 id="invoice-title">{invoice.id}</h2><span>{invoice.supplier} · {invoice.cif}</span></div><button onClick={onClose} aria-label="Închide">×</button></header><div className="invoice-summary"><div><small>Total factură</small><strong>{formatMoney(invoice.amountMinor)}</strong></div><div><small>Status ANAF</small><StatusPill tone="success">● {invoice.anaf}</StatusPill></div><div><small>Reconciliere</small><StatusPill tone={invoice.match === "Exactă" ? "success" : "warning"}>{invoice.match}</StatusPill></div></div><section className="risk-hero"><div className={`risk-score ${riskClass(invoice.severity)}`}><strong>{invoice.risk}</strong><small>/100</small></div><div><p>SCOR DE RISC · {invoice.severity.toUpperCase()}</p><h3>De ce a fost semnalată?</h3><span>{invoice.reason}</span></div></section><section className="evidence-card"><div className="section-title"><h3>Dovezi verificate</h3><StatusPill tone="info">Încredere {invoice.confidence || "—"}%</StatusPill></div>{invoice.id === "NVL-7712" ? <ul className="evidence-list"><li><span>✓</span><div><strong>Același CIF furnizor</strong><small>RO18472931 în ambele documente</small></div></li><li><span>✓</span><div><strong>Aceeași sumă totală</strong><small>58.310,00 RON · diferență 0,00 RON</small></div></li><li><span>✓</span><div><strong>Aceeași dată de emitere</strong><small>24 iulie 2026</small></div></li><li><span>≋</span><div><strong>Linii aproape identice</strong><small>Similaritate semantică 99,4%</small></div></li></ul> : <ul className="evidence-list"><li><span>✓</span><div><strong>Identitatea furnizorului verificată</strong><small>CIF normalizat și valid</small></div></li><li><span>≋</span><div><strong>Reconciliere rules-v1.8</strong><small>{invoice.match} · rezultat determinist</small></div></li><li><span>!</span><div><strong>Abatere materială</strong><small>{invoice.reason}</small></div></li></ul>}<button className="compare-button" onClick={onCompare}>Compară documentele <span>↗</span></button></section><section className="breakdown"><h3>Compoziția scorului</h3><div><span>Reguli deterministe <b>45%</b></span><i><em style={{ width: "45%" }} /></i></div><div><span>Anomalii <b>25%</b></span><i><em style={{ width: "25%" }} /></i></div><div><span>Istoric furnizor <b>20%</b></span><i><em style={{ width: "20%" }} /></i></div><div><span>Calitatea datelor <b>10%</b></span><i><em style={{ width: "10%" }} /></i></div></section><div className="ai-disclaimer">◇ Recomandare generată automat cu rules-v1.8. Verifică documentele înainte de decizie.</div><footer><button className="secondary-button" onClick={onCase}>Deschide caz</button><button className="primary-button" onClick={onApprove} disabled={invoice.status === "Aprobată"}>{invoice.status === "Aprobată" ? "Aprobată" : "Aprobă factura"}</button></footer></aside></div>;
}

function DocumentComparisonModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const referenceId = invoice.id === "NVL-7712" ? "NVL-7688" : `ERP-${invoice.id}`;
  const rows = [
    ["Furnizor", invoice.supplier, invoice.supplier, "same"],
    ["CIF", invoice.cif, invoice.cif, "same"],
    ["Număr document", invoice.id, referenceId, "different"],
    ["Data emiterii", "24 iul. 2026", "24 iul. 2026", "same"],
    ["Total", formatMoney(invoice.amountMinor), formatMoney(invoice.amountMinor), "same"],
    ["Monedă", "RON", "RON", "same"],
  ];
  return <div className="comparison-layer" role="dialog" aria-modal="true" aria-labelledby="comparison-title"><button className="comparison-backdrop" onClick={onClose} aria-label="Închide comparația" /><section className="comparison-modal"><header><div><p>COMPARAȚIE DOCUMENTE</p><h2 id="comparison-title">{invoice.id} <span>vs.</span> {referenceId}</h2><small>Motor rules-v1.8 · analiză deterministă · {invoice.confidence || 96}% încredere</small></div><button onClick={onClose} aria-label="Închide">×</button></header><div className="comparison-alert"><span>!</span><div><strong>Posibil duplicat detectat</strong><small>5 din 6 câmpuri-cheie sunt identice. Numărul documentului este singura diferență materială.</small></div><StatusPill tone="warning">Revizie necesară</StatusPill></div><div className="document-headings"><div><span>DOCUMENT CURENT</span><strong>{invoice.id}</strong><small>Importat din SPV · 29 iul. 2026</small></div><i>⇄</i><div><span>DOCUMENT DE REFERINȚĂ</span><strong>{referenceId}</strong><small>Registru facturi · 24 iul. 2026</small></div></div><div className="comparison-table" role="table" aria-label="Diferențe între documente"><div className="comparison-row heading" role="row"><span>Câmp</span><span>{invoice.id}</span><span>{referenceId}</span><span>Rezultat</span></div>{rows.map(([label, current, reference, result]) => <div className={`comparison-row ${result}`} role="row" key={label}><strong>{label}</strong><span>{current}</span><span>{reference}</span><span>{result === "same" ? "✓ Identic" : "! Diferit"}</span></div>)}</div><section className="line-comparison"><div><h3>Comparație linii</h3><StatusPill tone="info">Similaritate 99,4%</StatusPill></div><p><span>Transport rutier intern</span><b>32.500,00 RON</b><em>Identic</em></p><p><span>Manipulare și depozitare</span><b>16.500,00 RON</b><em>Identic</em></p><p><span>TVA 19%</span><b>9.310,00 RON</b><em>Identic</em></p></section><footer><p>Recomandare: verifică documentul original și confirmă dacă este o reemitere legitimă.</p><button className="primary-button" onClick={onClose}>Am înțeles · închide</button></footer></section></div>;
}

function WorkspaceView({ view, invoices, auditEvents, onAnalyze, onUpload, onExport, onNotify }: { view: View; invoices: Invoice[]; auditEvents: AuditEvent[]; onAnalyze: (invoice: Invoice) => void; onUpload: () => void; onExport: () => void; onNotify: (message: string) => void }) {
  const titles: Record<View, [string, string]> = {
    overview: ["Prezentare generală", ""], invoices: ["Facturi", "Toate documentele normalizate din SPV și ERP"], reconciliation: ["Reconciliere", "Potriviri explicabile între factură, ERP și plată"], cases: ["Cazuri", "Coada de lucru pentru abateri și decizii"], efactura: ["e-Factura", "Transmitere, validare și răspunsuri ANAF"], suppliers: ["Furnizori", "Profiluri de risc și istoric comercial"], analytics: ["Analize", "Indicatori de integritate și performanță"], audit: ["Jurnal de audit", "Istoric append-only cu lanț de integritate verificabil"], integrations: ["Integrări", "Conectează sursele operaționale"], settings: ["Setări", "Praguri, roluri și politici de retenție"],
  };
  if (view === "audit") return <section className="workspace-page"><PageHeader title={titles[view][0]} subtitle={titles[view][1]} action={<button className="primary-button" onClick={onExport}>↓ Exportă dovezi</button>} /><div className="audit-proof"><div><span className="proof-icon">✓</span><div><strong>Lanț de integritate verificat</strong><small>{auditEvents.length.toLocaleString("ro-RO")} evenimente · ultimul control acum 1 minut</small></div></div><code>SHA-256 · {auditEvents[0]?.hash}…</code></div><section className="panel workspace-panel"><div className="table-wrap"><table><thead><tr><th>Eveniment</th><th>Data și ora</th><th>Actor</th><th>Acțiune</th><th>Entitate</th><th>Rezultat</th><th>Dovadă</th></tr></thead><tbody>{auditEvents.map((event) => <tr key={event.id}><td className="mono">{event.id}</td><td>{event.time}</td><td>{event.actor}</td><td><strong>{event.action}</strong></td><td className="mono">{event.entity}</td><td><StatusPill tone="success">{event.result}</StatusPill></td><td><code>{event.hash}</code></td></tr>)}</tbody></table></div></section></section>;
  if (view === "reconciliation") return <section className="workspace-page"><PageHeader title={titles[view][0]} subtitle={titles[view][1]} action={<button className="primary-button" onClick={() => onNotify("Reconcilierea demonstrativă s-a încheiat: 1.284 potriviri exacte, 118 pentru revizie.")}>▶ Rulează reconcilierea</button>} /><div className="recon-summary"><div><small>Facturi procesate</small><strong>1.402</strong><span>ultimele 30 zile</span></div><div><small>Potriviri exacte</small><strong>1.284</strong><span className="green">91,6%</span></div><div><small>Necesită revizie</small><strong>118</strong><span className="orange">8,4%</span></div><div><small>Valoare reconciliată</small><strong>4,82 mil.</strong><span>RON</span></div></div><section className="panel workspace-panel"><div className="panel-head"><div><h2>Rezultate recente</h2><p>Scoruri versionate și factori explicabili</p></div><StatusPill tone="info">rules-v1.8</StatusPill></div><InvoiceTable invoices={invoices} onAnalyze={onAnalyze} /></section></section>;
  if (view === "integrations") return <section className="workspace-page"><PageHeader title={titles[view][0]} subtitle={titles[view][1]} /><div className="integration-grid">{[["SPV / ANAF", "Simulat", "Sincronizare demonstrativă acum 3 min", "◆"], ["SAP S/4HANA", "Simulat", "1.402 documente demonstrative", "S"], ["Banca Transilvania", "Neconfigurat", "Conector read-only disponibil în roadmap", "BT"], ["SmartBill", "Neconfigurat", "Import facturi și plăți în roadmap", "SB"]].map((item) => <section className="panel integration-card" key={item[0]}><span className="integration-logo">{item[3]}</span><div><h3>{item[0]}</h3><p>{item[2]}</p></div><StatusPill tone={item[1] === "Simulat" ? "info" : "neutral"}>{item[1]}</StatusPill><button className="full-outline" onClick={() => onNotify(`${item[0]} este prezentat în mod demo; nu se trimit date externe.`)}>Detalii demo →</button></section>)}</div></section>;
  return <section className="workspace-page"><PageHeader title={titles[view][0]} subtitle={titles[view][1]} action={view === "invoices" ? <button className="primary-button" onClick={onUpload}>＋ Încarcă factură</button> : undefined} />{view === "efactura" && <div className="service-banner success"><span>✓</span><div><strong>Simulatorul SPV funcționează normal</strong><small>Date sintetice · nicio conexiune către ANAF în acest demo</small></div></div>}{view === "analytics" ? <AnalyticsView /> : view === "suppliers" ? <SupplierView onNotify={onNotify} /> : view === "settings" ? <SettingsView onNotify={onNotify} /> : <section className="panel workspace-panel"><div className="panel-head"><div><h2>{view === "cases" ? "Cazuri deschise" : view === "efactura" ? "Documente simulate" : "Registru facturi"}</h2><p>Date sintetice pentru demonstrație</p></div><button className="filter-button" onClick={() => onNotify("Filtrele demonstrative folosesc selecțiile Toate, Critice și Astăzi din dashboard.")}>≡ Filtre</button></div><InvoiceTable invoices={invoices} onAnalyze={onAnalyze} /></section>}</section>;
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) { return <div className="workspace-heading"><div><p className="eyebrow">VEYLORA INVOICE INTELLIGENCE</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>; }

function AnalyticsView() { return <><div className="recon-summary"><div><small>Scor integritate</small><strong>94,2</strong><span className="green">+2,1 puncte</span></div><div><small>Timp mediu decizie</small><strong>2h 14m</strong><span className="green">−18 min</span></div><div><small>Duplicate prevenite</small><strong>47</strong><span>248.730 RON</span></div><div><small>Precizie reguli</small><strong>96,8%</strong><span>eșantion verificat</span></div></div><section className="panel chart-panel"><div className="panel-head"><div><h2>Evoluția integrității</h2><p>Scor zilnic și volum de abateri</p></div><StatusPill tone="success">Tendință pozitivă</StatusPill></div><div className="bar-chart">{[58, 66, 61, 74, 69, 83, 78, 86, 82, 91, 88, 94].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{index + 18} iul.</small></div>)}</div></section></>; }

function SupplierView({ onNotify }: { onNotify: (message: string) => void }) {
  const suppliers: Array<[string, string, number, string]> = [
    ["Nova Logistic SRL", "RO18472931", 78, "2 cazuri"],
    ["Delta Facility SRL", "RO37290415", 84, "1 caz critic"],
    ["Meditech Supplies SRL", "RO32740188", 63, "1 abatere"],
    ["Arco Construct SA", "RO45820133", 12, "Fără abateri"],
  ];
  return <div className="supplier-grid">{suppliers.map((supplier) => <section className="panel supplier-card" key={supplier[0]}><div className="supplier-card-head"><span>{supplier[0].split(" ").map((item) => item[0]).join("").slice(0, 2)}</span><div><h3>{supplier[0]}</h3><p>{supplier[1]}</p></div></div><div className="supplier-risk"><span>Risc curent</span><strong>{supplier[2]}/100</strong><i><em style={{ width: `${supplier[2]}%` }} /></i></div><footer><span>{supplier[3]}</span><button onClick={() => onNotify(`Profilul demonstrativ ${supplier[0]} are scorul ${supplier[2]}/100.`)}>Vezi profilul →</button></footer></section>)}</div>;
}

function SettingsView({ onNotify }: { onNotify: (message: string) => void }) { return <section className="panel settings-card"><div className="settings-section"><div><h3>Prag de reconciliere exactă</h3><p>Scorul minim pentru potrivire automată fără conflict</p></div><label><input defaultValue="95" /> %</label></div><div className="settings-section"><div><h3>Toleranță financiară</h3><p>Diferența maximă acceptată pentru potrivire probabilă</p></div><label><input defaultValue="1,00" /> RON</label></div><div className="settings-section"><div><h3>Decizie umană la risc critic</h3><p>Blochează aprobarea până la confirmarea dovezilor</p></div><button className="toggle active" onClick={() => onNotify("Controlul human-in-the-loop rămâne obligatoriu în demonstrație.")} aria-label="Decizie umană obligatorie"><span /></button></div><div className="settings-section"><div><h3>Retenția documentelor</h3><p>Documentele brute sunt eliminate conform politicii organizației</p></div><label><input defaultValue="7" /> ani</label></div><footer><button className="primary-button" onClick={() => onNotify("Politica demonstrativă a fost validată local; nu există persistență în acest demo.")}>Salvează politica</button></footer></section>; }
