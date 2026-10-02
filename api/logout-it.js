/* ============================================================
   Supporto IT - ADCO HUB
   Uscita dall'area IT: cancella solo il cookie sit_it.
   La sessione del sito resta aperta.
   ============================================================ */

import { COOKIE_IT } from '../lib/area-it.js';

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Set-Cookie', [
    COOKIE_IT + '=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
  ]);
  response.status(302).setHeader('Location', '/index.html');
  response.end();
}
