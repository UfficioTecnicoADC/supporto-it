// Accesso con l'account Microsoft 365 (Microsoft Entra ID, OpenID Connect).
//
// Flusso "authorization code" con PKCE, senza librerie esterne:
//   1. /api/auth/microsoft  prepara state, nonce e verifier, li salva in un cookie
//      firmato di 10 minuti e manda il collega alla pagina di login di Microsoft;
//   2. Microsoft lo rimanda su /api/auth/callback con un codice monouso;
//   3. il server scambia il codice con Microsoft (chiamata diretta, con il segreto
//      dell'app) e controlla l'id_token: app giusta, tenant ammesso, emittente,
//      scadenza e nonce. La password non passa mai dal nostro sito.
//
// L'id_token arriva direttamente dall'endpoint di Microsoft su HTTPS, autenticandosi
// con il segreto dell'app: in questo caso OpenID Connect consente di affidarsi a TLS
// invece di verificare la firma del token (OpenID Connect Core 1.0, § 3.1.3.7).
//
// Variabili su Vercel:
//   MS_CLIENT_ID      ID applicazione (client) della registrazione in Entra ID
//   MS_CLIENT_SECRET  segreto dell'app (valore, non l'ID del segreto)
//   MS_TENANT_IDS     ID dei tenant ammessi, separati da virgola (le 6 società del gruppo)
//   MS_RUOLO_IT       facoltativa: valore del ruolo dell'app che apre l'area IT (predefinito "IT")

export const COOKIE_MS = 'sit_ms';
const DURATA_RICHIESTA_S = 600;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let ultimoAvvisoTenant = '';

