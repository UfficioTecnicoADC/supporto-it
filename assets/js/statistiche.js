/* ============================================================
   Supporto IT - ADCO HUB
   Pagina "Statistiche Helpo": legge /api/feedback e mostra voti,
   domande senza guida e commenti del mese scelto.
   I commenti sono scritti dai colleghi: vanno sempre inseriti
   come testo, mai come HTML.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function chiaveMese(data) {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit' }).format(data);
  }

  function nomeMese(chiave) {
    var p = chiave.split('-');
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, 1)));
  }

  function ultimiMesi(n) {
    var mesi = [], oggi = new Date();
    for (var i = 0; i < n; i++) mesi.push(chiaveMese(new Date(Date.UTC(oggi.getUTCFullYear(), oggi.getUTCMonth() - i, 15))));
    return mesi;
  }

  function percentuale(parte, totale) {
    return totale ? Math.round(parte * 100 / totale) + '%' : '—';
  }

  function scheda(titolo, numero, nota) {
    return '<div class="scheda"><h3>' + esc(titolo) + '</h3><p class="statistiche-numero">' + esc(numero) + '</p>' +
      (nota ? '<p>' + esc(nota) + '</p>' : '') + '</div>';
  }

  function linkGuida(g) {
    return '<a href="articolo.html?id=' + encodeURIComponent(g.id) + '">' + esc(g.titolo) + '</a>';
  }

  function render(d) {
    var valutate = d.totale.su + d.totale.giu;
    var html =
      '<div class="griglia-contatti" style="margin-bottom:28px">' +
      scheda('Risposte valutate', valutate, d.totale.su + ' 👍 · ' + d.totale.giu + ' 👎') +
      scheda('Giudicate utili', percentuale(d.totale.su, valutate), 'sul totale delle risposte valutate') +
      scheda('Domande a Helpo', d.domande.totale, d.domande.senzaGuida + ' senza una guida pertinente (' + percentuale(d.domande.senzaGuida, d.domande.totale) + ')') +
      '</div>';

    html += '<h2>Guide citate nelle risposte valutate</h2>';
    if (!d.guide.length) {
      html += '<p>Nessun voto su risposte con guide in questo mese.</p>';
    } else {
      html += '<div class="statistiche-tabella"><table class="tabella-livelli">' +
        '<tr><th>Guida</th><th class="numero">👍</th><th class="numero">👎</th><th class="numero">Utile</th></tr>' +
        d.guide.map(function (g) {
          return '<tr><td>' + linkGuida(g) + '</td><td class="numero">' + g.su + '</td><td class="numero">' + g.giu +
            '</td><td class="numero">' + percentuale(g.su, g.su + g.giu) + '</td></tr>';
        }).join('') +
        '</table></div>';
    }
    if (d.senzaGuida.su + d.senzaGuida.giu) {
      html += '<p>Risposte valutate senza nessuna guida: ' + d.senzaGuida.su + ' 👍 · ' + d.senzaGuida.giu + ' 👎.</p>';
    }

    html += '<h2>Commenti</h2>';
    if (!d.commenti.length) {
      html += '<p>Nessun commento in questo mese.</p>';
    } else {
      html += '<p class="ai-disclaimer" style="margin-bottom:14px">Email, telefoni e codici fiscali vengono oscurati prima del salvataggio. I commenti si cancellano da soli 90 giorni dopo la fine del mese.</p>' +
        d.commenti.map(function (c) {
          return '<div class="scheda statistiche-commento">' +
            '<p class="ai-disclaimer">' + esc(c.data) + (c.guide.length ? ' · ' + c.guide.map(linkGuida).join(', ') : ' · nessuna guida') + '</p>' +
            '<p>' + esc(c.testo) + '</p></div>';
        }).join('');
    }
    return html;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var box = document.getElementById('statistiche');
    var scelta = document.getElementById('mese-statistiche');
    if (!box || !scelta) return;

    scelta.innerHTML = ultimiMesi(12).map(function (m) {
      return '<option value="' + m + '">' + esc(nomeMese(m)) + '</option>';
    }).join('');

    async function carica() {
      box.innerHTML = '<p>Caricamento...</p>';
      try {
        var risposta = await fetch('/api/feedback?mese=' + encodeURIComponent(scelta.value), { headers: { Accept: 'application/json' } });
        var dati = await risposta.json();
        // Due livelli di accesso: il login del sito (8 ore) e quello dell'area IT (2 ore).
        if (risposta.status === 401) {
          var it = dati.code === 'IT_REQUIRED';
          box.innerHTML = '<div class="nota attenzione"><strong>' + (it ? 'Sessione dell’area IT scaduta' : 'Sessione scaduta') + '</strong>' +
            '<a href="' + (it ? '/login-it.html' : '/login.html') + '?da=%2Fstatistiche.html">Accedi di nuovo</a> per vedere le statistiche.</div>';
          return;
        }
        if (!risposta.ok) throw new Error(dati.error || 'Statistiche non disponibili.');
        box.innerHTML = render(dati);
      } catch (e) {
        box.innerHTML = '<div class="nota attenzione"><strong>Statistiche non disponibili</strong>' + esc(e.message || 'Riprova tra poco.') + '</div>';
      }
    }

    scelta.addEventListener('change', carica);
    carica();
  });
})();
