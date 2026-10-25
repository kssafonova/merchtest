// Convert Figma framing geometry into first-class merchtest layout slots.
// Figma defines ONLY the grid. Product/Look/Media content stays empty and editable.
const EXPLICIT = /(?:^|[\s/:[({_-])(?:slot|slots|слот|слоты|placeholder|плейсхолдер|товар|product|карточка|card|image|photo|фото|media|контент)(?:$|[\s/:\])}_#-])/i;
const SKIP = /\b(?:background|bg|overlay|shadow|divider|logo|header|footer|nav|icon|button|text)\b|фон|подложка|разделитель|кнопка|иконка|навигац|текст/i;
const LIMIT=20;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,Number(x)||min));
const rounded=(x)=>Math.round(x*100)/100;
function rect(n){
  const b=n?.box||{};
  return {x:Number(b.x)||0,y:Number(b.y)||0,w:Math.max(0,Number(b.w)||0),h:Math.max(0,Number(b.h)||0)};
}
function overlaps(a,b){
  const w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
  const h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  return w*h;
}
function safeName(s){
  return String(s||'').trim().slice(0,100);
}
function usable(box,root){
  return box.w>=Math.max(35,root.w*0.085)&&box.h>=Math.max(40,root.h*0.085)&&
    box.w<=root.w*1.15&&box.h<=root.h*1.15;
}
function visualCandidates(block){
  const root=rect(block);
  if(root.w<100||root.h<60)throw Error('Фрейм слишком маленький. Выберите макет секции в Figma.');
  const explicit=[],visual=[],geometry=[];
  function walk(node,depth=0){
    if(!node||depth>9||node.kind==='text')return;
    const b=rect(node);
    const n=safeName(node.name);
    if(SKIP.test(n)&&!EXPLICIT.test(n))return;
    const ok=usable(b,root);
    if(ok&&EXPLICIT.test(n)){
      explicit.push({node,box:b,depth,source:'named'});
      return; // descendants of a named slot are its visual placeholders, not new slots.
    }
    const children=Array.isArray(node.children)?node.children:[];
    for(const child of children)walk(child,depth+1);
    if(!ok||depth===0)return;
    const item={node,box:b,depth,source:'geometry'};
    if(node.image)visual.push({...item,source:'image'});
    if(!children.length&&node.kind!=='ellipse')geometry.push(item);
    // Empty Auto Layout cell is also a valid candidate, even if it has no fill.
    if(node.kind==='container'&&(!children.length||children.every(x=>x.kind==='text')))geometry.push(item);
  }
  for(const child of block.children||[])walk(child,1);
  if(explicit.length)return {source:'named',nodes:explicit};
  if(visual.length)return {source:'image',nodes:visual};
  // When Figma uses a wrapper frame around a row, prefer its cells (deepest leaves).
  if(geometry.length)return {source:'geometry',nodes:geometry};
  const direct=(block.children||[]).filter(n=>n.kind==='container'&&usable(rect(n),root)).map(n=>({node:n,box:rect(n),depth:1,source:'frame'}));
  if(direct.length)return {source:'frame',nodes:direct};
  // An empty frame is a valid single full-width content placeholder.
  return {source:'frame',nodes:[{node:block,box:root,depth:0,source:'frame'}]};
}
function cleanCandidates(items,root){
  const sorted=[...items].sort((a,b)=>a.box.y-b.box.y||a.box.x-b.box.x||b.depth-a.depth);
  const result=[];
  for(const candidate of sorted){
    const a=candidate.box;
    // Remove duplicate/parent placeholders if they cover nearly the same footprint.
    if(result.some(other=>{
      const b=other.box;
      return overlaps(a,b)>=.82*Math.min(a.w*a.h,b.w*b.h);
    }))continue;
    result.push(candidate);
    if(result.length>=LIMIT)break;
  }
  if(!result.length)throw Error('Не удалось определить слоты. Назовите слои Slot 1, Slot 2 и повторите импорт.');
  if(result.length>=LIMIT&&items.length>LIMIT){
    // Truncating a design creates an incomplete section without warning, reject instead.
    throw Error('В макете больше 20 слотов. Разбейте его на несколько фреймов Figma.');
  }
  return result;
}
function rowEdges(slots,root){
  const ys=[root.y,...slots.flatMap(o=>[o.box.y,o.box.y+o.box.h])];
  ys.sort((a,b)=>a-b);
  const tolerance=clamp(root.h*.017,5,16);
  const clusters=[];
  for(const y of ys){
    const last=clusters[clusters.length-1];
    if(last&&Math.abs(y-last.value)<tolerance){
      last.value=(last.value*last.count+y)/(++last.count);
    }else clusters.push({value:y,count:1});
  }
  // Too many near-distinct Y-coordinates indicate decorative geometry.
  if(clusters.length>22)throw Error('Слишком сложная вертикальная сетка. Назовите нужные элементы Slot 1, Slot 2 и т. д.');
  return clusters.map(x=>x.value);
}
function indexOfClosest(values,x){
  let best=0,dist=Infinity;
  values.forEach((v,i)=>{const d=Math.abs(v-x);if(d<dist){best=i;dist=d;}});
  return best;
}
function buildDesktop(slots,root){
  const edges=rowEdges(slots,root);
  const generated=slots.map((item,i)=>{
    const b=item.box;
    const start=clamp(Math.round((b.x-root.x)/root.w*12)+1,1,12);
    const right=clamp(Math.round((b.x+b.w-root.x)/root.w*12),start,12);
    const span=clamp(right-start+1,1,13-start);
    const top=indexOfClosest(edges,b.y);
    const bottom=indexOfClosest(edges,b.y+b.h);
    return {
      slotIndex:i,start,span,rowStart:top+1,rows:clamp(bottom-top,1,20),
      ratio:b.w>=b.h?'landscape':'portrait',
      figmaLayerName:safeName(item.node.name)||'Слот '+(i+1),
      figmaNodeId:String(item.node.id||''),
      sourceBox:{x:rounded(b.x-root.x),y:rounded(b.y-root.y),w:rounded(b.w),h:rounded(b.h)},
    };
  });
  for(let i=0;i<generated.length;i++){
    const a=generated[i];
    for(let j=0;j<i;j++){
      const b=generated[j];
      const rowCollision=a.rowStart<b.rowStart+b.rows&&b.rowStart<a.rowStart+a.rows;
      const colCollision=a.start<b.start+b.span&&b.start<a.start+a.span;
      if(rowCollision&&colCollision)throw Error('Слоты пересекаются на сетке 12 колонок. Раздвиньте их или измените границы фреймов в Figma.');
    }
  }
  return generated;
}
function mobileLayout(slots){
  const result=[];
  let row=1,column=1;
  // Preserve slot indices irrespective of the adaptive visual order.
  for(const slot of slots){
    const wide=slot.span>=8||slot.rows>1;
    if(wide){
      if(column!==1){row++;column=1;}
      result.push({...slot,start:1,span:4,rowStart:row,rows:Math.min(slot.rows,2)});
      row+=Math.min(slot.rows,2);column=1;
    }else{
      result.push({...slot,start:column,span:2,rowStart:row,rows:1});
      column=column===1?3:1;
      if(column===1)row++;
    }
  }
  return result;
}
function container(cols,slots){
  return {
    cols,rows:Math.max(1,...slots.map(s=>s.rowStart+s.rows-1)),
    columnGap:4,rowGap:4,
    container:{mode:'full',width:'100%',maxWidth:null,align:'center',marginLeft:0,marginRight:0,paddingLeft:0,paddingRight:0},
    slots,
  };
}
export function deriveFigmaSlotTemplate(block){
  if(!block||typeof block!=='object')throw Error('Пустой фрейм Figma.');
  const root=rect(block);
  const detected=visualCandidates(block);
  const candidates=cleanCandidates(detected.nodes,root);
  const slots=buildDesktop(candidates,root);
  return {
    id:'FIGMA-TYPE-'+String(block.id||'frame').replace(/[^a-z0-9]/ig,'-')+'-'+Math.random().toString(36).slice(2,8),
    label:safeName(block.name)||'Макет из Figma',
    system:false,layoutV2:true,figmaImportedV100:true,
    category:'Макеты из Figma',description:'Импортированная геометрия · '+slots.length+' слотов · Desktop 12 / Mobile 4',
    tags:['Figma','12→4','слоты'],containers:[container(12,slots)],
    mobileContainers:[container(4,mobileLayout(slots))],
    figmaMetaV100:{frameId:String(block.id||''),frameName:safeName(block.name),sourceSize:root,method:detected.source},
  };
}
export function makeFigmaSlotSection(block,index=0){
  const template=deriveFigmaSlotTemplate(block);
  const id='S-'+template.id+'-'+index;
  const title=template.label;
  return {
    id,typeId:template.id,template,figmaSlotTemplateV100:true,
    titles:{ru:title,en:title,kk:title,ar:title},
    pins:{},enabled:true,
    rules:{mode:'manual',collection:'Все',stockMin:0,l7dMin:0,dedupe:true,oos:'fallback',emptyBehavior:'keep',ttl:15},
  };
}
export function inspectFigmaSlots(block){
  const type=deriveFigmaSlotTemplate(block);
  return {
    count:type.containers[0].slots.length,
    method:type.figmaMetaV100.method,
    desktop:type.containers[0].slots.map(x=>({name:x.figmaLayerName,start:x.start,span:x.span,rowStart:x.rowStart,rows:x.rows})),
    mobile:type.mobileContainers[0].slots.map(x=>({name:x.figmaLayerName,start:x.start,span:x.span,rowStart:x.rowStart,rows:x.rows})),
  };
}
