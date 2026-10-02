/* ============================================================
   Supporto IT - ADCO HUB
   Accesso all'area IT (statistiche di Helpo).

   Raggiungibile solo dopo il login del sito: il middleware lo
   protegge come ogni altra funzione in /api/. Confronta la
   password con ADMIN_PASSWORD e rilascia il cookie sit_it,
   valido 2 ore.
   ============================================================ */

import { COOKIE_IT, DURATA_IT_ORE, configIT, confrontoCostante, creaValoreIT } from '../lib/area-it.js';

const pausa = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, errore: 'Metodo non consentito' });
  }
  const config = configIT();
  if (!config) {
    return response.status(503).json({ ok: false, errore: 'Area IT non configurata: manca la variabile ADMIN_PASSWORD su Vercel.' });
  }

  let corpo = request.body;
  if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }
  const password = String(corpo?.password || '');

  /* Come per il login del sito: rallenta i tentativi e uniforma i tempi */
  await pausa(400);

  if (!confrontoCostante(password, config.password)) {
    return response.status(401).json({ ok: false, errore: 'Password dell’area IT non corretta.' });
  }
  response.setHeader('Set-Cookie', [
    `${COOKIE_IT}=${await creaValoreIT(config)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURATA_IT_ORE * 3600}`
  ]);
  return response.status(200).json({ ok: true });
}
