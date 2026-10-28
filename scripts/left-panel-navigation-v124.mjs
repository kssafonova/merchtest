import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',MARK='MERCH_LEFT_PANEL_V124';
let app=readFileSync(path,'utf8');
function patch(before,after,label){if(!app.includes(before))throw Error(MARK+': missing '+label);app=app.replace(before,after);}
if(!app.includes(MARK)){
 const marker='const MERCH_STUDIO_EXPERIENCE_V123 = true;';
 patch(marker,marker+'\nconst '+MARK+' = true;','V123 shell');
 app="import {LeftStructureV124,LeftTypesV124} from './LeftPanelV124.jsx';\n"+app;
 const init='const [aemPanelOpenV40, setAemPanelOpenV40] = useState(false);';
 patch(init,'const [aemPanelOpenV40, setAemPanelOpenV40] = useState(true);','default panel open');
 const content='<div className="aem-side-content-v40">';
 const tabs=`<nav className="studio-left-tabs-v124" role="tablist" aria-label="Разделы левой панели">
   {[["tree","Структура"],["components","Секции"],["pages","Страницы"],["settings","Параметры"]].map(([value,label])=><button type="button" key={value} role="tab" aria-selected={aemPanelTabV40===value} className={aemPanelTabV40===value?'active':''} onClick={()=>{setAemPanelTabV40(value);setAemPanelSearchV40('');setAemPanelOpenV40(true);}}>{label}</button>)}
 </nav>`;
 patch(content,content+'\n'+tabs,'left navigation');
 const treeStart=app.indexOf('{aemPanelTabV40 === \'tree\' && <div className="aem-content-tree-v40">');
 const compStart=app.indexOf('{aemPanelTabV40 === \'components\' && <div className="aem-components-browser-v41">',treeStart);
 const pagesStart=app.indexOf('{aemPanelTabV40 === \'pages\' && <div className="aem-pages-browser-v42">',compStart);
 if(treeStart<0||compStart<0||pagesStart<0||!(treeStart<compStart&&compStart<pagesStart))throw Error(MARK+': left tree/component boundaries changed');
 const tree=`{aemPanelTabV40==='tree'&&<LeftStructureV124 sections={resolved} selectedId={selectedId} query={aemPanelSearchV40} locale={locale}
 onSelect={(id,event)=>{selectSectionV60(id,event);setRightTab('settings');}} onAdd={()=>setShowAdd(true)}
 onMove={moveSectionV60} onDuplicate={duplicateSectionSetV60} onDelete={deleteSectionSetV60}/>}\n`;
 const types=`{aemPanelTabV40==='components'&&<LeftTypesV124 types={TYPE_LIBRARY} query={aemPanelSearchV40} onAdd={addType}/>}\n`;
 app=app.slice(0,treeStart)+tree+types+app.slice(pagesStart);
 const search='<div className="aem-side-search-v40"><Search size={14}/><input value={aemPanelSearchV40}';
 patch(search,'<div className="aem-side-search-v40"><Search size={14}/><input aria-label="Поиск в левой панели" value={aemPanelSearchV40}','accessible search');
 const clear='<button onClick={() => setAemPanelSearchV40(\'\')}><X size={12}/></button>';
 patch(clear,'<button type="button" aria-label="Очистить поиск" onClick={() => setAemPanelSearchV40(\'\')}><X size={12}/></button>','clear search label');
 writeFileSync(path,app);
}
console.log('V124: functional section tree, filters, keyboard selection, reorder/duplicate and focused layout browser installed');
