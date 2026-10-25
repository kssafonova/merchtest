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
  if(app.includes(baseCategories))app=app.replace(baseCategories,"const categories = ['Макеты', 'Секция', 'Макеты из Figma', 'Товары', 'Креативные', 'Эдиториал', 'Главная'];");
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
if(!css.includes('/* figma-json-paste-v101 */')){css+=String.raw`
/* figma-json-paste-v101 */
.figma-paste-json-v101{border:1px solid #e1e7f0;border-radius:9px;margin-top:12px;background:#fff}
.figma-paste-json-v101>summary{display:flex;align-items:center;gap:9px;padding:12px 14px;font-size:12px;font-weight:650;color:#344a65;cursor:pointer}
.figma-paste-json-v101[open]>summary{border-bottom:1px solid #e1e7f0}
.figma-paste-form-v101{display:grid;gap:9px;padding:14px}
.figma-paste-form-v101 label{font-size:11px;color:#546277}
.figma-paste-form-v101 textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:112px;max-height:280px;border:1px solid #cbd7e8;border-radius:8px;background:#fff;padding:12px;line-height:1.5;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;color:#27364b}
.figma-paste-form-v101 textarea:focus{outline:2px solid #245bc3;outline-offset:1px}
.figma-paste-form-v101 button{justify-self:start;min-height:36px;border-radius:7px;background:#fff;color:#245bc3;border:1px solid #245bc3;padding:0 12px;font-size:11px;font-weight:700;cursor:pointer}
.figma-paste-form-v101 button:disabled{opacity:.4;cursor:default}
`;writeFileSync(cssPath,css);}
if(!css.includes('/* figma-miniature-toggle-v102 */')){css+=String.raw`
/* figma-miniature-toggle-v102 */
.figma-miniature-option-v102{display:flex;align-items:flex-start;gap:10px;padding:13px 14px;background:#fff9ec;border:1px solid #eedbb1;border-radius:9px;cursor:pointer}
.figma-miniature-option-v102 input{width:16px;height:16px;flex:0 0 auto;margin:2px 0 0;accent-color:#245bc3}
.figma-miniature-option-v102 span{display:grid;gap:5px}
.figma-miniature-option-v102 strong{color:#6c4f1e;font-size:12px;font-weight:750}
.figma-miniature-option-v102 small{font-size:10.5px;line-height:1.5;color:#7b643c}
`;writeFileSync(cssPath,css);}
console.log('V100 applied: imported Figma layouts have reusable native content slots');
