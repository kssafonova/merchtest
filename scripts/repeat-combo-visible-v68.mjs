import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='REPEAT_COMBO_VISIBLE_V68';

if(!app.includes(MARKER)){
  const markerAnchor='const AUTOMATION_ACCEPTANCE_V65 = true;';
  if(!app.includes(markerAnchor)) throw new Error(MARKER+': V65 marker missing');
  app=app.replace(markerAnchor,markerAnchor+'\nconst '+MARKER+' = true;');

  // Existing groups may already contain generated repeats in memberSectionIds.
  // The editor must expose only the source/template sections as editable group members.
  const initialIdsOld="  const initialIds = existingGroup?.memberSectionIds?.filter((id)=>allSections.some((section)=>section.id===id)) || initialMembers.map((section)=>section.id);";
  const initialIdsNew="  const initialIds = existingGroup ? ((existingGroup.sourceSectionIdsV68?.length ? existingGroup.sourceSectionIdsV68 : (existingGroup.memberSectionIds || []).filter((id)=>{ const item=allSections.find((section)=>section.id===id); return item && !item.generatedByAutomationGroupV64; })).filter((id)=>allSections.some((section)=>section.id===id))) : initialMembers.filter((section)=>!section.generatedByAutomationGroupV64).map((section)=>section.id);";
  if(!app.includes(initialIdsOld)) throw new Error(MARKER+': group source ids anchor missing');
  app=app.replace(initialIdsOld,initialIdsNew);

  const applyAnchor='  const applyGroupRulesV64 = (nextRule,memberIds,options={}) => {';
  const applyStart=app.indexOf(applyAnchor);
  if(applyStart<0) throw new Error(MARKER+': applyGroupRulesV64 missing');

  const groupHeadOld="    const uniqueIds=Array.from(new Set(memberIds||[])).slice(0,AUTOMATION_MAX_GROUP_SECTIONS_V63);\n    if(uniqueIds.length<2){ setToast('Для авто-группы выберите минимум 2 секции'); window.setTimeout(()=>setToast(''),1500); return; }\n    const sourceSections=sections.filter((section)=>uniqueIds.includes(section.id) && !section.generatedByAutomationGroupV64);";
  const groupHeadNew="    const requestedIds=Array.from(new Set(memberIds||[]));\n    const sourceSections=sections.filter((section)=>requestedIds.includes(section.id) && !section.generatedByAutomationGroupV64);\n    const uniqueIds=sourceSections.map((section)=>section.id).slice(0,AUTOMATION_MAX_GROUP_SECTIONS_V63);\n    if(uniqueIds.length<2){ setToast('Для авто-группы выберите минимум 2 секции'); window.setTimeout(()=>setToast(''),1500); return; }";
  if(!app.includes(groupHeadOld)) throw new Error(MARKER+': group head anchor missing');
  app=app.replace(groupHeadOld,groupHeadNew);

  const generationStart=app.indexOf('    let finalIds=[...uniqueIds];',applyStart);
  const mutationStart=app.indexOf('    mutateSections((previous)=>{',generationStart);
  if(generationStart<0 || mutationStart<0) throw new Error(MARKER+': repeat generation block missing');

  const generation=String.raw`    let finalIds=[...uniqueIds];
    let repeatClones=[];
    const normalized=normalizeAutomationRuleV63(nextRule,uniqueIds[0]);
    normalized.scope={type:'section_group',sectionIds:finalIds};
    normalized.state='draft';
    let repeatPlanV68={strategy:normalized.distribution.groupStrategy,sourceSectionIds:[...uniqueIds],candidateCount:0,baseCapacity:0,totalCycles:1,generatedSections:0,fullyCovered:true};

    if(normalized.distribution.groupStrategy==='repeat_section_combo'){
      let rawCandidates=queryAutomationIndexV63(normalized.selection,region);
      if(normalized.selection.enabled && !rawCandidates.length && normalized.fallback.fallbackCategoryId){
        rawCandidates=PRODUCTS.filter((product)=>String(product.category || product.subcategory || '')===String(normalized.fallback.fallbackCategoryId));
      }
      const available=rawCandidates.filter((product)=>Number(automationProductValueV63(product,'stock',region))>0);
      const candidates=automationColorLimitV63(automationSortV63(available,normalized,region),normalized);
      const candidateIds=new Set(candidates.map((product)=>String(product.id)));
      const baseCapacity=sourceSections.reduce((sum,section)=>sum+slotCount(section.template),0);
      const occupiedFirstCycle=sourceSections.reduce((sum,section)=>sum+Object.keys(section.pins || {}).filter((key)=>Number(key)<slotCount(section.template)).length,0);
      const pinnedCandidateIds=new Set();
      sourceSections.forEach((section)=>Object.values(section.pins || {}).forEach((id)=>{ if(candidateIds.has(String(id))) pinnedCandidateIds.add(String(id)); }));
      const remainingCandidates=Math.max(0,candidateIds.size-pinnedCandidateIds.size);
      const firstCycleAutoCapacity=Math.max(0,baseCapacity-occupiedFirstCycle);
      const afterFirstCycle=Math.max(0,remainingCandidates-firstCycleAutoCapacity);
      const extraCycles=baseCapacity>0 ? Math.ceil(afterFirstCycle/baseCapacity) : 0;
      const requestedCycles=Math.max(1,1+extraCycles);
      // Generated repeats do not count against the 20 manually selected source sections.
      // Safety cap protects the static prototype from accidental unbounded rendering.
      const maxGeneratedSectionsV68=500;
      const maxCyclesByRender=Math.max(1,Math.floor((maxGeneratedSectionsV68+sourceSections.length)/Math.max(1,sourceSections.length)));
      const totalCycles=Math.min(requestedCycles,maxCyclesByRender);

      for(let repeatIndex=2;repeatIndex<=totalCycles;repeatIndex+=1){
        for(const source of sourceSections){
          const cloneId=source.id+'-AUTO-'+groupId+'-'+repeatIndex;
          finalIds.push(cloneId);
          repeatClones.push({...source,id:cloneId,pins:{},generatedByAutomationGroupV64:true,automationRepeatIndexV64:repeatIndex,automationRepeatSourceIdV68:source.id,automationGroup:null,groupRuleV63:null});
        }
      }
      repeatPlanV68={
        strategy:'repeat_section_combo',
        sourceSectionIds:[...uniqueIds],
        candidateCount:candidateIds.size,
        baseCapacity,
        totalCycles,
        generatedSections:repeatClones.length,
        fullyCovered:totalCycles>=requestedCycles,
        requestedCycles,
      };
    }
    normalized.scope={type:'section_group',sectionIds:finalIds};
`;
  app=app.slice(0,generationStart)+generation+app.slice(mutationStart);

  const groupMetaOld="automationGroup:{groupId,groupLabel:'Авто-группа · '+finalIds.length+' секций',memberSectionIds:finalIds,colorToken}";
  const groupMetaNew="automationGroup:{groupId,groupLabel:(normalized.distribution.groupStrategy==='repeat_section_combo' ? 'Авто-группа · '+uniqueIds.length+' базовые · '+finalIds.length+' на витрине' : 'Авто-группа · '+finalIds.length+' секций'),memberSectionIds:finalIds,sourceSectionIdsV68:uniqueIds,repeatPlanV68,colorToken}";
  if(!app.includes(groupMetaOld)) throw new Error(MARKER+': group metadata anchor missing');
  app=app.replaceAll(groupMetaOld,groupMetaNew);

  const returnOld='      return [...baseUpdated,...clones];';
  const returnNew=String.raw`      if(!clones.length) return baseUpdated;
      const lastSourceIndex=baseUpdated.reduce((last,section,index)=>uniqueIds.includes(section.id)?index:last,-1);
      const insertAt=Math.max(0,lastSourceIndex+1);
      return [...baseUpdated.slice(0,insertAt),...clones,...baseUpdated.slice(insertAt)];`;
  if(!app.includes(returnOld)) throw new Error(MARKER+': clone insertion anchor missing');
  app=app.replace(returnOld,returnNew);

  const toastOld="    setToast((options.mode==='full'?'Полный пересчёт':'Инкрементальное применение')+' · '+finalIds.length+' секций');";
  const toastNew="    setToast(normalized.distribution.groupStrategy==='repeat_section_combo' ? ('Повтор комбинации · '+finalIds.length+' секций · '+repeatPlanV68.candidateCount+' товаров'+(repeatPlanV68.fullyCovered?' покрыто':' · достигнут защитный лимит')) : ((options.mode==='full'?'Полный пересчёт':'Инкрементальное применение')+' · '+finalIds.length+' секций'));";
  if(!app.includes(toastOld)) throw new Error(MARKER+': toast anchor missing');
  app=app.replace(toastOld,toastNew);

  // Make generated sections visually explicit on the canvas while keeping storefront titles unchanged.
  const visualAnchor='}{(section.hasIndividualAutomation || (!section.automationGroup?.groupId && normalizeAutomationRuleV63(section.rules,section.id).selection.enabled)) && <span className="automation-individual-v64" title="Индивидуальные правила секции">⚙</span>}';
  const visualReplacement='}{section.generatedByAutomationGroupV64 && <span className="automation-repeat-badge-v68" title="Секция создана автоматически для покрытия всей выборки">ПОВТОР {section.automationRepeatIndexV64}</span>}{(section.hasIndividualAutomation || (!section.automationGroup?.groupId && normalizeAutomationRuleV63(section.rules,section.id).selection.enabled)) && <span className="automation-individual-v64" title="Индивидуальные правила секции">⚙</span>}';
  if(app.includes(visualAnchor)) app=app.replace(visualAnchor,visualReplacement);

  // The repeat count is automatic for this strategy: it is derived from candidate coverage, not a manual max-repeat field.
  const repeatHelpOld='<strong>Повтор комбинации</strong><small>До лимита повторов или конца уникальных товаров</small>';
  const repeatHelpNew='<strong>Повтор комбинации</strong><small>Автоматически дублировать комбинацию, пока не покрыты все товары</small>';
  if(app.includes(repeatHelpOld)) app=app.replace(repeatHelpOld,repeatHelpNew);

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* repeat-combo-visible-v68 */')){
  css+=String.raw`
/* repeat-combo-visible-v68 */
.automation-repeat-badge-v68{display:inline-flex;align-items:center;height:20px;padding:0 7px;border:1px solid #1473e6;background:#edf5ff;color:#0b5fcc;font-size:8px;font-weight:700;letter-spacing:.06em;white-space:nowrap}.builder-section-v57[data-group-id] .automation-repeat-badge-v68{margin-left:4px}.automation-group-badge-v64+.automation-repeat-badge-v68{margin-left:4px}
`;
  writeFileSync(cssPath,css);
}

console.log('V68 applied: repeat-section combinations now generate visible canvas sections until the candidate pool is covered');
