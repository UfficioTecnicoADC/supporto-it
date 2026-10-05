import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieve, cleanHistory, htmlToText, normalize, products } from '../lib/retrieval.js';
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
  // La pagina di login non può leggere KB (è protetta): l'email è scritta a mano e deve
  // restare uguale a KB.contatti, e nessun file deve citare altre email del dominio.
  const { readFileSync } = await import('node:fs');
  const login = readFileSync('login.html', 'utf8');
  assert.ok(login.includes(kb.contatti.email.valore), `login.html: l'email deve essere ${kb.contatti.email.valore} come in KB.contatti`);
  const sorgenti = ['login.html', 'login-it.html', 'contatti.html', 'index.html', 'assets/js/data.js', 'assets/js/app.js', 'api/chat.js'].map(f => readFileSync(f, 'utf8')).join('\n');
  const altre = [...new Set([...sorgenti.matchAll(/[a-z0-9._-]+@assistenzadentistica\.it/gi)].map(m => m[0].toLowerCase()))].filter(e => e !== kb.contatti.email.valore);
  assert.deepEqual(altre, [], 'indirizzi email del dominio diversi da quello in KB.contatti');
  for (const a of kb.articoli.filter(x => x.ripiegoPer)) {
    assert.ok(Array.isArray(a.ripiegoPer) && a.ripiegoPer.every(p => products.includes(p)), `${a.id}: ripiegoPer deve contenere programmi noti (${products.join(', ')})`);
  }
});
test('"oris" è OrisDent Q; la guida di Maia arriva come ripiego per le domande su ORIS', () => {
  for (const nome of ['oris', 'Oris Dent', 'OrisDent', 'OrisDentQ', 'Oris Dent Q', 'ORISDENT Q']) assert.equal(normalize(nome), 'oris', nome);
  const ripiego = (q) => retrieve(q).guides.find(g => g.id === 'maia-orisdent');
  // Uso del gestionale senza guida interna: arriva il ripiego.
  const uso = retrieve('Come si stampa il piano di cura in oris?');
  assert.equal(uso.kind, 'ripiego');
  assert.equal(ripiego('Come si stampa il piano di cura in oris?')?.ripiego, true);
  assert.equal(ripiego('come faccio a stampare il piano di cura in OrisDentQ')?.ripiego, true);
  // Problema tecnico: prima la guida tecnica; il ripiego c'è ma solo come ripiego.
  for (const q of ['oris non si apre', 'ORIS DENT è bloccato']) {
    const r = retrieve(q);
    assert.equal(r.guides[0].id, 'Problemi-ORIS-DENT', q);
    assert.equal(r.guides.filter(g => g.id === 'maia-orisdent').map(g => g.ripiego).join(), 'true', q);
  }
  // Senza ORIS il ripiego non arriva; cercandola apposta, la guida si trova come guida normale.
  assert.equal(ripiego('Come si stampa il piano di cura?'), undefined);
  assert.equal(ripiego('Teams non funziona'), undefined);
  const diretta = retrieve('come si usa maia');
  assert.equal(diretta.guides[0].id, 'maia-orisdent');
  assert.equal(diretta.guides[0].ripiego, undefined);
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

test('Helpo: glossario "oris", ripiego Maia mostrato solo se citato e contato come guida mancante', async () => {
  await withEnv({ ...STORE, OPENAI_API_KEY: 'test-only' }, async () => {
    let sent, text;
    const counted = [];
    globalThis.fetch = async (url, options) => {
      if (url.startsWith('https://redis.test')) { counted.push(JSON.parse(options.body).map(c => c[2])); return { ok: true, json: async () => [{ result: 1 }, { result: 1 }] }; }
      sent = JSON.parse(options.body);
      return { ok: true, json: async () => ({ status: 'completed', output_text: text }) };
    };
    text = 'Nelle nostre guide non c’è: chiedi a Maia da OrisDent Q.\nFONTI: maia-orisdent';
    const uso = await call({ message: 'Come si stampa il piano di cura in oris?' });
    assert.match(sent.instructions, /«oris»/);
    assert.match(sent.instructions, /OrisDent Q/);
    assert.match(sent.instructions, /non chiedere conferma/);
    assert.match(sent.input.at(-1).content, /"id":"maia-orisdent"[^\n]*"ripiego":true/);
    assert.deepEqual(uso.body.sources.map(s => s.id), ['maia-orisdent']);
    assert.deepEqual(counted.at(-1), ['domande:totale', 'domande:senza-guida']);

    text = 'Segui la guida.\nFONTI: Problemi-ORIS-DENT';
    const tecnico = await call({ message: 'oris non si apre' });
    assert.deepEqual(tecnico.body.sources.map(s => s.id), ['Problemi-ORIS-DENT']);
    assert.deepEqual(counted.at(-1), ['domande:totale']);

    // Senza riga FONTI il ripiego non compare tra i collegamenti.
    text = 'Risposta senza fonti.';
    const senzaFonti = await call({ message: 'oris non si apre' });
    assert.ok(!senzaFonti.body.sources.some(s => s.id === 'maia-orisdent'));
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

const T1 = '11111111-1111-4111-8111-111111111111', T2 = '22222222-2222-4222-8222-222222222222', ESTRANEO = '33333333-3333-4333-8333-333333333333';
const MS = { MS_CLIENT_ID: 'app-di-prova', MS_CLIENT_SECRET: 'segreto-app-di-prova', MS_TENANT_IDS: `${T1}, ${T2}`, SITO_SEGRETO: 'segreto-di-prova', ADMIN_PASSWORD: undefined, MS_RUOLO_IT: undefined };
const idToken = claims => ['{"alg":"RS256"}', JSON.stringify(claims), 'firma'].map(p => Buffer.from(p).toString('base64url')).join('.');

test('accesso Microsoft: avvio, ritorno, tenant ammessi, ruolo IT e attacchi respinti', async () => {
  const ms = await import('../lib/microsoft.js');
  const areaIT = await import('../lib/area-it.js');
  const { default: avvio } = await import('../api/auth/microsoft.js');
  const { default: ritorno } = await import('../api/auth/callback.js');
  const { createHmac, createHash } = await import('node:crypto');
  const send = async (fn, req) => { const res = { ...response(), end(b) { if (b !== undefined) this.body = b; return this; } }; await fn(req, res); return res; };
  const host = { host: 'supporto-it.vercel.app' };

  await withEnv({ MS_CLIENT_ID: undefined, MS_CLIENT_SECRET: undefined, MS_TENANT_IDS: undefined }, async () => {
    assert.equal((await send(avvio, { method: 'GET', headers: host, query: {} })).headers.Location, '/login.html?errore=config');
  });

  await withEnv(MS, async () => {
    // Più tenant: endpoint "organizations"; un solo tenant: endpoint di quel tenant.
    assert.equal(ms.configMicrosoft().authority, 'organizations');
    assert.equal(ms.configMicrosoft({ ...MS, MS_TENANT_IDS: T1 }).authority, T1);
    // Un ID scritto male viene ignorato ma segnalato nel log, una sola volta e senza gli ID.
    const avvisi = [], originalWarn = console.warn;
    console.warn = (...a) => avvisi.push(a.join(' '));
    try {
      assert.equal(ms.configMicrosoft({ ...MS, MS_TENANT_IDS: 'non-un-id' }), null);
      const misto = { ...MS, MS_TENANT_IDS: `${T1}, ${T2.slice(0, -1)}, ${T2}` };
      assert.deepEqual(ms.configMicrosoft(misto).tenants, [T1, T2]);
      ms.configMicrosoft(misto);
    } finally { console.warn = originalWarn; }
    assert.equal(avvisi.length, 2, 'un avviso per ogni configurazione diversa, non uno per richiesta');
    assert.match(avvisi[1], /1 valori non validi.*3 inseriti, 2 validi/);
    assert.ok(!avvisi.join().includes(T1) && !avvisi.join().includes(T2.slice(0, 8)), 'gli ID non vanno nel log');

    const partenza = await send(avvio, { method: 'GET', headers: host, query: { da: '/statistiche.html' } });
    assert.equal(partenza.statusCode, 302);
    const url = new URL(partenza.headers.Location);
    assert.equal(url.origin + url.pathname, 'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize');
    assert.equal(url.searchParams.get('client_id'), 'app-di-prova');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://supporto-it.vercel.app/api/auth/callback');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(!url.search.includes('segreto'), 'il segreto dell\'app non va mai nel browser');
    const cookieMs = partenza.headers['Set-Cookie'][0];
    assert.match(cookieMs, /^sit_ms=[\w-]+\.[0-9a-f]{64}; Path=\/api\/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600$/);
    const richiestaCookie = cookieMs.split(';')[0];
    const state = url.searchParams.get('state'), nonce = url.searchParams.get('nonce');

    const adesso = Math.floor(Date.now() / 1000);
    const buono = (extra = {}) => ({ tid: T2, aud: 'app-di-prova', iss: `https://login.microsoftonline.com/${T2}/v2.0`, exp: adesso + 600, nbf: adesso - 5, nonce, oid: 'oid-prova', name: 'Collega di prova', ...extra });
    let scambi = [], claims = buono({ roles: ['IT'] }), tokenOk = true;
    globalThis.fetch = async (u, opzioni) => {
      const corpo = new URLSearchParams(opzioni.body);
      scambi.push({ u, corpo });
      if (!tokenOk) return { ok: false, status: 400, json: async () => ({ error: 'invalid_grant', error_description: 'dettagli' }) };
      return { ok: true, json: async () => ({ id_token: idToken(claims), access_token: 'non-usato' }) };
    };
    const torna = (q, cookie = richiestaCookie) => send(ritorno, { method: 'GET', headers: { ...host, cookie }, query: q });

    // Percorso completo con ruolo IT: sessione del sito + area IT, e pagina-ponte verso /statistiche.html.
    const ok = await torna({ code: 'codice-monouso', state });
    assert.equal(ok.statusCode, 200);
    assert.equal(scambi[0].u, 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token');
    assert.equal(scambi[0].corpo.get('client_secret'), 'segreto-app-di-prova');
    assert.equal(createHash('sha256').update(scambi[0].corpo.get('code_verifier')).digest('base64url'), url.searchParams.get('code_challenge'));
    assert.match(ok.body, /location\.replace\(d\)/);
    assert.match(ok.body, /var d="\/statistiche\.html"/);
    const cookies = ok.headers['Set-Cookie'];
    const sito = cookies.find(c => c.startsWith('sit_acc=')).split(';')[0].slice('sit_acc='.length);
    const [scadenza, firma] = sito.split('.');
    assert.equal(firma, createHmac('sha256', 'segreto-di-prova').update(scadenza).digest('hex'), 'stessa sessione del login con password');
    assert.ok(Number(scadenza) > Date.now() + 7.9 * 3600 * 1000);
    const it = cookies.find(c => c.startsWith('sit_it=')).split(';')[0].slice('sit_it='.length);
    assert.equal(await areaIT.valoreITValido(it), true, 'il ruolo IT apre l\'area IT anche senza ADMIN_PASSWORD');
    assert.ok(cookies.some(c => c.startsWith('sit_ms=;')), 'il cookie della richiesta viene cancellato');

    // Senza ruolo IT: solo la sessione del sito.
    claims = buono();
    assert.ok(!(await torna({ code: 'c', state })).headers['Set-Cookie'].some(c => c.startsWith('sit_it=')));

    // Account di un'azienda fuori dal gruppo: rifiutato anche se Microsoft lo ha autenticato.
    claims = buono({ tid: ESTRANEO, iss: `https://login.microsoftonline.com/${ESTRANEO}/v2.0` });
    const estraneo = await torna({ code: 'c', state });
    assert.equal(estraneo.headers.Location, '/login.html?errore=tenant');
    assert.ok(!estraneo.headers['Set-Cookie'].some(c => c.startsWith('sit_acc=')));

    // Token per un'altra app, emittente diverso, nonce diverso, scaduto: rifiutati.
    for (const sbagliato of [{ aud: 'altra-app' }, { iss: `https://login.microsoftonline.com/${T1}/v2.0` }, { nonce: 'altro' }, { exp: adesso - 10 }]) {
      claims = buono(sbagliato);
      assert.equal((await torna({ code: 'c', state })).headers.Location, '/login.html?errore=microsoft', JSON.stringify(sbagliato));
    }

    // State sbagliato o cookie manomesso: nessuno scambio con Microsoft.
    scambi = [];
    assert.equal((await torna({ code: 'c', state: 'falso' })).headers.Location, '/login.html?errore=scaduto');
    assert.equal((await torna({ code: 'c', state }, richiestaCookie.replace(/.$/, c => (c === '0' ? '1' : '0')))).headers.Location, '/login.html?errore=scaduto');
    assert.equal((await torna({ code: 'c', state }, '')).headers.Location, '/login.html?errore=scaduto');
    assert.equal(scambi.length, 0);
    // Richiesta più vecchia di 10 minuti.
    assert.equal(await ms.leggiRichiesta(richiestaCookie.slice('sit_ms='.length), ms.configMicrosoft(), Date.now() + 11 * 60 * 1000), null);

    // Login annullato su Microsoft, o codice rifiutato.
    assert.equal((await torna({ error: 'access_denied', state })).headers.Location, '/login.html?errore=microsoft');
    tokenOk = false;
    const originalError = console.error; const log = []; console.error = (...a) => log.push(JSON.stringify(a));
    try { assert.equal((await torna({ code: 'c', state })).headers.Location, '/login.html?errore=microsoft'); } finally { console.error = originalError; }
    assert.match(log.join(), /invalid_grant/);
    assert.ok(!log.join().includes('codice-monouso') && !log.join().includes('dettagli'));

    // Dopo il login si torna solo su pagine del sito.
    for (const fuori of ['//sito-esterno.example', 'https://sito-esterno.example', '/\\sito-esterno.example', 'pagina']) assert.equal(ms.destinazioneSicura(fuori), '/index.html', fuori);
    tokenOk = true; claims = buono();
    const dentro = await send(avvio, { method: 'GET', headers: host, query: { da: '/x</script><script>alert(1)' } });
    const c2 = dentro.headers['Set-Cookie'][0].split(';')[0];
    const s2 = new URL(dentro.headers.Location).searchParams.get('state');
    claims = buono({ nonce: new URL(dentro.headers.Location).searchParams.get('nonce') });
    const ponte = await torna({ code: 'c', state: s2 }, c2);
    assert.ok(!ponte.body.includes('</script><script>alert'), 'la destinazione non può chiudere lo script');
  });
});

test('password condivisa spegnibile e middleware con il solo accesso Microsoft', async () => {
  const { default: login } = await import('../api/login.js');
  const send = async req => { const res = response(); await login(req, res); return res; };
  await withEnv({ ...MS, SITO_PASSWORD: 'condivisa' }, async () => {
    assert.deepEqual((await send({ method: 'GET' })).body, { password: true, microsoft: true });
  });
  await withEnv({ ...MS, SITO_PASSWORD: undefined }, async () => {
    assert.deepEqual((await send({ method: 'GET' })).body, { password: false, microsoft: true });
    const spenta = await send({ method: 'POST', body: { utente: 'ADC', password: 'condivisa' } });
    assert.equal(spenta.statusCode, 503);
    assert.match(spenta.body.errore, /Accedi con Microsoft/);
  });

  const { readFileSync } = await import('node:fs');
  const { runInNewContext } = await import('node:vm');
  const { webcrypto } = await import('node:crypto');
  const source = readFileSync('middleware.js', 'utf8').replace("import { next } from '@vercel/functions';", 'const next = () => "PASS";').replace('export const config', 'const config').replace('export default async function middleware', 'async function middleware');
  const carica = env => runInNewContext(source + ';middleware', { URL, Response, TextEncoder, crypto: webcrypto, process: { env } });
  const soloMicrosoft = carica({ SITO_SEGRETO: 's', MS_CLIENT_ID: 'app' });
  assert.equal((await soloMicrosoft(new Request('https://x.test/index.html'))).status, 302, 'senza password ma con Microsoft il sito resta raggiungibile dal login');
  assert.equal(await soloMicrosoft(new Request('https://x.test/api/auth/microsoft')), 'PASS');
  assert.equal(await soloMicrosoft(new Request('https://x.test/api/auth/callback?code=c&state=s')), 'PASS');
  assert.equal((await carica({ SITO_SEGRETO: 's' })(new Request('https://x.test/index.html'))).status, 503, 'nessun modo di entrare: sito bloccato');
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
