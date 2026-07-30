# Guvernanța AI și a deciziilor automate

Veylora Invoice Intelligence este concepută ca un sistem de **asistență a deciziei**, nu ca autoritate autonomă pentru aprobarea, respingerea, contabilizarea sau plata unei facturi. În versiunea demonstrativă, rezultatele sunt generate de reguli deterministe și date preconfigurate. Nu este livrat un model ML antrenat.

## Principii

1. **Control uman proporțional cu riscul.** O alertă critică nu trebuie aprobată automat.
2. **Explicație înaintea deciziei.** Utilizatorul vede semnalul, dovezile și sursele relevante.
3. **Separarea probabilității de impact.** Încrederea și severitatea nu sunt sinonime.
4. **Proveniență verificabilă.** Fiecare rezultat trebuie să indice datele, regulile/modelul și versiunea folosită.
5. **Reproductibilitate.** Aceeași intrare și aceeași versiune trebuie să producă același rezultat pentru componentele deterministe.
6. **Contestabilitate.** Utilizatorii autorizați pot corecta rezultatul și documenta motivul.
7. **Minimizarea datelor.** Modelele primesc numai atributele strict necesare scopului declarat.
8. **Eșec sigur.** Lipsa datelor, indisponibilitatea unei surse sau degradarea modelului conduc la revizie, nu la aprobare automată.

## Încredere, scor de risc și severitate

Cele trei concepte trebuie afișate și evaluate separat:

| Concept | Întrebarea la care răspunde | Exemplu | Cum este folosit |
| --- | --- | --- | --- |
| Încredere | Cât de solide sunt dovezile pentru constatare? | 96% încredere că două documente sunt similare | determină dacă rezultatul poate fi recomandat sau trebuie revizuit |
| Scor de risc | Cât de importantă este abaterea în contextul curent? | 92/100 | prioritizează coada de lucru; nu este probabilitate de fraudă |
| Severitate | Ce nivel de răspuns operațional este necesar? | Critic | aplică praguri, SLA și aprobări suplimentare |

Reguli de interpretare:

- `96% încredere` nu înseamnă `96% probabilitate de fraudă`;
- un risc ridicat poate rezulta din impact financiar mare chiar dacă încrederea este moderată;
- un rezultat cu încredere joasă nu trebuie transformat într-o concluzie categorică;
- pragurile trebuie calibrate pe datele și toleranța la risc ale fiecărui client;
- nicio valoare nu trebuie folosită singură pentru blocarea definitivă a unui furnizor sau pentru o consecință juridică.

## Niveluri de automatizare propuse

| Nivel | Exemplu | Control minim |
| --- | --- | --- |
| A0 — informare | afișarea stării e-Factura | trasabilitatea sursei |
| A1 — recomandare | semnalarea unui duplicat probabil | explicație și opțiune de contestare |
| A2 — triere | prioritizarea cazurilor | praguri aprobate și monitorizare |
| A3 — acțiune reversibilă | plasarea temporară în așteptare | rol autorizat, jurnal și termen de expirare |
| A4 — acțiune financiară | aprobare/plată | în afara scopului implicit; necesită controale suplimentare și aprobare explicită |

Demo-ul operează la A0–A1 și simulează o parte din fluxul A2. Nu execută acțiuni bancare sau contabile reale.

## Proveniența unei recomandări

În producție, fiecare evaluare trebuie să păstreze cel puțin:

- identificatorul facturii și versiunea normalizată a documentului;
- identificatorii surselor: SPV, ERP, registru furnizori, plată;
- marcajele temporale de preluare și versiunea schemei de date;
- câmpurile efectiv utilizate sau hash-uri referențiabile ale acestora;
- versiunea regulilor, modelului, vocabularului și configurației de praguri;
- scorurile intermediare și explicația finală;
- actorul sau serviciul care a declanșat evaluarea;
- decizia umană, motivul, eventualele corecții și legătura către caz;
- identificatorul rulării și un ID de corelare end-to-end.

