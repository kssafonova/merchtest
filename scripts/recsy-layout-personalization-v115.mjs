import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',MARK='RECSYS_LAYOUT_V115';
let app=readFileSync(path,'utf8');
function change(a,b,label){if(!app.includes(a))throw Error(MARK+': missing '+label);app=app.replace(a,b);}
if(!app.includes(MARK)){
  change('const AUTOMATION_SIDE_DRAWER_V114 = true;','const AUTOMATION_SIDE_DRAWER_V114 = true;\nconst '+MARK+' = true;','V114');
  app="import PersonalizationPanelV115 from './PersonalizationPanelV115.jsx';\nimport {personalizeSectionV115} from './personalization-engine.mjs';\n"+app;
  const anchor='  const [previewMode, setPreviewMode] = useState(false);';
  change(anchor,anchor+"\n  const [personalizationOpenV115,setPersonalizationOpenV115]=useState(false);\n  const [personalizationContextV115,setPersonalizationContextV115]=useState({segment:'new',content:'product',dwell:12,scroll:35,click:0,wishlist:0});\n  const [personalizationHistoryV115,setPersonalizationHistoryV115]=useState({});",'state');
  const resolved='  const resolved = useMemo(() => resolveSectionsMasterV63(sections, region), [sections, region]);';
  const next="  const resolved = useMemo(() => resolveSectionsMasterV63(sections.map(s=>personalizeSectionV115(s,TYPE_LIBRARY,{...personalizationContextV115,device:device==='mobile'?'mobile':'desktop'},personalizationHistoryV115)),region), [sections,region,device,personalizationContextV115,personalizationHistoryV115]);";
  change(resolved,next,'actual storefront geometry');
  change('<button className="editor-analytics-v43"',"<button type=\"button\" className={'editor-personalize-v115'+(personalizationOpenV115?' active':'')} title=\"Персонализация геометрии секций\" onClick={()=>setPersonalizationOpenV115(true)}><Sparkles size={16}/><span>Персонализация</span></button>\n        "+'<button className="editor-analytics-v43"','header');
  change('<main className="builder-workspace">',"{personalizationOpenV115&&<PersonalizationPanelV115\n      open={personalizationOpenV115}\n      onClose={()=>setPersonalizationOpenV115(false)}\n      sections={sections} types={TYPE_LIBRARY}\n      activeId={selected?.id}\n      context={personalizationContextV115}\n      device={device==='mobile'?'mobile':'desktop'}\n      onContext={setPersonalizationContextV115}\n      history={personalizationHistoryV115}\n      onHistory={setPersonalizationHistoryV115}\n      onSave={(sectionId,policy)=>{updateSection(sectionId,source=>({...source,personalizationV115:policy}));setSelectedId(sectionId);setToast('Персонализация секции включена · демо');window.setTimeout(()=>setToast(''),2300);}}\n      onRemove={sectionId=>{updateSection(sectionId,source=>({...source,personalizationV115:{...(source.personalizationV115||{}),enabled:false}}));setToast('Персонализация секции отключена');window.setTimeout(()=>setToast(''),2300);}}\n    />}\n    "+'<main className="builder-workspace">','side panel mount');
  writeFileSync(path,app);
}
console.log('V115 applied: context-dependent section type selection renders on storefront');
