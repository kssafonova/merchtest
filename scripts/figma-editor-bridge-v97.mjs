import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx', MARKER='FIGMA_EDITOR_BRIDGE_V97';
let app=readFileSync(path,'utf8');
function swap(before,after,label){if(!app.includes(before))throw Error(MARKER+': missing '+label);app=app.replace(before,after);}
if(!app.includes(MARKER)){
  swap("import './appv3.css';","import './appv3.css';\nimport {FigmaImportDialog,FigmaRenderedLayout} from './FigmaBridge.jsx';\nimport {updateImportedText} from './figma-bridge.mjs';\nconst "+MARKER+" = true;",'imports');

  // Existing patch pipeline owns the initial state expressions; hydrate after mount
  // to preserve all region-specific default pages and seeded layouts.
  swap("  const pageId = pageIdByRegion[region];",
    "  useEffect(()=>{try{const trees=JSON.parse(localStorage.getItem('merchtest-site-trees-v97'));if(trees&&typeof trees==='object')setSiteTrees(prev=>({...prev,...trees}));const pages=JSON.parse(localStorage.getItem('merchtest-page-sections-v97'));if(pages&&typeof pages==='object')setPageSections(prev=>({...prev,...pages}));}catch{}setFigmaPersistenceReadyV97(true);},[]);\n  useEffect(()=>{if(!figmaPersistenceReadyV97)return;try{localStorage.setItem('merchtest-site-trees-v97',JSON.stringify(siteTrees));}catch{}},[siteTrees,figmaPersistenceReadyV97]);\n  useEffect(()=>{if(!figmaPersistenceReadyV97)return;try{localStorage.setItem('merchtest-page-sections-v97',JSON.stringify(pageSections));}catch{}},[pageSections,figmaPersistenceReadyV97]);\n  const pageId = pageIdByRegion[region];",'persistence effects');
  const state="  const [toast, setToast] = useState('');";
  swap(state,state+"\n  const [figmaImportOpenV97,setFigmaImportOpenV97]=useState(()=>typeof window!=='undefined' && Boolean(window.location?.hash?.includes('figma_session=')));\n  const [figmaDroppedFileV97,setFigmaDroppedFileV97]=useState(null);\n  const [figmaPersistenceReadyV97,setFigmaPersistenceReadyV97]=useState(false);",'dialog state');
  const handler="  const updateSection = (id, updater) => mutateSections((prev) => prev.map((s) => s.id === id ? updater(s) : s));";
  swap(handler,handler+"\n  const editFigmaTextV97=(sectionId,nodeId,text)=>updateSection(sectionId,(section)=>section.figmaNode?{...section,figmaNode:updateImportedText(section.figmaNode,nodeId,text)}:section);\n  useEffect(()=>{const handler=(event)=>{const detail=event.detail||{};if(detail.sectionId&&detail.nodeId)editFigmaTextV97(detail.sectionId,detail.nodeId,detail.text||'');};window.addEventListener('merchtest:figma-edit',handler);return ()=>window.removeEventListener('merchtest:figma-edit',handler);});\n  const importFigmaSectionsV97=(nextSections,mode)=>{\n    if(!nextSections?.length)return;\n    mutateSections((previous)=>mode==='replace'?[...nextSections]:[...previous,...nextSections]);\n    setSelectedId(nextSections[0].id);setFigmaImportOpenV97(false);setFigmaDroppedFileV97(null);\n    setToast('Добавлено '+nextSections.length+' секций из Figma · текст редактируется на макете');\n    setTimeout(()=>setToast(''),3600);\n  };",'callbacks');
  const controls='<div className="editor-header-actions-v43">';
  swap(controls,controls+'<button type="button" className="editor-figma-trigger-v97" title="Импортировать макет Figma" onClick={()=>{setFigmaDroppedFileV97(null);setFigmaImportOpenV97(true);}}><Layers3 size={16}/><span>Из Figma</span></button>','button');
  swap('<section className="canvas-shell">',
    '<section className="canvas-shell" onDragOverCapture={(event)=>{if(Array.from(event.dataTransfer?.types||[]).includes(\'Files\'))event.preventDefault();}} onDropCapture={(event)=>{const file=Array.from(event.dataTransfer?.files||[]).find(f=>f.name.toLowerCase().endsWith(\'.json\'));if(file){event.preventDefault();event.stopPropagation();setFigmaDroppedFileV97(file);setFigmaImportOpenV97(true);}}}>','canvas drop');

  const start=app.indexOf('function SectionCanvas(');
  const end=start>=0?app.indexOf('\nfunction ',start+12):-1;
  if(start<0||end<0)throw Error(MARKER+': SectionCanvas bounds');
  let component=app.slice(start,end);
  const close=component.lastIndexOf('</section>');
  if(close<0)throw Error(MARKER+': SectionCanvas close tag');
  component=component.slice(0,close)+"{section.figmaNode&&<FigmaRenderedLayout section={section} editable={editable!==false} onTextChange={(sectionId,nodeId,text)=>window.dispatchEvent(new CustomEvent('merchtest:figma-edit',{detail:{sectionId,nodeId,text}}))}/>}\n    "+component.slice(close);
  app=app.slice(0,start)+component+app.slice(end);
  const toast='{toast && <div className="builder-toast"';
  swap(toast,'<FigmaImportDialog open={figmaImportOpenV97} initialFile={figmaDroppedFileV97} onClose={()=>{setFigmaImportOpenV97(false);setFigmaDroppedFileV97(null);}} onImport={importFigmaSectionsV97}/>\n    '+toast,'dialog');
  writeFileSync(path,app);
}
console.log('V97 applied: Figma import and layered editor integration');
