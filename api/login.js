/* ============================================================
   Supporto IT - ADCO HUB
   Verifica delle credenziali (funzione serverless su Vercel).

   Riceve utente e password in POST, li confronta con le
   Environment Variables del progetto e, se corrispondono, rilascia
   un cookie di sessione firmato che il middleware riconosce.

   Variabili usate:
     SITO_UTENTE     nome utente (se assente vale "ADC")
     SITO_PASSWORD   password di accesso
     SITO_SEGRETO    stringa casuale usata per firmare il cookie
   ============================================================ */

const COOKIE = 'sit_acc';
const DURATA_ORE = 8;

function pausa(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

function confrontoCostante(a, b) {
  const x = String(a == null ? '' : a);
  const y = String(b == null ? '' : b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) {
    diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  }
  return diff === 0;
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

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, errore: 'Metodo non consentito' });
    return;
  }

  const utenteAtteso = process.env.SITO_UTENTE || 'ADC';
  const passwordAttesa = process.env.SITO_PASSWORD;
  const segreto = process.env.SITO_SEGRETO;

  if (!passwordAttesa || !segreto) {
    response.status(503).json({
      ok: false,
      errore: 'Accesso non configurato: mancano le variabili SITO_PASSWORD e SITO_SEGRETO.'
    });
    return;
  }

  let corpo = request.body;
  if (typeof corpo === 'string') {
    try { corpo = JSON.parse(corpo); } catch (e) { corpo = {}; }
  }
  if (!corpo || typeof corpo !== 'object') corpo = {};

  const utente = String(corpo.utente || '').trim();
  const password = String(corpo.password || '');

  /* Rallenta i tentativi automatici e uniforma i tempi di risposta */
  await pausa(400);

  const utenteOk = confrontoCostante(utente.toLowerCase(), String(utenteAtteso).toLowerCase());
  const passwordOk = confrontoCostante(password, passwordAttesa);

  if (!utenteOk || !passwordOk) {
    response.status(401).json({ ok: false, errore: 'Nome utente o password non corretti.' });
    return;
  }

  const scadenza = String(Date.now() + DURATA_ORE * 3600 * 1000);
  const valore = scadenza + '.' + (await firma(scadenza, segreto));

  response.setHeader('Set-Cookie', [
    COOKIE + '=' + valore +
    '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + DURATA_ORE * 3600
  ]);
  response.status(200).json({ ok: true });
}
