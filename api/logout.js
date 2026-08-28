/* ============================================================
   Supporto IT - ADCO HUB
   Chiusura della sessione: cancella il cookie e riporta al login.
   ============================================================ */

const COOKIE = 'sit_acc';

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Set-Cookie', [
    COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  ]);
  response.status(302).setHeader('Location', '/login.html?uscita=1');
  response.end();
}
