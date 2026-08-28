# Supporto IT — Knowledge base ADCO HUB

Sito statico (HTML, CSS, JavaScript) con le guide del supporto IT.
Non richiede build, database o server applicativi: funziona aprendo `index.html` in un browser
oppure copiando la cartella su un qualsiasi server web o su un sito SharePoint.

## Struttura

```
supporto-it/
├── index.html          Home: ricerca, categorie, guide aggiornate di recente
├── categoria.html      Elenco delle guide di una categoria (?cat=id-categoria)
├── articolo.html       Singola guida (?id=id-articolo)
├── ricerca.html        Risultati di ricerca (?q=termini)
├── contatti.html       Canali, orari, priorità, cosa indicare in una richiesta
├── assets/
│   ├── css/style.css   Unico foglio di stile del sito
│   └── js/
│       ├── data.js     TUTTI i contenuti: categorie e guide
│       └── app.js      Rendering delle pagine e motore di ricerca
└── README.md
```

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

- **Uso locale**: apri `index.html` con un doppio clic.
- **Rete o intranet**: copia l'intera cartella nella directory del server web.
- **SharePoint / OneDrive**: carica la cartella in una raccolta documenti e
  condividi il link a `index.html`.

Il sito non usa librerie esterne, non effettua chiamate di rete e non raccoglie
dati: funziona anche completamente offline.
