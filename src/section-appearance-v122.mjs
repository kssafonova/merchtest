// A single source of truth for the section's visible appearance in editor and preview.
const hex = (value,fallback)=>/^#[0-9a-f]{6}$/i.test(String(value||''))?String(value).toUpperCase():fallback;
const padding=(value)=>Math.min(240,Math.max(0,Number.isFinite(Number(value))?Number(value):0));
export function sectionAppearanceV122(style={}){
  const legacy=style.padding??0;
  return {background:hex(style.background,'#FFFFFF'),textColor:hex(style.textColor,'#111111'),
    paddingTop:padding(style.paddingTop??legacy),paddingBottom:padding(style.paddingBottom??legacy),
    hideElements:Boolean(style.hideElements)};
}
export function sectionStyleVarsV122(style={}){
  const values=sectionAppearanceV122(style);
  return {'--merch-section-bg-v122':values.background,'--merch-section-ink-v122':values.textColor,
    '--merch-section-top-v122':values.paddingTop+'px','--merch-section-bottom-v122':values.paddingBottom+'px'};
}
export function applySectionAppearanceV122(section,patch){
  const safe={...patch};
  if(Object.hasOwn(safe,'background'))safe.background=hex(safe.background,sectionAppearanceV122(section?.styleV57).background);
  if(Object.hasOwn(safe,'textColor'))safe.textColor=hex(safe.textColor,sectionAppearanceV122(section?.styleV57).textColor);
  for(const key of ['paddingTop','paddingBottom'])if(Object.hasOwn(safe,key))safe[key]=padding(safe[key]);
  return {...section,styleV57:{...(section.styleV57||{}),...safe}};
}
