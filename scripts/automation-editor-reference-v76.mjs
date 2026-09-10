import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='AUTOMATION_EDITOR_REFERENCE_V76';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const RUNTIME_CONTEXT_HOTFIX_V75 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V75 marker missing');

  const helpers=String.raw`
const AUTOMATION_EDITOR_REFERENCE_V76 = true;

function automationGroupsForEditorV76(selection){
  const nodes=Array.isArray(selection?.conditions)?selection.conditions:[];
  const nested=nodes.filter((node)=>node?.type==='group').map((node)=>({...automationCloneV63(node),type:'group',operator:node.operator==='OR'?'OR':'AND',conditions:(node.conditions||[]).filter((child)=>child?.type!=='group')}));
  const loose=nodes.filter((node)=>node?.type!=='group');
  if(loose.length) nested.unshift({type:'group',id:'group-loose-v76',operator:selection?.rootOperator==='OR'?'OR':'AND',conditions:automationCloneV63(loose)});
  if(nested.length) return nested;
  return [
    {type:'group',id:'group-default-department-v76',operator:'AND',conditions:[{type:'condition',id:'condition-default-department-v76',field:'department',operator:'eq',value:''}]},
    {type:'group',id:'group-default-stock-v76',operator:'AND',conditions:[{type:'condition',id:'condition-default-stock-v76',field:'stock',operator:'gt',value:'0'}]},
  ];
}
function automationEngineGroupsV76(groups){
  return (groups||[]).map((group)=>({...group,type:'group',conditions:(group.conditions||[]).filter((condition)=>String(condition?.value??'').trim()!=='' || automationFieldV63(condition?.field||'category').type==='boolean')})).filter((group)=>(group.conditions||[]).length>0);
}
function automationConditionCountV76(groups){ return (groups||[]).reduce((sum,group)=>sum+(group.conditions||[]).length,0); }
function automationSortNameV76(level){
  const names={freshness:'Новизна',l7d:'Продажи',stock:'Остаток',price:'Цена',discount:'Скидка',id:'Артикул'};
  return names[level?.criterion] || AUTOMATION_SORTS_V63.find(([value])=>value===level?.criterion)?.[1] || 'Новизна';
}
function automationSortDirectionV76(criterion){ return criterion==='id'?'asc':'desc'; }
function automationColorSummaryV76(rule){
  const cfg=rule?.dedup?.colorLimit||{};
  if(cfg.mode==='all_colors') return 'Все цвета';
  const count=cfg.mode==='custom'?Math.max(1,Number(cfg.value||2)):1;
  return count===1?'1 цвет':'До '+count+' цветов';
}
function automationOosModeV76(rule){
  const chain=rule?.fallback?.replacementChain||[];
  const other=chain.some((step)=>step.step==='other_color'&&step.enabled);
  const reserve=chain.some((step)=>step.step==='from_reserve'&&step.enabled);
  return other&&reserve?'color_reserve':reserve?'reserve':'collapse';
}
function automationOosSummaryV76(rule){
  const mode=automationOosModeV76(rule);
  return mode==='color_reserve'?'Другой цвет → общий резерв':mode==='reserve'?'Заменять из общего резерва':'Схлопывать слот';
}
function AutomationAccordionV76({number,title,summary,open,onToggle,children}){
  return <section className={'automation-accordion-v76 '+(open?'open':'')}><button className="automation-accordion-head-v76" onClick={onToggle}><span><strong>{number}. {title}</strong><small>{summary}</small></span><b>{open?'−':'+'}</b></button>{open&&<div className="automation-accordion-body-v76">{children}</div>}</section>;
}
function AutomationLogicToggleV76({value,onChange,label}){
  return <div className="automation-logic-v76"><span>{label}</span><div className="automation-segment-v76"><button className={value==='AND'?'active':''} onClick={()=>onChange('AND')}>и</button><button className={value==='OR'?'active':''} onClick={()=>onChange('OR')}>или</button></div></div>;
}
function AutomationConditionRowV76({condition,region,onChange,onDelete}){
  const field=automationFieldV63(condition?.field||'category');
  const operators=automationOperatorsForFieldV63(field.key);
  const operator=operators.some(([value])=>value===condition.operator)?condition.operator:operators[0]?.[0]||'eq';
  const options=field.type==='boolean'?[{value:'true',label:'Да'},{value:'false',label:'Нет'}]:automationFieldOptionsV63(field.key,region);
  return <div className="automation-condition-row-v76">
    <select value={field.key} onChange={(event)=>{const nextField=event.target.value;const nextOps=automationOperatorsForFieldV63(nextField);onChange({...condition,field:nextField,operator:nextOps[0]?.[0]||'eq',value:''});}}>{AUTOMATION_FIELDS_V63.map((item)=><option key={item.key} value={item.key}>{item.label}</option>)}</select>
    <select value={operator} onChange={(event)=>onChange({...condition,operator:event.target.value})}>{operators.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
    {options.length?<select value={String(condition?.value??'')} onChange={(event)=>onChange({...condition,value:event.target.value})}><option value="">Значение</option>{options.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:<input type={field.type==='number'?'number':field.type==='date'?'date':'text'} value={condition?.value??''} onChange={(event)=>onChange({...condition,value:event.target.value})} placeholder="Значение"/>}
    <button onClick={onDelete} title="Удалить условие"><X size={16}/></button>
  </div>;
}
function AutomationConditionGroupV76({group,index,region,onChange,onDelete}){
  const updateCondition=(id,next)=>onChange({...group,conditions:(group.conditions||[]).map((item)=>item.id===id?next:item)});
  const removeCondition=(id)=>onChange({...group,conditions:(group.conditions||[]).filter((item)=>item.id!==id)});
  const addCondition=()=>onChange({...group,conditions:[...(group.conditions||[]),{type:'condition',id:'condition-v76-'+Date.now()+'-'+Math.random().toString(36).slice(2,5),field:'category',operator:'eq',value:''}]});
  return <div className="automation-condition-group-v76">
    <div className="automation-condition-group-head-v76"><strong>Группа {index+1}</strong><div className="automation-segment-v76"><button className={group.operator!=='OR'?'active':''} onClick={()=>onChange({...group,operator:'AND'})}>и</button><button className={group.operator==='OR'?'active':''} onClick={()=>onChange({...group,operator:'OR'})}>или</button></div></div>
    <div className="automation-condition-list-v76">{(group.conditions||[]).map((condition)=><AutomationConditionRowV76 key={condition.id} condition={condition} region={region} onChange={(next)=>updateCondition(condition.id,next)} onDelete={()=>removeCondition(condition.id)}/>)}</div>
    <div className="automation-condition-actions-v76"><button onClick={addCondition}><Plus size={14}/>Условие</button><button className="danger" onClick={onDelete}>Удалить группу</button></div>
  </div>;
}
function AutomationSortingV76({levels,onChange}){
  const setCriterion=(index,criterion)=>onChange(levels.map((level,i)=>i===index?{criterion,direction:automationSortDirectionV76(criterion)}:level));
  return <><div className="automation-sort-list-v76">{levels.map((level,index)=><div className="automation-sort-row-v76" key={index}><b>{index+1}</b><select value={level.criterion} onChange={(event)=>setCriterion(index,event.target.value)}>{AUTOMATION_SORTS_V63.map(([value])=><option key={value} value={value}>{automationSortNameV76({criterion:value})}</option>)}</select>{levels.length>1&&<button onClick={()=>onChange(levels.filter((_,i)=>i!==index))}><X size={15}/></button>}</div>)}</div>{levels.length<2&&<button className="automation-inline-add-v76" onClick={()=>onChange([...levels,{criterion:'l7d',direction:'desc'}])}><Plus size={16}/>Уровень сортировки</button>}<div className="automation-info-v76">Сортировка выполняется один раз для общего пула, после чего товары распределяются по выбранным секциям сверху вниз.</div></>;
}
function AutomationScopeEditorV76({memberIds,onChange,allSections}){
  const candidates=(allSections||[]).filter((section)=>!section.generatedByAutomationGroupV64);
  return <div className="automation-scope-v76"><div><strong>Состав автоматизации</strong><small>Выберите уже добавленные на страницу секции.</small></div><div className="automation-scope-list-v76">{candidates.map((section)=><label key={section.id} className={memberIds.includes(section.id)?'active':''}><input type="checkbox" checked={memberIds.includes(section.id)} onChange={()=>onChange(memberIds.includes(section.id)?memberIds.filter((id)=>id!==section.id):[...memberIds,section.id])}/><span><strong>{section.titles?.ru||section.typeId||'Секция'}</strong><small>{layoutDisplayName(section.template)} · {slotCount(section.template)} слотов</small></span></label>)}</div></div>;
}
`;
  app=app.replace(anchor,anchor+'\n'+helpers);

  const drawerPart=functionChunk(app,'UnifiedAutomationDrawerV69');
  const drawer=String.raw`function UnifiedAutomationDrawerV69({ targetSection, allSections=[], selectedIds=[], region, onApplySingle, onApplyGroup, onClose }){
  const existingGroup=targetSection?.automationGroup||null;
  const existingSourceIds=existingGroup?.groupId
    ? ((existingGroup.sourceSectionIdsV68?.length?existingGroup.sourceSectionIdsV68:(existingGroup.memberSectionIds||[]).filter((id)=>{const item=allSections.find((section)=>section.id===id);return item&&!item.generatedByAutomationGroupV64;})).filter((id)=>allSections.some((section)=>section.id===id)))
    : [];
  const pendingIds=(!existingGroup?.groupId && selectedIds.length>1 && selectedIds.includes(targetSection?.id))?selectedIds.filter((id)=>allSections.some((section)=>section.id===id&&!section.generatedByAutomationGroupV64)):[targetSection?.id].filter(Boolean);
  const initialIds=existingSourceIds.length?existingSourceIds:pendingIds;
  const repeatedSingle=Boolean(existingGroup?.repeatSingleV76 && initialIds.length===1);
  const isGroup=!repeatedSingle && initialIds.length>1;
  const seed=existingGroup?.groupId?(targetSection?.groupRuleV63||targetSection?.rules):targetSection?.rules;
  const initialRule=normalizeAutomationRuleV63(seed||{},initialIds[0]||targetSection?.id||'section');
  const [draftV76,setDraftV76]=useState(()=>({...initialRule,state:'draft'}));
  const [memberIdsV76,setMemberIdsV76]=useState(initialIds);
  const [nameV76,setNameV76]=useState(()=>initialRule.groupNameV76||(isGroup&&existingGroup?.groupLabel&&!String(existingGroup.groupLabel).startsWith('Авто-группа')?existingGroup.groupLabel:'Правило 1'));
  const [groupsV76,setGroupsV76]=useState(()=>automationGroupsForEditorV76(initialRule.selection));
  const [rootLogicV76,setRootLogicV76]=useState(initialRule.selection?.rootOperator==='OR'?'OR':'AND');
  const [sortLevelsV76,setSortLevelsV76]=useState(()=>initialRule.sorting?.enabled?[initialRule.sorting.level1,initialRule.sorting.level2].filter(Boolean).slice(0,2):[{criterion:'freshness',direction:'desc'}]);
  const [openV76,setOpenV76]=useState({source:true,sorting:false,distribution:false,colors:false,oos:false});
  const [showScopeV76,setShowScopeV76]=useState(false);
  const sourceSectionsV76=memberIdsV76.map((id)=>allSections.find((section)=>section.id===id)).filter(Boolean);
  const selectionV76={...draftV76.selection,enabled:true,rootOperator:rootLogicV76,conditions:automationEngineGroupsV76(groupsV76)};
  const sortingV76={...draftV76.sorting,enabled:sortLevelsV76.length>0,level1:sortLevelsV76[0]||{criterion:'freshness',direction:'desc'},level2:sortLevelsV76[1]||{criterion:'id',direction:'asc'}};
  const activeRuleV76={...draftV76,groupNameV76:nameV76.trim()||'Правило 1',selection:selectionV76,sorting:sortingV76,scope:{type:isGroup?'section_group':'single_section',sectionIds:memberIdsV76}};
  const statsV76=automationGroupCandidateStatsV64(activeRuleV76,sourceSectionsV76.length?sourceSectionsV76:[targetSection].filter(Boolean),region);
  const repeatV76=activeRuleV76.distribution?.groupStrategy==='repeat_section_combo';
  const repeatUnitsV76=Math.max(1,Math.ceil(Math.max(0,statsV76.candidates)/Math.max(1,statsV76.capacity)));
  const sortingSummaryV76=sortLevelsV76.length?sortLevelsV76.map(automationSortNameV76).join(' → '):'Без сортировки';
  const toggleOpen=(key)=>setOpenV76((previous)=>({...previous,[key]:!previous[key]}));
  const setDistribution=(strategy)=>setDraftV76((previous)=>({...previous,distribution:{...previous.distribution,groupStrategy:strategy,sectionUnderfillLocked:strategy==='repeat_section_combo',fillMode:'fixed_slots',sectionUnderfillStrategy:'leave_empty'}}));
  const setColors=(mode,value)=>setDraftV76((previous)=>({...previous,dedup:{...previous.dedup,noRepeatSkuAcrossSections:true,colorLimit:{mode,value}}}));
  const setOos=(mode)=>setDraftV76((previous)=>({...previous,fallback:{...previous.fallback,emptySlotBehavior:'collapse_and_center',replacementChain:mode==='color_reserve'?[{step:'other_color',enabled:true,order:1},{step:'from_reserve',enabled:true,order:2}]:mode==='reserve'?[{step:'other_color',enabled:false,order:1},{step:'from_reserve',enabled:true,order:2}]:[{step:'other_color',enabled:false,order:1},{step:'from_reserve',enabled:false,order:2}]}}));
  const save=()=>{
    if(isGroup&&memberIdsV76.length<2) return;
    const normalized={...normalizeAutomationRuleV63(activeRuleV76,memberIdsV76[0]||targetSection?.id||'section'),groupNameV76:nameV76.trim()||'Правило 1',state:'draft',scope:{type:isGroup?'section_group':'single_section',sectionIds:memberIdsV76}};
    if(isGroup) onApplyGroup?.(normalized,memberIdsV76,{mode:repeatV76?'full':'incremental',groupId:existingGroup?.groupId||null});
    else onApplySingle?.(normalized,memberIdsV76[0]||targetSection.id);
  };
  const addGroup=()=>setGroupsV76((previous)=>[...previous,{type:'group',id:'group-v76-'+Date.now(),operator:'AND',conditions:[{type:'condition',id:'condition-v76-'+Date.now(),field:'category',operator:'eq',value:''}]}]);
  return createPortal(<div className="automation-layer-v76" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}><aside className="automation-modal-v76" onMouseDown={(event)=>event.stopPropagation()}>
    <header className="automation-header-v76"><div><span>{isGroup?'ПРАВИЛА ДЛЯ ГРУППЫ СЕКЦИЙ':'ПРАВИЛА ДЛЯ СЕКЦИИ'}</span><h2>{isGroup?'Новая автоматизация':'Автоматизация секции'}</h2><p>{isGroup?'Один пул товаров → несколько уже добавленных макетов секций.':'Один пул товаров → один макет секции.'}</p></div><button onClick={onClose}><X size={22}/></button></header>
    <div className="automation-scroll-v76">
      <section className="automation-overview-v76"><div className="automation-name-v76"><label><span>{isGroup?'Название группы':'Название правила'}</span><input value={nameV76} onChange={(event)=>setNameV76(event.target.value)} placeholder="Правило 1"/></label>{isGroup&&<button onClick={()=>setShowScopeV76((value)=>!value)}>Изменить состав</button>}</div><div className="automation-stats-v76"><span><strong>{isGroup?memberIdsV76.length:1}</strong><small>{isGroup?'секций':'секция'}</small></span><span><strong>{statsV76.capacity}</strong><small>слотов</small></span><span><strong>{statsV76.candidates}</strong><small>товаров</small></span></div>{showScopeV76&&isGroup&&<AutomationScopeEditorV76 memberIds={memberIdsV76} onChange={setMemberIdsV76} allSections={allSections}/>}</section>
      <div className="automation-accordions-v76">
        <AutomationAccordionV76 number="1" title="Источник и отбор" summary={automationConditionCountV76(groupsV76)+' условий'} open={openV76.source} onToggle={()=>toggleOpen('source')}><div className="automation-source-tabs-v76"><button className="active">По условиям</button><button disabled>Персонализация</button></div><AutomationLogicToggleV76 value={rootLogicV76} onChange={setRootLogicV76} label="Между группами"/><div className="automation-groups-v76">{groupsV76.map((group,index)=><AutomationConditionGroupV76 key={group.id} group={group} index={index} region={region} onChange={(next)=>setGroupsV76((previous)=>previous.map((item)=>item.id===group.id?next:item))} onDelete={()=>setGroupsV76((previous)=>previous.filter((item)=>item.id!==group.id))}/>)}</div><button className="automation-add-group-v76" onClick={addGroup}><Plus size={17}/>Группа условий</button></AutomationAccordionV76>
        <AutomationAccordionV76 number="2" title="Сортировка" summary={sortingSummaryV76} open={openV76.sorting} onToggle={()=>toggleOpen('sorting')}><AutomationSortingV76 levels={sortLevelsV76} onChange={setSortLevelsV76}/></AutomationAccordionV76>
        <AutomationAccordionV76 number="3" title="Распределение по секциям" summary={repeatV76?(isGroup?'Повтор комбинации до полного покрытия':'Повтор секции до полного покрытия'):'Общий резерв'} open={openV76.distribution} onToggle={()=>toggleOpen('distribution')}>
          <div className="automation-distribution-v76"><button className={!repeatV76?'active':''} onClick={()=>setDistribution('fill_slots_with_reserve')}><span><strong>{isGroup?'Заполнить выбранные секции':'Заполнить секцию'}</strong><small>Товары идут сверху вниз; излишек остаётся в общем резерве.</small></span><b>{!repeatV76?'✓':''}</b></button><button className={repeatV76?'active':''} onClick={()=>setDistribution('repeat_section_combo')}><span><strong>{isGroup?'Повторять комбинацию секций':'Повторять секцию'}</strong><small>Система сама дублирует макет{isGroup?'ы комбинации':''}, пока не будут покрыты все отобранные товары.</small></span><b>{repeatV76?'✓':''}</b></button></div>{repeatV76&&<div className="automation-repeat-forecast-v76"><strong>{repeatUnitsV76}</strong><span><b>{isGroup?'комбинаций потребуется':'секций потребуется'}</b><small>Рассчитано автоматически по {statsV76.candidates} товарам и {statsV76.capacity} слотам. В последнем неполном повторе пустые слоты схлопнутся, оставшиеся центрируются.</small></span></div>}
        </AutomationAccordionV76>
        <AutomationAccordionV76 number="4" title="Цвета одной модели" summary={automationColorSummaryV76(activeRuleV76)} open={openV76.colors} onToggle={()=>toggleOpen('colors')}><div className="automation-color-options-v76"><button className={activeRuleV76.dedup?.colorLimit?.mode==='fixed'?'active':''} onClick={()=>setColors('fixed',1)}>1 цвет</button><button className={activeRuleV76.dedup?.colorLimit?.mode==='custom'&&Number(activeRuleV76.dedup?.colorLimit?.value)===2?'active':''} onClick={()=>setColors('custom',2)}>До 2</button><button className={activeRuleV76.dedup?.colorLimit?.mode==='custom'&&Number(activeRuleV76.dedup?.colorLimit?.value)===3?'active':''} onClick={()=>setColors('custom',3)}>До 3</button><button className={activeRuleV76.dedup?.colorLimit?.mode==='all_colors'?'active':''} onClick={()=>setColors('all_colors',999)}>Все</button></div><div className="automation-info-v76">Лимит применяется к AUTO-пулу одной модели. Ручные PIN не удаляются.</div></AutomationAccordionV76>
        <AutomationAccordionV76 number="5" title="Если товар недоступен" summary={automationOosSummaryV76(activeRuleV76)} open={openV76.oos} onToggle={()=>toggleOpen('oos')}><div className="automation-oos-v76"><button className={automationOosModeV76(activeRuleV76)==='color_reserve'?'active':''} onClick={()=>setOos('color_reserve')}><strong>Другой цвет → резерв</strong><small>Сначала доступный цвет той же модели, затем следующий товар из общего резерва.</small></button><button className={automationOosModeV76(activeRuleV76)==='reserve'?'active':''} onClick={()=>setOos('reserve')}><strong>Общий резерв</strong><small>Сразу заменить следующим доступным товаром.</small></button><button className={automationOosModeV76(activeRuleV76)==='collapse'?'active':''} onClick={()=>setOos('collapse')}><strong>Схлопнуть слот</strong><small>Если замены нет, пустое место не показывается.</small></button></div></AutomationAccordionV76>
      </div>
    </div>
    <footer className="automation-footer-v76"><button onClick={onClose}>Отмена</button><button className="primary" disabled={isGroup&&memberIdsV76.length<2} onClick={save}>Сохранить</button></footer>
  </aside></div>,document.body);
}`;
  app=app.slice(0,drawerPart.start)+drawer+app.slice(drawerPart.end);

  // Preserve current multi-selection when Auto-rules is opened to create a new group.
  app=app.replace("      setSelectedSectionIdsV60([sectionId]);\n      setSelectedId(sectionId);","      if (!(selectedSectionIdsEffectiveV60.length > 1 && selectedSectionIdsEffectiveV60.includes(sectionId))) setSelectedSectionIdsV60([sectionId]);\n      setSelectedId(sectionId);");

  // Pass current multi-selection into the unified editor.
  app=app.replace('targetSection={automationTargetV69} allSections={sections} region={region}','targetSection={automationTargetV69} allSections={sections} selectedIds={selectedSectionIdsEffectiveV60} region={region}');

  // Group labels use the name entered in the reference editor.
  app=app.replaceAll("groupLabel:'Авто-группа · '+finalIds.length+' секций'","groupLabel:normalized.groupNameV76 || ('Авто-группа · '+finalIds.length+' секций')");

  // Single-section automation can also expand into a generated one-section group, allowing the same
  // repeat-until-covered engine and V72 adaptive final repeat to be reused without duplicating resolver logic.
  const singleStart=app.indexOf('  const applySingleAutomationV69 = (nextRule,sectionId) => {');
  const singleEnd=singleStart>=0?app.indexOf('\n  };',singleStart):-1;
  if(singleStart<0||singleEnd<0) throw new Error(MARKER+': applySingleAutomationV69 missing');
  const singleApply=String.raw`  const applySingleAutomationV69 = (nextRule,sectionId) => {
    const source=sections.find((section)=>section.id===sectionId) || sections.find((section)=>section.automationRepeatSourceIdV68===sectionId);
    if(!source) return;
    const normalized={...normalizeAutomationRuleV63(nextRule,source.id),state:'draft',scope:{type:'single_section',sectionIds:[source.id]}};
    const repeat=normalized.distribution?.groupStrategy==='repeat_section_combo';
    const priorRepeatGroup=source.automationGroup?.repeatSingleV76 ? source.automationGroup : null;
    const groupId=priorRepeatGroup?.groupId || ('AG-SINGLE-'+Date.now().toString(36).toUpperCase());
    const candidates=automationGroupCandidateStatsV64(normalized,[source],region).candidates;
    const capacity=Math.max(1,slotCount(source.template));
    const copies=Math.max(1,Math.ceil(Math.max(candidates,1)/capacity));
    let memberIds=[source.id];
    const clones=[];
    if(repeat){
      for(let repeatIndex=2;repeatIndex<=copies;repeatIndex+=1){
        const cloneId=source.id+'-AUTO-'+groupId+'-'+repeatIndex;
        const remaining=Math.max(0,candidates-capacity*(repeatIndex-1));
        memberIds.push(cloneId);
        clones.push({...source,id:cloneId,pins:{},generatedByAutomationGroupV64:true,automationRepeatIndexV64:repeatIndex,automationRepeatSourceIdV68:source.id,automationExpectedFillV72:Math.min(capacity,remaining),automationPartialRepeatV72:remaining<capacity,hasIndividualAutomation:false});
      }
    }
    const groupRule={...normalized,scope:{type:'section_group',sectionIds:memberIds}};
    const groupMeta={groupId,groupLabel:normalized.groupNameV76 || (source.titles?.ru || 'Автоматизация секции'),memberSectionIds:memberIds,sourceSectionIdsV68:[source.id],colorToken:priorRepeatGroup?.colorToken || automationGroupColorV64(groupId),repeatSingleV76:true};
    mutateSections((previous)=>{
      const cleaned=previous.filter((section)=>!(section.generatedByAutomationGroupV64 && section.automationGroup?.repeatSingleV76 && section.automationRepeatSourceIdV68===source.id));
      const sourceIndex=cleaned.findIndex((section)=>section.id===source.id);
      const updated=cleaned.map((section)=>section.id===source.id ? (repeat?{...section,rules:automationCompatRulesV63(normalized,section.rules),automationRuleV63:normalized,automationGroup:groupMeta,groupRuleV63:automationCloneV63(groupRule)}:{...section,rules:automationCompatRulesV63(normalized,section.rules),automationRuleV63:normalized,automationGroup:null,groupRuleV63:null}) : section);
      if(!repeat||!clones.length) return updated;
      const prepared=clones.map((clone)=>({...clone,automationGroup:groupMeta,groupRuleV63:automationCloneV63(groupRule),rules:automationCompatRulesV63(normalized,clone.rules)}));
      const at=Math.max(0,sourceIndex+1);
      return [...updated.slice(0,at),...prepared,...updated.slice(at)];
    });
    setAutomationTargetIdV69(null);
    setSelectedSectionIdsV60([source.id]);
    setSelectedId(source.id);
    setToast(repeat ? ('Автоматизация сохранена · '+copies+' секц.') : 'Авто-правила секции сохранены');
    window.setTimeout(()=>setToast(''),1600);
  };`;
  app=app.slice(0,singleStart)+singleApply+app.slice(singleEnd+5);

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* automation-editor-reference-v76 */')){
  css+=String.raw`
/* automation-editor-reference-v76 */
.automation-layer-v76{position:fixed;inset:0;z-index:24000;background:rgba(20,20,20,.22);display:flex;justify-content:flex-end}.automation-modal-v76{width:min(930px,calc(100vw - 60px));height:100vh;background:#fff;border-left:1px solid #d8d6d1;display:grid;grid-template-rows:auto minmax(0,1fr) auto;color:#171717;box-shadow:-16px 0 48px rgba(0,0,0,.12)}
.automation-header-v76{padding:36px 30px 22px;border-bottom:1px solid #d8d6d1;display:flex;justify-content:space-between;gap:24px}.automation-header-v76>div{display:grid;gap:6px}.automation-header-v76 span{font-size:11px;letter-spacing:.14em;color:#8a8985}.automation-header-v76 h2{margin:0;font-size:42px;line-height:1;font-weight:700;letter-spacing:-.035em}.automation-header-v76 p{margin:2px 0 0;font-size:14px;color:#777}.automation-header-v76>button{width:50px;height:50px;border:1px solid #d6d3cc;border-radius:13px;background:#fff;display:grid;place-items:center}
.automation-scroll-v76{overflow-y:auto;min-height:0;padding:18px 24px 110px}.automation-overview-v76{padding:0 0 18px;border-bottom:1px solid #ddd9d2}.automation-name-v76{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end}.automation-name-v76 label{display:grid;gap:7px}.automation-name-v76 label>span{font-size:12px;color:#777}.automation-name-v76 input{height:46px;border:1px solid #d8d5cf;border-radius:12px;padding:0 14px;font-size:15px;outline:0}.automation-name-v76>button{height:46px;padding:0 20px;border:1px solid #d8d5cf;border-radius:12px;background:#fff;font-size:14px;font-weight:600}.automation-stats-v76{display:flex;gap:24px;padding-top:12px}.automation-stats-v76>span{display:flex;align-items:baseline;gap:6px}.automation-stats-v76 strong{font-size:23px}.automation-stats-v76 small{font-size:10px;text-transform:uppercase;color:#777}
.automation-accordions-v76{display:grid;gap:12px;padding-top:18px}.automation-accordion-v76{border:1px solid #d7d4cd;border-radius:15px;overflow:hidden;background:#fff}.automation-accordion-head-v76{width:100%;min-height:77px;padding:13px 18px;border:0;background:#fff;display:flex;align-items:center;justify-content:space-between;text-align:left}.automation-accordion-head-v76>span{display:grid;gap:4px}.automation-accordion-head-v76 strong{font-size:17px}.automation-accordion-head-v76 small{font-size:12px;color:#777}.automation-accordion-head-v76>b{font-size:22px;font-weight:400;color:#777}.automation-accordion-body-v76{padding:18px;border-top:1px solid #d7d4cd;background:#fff}
.automation-source-tabs-v76{height:56px;padding:4px;background:#f3f3f1;border:1px solid #d8d5cf;border-radius:14px;display:grid;grid-template-columns:1fr 1fr;gap:4px}.automation-source-tabs-v76 button{border:0;border-radius:10px;background:transparent;font-size:14px;color:#777}.automation-source-tabs-v76 button.active{background:#fff;color:#111;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.08)}.automation-source-tabs-v76 button:disabled{opacity:.55}.automation-logic-v76{display:flex;justify-content:space-between;align-items:center;padding:14px 0 10px}.automation-logic-v76>span{font-size:13px;color:#777}.automation-segment-v76{display:flex;padding:3px;background:#f0f0ee;border:1px solid #d8d5cf;border-radius:11px}.automation-segment-v76 button{min-width:58px;height:33px;border:0;border-radius:8px;background:transparent;color:#777}.automation-segment-v76 button.active{background:#fff;color:#111;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.07)}
.automation-groups-v76{display:grid;gap:12px}.automation-condition-group-v76{padding:14px;border:1px solid #ddd9d2;border-radius:13px}.automation-condition-group-head-v76{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px}.automation-condition-group-head-v76>strong{font-size:13px}.automation-condition-list-v76{display:grid;gap:8px}.automation-condition-row-v76{display:grid;grid-template-columns:1.25fr .75fr 1.15fr 42px;gap:8px}.automation-condition-row-v76 select,.automation-condition-row-v76 input{width:100%;min-width:0;height:43px;border:1px solid #d8d5cf;border-radius:10px;background:#fff;padding:0 12px;font-size:13px}.automation-condition-row-v76>button{height:43px;border:1px solid #d8d5cf;border-radius:10px;background:#fff}.automation-condition-actions-v76{display:flex;gap:14px;padding-top:10px}.automation-condition-actions-v76 button,.automation-add-group-v76,.automation-inline-add-v76{border:0;background:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;gap:5px}.automation-condition-actions-v76 .danger{color:#b9423a}.automation-add-group-v76{width:100%;height:50px;justify-content:center;border:1px solid #d8d5cf;border-radius:12px;margin-top:12px}
.automation-sort-list-v76{display:grid;gap:8px}.automation-sort-row-v76{display:grid;grid-template-columns:46px minmax(0,1fr) 40px;gap:8px;align-items:center}.automation-sort-row-v76>b{height:46px;background:#f1f1ef;border-radius:11px;display:grid;place-items:center;font-weight:500}.automation-sort-row-v76 select{height:46px;border:1px solid #d8d5cf;border-radius:11px;background:#fff;padding:0 14px;font-size:14px}.automation-sort-row-v76>button{height:40px;border:0;background:#fff}.automation-inline-add-v76{margin:12px 4px}.automation-info-v76{margin-top:18px;padding:14px 16px;border:1px solid #dfddd7;border-radius:12px;background:#fbfbfa;font-size:12px;line-height:1.45;color:#777}
.automation-distribution-v76,.automation-oos-v76{display:grid;gap:10px}.automation-distribution-v76>button,.automation-oos-v76>button{min-height:68px;padding:13px 15px;border:1px solid #d8d5cf;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:space-between;text-align:left}.automation-distribution-v76>button>span,.automation-oos-v76>button{gap:3px}.automation-distribution-v76 strong,.automation-oos-v76 strong{font-size:13px}.automation-distribution-v76 small,.automation-oos-v76 small{display:block;margin-top:3px;font-size:11px;line-height:1.4;color:#777}.automation-distribution-v76>button.active,.automation-oos-v76>button.active{border-color:#222;box-shadow:0 0 0 1px #222 inset}.automation-repeat-forecast-v76{margin-top:12px;padding:15px;border-radius:12px;background:#f6f6f4;display:flex;gap:13px;align-items:flex-start}.automation-repeat-forecast-v76>strong{font-size:28px;line-height:1}.automation-repeat-forecast-v76>span{display:grid;gap:3px}.automation-repeat-forecast-v76 b{font-size:12px}.automation-repeat-forecast-v76 small{font-size:11px;line-height:1.45;color:#777}.automation-color-options-v76{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #d8d5cf;border-radius:12px;overflow:hidden}.automation-color-options-v76 button{height:45px;border:0;border-right:1px solid #d8d5cf;background:#fff}.automation-color-options-v76 button:last-child{border-right:0}.automation-color-options-v76 button.active{background:#171717;color:#fff}
.automation-scope-v76{margin-top:14px;padding:14px;border:1px solid #d8d5cf;border-radius:12px;background:#fafafa}.automation-scope-v76>div:first-child{display:grid;gap:3px}.automation-scope-v76 small{font-size:11px;color:#777}.automation-scope-list-v76{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px;max-height:230px;overflow:auto}.automation-scope-list-v76 label{min-height:52px;padding:8px 10px;border:1px solid #ddd;border-radius:10px;background:#fff;display:flex;align-items:center;gap:9px}.automation-scope-list-v76 label.active{border-color:#222}.automation-scope-list-v76 label>span{display:grid;gap:2px}.automation-scope-list-v76 label strong{font-size:11px}.automation-scope-list-v76 label small{font-size:9px}
.automation-footer-v76{min-height:82px;padding:16px 24px;border-top:1px solid #d8d5cf;background:#fff;display:flex;justify-content:flex-end;align-items:center;gap:10px}.automation-footer-v76 button{height:50px;padding:0 22px;border:1px solid #d8d5cf;border-radius:12px;background:#fff;font-size:16px;font-weight:650}.automation-footer-v76 button.primary{background:#181818;border-color:#181818;color:#fff}.automation-footer-v76 button:disabled{opacity:.4}
@media(max-width:760px){.automation-modal-v76{width:100vw}.automation-header-v76{padding:24px 18px 18px}.automation-header-v76 h2{font-size:31px}.automation-scroll-v76{padding:14px 12px 96px}.automation-condition-row-v76{grid-template-columns:1fr 1fr}.automation-condition-row-v76>button{grid-column:2}.automation-scope-list-v76{grid-template-columns:1fr}.automation-name-v76{grid-template-columns:1fr}.automation-color-options-v76{grid-template-columns:1fr 1fr}.automation-color-options-v76 button:nth-child(2){border-right:0}.automation-color-options-v76 button{border-bottom:1px solid #d8d5cf}}
`;
  writeFileSync(cssPath,css);
}
console.log('V76 applied: reference automation editor + group/single repeat-until-covered logic');
