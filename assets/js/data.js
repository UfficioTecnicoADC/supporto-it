/* ============================================================
   Supporto IT - ADCO HUB
   Contenuti della knowledge base.

   Per aggiungere una guida basta inserire un nuovo oggetto in
   KB.articoli rispettando questi campi:

     id        stringa univoca, usata nell'URL (solo minuscole e trattini)
     titolo    titolo della guida
     categoria id di una categoria presente in KB.categorie
     tag       parole chiave usate dalla ricerca
     aggiornato data in formato AAAA-MM-GG
     minuti    tempo di lettura indicativo
     sommario  una o due righe di descrizione
     corpo     HTML del contenuto (h2, h3, p, ul, ol, table, div.nota)

   Nessun altro file va modificato: home, categorie e ricerca si
   aggiornano da sole.
   ============================================================ */

const KB = {
  organizzazione: "ADCO HUB",
  aggiornamento: "2026-08-28",

  categorie: [
    {
      id: "accessi",
      nome: "Account e accessi",
      icona: "chiave",
      descrizione: "Password, autenticazione a più fattori, account bloccati e permessi."
    },
    {
      id: "postazione",
      nome: "Postazione di lavoro",
      icona: "monitor",
      descrizione: "PC, portatili, monitor, periferiche e prestazioni della macchina."
    },
    {
      id: "microsoft365",
      nome: "Email e Microsoft 365",
      icona: "posta",
      descrizione: "Outlook, Teams, OneDrive, SharePoint e gli strumenti di collaborazione."
    },
    {
      id: "rete",
      nome: "Rete e connettività",
      icona: "wifi",
      descrizione: "Wi-Fi aziendale, Server, lavoro da remoto e problemi di connessione."
    },
    {
      id: "sicurezza",
      nome: "Sicurezza informatica",
      icona: "scudo",
      descrizione: "Phishing, gestione delle password, dati riservati e incidenti."
    },
    {
      id: "stampa",
      nome: "Stampa e scansione",
      icona: "stampante",
      descrizione: "Stampanti di rete, stampa sicura con badge, scansioni e toner."
    },
    {
      id: "software",
      nome: "Software e licenze",
      icona: "pacchetto",
      descrizione: "Installazioni, aggiornamenti, richieste di nuovi programmi e licenze."
    },
    {
      id: "procedure",
      nome: "Procedure e richieste",
      icona: "documento",
      descrizione: "Come aprire un ticket, onboarding, offboarding e richieste hardware."
    }
  ],

  articoli: [

    /* ---------------- ACCOUNT E ACCESSI ---------------- */

    {
      id: "reimpostare-password",
      titolo: "Reimpostare la password aziendale",
      categoria: "accessi",
      tag: ["password", "reset", "scadenza", "credenziali", "cambio password"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Come cambiare la password del proprio account aziendale, in autonomia o quando è già scaduta.",
      corpo: `
<p>La password aziendale è la stessa che usi per accedere al PC, alla posta e a tutti i servizi Microsoft 365. Ha una durata di 180 giorni: riceverai una notifica a partire da 14 giorni prima della scadenza.</p>

<h2>Cambiare la password dal PC aziendale</h2>
<ol>
  <li>Accedi al PC con le credenziali attuali.</li>
  <li>Premi <code>Ctrl + Alt + Canc</code>.</li>
  <li>Seleziona <strong>Cambia password</strong>.</li>
  <li>Inserisci la password attuale, poi la nuova password due volte.</li>
  <li>Conferma con <strong>Invio</strong>.</li>
</ol>

<h2>Cambiare la password da browser (anche fuori sede)</h2>
<ol>
  <li>Vai su <code>account.microsoft.com</code> e accedi con l'indirizzo aziendale.</li>
  <li>Apri <strong>Sicurezza</strong> &rarr; <strong>Modifica password</strong>.</li>
  <li>Completa la verifica con l'app Authenticator quando richiesto.</li>
</ol>

<div class="nota attenzione">
  <strong>Se sei fuori sede con il portatile</strong>
  Dopo aver cambiato la password da browser, collega il portatile alla VPN e blocca/sblocca lo schermo con la nuova password: serve a sincronizzare le credenziali salvate sul PC. Senza questo passaggio potresti non riuscire ad accedere al successivo riavvio.
</div>

<h2>Requisiti della password</h2>
<ul>
  <li>Almeno 12 caratteri.</li>
  <li>Almeno una maiuscola, una minuscola e un numero.</li>
  <li>Non deve contenere nome, cognome o nome utente.</li>
  <li>Non può coincidere con le ultime 5 password usate.</li>
</ul>

<h2>Password già scaduta o dimenticata</h2>
<p>Se non riesci più ad accedere, apri un ticket dal telefono o chiama il supporto IT: la password non può essere comunicata via email. Serve un riconoscimento telefonico prima del ripristino.</p>
`
    },

    {
      id: "configurare-mfa",
      titolo: "Configurare l'autenticazione a più fattori (MFA)",
      categoria: "accessi",
      tag: ["mfa", "2fa", "authenticator", "verifica", "sicurezza", "codice"],
      aggiornato: "2026-08-28",
      minuti: 4,
      sommario: "Attivazione di Microsoft Authenticator sul telefono: è obbligatoria per tutti gli account aziendali.",
      corpo: `
<p>L'autenticazione a più fattori aggiunge una seconda verifica oltre alla password. È attiva per tutti gli account e viene richiesta al primo accesso da un dispositivo nuovo o da fuori rete aziendale.</p>

<h2>Prima configurazione</h2>
<ol>
  <li>Installa <strong>Microsoft Authenticator</strong> dallo store del telefono (App Store o Google Play).</li>
  <li>Da PC vai su <code>aka.ms/mfasetup</code> e accedi con l'indirizzo aziendale.</li>
  <li>Scegli <strong>App di autenticazione</strong> come metodo predefinito.</li>
  <li>Nell'app sul telefono tocca <strong>+</strong> &rarr; <strong>Account aziendale o dell'istituto di istruzione</strong> &rarr; <strong>Scansiona codice QR</strong>.</li>
  <li>Inquadra il QR mostrato sul PC e conferma la notifica di prova.</li>
  <li>Aggiungi anche il <strong>numero di cellulare</strong> come metodo di riserva.</li>
</ol>

<div class="nota">
  <strong>Consiglio</strong>
  Configura sempre due metodi (app + SMS). Con un solo metodo, se perdi il telefono resti fuori dall'account e serve l'intervento del supporto IT.
</div>

<h2>Come funziona l'accesso quotidiano</h2>
<ul>
  <li>Dal PC aziendale in ufficio la richiesta compare raramente.</li>
  <li>Da remoto o da dispositivo personale ti arriva una notifica: devi digitare nell'app il numero mostrato a schermo.</li>
  <li>Se spunti <strong>Non chiedere più per 30 giorni</strong> su un dispositivo personale e affidabile, riduci le richieste.</li>
</ul>

<div class="nota critico">
  <strong>Non approvare mai richieste che non hai avviato tu</strong>
  Una notifica arrivata senza che tu stia facendo un accesso significa che qualcuno conosce la tua password. Rifiuta, cambia subito la password e segnala al supporto IT.
</div>
`
    },

    {
      id: "account-bloccato",
      titolo: "Account bloccato: cosa fare",
      categoria: "accessi",
      tag: ["account bloccato", "lockout", "tentativi", "accesso negato"],
      aggiornato: "2026-08-28",
      minuti: 2,
      sommario: "L'account si blocca dopo 8 tentativi errati. Ecco come sbloccarlo e quali sono le cause più frequenti.",
      corpo: `
<p>Dopo 8 tentativi di accesso errati l'account viene bloccato automaticamente per <strong>30 minuti</strong>. Trascorso quel tempo si sblocca da solo, senza bisogno di aprire un ticket.</p>

<h2>Cosa fare subito</h2>
<ol>
  <li>Attendi 30 minuti senza fare altri tentativi: ogni nuovo tentativo errato fa ripartire il conteggio.</li>
  <li>Se conosci la password, riprova dopo l'attesa.</li>
  <li>Se non la ricordi, chiedi il ripristino al supporto IT (vedi la guida sulla reimpostazione della password).</li>
</ol>

<h2>Cause più frequenti di blocchi ripetuti</h2>
<ul>
  <li><strong>Telefono con la vecchia password</strong>: la posta sul cellulare continua a provare l'accesso in background. Rimuovi e riaggiungi l'account sul telefono.</li>
  <li><strong>Sessione aperta su un altro PC</strong> rimasta con le vecchie credenziali.</li>
  <li><strong>Unità di rete o stampanti</strong> mappate con credenziali salvate ormai obsolete.</li>
  <li><strong>Tastiera in layout errato</strong> o <code>Bloc Maiusc</code> attivo.</li>
</ul>

<div class="nota">
  <strong>Se il blocco si ripete più volte al giorno</strong>
  Apri un ticket indicando l'orario esatto dei blocchi: dai log possiamo identificare quale dispositivo sta inviando le credenziali sbagliate.
</div>
`
    },

    {
      id: "cambio-telefono-mfa",
      titolo: "Cambiare telefono mantenendo l'MFA",
      categoria: "accessi",
      tag: ["mfa", "nuovo telefono", "authenticator", "migrazione", "smartphone"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Procedura da seguire prima e dopo la sostituzione dello smartphone per non perdere l'accesso.",
      corpo: `
<p>L'app Authenticator è legata al dispositivo: cambiando telefono va riconfigurata. La cosa più importante è farlo <strong>mentre hai ancora il vecchio telefono funzionante</strong>.</p>

<h2>Se hai ancora il vecchio telefono</h2>
<ol>
  <li>Sul vecchio telefono apri Authenticator &rarr; menu &rarr; <strong>Backup nel cloud</strong> e attivalo.</li>
  <li>Sul nuovo telefono installa Authenticator e scegli <strong>Ripristina da backup</strong>.</li>
  <li>Vai su <code>aka.ms/mfasetup</code> da PC e verifica che il nuovo dispositivo sia elencato.</li>
  <li>Rimuovi il vecchio dispositivo dall'elenco dei metodi.</li>
  <li>Fai un accesso di prova a Outlook sul web per confermare che tutto funzioni.</li>
</ol>

<h2>Se il vecchio telefono non è più disponibile</h2>
<ol>
  <li>Se hai configurato il numero di cellulare come metodo di riserva e la SIM è la stessa, accedi con il codice via SMS e poi riconfigura l'app.</li>
  <li>Altrimenti apri un ticket: il supporto IT azzera i metodi MFA dopo un riconoscimento telefonico.</li>
</ol>

<div class="nota attenzione">
  <strong>Prima di restituire o rottamare il vecchio telefono</strong>
  Rimuovi l'account aziendale dalle impostazioni del dispositivo ed esegui un ripristino ai dati di fabbrica.
</div>
`
    },

    /* ---------------- POSTAZIONE DI LAVORO ---------------- */

    {
      id: "pc-lento",
      titolo: "Il PC è lento: verifiche rapide",
      categoria: "postazione",
      tag: ["lento", "prestazioni", "riavvio", "memoria", "disco", "rallentamenti"],
      aggiornato: "2026-08-28",
      minuti: 4,
      sommario: "Cinque controlli da fare in autonomia prima di aprire un ticket per rallentamenti del computer.",
      corpo: `
<p>Gran parte dei rallentamenti si risolve in pochi minuti. Prova questi passaggi in ordine.</p>

<h2>1. Riavvia davvero il PC</h2>
<p>Chiudere il coperchio del portatile non è un riavvio. Usa <strong>Start &rarr; Arresta &rarr; Riavvia il sistema</strong>. Se il PC non viene riavviato da oltre una settimana, questo passaggio da solo risolve nella maggior parte dei casi.</p>

<h2>2. Controlla cosa sta consumando risorse</h2>
<ol>
  <li>Premi <code>Ctrl + Maiusc + Esc</code> per aprire Gestione attività.</li>
  <li>Nella scheda <strong>Processi</strong> ordina per <strong>CPU</strong>, poi per <strong>Memoria</strong>.</li>
  <li>Chiudi le applicazioni che non stai usando, in particolare le finestre di browser con molte schede aperte.</li>
</ol>

<h2>3. Verifica lo spazio libero su disco</h2>
<p>Apri <strong>Questo PC</strong> e guarda l'unità <code>C:</code>. Sotto il 10% di spazio libero il sistema rallenta sensibilmente. Svuota il Cestino e la cartella Download, e sposta i file personali su OneDrive.</p>

<h2>4. Chiudi le sincronizzazioni in corso</h2>
<p>Se l'icona di OneDrive mostra le frecce di sincronizzazione da molto tempo, è probabile che il disco sia sotto carico. Attendi il completamento prima di valutare altre cause.</p>

<h2>5. Installa gli aggiornamenti in sospeso</h2>
<p><strong>Impostazioni &rarr; Windows Update</strong>: se ci sono aggiornamenti in attesa di riavvio, il sistema resta in uno stato meno performante.</p>

<div class="nota">
  <strong>Se il problema resta</strong>
  Apri un ticket indicando da quando si verifica, se riguarda tutte le applicazioni o solo alcune, e il numero di inventario del PC (etichetta sul fondo o sul retro).
</div>
`
    },

    {
      id: "monitor-non-rilevato",
      titolo: "Monitor esterno non rilevato",
      categoria: "postazione",
      tag: ["monitor", "schermo", "docking", "hdmi", "displayport", "doppio schermo"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Cosa controllare quando il secondo schermo resta nero o non viene riconosciuto da Windows.",
      corpo: `
<h2>Controlli nell'ordine</h2>
<ol>
  <li><strong>Alimentazione</strong>: il LED del monitor è acceso? Se lampeggia, il monitor è in standby perché non riceve segnale.</li>
  <li><strong>Sorgente di ingresso</strong>: con il tasto <em>Source</em> o <em>Input</em> del monitor seleziona l'ingresso corretto (HDMI 1, HDMI 2, DisplayPort, USB-C).</li>
  <li><strong>Cavo</strong>: scollega e ricollega entrambe le estremità. I cavi DisplayPort hanno spesso un fermo da premere per estrarli.</li>
  <li><strong>Docking station</strong>: staccala dall'alimentazione per 10 secondi e ricollegala. È la causa più comune.</li>
  <li><strong>Rilevamento forzato</strong>: premi <code>Windows + P</code> e scegli <strong>Estendi</strong>. Se non basta, apri <strong>Impostazioni &rarr; Schermo</strong> e clicca su <strong>Rileva</strong>.</li>
</ol>

<div class="nota">
  <strong>Prova incrociata</strong>
  Se hai a disposizione un altro cavo o un'altra postazione, scambiali: individuare se il guasto è del cavo, del monitor o della dock ci fa risparmiare un intervento.
</div>

<h2>Risoluzione o disposizione sbagliata</h2>
<p>In <strong>Impostazioni &rarr; Schermo</strong> puoi trascinare i rettangoli per far corrispondere la disposizione dei monitor a quella reale sulla scrivania, e scegliere quale sia lo schermo principale con la casella <strong>Rendi schermo principale</strong>.</p>
`
    },

    {
      id: "audio-microfono",
      titolo: "Audio o microfono non funzionanti",
      categoria: "postazione",
      tag: ["audio", "microfono", "cuffie", "auricolari", "suono", "non mi sentono"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Come sistemare cuffie e microfono quando in riunione non ti sentono o non senti gli altri.",
      corpo: `
<p>Nella quasi totalità dei casi il problema è la selezione del dispositivo sbagliato, non un guasto.</p>

<h2>Selezionare il dispositivo giusto in Windows</h2>
<ol>
  <li>Clicca l'icona dell'altoparlante vicino all'orologio.</li>
  <li>Clicca la freccia accanto al cursore del volume e scegli le tue cuffie.</li>
  <li>Apri <strong>Impostazioni &rarr; Sistema &rarr; Audio</strong> e verifica anche l'<strong>Ingresso</strong>: parlando, la barra del livello deve muoversi.</li>
</ol>

<h2>Selezionare il dispositivo giusto in Teams</h2>
<ol>
  <li>In riunione clicca <strong>...</strong> &rarr; <strong>Impostazioni</strong> &rarr; <strong>Dispositivi</strong>.</li>
  <li>Imposta altoparlante e microfono sulle cuffie in uso.</li>
  <li>Usa <strong>Effettua una chiamata di prova</strong> per verificare prima di entrare in riunione.</li>
</ol>

<h2>Selezionare il dispositivo giusto in OpiVoice</h2>
<ol>
  <li>Nel portale <strong>OpiVoice</strong> clicca sull'icona dell'utente (l'“omino”) in alto a destra e apri <strong>Impostazioni</strong>. La posizione può variare leggermente in base alla visualizzazione del portale.</li>
  <li>Da <strong>Impostazioni</strong> seleziona <strong>Audio</strong>.</li>
  <li>Alla voce <strong>Microfono</strong>, nella sezione Ingressi audio, seleziona sempre il dispositivo che contiene la dicitura <strong>“USB”</strong>.</li>
  <li>Nella sezione Uscite audio controlla sia <strong>Chiamate</strong> sia <strong>Suonerie e avvisi</strong>. Per entrambe le voci seleziona l'opzione che contiene la dicitura <strong>“USB”</strong>.</li>
</ol>

<h2>Controlli fisici che sfuggono spesso</h2>
<ul>
  <li>Interruttore di muto sul cavo o sul padiglione delle cuffie.</li>
  <li>Braccetto del microfono sollevato: su molti modelli sollevarlo attiva il muto.</li>
  <li>Cuffie Bluetooth connesse al telefono invece che al PC.</li>
  <li>Jack inserito solo a metà o nella porta sbagliata.</li>
</ul>

<div class="nota attenzione">
  <strong>Cuffie Bluetooth in riunione</strong>
  Se l'audio è metallico o ovattato, Windows sta usando il profilo "mani libere". Chiudi le altre applicazioni che usano il microfono (browser con una riunione aperta, registratore) e riconnetti le cuffie.
</div>
`
    },

    {
      id: "aggiornamenti-windows",
      titolo: "Aggiornamenti Windows e riavvii programmati",
      categoria: "postazione",
      tag: ["windows update", "aggiornamenti", "riavvio", "patch", "manutenzione"],
      aggiornato: "2026-08-28",
      minuti: 2,
      sommario: "Come sono distribuite le patch di sicurezza e come programmare il riavvio senza perdere lavoro.",
      corpo: `
<p>Gli aggiornamenti di sicurezza vengono distribuiti automaticamente ai PC aziendali entro <strong>7 giorni</strong> dal rilascio Microsoft. Al termine dell'installazione è sempre necessario un riavvio.</p>

<h2>Programmare il riavvio</h2>
<ol>
  <li>Apri <strong>Impostazioni &rarr; Windows Update</strong>.</li>
  <li>Clicca <strong>Pianifica il riavvio</strong> e scegli un orario comodo entro la scadenza indicata.</li>
  <li>Se superi la scadenza, il riavvio parte in automatico fuori dall'orario di lavoro.</li>
</ol>

<h2>Ore di attività</h2>
<p>In <strong>Windows Update &rarr; Opzioni avanzate &rarr; Ore di attività</strong> imposta la tua fascia lavorativa: in quelle ore il PC non si riavvierà mai da solo.</p>

<div class="nota">
  <strong>Portatili usati poco</strong>
  Un portatile spento o scollegato per settimane accumula aggiornamenti e al rientro impiega molto tempo. Se torni da un periodo di assenza, accendi il PC e lasciarlo collegato alla rete per un'ora prima di iniziare a lavorare.
</div>
`
    },

    /* ---------------- EMAIL E MICROSOFT 365 ---------------- */

    {
      id: "outlook-non-si-connette",
      titolo: "Outlook non si connette alla posta",
      categoria: "microsoft365",
      tag: ["outlook", "posta", "disconnesso", "email", "non riceve"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Outlook mostra 'Disconnesso' o 'Tentativo di connessione': verifiche da fare in ordine.",
      corpo: `
<h2>1. Verifica che il problema sia solo di Outlook</h2>
<p>Apri <code>outlook.office.com</code> dal browser. Se lì la posta arriva regolarmente, il servizio funziona e il problema è sul client installato.</p>

<h2>2. Controlla la modalità offline</h2>
<p>In Outlook apri la scheda <strong>Invia/Ricevi</strong> e verifica che <strong>Lavora offline</strong> non sia selezionato (il pulsante appare evidenziato quando è attivo).</p>

<h2>3. Rete e VPN</h2>
<p>Se sei fuori sede, verifica di essere connesso a Internet e, se previsto per la tua postazione, alla VPN. Le reti Wi-Fi di hotel e aeroporti richiedono spesso un login sul portale prima di lasciare passare il traffico.</p>

<h2>4. Riavvia Outlook in modo pulito</h2>
<ol>
  <li>Chiudi Outlook.</li>
  <li>Apri Gestione attività (<code>Ctrl + Maiusc + Esc</code>) e termina eventuali processi <code>OUTLOOK.EXE</code> rimasti attivi.</li>
  <li>Riapri Outlook.</li>
</ol>

<h2>5. Credenziali scadute</h2>
<p>Se compare ripetutamente la richiesta di password, probabilmente hai cambiato la password di recente. Inseriscila aggiornata e spunta <strong>Memorizza credenziali</strong>. Se la finestra continua a ricomparire, apri un ticket: va ripulito il gestore credenziali di Windows.</p>

<div class="nota">
  <strong>Da segnalare nel ticket</strong>
  Testo esatto del messaggio di errore, se la posta sul web funziona, e se il problema riguarda anche altri colleghi del tuo ufficio.
</div>
`
    },

    {
      id: "firma-email",
      titolo: "Impostare la firma email aziendale",
      categoria: "microsoft365",
      tag: ["firma", "signature", "outlook", "email", "immagine aziendale"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Formato standard della firma e come configurarla in Outlook desktop e sul web.",
      corpo: `
<h2>Formato standard</h2>
<p>La firma aziendale contiene, su righe separate:</p>
<ul>
  <li>Nome e cognome</li>
  <li>Ruolo &ndash; Funzione o reparto</li>
  <li>Nome dell'azienda</li>
  <li>Telefono diretto e cellulare aziendale (se assegnato)</li>
  <li>Indirizzo email e sito web</li>
  <li>Indirizzo della sede</li>
</ul>

<div class="nota">
  <strong>Modello ufficiale</strong>
  Il file con il modello e il logo aggiornato è pubblicato nella cartella condivisa del reparto IT. Usa sempre quello: evita di ricreare la firma copiando quella di un collega, perché spesso porta con sé formattazioni e loghi obsoleti.
</div>

<h2>Outlook per Windows</h2>
<ol>
  <li><strong>File &rarr; Opzioni &rarr; Posta &rarr; Firme</strong>.</li>
  <li>Clicca <strong>Nuovo</strong>, dai un nome alla firma (es. "Standard").</li>
  <li>Incolla il modello e sostituisci i tuoi dati.</li>
  <li>A destra imposta la firma per <strong>Nuovi messaggi</strong> e per <strong>Risposte/inoltri</strong>.</li>
</ol>

<h2>Outlook sul web</h2>
<p><strong>Impostazioni</strong> (icona ingranaggio) &rarr; <strong>Posta &rarr; Scrivi e rispondi</strong>. La firma del web è indipendente da quella del client desktop: vanno configurate entrambe.</p>

<div class="nota attenzione">
  <strong>Immagini nella firma</strong>
  Non inserire il logo come allegato o come immagine incollata da un altro messaggio: molti destinatari lo vedrebbero come quadrato vuoto. Usa il file del modello ufficiale.
</div>
`
    },

    {
      id: "teams-audio-video",
      titolo: "Teams: problemi audio e video in riunione",
      categoria: "microsoft365",
      tag: ["teams", "riunione", "videocamera", "webcam", "condivisione schermo", "audio"],
      aggiornato: "2026-08-28",
      minuti: 4,
      sommario: "Webcam nera, voce che si interrompe, condivisione schermo che non parte: soluzioni rapide.",
      corpo: `
<h2>La webcam resta nera</h2>
<ol>
  <li>Verifica il copriobiettivo fisico: molti portatili aziendali ne hanno uno scorrevole.</li>
  <li>Chiudi le altre applicazioni che usano la videocamera (una seconda finestra di Teams, il browser con una riunione aperta, l'app Fotocamera).</li>
  <li>In <strong>Impostazioni &rarr; Privacy &rarr; Fotocamera</strong> di Windows verifica che l'accesso alle app desktop sia consentito.</li>
  <li>Riavvia Teams: clicca l'icona nell'area di notifica con il tasto destro &rarr; <strong>Esci</strong>, poi riapri.</li>
</ol>

<h2>La voce si interrompe o arriva a scatti</h2>
<ul>
  <li>Disattiva la videocamera: riduce nettamente la banda richiesta.</li>
  <li>Passa dal Wi-Fi al cavo di rete se possibile.</li>
  <li>Chiudi download e sincronizzazioni in corso.</li>
  <li>Se sei in VPN e la riunione non richiede risorse interne, disconnetti la VPN.</li>
</ul>

<h2>La condivisione schermo non parte</h2>
<ol>
  <li>Se usi Teams nel browser, la condivisione richiede un permesso di sistema: <strong>Impostazioni di Windows &rarr; Privacy e sicurezza &rarr; Registrazione schermo</strong>.</li>
  <li>Con due monitor, seleziona esplicitamente lo schermo giusto nella finestra di condivisione.</li>
  <li>Se la finestra di scelta resta vuota, riavvia Teams.</li>
</ol>

<div class="nota">
  <strong>Cache di Teams</strong>
  Per problemi persistenti e ricorrenti, il supporto IT può svuotare la cache locale di Teams: è un intervento di pochi minuti che risolve buona parte delle anomalie dell'applicazione.
</div>
`
    },

    {
      id: "onedrive-sincronizzazione",
      titolo: "OneDrive non sincronizza",
      categoria: "microsoft365",
      tag: ["onedrive", "sincronizzazione", "file", "cloud", "backup", "nuvola"],
      aggiornato: "2026-08-28",
      minuti: 4,
      sommario: "Icona di errore su OneDrive, file bloccati in sincronizzazione o spazio esaurito: come intervenire.",
      corpo: `
<h2>Leggere le icone di stato</h2>
<table>
  <tr><th>Icona</th><th>Significato</th></tr>
  <tr><td>Nuvola blu</td><td>File disponibile solo online, non occupa spazio sul disco.</td></tr>
  <tr><td>Spunta verde</td><td>File sincronizzato e disponibile anche offline.</td></tr>
  <tr><td>Frecce circolari</td><td>Sincronizzazione in corso.</td></tr>
  <tr><td>Cerchio rosso con croce</td><td>Errore: uno o più file non vengono caricati.</td></tr>
  <tr><td>Icona grigia</td><td>OneDrive non è connesso all'account.</td></tr>
</table>

<h2>Errore di sincronizzazione</h2>
<ol>
  <li>Clicca l'icona di OneDrive vicino all'orologio: l'elenco mostra i file in errore.</li>
  <li>Controlla i nomi dei file: caratteri come <code>" * : &lt; &gt; ? / \\ |</code> impediscono il caricamento. Rinomina i file interessati.</li>
  <li>Percorsi troppo lunghi (oltre 250 caratteri) vanno accorciati riducendo l'annidamento delle cartelle.</li>
  <li>Se un file è aperto da un'altra applicazione, chiudilo e attendi.</li>
</ol>

<h2>Riavviare la sincronizzazione</h2>
<ol>
  <li>Clicca l'icona di OneDrive &rarr; ingranaggio &rarr; <strong>Sospendi sincronizzazione (2 ore)</strong>.</li>
  <li>Riprendila subito dopo dalla stessa voce di menu: spesso basta questo per sbloccare la coda.</li>
  <li>Se non basta, esci da OneDrive e riaprilo dal menu Start.</li>
</ol>

<div class="nota attenzione">
  <strong>Spazio esaurito</strong>
  Se hai raggiunto la quota, la sincronizzazione si ferma completamente e i nuovi file restano solo in locale. Svuota il cestino di OneDrive dal web (<code>onedrive.com</code>): i file eliminati continuano a occupare spazio per 30 giorni.
</div>

<div class="nota">
  <strong>Cosa mettere su OneDrive</strong>
  Documenti di lavoro personali. I documenti condivisi con il team vanno invece nel sito SharePoint o nel canale Teams del reparto, dove restano accessibili anche in caso di assenza.
</div>
`
    },

    {
      id: "condividere-file",
      titolo: "Condividere file in modo sicuro",
      categoria: "microsoft365",
      tag: ["condivisione", "link", "sharepoint", "onedrive", "esterni", "allegati"],
      aggiornato: "2026-08-28",
      minuti: 4,
      sommario: "Quando usare un link al posto dell'allegato e come impostare i permessi corretti, anche verso l'esterno.",
      corpo: `
<p>Inviare un allegato crea una copia che sfugge a ogni controllo: chi la riceve può inoltrarla, e le modifiche successive al documento originale non la raggiungono. Il link condiviso resta invece sempre aggiornato e revocabile.</p>

<h2>Creare un link</h2>
<ol>
  <li>In Esplora file, clicca il documento con il tasto destro &rarr; <strong>Condividi</strong>.</li>
  <li>Clicca sull'intestazione del riquadro per scegliere il tipo di accesso.</li>
  <li>Decidi se concedere la <strong>modifica</strong> o la sola <strong>visualizzazione</strong>.</li>
  <li>Copia il link e incollalo nell'email o nella chat.</li>
</ol>

<h2>Tipi di link</h2>
<table>
  <tr><th>Tipo</th><th>Quando usarlo</th></tr>
  <tr><td>Persone specifiche</td><td>Impostazione predefinita e la più sicura. Il destinatario deve autenticarsi.</td></tr>
  <tr><td>Utenti dell'organizzazione</td><td>Documenti interni destinati a un gruppo ampio di colleghi.</td></tr>
  <tr><td>Chiunque abbia il link</td><td>Solo per materiale pubblico. Imposta sempre una scadenza.</td></tr>
</table>

<h2>Condivisione con l'esterno</h2>
<ul>
  <li>Usa sempre il tipo <strong>Persone specifiche</strong> indicando l'indirizzo email del destinatario.</li>
  <li>Imposta una <strong>data di scadenza</strong> coerente con la durata dell'attività.</li>
  <li>Per i documenti sensibili disattiva il download e concedi la sola visualizzazione.</li>
</ul>

<div class="nota attenzione">
  <strong>Fai pulizia periodicamente</strong>
  Su <code>onedrive.com</code> la voce <strong>Condivisi &rarr; Da te</strong> elenca tutto ciò che hai condiviso. Rimuovi gli accessi non più necessari, soprattutto verso persone che hanno cambiato ruolo o azienda.
</div>
`
    },

    {
      id: "cassetta-postale-piena",
      titolo: "Cassetta postale piena o quasi al limite",
      categoria: "microsoft365",
      tag: ["quota", "spazio", "posta piena", "archivio", "pst", "outlook"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Come liberare spazio nella casella di posta senza perdere messaggi importanti.",
      corpo: `
<p>Superata la quota non riceverai più messaggi in arrivo, e il mittente riceverà un avviso di mancata consegna. Gli avvisi iniziano al 90% dello spazio disponibile.</p>

<h2>Vedere cosa occupa spazio</h2>
<p>In Outlook: <strong>File &rarr; Strumenti &rarr; Pulizia cassetta postale &rarr; Visualizza dimensioni cassetta postale</strong>. Ordina le cartelle per dimensione per capire dove intervenire.</p>

<h2>Interventi più efficaci, in ordine</h2>
<ol>
  <li><strong>Posta eliminata</strong>: svuotala. Continua a occupare spazio finché resta lì.</li>
  <li><strong>Posta indesiderata</strong>: svuotala allo stesso modo.</li>
  <li><strong>Elementi inviati</strong>: è la cartella più pesante nella maggior parte dei casi, per via degli allegati. Ordina per dimensione ed elimina i messaggi vecchi con allegati grandi.</li>
  <li><strong>Ricerca mirata</strong>: nella barra di ricerca scrivi <code>dimensione:&gt;10 MB</code> per trovare i messaggi più pesanti.</li>
  <li><strong>Archivio online</strong>: sposta le conversazioni chiuse ma da conservare nella cartella <strong>Archivio</strong>, che non incide sulla quota principale.</li>
</ol>

<div class="nota critico">
  <strong>Non creare file PST personali</strong>
  Gli archivi PST salvati sul PC o su chiavette non sono inclusi nei backup e non sono accessibili da altri dispositivi: in caso di guasto del disco i messaggi sono persi definitivamente. Usa l'archivio online.
</div>
`
    },

    /* ---------------- RETE E CONNETTIVITÀ ---------------- */

         {
      id: "Cartelle-Rete",
      titolo: "Accedere alle cartelle di rete aziendali",
      categoria: "rete",
      tag: ["cartelle", "server", "rete", "condivisione", "srvdc", "connessione"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Aprire una cartella condivisa sul server aziendale.",
      corpo: `

<p>Segui questa guida quando devi aprire una cartella condivisa sul server aziendale oppure non trovi più una cartella di rete.</p>

<div class="nota attenzione">
  <strong>Prima di iniziare</strong>
  Assicurati che il PC sia collegato alla rete aziendale. Se la rete non funziona, consulta prima il manuale “Problemi di connessione alla rete”.
</div>

<h2>Aprire il server</h2>
<ol>
  <li><strong>Apri Esplora file</strong><br>
  Clicca sull’icona gialla a forma di cartella nella barra delle applicazioni.</li>
  <li><strong>Clicca sulla barra degli indirizzi</strong><br>
  In alto, seleziona la barra in cui viene visualizzato il percorso della cartella corrente.</li>
  <li><strong>Digita il percorso del server e premi Invio</strong><br>
  Scrivi esattamente questo percorso nella barra degli indirizzi:
  <strong>\\srvdc</strong></li>
</ol>

<h2>Trovare la cartella</h2>
  <p><strong>Apri la cartella di cui hai bisogno</strong><br>
  Se il server si apre correttamente, vedrai l’elenco delle cartelle condivise. Individua quella necessaria e aprila con un doppio clic.</p>

<h2>Salvare la cartella in Accesso rapido</h2><br>
  <p><strong>Aggiungi la cartella ad Accesso rapido</strong>.<br>
  Se utilizzi spesso la stessa cartella, fai clic con il tasto destro sul suo nome e seleziona “Aggiungi ad Accesso rapido”.</p>
  
  <h2>Fatto</h2>
  <p>Da questo momento potrai ritrovare rapidamente la cartella da Esplora file. L’Accesso rapido crea solo un collegamento: non modifica i contenuti presenti sul server.</p>

<h2><strong>Se non funziona</strong></h2>
<p>Individua la situazione che corrisponde al problema.</p>
<ol>
  <li><strong>Il server non si apre</strong><br>
  Dopo aver scritto \\srvdc e premuto Invio compare un errore oppure il server non viene visualizzato.
  <strong>Cosa fare:</strong> Verifica che il PC sia collegato alla rete aziendale e consulta il manuale “Problemi di connessione alla rete”.</li>
  <li><strong>Il server si apre, ma la cartella non compare</strong><br>
  Riesci a vedere le altre cartelle condivise, ma non trovi quella di cui hai bisogno.
  <strong>Cosa fare:</strong> Potresti non avere i permessi necessari. Contatta l’IT indicando con precisione il nome della cartella.</li>
  <li><strong>Compare “Accesso negato”</strong><br>
  La cartella è visibile, ma Windows non permette di aprirla.
  <strong>Cosa fare:</strong> Contatta l’IT: è necessario verificare i permessi di accesso alla cartella.</li>
</ol>
`
    },
     
    {
      id: "wifi-aziendale",
      titolo: "Connettersi al Wi-Fi aziendale e alla rete ospiti",
      categoria: "rete",
      tag: ["wifi", "wi-fi", "rete", "ospiti", "guest", "connessione"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Differenza tra rete aziendale e rete ospiti, e come far collegare un visitatore.",
      corpo: `
<h2>Rete aziendale</h2>
<p>Riservata ai dispositivi forniti dall'azienda. La connessione avviene automaticamente con le credenziali del dominio: non ha una password condivisa e non va configurata manualmente.</p>

<div class="nota attenzione">
  <strong>Dispositivi personali</strong>
  Cellulari e tablet privati non vanno collegati alla rete aziendale. Usa la rete ospiti.
</div>

<h2>Rete ospiti</h2>
<ul>
  <li>Accesso a Internet, nessun accesso alle risorse interne.</li>
  <li>Credenziali temporanee da richiedere alla reception o al supporto IT.</li>
  <li>La validità standard è di 24 ore, estendibile per visite più lunghe.</li>
</ul>

<h2>Se il portatile non si collega</h2>
<ol>
  <li>Verifica che il Wi-Fi sia attivo: <code>Windows + A</code>, controlla anche l'eventuale interruttore fisico o il tasto funzione dedicato.</li>
  <li>Disattiva e riattiva la <strong>Modalità aereo</strong>.</li>
  <li>Dimentica la rete e riconnettiti: <strong>Impostazioni &rarr; Rete e Internet &rarr; Wi-Fi &rarr; Gestisci reti note</strong>.</li>
  <li>Riavvia il PC.</li>
</ol>

<h2>Segnale debole in alcune zone</h2>
<p>Segnala al supporto IT il punto preciso (piano, stanza, postazione) e l'orario: le misurazioni di copertura vengono fatte periodicamente e le segnalazioni puntuali aiutano a decidere dove aggiungere un access point.</p>
`
    },

    {
      id: "rete-lenta",
      titolo: "Connessione lenta o instabile",
      categoria: "rete",
      tag: ["lento", "internet", "banda", "instabile", "disconnessioni"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Come distinguere un problema del proprio collegamento da un disservizio generale e cosa segnalare.",
      corpo: `
<h2>1. Il problema è solo tuo?</h2>
<p>Chiedi a un collega nella stessa sede. Se riguarda tutti, è un disservizio in corso: apri un solo ticket per tutto l'ufficio, evitando segnalazioni duplicate.</p>

<h2>2. Isola la causa</h2>
<ul>
  <li>Prova un cavo di rete al posto del Wi-Fi: se migliora, il problema è la copertura wireless.</li>
  <li>Prova un sito esterno e un servizio interno: se solo il gestionale è lento, non è la connessione.</li>
  <li>Chiudi sincronizzazioni, aggiornamenti e download in corso.</li>
  <li>Verifica se sei in VPN: da remoto rallenta la navigazione generica.</li>
</ul>

<h2>3. Misura</h2>
<p>Esegui un test di velocità e annota il risultato, poi ripetilo in un momento diverso della giornata. Due misure a orari diversi dicono molto più di una sola.</p>

<div class="nota">
  <strong>Da indicare nel ticket</strong>
  Sede e postazione, se sei via cavo o Wi-Fi, se sei in VPN, orari in cui il problema si presenta, risultati dei test di velocità e se il problema riguarda anche altri colleghi.
</div>
`
    },

    /* ---------------- SICUREZZA ---------------- */

    {
      id: "riconoscere-phishing",
      titolo: "Riconoscere e segnalare un'email di phishing",
      categoria: "sicurezza",
      tag: ["phishing", "truffa", "email sospetta", "segnalazione", "allegato", "link"],
      aggiornato: "2026-08-28",
      minuti: 5,
      sommario: "Segnali d'allarme di un messaggio fraudolento, come segnalarlo e cosa fare se hai già cliccato.",
      corpo: `
<p>Il phishing è la causa più frequente di incidenti informatici in azienda. Un messaggio ben fatto può sembrare identico a una comunicazione legittima: conta più il contesto del suo aspetto.</p>

<h2>Segnali d'allarme</h2>
<ul>
  <li><strong>Urgenza o minaccia</strong>: "il tuo account verrà chiuso entro 24 ore".</li>
  <li><strong>Richiesta di credenziali</strong>: nessun servizio aziendale chiede la password via email.</li>
  <li><strong>Mittente quasi giusto</strong>: un carattere cambiato nel dominio, o nome noto con indirizzo esterno sconosciuto.</li>
  <li><strong>Link che non corrisponde</strong>: passa il puntatore sopra il link senza cliccare e leggi l'indirizzo reale in basso a sinistra.</li>
  <li><strong>Allegati inattesi</strong>, soprattutto <code>.zip</code>, <code>.htm</code>, <code>.iso</code> o documenti che chiedono di abilitare le macro.</li>
  <li><strong>Richieste economiche fuori processo</strong>: cambio di IBAN, bonifico urgente, acquisto di buoni regalo.</li>
  <li><strong>Tono anomalo</strong> da parte di un mittente che conosci.</li>
</ul>

<div class="nota critico">
  <strong>La truffa del "messaggio dal capo"</strong>
  Un messaggio che sembra provenire da un dirigente e chiede riservatezza e urgenza per un pagamento è quasi sempre una frode. Verifica sempre di persona o con una telefonata a un numero che già conosci, mai rispondendo al messaggio.
</div>

<h2>Come segnalare</h2>
<ol>
  <li>Non cliccare nulla e non aprire gli allegati.</li>
  <li>In Outlook usa il pulsante <strong>Segnala messaggio &rarr; Phishing</strong> nella barra degli strumenti.</li>
  <li>In alternativa inoltra il messaggio al supporto IT <strong>come allegato</strong> (trascina l'email dentro un nuovo messaggio): serve a conservare le intestazioni tecniche.</li>
  <li>Elimina il messaggio dopo la segnalazione.</li>
</ol>

<h2>Se hai già cliccato o inserito la password</h2>
<ol>
  <li>Scollega il PC dalla rete (togli il cavo, disattiva il Wi-Fi). Non spegnerlo.</li>
  <li>Cambia immediatamente la password da un altro dispositivo.</li>
  <li>Contatta subito il supporto IT per telefono.</li>
</ol>

<div class="nota ok">
  <strong>Segnalare non è mai un errore</strong>
  Meglio dieci segnalazioni infondate che un incidente non rilevato. Nessuno viene mai richiamato per aver segnalato in buona fede, nemmeno per aver cliccato: quello che conta è avvisare in fretta.
</div>
`
    },

    {
      id: "password-sicure",
      titolo: "Creare e gestire password sicure",
      categoria: "sicurezza",
      tag: ["password", "passphrase", "gestore password", "sicurezza", "riuso"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Come costruire password robuste e ricordabili, e perché non vanno mai riutilizzate.",
      corpo: `
<h2>La lunghezza batte la complessità</h2>
<p>Una frase di quattro parole non collegate tra loro è più robusta e molto più facile da ricordare di otto caratteri pieni di simboli. Esempio di struttura: tre o quattro parole comuni separate da un carattere, con un numero.</p>

<div class="nota attenzione">
  <strong>Non usare esempi trovati online</strong>
  Qualsiasi passphrase pubblicata in una guida è già nei dizionari degli attaccanti. Inventa la tua.
</div>

<h2>Regole essenziali</h2>
<ul>
  <li><strong>Mai riutilizzare</strong> la password aziendale su siti personali: se quel sito subisce una violazione, l'account aziendale è esposto.</li>
  <li>Niente dati personali: nomi di familiari, date di nascita, targhe, squadre.</li>
  <li>Non scriverla su post-it, agende o file di testo sul desktop.</li>
  <li>Non condividerla con nessuno, colleghi e supporto IT compresi: il supporto non ha mai bisogno della tua password.</li>
</ul>

<h2>Gestore di password</h2>
<p>Per gli accessi ai portali di fornitori e servizi esterni usa il gestore di password aziendale invece di file o fogli condivisi. Consente di generare credenziali diverse per ogni servizio e di condividerle con il team in modo tracciato.</p>

<h2>Verificare se le tue credenziali sono state esposte</h2>
<p>Il supporto IT monitora le violazioni note che coinvolgono i domini aziendali e ti avvisa se il tuo indirizzo compare in un archivio compromesso. In quel caso il cambio password è immediato e obbligatorio.</p>
`
    },

    {
      id: "dispositivo-smarrito",
      titolo: "Dispositivo aziendale smarrito o rubato",
      categoria: "sicurezza",
      tag: ["furto", "smarrimento", "portatile", "telefono", "emergenza", "blocco"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Cosa fare nelle prime ore dopo la perdita di un portatile, telefono o badge aziendale.",
      corpo: `
<div class="nota critico">
  <strong>Segnala entro un'ora</strong>
  Il fattore decisivo è la rapidità: bloccare l'accesso subito rende irrilevante il valore dei dati sul dispositivo. Chiama il supporto IT anche fuori orario, usando il numero di reperibilità.
</div>

<h2>Passaggi immediati</h2>
<ol>
  <li>Contatta telefonicamente il supporto IT comunicando tipo di dispositivo, luogo e ora approssimativa dell'ultimo utilizzo.</li>
  <li>Cambia la password aziendale da un altro dispositivo.</li>
  <li>Avvisa il tuo responsabile.</li>
  <li>Se si tratta di furto, sporgi denuncia: la copia serve per l'assicurazione e per la pratica interna.</li>
</ol>

<h2>Cosa fa il supporto IT</h2>
<ul>
  <li>Revoca le sessioni attive e i token di accesso dell'account.</li>
  <li>Avvia la cancellazione remota dei dati aziendali sul dispositivo, che scatta al primo collegamento a Internet.</li>
  <li>Blocca il badge di accesso agli uffici, se coinvolto.</li>
  <li>Prepara la sostituzione del dispositivo.</li>
</ul>

<div class="nota">
  <strong>Prevenzione</strong>
  I portatili aziendali hanno il disco cifrato: se il dispositivo era spento, i dati non sono leggibili. Abituati a bloccare lo schermo con <code>Windows + L</code> ogni volta che lasci la postazione, anche per pochi minuti.
</div>
`
    },

    {
      id: "dati-riservati",
      titolo: "Trattare documenti e dati riservati",
      categoria: "sicurezza",
      tag: ["riservatezza", "gdpr", "dati personali", "classificazione", "privacy"],
      aggiornato: "2026-08-28",
      minuti: 4,
      sommario: "Come classificare le informazioni e quali canali usare per trasmetterle in sicurezza.",
      corpo: `
<h2>Livelli di classificazione</h2>
<table>
  <tr><th>Livello</th><th>Esempi</th><th>Come trattarlo</th></tr>
  <tr><td>Pubblico</td><td>Brochure, comunicati, sito web</td><td>Nessuna restrizione.</td></tr>
  <tr><td>Interno</td><td>Procedure, organigrammi, presentazioni</td><td>Condivisibile tra colleghi, non verso l'esterno.</td></tr>
  <tr><td>Riservato</td><td>Contratti, dati economici, offerte</td><td>Solo alle persone coinvolte, con link a persone specifiche.</td></tr>
  <tr><td>Strettamente riservato</td><td>Dati del personale, dati sanitari, credenziali</td><td>Accesso nominale, cifratura, tracciamento degli accessi.</td></tr>
</table>

<h2>Regole pratiche</h2>
<ul>
  <li>Non inviare dati riservati come allegato: usa un link con destinatari specifici e scadenza.</li>
  <li>Non copiare dati aziendali su chiavette USB personali o servizi cloud privati.</li>
  <li>Non usare account di posta personali per lavoro, nemmeno temporaneamente.</li>
  <li>Non inserire dati aziendali riservati in strumenti online esterni non approvati.</li>
  <li>Controlla i destinatari prima di inviare: il completamento automatico degli indirizzi è la causa più comune di invii errati.</li>
</ul>

<div class="nota attenzione">
  <strong>Documenti cartacei</strong>
  Ritira subito le stampe, non lasciare documenti sulla scrivania a fine giornata e usa i distruggidocumenti per il materiale riservato.
</div>

<div class="nota critico">
  <strong>Invio a destinatario sbagliato</strong>
  Se hai inviato dati personali alla persona sbagliata, segnalalo entro poche ore al supporto IT e al referente privacy: potrebbe configurarsi una violazione con obblighi di notifica in tempi stretti. Non tentare di risolvere in autonomia.
</div>
`
    },

    /* ---------------- STAMPA E SCANSIONE ---------------- */

    {
      id: "stampante-non-stampa",
      titolo: "La stampante non stampa",
      categoria: "stampa",
      tag: ["stampante", "stampa", "coda di stampa", "non stampa", "errore"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Coda bloccata, stampante offline o documento sparito: sequenza di controlli.",
      corpo: `
<h2>1. Controlla la macchina</h2>
<ul>
  <li>Il display segnala carta esaurita, inceppamento o toner da sostituire?</li>
  <li>Il cassetto contiene carta del formato richiesto?</li>
  <li>Ci sono lavori in attesa di altri utenti che bloccano la coda?</li>
</ul>

<h2>2. Verifica la stampante selezionata</h2>
<p>Con più stampanti installate è facile inviare il documento a quella di un altro piano. In <strong>Impostazioni &rarr; Bluetooth e dispositivi &rarr; Stampanti e scanner</strong> controlla quale sia impostata come predefinita e se risulta <strong>Offline</strong>.</p>

<h2>3. Svuota la coda di stampa</h2>
<ol>
  <li>Apri la stampante dall'elenco e clicca <strong>Apri coda di stampa</strong>.</li>
  <li>Annulla tutti i documenti in elenco, compresi quelli in errore.</li>
  <li>Attendi che la coda si svuoti del tutto, poi riprova con una sola pagina.</li>
</ol>

<h2>4. Riavvia</h2>
<p>Se la coda non si svuota, riavvia il PC: è più rapido e sicuro che intervenire manualmente sui servizi di sistema.</p>

<div class="nota">
  <strong>Da indicare nel ticket</strong>
  Nome o codice della stampante (etichetta sulla macchina), piano e sede, messaggio a display, se il problema riguarda tutti i colleghi o solo il tuo PC.
</div>
`
    },

    {
      id: "scansione-documenti",
      titolo: "Scansionare un documento e inviarlo via email",
      categoria: "stampa",
      tag: ["scansione", "scanner", "pdf", "digitalizzare", "multifunzione"],
      aggiornato: "2026-08-28",
      minuti: 2,
      sommario: "Uso della multifunzione per digitalizzare documenti e riceverli nella propria casella.",
      corpo: `
<h2>Procedura</h2>
<ol>
  <li>Appoggia il badge sul lettore della multifunzione per autenticarti.</li>
  <li>Posiziona i fogli nell'alimentatore automatico (testo verso l'alto) oppure sul vetro (testo verso il basso, allineato all'angolo indicato).</li>
  <li>Seleziona <strong>Scansione su email</strong>.</li>
  <li>Il tuo indirizzo viene compilato automaticamente dal badge. Per inviare a un collega, cerca il nome nella rubrica.</li>
  <li>Imposta i parametri se necessario e premi <strong>Avvio</strong>.</li>
</ol>

<h2>Impostazioni consigliate</h2>
<table>
  <tr><th>Tipo di documento</th><th>Impostazioni</th></tr>
  <tr><td>Testo, archiviazione</td><td>PDF, bianco e nero, 200 dpi</td></tr>
  <tr><td>Documento con firme o timbri</td><td>PDF, colore, 300 dpi</td></tr>
  <tr><td>Fronte/retro</td><td>Attiva <strong>Duplex</strong> prima di avviare</td></tr>
</table>

<div class="nota">
  <strong>Scansione troppo pesante</strong>
  Sopra i 20 MB il messaggio potrebbe non arrivare. Riduci la risoluzione a 200 dpi, passa al bianco e nero e dividi il documento in più scansioni.
</div>
`
    },

    {
      id: "stampa-sicura-badge",
      titolo: "Stampa sicura con badge",
      categoria: "stampa",
      tag: ["badge", "stampa sicura", "riservatezza", "follow me", "rilascio"],
      aggiornato: "2026-08-28",
      minuti: 2,
      sommario: "I documenti restano in attesa finché non passi il badge sulla stampante: come funziona e perché.",
      corpo: `
<p>Con la stampa sicura il documento non esce subito: resta in coda sul server e viene rilasciato solo quando ti presenti fisicamente alla macchina. Evita che documenti riservati restino incustoditi nel vassoio.</p>

<h2>Come stampare</h2>
<ol>
  <li>Stampa normalmente scegliendo la coda <strong>Stampa sicura</strong>.</li>
  <li>Recati a una qualsiasi multifunzione aziendale.</li>
  <li>Appoggia il badge sul lettore.</li>
  <li>Seleziona i documenti da rilasciare e conferma.</li>
</ol>

<div class="nota">
  <strong>I lavori scadono dopo 24 ore</strong>
  I documenti non rilasciati vengono eliminati automaticamente. Se hai stampato ieri e oggi non trovi nulla, rinvia la stampa.
</div>

<h2>Prima registrazione del badge</h2>
<p>Al primo utilizzo la macchina chiede di associare il badge all'account: inserisci le credenziali aziendali una sola volta, l'associazione resta memorizzata.</p>

<h2>Badge non riconosciuto</h2>
<p>Puoi comunque accedere digitando il codice utente sul pannello. Se il problema si ripete, apri un ticket: il badge potrebbe essere smagnetizzato e va sostituito.</p>
`
    },

    /* ---------------- SOFTWARE E LICENZE ---------------- */

    {
      id: "richiesta-software",
      titolo: "Richiedere l'installazione di un software",
      categoria: "software",
      tag: ["installazione", "software", "programma", "richiesta", "licenza", "approvazione"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Iter di richiesta, valutazione e installazione di un nuovo programma sul PC aziendale.",
      corpo: `
<div class="nota attenzione">
  <strong>Non installare software in autonomia</strong>
  Gli utenti non hanno privilegi di amministratore. Anche quando un'installazione sembra riuscita, un programma non approvato può violare le licenze, introdurre vulnerabilità o entrare in conflitto con gli applicativi aziendali.
</div>

<h2>Cosa indicare nella richiesta</h2>
<ul>
  <li>Nome esatto del programma e versione, con il link al sito del produttore.</li>
  <li>Motivazione: quale attività lavorativa richiede quello strumento.</li>
  <li>Se esiste già un'alternativa aziendale che hai valutato e perché non è sufficiente.</li>
  <li>Numero di licenze necessarie e per quali colleghi.</li>
  <li>Eventuale scadenza o urgenza legata a un progetto.</li>
  <li>Approvazione del responsabile, se comporta un costo.</li>
</ul>

<h2>Tempi indicativi</h2>
<table>
  <tr><th>Caso</th><th>Tempo</th></tr>
  <tr><td>Software già in catalogo e con licenze disponibili</td><td>1-2 giorni lavorativi</td></tr>
  <tr><td>Software già in catalogo, licenza da acquistare</td><td>5-10 giorni lavorativi</td></tr>
  <tr><td>Software nuovo, da valutare</td><td>2-4 settimane (verifiche di sicurezza, compatibilità e contratto)</td></tr>
</table>

<div class="nota">
  <strong>Software gratuito</strong>
  Anche i programmi gratuiti richiedono approvazione: molte licenze "free" escludono espressamente l'uso aziendale e comportano un rischio contrattuale.
</div>
`
    },

     

    /* ---------------- PROCEDURE E RICHIESTE ---------------- */

    {
      id: "aprire-ticket",
      titolo: "Come aprire un ticket al supporto IT",
      categoria: "procedure",
      tag: ["ticket", "richiesta", "assistenza", "segnalazione", "help desk", "priorità"],
      aggiornato: "2026-08-28",
      minuti: 4,
      sommario: "Canali disponibili, informazioni da fornire e criteri di priorità per una risposta più rapida.",
      corpo: `
<h2>Canali disponibili</h2>
<table>
  <tr><th>Canale</th><th>Quando usarlo</th></tr>
  <tr><td>Email al supporto IT</td><td>Canale principale per richieste ordinarie. Apre automaticamente un ticket.</td></tr>
  <tr><td>Telefono</td><td>Blocchi che impediscono di lavorare, o quando non riesci ad accedere alla posta.</td></tr>
  <tr><td>Chat Teams</td><td>Domande brevi e chiarimenti su ticket già aperti.</td></tr>
</table>

<h2>Informazioni da includere sempre</h2>
<ul>
  <li><strong>Cosa</strong> non funziona, descritto in una frase.</li>
  <li><strong>Da quando</strong> si verifica e se è successo qualcosa poco prima (aggiornamento, spostamento, nuovo software).</li>
  <li><strong>Testo esatto</strong> dell'errore, meglio se con uno screenshot (<code>Windows + Maiusc + S</code> per ritagliare l'area).</li>
  <li><strong>Chi</strong> è coinvolto: solo tu o anche altri colleghi.</li>
  <li><strong>Dove</strong> sei: sede, piano, postazione, oppure se lavori da remoto.</li>
  <li><strong>Numero di inventario</strong> del dispositivo (etichetta sul PC).</li>
  <li><strong>Impatto</strong>: sei completamente fermo o puoi lavorare con una soluzione temporanea?</li>
</ul>

<div class="nota ok">
  <strong>Un problema, un ticket</strong>
  Segnalazioni distinte permettono di assegnare ogni problema alla persona giusta. Raggruppare più problemi in un unico messaggio rallenta tutti.
</div>

<h2>Livelli di priorità</h2>
<table>
  <tr><th>Priorità</th><th>Esempi</th><th>Presa in carico</th></tr>
  <tr><td>Critica</td><td>Servizio fermo per più uffici, sospetto incidente di sicurezza</td><td>Entro 1 ora</td></tr>
  <tr><td>Alta</td><td>Un utente completamente bloccato, nessuna soluzione alternativa</td><td>Entro 4 ore lavorative</td></tr>
  <tr><td>Media</td><td>Disservizio con soluzione temporanea disponibile</td><td>Entro 1 giorno lavorativo</td></tr>
  <tr><td>Bassa</td><td>Richieste di configurazione, domande, migliorie</td><td>Entro 3 giorni lavorativi</td></tr>
</table>

<div class="nota">
  <strong>Segui il ticket</strong>
  Rispondi alle richieste di informazioni mantenendo il numero di ticket nell'oggetto: apre un nuovo ticket ogni email che perde il riferimento.
</div>
`
    },

    {
      id: "onboarding-nuovo-collega",
      titolo: "Onboarding: attivazione di un nuovo collega",
      categoria: "procedure",
      tag: ["onboarding", "nuovo assunto", "attivazione", "account", "primo giorno"],
      aggiornato: "2026-08-28",
      minuti: 4,
      sommario: "Cosa richiedere e con quale anticipo perché il nuovo collega trovi tutto pronto il primo giorno.",
      corpo: `
<div class="nota attenzione">
  <strong>Preavviso minimo: 5 giorni lavorativi</strong>
  Serve a preparare e configurare il dispositivo, creare le utenze e attivare le licenze. Con meno preavviso non è garantita la disponibilità dell'hardware.
</div>

<h2>Cosa comunicare al supporto IT</h2>
<ul>
  <li>Nome, cognome e data di inizio.</li>
  <li>Ruolo, reparto e responsabile diretto.</li>
  <li>Sede e postazione assegnata.</li>
  <li>Tipo di dotazione: portatile o fisso, monitor, cuffie, cellulare aziendale.</li>
  <li>Applicativi e gestionali a cui deve accedere.</li>
  <li>Cartelle di rete e gruppi di distribuzione da assegnare, meglio se indicando un collega con profilo analogo da usare come riferimento.</li>
  <li>Se serve accesso da remoto e quindi la VPN.</li>
</ul>

<h2>Cosa viene predisposto</h2>
<ol>
  <li>Utenza di dominio e casella di posta.</li>
  <li>Licenze Microsoft 365 e configurazione MFA guidata al primo accesso.</li>
  <li>Dispositivo configurato con le applicazioni standard.</li>
  <li>Badge di accesso e credenziali per la stampa.</li>
  <li>Permessi su cartelle e applicativi.</li>
</ol>

<h2>Primo giorno</h2>
<p>Il nuovo collega riceve credenziali provvisorie con obbligo di cambio password al primo accesso, e configura l'MFA con l'assistenza del supporto IT. Prevedi circa 30 minuti per queste operazioni.</p>
`
    },

    {
      id: "offboarding",
      titolo: "Offboarding: disattivazione di un'utenza",
      categoria: "procedure",
      tag: ["offboarding", "dimissioni", "uscita", "disattivazione", "restituzione"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Procedura per la cessazione di un rapporto: dati, dispositivi e accessi.",
      corpo: `
<div class="nota critico">
  <strong>Comunica la data di cessazione con almeno 3 giorni di anticipo</strong>
  Gli accessi vengono revocati alle 18:00 dell'ultimo giorno lavorativo. In caso di uscita immediata, avvisa il supporto IT per telefono: la revoca è contestuale.
</div>

<h2>Cosa comunicare</h2>
<ul>
  <li>Nome del collega e data dell'ultimo giorno.</li>
  <li>Chi eredita la casella di posta e i file, e per quanto tempo.</li>
  <li>Se serve una risposta automatica con l'indirizzo a cui rivolgersi.</li>
  <li>Eventuali deleghe, caselle condivise o utenze di servizio intestate alla persona.</li>
</ul>

<h2>Cosa avviene</h2>
<ol>
  <li>Blocco dell'utenza e revoca delle sessioni attive.</li>
  <li>La casella di posta viene resa accessibile al responsabile per il periodo concordato, poi archiviata.</li>
  <li>I file di OneDrive vengono trasferiti al responsabile e conservati secondo le politiche interne.</li>
  <li>Disattivazione di badge, telefono e accessi remoti.</li>
  <li>Recupero e ricondizionamento dei dispositivi.</li>
</ol>

<div class="nota">
  <strong>Prima dell'ultimo giorno</strong>
  Chiedi al collega di spostare i documenti di lavoro dalle cartelle personali agli spazi condivisi del team: dopo la disattivazione il recupero è più lento e non sempre completo.
</div>
`
    },

    {
      id: "richiesta-hardware",
      titolo: "Richiedere nuovo hardware o una sostituzione",
      categoria: "procedure",
      tag: ["hardware", "pc nuovo", "monitor", "richiesta", "sostituzione", "guasto"],
      aggiornato: "2026-08-28",
      minuti: 3,
      sommario: "Ciclo di vita dei dispositivi, iter di richiesta e tempi di consegna.",
      corpo: `
<h2>Ciclo di vita standard</h2>
<table>
  <tr><th>Dispositivo</th><th>Sostituzione programmata</th></tr>
  <tr><td>Portatile / PC fisso</td><td>4 anni</td></tr>
  <tr><td>Monitor</td><td>6 anni</td></tr>
  <tr><td>Cellulare aziendale</td><td>3 anni</td></tr>
  <tr><td>Cuffie e periferiche</td><td>Alla necessità</td></tr>
</table>
<p>La sostituzione programmata viene proposta dal supporto IT: non serve richiederla.</p>

<h2>Richiesta fuori ciclo</h2>
<p>Serve l'approvazione del responsabile. Indica nella richiesta:</p>
<ul>
  <li>Dispositivo attuale e numero di inventario.</li>
  <li>Motivazione: guasto, prestazioni insufficienti per attività specifiche, nuova esigenza di lavoro.</li>
  <li>Se il dispositivo attuale sarà restituito o riassegnato.</li>
</ul>

<h2>Guasto bloccante</h2>
<p>Se il dispositivo è inutilizzabile, segnalalo per telefono: è disponibile un parco di macchine sostitutive per garantire la continuità mentre si valuta la riparazione.</p>

<div class="nota">
  <strong>Tempi indicativi</strong>
  Periferiche a magazzino: 1-2 giorni. Portatili e monitor: 2-3 settimane dall'approvazione. Configurazioni particolari: fino a 6 settimane.
</div>
`
    }

  ]
};
