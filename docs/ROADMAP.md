# Roadmap către producție

Roadmap-ul transformă demo-ul într-o platformă financiară controlată, observabilă și auditabilă. Ordinea este intenționată: fundația de securitate și date precede automatizarea avansată. Termenele sunt estimative și se stabilesc după workshop-ul tehnic cu primul client.

## Starea curentă — v0.1 demo

Disponibil:

- interfață responsive pentru dashboard, facturi, reconciliere, cazuri, e-Factura, furnizori, analytics, audit și integrări;
- motor demonstrativ de potrivire deterministă;
- comparație explicabilă a două documente;
- import local XML/CSV/JSON, limită de 5 MB și control de bază anti-XXE;
- confirmare umană pentru aprobarea unei facturi cu risc critic;
- evenimente de audit temporare și export CSV protejat contra formula injection;
- teste automate pentru funcțiile centrale și randarea aplicației.

Nu este disponibil încă:

- autentificare și autorizare în aplicație;
- persistență multi-tenant;
- conector real ANAF/SPV, ERP sau bancar;
- procesare asincronă, cozi, retry și idempotency distribuită;
- management de secrete, criptare operațională și backup;
- model ML antrenat și validat;
- SLA/SLO, observabilitate și proceduri de incident de producție.

## Faza 1 — Fundație de pilot

**Obiectiv:** un mediu izolat în care clientul poate evalua fluxul cu un set minim și controlat de date.

- arhitectură multi-tenant cu `tenant_id` impus la fiecare nivel;
- PostgreSQL administrat, migrații și schemă pentru facturi, documente, cazuri, decizii și evenimente;
- stocare de obiecte criptată pentru documentele originale;
- SSO/OIDC, MFA, RBAC și roluri `Operator`, `Aprobator`, `Auditor`, `Administrator`;
- separarea atribuțiilor pentru cazurile cu impact mare;
- secret manager, rotație și inventarul credențialelor;
- API versionat, validare strictă, limite de dimensiune și scanare malware;
- jurnal append-only persistent cu ID de corelare;
- CI/CD cu medii separate, scanări de dependențe și policy gates;
- backup, restaurare testată și procedură de ștergere;
- set de date sintetice și seed reproductibil pentru demonstrații.

**Criteriu de ieșire:** testele de izolare, autorizare, backup/restore și threat model sunt aprobate; nu există acces write către sistemele clientului.

## Faza 2 — Conector ANAF/SPV și e-Factura

**Obiectiv:** ingestie reală, read-only, rezilientă și trasabilă a documentelor și răspunsurilor.

- clarificarea contractului tehnic și a fluxului de autorizare aplicabil;
- certificate/tokenuri gestionate în secret manager, fără expunere în loguri;
- sincronizare incrementală cu watermark și reconciliere periodică completă;
- idempotency per identificator extern și hash de document;
- coadă de procesare, retry cu backoff, dead-letter queue și replay controlat;
- stocarea payloadului original, a răspunsului și a metadatelor de proveniență;
- maparea codurilor de eroare și runbook pentru indisponibilitate;
- limitarea traficului și protejarea împotriva duplicatelor/reordonării;
- monitorizare pentru întârzierea sincronizării, erori și expirarea credențialelor.

**Criteriu de ieșire:** importul este comparat cu SPV pe o perioadă pilot, fără pierderi sau duplicate, iar fiecare document este trasabil până la răspunsul sursă.

## Faza 3 — Conectori ERP

**Obiectiv:** reconcilierea factură–comandă–recepție într-un flux read-only.

- contract canonic pentru furnizor, comandă, recepție, factură, centru de cost și stare;
- adaptor inițial pentru ERP-ul clientului, de exemplu SAP S/4HANA sau SmartBill;
- mapări versionate și reguli pentru monedă, TVA, toleranțe, unități și facturi storno;
- controlul latenței și al datelor lipsă;
- reconciliere în trei pași și explicații la nivel de câmp/linie;
- reprocessare deterministă după corectarea mapării;
- portal de configurare cu four-eyes approval pentru pragurile materiale.

**Criteriu de ieșire:** rezultatele pe eșantionul etichetat ating pragurile convenite, iar excepțiile pot fi explicate și reproduse.

## Faza 4 — Date bancare și reconcilierea plăților

**Obiectiv:** potrivirea plăților fără inițierea lor.

