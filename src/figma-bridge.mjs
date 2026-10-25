// Shared, dependency-free Figma -> editor document translator.
// Input: Figma REST /files, /files/:key/nodes, a plugin selection, or our normalized export.
// It intentionally never generates executable HTML/CSS/JS from user data.
export const FIGMA_FORMAT = 'merchtest-figma/v1';
const CONTAINERS = new Set(['FRAME','GROUP','COMPONENT','COMPONENT_SET','INSTANCE','SECTION']);
const LIMIT = 2400;
const TYPES = new Set([...CONTAINERS,'TEXT','RECTANGLE','ELLIPSE','VECTOR','POLYGON','STAR','LINE','BOOLEAN_OPERATION']);
const round = (n, d=1) => Math.round(n * Math.pow(10,d)) / Math.pow(10,d);
const finite = (v, fallback=0, min=-100000, max=100000) => Number.isFinite(Number(v)) ? Math.max(min,Math.min(max,Number(v))) : fallback;
const clean = (s) => String(s ?? '').slice(0,2500);
const col = (c, opacity=1) => c && typeof c==='object' ?
  'rgba('+Math.round(finite(c.r,0,0,1)*255)+','+Math.round(finite(c.g,0,0,1)*255)+','+Math.round(finite(c.b,0,0,1)*255)+','+round(finite(opacity,1,0,1),3)+')' : '';
