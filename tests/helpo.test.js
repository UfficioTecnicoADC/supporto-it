import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieve, cleanHistory, htmlToText } from '../lib/retrieval.js';
import handler from '../api/chat.js';

const user = content => ({ role: 'user', content });
const assistant = content => ({ role: 'assistant', content });
const ids = (q, history = []) => retrieve(q, history).guides.map(g => g.id);

test('recupera procedure specifiche e scarta documenti secondari non pertinenti', () => {
  assert.deepEqual(ids('NNT non comunica con il panoramico'), ['problemi-nnt-panoramico']);
  assert.match(retrieve('Il microfono non funziona').guides[0].titolo, /microfono/);
  assert.match(retrieve('Ho dimenticato la password').guides[0].titolo, /Reimpostare/);
  assert.ok(retrieve('Come posso cambiare il toner?').guides.every(g => !/password|MFA/.test(g.titolo)));
});
test('richieste vaghe, sociali e fuori archivio non ricevono guide casuali', () => {
  assert.equal(retrieve('non funziona').kind, 'clarify');
  assert.equal(retrieve('grazie').kind, 'social');
  assert.equal(retrieve('Come posso richiedere le ferie?').kind, 'no_match');
});
test('cambio argomento breve e continuazioni multiple', () => {
  const old = [user('NNT non comunica con il panoramico')];
  assert.match(retrieve('Teams non funziona', old).guides[0].titolo, /Teams/);
  assert.match(retrieve('password dimenticata', old).guides[0].titolo, /password/);
  assert.match(retrieve('Outlook bloccato', old).guides[0].titolo, /Outlook/);
  const history = [...old, user('Teams non funziona'), user('Ho già provato il primo punto')];
  const result = retrieve('E adesso?', history);
  assert.ok(!result.query.includes('NNT'));
  assert.equal(result.historyStart, 1);
  assert.match(result.guides[0].titolo, /Teams/);
  assert.match(retrieve('NNT', [user('Come esporto una TAC?')]).query, /TAC/);
});
test('la replica a una domanda di Helpo resta nello stesso argomento', () => {
  const printer = [user('La stampante non stampa'), assistant('Controlla il display della macchina.\n\nLa stampante è accesa? Che cosa compare sul display?')];
  const reply = retrieve('sì è accesa, la spia lampeggia arancione', printer);
  assert.equal(reply.followUp, true);
  assert.ok(reply.guides.some(g => g.id === 'stampante-non-stampa'));
  // Senza domanda finale la stessa frase resta un argomento nuovo.
  assert.equal(retrieve('sì è accesa, la spia lampeggia arancione', [user('La stampante non stampa'), assistant('Svuota la coda di stampa.')]).followUp, false);
  // Dopo una domanda, un nuovo problema descritto per esteso trova comunque la sua guida.
  assert.equal(retrieve('il monitor esterno non viene rilevato', printer).guides[0].id, 'monitor-non-rilevato');
  assert.match(retrieve('Teams non funziona', printer).guides[0].titolo, /Teams/);
});
test('una parola comune trovata solo nel testo non basta per scegliere una guida', () => {
  // "lavoro" compare nel sommario di "Aggiornamenti Windows", che non c'entra.
  assert.equal(retrieve('a cosa mi serve per il lavoro?').kind, 'no_match');
  assert.deepEqual(cleanHistory([{...assistant('ok'), sources:['pc-lento','guida-fantasma',3]}]), [{...assistant('ok'), sources:['pc-lento']}]);
});
test('archivio coerente: campi, id, categorie, collegamenti, immagini e contatti', async () => {
  // data.js si modifica a mano: questo test ferma gli errori prima della pubblicazione.
  const { knowledgeBase: kb } = await import('../lib/knowledge-base.js');
  const { existsSync } = await import('node:fs');
  const categorie = new Set(kb.categorie.map(c => c.id));
  const visti = new Set();
  for (const a of kb.articoli) {
    const nome = a.id || a.titolo || '(guida senza id)';
    for (const campo of ['id', 'titolo', 'categoria', 'sommario', 'corpo', 'aggiornato']) {
      assert.ok(typeof a[campo] === 'string' && a[campo].trim(), `${nome}: manca il campo "${campo}"`);
    }
    assert.ok(Array.isArray(a.tag) && a.tag.length, `${nome}: servono dei tag`);
    assert.ok(Number.isFinite(a.minuti), `${nome}: "minuti" deve essere un numero`);
    assert.match(a.id, /^[A-Za-z0-9-]+$/, `${nome}: l'id può contenere solo lettere, numeri e trattini`);
    assert.match(a.aggiornato, /^\d{4}-\d{2}-\d{2}$/, `${nome}: "aggiornato" deve essere AAAA-MM-GG`);
    assert.ok(!visti.has(a.id), `id ripetuto: ${a.id}`);
    visti.add(a.id);
    assert.ok(categorie.has(a.categoria), `${nome}: la categoria "${a.categoria}" non esiste`);
  }
  for (const a of kb.articoli) {
    for (const [, id] of a.corpo.matchAll(/articolo\.html\?id=([^"&#]+)/g)) {
      assert.ok(visti.has(id), `${a.id}: collegamento a una guida inesistente (${id})`);
    }
    for (const [, src] of a.corpo.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
      assert.ok(existsSync(src), `${a.id}: immagine mancante (${src})`);
    }
  }
  for (const canale of ['email', 'telefono', 'whatsapp']) assert.ok(kb.contatti?.[canale], `KB.contatti: manca "${canale}"`);
  // Maia: servizio esterno, deve restare un indirizzo https di OrisLine.
  assert.equal(new URL(kb.maia.url).protocol, 'https:', 'KB.maia: l\'indirizzo deve essere https');
  assert.match(new URL(kb.maia.url).hostname, /(^|\.)orisline\.com$/, 'KB.maia: l\'indirizzo deve essere di orisline.com');
  assert.ok(kb.maia.nome && kb.maia.avviso && kb.maia.programmi.length, 'KB.maia: servono nome, avviso e programmi');
});
test('Helpo suggerisce Maia per l’uso di OrisDent senza scriverne l’indirizzo', async () => {
  const { knowledgeBase: kb } = await import('../lib/knowledge-base.js');
  await withEnv({ OPENAI_API_KEY: 'test-only', KV_REST_API_URL: undefined, KV_REST_API_TOKEN: undefined }, async () => {
    let sent, text;
    globalThis.fetch = async (url, options) => { sent = JSON.parse(options.body); return { ok: true, json: async () => ({ status: 'completed', output_text: text }) }; };
    text = 'Per questa funzione del gestionale chiedi a Maia.\nFONTI: Maia';
    const conMaia = await call({ message: 'Come si stampa il piano di cura in OrisDent?' });
    assert.equal(conMaia.statusCode, 200);
    assert.deepEqual(conMaia.body.maia, { nome: kb.maia.nome, url: kb.maia.url, avviso: kb.maia.avviso });
    assert.deepEqual(conMaia.body.sources, []);
    assert.match(sent.instructions, /Maia/);
    assert.match(sent.instructions, /PROBLEMI TECNICI/);
    assert.ok(!sent.instructions.includes(kb.maia.url), 'il modello non deve ricevere l\'indirizzo da copiare');
    text = 'Controlla la guida.\nFONTI: Problemi-ORIS-DENT';
    const senzaMaia = await call({ message: 'ORIS DENT non si apre' });
    assert.equal(senzaMaia.body.maia, undefined);
    assert.deepEqual(senzaMaia.body.sources.map(s => s.id), ['Problemi-ORIS-DENT']);
  });
});
test('guide lunghe complete, markup e cronologia filtrati', () => {
  const result = retrieve('SIDEXIS esportazione TAC WeTransfer');
  const guide = result.guides.find(g => /Esportazione/.test(g.titolo));
  assert.ok(guide.contenuto.length > 5000);
  assert.equal(guide.estratto, false);
  assert.equal(htmlToText('<p>A &amp; B</p><ol><li>Uno</li><li>Due</li></ol>'), 'A & B\n\n- Uno\n\n- Due');
  assert.deepEqual(cleanHistory([{role:'system', content:'bad'}, user('ciao')]), [user('ciao')]);
});
function response() {
  return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.statusCode=n; return this; }, json(v) { this.body=v; return this; } };
}
async function call(body, method = 'POST') { const res=response(); await handler({method,body},res); return res; }

test('API valida input e risponde senza chiamate esterne a saluti e ambiguità', async () => {
  assert.equal((await call({},'GET')).statusCode,405);
  assert.equal((await call('{bad')).statusCode,400);
  assert.equal((await call({message:'a'.repeat(4001)})).statusCode,400);
  assert.equal((await call({message:'non funziona'})).statusCode,200);
  assert.equal((await call({message:'grazie'})).body.sources.length,0);
});
test('API usa fonti ufficiali, nasconde errori e gestisce risposte incomplete', async () => {
  const originalFetch=globalThis.fetch, originalKey=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY='test-only';
  try {
    let sent;
    globalThis.fetch=async (url,options) => { sent=JSON.parse(options.body); return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Risposta di prova'}]}]})}; };
    const old=[user('NNT non comunica con il panoramico'),assistant('Risposta su NNT.'),user('Ho già provato il primo punto'),assistant('Allora controlla il cavo.')];
    const res=await call({message:'Teams non funziona',history:old,articles:[{titolo:'DOCUMENTO FALSO',contenuto:'SEGRETO FALSO'}]});
    assert.equal(res.statusCode,200);
    assert.equal(res.headers['Cache-Control'],'no-store');
    assert.ok(!JSON.stringify(sent).includes('SEGRETO FALSO'));
    // I contatti ufficiali arrivano sempre, anche se nessuna guida li contiene.
    const { knowledgeBase } = await import('../lib/knowledge-base.js');
    assert.ok(sent.instructions.includes(knowledgeBase.contatti.email.valore));
    assert.ok(sent.instructions.includes(knowledgeBase.contatti.whatsapp.valore));
    // Il modello riceve la conversazione recente e decide lui se l'argomento è cambiato;
    // la ricerca delle guide segue invece il nuovo argomento.
    assert.deepEqual(sent.input.slice(0,-1),old);
    assert.ok(res.body.sources.some(s=>/Teams/.test(s.titolo)));
    // Replica a una domanda: il modello riceve tutto l'argomento attivo.
    const printer=[user('La stampante non stampa'),assistant('La stampante è accesa?')];
    await call({message:'sì, la spia lampeggia arancione',history:printer});
    assert.deepEqual(sent.input.slice(0,-1),printer);
    assert.match(sent.input.at(-1).content,/La stampante non stampa/);
    globalThis.fetch=async()=>({ok:false,status:401});
    const bad=await call({message:'Teams non funziona'});
    assert.equal(bad.statusCode,502); assert.equal(bad.body.details,undefined);
    // Il log riporta il codice del fornitore, mai la domanda; l'utente non lo vede.
    const originalError=console.error, logged=[];
    console.error=(...args)=>logged.push(JSON.stringify(args));
    try {
      globalThis.fetch=async()=>({ok:false,status:404,json:async()=>({error:{code:'model_not_found',type:'invalid_request_error',message:'dettagli'}})});
      const missing=await call({message:'Teams non funziona'});
      assert.equal(missing.statusCode,502);
      assert.ok(!JSON.stringify(missing.body).includes('model_not_found'));
      assert.match(logged.join(),/model_not_found/);
      assert.ok(!logged.join().includes('Teams'));
      // Budget superato: messaggio dedicato, non "riprova tra poco".
      for (const budget of ['project_spend_limit_exceeded','organization_spend_limit_exceeded','insufficient_quota']) {
        globalThis.fetch=async()=>({ok:false,status:429,json:async()=>({error:{code:budget,type:'insufficient_quota'}})});
        const over=await call({message:'Teams non funziona'});
        assert.equal(over.statusCode,503);
        assert.equal(over.body.code,'AI_BUDGET');
        assert.match(over.body.error,/budget dell’assistente è stato superato/);
        assert.match(over.body.error,/supporto IT/);
      }
      // Un 429 di semplice sovraccarico resta un invito a riprovare.
      globalThis.fetch=async()=>({ok:false,status:429,json:async()=>({error:{code:'rate_limit_exceeded',type:'requests'}})});
      const busy=await call({message:'Teams non funziona'});
      assert.equal(busy.statusCode,429);
      assert.match(busy.body.error,/momentaneamente occupato/);
    } finally { console.error=originalError; }
    globalThis.fetch=async()=>({ok:true,json:async()=>({status:'incomplete',output_text:'Tagliato'})});
    assert.equal((await call({message:'Teams non funziona'})).statusCode,502);
    delete process.env.OPENAI_API_KEY;
    assert.equal((await call({message:'Teams non funziona'})).statusCode,503);
  } finally { globalThis.fetch=originalFetch; if(originalKey===undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=originalKey; }
});
test('API: conferme brevi, guide della risposta precedente e fonti citate', async () => {
  const originalFetch=globalThis.fetch, originalKey=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY='test-only';
  let sent, text;
  globalThis.fetch=async (url,options) => { sent=JSON.parse(options.body); return {ok:true,json:async()=>({status:'completed',output_text:text})}; };
  try {
    const slow=[user('Il PC è lento, cosa posso fare?'),{...assistant('Riavvia il PC e controlla Gestione attività.'),sources:['pc-lento','guida-fantasma']}];
    text='Sì, sono le verifiche della guida.\n\nFONTI: pc-lento';
    const res=await call({message:'sicuro?',history:slow});
    // "sicuro" richiama "Condividere file in modo sicuro", ma torna anche la guida della risposta precedente.
    assert.match(sent.input.at(-1).content,/"id":"pc-lento"/);
    assert.ok(!JSON.stringify(sent.input).includes('guida-fantasma'));
    assert.deepEqual(sent.input.slice(0,-1),slow.map(m=>({role:m.role,content:m.content})));
    // Si mostrano solo le guide citate e la riga FONTI non arriva all'utente.
    assert.equal(res.body.answer,'Sì, sono le verifiche della guida.');
    assert.deepEqual(res.body.sources.map(s=>s.id),['pc-lento']);
    text='WhatsApp è un’app di messaggistica.\n**FONTI:** nessuna';
    const general=await call({message:'voglio sapere in generale come funziona',history:slow});
    assert.equal(general.body.answer,'WhatsApp è un’app di messaggistica.');
    assert.deepEqual(general.body.sources,[]);
    // Un id inventato dal modello non diventa un collegamento.
    text='Risposta.\nFONTI: guida-inventata';
    assert.deepEqual((await call({message:'sicuro?',history:slow})).body.sources,[]);
    // "non funziona" dentro una conversazione va al modello, non alla domanda standard.
    text='Proviamo altro.\nFONTI: pc-lento';
    assert.equal((await call({message:'non funziona',history:slow})).body.answer,'Proviamo altro.');
  } finally { globalThis.fetch=originalFetch; if(originalKey===undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=originalKey; }
});
function withEnv(vars, fn) {
  const saved = Object.fromEntries(Object.keys(vars).map(k => [k, process.env[k]]));
  const originalFetch = globalThis.fetch;
  for (const [k, v] of Object.entries(vars)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  return (async () => { try { await fn(); } finally {
    globalThis.fetch = originalFetch;
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  } })();
}
const STORE = { KV_REST_API_URL: 'https://redis.test/', KV_REST_API_TOKEN: 'token-di-prova', UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined };
const IT = { SITO_SEGRETO: 'segreto-di-prova', ADMIN_PASSWORD: 'password-it-di-prova' };
async function cookieIT() {
  const { creaValoreIT, COOKIE_IT } = await import('../lib/area-it.js');
  return `${COOKIE_IT}=${await creaValoreIT()}`;
}

test('feedback: voti, commento oscurato, statistiche, archivio assente o irraggiungibile', async () => {
  const { default: feedback, oscura } = await import('../api/feedback.js');
  const send = async req => { const res = response(); await feedback(req, res); return res; };

  await withEnv({ KV_REST_API_URL: undefined, KV_REST_API_TOKEN: undefined, UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined }, async () => {
    const missing = await send({ method: 'POST', body: { voto: 'su' } });
    assert.equal(missing.statusCode, 503);
    assert.equal(missing.body.code, 'STORE_UNAVAILABLE');
  });

  await withEnv({ ...STORE, ...IT }, async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      const commands = JSON.parse(options.body);
      calls.push({ url, commands, auth: options.headers.Authorization });
      return { ok: true, json: async () => commands.map(() => ({ result: 1 })) };
    };
    const up = await send({ method: 'POST', body: { voto: 'su', guide: ['pc-lento', 'guida-inventata', 'pc-lento'] } });
    assert.equal(up.statusCode, 200);
    assert.equal(calls[0].url, 'https://redis.test/pipeline');
    assert.equal(calls[0].auth, 'Bearer token-di-prova');
    const fields = calls[0].commands.map(c => c[2]);
    assert.ok(fields.includes('totale:su') && fields.includes('guida:pc-lento:su'));
    assert.ok(!JSON.stringify(calls[0].commands).includes('guida-inventata'));
    assert.equal(fields.filter(f => f === 'guida:pc-lento:su').length, 1);

    // Il commento viene oscurato prima di arrivare all'archivio, e solo dopo un 👎.
    const privato = 'Scrivere a mario.rossi@example.com o al 333 123 4567, CF RSSMRA80A01H501U, IBAN IT60X0542811101000000123456';
    const down = await send({ method: 'POST', body: JSON.stringify({ voto: 'giu', guide: [], commento: privato }) });
    assert.equal(down.statusCode, 200);
    const saved = JSON.stringify(calls[1].commands);
    for (const dato of ['mario.rossi@example.com', '333 123 4567', 'RSSMRA80A01H501U', 'IT60X0542811101000000123456']) assert.ok(!saved.includes(dato), dato);
    assert.ok(saved.includes('senza-guida:giu') && saved.includes('LPUSH') && saved.includes('EXPIREAT'));
    await send({ method: 'POST', body: { voto: 'su', commento: 'ignorato' } });
    assert.ok(!JSON.stringify(calls[2].commands).includes('ignorato'));
    await send({ method: 'POST', body: { voto: 'giu', commento: 'x'.repeat(2000) } });
    assert.ok(JSON.stringify(calls[3].commands).includes('x'.repeat(500)) && !JSON.stringify(calls[3].commands).includes('x'.repeat(501)));
    assert.equal(oscura('Errore 0x80070005 dal 30/09/2026'), 'Errore 0x80070005 dal 30/09/2026');

    assert.equal((await send({ method: 'POST', body: { voto: 'forse' } })).statusCode, 400);
    assert.equal((await send({ method: 'POST', body: '{rotto' })).statusCode, 400);
    assert.equal((await send({ method: 'DELETE' })).statusCode, 405);

    globalThis.fetch = async () => ({ ok: true, json: async () => [
      { result: ['totale:su', '3', 'totale:giu', '1', 'guida:pc-lento:su', '2', 'guida:pc-lento:giu', '1', 'guida:guida-eliminata:su', '5', 'domande:totale', '10', 'domande:senza-guida', '2'] },
      { result: [JSON.stringify({ data: '2026-09-30', guide: ['pc-lento'], testo: '<b>manca</b> il passo 3' }), 'non json'] },
    ] });
    // Le statistiche richiedono la sessione dell'area IT; il voto no.
    const senzaIT = await send({ method: 'GET', query: { mese: '2026-09' }, headers: {} });
    assert.equal(senzaIT.statusCode, 401);
    assert.equal(senzaIT.body.code, 'IT_REQUIRED');
    const stats = await send({ method: 'GET', query: { mese: '2026-09' }, headers: { cookie: await cookieIT() } });
    assert.equal(stats.statusCode, 200);
    assert.deepEqual(stats.body.totale, { su: 3, giu: 1 });
    assert.deepEqual(stats.body.domande, { totale: 10, senzaGuida: 2 });
    assert.deepEqual(stats.body.guide, [{ id: 'pc-lento', titolo: 'Il PC è lento: verifiche rapide', su: 2, giu: 1 }]);
    assert.equal(stats.body.commenti.length, 1);
    assert.equal(stats.body.commenti[0].testo, '<b>manca</b> il passo 3');   // l'escape è compito della pagina

    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const originalError = console.error; console.error = () => {};
    try { assert.equal((await send({ method: 'POST', body: { voto: 'su' } })).statusCode, 502); } finally { console.error = originalError; }
  });
});

test('area IT: password, cookie firmato, scadenza, cambio password e uscita', async () => {
  const areaIT = await import('../lib/area-it.js');
  const { default: loginIT } = await import('../api/login-it.js');
  const { default: logout } = await import('../api/logout.js');
  const { default: logoutIT } = await import('../api/logout-it.js');
  const send = async (fn, req) => { const res = { ...response(), end() { return this; } }; await fn(req, res); return res; };

  await withEnv({ ADMIN_PASSWORD: undefined, SITO_SEGRETO: 'x' }, async () => {
    assert.equal((await send(loginIT, { method: 'POST', body: { password: 'qualsiasi' } })).statusCode, 503);
  });
  await withEnv(IT, async () => {
    assert.equal((await send(loginIT, { method: 'GET' })).statusCode, 405);
    const sbagliata = await send(loginIT, { method: 'POST', body: { password: 'SITO-password' } });
    assert.equal(sbagliata.statusCode, 401);
    assert.equal(sbagliata.headers['Set-Cookie'], undefined);

    const giusta = await send(loginIT, { method: 'POST', body: JSON.stringify({ password: IT.ADMIN_PASSWORD }) });
    assert.equal(giusta.statusCode, 200);
    const cookie = giusta.headers['Set-Cookie'][0];
    assert.match(cookie, /^sit_it=\d+\.[0-9a-f]{64}; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200$/);
    const valore = cookie.split(';')[0].slice('sit_it='.length);
    assert.equal(await areaIT.valoreITValido(valore), true);
    assert.equal(await areaIT.richiestaIT({ headers: { cookie: `altro=1; sit_it=${valore}` } }), true);

    // Firma alterata, scaduta dopo 2 ore, invalidata cambiando la password IT.
    assert.equal(await areaIT.valoreITValido(valore.replace(/.$/, c => (c === '0' ? '1' : '0'))), false);
    assert.equal(await areaIT.valoreITValido(valore, areaIT.configIT(), Date.now() + 2 * 3600 * 1000 + 1000), false);
    assert.equal(await areaIT.valoreITValido(valore, { ...areaIT.configIT(), password: 'nuova-password' }), false);
    // Il cookie del sito (firma della sola scadenza) non apre l'area IT.
    const { createHmac } = await import('node:crypto');
    const scadenza = String(Date.now() + 60000);
    assert.equal(await areaIT.valoreITValido(`${scadenza}.${createHmac('sha256', IT.SITO_SEGRETO).update(scadenza).digest('hex')}`), false);

    // "Esci" chiude sito e area IT; "Esci dall'area IT" solo l'area IT.
    const uscita = await send(logout, { method: 'GET' });
    assert.ok(uscita.headers['Set-Cookie'].some(c => c.startsWith('sit_acc=;')) && uscita.headers['Set-Cookie'].some(c => c.startsWith('sit_it=;')));
    const uscitaIT = await send(logoutIT, { method: 'GET' });
    assert.deepEqual(uscitaIT.headers['Set-Cookie'].map(c => c.split('=')[0]), ['sit_it']);
    assert.equal(uscitaIT.headers.Location, '/index.html');
  });
});

test('Helpo conta le domande senza guida e risponde anche se l’archivio non va', async () => {
  await withEnv({ ...STORE, OPENAI_API_KEY: 'test-only' }, async () => {
    const counted = [];
    let storeUp = true;
    globalThis.fetch = async (url, options) => {
      if (url.startsWith('https://redis.test')) {
        if (!storeUp) return { ok: false, status: 500 };
        counted.push(JSON.parse(options.body).map(c => c[2]));
        return { ok: true, json: async () => [{ result: 1 }, { result: 1 }] };
      }
      return { ok: true, json: async () => ({ status: 'completed', output_text: 'Risposta.\nFONTI: nessuna' }) };
    };
    const noGuide = await call({ message: 'Come posso richiedere le ferie?' });
    assert.equal(noGuide.statusCode, 200);
    assert.equal(noGuide.body.valutabile, true);
    assert.deepEqual(counted.at(-1), ['domande:totale', 'domande:senza-guida']);
    await call({ message: 'Teams non funziona' });
    assert.deepEqual(counted.at(-1), ['domande:totale']);
    storeUp = false;
    const originalError = console.error; console.error = () => {};
    try { assert.equal((await call({ message: 'Teams non funziona' })).statusCode, 200); } finally { console.error = originalError; }
  });
});

test('middleware: API scaduta restituisce JSON 401; sessione valida passa', async () => {
  const { readFileSync } = await import('node:fs');
  const { runInNewContext } = await import('node:vm');
  const { webcrypto, createHmac } = await import('node:crypto');
  const source=readFileSync('middleware.js','utf8').replace("import { next } from '@vercel/functions';", 'const next = () => "PASS";').replace('export const config', 'const config').replace('export default async function middleware', 'async function middleware');
  // Vercel ha deprecato il runtime edge: il middleware deve dichiarare Node.js.
  assert.match(source, /const config = \{ runtime: 'nodejs' \}/);
  const env={SITO_PASSWORD:'test',SITO_SEGRETO:'test-secret',ADMIN_PASSWORD:'password-it'};
  const middleware=runInNewContext(source+';middleware', {URL,Response,TextEncoder,crypto:webcrypto,process:{env}});
  const expired=await middleware(new Request('https://example.test/api/chat'));
  assert.equal(expired.status,401);assert.equal((await expired.json()).code,'SESSION_EXPIRED');
  const page=await middleware(new Request('https://example.test/ai-mode.html'));
  assert.equal(page.status,302);
  const expiry=String(Date.now()+60000), sig=createHmac('sha256','test-secret').update(expiry).digest('hex');
  const sito='sit_acc='+expiry+'.'+sig;
  const valid=await middleware(new Request('https://example.test/api/chat',{headers:{cookie:sito}}));
  assert.equal(valid,'PASS');

  // Area IT: con il solo login del sito le statistiche restano chiuse, il voto no.
  const statsPage=await middleware(new Request('https://example.test/statistiche.html',{headers:{cookie:sito}}));
  assert.equal(statsPage.status,302);
  assert.equal(statsPage.headers.get('location'),'https://example.test/login-it.html?da=%2Fstatistiche.html');
  const statsApi=await middleware(new Request('https://example.test/api/feedback?mese=2026-09',{headers:{cookie:sito}}));
  assert.equal(statsApi.status,401);assert.equal((await statsApi.json()).code,'IT_REQUIRED');
  assert.equal(await middleware(new Request('https://example.test/api/feedback',{method:'POST',headers:{cookie:sito}})),'PASS');
  assert.equal(await middleware(new Request('https://example.test/login-it.html',{headers:{cookie:sito}})),'PASS');
  // Senza login del sito non si arriva nemmeno alla pagina di accesso IT.
  assert.equal((await middleware(new Request('https://example.test/login-it.html'))).status,302);
  // Il cookie IT creato da lib/area-it.js viene accettato dal middleware: le due firme coincidono.
  const areaIT=await import('../lib/area-it.js');
  const valoreIT=await areaIT.creaValoreIT({password:env.ADMIN_PASSWORD,segreto:env.SITO_SEGRETO});
  const conIT=sito+'; sit_it='+valoreIT;
  assert.equal(await middleware(new Request('https://example.test/statistiche.html',{headers:{cookie:conIT}})),'PASS');
  assert.equal(await middleware(new Request('https://example.test/api/feedback',{headers:{cookie:conIT}})),'PASS');
  // Il cookie IT da solo non sostituisce il login del sito.
  assert.equal((await middleware(new Request('https://example.test/statistiche.html',{headers:{cookie:'sit_it='+valoreIT}}))).status,302);
  // Cambiando ADMIN_PASSWORD le sessioni IT aperte non valgono più; senza ADMIN_PASSWORD l'area è chiusa.
  env.ADMIN_PASSWORD='password-cambiata';
  assert.equal((await middleware(new Request('https://example.test/statistiche.html',{headers:{cookie:conIT}}))).status,302);
  delete env.ADMIN_PASSWORD;
  assert.equal((await middleware(new Request('https://example.test/statistiche.html',{headers:{cookie:conIT}}))).status,302);
});