export function configMicrosoft(env = process.env) {
  const voci = String(env.MS_TENANT_IDS || '').split(/[\s,;]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
  const tenants = voci.filter(t => GUID.test(t));
  // Un ID scritto male verrebbe scartato in silenzio e i colleghi di quella società
  // rifiutati senza motivo evidente: lo si segnala nel log di Vercel, una volta per
  // istanza e solo con i conteggi, senza riportare gli ID.
  const scartati = voci.length - tenants.length;
  if (scartati && ultimoAvvisoTenant !== `${voci.length}/${tenants.length}`) {
    ultimoAvvisoTenant = `${voci.length}/${tenants.length}`;
    console.warn(`Accesso Microsoft: MS_TENANT_IDS contiene ${scartati} valori non validi, ignorati (${voci.length} inseriti, ${tenants.length} validi). Controlla il formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.`);
  }
  if (!env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET || !tenants.length || !env.SITO_SEGRETO) return null;
  return {
    clientId: env.MS_CLIENT_ID.trim(),
    clientSecret: env.MS_CLIENT_SECRET,
    tenants,
    segreto: env.SITO_SEGRETO,
    ruoloIT: (env.MS_RUOLO_IT || 'IT').trim(),
    // Un solo tenant: endpoint di quel tenant. Più tenant: "organizations", poi il controllo
    // sull'elenco dei tenant ammessi esclude qualsiasi altra azienda.
    authority: tenants.length === 1 ? tenants[0] : 'organizations',
  };
}

const b64url = byte => Buffer.from(byte).toString('base64url');
const casuale = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

async function hmac(testo, segreto) {
  const codificatore = new TextEncoder();
  const chiave = await crypto.subtle.importKey('raw', codificatore.encode(segreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', chiave, codificatore.encode(testo))), b => b.toString(16).padStart(2, '0')).join('');
}

export function uguali(a, b) {
  const x = String(a ?? ''), y = String(b ?? '');
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return diff === 0;
}

// Solo percorsi interni al sito: niente rimandi verso altri domini dopo il login.
export function destinazioneSicura(da) {
  const valore = String(da || '');
  return valore.startsWith('/') && !valore.startsWith('//') && !valore.startsWith('/\\') && !/[\r\n]/.test(valore) ? valore : '/index.html';
}

export function indirizzoRitorno(req) {
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').split(',')[0].trim();
  const locale = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return `${locale ? 'http' : 'https'}://${host}/api/auth/callback`;
}

// Passo 1: indirizzo della pagina di login di Microsoft e cookie con i dati della richiesta.
export async function avviaAccesso(config, { ritorno, da, adesso = Date.now() }) {
  const richiesta = { state: casuale(), nonce: casuale(), verifier: casuale(), da: destinazioneSicura(da), scade: adesso + DURATA_RICHIESTA_S * 1000 };
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(richiesta.verifier)));
  const url = new URL(`https://login.microsoftonline.com/${config.authority}/oauth2/v2.0/authorize`);
  url.search = new URLSearchParams({
    client_id: config.clientId, response_type: 'code', response_mode: 'query', redirect_uri: ritorno,
    scope: 'openid profile email', state: richiesta.state, nonce: richiesta.nonce,
    code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account',
  }).toString();
  const dati = b64url(Buffer.from(JSON.stringify(richiesta)));
  const cookie = `${COOKIE_MS}=${dati}.${await hmac('ms:' + dati, config.segreto)}; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=${DURATA_RICHIESTA_S}`;
  return { url: url.toString(), cookie };
}

export async function leggiRichiesta(valore, config, adesso = Date.now()) {
  const [dati, firma] = String(valore || '').split('.');
  if (!dati || !firma || !uguali(firma, await hmac('ms:' + dati, config.segreto))) return null;
  try {
    const richiesta = JSON.parse(Buffer.from(dati, 'base64url').toString('utf8'));
    return adesso <= richiesta.scade ? richiesta : null;
  } catch { return null; }
}

export function leggiToken(idToken) {
  try { return JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8')); } catch { return null; }
}

// Passo 3: controlli sull'id_token. Restituisce i dati dell'utente o il motivo del rifiuto.
export function verificaToken(claims, config, nonce, adessoS = Math.floor(Date.now() / 1000)) {
  if (!claims) return { errore: 'microsoft' };
  const tid = String(claims.tid || '').toLowerCase();
  if (!config.tenants.includes(tid)) return { errore: 'tenant' };
  if (claims.aud !== config.clientId) return { errore: 'microsoft' };
  if (claims.iss !== `https://login.microsoftonline.com/${tid}/v2.0`) return { errore: 'microsoft' };
  if (!(claims.exp > adessoS) || (claims.nbf && claims.nbf > adessoS + 300)) return { errore: 'microsoft' };
  if (!uguali(claims.nonce, nonce)) return { errore: 'microsoft' };
  const ruoli = Array.isArray(claims.roles) ? claims.roles : [];
  return { utente: { tenant: tid, oid: claims.oid, nome: claims.name, it: ruoli.includes(config.ruoloIT) } };
}

// Passo 3: scambio del codice con Microsoft.
export async function scambiaCodice(config, { codice, verifier, ritorno }) {
  const risposta = await fetch(`https://login.microsoftonline.com/${config.authority}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId, client_secret: config.clientSecret, grant_type: 'authorization_code',
      code: codice, redirect_uri: ritorno, code_verifier: verifier, scope: 'openid profile email',
    }).toString(),
    signal: AbortSignal.timeout(10000),
  });
  if (!risposta.ok) {
    let dettaglio = null;
    try { dettaglio = await risposta.json(); } catch { /* corpo non JSON */ }
    // Nel log solo il codice d'errore di Microsoft, mai il codice di accesso o i token.
    console.error('Accesso Microsoft: scambio del codice rifiutato', { status: risposta.status, errore: String(dettaglio?.error || '').slice(0, 60) });
    return null;
  }
  const dati = await risposta.json();
  return typeof dati.id_token === 'string' ? dati.id_token : null;
}

// Stessa sessione del login con password (vedi api/login.js e middleware.js): 8 ore.
export async function valoreSessioneSito(segreto, adesso = Date.now()) {
  const scadenza = String(adesso + 8 * 3600 * 1000);
  return `${scadenza}.${await hmac(scadenza, segreto)}`;
}
