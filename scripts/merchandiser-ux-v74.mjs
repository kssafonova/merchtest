import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='MERCHANDISER_UX_V74';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const ZARA_LAYOUT_LIBRARY_V73 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V73 marker missing');

  const helpers=String.raw`
const MERCHANDISER_UX_V74 = true;
const MERCH_QUICK_PRESETS_V74 = [
  {key:'new',label:'Новинки',hint:'Сначала недавно опубликованные',icon:'✦'},
  {key:'best',label:'Бестселлеры',hint:'Сначала самые продаваемые L7D',icon:'↗'},
  {key:'stock',label:'Высокий остаток',hint:'Сначала товары с большим запасом',icon:'▦'},
  {key:'sale',label:'Sale',hint:'Товары со скидкой, сначала максимальная',icon:'%'},
  {key:'category',label:'Категория',hint:'Выбрать категорию и заполнить',icon:'◫'},
  {key:'collection',label:'Коллекция',hint:'Выбрать коллекцию и заполнить',icon:'◇'},
];

function merchQuickConditionV74(field,operator,value){
  return {type:'condition',id:'quick-'+field+'-'+Date.now(),field,operator,value};
}
function merchQuickRuleV74(source,preset,value,sectionId=''){
  const rule=normalizeAutomationRuleV63(source || {},sectionId);
  let conditions=[];
  let sort1={criterion:'freshness',direction:'desc'};
  if(preset==='new') conditions=[merchQuickConditionV74('isNew','eq','true')];
  if(preset==='best'){ conditions=[merchQuickConditionV74('l7d','gt','0')]; sort1={criterion:'l7d',direction:'desc'}; }
  if(preset==='stock'){ conditions=[merchQuickConditionV74('stock','gt','0')]; sort1={criterion:'stock',direction:'desc'}; }
  if(preset==='sale'){ conditions=[merchQuickConditionV74('discount','gt','0')]; sort1={criterion:'discount',direction:'desc'}; }
  if(preset==='category' && value) conditions=[merchQuickConditionV74('category','eq',value)];
  if(preset==='collection' && value) conditions=[merchQuickConditionV74('collection','eq',value)];
  return {
    ...rule,
    state:'draft',
    selection:{...rule.selection,enabled:true,rootOperator:'AND',conditions},
    sorting:{...rule.sorting,enabled:true,level1:sort1,level2:{criterion:'id',direction:'asc'}},
    dedup:{...rule.dedup,noRepeatSkuAcrossSections:true,colorLimit:{mode:'fixed',value:1}},
    distribution:{...rule.distribution,fillMode:'fixed_slots',sectionUnderfillStrategy:'leave_empty'},
    fallback:{...rule.fallback,emptySlotBehavior:'collapse_and_center',replacementChain:[{step:'other_color',enabled:true,order:1},{step:'from_reserve',enabled:true,order:2}]},
  };
}
function merchQuickNeedsValueV74(key){ return key==='category' || key==='collection'; }
function MerchPresetGridV74({value,onChange}){
  return <div className="merch-preset-grid-v74">{MERCH_QUICK_PRESETS_V74.map((preset)=><button key={preset.key} className={value===preset.key?'active':''} onClick={()=>onChange(preset.key)}><i>{preset.icon}</i><span><strong>{preset.label}</strong><small>{preset.hint}</small></span></button>)}</div>;
}
function MerchAutomationForecastV74({stats,scopeCount=1,coverAll=false}){
  const capacity=Math.max(1,Number(stats?.capacity||1));
  const candidates=Math.max(0,Number(stats?.candidates||0));
  const combinations=coverAll ? Math.max(1,Math.ceil(Math.max(candidates,1)/capacity)) : 1;
  const shown=coverAll ? candidates : Math.min(candidates,capacity);
  const reserve=coverAll ? 0 : Math.max(0,candidates-capacity);
  return <div className="merch-forecast-v74">
    <div className="merch-forecast-title-v74"><span>ПРЕДПРОСМОТР РЕЗУЛЬТАТА</span><strong>{candidates ? 'Готово к наполнению' : 'Нет подходящих товаров'}</strong></div>
    <div className="merch-forecast-metrics-v74"><span><b>Подходит</b><strong>{candidates}</strong></span><span><b>Будет показано</b><strong>{shown}</strong></span><span><b>{coverAll?'Комбинаций':'В резерве'}</b><strong>{coverAll?combinations:reserve}</strong></span><span><b>Базовых секций</b><strong>{scopeCount}</strong></span></div>
    <small>{coverAll ? 'Система сама создаст нужное число повторов. Последний неполный макет схлопнется и центрируется.' : 'Пустые места схлопываются, OOS заменяется из резерва, повтор SKU исключён.'}</small>
  </div>;
}
function MerchQuickValueV74({preset,value,onChange,region}){
  if(!merchQuickNeedsValueV74(preset)) return null;
  const field=preset==='category'?'category':'collection';
  const options=automationFieldOptionsV63(field,region);
  return <label className="merch-quick-value-v74"><span>{preset==='category'?'Категория':'Коллекция'}</span><select value={value} onChange={(event)=>onChange(event.target.value)}><option value="">Выберите значение</option>{options.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function MerchPublishCheckV74({resolved,metrics,region,onConfirm,onClose}){
  const sections=resolved || [];
  const allSlots=sections.flatMap((section)=>section.resolvedSlots || []);
  const empty=allSlots.filter((slot)=>!slot.entity && slot.status!=='collapsed').length;
  const collapsed=allSlots.filter((slot)=>slot.status==='collapsed').length;
  const oos=allSlots.filter((slot)=>slot.warning && String(slot.warning).toUpperCase().includes('OOS')).length;
  const auto=allSlots.filter((slot)=>slot.status==='auto').length;
  return createPortal(<div className="merch-publish-layer-v74" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}><div className="merch-publish-v74" onMouseDown={(event)=>event.stopPropagation()}>
    <header><div><span>ПРОВЕРКА ПЕРЕД ПУБЛИКАЦИЕЙ</span><strong>{empty===0?'Готово к публикации':'Можно публиковать'}</strong><small>{region} · система проверила текущее состояние витрины</small></div><button onClick={onClose}><X size={17}/></button></header>
    <div className="merch-publish-grid-v74"><span><b>Секций</b><strong>{sections.length}</strong></span><span><b>Покрытие</b><strong>{metrics?.coverage||0}%</strong></span><span><b>AUTO слотов</b><strong>{auto}</strong></span><span><b>Пустых</b><strong>{empty}</strong></span></div>
    <div className="merch-publish-checks-v74"><div className="ok"><b>✓</b><span><strong>Адаптивные макеты</strong><small>Desktop 12 колонок · Mobile 4 колонки</small></span></div><div className="ok"><b>✓</b><span><strong>Автоматизация проверена</strong><small>Дедупликация SKU и fallback применяются перед публикацией</small></span></div>{collapsed>0&&<div><b>i</b><span><strong>{collapsed} пустых слотов схлопнуто</strong><small>Они не займут место на витрине</small></span></div>}{oos>0&&<div><b>!</b><span><strong>{oos} OOS-позиций требуют внимания</strong><small>Проверьте доступность или fallback</small></span></div>}</div>
    <footer><button onClick={onClose}>Вернуться</button><button className="primary" onClick={onConfirm}>Опубликовать сейчас</button></footer>
  </div></div>,document.body);
}
`;
  app=app.replace(anchor,anchor+'\n'+helpers);

  // Existing single/group automation editor becomes quick-first; advanced rules stay one click away.
  const unifiedPart=functionChunk(app,'UnifiedAutomationDrawerV69');
  const unified=String.raw`function UnifiedAutomationDrawerV69({ targetSection, allSections=[], region, onApplySingle, onApplyGroup, onClose }){
  const group=targetSection?.automationGroup || null;
  const isGroup=Boolean(group?.groupId);
  const sourceIds=isGroup
    ? ((group.sourceSectionIdsV68?.length ? group.sourceSectionIdsV68 : (group.memberSectionIds || []).filter((id)=>{const item=allSections.find((section)=>section.id===id);return item && !item.generatedByAutomationGroupV64;})).filter((id)=>allSections.some((section)=>section.id===id)))
    : [targetSection?.id].filter(Boolean);
  const scopeSections=sourceIds.map((id)=>allSections.find((section)=>section.id===id)).filter(Boolean);
  const seed=isGroup ? (targetSection?.groupRuleV63 || targetSection?.rules) : targetSection?.rules;
  const [draftV69,setDraftV69]=useState(()=>{const rule=normalizeAutomationRuleV63(seed||{},sourceIds[0]||targetSection?.id||'section');return {...rule,state:'draft',scope:{type:isGroup?'section_group':'single_section',sectionIds:sourceIds}};});
  const [quickPresetV74,setQuickPresetV74]=useState('new');
  const [quickValueV74,setQuickValueV74]=useState('');
  const [advancedV74,setAdvancedV74]=useState(false);
  const [coverAllV74,setCoverAllV74]=useState(()=>isGroup && (draftV69.distribution?.groupStrategy==='repeat_section_combo'));
  const quickRuleV74=useMemo(()=>{
    const next=merchQuickRuleV74(draftV69,quickPresetV74,quickValueV74,sourceIds[0]||targetSection?.id||'section');
    return {...next,scope:{type:isGroup?'section_group':'single_section',sectionIds:sourceIds},distribution:{...next.distribution,groupStrategy:isGroup&&coverAllV74?'repeat_section_combo':'fill_slots_with_reserve',sectionUnderfillLocked:Boolean(isGroup&&coverAllV74)}};
  },[draftV69,quickPresetV74,quickValueV74,isGroup,coverAllV74,sourceIds.join('|')]);
  const activeRuleV74=advancedV74?draftV69:quickRuleV74;
  const stats=automationGroupCandidateStatsV64(activeRuleV74,scopeSections,region);
  const invalidQuickV74=!advancedV74 && merchQuickNeedsValueV74(quickPresetV74) && !quickValueV74;
  const save=()=>{
    if(invalidQuickV74) return;
    const rule={...normalizeAutomationRuleV63(activeRuleV74,sourceIds[0]||targetSection.id),state:'draft',scope:{type:isGroup?'section_group':'single_section',sectionIds:sourceIds}};
    if(isGroup) onApplyGroup?.(rule,sourceIds,{mode:coverAllV74?'full':'incremental',groupId:group.groupId});
    else onApplySingle?.(rule,targetSection.id);
  };
  return createPortal(<div className="group-rules-layer-v60 unified-automation-layer-v69 merch-automation-layer-v74" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}>
    <aside className="group-rules-drawer-v60 unified-automation-drawer-v69 merch-automation-drawer-v74" onMouseDown={(event)=>event.stopPropagation()}>
      <header className="group-rules-head-v60 unified-automation-head-v69 merch-automation-head-v74"><div><span>{isGroup?'АВТОНАПОЛНЕНИЕ · ГРУППА':'АВТОНАПОЛНЕНИЕ · СЕКЦИЯ'}</span><strong>{isGroup?(group.groupLabel||sourceIds.length+' секций'):(targetSection?.titles?.ru||'Секция')}</strong><small>{advancedV74?'Расширенные правила':'Выберите сценарий — остальное система настроит сама.'}</small></div><button onClick={onClose}><X size={18}/></button></header>
      <div className="group-rules-scroll-v60 unified-automation-scroll-v69 merch-automation-scroll-v74">
        {!advancedV74 ? <>
          <section className="merch-step-v74"><div className="merch-step-title-v74"><b>1</b><span><strong>Что показать?</strong><small>Самые частые задачи мерчендайзера</small></span></div><MerchPresetGridV74 value={quickPresetV74} onChange={(next)=>{setQuickPresetV74(next);setQuickValueV74('');}}/><MerchQuickValueV74 preset={quickPresetV74} value={quickValueV74} onChange={setQuickValueV74} region={region}/></section>
          {isGroup&&<section className="merch-step-v74"><div className="merch-step-title-v74"><b>2</b><span><strong>Сколько показать?</strong><small>Система сама считает необходимое число секций</small></span></div><button className={'merch-cover-all-v74 '+(coverAllV74?'active':'')} onClick={()=>setCoverAllV74((value)=>!value)}><span><strong>Покрыть весь отбор</strong><small>{coverAllV74?'Включено · комбинация повторяется автоматически':'Выключено · заполнить только выбранные секции'}</small></span><i>{coverAllV74?'✓':''}</i></button></section>}
          <section className="merch-step-v74"><div className="merch-step-title-v74"><b>{isGroup?'3':'2'}</b><span><strong>Проверить результат</strong><small>До применения правил к витрине</small></span></div><MerchAutomationForecastV74 stats={stats} scopeCount={sourceIds.length} coverAll={Boolean(isGroup&&coverAllV74)}/></section>
          <button className="merch-advanced-link-v74" onClick={()=>{setDraftV69(quickRuleV74);setAdvancedV74(true);}}>Расширенные настройки <ChevronRight size={13}/></button>
        </> : <><button className="merch-back-simple-v74" onClick={()=>setAdvancedV74(false)}>← Вернуться к быстрому наполнению</button><AutomationRuleEditorV63 rule={draftV69} region={region} capacity={stats.capacity} scope={isGroup?'group':'single'} matchedCount={stats.candidates} availableCount={stats.candidates} lockedUnderfill={isGroup&&draftV69.distribution.groupStrategy==='repeat_section_combo'} onChange={(next)=>setDraftV69({...normalizeAutomationRuleV63(next,sourceIds[0]||targetSection.id),state:'draft',scope:{type:isGroup?'section_group':'single_section',sectionIds:sourceIds}})}/></>}
      </div>
      <footer className="group-rules-footer-v60 unified-automation-footer-v69 merch-automation-footer-v74"><span>{advancedV74?'Настройки сохранятся как черновик.':'PIN останутся на месте · OOS заменится автоматически.'}</span><button onClick={onClose}>Отмена</button><button className="primary" disabled={invalidQuickV74||stats.candidates===0} onClick={save}>{advancedV74?'Сохранить правила':'Заполнить'}</button></footer>
    </aside>
  </div>,document.body);
}`;
  app=app.slice(0,unifiedPart.start)+unified+app.slice(unifiedPart.end);

  // Multi-selection group creation uses the same quick-first mental model.
  const groupPart=functionChunk(app,'GroupSectionRulesDrawerV60');
  const group=String.raw`function GroupSectionRulesDrawerV60({ sections, allSections=[], region, onApply, onClose }) {
  const initialMembers=sections||[];
  const existingGroup=initialMembers.find((section)=>section.automationGroup?.groupId)?.automationGroup||null;
  const initialIds=(existingGroup?.sourceSectionIdsV68?.length?existingGroup.sourceSectionIdsV68:initialMembers.map((section)=>section.id)).filter((id)=>allSections.length?allSections.some((section)=>section.id===id):true).slice(0,AUTOMATION_MAX_GROUP_SECTIONS_V63);
  const seed=initialMembers.find((section)=>section.groupRuleV63)?.groupRuleV63||initialMembers[0]?.rules||defaultAutomationRuleV63(initialIds[0]||'group');
  const [draftV74,setDraftV74]=useState(()=>normalizeAutomationRuleV63(seed,initialIds[0]||'group'));
  const [presetV74,setPresetV74]=useState('new');
  const [valueV74,setValueV74]=useState('');
  const [coverAllV74,setCoverAllV74]=useState(true);
  const [advancedV74,setAdvancedV74]=useState(false);
  const memberSections=initialIds.map((id)=>(allSections.length?allSections:initialMembers).find((section)=>section.id===id)).filter(Boolean);
  const quickRule=useMemo(()=>{const next=merchQuickRuleV74(draftV74,presetV74,valueV74,initialIds[0]||'group');return {...next,scope:{type:'section_group',sectionIds:initialIds},distribution:{...next.distribution,groupStrategy:coverAllV74?'repeat_section_combo':'fill_slots_with_reserve',sectionUnderfillLocked:coverAllV74}};},[draftV74,presetV74,valueV74,coverAllV74,initialIds.join('|')]);
  const activeRule=advancedV74?draftV74:quickRule;
  const stats=automationGroupCandidateStatsV64(activeRule,memberSections,region);
  const invalid=!advancedV74&&merchQuickNeedsValueV74(presetV74)&&!valueV74;
  const apply=()=>{if(initialIds.length<2||invalid||!stats.candidates)return;const rule={...normalizeAutomationRuleV63(activeRule,initialIds[0]),state:'draft',scope:{type:'section_group',sectionIds:initialIds}};onApply(rule,initialIds,{mode:coverAllV74?'full':'incremental',groupId:existingGroup?.groupId||null});};
  return createPortal(<div className="group-rules-layer-v60 merch-automation-layer-v74" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}><aside className="group-rules-drawer-v60 merch-automation-drawer-v74" onMouseDown={(event)=>event.stopPropagation()}>
    <header className="group-rules-head-v60 merch-automation-head-v74"><div><span>АВТОНАПОЛНЕНИЕ · ГРУППА</span><strong>{initialIds.length} секций выбрано</strong><small>{advancedV74?'Расширенные правила всей группы':'Выберите, что показать. Система сама распределит товары по выбранным макетам.'}</small></div><button onClick={onClose}><X size={18}/></button></header>
    <div className="group-rules-scroll-v60 merch-automation-scroll-v74">{!advancedV74?<><section className="merch-step-v74"><div className="merch-step-title-v74"><b>1</b><span><strong>Что показать?</strong><small>Готовые merchandising-сценарии</small></span></div><MerchPresetGridV74 value={presetV74} onChange={(next)=>{setPresetV74(next);setValueV74('');}}/><MerchQuickValueV74 preset={presetV74} value={valueV74} onChange={setValueV74} region={region}/></section><section className="merch-step-v74"><div className="merch-step-title-v74"><b>2</b><span><strong>Покрытие</strong><small>Без ручного расчёта количества повторов</small></span></div><button className={'merch-cover-all-v74 '+(coverAllV74?'active':'')} onClick={()=>setCoverAllV74((v)=>!v)}><span><strong>Покрыть весь отбор</strong><small>{coverAllV74?'Система автоматически повторит комбинацию секций':'Заполнить только выбранные секции'}</small></span><i>{coverAllV74?'✓':''}</i></button></section><section className="merch-step-v74"><div className="merch-step-title-v74"><b>3</b><span><strong>Что получится?</strong><small>Прогноз до применения</small></span></div><MerchAutomationForecastV74 stats={stats} scopeCount={initialIds.length} coverAll={coverAllV74}/></section><button className="merch-advanced-link-v74" onClick={()=>{setDraftV74(quickRule);setAdvancedV74(true);}}>Расширенные настройки <ChevronRight size={13}/></button></>:<><button className="merch-back-simple-v74" onClick={()=>setAdvancedV74(false)}>← Вернуться к быстрому наполнению</button><AutomationRuleEditorV63 rule={draftV74} region={region} capacity={stats.capacity} scope="group" matchedCount={stats.candidates} availableCount={stats.candidates} lockedUnderfill={draftV74.distribution.groupStrategy==='repeat_section_combo'} onChange={setDraftV74}/></>}</div>
    <footer className="group-rules-footer-v60 merch-automation-footer-v74"><span>Ручные PIN не изменяются.</span><button onClick={onClose}>Отмена</button><button className="primary" disabled={initialIds.length<2||invalid||stats.candidates===0} onClick={apply}>Автозаполнить {initialIds.length} секции</button></footer>
  </aside></div>,document.body);
}`;
  app=app.slice(0,groupPart.start)+group+app.slice(groupPart.end);

  // Simplify section toolbar to Style / Auto / More, while keeping power actions accessible.
  const canvasPart=functionChunk(app,'SectionCanvas');
  let canvas=canvasPart.chunk;
  canvas=canvas.replace(/function SectionCanvas\(\{([^}]*)\}\) \{/, (match,args)=>match+'\n  const [moreOpenV74,setMoreOpenV74]=useState(false);');
  const toolbarStart=canvas.indexOf("{editable !== false && <div className={'section-author-toolbar-v57 section-author-toolbar-v60 '");
  const toolbarEnd=toolbarStart>=0?canvas.indexOf('\n    {styleDrawerOpenV57 &&',toolbarStart):-1;
  if(toolbarStart<0||toolbarEnd<0) throw new Error(MARKER+': section toolbar boundaries missing');
  const toolbar=String.raw`{editable !== false && <div className={'section-author-toolbar-v57 section-author-toolbar-v60 merch-section-toolbar-v74 ' + (selected ? 'visible' : '')} onClick={(event)=>event.stopPropagation()}>
      <button className={'section-select-toggle-v60 ' + (selected ? 'active' : '')} title="Добавить к групповому выделению" onClick={()=>onSelect(section.id,{additiveV60:true})}><span>{selected?'✓':''}</span></button>
      <span className="section-author-drag-v57 section-author-drag-v60" title="Перетащить секцию" draggable onDragStart={(event)=>{event.stopPropagation();event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-storefront-section-v60',section.id);}}><GripVertical size={14}/></span>
      <div className="section-author-identity-v57 section-author-identity-v60"><strong>{section.titles?.[locale]||section.titles?.ru||'Секция'}</strong><small>{section.resolvedSlots?.filter((slot)=>slot.entity).length||0}/{section.resolvedSlots?.length||0} заполнено</small></div>
      <button className="section-author-action-v57" onClick={()=>{onSelect(section.id);setStyleDrawerOpenV57(true);}}><LayoutGrid size={13}/><span>Стиль</span></button>
      <button className="section-author-action-v57 merch-auto-main-v74" onClick={()=>onGroupRulesV60?.(section.id)}><Sparkles size={13}/><span>Авто</span></button>
      <div className="merch-section-more-v74"><button className="section-author-action-v57 section-author-icon-v60" title="Ещё" onClick={()=>setMoreOpenV74((value)=>!value)}><MoreHorizontal size={14}/></button>{moreOpenV74&&<div className="merch-section-menu-v74"><button disabled={sectionIndexV60<=0} onClick={()=>{onMoveSectionV60?.(section.id,-1);setMoreOpenV74(false);}}>↑ Переместить выше</button><button disabled={sectionIndexV60>=sectionCountV60-1} onClick={()=>{onMoveSectionV60?.(section.id,1);setMoreOpenV74(false);}}>↓ Переместить ниже</button><button onClick={()=>{onDuplicateSectionV60?.([section.id]);setMoreOpenV74(false);}}><Copy size={12}/>Дублировать</button><button className="danger" onClick={()=>{onDeleteSectionV60?.([section.id]);setMoreOpenV74(false);}}><Trash2 size={12}/>Удалить</button></div>}</div>
    </div>}`;
  canvas=canvas.slice(0,toolbarStart)+toolbar+canvas.slice(toolbarEnd);

  // Empty section explains the two fastest next actions in place.
  const sectionClose=canvas.lastIndexOf('</section>');
  if(sectionClose<0) throw new Error(MARKER+': SectionCanvas closing tag missing');
  const emptyCta=String.raw`{editable!==false && (section.resolvedSlots||[]).every((slot)=>!slot.entity) && <div className="merch-empty-section-v74" onClick={(event)=>event.stopPropagation()}><span><strong>Пустая секция</strong><small>Перетащите товар, образ или медиа из панели справа</small></span><button onClick={()=>onGroupRulesV60?.(section.id)}><Sparkles size={13}/>Заполнить автоматически</button></div>}`;
  canvas=canvas.slice(0,sectionClose)+emptyCta+canvas.slice(sectionClose);
  app=app.slice(0,canvasPart.start)+canvas+app.slice(canvasPart.end);

  // Make the group bulk bar task-oriented rather than system-oriented.
  app=app.replace('<strong>Секций выбрано</strong><small>Shift — диапазон · Cmd/Ctrl — добавить или убрать</small>','<strong>Секции выбраны</strong><small>Можно наполнить их одной выборкой · Shift — выбрать диапазон</small>');
  app=app.replace('<Sparkles size={13}/>Авто-правила</button>','<Sparkles size={13}/>Автозаполнить</button>');

  // Publish becomes a confidence check, not an irreversible-looking action.
  const selectedState='  const [previewMode, setPreviewMode] = useState(false);';
  if(app.includes(selectedState)) app=app.replace(selectedState,selectedState+'\n  const [publishCheckOpenV74,setPublishCheckOpenV74]=useState(false);');
  const publishButton='<button className="editor-publish-v43" onClick={publishAutomationV63}>Опубликовать</button>';
  if(app.includes(publishButton)) app=app.replace(publishButton,'<button className="editor-publish-v43" onClick={()=>setPublishCheckOpenV74(true)}>Опубликовать</button>');
  const toastAnchor='{toast && <div className="builder-toast"';
  if(!app.includes(toastAnchor)) throw new Error(MARKER+': toast anchor missing');
  app=app.replace(toastAnchor,"{publishCheckOpenV74 && <MerchPublishCheckV74 resolved={resolved} metrics={metrics} region={region} onClose={()=>setPublishCheckOpenV74(false)} onConfirm={()=>{setPublishCheckOpenV74(false);publishAutomationV63();}}/>}\n    "+toastAnchor);

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* merchandiser-ux-v74 */')){
  css+=String.raw`
/* merchandiser-ux-v74 */
.merch-automation-drawer-v74{width:min(560px,calc(100vw - 56px))!important}.merch-automation-scroll-v74{padding:18px 20px 34px!important;background:#fff!important}.merch-automation-head-v74 strong{font-size:17px!important}.merch-step-v74{padding:0 0 22px;margin:0 0 22px;border-bottom:1px solid #e8e8e8}.merch-step-title-v74{display:flex;align-items:center;gap:9px;margin-bottom:12px}.merch-step-title-v74>b{width:22px;height:22px;display:grid;place-items:center;background:#111;color:#fff;font-size:8px;font-weight:600}.merch-step-title-v74>span{display:grid;gap:2px}.merch-step-title-v74 strong{font-size:11px;font-weight:600}.merch-step-title-v74 small{font-size:8px;color:#888}.merch-preset-grid-v74{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid #ddd;border-left:1px solid #ddd}.merch-preset-grid-v74>button{min-height:74px;padding:11px;border:0;border-right:1px solid #ddd;border-bottom:1px solid #ddd;background:#fff;display:flex;align-items:flex-start;gap:9px;text-align:left;color:#111}.merch-preset-grid-v74>button:hover{background:#fafafa}.merch-preset-grid-v74>button.active{box-shadow:inset 0 0 0 2px #111;background:#fafafa}.merch-preset-grid-v74 i{width:23px;height:23px;display:grid;place-items:center;border:1px solid #ccc;border-radius:50%;font-size:10px;font-style:normal;flex:none}.merch-preset-grid-v74 button.active i{background:#111;color:#fff;border-color:#111}.merch-preset-grid-v74 span{display:grid;gap:3px}.merch-preset-grid-v74 strong{font-size:10px;font-weight:600}.merch-preset-grid-v74 small{font-size:8px;line-height:1.35;color:#888}.merch-quick-value-v74{display:grid;gap:6px;margin-top:12px}.merch-quick-value-v74>span{font-size:8px;color:#666}.merch-quick-value-v74 select{height:40px;border:1px solid #ccc;background:#fff;padding:0 10px;font-size:10px}.merch-cover-all-v74{width:100%;min-height:58px;padding:10px 12px;border:1px solid #ccc;background:#fff;display:flex;align-items:center;justify-content:space-between;text-align:left}.merch-cover-all-v74>span{display:grid;gap:3px}.merch-cover-all-v74 strong{font-size:10px}.merch-cover-all-v74 small{font-size:8px;color:#888}.merch-cover-all-v74>i{width:20px;height:20px;border:1px solid #bbb;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:10px}.merch-cover-all-v74.active{border-color:#111}.merch-cover-all-v74.active>i{background:#111;color:#fff;border-color:#111}.merch-forecast-v74{border:1px solid #d8d8d8;background:#fafafa}.merch-forecast-title-v74{padding:10px 11px;border-bottom:1px solid #e2e2e2;display:flex;align-items:center;justify-content:space-between;gap:10px}.merch-forecast-title-v74 span{font-size:7px;letter-spacing:.06em;color:#777}.merch-forecast-title-v74 strong{font-size:9px;font-weight:600}.merch-forecast-metrics-v74{display:grid;grid-template-columns:repeat(4,1fr)}.merch-forecast-metrics-v74>span{min-height:54px;padding:9px;border-right:1px solid #e0e0e0;display:grid;gap:3px;align-content:center}.merch-forecast-metrics-v74>span:last-child{border-right:0}.merch-forecast-metrics-v74 b{font-size:7px;color:#777;font-weight:500}.merch-forecast-metrics-v74 strong{font-size:16px;font-weight:500}.merch-forecast-v74>small{display:block;padding:9px 11px;border-top:1px solid #e2e2e2;font-size:8px;line-height:1.4;color:#777}.merch-advanced-link-v74{height:36px;border:0;background:#fff;padding:0;color:#555;display:flex;align-items:center;gap:5px;font-size:9px;text-decoration:underline}.merch-back-simple-v74{height:34px;margin-bottom:12px;border:0;background:#fff;font-size:9px;color:#555}.merch-automation-footer-v74 .primary:disabled{opacity:.35;cursor:not-allowed}
/* Daily section toolbar: only the choices needed while composing the page. */
.merch-section-toolbar-v74{overflow:visible!important}.merch-section-toolbar-v74 .section-author-identity-v60{min-width:135px!important}.merch-auto-main-v74{background:#f7f7f7!important}.merch-section-more-v74{position:relative;display:flex}.merch-section-menu-v74{position:absolute;right:0;top:36px;z-index:140;width:178px;border:1px solid #d8d8d8;background:#fff;box-shadow:0 10px 24px rgba(0,0,0,.12);display:grid;padding:4px}.merch-section-menu-v74 button{height:32px;padding:0 9px;border:0;background:#fff;text-align:left;display:flex;align-items:center;gap:7px;font-size:9px}.merch-section-menu-v74 button:hover{background:#f5f5f5}.merch-section-menu-v74 button.danger{color:#b42318}.merch-section-menu-v74 button:disabled{opacity:.35}.merch-empty-section-v74{margin-top:5px;padding:12px 14px;border:1px dashed #c7c7c7;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}.merch-empty-section-v74>span{display:grid;gap:2px}.merch-empty-section-v74 strong{font-size:10px;font-weight:600}.merch-empty-section-v74 small{font-size:8px;color:#888}.merch-empty-section-v74>button{height:34px;padding:0 11px;border:1px solid #111;background:#111;color:#fff;display:flex;align-items:center;gap:6px;font-size:8px;white-space:nowrap}.multi-section-bar-v60{border:1px solid #111!important;box-shadow:0 8px 26px rgba(0,0,0,.08)!important}.multi-section-bar-v60 .multi-actions-v60 .primary{background:#111!important;color:#fff!important}
/* Publish confidence check */
.merch-publish-layer-v74{position:fixed;inset:0;z-index:18000;background:rgba(0,0,0,.18);display:grid;place-items:center;padding:20px}.merch-publish-v74{width:min(520px,100%);max-height:min(720px,calc(100vh - 40px));overflow:auto;background:#fff;border:1px solid #d6d6d6;box-shadow:0 24px 70px rgba(0,0,0,.16)}.merch-publish-v74>header{padding:18px 20px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;gap:14px}.merch-publish-v74>header>div{display:grid;gap:3px}.merch-publish-v74>header span{font-size:7px;letter-spacing:.07em;color:#777}.merch-publish-v74>header strong{font-size:20px;font-weight:500}.merch-publish-v74>header small{font-size:8px;color:#888}.merch-publish-v74>header button{width:30px;height:30px;border:0;background:#fff}.merch-publish-grid-v74{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #e5e5e5}.merch-publish-grid-v74>span{min-height:70px;padding:12px;border-right:1px solid #e5e5e5;display:grid;align-content:center;gap:3px}.merch-publish-grid-v74>span:last-child{border-right:0}.merch-publish-grid-v74 b{font-size:7px;color:#777}.merch-publish-grid-v74 strong{font-size:18px;font-weight:500}.merch-publish-checks-v74{padding:12px 20px;display:grid}.merch-publish-checks-v74>div{min-height:54px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:10px}.merch-publish-checks-v74>div>b{width:22px;height:22px;border:1px solid #aaa;border-radius:50%;display:grid;place-items:center;font-size:9px}.merch-publish-checks-v74>div.ok>b{background:#111;color:#fff;border-color:#111}.merch-publish-checks-v74 span{display:grid;gap:2px}.merch-publish-checks-v74 strong{font-size:10px}.merch-publish-checks-v74 small{font-size:8px;color:#888}.merch-publish-v74>footer{padding:14px 20px;border-top:1px solid #e5e5e5;display:flex;justify-content:flex-end;gap:6px}.merch-publish-v74>footer button{height:36px;padding:0 13px;border:1px solid #ccc;background:#fff;font-size:9px}.merch-publish-v74>footer .primary{background:#111;color:#fff;border-color:#111}
@media(max-width:620px){.merch-automation-drawer-v74{width:100%!important;max-width:none!important}.merch-preset-grid-v74{grid-template-columns:1fr}.merch-forecast-metrics-v74{grid-template-columns:repeat(2,1fr)}.merch-empty-section-v74{align-items:stretch;flex-direction:column}.merch-empty-section-v74>button{justify-content:center}.merch-publish-grid-v74{grid-template-columns:repeat(2,1fr)}}
`;
  writeFileSync(cssPath,css);
}

console.log('V74 applied: merchandiser-first quick fill, progressive automation, compact section actions and publish confidence check');
