#!/usr/bin/env node
// Local Figma MCP-style adapter for the static merchtest prototype.
// Uses FIGMA_TOKEN in this process only; never puts the token into output files.
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {parseFigmaUrl,convertFigmaFile} from '../src/figma-bridge.mjs';

const args=process.argv.slice(2);
const url=args.find(x=>/^https?:\/\//.test(x));
const outIndex=args.indexOf('--out');
const output=outIndex!==-1&&args[outIndex+1]?args[outIndex+1]:'figma-import.json';
if(!url){
  process.stderr.write('Использование: FIGMA_TOKEN=... npm run figma:pull -- "https://www.figma.com/design/FILE/Title?node-id=1-2" --out figma-import.json\n');
  process.exit(1);
}
if(!process.env.FIGMA_TOKEN){
  process.stderr.write('Не задан FIGMA_TOKEN. Создайте личный токен Figma с file_content:read и передайте как переменную окружения. Не коммитьте его.\n');
  process.exit(1);
}
const {fileKey,nodeId}=parseFigmaUrl(url);
const api='https://api.figma.com/v1/';
async function getJson(endpoint){
  const response=await fetch(api+endpoint,{headers:{'X-Figma-Token':process.env.FIGMA_TOKEN,'Accept':'application/json'}});
  if(!response.ok)throw Error('Figma API '+response.status+': '+(await response.text()).slice(0,500));
  return response.json();
}
function imageRefs(n,seen){
  if(!n||typeof n!=='object')return;
  for(const p of n.fills||[])if(p?.type==='IMAGE'&&p.imageRef)seen.add(p.imageRef);
  for(const c of n.children||[])imageRefs(c,seen);
}
try{
  const response=nodeId?
    await getJson('files/'+fileKey+'/nodes?ids='+encodeURIComponent(nodeId)):
    await getJson('files/'+fileKey);
  const nodes=nodeId?[...Object.values(response.nodes||{})].map(x=>x?.document).filter(Boolean):[response.document];
  const refs=new Set();
  nodes.forEach(n=>imageRefs(n,refs));
  const images={};
  if(refs.size){
    const files=await getJson('files/'+fileKey+'/images');
    const entries=[...refs].slice(0,100);
    let done=0;
    for(const ref of entries){
      const imageUrl=files.images?.[ref];
      if(!imageUrl)continue;
      try{
        const r=await fetch(imageUrl);
        const type=(r.headers.get('content-type')||'').split(';')[0].toLowerCase();
        if(!r.ok||!['image/png','image/jpeg','image/webp','image/gif'].includes(type))continue;
        const bytes=new Uint8Array(await r.arrayBuffer());
        if(bytes.length>6*1024*1024)continue;
        images[ref]='data:'+type+';base64,'+Buffer.from(bytes).toString('base64');
        done++;
      }catch{ /* image remains empty rather than referencing expiring Figma asset links */ }
    }
    process.stdout.write('Локальных изображений сохранено: '+done+'/'+refs.size+'\n');
  }
  const data=nodeId?{name:response.name,nodes:response.nodes,images}:{...response,images};
  const normalized=convertFigmaFile(data,{nodeId});
  await mkdir(dirname(resolve(output)),{recursive:true});
  await writeFile(output,JSON.stringify(normalized,null,2),'utf8');
  process.stdout.write('Готово: '+output+'\nФреймов: '+normalized.blocks.length+' · слоёв: '+normalized.layerCount+'\nПеретащите JSON в редактор merchtest → «Из Figma».\n');
}catch(error){
  process.stderr.write('Не удалось импортировать Figma: '+(error?.message||error)+'\n');
  process.exitCode=1;
}
