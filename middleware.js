/* ============================================================
   Supporto IT - ADCO HUB
   Middleware di Vercel: controllo di accesso lato server.

   Ogni richiesta passa da qui PRIMA che venga servito qualsiasi
   file. Senza un cookie di sessione valido il visitatore viene
   portato alla pagina di accesso e non riceve nulla del sito:
   né HTML, né i contenuti in assets/js.

   Le credenziali NON stanno in questo repository: vivono nelle
   Environment Variables del progetto Vercel.

     SITO_UTENTE     nome utente (se assente vale "ADC")
     SITO_PASSWORD   password di accesso
     SITO_SEGRETO    stringa casuale lunga, usata per firmare
                     il cookie di sessione
     ADMIN_PASSWORD  password dell'area IT (statistiche di Helpo):
                     senza questa variabile l'area IT resta chiusa

   ============================================================ */

import { next } from '@vercel/functions';

/* Runtime Node.js: il runtime "edge", predefinito per middleware.js,
   è deprecato da Vercel. Il codice usa solo API disponibili in entrambi
   (Request, Response, crypto.subtle, process.env). */
export const config = { runtime: 'nodejs' };

/* Risorse raggiungibili senza autenticazione: la pagina di accesso
   e ciò che le serve per mostrarsi correttamente. */
const PUBBLICHE = new Set([
  '/login.html',
  '/api/login',
  '/api/logout',
  '/api/auth/microsoft',
  '/api/auth/callback',
  '/assets/css/style.css',
  '/favicon.ico',
  '/robots.txt'
]);

const COOKIE = 'sit_acc';

/* Area IT: serve anche il secondo login (ADMIN_PASSWORD oppure il ruolo
   Microsoft "IT" all'accesso con Microsoft; cookie sit_it).
   Protegge la pagina delle statistiche e la loro lettura; il voto 👍/👎
   (POST /api/feedback) resta aperto a tutti i colleghi collegati.
   La firma è la stessa di lib/area-it.js: le due versioni devono coincidere. */
const COOKIE_IT = 'sit_it';
const AREA_IT = new Set(['/statistiche.html', '/statistiche']);

function richiedeAreaIT(percorso, metodo) {
  return AREA_IT.has(percorso) || (percorso === '/api/feedback' && metodo === 'GET');
}

function leggiCookie(intestazione, nome) {
  if (!intestazione) return null;
  const parti = intestazione.split(';');
  for (let i = 0; i < parti.length; i++) {
    const p = parti[i].trim();
    const eq = p.indexOf('=');
    if (eq > 0 && p.substring(0, eq) === nome) return p.substring(eq + 1);
  }
  return null;
}

async function firma(testo, segreto) {
  const codificatore = new TextEncoder();
  const chiave = await crypto.subtle.importKey(
    'raw',
    codificatore.encode(segreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const buffer = await crypto.subtle.sign('HMAC', chiave, codificatore.encode(testo));
  const byte = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < byte.length; i++) out += ('0' + byte[i].toString(16)).slice(-2);
  return out;
}

/* prefisso: vuoto per il cookie del sito, "area-it:<password>:" per quello IT,
   così un cookie non può essere usato al posto dell'altro. */
async function sessioneValida(valore, segreto, prefisso = '') {
  if (!valore || !segreto) return false;
  const punto = valore.indexOf('.');
  if (punto < 1) return false;
  const scadenza = valore.substring(0, punto);
  const firmaRicevuta = valore.substring(punto + 1);
  if (!/^\d+$/.test(scadenza)) return false;
  if (Date.now() > Number(scadenza)) return false;
  const attesa = await firma(prefisso + scadenza, segreto);
  if (attesa.length !== firmaRicevuta.length) return false;
  let diff = 0;
  for (let i = 0; i < attesa.length; i++) {
    diff |= attesa.charCodeAt(i) ^ firmaRicevuta.charCodeAt(i);
  }
  return diff === 0;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const percorso = url.pathname;

  if (PUBBLICHE.has(percorso)) return next();

  const segreto = process.env.SITO_SEGRETO;

  /* Se il progetto non è configurato, meglio bloccare tutto che
     lasciare il sito aperto senza che nessuno se ne accorga.
     Serve SITO_SEGRETO e almeno un modo di entrare: la password
     condivisa (SITO_PASSWORD) o l'accesso Microsoft (MS_CLIENT_ID). */
  if (!segreto || (!process.env.SITO_PASSWORD && !process.env.MS_CLIENT_ID)) {
    return new Response(
      'Accesso non configurato. Imposta SITO_SEGRETO e SITO_PASSWORD (o le variabili MS_ dell\'accesso Microsoft) nelle impostazioni del progetto Vercel.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }

  const cookie = request.headers.get('cookie');
  const valido = await sessioneValida(leggiCookie(cookie, COOKIE), segreto);
  if (valido) {
    if (!richiedeAreaIT(percorso, request.method)) return next();
    /* Senza ADMIN_PASSWORD la firma usa una password vuota: il cookie IT si ottiene
       comunque solo dal ruolo Microsoft "IT" e non si può falsificare senza SITO_SEGRETO. */
    const passwordIT = process.env.ADMIN_PASSWORD || '';
    const validoIT = await sessioneValida(leggiCookie(cookie, COOKIE_IT), segreto, 'area-it:' + passwordIT + ':');
    if (validoIT) return next();
    if (percorso.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Area riservata all’ufficio IT.', code: 'IT_REQUIRED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }
    const accessoIT = new URL('/login-it.html', url.origin);
    accessoIT.searchParams.set('da', percorso + url.search);
    return new Response(null, { status: 302, headers: { Location: accessoIT.toString(), 'Cache-Control': 'no-store' } });
  }

  if (percorso.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Sessione scaduta.', code: 'SESSION_EXPIRED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  const destinazione = new URL('/login.html', url.origin);
  if (percorso !== '/' && percorso !== '/index.html') {
    destinazione.searchParams.set('da', percorso + url.search);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: destinazione.toString(),
      'Cache-Control': 'no-store'
    }
  });
}
