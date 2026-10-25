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
  const baseCategories="const categories = ['Макеты', 'Товары', 'Креативные', 'Эдиториал', 'Главная'];";
  if(app.includes(baseCategories))app=app.replace(baseCategories,"const categories = ['Макеты', 'Макеты из Figma', 'Товары', 'Креативные', 'Эдиториал', 'Главная'];");
  writeFileSync(path,app);
}
const cssPath='src/appv3.css';
let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* figma-slot-templates-v100 */')){css+=String.raw`
/* figma-slot-templates-v100 */
.figma-slot-explanation-v100{padding:13px 14px;border:1px solid #c8d8eb;border-radius:9px;background:#f2f7fe;display:grid;gap:6px}
.figma-slot-explanation-v100 strong{font-size:12px;font-weight:750;color:#263f67}
.figma-import-dialog-v97 .figma-slot-explanation-v100 p{font-size:11px;line-height:1.55;color:#4e627e}
.figma-import-dialog-v97 .figma-slot-explanation-v100 p.figma-slot-error-v100{color:#963a29}
.figma-review-list-v97>label:has(.figma-slot-error-v100){border-color:#e8b6aa}
.figma-review-list-v97>label span:nth-last-child(2){white-space:normal}
.figma-review-list-v97>label small{white-space:normal;line-height:1.45;overflow-wrap:anywhere}
`;writeFileSync(cssPath,css);}
console.log('V100 applied: imported Figma layouts have reusable native content slots');
