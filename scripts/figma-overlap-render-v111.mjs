import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',cssPath='src/appv3.css',MARK='FIGMA_OVERLAP_RENDER_V111';
let app=readFileSync(path,'utf8');
if(!app.includes(MARK)){
  const anchor='const FIGMA_SLOT_TEMPLATES_V100 = true;';
  if(!app.includes(anchor))throw Error(MARK+': Figma type runtime missing');
  app=app.replace(anchor,anchor+'\n'+ "const FIGMA_OVERLAP_RENDER_V111 = true;\n// Overlap mode uses normalized Figma frame geometry, not 12-column rounding.\n// These custom properties survive older responsive CSS with !important heights.\nfunction figmaOverlayCanvasVarsV111(container){\n  if(!container?.figmaOverlayV111)return {};\n  const {width=1200,height=600}=container.figmaFrameV111||{};\n  return {'--figma-ratio-v111':String(Math.max(1,Number(width)))+' / '+String(Math.max(1,Number(height)))};\n}\nfunction figmaOverlaySlotVarsV111(shape,container,isRaised=false){\n  if(!container?.figmaOverlayV111||!shape?.sourceBox)return {};\n  const {width=1200,height=600}=container.figmaFrameV111||{};\n  const w=Math.max(1,Number(width)),h=Math.max(1,Number(height));\n  const box=shape.sourceBox;\n  const pct=(value,total)=>(Math.round(Number(value||0)/total*100000)/1000)+'%';\n  const order=Math.max(0,Number(shape.figmaLayerOrderV111)||0);\n  return {'--figma-x-v111':pct(box.x,w),\n    '--figma-y-v111':pct(box.y,h),\n    '--figma-w-v111':pct(box.w,w),\n    '--figma-h-v111':pct(box.h,h),\n    '--figma-z-v111':String(isRaised?1000+order:order+1)};\n}");
  function chunk(name){const at=app.indexOf('function '+name+'(');const end=at>=0?app.indexOf('\nfunction ',at+10):-1;if(at<0||end<0)throw Error(MARK+': missing '+name);return {at,end,s:app.slice(at,end)};}
  let preview=chunk('TypePreview');
  let p=preview.s;
  if(!p.includes('className="type-preview-grid"'))throw Error(MARK+': type preview grid missing');
  p=p.replace('className="type-preview-grid"',"className={'type-preview-grid'+(container.figmaOverlayV111?' figma-overlay-grid-v111':'')}");
  const previewGrid=p.indexOf("className={'type-preview-grid'+");
  const previewStyle=p.indexOf('style={{',previewGrid);
  if(previewStyle<0)throw Error(MARK+': type preview style missing');
  p=p.slice(0,previewStyle)+p.slice(previewStyle).replace('style={{','style={{ ...figmaOverlayCanvasVarsV111(container),');
  const spanStyle='style={{ gridColumn: slot.start';
  if(!p.includes(spanStyle))throw Error(MARK+': type preview slot placement missing');
  p=p.replace(spanStyle,'style={{ ...figmaOverlaySlotVarsV111(slot,container), gridColumn: slot.start');
  app=app.slice(0,preview.at)+p+app.slice(preview.end);
  let canvas=chunk('SectionCanvas');
  let c=canvas.s;
  const signature=c.indexOf(') {');
  if(signature<0)throw Error(MARK+': section component signature missing');
  c=c.slice(0,signature+3)+'\n  const [figmaEditableLayerV111,setFigmaEditableLayerV111]=useState(null);'+c.slice(signature+3);
  if(!c.includes('className="slot-grid"'))throw Error(MARK+': canvas grid missing');
  c=c.replace('className="slot-grid"',"className={'slot-grid'+(container.figmaOverlayV111?' figma-overlay-grid-v111':'')}");
  const gridAt=c.indexOf("className={'slot-grid'+");
  const styleAt=c.indexOf('style={{',gridAt);
  if(styleAt<0)throw Error(MARK+': canvas grid style missing');
  c=c.slice(0,styleAt)+c.slice(styleAt).replace('style={{','style={{ ...figmaOverlayCanvasVarsV111(container),');
  const wrapAt=c.indexOf('v2-slot-wrap');
  const wrapStyle=c.indexOf('style={{',wrapAt);
  if(wrapAt<0||wrapStyle<0)throw Error(MARK+': slot wrapper missing');
  c=c.slice(0,wrapStyle)+c.slice(wrapStyle).replace('style={{','style={{ ...figmaOverlaySlotVarsV111(shape,container,editable && selected && figmaEditableLayerV111===slotIndex),');
  const sectionContent='<div className="section-containers">';
  if(!c.includes(sectionContent))throw Error(MARK+': section content missing');
  const layerNav="{editable&&selected&&containers.some(c=>c.figmaOverlayV111)&&<div className=\"figma-layer-nav-v111\" role=\"toolbar\" aria-label=\"Слои Figma\"><span>Слои Figma</span><button type=\"button\" className={figmaEditableLayerV111==null?'active':''} onClick={e=>{e.stopPropagation();setFigmaEditableLayerV111(null)}}>Как в макете</button>{(containers.find(c=>c.figmaOverlayV111)?.slots||[]).map((item,index)=><button key={item.figmaNodeId||index} type=\"button\" className={figmaEditableLayerV111===item.slotIndex?'active':''} title={'Вывести слот '+(item.slotIndex+1)+' вперёд для редактирования'} onClick={e=>{e.stopPropagation();setFigmaEditableLayerV111(item.slotIndex)}}>{'Слот '+(item.slotIndex+1)}</button>)}<small>Выбор временно выводит слот вперёд</small></div>}";
  c=c.replace(sectionContent,layerNav+sectionContent);
  app=app.slice(0,canvas.at)+c+app.slice(canvas.end);
  app=app.replace(anchor,anchor);
  writeFileSync(path,app);
}
let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* Figma V111: pixel-faithful overlapping')){css+="\n/* Figma V111: pixel-faithful overlapping empty content slots */\n.builder-section.layout-v2 .slot-grid.figma-overlay-grid-v111,\n.storefront-frame.mobile .builder-section.layout-v2 .slot-grid.figma-overlay-grid-v111,\n.storefront-frame.tablet .builder-section.layout-v2 .slot-grid.figma-overlay-grid-v111{\n  position:relative!important;display:block!important;box-sizing:border-box!important;\n  width:100%!important;height:auto!important;min-height:0!important;\n  max-height:none!important;aspect-ratio:var(--figma-ratio-v111)!important;\n  overflow:visible!important;grid-template-columns:none!important;grid-template-rows:none!important;\n}\n.builder-section.layout-v2 .slot-grid.figma-overlay-grid-v111>.v2-slot-wrap,\n.storefront-frame.mobile .builder-section.layout-v2 .slot-grid.figma-overlay-grid-v111>.v2-slot-wrap,\n.storefront-frame.tablet .builder-section.layout-v2 .slot-grid.figma-overlay-grid-v111>.v2-slot-wrap{\n  display:block!important;position:absolute!important;left:var(--figma-x-v111)!important;\n  top:var(--figma-y-v111)!important;width:var(--figma-w-v111)!important;\n  height:var(--figma-h-v111)!important;max-width:none!important;\n  min-height:0!important;margin:0!important;padding:0!important;\n  z-index:var(--figma-z-v111,1)!important;align-self:auto!important;\n  aspect-ratio:auto!important;box-sizing:border-box!important;\n}\n.builder-section.layout-v2 .figma-overlay-grid-v111>.v2-slot-wrap>.lego-slot{\n  width:100%!important;height:100%!important;min-height:0!important;\n}\n.type-preview-grid.figma-overlay-grid-v111{\n  display:block!important;position:relative!important;min-height:0!important;\n  width:100%!important;height:auto!important;aspect-ratio:var(--figma-ratio-v111)!important;\n  grid-template-rows:none!important;overflow:visible!important;\n}\n.type-preview-grid.figma-overlay-grid-v111>span{\n  position:absolute!important;display:grid!important;place-items:center!important;\n  left:var(--figma-x-v111)!important;top:var(--figma-y-v111)!important;\n  width:var(--figma-w-v111)!important;height:var(--figma-h-v111)!important;\n  z-index:var(--figma-z-v111,1)!important;\n  min-height:0!important;max-height:none!important;aspect-ratio:auto!important;\n  box-sizing:border-box!important;\n}\n.figma-layer-nav-v111{display:flex;align-items:center;gap:5px;min-width:0;\n  padding:7px 8px;background:#f6f8fc;border-bottom:1px solid #dfe6f1;\n  overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin}\n.figma-layer-nav-v111>span{white-space:nowrap;font-size:10px;font-weight:700;color:#586a85;margin-right:4px}\n.figma-layer-nav-v111>button{flex:0 0 auto;padding:5px 8px;border:1px solid #d7e2f0;\n  border-radius:5px;background:white;color:#48637e;font-size:10px;cursor:pointer}\n.figma-layer-nav-v111>button.active{border-color:#255bc4;background:#eaf1ff;\n  color:#2056b5;font-weight:750}\n.figma-layer-nav-v111>small{white-space:nowrap;color:#8290a3;font-size:9px}\n.figma-mini-overlap-v111{position:relative!important;display:block!important;\n  width:100%;height:108px;min-height:0!important;grid-template-columns:none!important;\n  grid-template-rows:none!important;overflow:visible!important}\n.figma-mini-overlap-v111>span{position:absolute!important;left:var(--mini-x-v111)!important;\n  top:var(--mini-y-v111)!important;width:var(--mini-w-v111)!important;\n  height:var(--mini-h-v111)!important;z-index:var(--mini-z-v111,1)!important;\n  box-sizing:border-box!important}\n@media(max-width:720px){.figma-layer-nav-v111>small{display:none}}\n";writeFileSync(cssPath,css);}
console.log('V111 applied: native overlapping Figma slots, paint-order and layer-selection toolbar');
