# Supporto IT — Knowledge base ADCO HUB

Sito statico (HTML, CSS, JavaScript) con le guide del supporto IT.
Non richiede build, database o server applicativi: funziona aprendo `index.html` in un browser
oppure copiando la cartella su un qualsiasi server web o su un sito SharePoint.

## Struttura

```
supporto-it/
├── login.html          Pagina di accesso
├── index.html          Home: ricerca, categorie, guide aggiornate di recente
├── categoria.html      Elenco delle guide di una categoria (?cat=id-categoria)
├── articolo.html       Singola guida (?id=id-articolo)
├── ricerca.html        Risultati di ricerca (?q=termini)
├── contatti.html       Canali, orari, priorità, cosa indicare in una richiesta
├── middleware.js       Controllo di accesso lato server (Vercel)
├── api/
│   ├── login.js        Verifica credenziali e rilascia il cookie di sessione
│   └── logout.js       Chiude la sessione
├── package.json        Serve solo al middleware (@vercel/functions)
├── assets/
│   ├── css/style.css   Unico foglio di stile del sito
│   └── js/
│       ├── data.js     TUTTI i contenuti: categorie e guide
│       └── app.js      Rendering delle pagine e motore di ricerca
└── README.md
```

## Accesso

Il sito è protetto **lato server** quando è pubblicato su Vercel. Ogni richiesta
passa da `middleware.js`: senza un cookie di sessione valido il visitatore viene
portato a `login.html` e non riceve nulla del sito, né le pagine né i contenuti
in `assets/js`. Le credenziali sono verificate dalla funzione `api/login.js` e
**non sono presenti in questo repository**: vivono nelle Environment Variables
del progetto Vercel.

### Variabili da impostare su Vercel

In *Project Settings → Environment Variables*, per gli ambienti Production,
Preview e Development:

| Variabile       | Valore                                                        |
|-----------------|---------------------------------------------------------------|
| `SITO_UTENTE`   | nome utente (facoltativa: se assente vale `ADC`)              |
| `SITO_PASSWORD` | la password di accesso                                        |
| `SITO_SEGRETO`  | una stringa casuale lunga, usata per firmare il cookie        |

Per generare `SITO_SEGRETO` da PowerShell:

```powershell
-join ((48..57) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
```

Dopo aver aggiunto o modificato le variabili serve un nuovo deploy perché
diventino effettive (*Deployments → ⋯ → Redeploy*).

Finché `SITO_PASSWORD` e `SITO_SEGRETO` non sono impostate, il sito risponde
`503` a tutte le pagine: è voluto, meglio un sito fermo che un sito aperto
per una configurazione dimenticata.

### Come funziona la sessione

Dopo l'accesso viene rilasciato un cookie `sit_acc`, `HttpOnly` e `Secure`,
valido **8 ore**. Contiene solo una scadenza e la sua firma HMAC-SHA256: non
contiene la password e non è falsificabile senza conoscere `SITO_SEGRETO`.
La voce **Esci** nel menu chiama `/api/logout`, che cancella il cookie.

### Uso in locale

Aprendo i file con un doppio clic non c'è alcun server: il login non funziona
(la pagina lo segnala) e le guide sono consultabili aprendo direttamente
`index.html`. È corretto così — chi ha i file sul proprio PC può leggerli
comunque, la protezione ha senso solo sul sito pubblicato.

### Cambiare le credenziali

Si cambia il valore della variabile su Vercel e si rilancia il deploy. Nessuna
modifica al codice, nessun commit.

## Aggiungere o modificare una guida

Tutti i contenuti stanno in `assets/js/data.js`. Nessun altro file va toccato:
home, elenchi di categoria e ricerca si aggiornano da soli.

Aggiungi un oggetto in `KB.articoli`:

```js
{
  id: "titolo-della-guida",          // solo minuscole e trattini, usato nell'URL
  titolo: "Titolo della guida",
  categoria: "accessi",              // id di una categoria esistente
  tag: ["parola", "chiave"],         // usate dalla ricerca
  aggiornato: "2026-08-28",          // formato AAAA-MM-GG
  minuti: 3,                         // tempo di lettura indicativo
  sommario: "Una o due righe di descrizione.",
  corpo: `
<h2>Titolo di sezione</h2>
<p>Testo.</p>
<ol><li>Passaggio.</li></ol>
<div class="nota">
  <strong>Titolo della nota</strong>
  Testo della nota.
</div>
`
}
```

Riquadri disponibili nel corpo: `nota` (blu, informativa), `nota ok` (verde),
`nota attenzione` (ambra), `nota critico` (rosso).
Sono supportati anche `<table>`, `<ul>`, `<ol>`, `<code>` e `<h3>`.

Per aggiungere una categoria, inserisci un oggetto in `KB.categorie` con
`id`, `nome`, `descrizione` e `icona` (valori disponibili: `chiave`, `monitor`,
`posta`, `wifi`, `scudo`, `stampante`, `pacchetto`, `documento`).

Aggiorna anche `KB.aggiornamento` in cima al file: è la data mostrata nel piè di pagina.

## Personalizzazioni rapide

- **Colori e tema**: blocco `:root` in `assets/css/style.css`. Il tema scuro è
  automatico e segue le impostazioni del sistema operativo.
- **Logo**: le iniziali nel riquadro blu sono nel markup di ogni pagina
  (`<span class="logo-segno">AH</span>`). Per usare un'immagine, sostituisci lo
  `<span>` con un `<img>` e adatta l'altezza nella classe `.logo-segno`.
- **Contatti**: `contatti.html` contiene recapiti e orari **di esempio**.
  Vanno sostituiti con quelli reali, insieme al riquadro giallo che segnala
  che si tratta di segnaposto.

## Nota sui contenuti

Le 30 guide sono state scritte come base di partenza realistica per un ambiente
Windows con Microsoft 365. Prima della pubblicazione vanno verificate rispetto
alle procedure effettive dell'azienda: durata delle password, soglie di blocco
account, tempi di consegna hardware, ciclo di vita dei dispositivi e livelli di
servizio sono valori plausibili ma da confermare.

## Pubblicazione

- **Vercel** (consigliato): importa il repository, non serve impostare alcun
  comando di build. Poi imposta le Environment Variables descritte sopra: il
  middleware protegge il sito automaticamente.
- **Uso locale**: apri `index.html` con un doppio clic (senza login, vedi sopra).
- **Rete o intranet**: copia i file nella directory del server web. Attenzione:
  `middleware.js` e `api/` funzionano solo su Vercel; su un altro server il
  controllo di accesso va rifatto con gli strumenti di quel server.

Le pagine non usano librerie esterne e non effettuano chiamate di rete oltre a
quella di accesso: la consultazione delle guide funziona anche offline.
