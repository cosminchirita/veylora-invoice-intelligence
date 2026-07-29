# Privacy și protecția datelor

Acest document descrie principiile de privacy pentru Factura Integrity și diferențiază capabilitățile demo de cerințele unei implementări reale. Nu reprezintă consultanță juridică; operatorul trebuie să confirme obligațiile aplicabile împreună cu responsabilul cu protecția datelor și consilierii săi.

## Starea versiunii demonstrative

- folosește date fictive incluse în interfață;
- nu are conectori reali ANAF/SPV, ERP sau bancari;
- nu oferă persistență operațională pentru facturile importate;
- starea și evenimentele create în interfață sunt temporare;
- autentificarea site-ului de prezentare nu echivalează cu identitatea și autorizarea aplicației de producție;
- nu trebuie utilizată pentru facturi reale, CNP-uri, IBAN-uri, contracte sau alte informații confidențiale.

## Roluri și responsabilități

Într-o instalare pentru client, rolurile se stabilesc contractual:

- clientul este, de regulă, operatorul datelor pentru facturile și utilizatorii proprii;
- furnizorul platformei poate fi persoană împuternicită și procesează numai instrucțiunile documentate;
- furnizorii de hosting, observabilitate, OCR sau AI sunt sub-procesatori și trebuie listați, evaluați și contractați;
- pentru sursele ANAF, ERP și bancare se documentează separat temeiul, scopul și responsabilitățile.

Înaintea unui pilot sunt necesare inventarul prelucrărilor, acordul de prelucrare, lista sub-procesatorilor și, când riscul o impune, o evaluare DPIA.

## Categorii de date

Datele pot include:

- identificatori fiscali și date comerciale ale furnizorilor;
- nume, funcții și date de contact ale persoanelor autorizate;
- numere de factură, linii, cantități, prețuri, TVA și termene;
- IBAN și informații despre plăți;
- comenzi, recepții și identificatori ERP;
- mesaje și coduri de răspuns e-Factura;
- decizii, comentarii, identitatea actorului și evenimente de audit;
- metadate tehnice de securitate, precum IP, sesiune și ID de corelare.

Factura poate conține accidental date personale în câmpuri libere sau atașamente. Aceste câmpuri necesită controale suplimentare și nu trebuie trimise implicit către servicii AI.

## Scop și minimizare

Datele sunt prelucrate numai pentru ingestie, validare, reconciliere, detectarea abaterilor, administrarea cazurilor și audit. Principii obligatorii:

- se colectează numai câmpurile necesare fiecărui control;
- documentul brut este separat de reprezentarea normalizată;
- logurile nu conțin corpul facturii, tokenuri, certificate sau secrete;
- datele pentru analytics sunt agregate sau pseudonimizate când este posibil;
- mediile de dezvoltare și test folosesc date sintetice;
- accesul suportului la datele clientului este temporar, justificat și auditat.

## Retenție și ștergere

Valoarea „7 ani” afișată în demo este doar un exemplu de politică, nu o regulă juridică universală. În producție, clientul aprobă o matrice de retenție pe categorii și jurisdicții.

| Categorie | Politică de pornire propusă | Observații |
| --- | --- | --- |
| document fiscal original | conform obligației legale și politicii clientului | păstrare WORM/immutability dacă este necesară |
| date normalizate și reconciliere | corelată cu documentul și perioada de contestare | poate fi redusă după închiderea cazului |
| cazuri și decizii | conform controalelor financiar-contabile și auditului | include motivul și actorul |
| loguri operaționale | 30–90 zile | fără conținut financiar sensibil |
| loguri de securitate | 180–365 zile, bazat pe risc | acces limitat echipei de securitate |
| fișiere temporare/OCR | minute sau ore | ștergere imediat după procesare validată |
| backup-uri | fereastră definită contractual | expirare automată și restaurări auditate |

Ștergerea trebuie să se propage în stocarea primară, indexuri, cache-uri și copii de siguranță conform unei ferestre documentate. O obligație de conservare legală suspendă ștergerea numai pentru obiectele și perioada necesare. Ștergerea și expirarea sunt evenimente auditate.

