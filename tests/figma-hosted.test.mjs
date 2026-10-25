import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../figma-hosted/worker.mjs';
import {FIGMA_PENDING_KEY,FIGMA_SESSION_KEY,extractFigmaSessionFromHash,rememberFigmaLink,importFigmaFromUrl} from '../src/figma-hosted-client.mjs';

const storage=()=>({values:new Map(),getItem(k){return this.values.get(k)||null;},setItem(k,v){this.values.set(k,String(v));}});
const good='https://www.figma.com/design/ABC123/Demo?node-id=4-8';

test('OAuth response is decoded only from valid hash and stored in browser session',()=>{
  const s=storage();
  assert.equal(extractFigmaSessionFromHash('#figma_session=abc.DEF-123',s),'abc.DEF-123');
  assert.equal(s.getItem(FIGMA_SESSION_KEY),'abc.DEF-123');
  assert.equal(extractFigmaSessionFromHash('#ignored=yes',s),null);
  assert.throws(()=>extractFigmaSessionFromHash('#figma_session=<script>',s),/повреждён/);
});
test('Figma links are validated before they are remembered for redirect',()=>{
  const s=storage();
  rememberFigmaLink(good,s);
  assert.equal(s.getItem(FIGMA_PENDING_KEY),good);
  assert.throws(()=>rememberFigmaLink('https://bad.example/design/ABC123',s),/figma.com/);
});
test('Figma link can become editable blocks after user authorizes',async()=>{
  const frame={id:'4:8',type:'FRAME',name:'Hero',absoluteBoundingBox:{x:0,y:0,width:1200,height:400},
    children:[{id:'4:9',type:'TEXT',name:'H1',characters:'Привет',absoluteBoundingBox:{x:10,y:10,width:400,height:50},style:{fontSize:28}}]};
  let requestArgs;
  const output=await importFigmaFromUrl(good,{endpoint:'https://mock.workers.dev',session:'SESSION',
    request:async(url,init)=>{requestArgs={url,init};return {ok:true,json:async()=>({name:'Mock Figma',nodes:{'4:8':{document:frame}}})};}});
  assert.equal(requestArgs.url,'https://mock.workers.dev/api/import');
  assert.equal(requestArgs.init.headers.authorization,'Bearer SESSION');
  assert.equal(output.blocks[0].children[0].text,'Привет');
});
test('Server is not mistaken for deployed if credentials are missing',async()=>{
  const env={ALLOWED_ORIGIN:'https://kssafonova.github.io'};
  const result=await worker.fetch(new Request('https://figma.example/health',{headers:{origin:env.ALLOWED_ORIGIN}}),env);
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{ready:false});
  const res=await worker.fetch(new Request('https://figma.example/api/import',{method:'POST',headers:{origin:env.ALLOWED_ORIGIN,'content-type':'application/json'},body:JSON.stringify({url:good})}),env);
  assert.equal(res.status,503);
});
test('Hosted worker refuses unauthorized cross-origin access',async()=>{
  const env={ALLOWED_ORIGIN:'https://kssafonova.github.io',FIGMA_CLIENT_ID:'abc',FIGMA_CLIENT_SECRET:'secret',SESSION_SECRET:'a-very-long-secret',EDITOR_URL:'https://kssafonova.github.io/merchtest/'};
  const res=await worker.fetch(new Request('https://figma.example/api/import',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:JSON.stringify({url:good})}),env);
  assert.equal(res.status,403);
});
