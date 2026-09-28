(function () {
  'use strict';
  var KEY = 'adco_helpo_conversazione_v2';
  function esc(text) { return String(text).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function format(text) { return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').split(/\n{2,}/).map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function sources(list) { return Array.isArray(list) ? list.filter(function (s) { return s && typeof s.id === 'string' && /^[A-Za-z0-9-]+$/.test(s.id) && typeof s.titolo === 'string'; }).slice(0, 3).map(function (s) { return { id: s.id, titolo: s.titolo.slice(0, 250) }; }) : []; }
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('modulo-ai');
    var field = document.getElementById('campo-ai-pagina');
    var send = document.getElementById('ai-invia');
    var reset = document.getElementById('nuova-chat');
    var log = document.getElementById('conversazione-ai');
    var empty = document.getElementById('ai-vuoto');
    var fixed = document.getElementById('ai-composer-fissa');
    var suggestions = document.getElementById('ai-suggerimenti');
    if (!form || !window.KBAiuto) return;
    var originalParent = form.parentNode;
    var history = [];
    var busy = false;
    try {
      sessionStorage.removeItem('adco_helpo_conversazione_v1');
      var saved = JSON.parse(sessionStorage.getItem(KEY) || '[]');
      if (Array.isArray(saved)) history = saved.filter(function (m) { return m && ['user', 'assistant'].indexOf(m.role) !== -1 && typeof m.content === 'string'; }).slice(-10).map(function (m) { return { role: m.role, content: m.content.slice(0, 4000), sources: sources(m.sources) }; });
    } catch (e) {}
    function save() { try { sessionStorage.setItem(KEY, JSON.stringify(history)); } catch (e) {} }
    function activate() { empty.hidden = true; suggestions.hidden = true; fixed.hidden = false; fixed.querySelector('.ai-composer-fissa-interno').appendChild(form); field.placeholder = 'Chiedi un’altra cosa...'; }
    function setBusy(value) { busy = value; send.disabled = value; field.disabled = value; reset.disabled = value; log.setAttribute('aria-busy', String(value)); }
    function showSources(turn, list) {
      if (!list.length) return;
      var box = document.createElement('div'); box.className = 'ai-fonti';
      var title = document.createElement('strong'); title.textContent = 'Guide disponibili per questa risposta'; box.appendChild(title);
      var ul = document.createElement('ul');
      list.forEach(function (s) { var li = document.createElement('li'); var a = document.createElement('a'); a.href = 'articolo.html?id=' + encodeURIComponent(s.id); a.textContent = s.titolo; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.appendChild(a); ul.appendChild(li); });
      box.appendChild(ul); turn.appendChild(box);
    }
    function finish(turn, box, answer, list) {
      box.className = 'risposta-ai'; box.innerHTML = format(answer);
      showSources(turn, sources(list));
      var note = document.createElement('p'); note.className = 'ai-disclaimer'; note.innerHTML = 'Verifica i passaggi nelle guide. Se il problema persiste, contatta il <a href="contatti.html">supporto IT</a>.'; turn.appendChild(note);
      var copy = document.createElement('button'); copy.type = 'button'; copy.className = 'bottone secondario'; copy.textContent = 'Copia risposta';
      copy.addEventListener('click', async function () { try { await navigator.clipboard.writeText(answer); copy.textContent = 'Copiato'; } catch (e) { copy.textContent = 'Copia non disponibile'; } }); turn.appendChild(copy);
    }
    function create(question) {
      var turn = document.createElement('div'); turn.className = 'ai-turno';
      var q = document.createElement('div'); q.className = 'ai-domanda'; q.textContent = question;
      var box = document.createElement('div'); box.className = 'risposta-ai risposta-ai-caricamento'; box.textContent = 'Sto preparando la risposta...';
      turn.appendChild(q); turn.appendChild(box); log.appendChild(turn); return { turn: turn, box: box };
    }
    function newChat() {
      if (busy) return;
      history = []; save(); log.innerHTML = ''; fixed.hidden = true; empty.hidden = false; suggestions.hidden = false;
      originalParent.insertBefore(form, suggestions); field.value = ''; field.placeholder = 'Chiedi qualsiasi cosa sul supporto IT...'; field.focus();
    }
    async function ask(message) {
      if (busy) return;
      activate(); setBusy(true);
      var nodes = create(message); nodes.turn.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        // Solo gli id delle guide citate: il server ne rilegge il contenuto dall'archivio.
        var result = await window.KBAiuto.chiediAI(message, history.map(function (m) { return m.role === 'assistant' ? { role: m.role, content: m.content, sources: (m.sources || []).map(function (s) { return s.id; }) } : { role: m.role, content: m.content }; }));
        if (!result || typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('Non ho ricevuto una risposta. Riprova.');
        finish(nodes.turn, nodes.box, result.answer, result.sources);
        history.push({ role: 'user', content: message }, { role: 'assistant', content: result.answer.slice(0, 4000), sources: sources(result.sources) });
        history = history.slice(-10); save(); field.value = '';
      } catch (error) {
        nodes.box.className = 'risposta-ai risposta-ai-errore';
        nodes.box.textContent = error.message || 'Non riesco a contattare l’assistente. Riprova.';
        field.value = message;
        if (error.code === 'SESSION_EXPIRED') {
          history = []; save();
          var login = document.createElement('a'); login.className = 'bottone'; login.href = '/login.html?da=%2Fai-mode.html'; login.textContent = 'Accedi di nuovo'; nodes.turn.appendChild(login);
        }
      } finally { setBusy(false); field.focus(); }
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var message = field.value.trim(); if (message && !busy) ask(message); });
    reset.addEventListener('click', newChat);
    var initial = new URLSearchParams(location.search).get('q');
    if (initial) {
      history = []; save(); window.history.replaceState(null, '', 'ai-mode.html');
      if (initial.length > 4000) { field.value = initial.slice(0, 4000); } else { ask(initial); }
    } else if (history.length) {
      activate(); var question = null;
      history.forEach(function (m) { if (m.role === 'user') question = m.content; else if (question) { var nodes = create(question); finish(nodes.turn, nodes.box, m.content, m.sources); question = null; } });
    }
  });
})();
