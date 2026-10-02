/* ============================================================
   Supporto IT - ADCO HUB
   Accesso con Microsoft, passo 1: manda il collega alla pagina
   di login di Microsoft. Pubblico nel middleware.
   Dettagli e controlli in lib/microsoft.js.
   ============================================================ */

import { avviaAccesso, configMicrosoft, indirizzoRitorno } from '../../lib/microsoft.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  const config = configMicrosoft();
  if (!config) {
    response.status(302).setHeader('Location', '/login.html?errore=config');
    return response.end();
  }
  const { url, cookie } = await avviaAccesso(config, { ritorno: indirizzoRitorno(request), da: request.query?.da });
  response.setHeader('Set-Cookie', [cookie]);
  response.status(302).setHeader('Location', url);
  return response.end();
}
