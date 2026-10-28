import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',marker='MERCH_LIFECYCLE_V125';
let app=readFileSync(path,'utf8');
function replaceOnce(source,before,after,name){
  const n=source.split(before).length-1;
  if(n!==1)throw new Error(marker+': '+name+' expected once, got '+n);
  return source.replace(before,after);
}
if(!app.includes('const '+marker+' = true;')){
  app=replaceOnce(app,'const MERCH_STUDIO_EXPERIENCE_V123 = true;',
    'const MERCH_STUDIO_EXPERIENCE_V123 = true;\nconst '+marker+' = true;','post-studio marker');
  app="import MerchLifecyclePolicyV125 from './MerchLifecyclePolicyV125.jsx';\nimport {attachDemoLifecycleV125,isComingSoonV125} from './merch-lifecycle-v125.mjs';\n"+app;
  app=replaceOnce(app,
    'const PRODUCTS = applyMarketStockV87([...expandColorVariants(CATALOG_PRODUCTS), ...FEED_PRODUCTS]);',
    'const PRODUCTS = attachDemoLifecycleV125(applyMarketStockV87([...expandColorVariants(CATALOG_PRODUCTS), ...FEED_PRODUCTS]));',
    'synthetic market fixture');
  const start=app.indexOf('function resolveSectionV63(');
  const end=app.indexOf('\nfunction resolveSectionsMasterV63(',start);
  if(start<0||end<0)throw new Error(marker+': automation resolver missing');
  let resolver=app.slice(start,end);
  resolver=replaceOnce(resolver,
    "const availableRaw = rawCandidates.filter((product)=>Number(automationProductValueV63(product,'stock',region))>0);",
    "const availableRaw = rawCandidates.filter((product)=>Number(automationProductValueV63(product,'stock',region))>0||(teaserEnabledV125&&isComingSoonV125(product,region)));",
    'allow only explicit teasers');
  // Keep the saved ranking order. Coming Soon must not silently jump ahead of configured sort.
  resolver=replaceOnce(resolver,
    "      const inStock = Number(automationProductValueV63(entity,'stock',region))>0;",
    "      const inStock = Number(automationProductValueV63(entity,'stock',region))>0;\n      if(teaserEnabledV125&&isComingSoonV125(entity,region)){remember(entity,'pin');slots.push({index,status:'pin',entity,origin:'manual',warning:'Скоро в продаже',lifecycleV125:'coming_soon'});continue;}",
    'retain coming soon pinned in announcement');
  resolver=replaceOnce(resolver,
    "if (next) { remember(next,'auto'); slots.push({index,status:'auto',entity:next,origin:'automation'}); continue; }",
    "if (next) { remember(next,'auto'); slots.push({index,status:'auto',entity:next,origin:'automation',warning:isComingSoonV125(next,region)?'Скоро в продаже':null,lifecycleV125:isComingSoonV125(next,region)?'coming_soon':null}); continue; }",
    'auto coming soon status');
  app=app.slice(0,start)+resolver+app.slice(end);
  // A Coming Soon label must remain visible in actual storefront preview, where editor warnings are hidden.
  const cardStart=app.indexOf('function ProductCard('),cardEnd=app.indexOf('\nfunction ',cardStart+20);
  if(cardStart<0||cardEnd<0)throw new Error(marker+': ProductCard missing');
  let productCard=app.slice(cardStart,cardEnd);
  productCard=replaceOnce(productCard,'<div className="merch-card-media">',
    '<div className="merch-card-media">{isComingSoonV125(product,region)&&<span className="merch-coming-soon-badge-v125">Скоро в продаже</span>}',
    'storefront coming soon badge');
  app=app.slice(0,cardStart)+productCard+app.slice(cardEnd);
  const canvasStart=app.indexOf('function SectionCanvas('),canvasEnd=app.indexOf('\nfunction ',canvasStart+20);
  if(canvasStart<0||canvasEnd<0)throw new Error(marker+': SectionCanvas missing');
  let canvas=app.slice(canvasStart,canvasEnd);
  const sig=/function SectionCanvas\(\{([^}]*)\}\) \{/;
  if(!sig.test(canvas))throw new Error(marker+': canvas props changed');
  canvas=canvas.replace(sig,(whole,args)=>'function SectionCanvas({'+args+',onMerchPolicyChangeV125 }) {');
  canvas=replaceOnce(canvas,'<div className="section-containers"',
    "{selected && editable!==false && !analyticsModeV120 && <MerchLifecyclePolicyV125 section={section} region={region} onChange={onMerchPolicyChangeV125}/>}<div className=\"section-containers\"",
    'commercial controls in editable section');
  app=app.slice(0,canvasStart)+canvas+app.slice(canvasEnd);
  let canvasTagCount=0;
  app=app.replace(/<SectionCanvas\b[\s\S]*?\/>/g,tag=>{
    canvasTagCount++;
    if(tag.includes('onMerchPolicyChangeV125='))return tag;
    return tag.slice(0,-2)+"\n onMerchPolicyChangeV125={patch=>updateSection(section.id,existing=>({...existing,merchPolicyV125:{...existing.merchPolicyV125,...patch}}))}"+' />';
  });
  if(canvasTagCount!==1)throw new Error(marker+': expected one SectionCanvas, got '+canvasTagCount);
  writeFileSync(path,app);
}
console.log('V125: separate coming-soon lifecycle, objective-specific rules and section controls integrated');