- alegerea canalului: Open Banking, API bancar, MT940/camt.053 sau import controlat;
- consimțământ, expirarea autorizării și privilegii read-only;
- tokenizare/mascare IBAN și minimizarea descrierilor tranzacțiilor;
- idempotency și de-duplicare pentru tranzacții;
- reconciliere unu-la-unu, unu-la-mai-multe, plăți parțiale și comisioane;
- alertă pentru schimbarea contului furnizorului, cu verificare separată;
- controale împotriva fraudelor de tip business email compromise;
- separare strictă față de orice serviciu de inițiere a plății.

**Criteriu de ieșire:** acoperirea și fals-pozitivele sunt măsurate pe un ciclu financiar complet; aplicația nu poate iniția transferuri.

## Faza 5 — AI/ML validat

**Obiectiv:** reducerea trierei manuale fără a elimina controlul uman.

- registru de reguli și modele cu fișe de model;
- dataset etichetat, guvernat și separat pe perioade/furnizori;
- detector de anomalii pentru sumă, frecvență, cont și comportament;
- similaritate semantică a liniilor numai după validarea deterministă a valorilor;
- calibrarea încrederii și mecanism de abstinență;
- explicații bazate pe contribuțiile caracteristicilor și documentele sursă;
- evaluare pe segmente, shadow mode și comparație champion/challenger;
- monitorizarea driftului și rollback per versiune;
- feedback uman folosit numai după verificare și control de calitate.

**Criteriu de ieșire:** metricile și pragurile sunt aprobate de controlul financiar, privacy și securitate, iar acțiunile cu impact rămân human-in-the-loop.

## Faza 6 — Hardening și disponibilitate generală

**Obiectiv:** operare predictibilă pentru mai mulți clienți și volume reale.

- SLO pentru disponibilitate, latență, prospețimea datelor și rata de procesare;
- dashboard-uri, alerte acționabile, tracing și metrici per conector;
- autoscaling, backpressure și limite per tenant;
- teste de încărcare, chaos testing și disaster recovery;
- RPO/RTO contractuale și exerciții de restaurare;
- penetration test independent și remedierea constatărilor;
- proceduri de incident, rotație on-call și comunicare către client;
- audit periodic de acces, secrete, retenție și sub-procesatori;
- documentație operațională, training și criterii de onboarding/offboarding.

**Criteriu de ieșire:** SLO-urile sunt demonstrate într-o perioadă de stabilitate, testele de securitate sunt închise și runbook-urile sunt exersate.

## Backlog transversal prioritar

### Securitate

- threat model pentru upload, conectori, multi-tenancy și export;
- verificare antivirus, content sniffing și arhive comprimate;
- autorizare la nivel de obiect și teste contra IDOR;
- CSP, CSRF, rate limiting și protecția sesiunii;
- SBOM, semnarea artefactelor și provenance pentru build.

### Privacy și conformitate

- evidența prelucrărilor și DPIA;
- matrice de retenție configurabilă, cu legal hold;
- rezidență și sub-procesatori per client;
- export/ștergere și auditarea solicitărilor;
- politici clare pentru utilizarea datelor cu servicii AI.

### Auditabilitate

- evenimente imuabile și versionate;
- semnare/HMAC, rotația cheilor și verificare periodică;
- snapshot al regulilor și datelor folosite la fiecare decizie;
- export semnat și verificator independent;
- fus orar, sincronizare a ceasului și ordine cauzală documentată.

### Experiență de produs

- onboarding ghidat și date demo separate;
- filtre salvate, căutare și cozi pe roluri;
- comparație de documente accesibilă și imprimabilă;
- justificări structurate pentru decizie;
- notificări fără expunerea datelor sensibile;
- accesibilitate WCAG 2.2 AA și testare cu utilizatori financiari.

## Indicatori de succes pentru pilot

- timpul median până la prima analiză și până la închiderea cazului;
- procentul facturilor reconciliate fără conflict;
- precision/recall și rata de abstinență pentru fiecare tip de alertă;
- valoarea duplicatelor confirmate, fără a o confunda cu economii garantate;
- rata de corectare a recomandărilor de către operatori;
- prospețimea datelor și numărul de erori de conector;
- procentul deciziilor cu dovezi și justificare completă;
- incidente de izolare sau acces neautorizat: țintă zero.

## Principii de lansare

1. date sintetice înaintea datelor reale;
2. conector read-only înaintea oricărui write-back;
3. shadow mode înaintea automatizării;
4. pilot cu un singur flux și volum limitat înainte de extindere;
5. rollback testat înaintea promovării;
6. afirmații comerciale susținute numai de metrici măsurate în pilot.

