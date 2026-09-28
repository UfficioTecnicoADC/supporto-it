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
    // Argomento nuovo: arriva solo l'ultimo scambio, non tutto il vecchio problema.
    assert.ok(!JSON.stringify(sent.input).includes('NNT'));
    assert.deepEqual(sent.input.slice(0,-1),old.slice(2));
    assert.ok(res.body.sources.some(s=>/Teams/.test(s.titolo)));
    // Replica a una domanda: il modello riceve tutto l'argomento attivo.
    const printer=[user('La stampante non stampa'),assistant('La stampante è accesa?')];
    await call({message:'sì, la spia lampeggia arancione',history:printer});
    assert.deepEqual(sent.input.slice(0,-1),printer);
    assert.match(sent.input.at(-1).content,/La stampante non stampa/);
    globalThis.fetch=async()=>({ok:false,status:401});
    const bad=await call({message:'Teams non funziona'});
    assert.equal(bad.statusCode,502); assert.equal(bad.body.details,undefined);
    globalThis.fetch=async()=>({ok:true,json:async()=>({status:'incomplete',output_text:'Tagliato'})});
    assert.equal((await call({message:'Teams non funziona'})).statusCode,502);
    delete process.env.OPENAI_API_KEY;
    assert.equal((await call({message:'Teams non funziona'})).statusCode,503);
  } finally { globalThis.fetch=originalFetch; if(originalKey===undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=originalKey; }
});

test('middleware: API scaduta restituisce JSON 401; sessione valida passa', async () => {
  const { readFileSync } = await import('node:fs');
  const { runInNewContext } = await import('node:vm');
  const { webcrypto, createHmac } = await import('node:crypto');
  const source=readFileSync('middleware.js','utf8').replace("import { next } from '@vercel/functions';", 'const next = () => "PASS";').replace('export default async function middleware', 'async function middleware');
  const middleware=runInNewContext(source+';middleware', {URL,Response,TextEncoder,crypto:webcrypto,process:{env:{SITO_PASSWORD:'test',SITO_SEGRETO:'test-secret'}}});
  const expired=await middleware(new Request('https://example.test/api/chat'));
  assert.equal(expired.status,401);assert.equal((await expired.json()).code,'SESSION_EXPIRED');
  const page=await middleware(new Request('https://example.test/ai-mode.html'));
  assert.equal(page.status,302);
  const expiry=String(Date.now()+60000), sig=createHmac('sha256','test-secret').update(expiry).digest('hex');
  const valid=await middleware(new Request('https://example.test/api/chat',{headers:{cookie:'sit_acc='+expiry+'.'+sig}}));
  assert.equal(valid,'PASS');
});
