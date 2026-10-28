import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',marker='MERCH_RULE_CONSISTENCY_V126';
let app=readFileSync(path,'utf8');
const one=(s,from,to,label)=>{const n=s.split(from).length-1;if(n!==1)throw Error(marker+': '+label+' expected once, got '+n);return s.replace(from,to);};
const part=(s,name)=>{
  const a=s.indexOf('function '+name+'('),b=a<0?-1:s.indexOf('\nfunction ',a+10);
  if(a<0||b<0)throw Error(marker+': missing function '+name);
  return {a,b,value:s.slice(a,b)};
};
if(!app.includes('const '+marker+' = true;')){
  app=one(app,'const MERCH_LIFECYCLE_V125 = true;','const MERCH_LIFECYCLE_V125 = true;\nconst '+marker+' = true;','V125 marker');
  app="import {eligibleCandidatesV126,commercialFieldV126,merchRuleIssuesV126,merchScopeIssuesV126} from './merch-rule-consistency-v126.mjs';\n"+app;
  app=one(app,"  { key:'stock', label:'Остаток', type:'number' },",
    "  { key:'stock', label:'Остаток', type:'number' },\n  { key:'commercialState', label:'Коммерческий статус', type:'select' },",'status filter option');
  app=one(app,"  if (field === 'stock') return Number(product?.stock?.[region] ?? product?.stockValue ?? 0);",
    "  if (field === 'stock') return Number(product?.stock?.[region] ?? product?.stockValue ?? 0);\n  if (field === 'commercialState') return commercialFieldV126(product,region);",'status filter resolver');

  // The automatic selection is authoritative. A teaser does not delete stock conditions or
  // silently promote Coming Soon above a saved sorting configuration.
  const res=part(app,'resolveSectionV63');
  let block=one(res.value,
    "const availableRaw = rawCandidates.filter((product)=>Number(automationProductValueV63(product,'stock',region))>0||(teaserEnabledV125&&isComingSoonV125(product,region)));",
    "const availableRaw = eligibleCandidatesV126(rawCandidates,region,section);",
    'single availability gate');
  block=one(block,'  const finalRule = {...rule,status};',
    '  const finalRule = {...rule,status};\n  const merchIssuesV126=merchRuleIssuesV126(section,region,rule);',
    'resolved warnings');
  block=one(block,'reserveV63:reserve,fallbackUsedV63:fallbackUsed};',
    'reserveV63:reserve,fallbackUsedV63:fallbackUsed,merchIssuesV126};','report issues');
  app=app.slice(0,res.a)+block+app.slice(res.b);

  const stats=part(app,'automationGroupCandidateStatsV64');
  const statsValue=`function automationGroupCandidateStatsV64(rule,memberSections,region){
  const primary=memberSections?.[0]||{};
  const candidates=eligibleCandidatesV126(queryAutomationIndexV63(rule.selection,region),region,primary);
  const capacity=(memberSections||[]).reduce((sum,section)=>sum+slotCount(section.template),0);
  return {candidates:candidates.length,capacity,reserve:Math.max(0,candidates.length-capacity),underfill:Math.max(0,capacity-candidates.length)};
}`;
  app=app.slice(0,stats.a)+statsValue+app.slice(stats.b);

  const preview=part(app,'automationPoolPreviewV88');
  const previewValue=`function automationPoolPreviewV88(rule,region,limit=6,section=null){
  try{
    const matched=queryAutomationIndexV63(rule?.selection,region);
    const eligible=eligibleCandidatesV126(matched,region,section||{});
    const limited=automationColorLimitV63(automationSortV63(eligible,rule,region),rule);
    return {matched:matched.length,pool:limited.length,preview:limited.slice(0,limit)};
  }catch{ return {matched:0,pool:0,preview:[]}; }
}`;
  app=app.slice(0,preview.a)+previewValue+app.slice(preview.b);

  const scenarioLine=app.match(/^  \\{key:'new',label:'Новинки',hint:'[^']*'\\},$/m)?.[0];
  if(!scenarioLine)throw Error(marker+': new scenario anchor missing');
  app=one(app,scenarioLine,scenarioLine+"\\n  {key:'coming_soon',label:'Coming Soon',hint:'Только товары с явным статусом «Скоро в продаже»'},",'announcement scenario');
  app=one(app,
    "  if(scenario==='new') return [{type:'condition',id:'scenario-new-v77',field:'isNew',operator:'eq',value:'true'}];",
    "  if(scenario==='new') return [{type:'condition',id:'scenario-new-v77',field:'isNew',operator:'eq',value:'true'}];\n  if(scenario==='coming_soon') return [{type:'condition',id:'scenario-coming-v126',field:'commercialState',operator:'eq',value:'coming_soon'}];",
    'announcement selection');
  app=one(app,
    "  if(scenario==='new') return [{criterion:'freshness',direction:'desc'}];",
    "  if(scenario==='new') return [{criterion:'freshness',direction:'desc'}];\n  if(scenario==='coming_soon') return [{criterion:'freshness',direction:'desc'}];",
    'announcement preset sorting');
  app=one(app,
    "['best','new','sale','category'].includes(s.key)",
    "['best','new','coming_soon','sale','category'].includes(s.key)",
    'announcement in visible presets');
  app=one(app,
    "const previewV88=automationPoolPreviewV88(activeRuleV77,region,8);",
    "const previewV88=automationPoolPreviewV88(activeRuleV77,region,8,sourceSectionsV77[0]||targetSection);",
    'preview uses section commercial policy');
  const drawer=part(app,'UnifiedAutomationDrawerV69');let modal=drawer.value;
  modal=one(modal,'  const autoFillCanApplyV96=!invalidV77&&statsV77.capacity>0;',
    "  const merchConflictsV126=merchScopeIssuesV126(sourceSectionsV77.length?sourceSectionsV77:[targetSection].filter(Boolean),activeRuleV77,region);\n  const blockingMerchV126=merchConflictsV126.some(issue=>issue.severity==='error');\n  const autoFillCanApplyV96=!invalidV77&&statsV77.capacity>0&&!blockingMerchV126;",
    'block incompatible rule before save');
  modal=one(modal,'    if(invalidV77)return;','    if(invalidV77||blockingMerchV126)return;','save conflict guard');
  modal=one(modal,"      {showScopeV77&&<AutomationScopeEditorV76",
    `      {merchConflictsV126.length>0&&<div className="merch-auto-issues-v126" role="status" aria-live="polite">{merchConflictsV126.map((issue,i)=><p className={issue.severity} key={issue.sectionId+'-'+issue.code+'-'+i}><AlertTriangle size={14}/><span>{issue.sectionName}: {issue.message}</span></p>)}</div>}
      {showScopeV77&&<AutomationScopeEditorV76`,
    'live compatibility diagnostics');
  app=app.slice(0,drawer.a)+modal+app.slice(drawer.b);
  writeFileSync(path,app);
}
console.log('V126 applied: one candidate gate, exact filter/sort, compatible automation previews and validation');
