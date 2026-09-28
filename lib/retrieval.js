import { knowledgeBase } from './knowledge-base.js';

export function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/wi[ -]fi/g, 'wifi').replace(/oris\s*dent/g, 'oris').replace(/[^a-z0-9]+/g, ' ').trim();
}
const stop = new Set(('a ad al alla alle allo ai agli che chi come con cosa da dal dalla dei del della delle di e ed gli ha hai ho i il in io la le lo ma mi nel nella non o per pero piu quale quando se si sono su sul sulla un una uno vorrei devo posso riesco gia ancora fare fatto funziona funzionano funzionante funzionanti problema problemi errore errori cambiare cambio richiedere richiesta voglio serve aiutami puoi provato primo secondo terzo punto questo questa quello quella entrambi stesso stessa adesso poi continua ok si no grazie ciao buongiorno buonasera salve').split(' '));
const synonyms = [
  ['stampante', 'stampare', 'stampa', 'stampe'], ['monitor', 'schermo', 'display'],
  ['lento', 'lenta', 'lentissimo', 'lentissima', 'rallenta', 'rallentamenti'],
  ['mail', 'email', 'posta'], ['password', 'credenziali'], ['pc', 'computer', 'portatile'],
  ['scansione', 'scansionare', 'scanner'], ['masterizzare', 'masterizzazione', 'masterizza'],
  ['esportare', 'esportazione', 'esporto'], ['inviare', 'invio', 'invia', 'mandare'],
  ['collegare', 'collegamento', 'connessione', 'connettere', 'connette', 'collega', 'comunica'],
  ['cartella', 'cartelle'], ['panoramico', 'panoramica', 'ortopanoramico'],
  ['tac', 'cbct'], ['bloccato', 'bloccata', 'blocco'], ['dimenticato', 'dimenticata', 'reset', 'reimpostare']
];
const canonical = new Map(synonyms.flatMap(group => group.map(word => [word, group[0]])));
function tokens(text) {
  return [...new Set(normalize(text).split(' ').filter(w => w.length > 1 && !stop.has(w))
    .map(w => canonical.get(w) || w))];
}
const products = ['nnt', 'sidexis', 'vixwin', 'oris', 'outlook', 'teams', 'onedrive', 'sharepoint', 'wetransfer'];
function productNames(text) { const words = normalize(text).split(' '); return products.filter(p => words.includes(p)); }

export function htmlToText(html) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rarr: '→', bull: '•', agrave: 'à', egrave: 'è', eacute: 'é', igrave: 'ì', ograve: 'ò', ugrave: 'ù' };
  return String(html).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<li\b[^>]*>/gi, '\n- ').replace(/<\/(?:p|h[1-6]|li|tr|div|ol|ul)>|<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:td|th)>/gi, ' | ').replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, key) => {
      if (key.startsWith('#')) { const n = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1)); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''; }
      return entities[key.toLowerCase()] ?? whole;
    }).replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
}
const documents = knowledgeBase.articoli.map(article => {
  const text = htmlToText(article.corpo);
  const fields = [tokens(article.titolo), tokens(article.tag.join(' ')), tokens(article.sommario), tokens(text)];
  return { article, text, fields, all: new Set(fields.flat()), products: productNames(article.titolo + ' ' + article.tag.join(' ')) };
});
const frequencies = new Map();
for (const doc of documents) for (const term of doc.all) frequencies.set(term, (frequencies.get(term) || 0) + 1);
function weight(term) { return 1 + Math.log(1 + documents.length / (1 + (frequencies.get(term) || 0))); }

export function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-10).map(m => ({ role: m.role, content: m.content.trim().slice(0, 4000) }));
}

function isContinuation(message, priorQuery) {
  const currentProducts = productNames(message);
  const priorProducts = productNames(priorQuery);
  if (currentProducts.length && priorProducts.length && !currentProducts.some(p => priorProducts.includes(p))) return false;
  const text = normalize(message);
  const reference = /\b(questo|questa|quello|quella|primo|secondo|terzo|punto|entrambi|continua)\b/.test(text)
    || /\b(ho gia|gia provato|ho provato|non funziona ancora|e adesso|e poi|fatto|mi compare|mi dice)\b/.test(text)
    || /^(si|no|ok|non funziona|non va|ancora niente|e acceso|e collegato)$/.test(text);
  const specification = currentProducts.length > 0 && priorProducts.length === 0 && tokens(message).length <= 2;
  return reference || specification;
}

