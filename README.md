# Factura Integrity

**AI Invoice Integrity & E-Invoicing Reconciliation Platform** — un demo interactiv, auditabil și orientat spre privacy pentru detectarea duplicatelor, reconcilierea factură–ERP–plată și trierea riscului operațional.

> Stadiu: `1.0.0-demo.1`. Repository-ul folosește exclusiv date sintetice. Conectorii ANAF/SPV, ERP și bancari sunt simulați și nu trimit date către sisteme externe.

![Factura Integrity dashboard](docs/assets/dashboard.png)

## De ce există

Echipele financiare operează în sisteme fragmentate și investighează manual facturi duplicate, diferențe față de comenzi și erori de transmitere. Factura Integrity oferă o singură coadă de decizie cu dovezi verificabile, scoruri explicabile și controale human-in-the-loop.

## Demo-ul include

- dashboard operațional responsive, în limba română;
- registru de facturi, cazuri, furnizori, e-Factura, analize și integrări;
- reconciliere deterministă și scor de risc explicabil `rules-v1.8`;
- comparație alăturată pentru un posibil duplicat;
- import local XML/CSV/JSON, limită de 5 MB și protecție anti-XXE;
- aprobare cu verificare umană obligatorie pentru risc critic;
- evenimente SHA-256 și export CSV protejat contra formula injection;
- teste unitare, verificări de randare, CI, CodeQL și Dependabot.

![Comparație documente](docs/assets/document-comparison.png)

## Pornire rapidă în VS Code

Cerințe: Node.js 22 și pnpm 10.

```bash
git clone <URL-UL-REPOSITORY-ULUI>
cd ai-invoice-integrity-platform
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Deschide `http://localhost:3000`. Pentru VS Code, rulează task-ul **Factura Integrity: development server** sau comanda de mai sus. Demo-ul nu cere conturi, chei API ori baze de date.

## Quality gate

```bash
pnpm check
```

Comanda rulează type-check, lint, teste unitare, build, testul rezultatului randat și verificarea fixture-urilor demo. Comenzile pot fi executate și separat:

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:render
pnpm verify:demo
```

## Arhitectură

```text
Browser / React UI
       │
       ├── date sintetice tipizate
       └── motor determinist
             ├── validare upload
             ├── reconciliere & risc explicabil
             ├── protecție export CSV
             └── hash SHA-256 pentru audit
```

Demo-ul este deliberat self-contained și păstrează starea în browser. Arhitectura țintă separă ingestia, normalizarea, reconcilierea, cazurile și jurnalul append-only prin contracte idempotente și un outbox tranzacțional. Vezi [arhitectura](docs/ARCHITECTURE.md), [modelul de domeniu](docs/DOMAIN_MODEL.md) și [ADR-ul principal](docs/ADR/0001-modular-demo-architecture.md).

## Scenariu de prezentare

Ghidul complet de 5–7 minute este în [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md). Fluxul principal:

1. Deschide cazul critic `NVL-7712`.
2. Inspectează dovezile și apasă **Compară documentele**.
3. Închide comparația, confirmă verificarea umană și aprobă factura.
4. Încarcă un fixture din `samples/`.
5. Exportă jurnalul de audit.

## Structură

```text
app/          interfața și layout-ul aplicației
lib/          motorul de integritate și datele demonstrative
tests/        teste unitare și verificări ale build-ului
samples/      facturi și ledger demonstrative, inclusiv fixture negativ
docs/         arhitectură, privacy, AI governance, demo și roadmap
.github/      CI, CodeQL, Dependabot și șabloane de colaborare
.vscode/      task-uri și recomandări pentru dezvoltare
```

## Securitate, privacy și AI

- Nu încărca date reale sau credențiale în demo.
- Scorul asistă operatorul; nu produce decizii financiare autonome.
- `confidence`, `risk` și `severity` au semnificații distincte și sunt documentate.
- Pentru vulnerabilități, urmează [SECURITY.md](SECURITY.md), nu deschide un issue public.
- Detalii: [AI governance](docs/AI_GOVERNANCE.md) și [privacy](docs/PRIVACY.md).

Integrarea de producție necesită autentificare organizațională, autorizare pe roluri, secret manager, persistență, retenție, DPIA, contracte reale cu ANAF/ERP/banking, observabilitate și testare de reziliență. Aceste etape sunt în [roadmap](docs/ROADMAP.md).

## Contribuții și licență

Vezi [CONTRIBUTING.md](CONTRIBUTING.md) și [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Codul este disponibil sub licența [MIT](LICENSE).