## Drepturile persoanelor vizate

Arhitectura de producție trebuie să permită căutarea controlată, exportul, rectificarea, restricționarea și ștergerea datelor personale, acolo unde obligațiile fiscale și temeiul legal permit. Solicitările sunt autentificate, aprobate și înregistrate; jurnalul de audit nu este rescris, ci poate păstra o referință minimă pseudonimizată către acțiunea efectuată.

## Securitate și acces

Cerințe minime pentru producție:

- SSO/OIDC cu MFA și politici de sesiune;
- RBAC/ABAC și separarea atribuțiilor dintre operator, aprobator, auditor și administrator;
- izolare strictă per organizație la nivel de API, date, cache și obiecte;
- criptare TLS în tranzit și criptare la stocare cu chei gestionate;
- secrete în secret manager, rotație și acces fără export;
- protecție contra malware, XML extern, decompression bombs și fișiere poliglote;
- URL-uri semnate pe termen scurt pentru documente;
- rate limiting, protecție CSRF și verificări de autorizare pentru fiecare obiect;
- mascarea datelor sensibile în interfață și exporturi;
- copii de siguranță criptate și teste periodice de restaurare.

## Izolare, rezidență și transferuri

Locația datelor, replica, backup-ul și serviciile de observabilitate trebuie stabilite înainte de onboarding. Transferurile în afara spațiului aprobat de client necesită un mecanism legal adecvat și evaluarea furnizorilor. Pentru clienții cu cerințe stricte se recomandă chei dedicate, separare logică verificată și opțiune de implementare regională.

## AI și utilizarea datelor

- datele clientului nu sunt folosite la antrenarea modelelor generale fără acord explicit și bază legală;
- trimiterea către un furnizor AI este dezactivată implicit până la evaluarea privacy și contractuală;
- câmpurile sunt minimizate și pseudonimizate înainte de inferență;
- prompturile și răspunsurile nu sunt păstrate mai mult decât este necesar;
- un LLM nu primește tokenuri ANAF, credențiale ERP sau date bancare complete;
- rezultatele generate sunt etichetate și nu înlocuiesc documentul sursă;
- drepturile, retenția și ștergerea se aplică și datelor derivate.

## Audit și transparență

Un eveniment de audit de producție trebuie să conțină actorul, acțiunea, obiectul, momentul, motivul, rezultatul, versiunea politicii și ID-ul de corelare. Se evită includerea valorilor complete ale documentului. Accesul la jurnal și exporturile sunt la rândul lor auditate.

Lanțul hash demonstrativ nu este suficient pentru non-repudiere. Pentru producție sunt necesare stocare append-only, semnare/HMAC cu chei rotite, marcaj temporal de încredere și verificări independente, în funcție de cerința clientului.

## Incidente și încălcări ale securității

Planul operațional trebuie să includă detectare, clasificare, izolare, păstrarea probelor, evaluarea impactului, notificarea responsabililor și remedierea. Termenele de notificare se stabilesc conform rolurilor contractuale și legislației aplicabile. Exercițiile periodice trebuie să includă acces între clienți, scurgerea unui export și compromiterea unui conector.

## Checklist înainte de date reale

- [ ] clasificarea datelor și evidența activităților de prelucrare sunt aprobate;
- [ ] temeiurile, acordul de prelucrare și sub-procesatorii sunt documentați;
- [ ] DPIA a fost evaluată și efectuată dacă este necesar;
- [ ] rezidența, transferurile și cheia de criptare sunt convenite;
- [ ] SSO, MFA, rolurile și separarea atribuțiilor sunt testate;
- [ ] matricea de retenție și ștergerea end-to-end sunt validate;
- [ ] logurile și observabilitatea au fost verificate pentru date sensibile;
- [ ] conectorii pornesc read-only și folosesc credențiale cu privilegii minime;
- [ ] procedura de incident și persoanele de contact sunt stabilite;
- [ ] setul pilot este minimizat și aprobat de client.

