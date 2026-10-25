// Figma plugin: export selected frames as a portable JSON document.
// No external network calls and no API token required.
figma.showUI(__html__, {width:460,height:390,title:'Merchtest · Экспорт макета'});
const MAX_NODES=2400;
function num(n,fallback=0){return typeof n==='number'&&isFinite(n)?n:fallback;}
function solidPaint(p) {
  if(!p||typeof p!=='object')return null;
  if(p.type==='SOLID')return {type:'SOLID',visible:p.visible!==false,color:p.color,opacity:num(p.opacity,1)};
  if(p.type==='IMAGE')return {type:'IMAGE',visible:p.visible!==false,imageRef:p.imageHash||null,scaleMode:p.scaleMode};
  return null;
}
const seenImages={};
let visited=0;
async function asNode(n,depth=0){
  if(!n||depth>22||visited++>MAX_NODES)return null;
  const t=n.absoluteTransform||[[1,0,0],[0,1,0]];
  const x=num(t[0]?.[2]),y=num(t[1]?.[2]);
  const width=num(n.width,100),height=num(n.height,100);
  const paints=Array.isArray(n.fills)?n.fills.map(solidPaint).filter(Boolean):[];
  for(const paint of paints){
    if(paint.type!=='IMAGE'||!paint.imageRef||seenImages[paint.imageRef])continue;
    try{
      const image=figma.getImageByHash(paint.imageRef);
      if(!image)continue;
      const bytes=await image.getBytesAsync();
      if(bytes.length<=6*1024*1024){
        const mime='image/png';
        seenImages[paint.imageRef]='data:'+mime+';base64,'+figma.base64Encode(bytes);
      }
    }catch(e){ /* unavailable image will render as an empty media placeholder */ }
  }
  let style;
  if(n.type==='TEXT'){
    const font=n.fontName===figma.mixed?{family:'Inter',style:'Regular'}:n.fontName;
    const fill=paints.find(p=>p.type==='SOLID');
    const computed=n.getRangeAllFontNames?null:null;
    style={
      fontFamily:font?.family||'Inter',
      fontSize:num(n.fontSize===figma.mixed?16:n.fontSize,16),
      fontWeight:/(bold|semibold)/i.test(font?.style||'')?700:/(medium)/i.test(font?.style||'')?500:400,
      textAlignHorizontal:n.textAlignHorizontal||'LEFT',
      lineHeightPx:n.lineHeight===figma.mixed?0:(n.lineHeight?.unit==='PIXELS'?n.lineHeight.value:0),
      letterSpacing:n.letterSpacing===figma.mixed?0:(n.letterSpacing?.unit==='PIXELS'?n.letterSpacing.value:0),
    };
  }
  const o={
    id:n.id,name:n.name,type:n.type,visible:n.visible!==false,
    absoluteBoundingBox:{x,y,width,height},opacity:num(n.opacity,1),
    fills:paints,strokes:Array.isArray(n.strokes)?n.strokes.map(solidPaint).filter(Boolean):[],
    strokeWeight:num(n.strokeWeight,0),
    cornerRadius:typeof n.cornerRadius==='number'?n.cornerRadius:0,
    layoutMode:n.layoutMode||'NONE',itemSpacing:num(n.itemSpacing,0),
    primaryAxisAlignItems:n.primaryAxisAlignItems||'MIN',
    counterAxisAlignItems:n.counterAxisAlignItems||'MIN',
    paddingTop:num(n.paddingTop,0),paddingRight:num(n.paddingRight,0),
    paddingBottom:num(n.paddingBottom,0),paddingLeft:num(n.paddingLeft,0),
    style,
    characters:n.type==='TEXT'?n.characters:undefined,
    children:[],
  };
  if('children' in n){
    for(const child of n.children){const c=await asNode(child,depth+1);if(c)o.children.push(c);}
  }
  return o;
}
figma.ui.onmessage=async message=>{
  if(message.type==='CLOSE'){figma.closePlugin();return;}
  if(message.type!=='EXPORT')return;
  const selected=figma.currentPage.selection;
  if(!selected.length){figma.ui.postMessage({type:'ERROR',message:'Выделите один или несколько фреймов в Figma.'});return;}
  visited=0;
  for(const k of Object.keys(seenImages))delete seenImages[k];
  try{
    const frames=[];
    for(const n of selected.slice(0,40)){const data=await asNode(n);if(data)frames.push(data);}
    figma.ui.postMessage({type:'DATA',data:{name:figma.root.name,selection:frames,images:seenImages}});
  }catch(e){
    figma.ui.postMessage({type:'ERROR',message:'Ошибка экспорта: '+(e?.message||e)});
  }
};
