// Hosted Figma OAuth bridge for merchtest.
// Deploy to Cloudflare Workers. No personal access token is ever exposed to the browser.
// Environment vars: FIGMA_CLIENT_ID, FIGMA_CLIENT_SECRET, SESSION_SECRET,
// EDITOR_URL, ALLOWED_ORIGIN. Worker callback URI: https://<worker>/auth/callback
const encoder=new TextEncoder();
const decoder=new TextDecoder();
const MAX_JSON=10*1024*1024;
const MAX_IMAGES=12;
const MAX_IMAGE_BYTES=1024*1024;
const SESSION_SECONDS=3600;
function b64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function unb64(str){const s=atob(str.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-str.length%4)%4));return Uint8Array.from(s,ch=>ch.charCodeAt(0));}
function err(message,status=400,origin=''){return json({error:message},status,origin);}
function json(obj,status=200,origin=''){return new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...(origin?{'access-control-allow-origin':origin,'vary':'Origin'}:{})}});}
function originFor(req,env){const origin=req.headers.get('origin')||'';return origin&&origin===env.ALLOWED_ORIGIN?origin:'';}
function ready(env){return Boolean(env.FIGMA_CLIENT_ID&&env.FIGMA_CLIENT_SECRET&&env.SESSION_SECRET&&env.EDITOR_URL&&env.ALLOWED_ORIGIN);}
function redirect(url){return new Response(null,{status:302,headers:{location:String(url),'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});}
async function secretKey(secret,usage){const raw=await crypto.subtle.digest('SHA-256',encoder.encode(secret));return crypto.subtle.importKey('raw',raw,usage==='sign'?{name:'HMAC',hash:'SHA-256'}:{name:'AES-GCM'},false,usage==='sign'?['sign','verify']:['encrypt','decrypt']);}
async function makeState(env){
  const data=b64(encoder.encode(JSON.stringify({t:Date.now(),nonce:b64(crypto.getRandomValues(new Uint8Array(18)))})));
  const signature=new Uint8Array(await crypto.subtle.sign('HMAC',await secretKey(env.SESSION_SECRET,'sign'),encoder.encode(data)));
  return data+'.'+b64(signature);
}
async function stateOk(value,env){
  try{
    const [part,mac,...rest]=String(value||'').split('.');
    if(!part||!mac||rest.length)return false;
    const valid=await crypto.subtle.verify('HMAC',await secretKey(env.SESSION_SECRET,'sign'),unb64(mac),encoder.encode(part));
    if(!valid)return false;
    const state=JSON.parse(decoder.decode(unb64(part)));
    return Number.isFinite(state.t)&&Date.now()-state.t>=0&&Date.now()-state.t<600000;
  }catch{return false;}
}
async function seal(data,env){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await secretKey(env.SESSION_SECRET,'encrypt');
  const raw=encoder.encode(JSON.stringify(data));
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,raw));
  return b64(iv)+'.'+b64(cipher);
}
async function unseal(value,env){
  try{
    const [a,b,...extra]=String(value||'').split('.');
    if(!a||!b||extra.length||value.length>15000)return null;
    const iv=unb64(a);
    if(iv.length!==12)return null;
    const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv},await secretKey(env.SESSION_SECRET,'encrypt'),unb64(b));
    const data=JSON.parse(decoder.decode(raw));
    return data&&data.access_token&&data.exp>Date.now() ? data : null;
  }catch{return null;}
}
function parseLink(url){
  const u=new URL(url);
  if(u.hostname!=='figma.com'&&u.hostname!=='www.figma.com')throw Error('Требуется ссылка figma.com.');
  const match=u.pathname.match(/^\/(?:file|design|proto)\/([A-Za-z0-9]+)(?:\/|$)/);
  if(!match)throw Error('Поддерживаются ссылки Figma Design и Prototype на файл.');
  const candidate=u.searchParams.get('node-id');
  return {key:match[1],nodeId:candidate&&/^[0-9:-]+$/.test(candidate)?candidate.replace(/-/g,':'):null};
}
async function figmaJson(endpoint,token){
  const res=await fetch('https://api.figma.com/v1/'+endpoint,{headers:{authorization:'Bearer '+token,accept:'application/json'}});
  if(!res.ok){
    if(res.status===401||res.status===403)throw {status:403,message:'Figma не разрешила прочитать этот макет. Проверьте доступ к файлу или войдите заново.'};
    if(res.status===404)throw {status:404,message:'Макет не найден. Проверьте ссылку и доступ к нему.'};
    if(res.status===429)throw {status:429,message:'Превышен лимит запросов Figma. Попробуйте позже.'};
    throw {status:502,message:'Ошибка Figma API ('+res.status+').'};
  }
  const len=Number(res.headers.get('content-length')||0);
  if(len>MAX_JSON)throw {status:413,message:'Макет слишком большой. Укажите ссылку на отдельный фрейм (node-id).'};
  const text=await res.text();
  if(text.length>MAX_JSON)throw {status:413,message:'Макет слишком большой. Укажите отдельный фрейм.'};
  return JSON.parse(text);
}
function imageRefs(node,all){
  if(!node||typeof node!=='object'||all.size>=MAX_IMAGES)return;
  for(const fill of node.fills||[]){
    if(fill?.type==='IMAGE'&&typeof fill.imageRef==='string')all.add(fill.imageRef);
    if(all.size>=MAX_IMAGES)return;
  }
  for(const child of node.children||[])imageRefs(child,all);
}
function allowedImageHost(url){
  try{
    const x=new URL(url);
    return x.protocol==='https:'&&(
      x.hostname==='figma.com'||x.hostname.endsWith('.figma.com')||
      x.hostname==='amazonaws.com'||x.hostname.endsWith('.amazonaws.com')||
      x.hostname==='cloudfront.net'||x.hostname.endsWith('.cloudfront.net')
    );
  }catch{return false;}
}
async function fetchImageData(url){
  if(!allowedImageHost(url))return null;
  const res=await fetch(url,{redirect:'follow'});
  if(!res.ok||Number(res.headers.get('content-length')||0)>MAX_IMAGE_BYTES)return null;
  const type=(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(!['image/png','image/jpeg','image/webp','image/gif'].includes(type))return null;
  const arr=new Uint8Array(await res.arrayBuffer());
  if(arr.byteLength>MAX_IMAGE_BYTES)return null;
  return 'data:'+type+';base64,'+b64(arr).replace(/-/g,'+').replace(/_/g,'/');
}
async function readFile(url,token){
  const {key,nodeId}=parseLink(url);
  const raw=await figmaJson('files/'+key+(nodeId?'/nodes?ids='+encodeURIComponent(nodeId):''),token);
  const roots=nodeId?Object.values(raw.nodes||{}).map(n=>n?.document).filter(Boolean):[raw.document];
  const refs=new Set();
  for(const r of roots)imageRefs(r,refs);
  const images={};
  if(refs.size){
    try{
      const map=await figmaJson('files/'+key+'/images',token);
      await Promise.all([...refs].slice(0,MAX_IMAGES).map(async ref=>{
        const u=map.images?.[ref];
        if(!u)return;
        try{const data=await fetchImageData(u);if(data)images[ref]=data;}catch{}
      }));
    }catch{} // Never block layout import because an image is unavailable.
  }
  return {...raw,images,importWarnings:refs.size>Object.keys(images).length?
    (refs.size-Object.keys(images).length)+' изображений не встроено; проверьте их после импорта.':null};
}
export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    const cors=originFor(request,env);
    if(request.method==='OPTIONS'){
      if(!cors)return new Response(null,{status:403});
      return new Response(null,{status:204,headers:{
        'access-control-allow-origin':cors,
        'access-control-allow-methods':'POST, GET, OPTIONS',
        'access-control-allow-headers':'authorization, content-type',
        'access-control-max-age':'600',
        vary:'Origin',
      }});
    }
    if(path==='/health'&&request.method==='GET')return json({ready:ready(env)},200,cors);
    if(!ready(env))return err('Figma OAuth ещё не подключён к серверу приложения.',503,cors);
    const editor=new URL(env.EDITOR_URL);
    const endpoint=new URL(request.url);
    if(path==='/auth/start'&&request.method==='GET'){
      const state=await makeState(env);
      const auth=new URL('https://www.figma.com/oauth');
      auth.searchParams.set('client_id',env.FIGMA_CLIENT_ID);
      auth.searchParams.set('redirect_uri',endpoint.origin+'/auth/callback');
      auth.searchParams.set('scope','file_content:read');
      auth.searchParams.set('state',state);
      auth.searchParams.set('response_type','code');
      return redirect(auth.href);
    }
    if(path==='/auth/callback'&&request.method==='GET'){
      const code=endpoint.searchParams.get('code');
      const state=endpoint.searchParams.get('state');
      if(!code||!await stateOk(state,env))return err('OAuth state не подтверждён.',403);
      const basic=btoa(env.FIGMA_CLIENT_ID+':'+env.FIGMA_CLIENT_SECRET);
      const body=new URLSearchParams({redirect_uri:endpoint.origin+'/auth/callback',code,grant_type:'authorization_code'});
      const answer=await fetch('https://api.figma.com/v1/oauth/token',{
        method:'POST',headers:{authorization:'Basic '+basic,'content-type':'application/x-www-form-urlencoded'},
        body:body.toString(),
      });
      if(!answer.ok)return err('Figma не смогла завершить авторизацию. Повторите вход.',502);
      const token=await answer.json();
      if(!token.access_token)return err('Figma не вернула право чтения макета.',502);
      const expires=Math.min(SESSION_SECONDS,Math.max(60,Number(token.expires_in||SESSION_SECONDS)-30));
      const sealed=await seal({access_token:token.access_token,exp:Date.now()+expires*1000},env);
      // URL fragment never travels to GitHub Pages' server or Referer header.
      editor.hash='figma_session='+encodeURIComponent(sealed);
      return redirect(editor.href);
    }
    if(path==='/api/import'&&request.method==='POST'){
      if(!cors)return err('Недопустимый origin.',403);
      const h=request.headers.get('authorization')||'';
      const session=h.startsWith('Bearer ')?await unseal(h.slice(7),env):null;
      if(!session)return err('Сеанс Figma истёк. Подключите Figma снова.',401,cors);
      let body;
      try{
        if(Number(request.headers.get('content-length')||0)>4096)return err('Запрос слишком большой.',413,cors);
        body=await request.json();
        if(typeof body?.url!=='string'||body.url.length>2048)return err('Введите ссылку на макет.',400,cors);
        parseLink(body.url);
      }catch{return err('Введите корректную ссылку Figma.',400,cors);}
      try{return json(await readFile(body.url,session.access_token),200,cors);}
      catch(error){return err(error.message||'Не удалось прочитать макет.',error.status||502,cors);}
    }
    return err('Неизвестный маршрут.',404,cors);
  },
};
