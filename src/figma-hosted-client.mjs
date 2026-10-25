// Browser client for the hosted Figma OAuth bridge.
// The encrypted session is kept in sessionStorage and is never a Figma access token.
import {parseFigmaUrl,convertFigmaFile} from './figma-bridge.mjs';
export const FIGMA_SESSION_KEY='merchtest:figma-oauth-session';
export const FIGMA_PENDING_KEY='merchtest:figma-pending-link';
export function figmaBridgeUrl(){
  return String(import.meta.env?.VITE_FIGMA_BRIDGE_URL||'').trim().replace(/\/+$/,'');
}
export function rememberFigmaLink(url,storage=globalThis.sessionStorage){
  parseFigmaUrl(url);
  storage.setItem(FIGMA_PENDING_KEY,url);
  return url;
}
export function extractFigmaSessionFromHash(hash,storage=globalThis.sessionStorage){
  const params=new URLSearchParams(String(hash||'').replace(/^#/,''));
  const session=params.get('figma_session');
  if(!session)return null;
  if(session.length>15000||!/^[A-Za-z0-9_.-]+$/.test(session))throw Error('Ответ авторизации Figma повреждён.');
  storage.setItem(FIGMA_SESSION_KEY,session);
  return session;
}
export async function importFigmaFromUrl(url,{endpoint=figmaBridgeUrl(),session,request=fetch}={}){
  const {fileKey,nodeId}=parseFigmaUrl(url);
  if(!endpoint)throw Error('Импорт по ссылке ещё не подключён администратором. Сервер OAuth не настроен.');
  if(!session)throw Error('Для импорта войдите через Figma.');
  const response=await request(endpoint+'/api/import',{
    method:'POST',
    headers:{'content-type':'application/json','authorization':'Bearer '+session},
    body:JSON.stringify({url}),
  });
  let body;
  try{body=await response.json();}catch{throw Error('Сервер Figma вернул некорректный ответ.');}
  if(!response.ok) {
    const error=new Error(body?.error||'Не удалось загрузить макет Figma.');
    error.status=response.status;
    throw error;
  }
  const next=convertFigmaFile(body,{nodeId});
  next.source=body.name||next.source||'Figma';
  if(body.importWarnings)next.warning=body.importWarnings;
  return next;
}
