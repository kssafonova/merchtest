import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',MARKER='FIGMA_SLOT_TEMPLATES_V100';
let app=readFileSync(path,'utf8');
function patch(before,after,label){if(!app.includes(before))throw Error(MARKER+': missing '+label);app=app.replace(before,after);}
if(!app.includes(MARKER)){
  const anchor='const FIGMA_EDITOR_BRIDGE_V97 = true;';
  const helpers=['const '+MARKER+' = true;',
    'function registerFigmaTypeV100(type){',
    '  if(!type?.figmaImportedV100||!Array.isArray(type.containers)||!type.id)return;',
    '  if(!TYPE_LIBRARY.some(existing=>existing.id===type.id))TYPE_LIBRARY.push(type);',
    '}'].join('\n');
  patch(anchor,anchor+'\n'+helpers,'V97 marker');
  const callback='  const importFigmaSectionsV97=(nextSections,mode)=>{\n    if(!nextSections?.length)return;';
  patch(callback,callback+'\n    nextSections.forEach(section=>registerFigmaTypeV100(section?.template));','import callback');
  const pageId='  const pageId = pageIdByRegion[region];';
  const restore='  useEffect(()=>{Object.values(pageSections||{}).forEach(pages=>Object.values(pages||{}).forEach(sections=>{if(Array.isArray(sections))sections.forEach(section=>registerFigmaTypeV100(section?.template));}));},[pageSections]);\n';
  patch(pageId,restore+pageId,'type registry hydration');
  writeFileSync(path,app);
}
console.log('V100 applied: imported Figma layouts have reusable native content slots');
