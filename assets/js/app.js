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

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function parametro(nome) {
    var m = new RegExp("[?&]" + nome + "=([^&]*)").exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Segni diacritici combinanti U+0300-U+036F, scritti senza caratteri speciali */
  var COMBINANTI = new RegExp("[" + String.fromCharCode(768) + "-" + String.fromCharCode(879) + "]", "g");

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
    return String(html).replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/g, " ");
  }

  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
    "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

  function dataLeggibile(iso) {
    var p = String(iso).split("-");
    if (p.length !== 3) return iso;
    return parseInt(p[2], 10) + " " + MESI[parseInt(p[1], 10) - 1] + " " + p[0];
  }

  function icona(chiave) {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      (ICONE[chiave] || ICONE.documento) + "</svg>";
  }

  function categoria(id) {
    for (var i = 0; i < KB.categorie.length; i++) {
      if (KB.categorie[i].id === id) return KB.categorie[i];
    }
    return null;
  }

  function articolo(id) {
    for (var i = 0; i < KB.articoli.length; i++) {
      if (KB.articoli[i].id === id) return KB.articoli[i];
    }
    return null;
  }

  function articoliDi(idCategoria) {
    return KB.articoli.filter(function (a) { return a.categoria === idCategoria; });
  }

  function perData(a, b) { return b.aggiornato.localeCompare(a.aggiornato); }

  /* ---------- Frammenti riutilizzabili ---------- */

  function vociArticolo(lista, evidenzia) {
    if (!lista.length) return "";
    return lista.map(function (a) {
      var cat = categoria(a.categoria);
      return '<a class="voce-articolo" href="articolo.html?id=' + encodeURIComponent(a.id) + '">' +
        "<h3>" + (evidenzia ? evidenzia(a.titolo) : esc(a.titolo)) + "</h3>" +
        "<p>" + (evidenzia ? evidenzia(a.sommario) : esc(a.sommario)) + "</p>" +
        '<div class="voce-meta">' +
        '<span class="etichetta">' + esc(cat ? cat.nome : a.categoria) + "</span>" +
        '<span class="punto">&bull;</span><span>' + a.minuti + " min di lettura</span>" +
        '<span class="punto">&bull;</span><span>Aggiornato il ' + dataLeggibile(a.aggiornato) + "</span>" +
        "</div></a>";
    }).join("");
  }

  function riquadroAiuto() {
    return '<div class="riquadro-aiuto">' +
      "<div><h3>Non hai trovato quello che cercavi?</h3>" +
      "<p>Il supporto IT risponde alle richieste in giorni lavorativi, dal lunedì al venerdì.</p></div>" +
      '<a class="bottone" href="contatti.html">Contatta il supporto IT</a></div>';
  }

  /* ---------- Pagina: home ---------- */

  function renderHome() {
    var griglia = $("#griglia-categorie");
    if (griglia) {
      griglia.innerHTML = KB.categorie.map(function (c) {
        var n = articoliDi(c.id).length;
        return '<a class="scheda-categoria" href="categoria.html?cat=' + encodeURIComponent(c.id) + '">' +
          '<div class="scheda-icona">' + icona(c.icona) + "</div>" +
          "<h3>" + esc(c.nome) + "</h3><p>" + esc(c.descrizione) + "</p>" +
          '<div class="scheda-conteggio">' + n + (n === 1 ? " guida" : " guide") + "</div></a>";
      }).join("");
    }

    var recenti = $("#articoli-recenti");
    if (recenti) {
      recenti.innerHTML = vociArticolo(KB.articoli.slice().sort(perData).slice(0, 6));
    }

    var totale = $("#totale-guide");
    if (totale) totale.textContent = KB.articoli.length;
  }

  /* ---------- Pagina: categoria ---------- */

  function renderCategoria() {
    var id = parametro("cat");
    var cat = categoria(id);
    var contenuto = $("#contenuto");

    if (!cat) {
      document.title = "Categoria non trovata - Supporto IT";
      contenuto.innerHTML = '<div class="stato-vuoto"><h3>Categoria non trovata</h3>' +
        "<p>La categoria richiesta non esiste o è stata rinominata.</p>" +
        '<p><a class="bottone secondario" href="index.html">Torna alla home</a></p></div>';
      return;
    }

    document.title = cat.nome + " - Supporto IT ADCO HUB";
    var lista = articoliDi(cat.id).slice().sort(perData);

    $("#briciole").innerHTML = '<a href="index.html">Supporto IT</a><span>/</span>' + esc(cat.nome);

    contenuto.innerHTML =
      '<div class="sezione-intestazione"><div><h1>' + esc(cat.nome) + "</h1>" +
      "<p>" + esc(cat.descrizione) + " &mdash; " + lista.length +
      (lista.length === 1 ? " guida disponibile" : " guide disponibili") + "</p></div></div>" +
      '<div class="elenco-articoli">' + vociArticolo(lista) + "</div>" +
      riquadroAiuto();

    renderLateraleCategorie(cat.id);
  }

  function renderLateraleCategorie(attiva) {
    var lat = $("#laterale");
    if (!lat) return;
    lat.innerHTML = "<h4>Categorie</h4><ul>" + KB.categorie.map(function (c) {
      return '<li><a class="' + (c.id === attiva ? "attivo" : "") +
        '" href="categoria.html?cat=' + encodeURIComponent(c.id) + '">' +
        esc(c.nome) + " <span style=\"color:var(--testo-tenue)\">(" + articoliDi(c.id).length + ")</span></a></li>";
    }).join("") + "</ul>";
  }

  /* ---------- Pagina: articolo ---------- */

  function renderArticolo() {
    var art = articolo(parametro("id"));
    var contenuto = $("#contenuto");

    if (!art) {
      document.title = "Guida non trovata - Supporto IT";
      $("#briciole").innerHTML = '<a href="index.html">Supporto IT</a>';
      contenuto.innerHTML = '<div class="stato-vuoto"><h3>Guida non trovata</h3>' +
        "<p>Il documento richiesto non esiste o è stato spostato.</p>" +
        '<p><a class="bottone secondario" href="index.html">Torna alla home</a></p></div>';
      return;
    }

    var cat = categoria(art.categoria);
    document.title = art.titolo + " - Supporto IT ADCO HUB";

    $("#briciole").innerHTML = '<a href="index.html">Supporto IT</a><span>/</span>' +
      '<a href="categoria.html?cat=' + encodeURIComponent(cat.id) + '">' + esc(cat.nome) + "</a>" +
      "<span>/</span>" + esc(art.titolo);

    contenuto.innerHTML =
      '<article class="articolo">' +
      '<header class="articolo-intestazione"><h1>' + esc(art.titolo) + "</h1>" +
      '<div class="articolo-meta">' +
      '<span class="etichetta">' + esc(cat.nome) + "</span>" +
      '<span class="punto">&bull;</span><span>' + art.minuti + " min di lettura</span>" +
      '<span class="punto">&bull;</span><span>Aggiornato il ' + dataLeggibile(art.aggiornato) + "</span>" +
      "</div></header>" +
      '<div class="articolo-corpo" id="corpo">' + art.corpo + "</div>" +
      "</article>" + riquadroAiuto();

    /* Indice generato dai titoli di secondo livello */
    var titoli = $$("#corpo h2");
    var indice = "";
    if (titoli.length > 1) {
      indice = "<h4>In questa guida</h4><ul>" + titoli.map(function (h, i) {
        var slug = "sez-" + i;
        h.id = slug;
        return '<li><a href="#' + slug + '">' + esc(h.textContent) + "</a></li>";
      }).join("") + "</ul>";
    }

    var correlati = articoliDi(art.categoria).filter(function (a) { return a.id !== art.id; }).slice(0, 5);
    var bloccoCorrelati = correlati.length
      ? "<h4>Altre guide in " + esc(cat.nome) + "</h4><ul>" + correlati.map(function (a) {
          return '<li><a href="articolo.html?id=' + encodeURIComponent(a.id) + '">' + esc(a.titolo) + "</a></li>";
        }).join("") + "</ul>"
      : "";

    var lat = $("#laterale");
    if (lat) {
      lat.innerHTML = indice + bloccoCorrelati +
        '<h4>Azioni</h4><p style="margin:0"><a href="#" id="stampa-guida">Stampa questa guida</a></p>';
      var st = $("#stampa-guida");
      if (st) {
        st.addEventListener("click", function (e) { e.preventDefault(); window.print(); });
      }
    }
  }

  /* ---------- Pagina: ricerca ---------- */

  function punteggio(art, termini) {
    var t = normalizza(art.titolo);
    var g = normalizza(art.tag.join(" "));
    var s = normalizza(art.sommario);
    var c = normalizza(soloTesto(art.corpo));
    var tot = 0, trovati = 0;

    termini.forEach(function (q) {
      var p = 0;
      if (t.indexOf(q) !== -1) p += 12;
      if (g.indexOf(q) !== -1) p += 7;
      if (s.indexOf(q) !== -1) p += 4;
      if (c.indexOf(q) !== -1) p += 1;
      if (p > 0) trovati++;
      tot += p;
    });

    if (trovati === 0) return 0;
    /* Chi contiene tutti i termini viene premiato */
    if (trovati === termini.length) tot += 10;
    return tot;
  }

  function evidenziatore(termini) {
    return function (testo) {
      var out = esc(testo);
      termini.forEach(function (q) {
        if (q.length < 2) return;
        var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
        out = out.replace(re, "<mark>$1</mark>");
      });
      return out;
    };
  }

  function renderRicerca() {
    var q = parametro("q").trim();
    var contenuto = $("#contenuto");
    var campo = $("#campo-ricerca");
    if (campo) campo.value = q;
    document.title = q ? 'Ricerca: "' + q + '" - Supporto IT' : "Ricerca - Supporto IT ADCO HUB";
    $("#briciole").innerHTML = '<a href="index.html">Supporto IT</a><span>/</span>Ricerca';

    renderLateraleCategorie(null);

    if (!q) {
      contenuto.innerHTML = "<h1>Cerca nella knowledge base</h1>" +
        '<div class="stato-vuoto"><h3>Scrivi cosa ti serve</h3>' +
        "<p>Prova con parole come <em>password</em>, <em>vpn</em>, <em>stampante</em> o <em>phishing</em>.</p></div>";
      return;
    }

    var termini = normalizza(q).split(" ").filter(function (x) { return x.length > 1; });
    var risultati = KB.articoli
      .map(function (a) { return { a: a, p: punteggio(a, termini) }; })
      .filter(function (r) { return r.p > 0; })
      .sort(function (x, y) { return y.p - x.p || perData(x.a, y.a); })
      .map(function (r) { return r.a; });

    if (!risultati.length) {
      contenuto.innerHTML = "<h1>Nessun risultato per &laquo;" + esc(q) + "&raquo;</h1>" +
        '<div class="stato-vuoto"><h3>Non abbiamo trovato guide corrispondenti</h3>' +
        "<p>Prova con parole diverse o più generiche, oppure sfoglia le categorie dal menu laterale.</p>" +
        '<p><a class="bottone" href="contatti.html">Apri una richiesta al supporto IT</a></p></div>';
      return;
    }

    contenuto.innerHTML =
      '<div class="sezione-intestazione"><div><h1>Risultati per &laquo;' + esc(q) + "&raquo;</h1>" +
      "<p>" + risultati.length + (risultati.length === 1 ? " guida trovata" : " guide trovate") + "</p></div></div>" +
      '<div class="elenco-articoli">' + vociArticolo(risultati, evidenziatore(termini)) + "</div>" +
      riquadroAiuto();
  }

  /* ---------- Comportamenti comuni ---------- */

  function inizializzaComuni() {
    /* Menu mobile */
    var toggle = $("#menu-toggle");
    var nav = $("#nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () { nav.classList.toggle("aperto"); });
    }

    /* Form di ricerca presenti nella pagina */
    $$("form.cerca").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = $("input", form);
        var valore = input ? input.value.trim() : "";
        window.location.href = "ricerca.html?q=" + encodeURIComponent(valore);
      });
    });

    /* Voce di menu attiva */
    var pagina = document.body.getAttribute("data-pagina");
    $$("#nav a").forEach(function (a) {
      if (a.getAttribute("data-voce") === pagina) a.classList.add("attivo");
    });

    /* Aprendo i file in locale non c'è un server: la voce "Esci"
       non avrebbe nulla da chiamare, quindi la nascondiamo. */
    if (window.location.protocol === "file:") {
      $$(".esci").forEach(function (a) { a.style.display = "none"; });
    }

    /* Anno nel piè di pagina */
    $$(".anno").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    $$(".aggiornamento-kb").forEach(function (el) { el.textContent = dataLeggibile(KB.aggiornamento); });
  }

  /* ---------- Avvio ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    inizializzaComuni();
    var pagina = document.body.getAttribute("data-pagina");
    if (pagina === "home") renderHome();
    else if (pagina === "categoria") renderCategoria();
    else if (pagina === "articolo") renderArticolo();
    else if (pagina === "ricerca") renderRicerca();
    else if (pagina === "contatti") renderLateraleCategorie(null);
  });

})();
