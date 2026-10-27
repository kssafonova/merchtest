import {readFileSync,writeFileSync} from 'node:fs';
const appPath='src/AppV3.jsx',MARK='MERCH_PAGE_ANALYTICS_V120';
let app=readFileSync(appPath,'utf8');
function swap(before,after,label){if(!app.includes(before))throw Error(MARK+': missing '+label);app=app.replace(before,after);}
if(!app.includes(MARK)){
 const marker='const AUTOMATION_SIDE_DRAWER_V114 = true;';
 swap(marker,marker+'\nconst '+MARK+' = true;','post-automation app marker');
 app="import PageAnalyticsPanelV120,{AnalyticsSectionStripV120,AnalyticsSlotBadgeV120} from './PageAnalyticsPanelV120.jsx';\nimport {pageAnalyticsV120} from './page-analytics-v120.mjs';\n"+app;
 const state=/  const \[previewMode,\s*setPreviewMode\] = useState\(false\);/;
 if(!state.test(app))throw Error(MARK+': preview mode state missing');
 app=app.replace(state,match=>match+'\n'+"  const [analyticsModeV120,setAnalyticsModeV120]=useState(false);\n  const [analyticsDemoV120,setAnalyticsDemoV120]=useState(false);\n  const [analyticsPeriodV120,setAnalyticsPeriodV120]=useState(7);\n  const [analyticsTrafficV120,setAnalyticsTrafficV120]=useState('all');\n  const [analyticsSelectedSlotV120,setAnalyticsSelectedSlotV120]=useState(null);");
 const resolved='  const resolved = useMemo(() => resolveSectionsMasterV63(sections, region), [sections, region]);';
 const calc='  const analyticsReportV120=useMemo(()=>pageAnalyticsV120(resolved,{region,device,period:analyticsPeriodV120,traffic:analyticsTrafficV120,mode:analyticsDemoV120?"demo":"actual"}),[resolved,region,device,analyticsPeriodV120,analyticsTrafficV120,analyticsDemoV120]);';
 swap(resolved,resolved+'\n'+calc,'merchandising resolver');
 const button=/<button className="editor-analytics-v43"[\s\S]*?<\/button>/;
 if(!button.test(app))throw Error(MARK+': original header analytics button missing');
 const replacement='<button type="button" className={"editor-analytics-v43 "+(analyticsModeV120?"analytics-active-v120":"")} onClick={()=>{setAnalyticsModeV120(value=>!value);setPreviewMode(false);setShowCoverage(false);setAemAuthorModeV40("edit");}} aria-pressed={analyticsModeV120} title={analyticsModeV120?"Вернуться к редактору":"Аналитика страницы"}><BarChart3 size={16}/><span>{analyticsModeV120?"Редактор":"Аналитика"}</span></button>';
 app=app.replace(button,replacement);
 const main='<main className="builder-workspace">';
 swap(main,main+'\n'+ "{analyticsModeV120&&<PageAnalyticsPanelV120\n  report={analyticsReportV120}\n  pageName={currentPageName}\n  period={analyticsPeriodV120}\n  onPeriod={setAnalyticsPeriodV120}\n  traffic={analyticsTrafficV120}\n  onTraffic={setAnalyticsTrafficV120}\n  demo={analyticsDemoV120}\n  onDemo={setAnalyticsDemoV120}\n  selectedId={selectedId}\n  selectedSlot={analyticsSelectedSlotV120}\n  onSelect={(id)=>{setSelectedId(id);setAnalyticsSelectedSlotV120(null);}}\n  onSlotSelect={setAnalyticsSelectedSlotV120}\n  onClose={()=>{setAnalyticsModeV120(false);setAnalyticsSelectedSlotV120(null);}}\n/>}",'workspace analytics panel');
 let n=0;
 app=app.replace(/<SectionCanvas\b[\s\S]*?\/>/g,tag=>{
  n++;let next=tag;
  if(!next.includes('analyticsModeV120='))next=next.slice(0,-2)+" analyticsModeV120={analyticsModeV120}\n analyticsRecordV120={analyticsReportV120.records.find(r=>r.id===section.id)}\n onAnalyticsPickV120={(sectionId,slotIndex)=>{setSelectedId(sectionId);setAnalyticsSelectedSlotV120(slotIndex==null?null:{sectionId,slotIndex});}}"'/>';
  next=next.replace('editable={!previewMode}','editable={!previewMode && !analyticsModeV120}');
  next=next.replace('onPin={pinEntity}','onPin={analyticsModeV120?()=>{}:pinEntity}');
  next=next.replace('onUnpin={unpin}','onUnpin={analyticsModeV120?()=>{}:unpin}');
  return next;
 });
 if(n!==1)throw Error(MARK+': expected one SectionCanvas render, found '+n);
 const start=app.indexOf('function SectionCanvas('),end=app.indexOf('\nfunction ',start+20);
 if(start<0||end<0)throw Error(MARK+': SectionCanvas function not found');
 let chunk=app.slice(start,end);
 const declaration=/function SectionCanvas\(\{([^}]*)\}\) \{/;
 if(!declaration.test(chunk))throw Error(MARK+': SectionCanvas props changed');
 chunk=chunk.replace(declaration,(whole,args)=>'function SectionCanvas({'+args+', analyticsModeV120=false,analyticsRecordV120=null,onAnalyticsPickV120 }) {');
 const container='<div className="section-containers"';
 if(!chunk.includes(container))throw Error(MARK+': SectionCanvas container missing');
 chunk=chunk.replace(container,'{analyticsModeV120&&<AnalyticsSectionStripV120 record={analyticsRecordV120} onSelect={onAnalyticsPickV120}/>}<div className="section-containers"');
 const slot=/<Slot slot=\{slot\}[^>]*\/>/;
 if(!slot.test(chunk))throw Error(MARK+': Slot visual not found');
 chunk=chunk.replace(slot,m=>m+'{analyticsModeV120&&<AnalyticsSlotBadgeV120 record={analyticsRecordV120} slotIndex={slot.index} onSelect={onAnalyticsPickV120}/>}');
 app=app.slice(0,start)+chunk+app.slice(end);
 writeFileSync(appPath,app);
}
console.log('V120 installed: page analytics switch, right inspector and in-context section/slot overlays');
