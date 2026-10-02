/* ============================================================
   Supporto IT - ADCO HUB
   Accesso con Microsoft, passo 2: Microsoft rimanda qui il
   collega con un codice monouso. Il server lo scambia con
   Microsoft, controlla l'id_token (app, tenant ammesso,
   emittente, scadenza, nonce) e apre la stessa sessione di
   8 ore del login con password. Con il ruolo "IT" apre anche
   l'area IT. Pubblico nel middleware.
   ============================================================ */

import { COOKIE_MS, configMicrosoft, indirizzoRitorno, leggiRichiesta, leggiToken, scambiaCodice, uguali, valoreSessioneSito, verificaToken } from '../../lib/microsoft.js';
import { COOKIE_IT, DURATA_IT_ORE, configVerificaIT, creaValoreIT, leggiCookie } from '../../lib/area-it.js';

const CANCELLA_RICHIESTA = `${COOKIE_MS}=; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

function errore(response, motivo) {
  response.setHeader('Set-Cookie', [CANCELLA_RICHIESTA]);
  response.status(302).setHeader('Location', '/login.html?errore=' + motivo);
  return response.end();
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  const config = configMicrosoft();
  if (!config) return errore(response, 'config');

  const q = request.query || {};
  const richiesta = await leggiRichiesta(leggiCookie(request.headers?.cookie, COOKIE_MS), config);
  // Lo state deve essere quello generato al passo 1 per questo browser: blocca le
  // richieste falsificate e i rimandi da pagine di terzi.
  if (!richiesta || typeof q.state !== 'string' || !uguali(q.state, richiesta.state)) return errore(response, 'scaduto');
  if (q.error || typeof q.code !== 'string') return errore(response, 'microsoft');

  let idToken = null;
  try {
    idToken = await scambiaCodice(config, { codice: q.code, verifier: richiesta.verifier, ritorno: indirizzoRitorno(request) });
  } catch {
    console.error('Accesso Microsoft: Microsoft non raggiungibile');
  }
  const esito = verificaToken(leggiToken(idToken), config, richiesta.nonce);
  if (esito.errore) return errore(response, esito.errore);

  const cookie = [
    CANCELLA_RICHIESTA,
    `sit_acc=${await valoreSessioneSito(config.segreto)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${8 * 3600}`,
  ];
  if (esito.utente.it) {
    cookie.push(`${COOKIE_IT}=${await creaValoreIT(configVerificaIT())}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURATA_IT_ORE * 3600}`);
  }
  response.setHeader('Set-Cookie', cookie);

  // Pagina-ponte invece di un rimando 302: la navigazione è partita dal sito di
  // Microsoft, e i browser non invierebbero il cookie IT (SameSite=Strict) nel primo
  // caricamento. Ripartendo da questa pagina, la destinazione riceve entrambi i cookie.
  const destinazione = JSON.stringify(richiesta.da).replace(/</g, '\\u003c');
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  return response.status(200).end(
    `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Accesso in corso</title></head>` +
    `<body><p>Accesso effettuato. <a id="vai" href="/index.html">Continua</a></p>` +
    `<script>var d=${destinazione};document.getElementById("vai").href=d;location.replace(d);</script></body></html>`
  );
}