export function resolveQuery(message, history = []) {
  // Ricostruisce solo l'argomento attivo, evitando di trascinare problemi chiusi
  // nei successivi follow-up. Non dipende dal numero di parole della domanda.
  let priorQuery = '';
  let historyStart = 0;
  history.forEach((entry, i) => {
    if (entry.role !== 'user') return;
    if (/^(grazie|grazie mille|ok grazie|ciao)$/.test(normalize(entry.content))) return;
    if (priorQuery && isContinuation(entry.content, priorQuery)) priorQuery += ' ' + entry.content;
    else { priorQuery = entry.content; historyStart = i; }
  });
  const followUp = Boolean(priorQuery && isContinuation(message, priorQuery));
  return { query: followUp ? priorQuery + ' ' + message : message, followUp, historyStart };
}

export function retrieve(message, history = []) {
  const plain = normalize(message);
  if (/^(ciao|salve|buongiorno|buonasera|grazie|grazie mille|ok grazie|perfetto grazie|tutto risolto|risolto)[ !.]*$/.test(plain)) {
    return { kind: 'social', query: message, followUp: false, guides: [] };
  }
  const resolved = resolveQuery(message, history);
  const terms = tokens(resolved.query);
  if (!terms.length || terms.every(t => ['va', 'funzionare', 'aiuto'].includes(t))) {
    return { ...resolved, kind: 'clarify', guides: [] };
  }
  const namedProducts = productNames(resolved.query);
  const ranked = documents.map(doc => {
    if (namedProducts.length && !namedProducts.some(p => doc.products.includes(p))) return { doc, score: 0, coverage: 0 };
    let score = 0, matched = 0;
    for (const term of terms) {
      if (doc.all.has(term)) matched++;
      doc.fields.forEach((field, i) => { if (field.includes(term)) score += [6, 5, 2, 0.5][i] * weight(term); });
    }
    const coverage = matched / terms.length;
    // Richiede una copertura reale della domanda, non soltanto un verbo comune.
    if (coverage < 0.5) score = 0;
    return { doc, score: score * coverage, coverage };
  }).filter(r => r.score >= 2).sort((a, b) => b.score - a.score || b.doc.article.aggiornato.localeCompare(a.doc.article.aggiornato));
  if (!ranked.length) return { ...resolved, kind: 'no_match', guides: [] };
  const best = ranked[0].score;
  const chosen = ranked.filter(r => r.score >= best * 0.65).slice(0, 3);
  const guides = chosen.map(({ doc }) => ({
    id: doc.article.id, titolo: doc.article.titolo,
    categoria: knowledgeBase.categorie.find(c => c.id === doc.article.categoria)?.nome || '',
    sommario: doc.article.sommario,
    ...selectContent(doc.article.corpo, terms),
  }));
  return { ...resolved, kind: 'grounded', guides };
}

function selectContent(html, terms) {
  const full = htmlToText(html);
  // Le guide attuali vengono fornite complete. Per guide future molto lunghe
  // si scelgono sezioni intere, conservandone l'ordine e segnalando l'estratto.
  if (full.length <= 14000) return { contenuto: full, estratto: false };
  const sections = String(html).split(/(?=<h2\b)/i).map(htmlToText).filter(Boolean);
  const ranked = sections.map((text, i) => ({ text, i, score: tokens(text).filter(t => terms.includes(t)).reduce((n, t) => n + weight(t), 0) }))
    .sort((a, b) => b.score - a.score);
  const selected = [];
  let size = 0;
  for (const section of ranked) {
    if (size + section.text.length <= 14000 && (section.score > 0 || section.i === 0)) { selected.push(section); size += section.text.length; }
  }
  // Non troncare in silenzio una procedura monolitica troppo lunga.
  return { contenuto: selected.sort((a, b) => a.i - b.i).map(s => s.text).join('\n\n') || 'La sezione completa supera il limite: invita ad aprire la guida prima di seguire la procedura.', estratto: true };
}
