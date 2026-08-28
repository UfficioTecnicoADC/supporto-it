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

   ============================================================ */

import { next } from '@vercel/functions';

/* Risorse raggiungibili senza autenticazione: la pagina di accesso
   e ciò che le serve per mostrarsi correttamente. */
const PUBBLICHE = new Set([
  '/login.html',
  '/api/login',
  '/api/logout',
  '/assets/css/style.css',
  '/favicon.ico',
  '/robots.txt'
]);

const COOKIE = 'sit_acc';

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

async function sessioneValida(valore, segreto) {
  if (!valore || !segreto) return false;
  const punto = valore.indexOf('.');
  if (punto < 1) return false;
  const scadenza = valore.substring(0, punto);
  const firmaRicevuta = valore.substring(punto + 1);
  if (!/^\d+$/.test(scadenza)) return false;
  if (Date.now() > Number(scadenza)) return false;
  const attesa = await firma(scadenza, segreto);
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
     lasciare il sito aperto senza che nessuno se ne accorga. */
  if (!segreto || !process.env.SITO_PASSWORD) {
    return new Response(
      'Accesso non configurato. Imposta le variabili SITO_PASSWORD e SITO_SEGRETO nelle impostazioni del progetto Vercel.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }

  const valido = await sessioneValida(leggiCookie(request.headers.get('cookie'), COOKIE), segreto);
  if (valido) return next();

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
