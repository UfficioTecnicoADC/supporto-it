// Seconda porta d'ingresso, riservata all'ufficio IT (statistiche di Helpo).
// Si entra solo dopo il login del sito, con una password diversa (ADMIN_PASSWORD).
// Il cookie contiene una scadenza firmata con SITO_SEGRETO; la firma include anche la
// password IT, così cambiandola si chiudono subito tutte le sessioni IT aperte.
// La stessa verifica è ripetuta in middleware.js: le due versioni devono coincidere.

export const COOKIE_IT = 'sit_it';
export const DURATA_IT_ORE = 2;

export function configIT() {
  const password = process.env.ADMIN_PASSWORD;
  const segreto = process.env.SITO_SEGRETO;
  return password && segreto ? { password, segreto } : null;
}

async function firma(testo, segreto) {
  const codificatore = new TextEncoder();
  const chiave = await crypto.subtle.importKey('raw', codificatore.encode(segreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const byte = new Uint8Array(await crypto.subtle.sign('HMAC', chiave, codificatore.encode(testo)));
  return Array.from(byte, b => b.toString(16).padStart(2, '0')).join('');
}

const messaggio = (scadenza, password) => `area-it:${password}:${scadenza}`;

export function confrontoCostante(a, b) {
  const x = String(a ?? ''), y = String(b ?? '');
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return diff === 0;
}

export async function creaValoreIT(config = configIT(), adesso = Date.now()) {
  const scadenza = String(adesso + DURATA_IT_ORE * 3600 * 1000);
  return `${scadenza}.${await firma(messaggio(scadenza, config.password), config.segreto)}`;
}

export async function valoreITValido(valore, config = configIT(), adesso = Date.now()) {
  if (!config || typeof valore !== 'string') return false;
  const punto = valore.indexOf('.');
  const scadenza = valore.slice(0, punto);
  if (punto < 1 || !/^\d+$/.test(scadenza) || adesso > Number(scadenza)) return false;
  return confrontoCostante(valore.slice(punto + 1), await firma(messaggio(scadenza, config.password), config.segreto));
}

export function leggiCookie(intestazione, nome) {
  for (const parte of String(intestazione || '').split(';')) {
    const eq = parte.indexOf('=');
    if (eq > 0 && parte.slice(0, eq).trim() === nome) return parte.slice(eq + 1).trim();
  }
  return null;
}

export async function richiestaIT(req) {
  const intestazione = typeof req.headers?.get === 'function' ? req.headers.get('cookie') : req.headers?.cookie;
  return valoreITValido(leggiCookie(intestazione, COOKIE_IT));
}
