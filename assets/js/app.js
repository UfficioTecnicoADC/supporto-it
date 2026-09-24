/* ============================================================
   Supporto IT - ADCO HUB
   Logica del sito: rendering delle pagine e motore di ricerca.
   Funziona senza server: i contenuti arrivano da assets/js/data.js.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Icone (SVG inline) ---------- */

  var ICONE = {
    chiave: '<path d="M14 7a4 4 0 1 1-1.2 7.8L11 16.6H9v2H7v2H3v-4l6.2-6.2A4 4 0 0 1 14 7Zm1.5 2.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"/>',
    monitor: '<path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h4v2H6v-2h4v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v9h16V6H4Z"/>',
    posta: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm16.2 2H4.8L12 12l7.2-5ZM4 8.6V17h16V8.6l-8 5.6-8-5.6Z"/>',
    wifi: '<path d="M12 19.5a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2ZM8.5 14.2l-1.6-1.6a7.2 7.2 0 0 1 10.2 0l-1.6 1.6a5 5 0 0 0-7 0ZM5.3 11l-1.6-1.6a11.8 11.8 0 0 1 16.6 0L18.7 11a9.5 9.5 0 0 0-13.4 0Z"/>',
    scudo: '<path d="M12 2 4 5v6.5c0 4.6 3.2 8.9 8 10.5 4.8-1.6 8-5.9 8-10.5V5l-8-3Zm0 2.2 6 2.2v5.1c0 3.5-2.3 6.9-6 8.3-3.7-1.4-6-4.8-6-8.3V6.4l6-2.2Zm-1 10.4-2.6-2.6-1.4 1.4L11 17.4l6-6-1.4-1.4-4.6 4.6Z"/>',
    stampante: '<path d="M7 3h10v4h2a2 2 0 0 1 2 2v6h-4v5H7v-5H3V9a2 2 0 0 1 2-2h2V3Zm2 2v2h6V5H9Zm0 9v6h6v-6H9Zm-4-5v4h2v-1h10v1h2V9H5Z"/>',
    pacchetto: '<path d="m12 2 9 4.5v11L12 22l-9-4.5v-11L12 2Zm0 2.2L5.9 7.3 12 10.4l6.1-3.1L12 4.2ZM5 9v7.3l6 3V12L5 9Zm8 10.3 6-3V9l-6 3v7.3Z"/>',
    documento: '<path d="M6 2h8l4 4v16H6V2Zm2 2v16h8V8h-4V4H8Zm2 8h6v2h-6v-2Zm0 4h6v2h-6v-2Z"/>'
  };

  /* ---------- Utilità ---------- */

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call(
      (ctx || document).querySelectorAll(sel)
    );
  }

  function parametro(nome) {
    var m = new RegExp("[?&]" + nome + "=([^&]*)").exec(
      window.location.search
    );

    return m
      ? decodeURIComponent(m[1].replace(/\+/g, " "))
      : "";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    });
  }

  var COMBINANTI = new RegExp(
    "[" +
    String.fromCharCode(768) +
    "-" +
    String.fromCharCode(879) +
    "]",
    "g"
  );

  function normalizza(s) {
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(COMBINANTI, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function soloTesto(html) {
    return String(html)
      .replace(/<[^>]*>/g, " ")
      .replace(/&[a-z]+;/g, " ");
  }

  function dataLeggibile(iso) {
    var p = String(iso).split("-");

    if (p.length !== 3) {
      return iso;
    }

    return p[2] + "/" + p[1] + "/" + p[0];
  }

  function icona(chiave) {
    return (
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      (ICONE[chiave] || ICONE.documento) +
      "</svg>"
    );
  }

  function categoria(id) {
    for (var i = 0; i < KB.categorie.length; i++) {
      if (KB.categorie[i].id === id) {
        return KB.categorie[i];
      }
    }

    return null;
  }

  function articolo(id) {
    for (var i = 0; i < KB.articoli.length; i++) {
      if (KB.articoli[i].id === id) {
        return KB.articoli[i];
      }
    }

    return null;
  }

  function articoliDi(idCategoria) {
    return KB.articoli.filter(function (a) {
      return a.categoria === idCategoria;
    });
  }

  function perData(a, b) {
    return b.aggiornato.localeCompare(a.aggiornato);
  }

  /* ---------- Frammenti riutilizzabili ---------- */

  function vociArticolo(lista, evidenzia) {
    if (!lista.length) {
      return "";
    }

    return lista.map(function (a) {
      var cat = categoria(a.categoria);

      return (
        '<a class="voce-articolo" href="articolo.html?id=' +
        encodeURIComponent(a.id) +
        '">' +

        "<h3>" +
        (evidenzia
          ? evidenzia(a.titolo)
          : esc(a.titolo)) +
        "</h3>" +

        "<p>" +
        (evidenzia
          ? evidenzia(a.sommario)
          : esc(a.sommario)) +
        "</p>" +

        '<div class="voce-meta">' +

        '<span class="etichetta">' +
        esc(cat ? cat.nome : a.categoria) +
        "</span>" +

        '<span class="punto">&bull;</span>' +

        "<span>" +
        a.minuti +
        " min di lettura</span>" +

        '<span class="punto">&bull;</span>' +

        "<span>Aggiornato il " +
        dataLeggibile(a.aggiornato) +
        "</span>" +

        "</div>" +
        "</a>"
      );
    }).join("");
  }

  function riquadroAiuto() {
    return (
      '<div class="riquadro-aiuto">' +

      "<div>" +
      "<h3>Non hai trovato quello che cercavi?</h3>" +

      "<p>" +
      "Il supporto IT risponde alle richieste in giorni lavorativi, " +
      "dal lunedì al venerdì." +
      "</p>" +

      "</div>" +

      '<a class="bottone" href="contatti.html">' +
      "Contatta il supporto IT" +
      "</a>" +

      "</div>"
    );
  }

  /* ---------- Pagina: home ---------- */

  function renderHome() {
    var griglia = $("#griglia-categorie");

    if (griglia) {
      griglia.innerHTML = KB.categorie.map(function (c) {
        var n = articoliDi(c.id).length;

        return (
          '<a class="scheda-categoria" href="categoria.html?cat=' +
          encodeURIComponent(c.id) +
          '">' +

          '<div class="scheda-icona">' +
          icona(c.icona) +
          "</div>" +

          "<h3>" +
          esc(c.nome) +
          "</h3>" +

          "<p>" +
          esc(c.descrizione) +
          "</p>" +

          '<div class="scheda-conteggio">' +
          n +
          (n === 1
            ? " guida"
            : " guide") +
          "</div>" +

          "</a>"
        );
      }).join("");
    }

    var recenti = $("#articoli-recenti");

    if (recenti) {
      recenti.innerHTML = vociArticolo(
        KB.articoli
          .slice()
          .sort(perData)
          .slice(0, 6)
      );
    }

    var totale = $("#totale-guide");

    if (totale) {
      totale.textContent = KB.articoli.length;
    }
  }

  /* ---------- Pagina: categoria ---------- */

  function renderCategoria() {
    var id = parametro("cat");
    var cat = categoria(id);
    var contenuto = $("#contenuto");

    if (!cat) {
      document.title =
        "Categoria non trovata - Supporto IT";

      contenuto.innerHTML =
        '<div class="stato-vuoto">' +
        "<h3>Categoria non trovata</h3>" +
        "<p>La categoria richiesta non esiste o è stata rinominata.</p>" +
        '<p><a class="bottone secondario" href="index.html">' +
        "Torna alla home" +
        "</a></p>" +
        "</div>";

      return;
    }

    document.title =
      cat.nome +
      " - Supporto IT ADCO HUB";

    var lista = articoliDi(cat.id)
      .slice()
      .sort(perData);

    $("#briciole").innerHTML =
      '<a href="index.html">Supporto IT</a>' +
      "<span>/</span>" +
      esc(cat.nome);

    contenuto.innerHTML =
      '<div class="sezione-intestazione">' +
      "<div>" +

      "<h1>" +
      esc(cat.nome) +
      "</h1>" +

      "<p>" +
      esc(cat.descrizione) +
      " &mdash; " +
      lista.length +
      (lista.length === 1
        ? " guida disponibile"
        : " guide disponibili") +
      "</p>" +

      "</div>" +
      "</div>" +

      '<div class="elenco-articoli">' +
      vociArticolo(lista) +
      "</div>" +

      riquadroAiuto();

    renderLateraleCategorie(cat.id);
  }

  function renderLateraleCategorie(attiva) {
    var lat = $("#laterale");

    if (!lat) {
      return;
    }

    lat.innerHTML =
      "<h4>Categorie</h4>" +
      "<ul>" +

      KB.categorie.map(function (c) {
        return (
          '<li><a class="' +
          (c.id === attiva
            ? "attivo"
            : "") +

          '" href="categoria.html?cat=' +
          encodeURIComponent(c.id) +
          '">' +

          esc(c.nome) +

          ' <span style="color:var(--testo-tenue)">(' +
          articoliDi(c.id).length +
          ")</span>" +

          "</a></li>"
        );
      }).join("") +

      "</ul>";
  }

  /* ---------- Pagina: articolo ---------- */

  function renderArticolo() {
    var art = articolo(
      parametro("id")
    );

    var contenuto = $("#contenuto");

    if (!art) {
      document.title =
        "Guida non trovata - Supporto IT";

      $("#briciole").innerHTML =
        '<a href="index.html">Supporto IT</a>';

      contenuto.innerHTML =
        '<div class="stato-vuoto">' +

        "<h3>Guida non trovata</h3>" +

        "<p>" +
        "Il documento richiesto non esiste o è stato spostato." +
        "</p>" +

        '<p><a class="bottone secondario" href="index.html">' +
        "Torna alla home" +
        "</a></p>" +

        "</div>";

      return;
    }

    var cat = categoria(
      art.categoria
    );

    document.title =
      art.titolo +
      " - Supporto IT ADCO HUB";

    $("#briciole").innerHTML =
      '<a href="index.html">Supporto IT</a>' +

      "<span>/</span>" +

      '<a href="categoria.html?cat=' +
      encodeURIComponent(cat.id) +
      '">' +

      esc(cat.nome) +

      "</a>" +

      "<span>/</span>" +

      esc(art.titolo);

    contenuto.innerHTML =
      '<article class="articolo">' +

      '<header class="articolo-intestazione">' +

      "<h1>" +
      esc(art.titolo) +
      "</h1>" +

      '<div class="articolo-meta">' +

      '<span class="etichetta">' +
      esc(cat.nome) +
      "</span>" +

      '<span class="punto">&bull;</span>' +

      "<span>" +
      art.minuti +
      " min di lettura</span>" +

      '<span class="punto">&bull;</span>' +

      "<span>Aggiornato il " +
      dataLeggibile(art.aggiornato) +
      "</span>" +

      "</div>" +

      "</header>" +

      '<div class="articolo-corpo" id="corpo">' +
      art.corpo +
      "</div>" +

      "</article>" +

      riquadroAiuto();

    var titoli = $$("#corpo h2");
    var indice = "";

    if (titoli.length > 1) {
      indice =
        "<h4>In questa guida</h4>" +
        "<ul>" +

        titoli.map(function (h, i) {
          var slug =
            "sez-" + i;

          h.id = slug;

          return (
            '<li><a href="#' +
            slug +
            '">' +
            esc(h.textContent) +
            "</a></li>"
          );
        }).join("") +

        "</ul>";
    }

    var correlati =
      articoliDi(art.categoria)
        .filter(function (a) {
          return a.id !== art.id;
        })
        .slice(0, 5);

    var bloccoCorrelati =
      correlati.length
        ? "<h4>Altre guide in " +
          esc(cat.nome) +
          "</h4>" +

          "<ul>" +

          correlati.map(function (a) {
            return (
              '<li><a href="articolo.html?id=' +
              encodeURIComponent(a.id) +
              '">' +

              esc(a.titolo) +

              "</a></li>"
            );
          }).join("") +

          "</ul>"

        : "";

    var lat = $("#laterale");

    if (lat) {
      lat.innerHTML =
        indice +
        bloccoCorrelati +

        "<h4>Azioni</h4>" +

        '<p style="margin:0">' +
        '<a href="#" id="stampa-guida">' +
        "Stampa questa guida" +
        "</a>" +
        "</p>";

      var st =
        $("#stampa-guida");

      if (st) {
        st.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            window.print();
          }
        );
      }
    }
  }

  /* ---------- Pagina: ricerca ---------- */

  function punteggio(art, termini) {
    var t =
      normalizza(art.titolo);

    var g =
      normalizza(
        art.tag.join(" ")
      );

    var s =
      normalizza(art.sommario);

    var c =
      normalizza(
        soloTesto(art.corpo)
      );

    var tot = 0;
    var trovati = 0;

    termini.forEach(function (q) {
      var p = 0;

      if (t.indexOf(q) !== -1) {
        p += 12;
      }

      if (g.indexOf(q) !== -1) {
        p += 7;
      }

      if (s.indexOf(q) !== -1) {
        p += 4;
      }

      if (c.indexOf(q) !== -1) {
        p += 1;
      }

      if (p > 0) {
        trovati++;
      }

      tot += p;
    });

    if (trovati === 0) {
      return 0;
    }

    if (trovati === termini.length) {
      tot += 10;
    }

    return tot;
  }

  function evidenziatore(termini) {
    return function (testo) {
      var out =
        esc(testo);

      termini.forEach(function (q) {
        if (q.length < 2) {
          return;
        }

        var re =
          new RegExp(
            "(" +
            q.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            ) +
            ")",
            "gi"
          );

        out =
          out.replace(
            re,
            "<mark>$1</mark>"
          );
      });

      return out;
    };
  }

  function renderRicerca() {
    var q =
      parametro("q").trim();

    var contenuto =
      $("#contenuto");

    var campo =
      $("#campo-ricerca");

    if (campo) {
      campo.value = q;
    }

    document.title =
      q
        ? 'Ricerca: "' +
          q +
          '" - Supporto IT'

        : "Ricerca - Supporto IT ADCO HUB";

    $("#briciole").innerHTML =
      '<a href="index.html">Supporto IT</a>' +
      "<span>/</span>" +
      "Ricerca";

    renderLateraleCategorie(null);

    if (!q) {
      contenuto.innerHTML =
        "<h1>Cerca nella knowledge base</h1>" +

        '<div class="stato-vuoto">' +

        "<h3>Scrivi cosa ti serve</h3>" +

        "<p>" +
        "Prova con parole come " +
        "<em>password</em>, " +
        "<em>vpn</em>, " +
        "<em>stampante</em> o " +
        "<em>phishing</em>." +
        "</p>" +

        "</div>";

      return;
    }

    var termini =
      normalizza(q)
        .split(" ")
        .filter(function (x) {
          return x.length > 1;
        });

    var risultati =
      KB.articoli

        .map(function (a) {
          return {
            a: a,
            p: punteggio(
              a,
              termini
            )
          };
        })

        .filter(function (r) {
          return r.p > 0;
        })

        .sort(function (x, y) {
          return (
            y.p -
            x.p ||
            perData(
              x.a,
              y.a
            )
          );
        })

        .map(function (r) {
          return r.a;
        });

    if (!risultati.length) {
      contenuto.innerHTML =
        "<h1>Nessun risultato per &laquo;" +
        esc(q) +
        "&raquo;</h1>" +

        '<div class="stato-vuoto">' +

        "<h3>" +
        "Non abbiamo trovato guide corrispondenti" +
        "</h3>" +

        "<p>" +
        "Prova con parole diverse o più generiche, " +
        "oppure sfoglia le categorie dal menu laterale." +
        "</p>" +

        '<p><a class="bottone" href="contatti.html">' +
        "Apri una richiesta al supporto IT" +
        "</a></p>" +

        "</div>";

      return;
    }

    contenuto.innerHTML =
      '<div class="sezione-intestazione">' +

      "<div>" +

      "<h1>Risultati per &laquo;" +
      esc(q) +
      "&raquo;</h1>" +

      "<p>" +
      risultati.length +

      (risultati.length === 1
        ? " guida trovata"
        : " guide trovate") +

      "</p>" +

      "</div>" +
      "</div>" +

      '<div class="elenco-articoli">' +

      vociArticolo(
        risultati,
        evidenziatore(termini)
      ) +

      "</div>" +

      riquadroAiuto();
  }

  /* ============================================================
     ASSISTENTE AI
     ============================================================ */

  /*
   * AI Mode non invia tutta la knowledge base a ogni richiesta.
   *
   * Prima cerca nel browser le guide più pertinenti.
   * Solo dopo manda le guide selezionate a /api/chat.
   *
   * La ricerca normale del sito continua a utilizzare punteggio().
   * AI Mode utilizza invece punteggioAI().
   */

  var PAROLE_COMUNI_AI = {
    a: true,
    ad: true,
    al: true,
    alla: true,
    alle: true,
    allo: true,
    ai: true,
    agli: true,

    che: true,
    chi: true,
    come: true,
    con: true,
    cosa: true,

    da: true,
    dal: true,
    dalla: true,

    dei: true,
    del: true,
    della: true,
    delle: true,

    di: true,

    e: true,
    ed: true,

    gli: true,

    ha: true,
    hai: true,
    ho: true,

    i: true,
    il: true,

    in: true,
    io: true,

    la: true,
    le: true,
    lo: true,

    ma: true,
    mi: true,

    nel: true,
    nella: true,

    non: true,

    o: true,

    per: true,
    pero: true,
    piu: true,

    quale: true,
    quando: true,

    se: true,
    si: true,
    sono: true,

    su: true,
    sul: true,
    sulla: true,

    un: true,
    una: true,
    uno: true,

    vorrei: true,
    devo: true,
    posso: true,

    riesco: true,
    gia: true,
    ancora: true,

    fare: true,
    fatto: true
  };

  /*
   * Parole considerate equivalenti nella ricerca AI.
   *
   * Esempio:
   *
   * "il PC va lentissimo"
   *
   * può trovare una guida con la parola:
   *
   * "lento"
   */

  var SINONIMI_AI = [
    [
      "stampante",
      "stampare",
      "stampa",
      "stampe"
    ],

    [
      "monitor",
      "schermo",
      "display"
    ],

    [
      "lento",
      "lenta",
      "lentissimo",
      "lentissima",
      "rallenta",
      "rallentato",
      "rallentata"
    ],

    [
      "collegare",
      "collegamento",
      "collegato",
      "connessione",
      "connettere",
      "connesso",
      "comunicare",
      "comunica",
      "parla"
    ],

    [
      "mail",
      "email",
      "posta"
    ],

    [
      "ricevere",
      "riceve",
      "ricezione",
      "arriva",
      "arrivano"
    ],

    [
      "inviare",
      "invio",
      "invia",
      "mandare",
      "manda",
      "spedire"
    ],

    [
      "cartella",
      "cartelle",
      "directory"
    ],

    [
      "rete",
      "network"
    ],

    [
      "account",
      "utente",
      "profilo"
    ],

    [
      "bloccato",
      "bloccata",
      "blocco",
      "locked"
    ],

    [
      "password",
      "credenziale",
      "credenziali"
    ],

    [
      "microfono",
      "mic"
    ],

    [
      "audio",
      "suono"
    ],

    [
      "masterizzare",
      "masterizzazione",
      "masterizza",
      "dvd"
    ],

    [
      "tac",
      "cbct"
    ],

    [
      "wetransfer",
      "we transfer"
    ],

    [
      "panoramico",
      "panoramica",
      "ortopanoramico",
      "ortopanoramica"
    ]
  ];

  /*
   * Software, servizi e dispositivi specifici.
   *
   * Se l'utente nomina uno di questi termini,
   * le guide che contengono lo stesso termine
   * ricevono molta più priorità.
   */

  var TERMINI_TECNICI_AI = [
    "nnt",
    "sidexis",
    "outlook",
    "oris",
    "opivoice",
    "wetransfer",
    "teams",
    "chrome",
    "windows",
    "vpn",
    "server",
    "panoramico",
    "tac",
    "stampante",
    "microfono"
  ];

  function unici(lista) {
    return lista.filter(function (x, i) {
      return lista.indexOf(x) === i;
    });
  }

  function terminiPerAI(messaggio) {
    var termini =
      normalizza(messaggio)
        .split(" ")
        .filter(function (x) {
          return (
            x.length > 1 &&
            !PAROLE_COMUNI_AI[x]
          );
        });

    return unici(termini);
  }

  /*
   * Aggiunge i sinonimi ai termini cercati.
   */

  function espandiTerminiAI(termini) {
    var espansi =
      termini.slice();

    termini.forEach(function (termine) {

      SINONIMI_AI.forEach(function (gruppo) {

        var gruppoNormalizzato =
          gruppo.map(normalizza);

        if (
          gruppoNormalizzato.indexOf(
            termine
          ) !== -1
        ) {

          gruppoNormalizzato.forEach(
            function (voce) {

              /*
               * Ignoriamo qui le espressioni
               * composte da più parole.
               */

              if (
                voce.indexOf(" ") === -1
              ) {
                espansi.push(voce);
              }

            }
          );

        }

      });

    });

    return unici(espansi);
  }

  /*
   * Piccolo sistema di "radice".
   *
   * Serve per riconoscere:
   *
   * stampare
   * stampante
   * stampa
   *
   * come termini simili.
   */

  function radiceAI(termine) {

    if (termine.length <= 5) {
      return termine;
    }

    var suffissi = [
      "mente",
      "zione",
      "zioni",
      "amento",
      "amenti",

      "ando",
      "endo",

      "ato",
      "ata",
      "ati",
      "ate",

      "are",
      "ere",
      "ire",

      "ico",
      "ica",
      "ici",
      "iche"
    ];

    for (
      var i = 0;
      i < suffissi.length;
      i++
    ) {

      var suffisso =
        suffissi[i];

      if (
        termine.length -
        suffisso.length >= 4 &&

        termine.slice(
          -suffisso.length
        ) === suffisso
      ) {

        return termine.slice(
          0,
          -suffisso.length
        );

      }

    }

    return termine;
  }

  function contieneTermineAI(
    testo,
    termine
  ) {

    if (
      !testo ||
      !termine
    ) {
      return false;
    }

    /*
     * Corrispondenza diretta.
     */

    if (
      testo.indexOf(termine) !== -1
    ) {
      return true;
    }

    /*
     * Per parole molto corte non usiamo
     * la ricerca per radice.
     */

    if (
      termine.length < 5
    ) {
      return false;
    }

    var radice =
      radiceAI(termine);

    if (
      radice.length < 4
    ) {
      return false;
    }

    var parole =
      testo.split(" ");

    for (
      var i = 0;
      i < parole.length;
      i++
    ) {

      if (
        parole[i].indexOf(radice) === 0
      ) {
        return true;
      }

    }

    return false;
  }

  /*
   * Trasforma il corpo HTML della guida
   * in semplice testo.
   */

  function testoArticoloPerAI(html) {

    var contenitore =
      document.createElement("div");

    contenitore.innerHTML =
      String(html || "");

    return (
      contenitore.textContent ||
      contenitore.innerText ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
  }

  /*
   * Cerca di capire se l'utente
   * sta descrivendo un problema.
   */

  function segnaliProblemaAI(
    messaggioNormalizzato
  ) {

    var segnali = [
      "non funziona",
      "non va",
      "non riesco",

      "non comunica",
      "non si collega",
      "non si connette",

      "non vede",
      "non rileva",

      "non trovo",
      "non riceve",

      "problema",
      "errore",

      "bloccato",
      "bloccata",

      "lento",
      "lenta",
      "lentissimo",
      "lentissima"
    ];

    return segnali.some(
      function (segnale) {

        return (
          messaggioNormalizzato.indexOf(
            segnale
          ) !== -1
        );

      }
    );
  }

  /*
   * Cerca nella domanda eventuali
   * software o dispositivi specifici.
   */

  function terminiTecniciNellaDomandaAI(
    messaggioNormalizzato
  ) {

    return TERMINI_TECNICI_AI.filter(
      function (termine) {

        return contieneTermineAI(
          messaggioNormalizzato,
          termine
        );

      }
    );
  }

  /*
   * Motore di punteggio dedicato
   * esclusivamente ad AI Mode.
   */

  function punteggioAI(
    art,
    messaggio
  ) {

    var domanda =
      normalizza(messaggio);

    var terminiOriginali =
      terminiPerAI(messaggio);

    var termini =
      espandiTerminiAI(
        terminiOriginali
      );

    var titolo =
      normalizza(
        art.titolo
      );

    var tag =
      normalizza(
        (art.tag || []).join(" ")
      );

    var sommario =
      normalizza(
        art.sommario || ""
      );

    var corpo =
      normalizza(
        soloTesto(
          art.corpo || ""
        )
      );

    var tutto =
      titolo +
      " " +
      tag +
      " " +
      sommario +
      " " +
      corpo;

    var punti = 0;

    var originaliTrovati = 0;

    /*
     * I termini realmente scritti
     * dall'utente valgono molto.
     *
     * Titolo = peso massimo.
     * Corpo = peso minimo.
     */

    terminiOriginali.forEach(
      function (termine) {

        var trovato = false;

        if (
          contieneTermineAI(
            titolo,
            termine
          )
        ) {

          punti += 34;
          trovato = true;

        }

        if (
          contieneTermineAI(
            tag,
            termine
          )
        ) {

          punti += 24;
          trovato = true;

        }

        if (
          contieneTermineAI(
            sommario,
            termine
          )
        ) {

          punti += 11;
          trovato = true;

        }

        if (
          contieneTermineAI(
            corpo,
            termine
          )
        ) {

          punti += 3;
          trovato = true;

        }

        if (trovato) {
          originaliTrovati++;
        }

      }
    );

    /*
     * I sinonimi aiutano,
     * ma valgono meno.
     */

    termini.forEach(
      function (termine) {

        if (
          terminiOriginali.indexOf(
            termine
          ) !== -1
        ) {
          return;
        }

        if (
          contieneTermineAI(
            titolo,
            termine
          )
        ) {
          punti += 10;
        }

        if (
          contieneTermineAI(
            tag,
            termine
          )
        ) {
          punti += 7;
        }

        if (
          contieneTermineAI(
            sommario,
            termine
          )
        ) {
          punti += 3;
        }

      }
    );

    /*
     * Se la frase dell'utente
     * compare quasi esattamente
     * nella guida, grande bonus.
     */

    if (
      domanda.length > 4
    ) {

      if (
        titolo.indexOf(
          domanda
        ) !== -1
      ) {
        punti += 55;
      }

      if (
        tag.indexOf(
          domanda
        ) !== -1
      ) {
        punti += 35;
      }

      if (
        sommario.indexOf(
          domanda
        ) !== -1
      ) {
        punti += 20;
      }

    }

    /*
     * Premia le guide che coprono
     * molti dei concetti della domanda.
     */

    if (
      terminiOriginali.length
    ) {

      var copertura =
        originaliTrovati /
        terminiOriginali.length;

      if (
        copertura === 1
      ) {
        punti += 26;

      } else if (
        copertura >= 0.75
      ) {
        punti += 16;

      } else if (
        copertura >= 0.5
      ) {
        punti += 7;
      }

    }

    /*
     * Software e dispositivi specifici.
     *
     * Se l'utente scrive:
     *
     * SIDEXIS
     *
     * una guida SIDEXIS deve prevalere
     * rispetto a una guida generica TAC.
     */

    var tecnici =
      terminiTecniciNellaDomandaAI(
        domanda
      );

    tecnici.forEach(
      function (termine) {

        if (
          contieneTermineAI(
            titolo,
            termine
          ) ||

          contieneTermineAI(
            tag,
            termine
          )
        ) {

          punti += 42;

        } else if (
          contieneTermineAI(
            sommario,
            termine
          )
        ) {

          punti += 20;

        } else if (
          !contieneTermineAI(
            tutto,
            termine
          )
        ) {

          punti -= 16;

        }

      }
    );

    /*
     * Se l'utente descrive un problema,
     * favorisce guide di troubleshooting.
     */

    if (
      segnaliProblemaAI(
        domanda
      )
    ) {

      var testoBreve =
        titolo +
        " " +
        tag +
        " " +
        sommario;

      var paroleProblema = [
        "problema",
        "problemi",

        "errore",
        "errori",

        "non",

        "bloccato",
        "bloccata",

        "lento",
        "lenta",

        "connessione",

        "rilevato",
        "rilevata",

        "risoluzione",

        "verifiche"
      ];

      if (
        paroleProblema.some(
          function (p) {

            return contieneTermineAI(
              testoBreve,
              p
            );

          }
        )
      ) {

        punti += 14;

      }

    }

    /*
     * Mai restituire punteggi negativi.
     */

    return Math.max(
      0,
      punti
    );
  }

  /*
   * Seleziona le guide da inviare a OpenAI.
   */

  function trovaGuidePerAI(
    messaggio
  ) {

    var termini =
      terminiPerAI(
        messaggio
      );

    if (!termini.length) {
      return [];
    }

    var risultati =
      KB.articoli

        .map(function (a) {

          return {
            articolo: a,

            punti:
              punteggioAI(
                a,
                messaggio
              )
          };

        })

        .filter(function (r) {
          return r.punti > 0;
        })

        .sort(function (a, b) {

          return (
            b.punti -
            a.punti ||

            perData(
              a.articolo,
              b.articolo
            )
          );

        });

    if (!risultati.length) {
      return [];
    }

    /*
     * La vecchia versione faceva:
     *
     * .slice(0, 3)
     *
     * e quindi mandava sempre
     * fino a tre guide.
     *
     * Ora invece una guida secondaria
     * viene mantenuta solo se ha
     * un punteggio abbastanza vicino
     * alla migliore.
     */

    var migliore =
      risultati[0].punti;

    var soglia =
      Math.max(
        22,
        migliore * 0.38
      );

    var pertinenti =
      risultati

        .filter(
          function (r, indice) {

            /*
             * La prima guida
             * viene sempre mantenuta.
             */

            return (
              indice === 0 ||
              r.punti >= soglia
            );

          }
        )

        .slice(0, 3);

    /*
     * Prepariamo solamente
     * i dati necessari a OpenAI.
     */

    return pertinenti.map(
      function (r) {

        var a =
          r.articolo;

        var cat =
          categoria(
            a.categoria
          );

        return {
          id:
            a.id,

          titolo:
            a.titolo,

          categoria:
            cat
              ? cat.nome
              : a.categoria,

          sommario:
            a.sommario,

          /*
           * Limite di sicurezza:
           * massimo 5000 caratteri
           * del corpo della guida.
           */
          contenuto:
            testoArticoloPerAI(
              a.corpo
            ).slice(
              0,
              5000
            )
        };

      }
    );
  }

  /* ---------- Chiamata API OpenAI ---------- */

  async function chiediAI(
    messaggio
  ) {

    try {

      /*
       * Prima cerchiamo localmente
       * le guide pertinenti.
       */

      var guide =
        trovaGuidePerAI(
          messaggio
        );

      /*
       * Poi inviamo domanda + guide
       * al nostro endpoint Vercel.
       */

      var risposta =
        await fetch(
          "/api/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                message:
                  messaggio,

                articles:
                  guide
              })
          }
        );

      var dati =
        await risposta.json();

      if (!risposta.ok) {

        console.error(
          "Errore API:",
          dati
        );

        throw new Error(
          dati.error ||
          "Errore durante la richiesta"
        );
      }

      return dati.answer;

    } catch (errore) {

      console.error(
        "Errore Assistente AI:",
        errore
      );

      throw errore;
    }
  }

  /* ---------- AI Mode home ---------- */

  function inizializzaAIMode() {
    var pulsante =
      $("#ai-mode-btn");

    var campo =
      $("#campo-ai");

    if (!pulsante) {
      return;
    }

    pulsante.addEventListener(
      "click",
      function () {

        var messaggio =
          campo
            ? campo.value.trim()
            : "";

        window.location.href =
          "ai-mode.html" +

          (
            messaggio
              ? "?q=" +
                encodeURIComponent(
                  messaggio
                )

              : ""
          );

      }
    );
  }

  /* ---------- Comportamenti comuni ---------- */

  function inizializzaComuni() {

    /* Menu mobile */

    var toggle =
      $("#menu-toggle");

    var nav =
      $("#nav");

    if (
      toggle &&
      nav
    ) {

      toggle.addEventListener(
        "click",
        function () {

          nav.classList.toggle(
            "aperto"
          );

        }
      );

    }

    /*
     * Form di ricerca normali.
     *
     * Il modulo AI Mode
     * usa una gestione separata.
     */

    $$("form.cerca").forEach(
      function (form) {

        form.addEventListener(
          "submit",
          function (e) {

            e.preventDefault();

            var input =
              $("input", form);

            var valore =
              input
                ? input.value.trim()
                : "";

            window.location.href =
              "ricerca.html?q=" +
              encodeURIComponent(
                valore
              );

          }
        );

      }
    );

    /* Voce di menu attiva */

    var pagina =
      document.body.getAttribute(
        "data-pagina"
      );

    $$("#nav a").forEach(
      function (a) {

        if (
          a.getAttribute(
            "data-voce"
          ) === pagina
        ) {

          a.classList.add(
            "attivo"
          );

        }

      }
    );

    /*
     * Se il sito viene aperto
     * direttamente come file locale,
     * nascondiamo Esci.
     */

    if (
      window.location.protocol ===
      "file:"
    ) {

      $$(".esci").forEach(
        function (a) {

          a.style.display =
            "none";

        }
      );

    }

    /* Anno nel footer */

    $$(".anno").forEach(
      function (el) {

        el.textContent =
          new Date()
            .getFullYear();

      }
    );

    /* Data aggiornamento knowledge base */

    $$(".aggiornamento-kb").forEach(
      function (el) {

        el.textContent =
          dataLeggibile(
            KB.aggiornamento
          );

      }
    );
  }

  /* ---------- API esposta ad ai-mode.html ---------- */

  window.KBAiuto = {
    chiediAI:
      chiediAI
  };

  /* ---------- Avvio ---------- */

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      inizializzaComuni();
      inizializzaAIMode();

      var pagina =
        document.body.getAttribute(
          "data-pagina"
        );

      if (
        pagina === "home"
      ) {

        renderHome();

      } else if (
        pagina === "categoria"
      ) {

        renderCategoria();

      } else if (
        pagina === "articolo"
      ) {

        renderArticolo();

      } else if (
        pagina === "ricerca"
      ) {

        renderRicerca();

      } else if (
        pagina === "contatti"
      ) {

        renderLateraleCategorie(
          null
        );

      }

    }
  );

})();