Datele lipsă trebuie marcate ca lipsă, nu completate silențios. O reluare a procesării nu trebuie să suprascrie evaluarea veche; produce o versiune nouă legată de cea anterioară.

## Fișe de model și registru de componente

Fiecare componentă care contribuie la o recomandare are o fișă de model, inclusiv regulile deterministe. Fișa trebuie versionată odată cu codul și să conțină:

- nume, proprietar și versiune;
- scop declarat și utilizări interzise;
- surse și categorii de date de intrare;
- ieșiri, praguri și semnificația scorurilor;
- populația/perioada pe care a fost validată;
- metrici globale și pe segmente relevante;
- limitări cunoscute și moduri de eșec;
- cerințe de revizie umană;
- istoricul aprobărilor și modificărilor;
- strategie de monitorizare, rollback și retragere.

### Fișă actuală: `rules-v1.8` (demo)

| Câmp | Valoare |
| --- | --- |
| Tip | motor determinist demonstrativ |
| Scop | ilustrarea reconcilierii și a explicațiilor în interfață |
| Intrări | identificator document, identitate furnizor, monedă, diferență de sumă, diferență de dată și similaritatea referinței |
| Ieșiri | scor de potrivire și clasificare `EXACT`, `PROBABLE`, `UNMATCHED` sau `CONFLICT` |
| Praguri în cod | `EXACT ≥ 95%`, `PROBABLE ≥ 75%`; moneda diferită produce `CONFLICT` |
| Calibrare statistică | inexistentă; valorile din interfață sunt date demonstrative |
| Utilizare permisă | demonstrație, test local, discuții de produs |
| Utilizare interzisă | decizii financiare reale, acuzații de fraudă, evaluarea juridică a furnizorilor |

Această fișă nu validează un model ML și nu trebuie prezentată ca dovadă de precizie în producție.

## Evaluare înainte de producție

Înainte ca o versiune să influențeze un proces financiar real sunt obligatorii:

1. definirea erorilor acceptabile și a costului fals-pozitivelor/fals-negativelor;
2. set de evaluare reprezentativ, separat de datele de dezvoltare;
3. măsurarea precision, recall, rată de abstinență și timp economisit, pe categorii de furnizori și documente;
4. validarea pragurilor cu echipa financiară și risk/compliance;
5. testarea datelor lipsă, documentelor corupte, monedelor și regimurilor TVA neobișnuite;
6. adversarial testing pentru duplicate, date manipulate și prompt injection dacă este adăugat un LLM;
7. shadow mode, fără impact operațional, înainte de orice automatizare;
8. aprobarea formală a proprietarului de produs, securității, privacy și controlului financiar.

## Monitorizare și incidente

Monitorizarea de producție trebuie să includă:

- distribuția scorurilor și rata alertelor;
- rata de acceptare, respingere și corectare de către operatori;
- precision/recall pe eșantioane etichetate ulterior;
- drift al câmpurilor și al furnizorilor;
- diferențe între versiuni înainte de promovare;
- latență, erori, abstinențe și surse indisponibile;
- segmente cu rată disproporționată de fals-pozitive;
- accesul neautorizat sau exporturile neobișnuite.

La degradare sau incident, sistemul trece în mod sigur: oprește recomandările afectate, păstrează datele și versiunile pentru investigație, revine la versiunea aprobată și direcționează cazurile spre control manual.

## Utilizarea viitoare a unui LLM

Un LLM poate fi util pentru sumarizarea dovezilor sau asistarea căutării, dar nu trebuie să fie sursa de adevăr pentru sume, TVA, identități sau stări ANAF. Dacă este introdus:

- intrările sunt tratate ca date neîncrezătoare;
- extragerea financiară este validată prin scheme și reguli deterministe;
- răspunsurile includ citări către documentele sursă;
- prompturile, modelul și parametrii sunt versionați;
- datele clientului nu sunt folosite la antrenare fără o bază legală și un acord explicit;
- modelul poate refuza sau declara incertitudinea;
- decizia financiară rămâne separată de textul generat.