const allowedSource = (s) => {
  if(typeof s!=='string' || s.length>12500000) return null;
  if(/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  try {const u=new URL(s);return u.protocol==='https:'?u.href:null;} catch {return null;}
};
const extractFill = (fills, images={}) => {
  if(!Array.isArray(fills)) return {};
  const first=fills.find(x=>x && x.visible!==false && (x.type==='SOLID'||x.type==='IMAGE'));
  if(!first) return {};
  if(first.type==='IMAGE') {
    return {image:allowedSource(first.imageData||images[first.imageRef]||null)};
  }
  return {background:col(first.color,finite(first.opacity,1,0,1))};
};
function bound(n){
  const b=n?.absoluteBoundingBox || n?.absoluteRenderBounds || {};
  return {x:finite(b.x),y:finite(b.y),w:finite(b.width,n?.size?.x||375,0,12000),h:finite(b.height,n?.size?.y||100,0,24000)};
}
function normalizeNode(n,assets={},counter,depth=0) {
  if(!n||n.visible===false||depth>22||counter.n++>LIMIT||!TYPES.has(n.type)) return null;
  const b=bound(n);
  const style=n.style||{};
  const fills=extractFill(n.fills,assets);
  const strokes=extractFill(n.strokes,assets);
  const layout=n.layoutMode==='HORIZONTAL'?'row':n.layoutMode==='VERTICAL'?'column':'absolute';
  const textFill=n.type==='TEXT'?extractFill(n.fills,assets):{};
  const weight=finite(style.fontWeight,400,100,900);
  const result={
    id:clean(n.id||'figma-'+counter.n).slice(0,120),name:clean(n.name||n.type).slice(0,160),
    kind:n.type==='TEXT'?'text':n.type==='ELLIPSE'?'ellipse':CONTAINERS.has(n.type)?'container':'shape',
    box:b,layout,background:fills.background||null,image:fills.image||null,
    stroke:strokes.background||null,strokeWeight:finite(n.strokeWeight,0,0,24),
    radius:finite(typeof n.cornerRadius==='number'?n.cornerRadius:(Array.isArray(n.rectangleCornerRadii)?n.rectangleCornerRadii[0]:0),0,0,1000),
    opacity:finite(n.opacity,1,0,1),
    gap:finite(n.itemSpacing,0,0,300),padding:[
      finite(n.paddingTop,0,0,500),finite(n.paddingRight,0,0,500),
      finite(n.paddingBottom,0,0,500),finite(n.paddingLeft,0,0,500)],
    primary:n.primaryAxisAlignItems||'MIN',cross:n.counterAxisAlignItems||'MIN',
    text:n.type==='TEXT'?clean(n.characters):undefined,
    font:n.type==='TEXT'?{
      family:clean(style.fontFamily||'Inter').slice(0,90),
      size:finite(style.fontSize,16,7,144),weight,
      line:finite(style.lineHeightPx,0,0,250),
      letter:finite(style.letterSpacing,0,-8,30),
      align:['LEFT','CENTER','RIGHT','JUSTIFIED'].includes(style.textAlignHorizontal)?style.textAlignHorizontal:'LEFT',
      color:textFill.background||'#17202d',
    }:undefined,
    children:[],
  };
  if(n.type==='TEXT') {result.background=null;result.image=null;}
  if(Array.isArray(n.children)) {
    for(const child of n.children){
      const converted=normalizeNode(child,assets,counter,depth+1);
      if(converted) result.children.push(converted);
    }
  }
  return result;
}
function selectRoots(raw, nodeId) {
  if(raw?.format===FIGMA_FORMAT && Array.isArray(raw.blocks)) return raw.blocks;
  if(raw?.nodes && !Array.isArray(raw.nodes)) {
    let hits=Object.entries(raw.nodes).filter(([,v])=>v?.document).map(([id,v])=>({id,...v.document}));
    if(nodeId) hits=hits.filter(x=>x.id===nodeId||x.id?.replaceAll('-',':')===nodeId);
    return hits;
  }
  let node=raw?.document||raw;
  if(Array.isArray(raw?.selection)) return raw.selection;
  if(Array.isArray(raw?.frames)) return raw.frames;
  if(Array.isArray(raw)) return raw;
  if(nodeId) {
    const find=(x)=>x?.id===nodeId?x:(x?.children||[]).map(find).find(Boolean);
    node=find(node);
  }
  if(!node) return [];
  if(node.type==='DOCUMENT'){
    const pages=(node.children||[]).filter(x=>x.type==='CANVAS');
    return pages.flatMap(p=>(p.children||[]).filter(x=>CONTAINERS.has(x.type)));
  }
  if(node.type==='CANVAS')return (node.children||[]).filter(x=>CONTAINERS.has(x.type));
  return [node];
}
export function parseFigmaUrl(url){
  let u;
  try{u=new URL(url);}catch{throw Error('Введите ссылку на файл или фрейм Figma.');}
  if(!/^(www\.)?figma\.com$/i.test(u.hostname))throw Error('Нужна ссылка figma.com.');
  const m=u.pathname.match(/^\/(?:design|file|proto)\/([A-Za-z0-9]+)(?:\/|$)/);
  if(!m)throw Error('Ссылка должна вести на файл Figma Design или Prototype.');
  const raw=u.searchParams.get('node-id');
  return {fileKey:m[1],nodeId:raw?raw.replace(/-/g,':'):null};
}
export function convertFigmaFile(raw, {nodeId=null,imageMap={}}={}){
  if(!raw || typeof raw!=='object') throw Error('Некорректный JSON. Нужна структура Figma.');
  if(raw.format===FIGMA_FORMAT) {
    if(!Array.isArray(raw.blocks)||!raw.blocks.length)throw Error('В экспорте нет фреймов.');
    return {format:FIGMA_FORMAT,source:clean(raw.source||'Figma'),blocks:raw.blocks};
  }
  const originals=selectRoots(raw,nodeId);
  if(!originals.length)throw Error('В файле не найдены фреймы. Выберите Frame в Figma.');
  const counter={n:0};
  const assets={...(raw.images||{}),...(raw.assets||{}),...imageMap};
  const blocks=originals.slice(0,40).map(n=>normalizeNode(n,assets,counter)).filter(Boolean);
  if(!blocks.length)throw Error('В выбранных фреймах нет поддерживаемых слоёв.');
  return {format:FIGMA_FORMAT,source:clean(raw.name||'Figma'),blocks,layerCount:counter.n};
}
export function updateImportedText(node,nodeId,value){
  if(!node||typeof node!=='object')return node;
  if(node.id===nodeId)return {...node,text:String(value).slice(0,2500)};
  if(!node.children?.length)return node;
  let modified=false;
  const children=node.children.map(c=>{const changed=updateImportedText(c,nodeId,value);if(changed!==c)modified=true;return changed;});
  return modified?{...node,children}:node;
}
export function makeFigmaSection(block,index=0){
  const id='FIGMA-'+Date.now().toString(36)+'-'+index+'-'+Math.random().toString(36).slice(2,6);
  const title=clean(block.name||'Figma section').slice(0,75);
  const template={id:'FIGMA-LAYOUT',system:false,category:'Дизайн из Figma',description:'Редактируемая вёрстка Figma',containers:[{cols:12,slots:[{span:12}]}]};
  return {id,titles:{ru:title,en:title,kk:title,ar:title},typeId:'FIGMA-LAYOUT',template,pins:{},
    rules:{mode:'manual',collection:'Все',stockMin:0,l7dMin:0,dedupe:true,oos:'fallback',emptyBehavior:'keep',ttl:15},
    enabled:true,figmaNode:block,figmaSource:'Figma'};
}
