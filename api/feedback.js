import { knowledgeBase } from '../lib/knowledge-base.js';
import { keys, monthKey, redis, storeConfig } from '../lib/store.js';
import { richiestaIT } from '../lib/area-it.js';

// Feedback su Helpo. Si salvano solo contatori per guida e per mese e, dopo un 👎,
// un commento facoltativo: niente domanda, niente IP, niente nome.
// POST registra un voto; GET restituisce le statistiche di un mese (?mese=AAAA-MM).

const titles = new Map(knowledgeBase.articoli.map(a => [a.id, a.titolo]));
const COMMENT_MAX = 500;
const COMMENTS_KEPT = 500;
const COMMENT_DAYS = 90;

function reply(res, status, body) { return res.status(status).json(body); }

// Oscura i dati personali più riconoscibili prima del salvataggio. Non può riconoscere
// nomi o descrizioni cliniche: per questo l'interfaccia chiede di non scriverli.
export function oscura(testo) {
  return String(testo)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\bIT\d{2}[A-Z]\d{10}[0-9A-Z]{12}\b/gi, '[iban]')
    .replace(/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi, '[codice fiscale]')
    .replace(/(?<![\w+])(?:\+39[\s.-]?)?[03]\d(?:[\s.-]?\d){6,10}(?!\w)/g, '[telefono]');
}

// I commenti di un mese si cancellano da soli 90 giorni dopo la fine del mese.
function commentsExpireAt(month) {
  const [year, m] = month.split('-').map(Number);
  return Math.floor(Date.UTC(year, m, 1) / 1000) + COMMENT_DAYS * 86400;
}

async function record(req, res) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return reply(res, 400, { error: 'Richiesta non valida.' }); } }
  const vote = body?.voto;
  if (vote !== 'su' && vote !== 'giu') return reply(res, 400, { error: 'Voto non valido.' });
  // Solo id di guide esistenti: il browser non può creare voci arbitrarie nell'archivio.
  const guides = Array.isArray(body.guide) ? [...new Set(body.guide.filter(id => typeof id === 'string' && titles.has(id)))].slice(0, 3) : [];
  const comment = vote === 'giu' && typeof body.commento === 'string' ? oscura(body.commento.trim().slice(0, COMMENT_MAX)).trim() : '';

  const month = monthKey();
  const votes = keys.votes(month);
  const commands = [['HINCRBY', votes, `totale:${vote}`, 1]];
  for (const id of guides) commands.push(['HINCRBY', votes, `guida:${id}:${vote}`, 1]);
  if (!guides.length) commands.push(['HINCRBY', votes, `senza-guida:${vote}`, 1]);
  if (comment) {
    const list = keys.comments(month);
    const entry = JSON.stringify({ data: new Date().toISOString().slice(0, 10), guide: guides, testo: comment });
    commands.push(['LPUSH', list, entry], ['LTRIM', list, 0, COMMENTS_KEPT - 1], ['EXPIREAT', list, commentsExpireAt(month)]);
  }
  await redis(commands);
  return reply(res, 200, { ok: true });
}

async function stats(req, res) {
  const requested = req.query?.mese ?? new URL(req.url || '/', 'http://x').searchParams.get('mese');
  const month = /^\d{4}-\d{2}$/.test(requested || '') ? requested : monthKey();
  const [flat, rawComments] = await redis([['HGETALL', keys.votes(month)], ['LRANGE', keys.comments(month), 0, 199]]);

  const counts = {};
  const pairs = Array.isArray(flat) ? flat : [];
  for (let i = 0; i + 1 < pairs.length; i += 2) counts[pairs[i]] = Number(pairs[i + 1]) || 0;

  const perGuide = new Map();
  for (const [field, n] of Object.entries(counts)) {
    const match = /^guida:(.+):(su|giu)$/.exec(field);
    if (!match || !titles.has(match[1])) continue;   // guide rinominate o eliminate
    const row = perGuide.get(match[1]) || { id: match[1], titolo: titles.get(match[1]), su: 0, giu: 0 };
    row[match[2]] = n;
    perGuide.set(match[1], row);
  }

  const comments = (Array.isArray(rawComments) ? rawComments : []).map(raw => {
    try {
      const c = JSON.parse(raw);
      return {
        data: String(c.data || ''),
        guide: (Array.isArray(c.guide) ? c.guide : []).filter(id => titles.has(id)).map(id => ({ id, titolo: titles.get(id) })),
        testo: String(c.testo || ''),
      };
    } catch { return null; }
  }).filter(Boolean);

  return reply(res, 200, {
    mese: month,
    totale: { su: counts['totale:su'] || 0, giu: counts['totale:giu'] || 0 },
    senzaGuida: { su: counts['senza-guida:su'] || 0, giu: counts['senza-guida:giu'] || 0 },
    domande: { totale: counts['domande:totale'] || 0, senzaGuida: counts['domande:senza-guida'] || 0 },
    guide: [...perGuide.values()].sort((a, b) => b.giu - a.giu || b.su - a.su),
    commenti: comments,
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST' && req.method !== 'GET') { res.setHeader('Allow', 'GET, POST'); return reply(res, 405, { error: 'Metodo non consentito.' }); }
  // Le statistiche sono dell'area IT. Lo controlla già il middleware; il secondo
  // controllo qui evita che un errore di configurazione le renda leggibili a tutti.
  if (req.method === 'GET' && !(await richiestaIT(req))) return reply(res, 401, { error: 'Area riservata all’ufficio IT.', code: 'IT_REQUIRED' });
  if (!storeConfig()) return reply(res, 503, { error: 'Il feedback non è disponibile: l’archivio non è configurato.', code: 'STORE_UNAVAILABLE' });
  try {
    return req.method === 'POST' ? await record(req, res) : await stats(req, res);
  } catch (error) {
    // Come per Helpo: nel log solo il tipo di errore, mai commenti o dati.
    console.error('Helpo feedback error', { type: String(error?.message || 'unknown').slice(0, 40) });
    return reply(res, 502, { error: 'Non riesco a raggiungere l’archivio del feedback. Riprova tra poco.' });
  }
}
