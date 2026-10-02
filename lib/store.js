// Archivio del feedback di Helpo: Upstash Redis tramite la sua API REST.
// Nessuna libreria esterna: bastano fetch e le variabili che l'integrazione
// del Marketplace di Vercel aggiunge al progetto (con l'uno o l'altro nome).

export function storeConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

// Esegue più comandi in una sola richiesta (pipeline). Restituisce i risultati
// nell'ordine dei comandi; un errore su un comando fa fallire tutta la chiamata.
export async function redis(commands) {
  const config = storeConfig();
  if (!config) throw new Error('STORE_UNAVAILABLE');
  const response = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error(`STORE_HTTP_${response.status}`);
  const results = await response.json();
  return results.map(item => {
    if (item?.error) throw new Error('STORE_COMMAND');
    return item?.result;
  });
}

// Mese corrente all'ora italiana, es. "2026-09": i contatori sono divisi per mese.
export function monthKey(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit' }).format(date);
}

export const keys = {
  votes: month => `helpo:voti:${month}`,
  comments: month => `helpo:commenti:${month}`,
};
