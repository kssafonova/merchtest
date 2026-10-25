import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',MARK='AUTOMATION_REPEAT_CLEANUP_V107';
let app=readFileSync(path,'utf8');
if(!app.includes(MARK)){
  const anchor='const AUTOMATION_APPLY_FIX_V104 = true;';
  if(!app.includes(anchor))throw Error(MARK+': V104 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARK+' = true;');
  const start=app.indexOf('  const applySingleAutomationV69 = (nextRule,sectionId) => {');
  const end=start>=0?app.indexOf('\n  };',start):-1;
  if(start<0||end<0)throw Error(MARK+': individual callback missing');
  const previous=app.slice(start,end+5);
  const replacement="  const applySingleAutomationV69 = (nextRule,sectionId) => {\n    const current=sections.find((s)=>s.id===sectionId);\n    const previousGroupId=current?.automationGroup?.groupId;\n    const normalized={...normalizeAutomationRuleV63(nextRule,sectionId),state:'draft',scope:{type:'single_section',sectionIds:[sectionId]}};\n    mutateSections((all)=>{\n      const withoutRepeats=previousGroupId\n        ? all.filter((s)=>!(s.generatedByAutomationGroupV64&&s.automationGroup?.groupId===previousGroupId))\n        : all;\n      return withoutRepeats.map((source)=>source.id===sectionId\n        ? {...source,rules:automationCompatRulesV63(normalized,source.rules),automationRuleV63:normalized,groupRuleV63:null,automationGroup:null}\n        : source);\n    });\n    setSelectedSectionIdsV60([]);\n    setSelectedId(sectionId);\n    setAutomationTargetIdV69(null);\n    setToast(previousGroupId?'Повторы удалены · правило секции обновлено':'Правило секции применено');\n    window.setTimeout(()=>setToast(''),2400);\n  };";
  app=app.slice(0,start)+replacement+app.slice(end+5);
  writeFileSync(path,app);
}
console.log('V107 applied: disabling single-section repeat removes generated clones');
