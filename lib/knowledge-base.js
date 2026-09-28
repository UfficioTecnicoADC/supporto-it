import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

// Adapter temporaneo: esegue esclusivamente il file fidato del repository,
// mai codice o documenti ricevuti dal client. Sostituibile con un database.
const source = readFileSync(join(process.cwd(), 'assets/js/data.js'), 'utf8');
export const knowledgeBase = JSON.parse(JSON.stringify(runInNewContext(`${source}\n;KB`, {}, { timeout: 1000 })));
