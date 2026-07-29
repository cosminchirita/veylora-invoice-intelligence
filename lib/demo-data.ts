export const DEMO_DATA_SOURCE = "SYNTHETIC_DEMO" as const;

export type View =
  | "overview"
  | "invoices"
  | "reconciliation"
  | "cases"
  | "efactura"
  | "suppliers"
  | "analytics"
  | "audit"
  | "integrations"
  | "settings";

export type Severity = "Critic" | "Ridicat" | "Mediu" | "Scăzut";

export type Invoice = {
  id: string;
  supplier: string;
  cif: string;
  reason: string;
  amountMinor: number;
  risk: number;
  severity: Severity;
  due: string;
  status: string;
  anaf: string;
  confidence: number;
  match: string;
};

export type AuditEvent = {
  id: string;
  time: string;
  actor: string;
  action: string;
  entity: string;
  result: string;
  hash: string;
};

export const initialInvoices: Invoice[] = [
  { id: "NVL-7712", supplier: "Nova Logistic SRL", cif: "RO18472931", reason: "Posibil duplicat · similaritate 99,4%", amountMinor: 5_831_000, risk: 92, severity: "Critic", due: "Astăzi", status: "Necesită decizie", anaf: "Acceptată", confidence: 96, match: "Conflict" },
  { id: "MS-20498", supplier: "Meditech Supplies SRL", cif: "RO32740188", reason: "Diferență față de comandă: +4.820,00 RON", amountMinor: 3_189_250, risk: 81, severity: "Ridicat", due: "Astăzi", status: "Necesită decizie", anaf: "Acceptată", confidence: 89, match: "Parțială" },
  { id: "GO-88104", supplier: "Green Office Distribution SRL", cif: "RO29176042", reason: "Cotă TVA diferită față de comandă", amountMinor: 1_249_560, risk: 67, severity: "Mediu", due: "Mâine", status: "În analiză", anaf: "Acceptată", confidence: 84, match: "Parțială" },
  { id: "DF-10921", supplier: "Delta Facility SRL", cif: "RO37290415", reason: "Cont bancar schimbat recent", amountMinor: 14_603_230, risk: 95, severity: "Critic", due: "Astăzi", status: "Necesită decizie", anaf: "Acceptată", confidence: 91, match: "Exactă" },
  { id: "ET-44190", supplier: "Electro Team SRL", cif: "RO13870420", reason: "Fără corespondent în registrul ERP", amountMinor: 874_300, risk: 58, severity: "Mediu", due: "31 iul.", status: "Caz deschis", anaf: "Acceptată", confidence: 72, match: "Nepotrivită" },
  { id: "AC-88210", supplier: "Arco Construct SA", cif: "RO45820133", reason: "Reconciliere completă, fără abateri", amountMinor: 2_267_800, risk: 12, severity: "Scăzut", due: "4 aug.", status: "Aprobată", anaf: "Acceptată", confidence: 99, match: "Exactă" },
];

export const initialAudit: AuditEvent[] = [
  { id: "EV-8094", time: "29 iul. 2026, 10:42", actor: "Ioana Marinescu", action: "Caz atribuit", entity: "C-2026-0184", result: "Succes", hash: "ac19ae6003d3bba08341aaa844ae967069cd837472465924a5ca16faad62f69a" },
  { id: "EV-8093", time: "29 iul. 2026, 10:39", actor: "Serviciu SPV", action: "Sincronizare finalizată", entity: "LOT-2907", result: "154 acceptate", hash: "ca7c65fa4289bfa3232ede2a9b39c017a0efcf2c3b670f41f136a2744fec243f" },
  { id: "EV-8092", time: "29 iul. 2026, 10:35", actor: "Motor rules-v1.8", action: "Risc evaluat", entity: "DF-10921", result: "95 · critic", hash: "a443d08c0a6e43dc60a94340146f59caf807ffb241b40c497fc3d11c6fe98fa1" },
  { id: "EV-8091", time: "29 iul. 2026, 10:31", actor: "Andrei Popescu", action: "Factură aprobată", entity: "AC-88210", result: "Succes", hash: "33748f0b08dbca6e631c858b67ae110e48f577b660c41be933124747429c3bcc" },
];

export const navGroups = [
  [{ id: "overview", label: "Prezentare generală", icon: "⌂" }, { id: "invoices", label: "Facturi", icon: "▤", badge: "18" }, { id: "reconciliation", label: "Reconciliere", icon: "⇄" }, { id: "cases", label: "Cazuri", icon: "◉", badge: "6" }],
  [{ id: "efactura", label: "e-Factura", icon: "◇" }, { id: "suppliers", label: "Furnizori", icon: "◫" }, { id: "analytics", label: "Analize", icon: "⌁" }, { id: "audit", label: "Jurnal de audit", icon: "✓" }],
  [{ id: "integrations", label: "Integrări", icon: "⊞" }, { id: "settings", label: "Setări", icon: "⚙" }],
] as const;

export const kpis = [
  { label: "Scor de integritate", value: "94,2", suffix: "/100", note: "+2,1 față de perioada anterioară", tone: "positive", spark: [34, 42, 39, 55, 49, 66, 73] },
  { label: "Necesită decizie", value: "18", suffix: "facturi", note: "6 critice · 4 scad astăzi", tone: "warning", spark: [58, 48, 61, 52, 44, 38, 31] },
  { label: "Impact financiar", value: "248.730,40", suffix: "RON", note: "Sumă expusă, nu pierdere confirmată", tone: "neutral", spark: [29, 41, 37, 52, 48, 57, 43] },
  { label: "Livrare e-Factura", value: "98,7%", suffix: "", note: "154 din 156 acceptate de ANAF", tone: "positive", spark: [62, 68, 63, 74, 78, 76, 84] },
];
