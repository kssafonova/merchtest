import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='MEDIA_PAGER_VERTICAL_V71';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const MOBILE_CANVAS_STABILITY_V70 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V70 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // One shared pager for cards in the content browser and entities already placed in section slots.
  const pagerPart=functionChunk(app,'ContentMediaPagerV69');
  const pager=String.raw`function ContentMediaPagerV69({entity, slot=false}){
  const items=contentMediaItemsV69(entity);
  const [activeV69,setActiveV69]=useState(0);
  if(!items.length) return null;
  const safeIndex=Math.min(activeV69,items.length-1);
  const active=items[safeIndex];
  return <>
    {safeIndex>0 && <div className={'content-media-preview-override-v69 '+(slot?'slot-preview-override-v71':'')}>{active.kind==='video' ? <video src={active.src} muted playsInline autoPlay loop/> : <img src={active.src} alt=""/>}</div>}
    <div className={'content-media-pager-v69 '+(slot?'slot-media-pager-v71':'library-media-pager-v71')} aria-label={'Медиа: '+items.length} onClick={(event)=>{event.preventDefault();event.stopPropagation();}}>
      {items.map((item,index)=><button type="button" key={item.key+'-'+index} className={safeIndex===index?'active':''} onMouseDown={(event)=>{event.preventDefault();event.stopPropagation();}} onClick={(event)=>{event.preventDefault();event.stopPropagation();setActiveV69(index);}} title={'Медиа '+(index+1)} aria-label={'Показать медиа '+(index+1)}>{index+1}</button>)}
    </div>
  </>;
}`;
  app=app.slice(0,pagerPart.start)+pager+app.slice(pagerPart.end);

  // Pager must remain visible and interactive after the entity is placed into a section slot.
  const slotPart=functionChunk(app,'Slot');
  let slotChunk=slotPart.chunk;
  const overlay='<ContentMetricOverlayV47 entity={slot.entity} region={region} slot/>';
  if(!slotChunk.includes(overlay)) throw new Error(MARKER+': slot metric overlay anchor missing');
  if(!slotChunk.includes('<ContentMediaPagerV69 entity={slot.entity} slot/>')){
    slotChunk=slotChunk.replace(overlay,'<ContentMediaPagerV69 entity={slot.entity} slot/>'+overlay);
  }
  app=app.slice(0,slotPart.start)+slotChunk+app.slice(slotPart.end);

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* media-pager-vertical-v71 */')){
  css+=String.raw`
/* media-pager-vertical-v71 */
/* Media selectors are persistent 15x15 authoring controls. Count equals the actual media count. */
.content-media-pager-v69{
  position:absolute!important;
  top:7px!important;
  left:6px!important;
  z-index:31!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:flex-start!important;
  gap:2px!important;
  width:15px!important;
  max-width:15px!important;
  max-height:calc(100% - 14px)!important;
  overflow-x:hidden!important;
  overflow-y:auto!important;
  scrollbar-width:none!important;
  overscroll-behavior:contain!important;
}
.content-media-pager-v69::-webkit-scrollbar{display:none!important}
.content-media-pager-v69>button{
  box-sizing:border-box!important;
  width:15px!important;
  height:15px!important;
  min-width:15px!important;
  min-height:15px!important;
  flex:0 0 15px!important;
  margin:0!important;
  padding:0!important;
  display:grid!important;
  place-items:center!important;
  border:1px solid rgba(17,17,17,.22)!important;
  border-radius:2px!important;
  background:rgba(255,255,255,.94)!important;
  color:#555!important;
  font-size:7px!important;
  line-height:1!important;
  font-weight:600!important;
  box-shadow:none!important;
  cursor:pointer!important;
}
.content-media-pager-v69>button:hover{border-color:#111!important;color:#111!important;background:#fff!important}
.content-media-pager-v69>button.active{border-color:#111!important;background:#111!important;color:#fff!important}

/* Selected media fully replaces the entity preview without changing card/slot geometry. */
.content-media-preview-override-v69{
  position:absolute!important;
  inset:0!important;
  z-index:30!important;
  width:100%!important;
  height:100%!important;
  overflow:hidden!important;
  background:#f6f6f4!important;
  pointer-events:none!important;
}
.content-media-preview-override-v69>img,.content-media-preview-override-v69>video{
  width:100%!important;
  height:100%!important;
  display:block!important;
  object-fit:cover!important;
}

/* A placed content entity keeps exactly the same pager on canvas. */
.lego-slot.filled{position:relative!important}
.lego-slot.filled>.slot-media-pager-v71,.lego-slot.filled .slot-media-pager-v71{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  top:7px!important;
  left:6px!important;
  z-index:31!important;
}
.lego-slot.filled>.slot-preview-override-v71,.lego-slot.filled .slot-preview-override-v71{z-index:30!important}

/* Keep operational KPI overlay readable on top of switched media. */
.content-card-media-v47>.content-metric-overlay-v47{z-index:32!important}
.lego-slot.filled>.content-metric-overlay-v47,.lego-slot.filled .content-metric-overlay-v47{z-index:32!important}

/* The 15px control size is preserved in the 375px emulator too. */
.storefront-frame.mobile .content-media-pager-v69{width:15px!important;max-width:15px!important;top:6px!important;left:6px!important;gap:2px!important}
.storefront-frame.mobile .content-media-pager-v69>button{width:15px!important;height:15px!important;min-width:15px!important;min-height:15px!important;flex-basis:15px!important;font-size:7px!important}
`;
  writeFileSync(cssPath,css);
}

console.log('V71 applied: vertical 15px media pager persists in library cards and placed section slots');
