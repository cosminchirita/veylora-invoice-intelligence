# Ghid de demonstrație

Acest ghid prezintă un scenariu de 5–7 minute pentru **Factura Integrity**, destinat unui potențial client, partener tehnic sau evaluator. Versiunea curentă este un demo funcțional cu date fictive: nu transmite documente către ANAF, nu citește un ERP și nu inițiază plăți bancare.

## Obiectivul demonstrației

În mai puțin de șapte minute, publicul trebuie să înțeleagă trei lucruri:

1. platforma concentrează într-un singur loc facturile, reconcilierea și răspunsurile e-Factura;
2. fiecare alertă prezintă dovezi și separă severitatea de nivelul de încredere;
3. decizia umană și contextul ei pot fi urmărite în jurnalul de audit.

## Pregătire

- pornește aplicația conform instrucțiunilor din README;
- folosește o fereastră de browser la minimum 1280 × 800 px;
- nu încărca facturi reale, date personale sau informații comerciale confidențiale;
- reîncarcă pagina înaintea demonstrației pentru a reveni la setul inițial de date;
- păstrează deschisă factura demonstrativă `NVL-7712` ca reper principal.

## Scenariul recomandat — 5–7 minute

### 0:00–0:45 — Context și valoare

Deschide **Prezentare generală** și explică pe scurt problema:

> Echipele financiare verifică aceleași informații în SPV, ERP și extrasul bancar. Factura Integrity grupează semnalele, prioritizează impactul financiar și păstrează o urmă a deciziilor.

Indică fără a citi toate valorile:

- scorul de integritate;
- numărul facturilor care necesită decizie;
- impactul financiar expus;
- starea fluxului e-Factura și reconcilierea automată.

Menționează că valorile sunt demonstrative și nu reprezintă o conexiune ANAF activă.

### 0:45–2:15 — Alertă explicabilă

În secțiunea **Necesită atenția ta**, selectează **Analizează** pentru `NVL-7712`.

Prezintă:

- severitatea **Critic** și scorul de risc `92/100`;
- motivul semnalării: posibil duplicat;
- încrederea `96%` ca măsură distinctă de severitate;
- dovezile verificabile: CIF, sumă, dată și similaritatea liniilor;
- compoziția scorului: reguli, anomalii, istoric furnizor și calitatea datelor.

Formulare recomandată:

> Severitatea estimează consecința și prioritatea operațională. Încrederea arată cât de solide sunt dovezile pentru constatarea respectivă. O alertă poate avea impact mare, dar încredere modestă, caz în care o trimitem obligatoriu la revizie.

### 2:15–3:30 — Comparația documentelor

Apasă **Compară documentele**.

Evidențiază comparația dintre `NVL-7712` și `NVL-7688`:

- furnizor, CIF, data, totalul și liniile sunt identice;
- numărul documentului este diferit;
- similaritatea afișată este `99,4%`;
- recomandarea este revizia documentului original, nu respingerea automată.

Închide comparația cu **Am înțeles · închide**.

### 3:30–4:30 — Control uman

Apasă **Aprobă factura** și arată că, pentru risc critic, aprobarea este blocată până la confirmarea verificării dovezilor. Adaugă un comentariu demonstrativ, de exemplu:

> Reemitere confirmată prin documentul original; factura precedentă a fost anulată.

Confirmă doar dacă vrei să demonstrezi înregistrarea deciziei. Alternativ, folosește **Deschide caz** pentru a prezenta escaladarea către investigație.

Mesajul principal:

> Sistemul recomandă și explică; responsabilitatea aprobării rămâne la un utilizator autorizat.

### 4:30–5:30 — Auditabilitate

Deschide **Jurnal de audit** și arată:

- actorul, momentul, acțiunea, entitatea și rezultatul;
- legarea evenimentelor prin hash în demo;
- exportul CSV cu protecție contra formulelor executabile în aplicații de calcul tabelar.

Precizează limita: lanțul demonstrativ detectează modificări accidentale în sesiunea curentă, dar nu este încă un registru criptografic persistent, semnat sau ancorat extern.

### 5:30–6:30 — Import și integrări

Deschide **Încarcă factură** și prezintă formatele XML, CSV și JSON, limita de 5 MB și validarea anti-XXE. Nu încărca un document real în prezentarea publică.

Deschide apoi **Integrări** pentru a arăta direcțiile ANAF/SPV, ERP și bancă. Spune explicit că acestea sunt carduri demonstrative, iar conectorii de producție se află în roadmap.

### 6:30–7:00 — Încheiere

Încheie cu rezultatul de business:

> Factura Integrity reduce timpul de triere, explică de ce o factură a fost semnalată și păstrează decizia auditabilă. Următorul pas este un pilot izolat, cu date minimizate și conectori read-only pentru sistemele clientului.

## Întrebări frecvente

### Este deja conectată la ANAF?

Nu. Interfața simulează stări SPV/e-Factura. Conectorul real necesită contract API, autentificare, gestionarea certificatelor/tokenurilor, retry, idempotency și monitorizare.

### Folosește inteligență artificială?

Demo-ul folosește un motor determinist de reconciliere și date preconfigurate pentru explicații. Nu există în versiunea curentă un model ML antrenat care să ia decizii financiare. Arhitectura propusă permite ulterior modele de anomalie și similaritate, guvernate conform `AI_GOVERNANCE.md`.

### Poate aproba sau plăti automat facturi?

Nu. Demo-ul simulează aprobarea în interfață și nu inițiază plăți. Pentru producție sunt necesare roluri, separarea atribuțiilor, politici de aprobare și controale specifice clientului.

### Datele rămân salvate?

Nu în această versiune. Starea este locală și temporară. Reîncărcarea paginii poate readuce setul demonstrativ inițial.

### Este pregătită pentru producție?

Nu încă. Este un demo prezentabil și testabil. Cerințele pentru producție sunt descrise în `ROADMAP.md`, iar condițiile de privacy și guvernanță în documentele dedicate.

## Ce nu trebuie afirmat într-o prezentare

- că platforma este certificată sau aprobată de ANAF;
- că scorurile sunt predicții ML validate statistic;
- că jurnalul curent oferă non-repudiere juridică;
- că datele sunt persistente, criptate sau izolate per client în demo;
- că produsul poate înlocui controlul financiar, juridic sau fiscal uman.

