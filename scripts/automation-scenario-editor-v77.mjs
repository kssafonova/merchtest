import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='AUTOMATION_SCENARIO_EDITOR_V77';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const AUTOMATION_EDITOR_REFERENCE_V76 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V76 marker missing');

  // Size availability and margin are first-class numeric values for filtering/sorting.
  const stockField="  { key:'stock', label:'Остаток', type:'number' },";
  if(app.includes(stockField) && !app.includes("key:'sizeAvailability'")){
    app=app.replace(stockField,stockField+"\n  { key:'sizeAvailability', label:'Доступность размеров, %', type:'number' },\n  { key:'margin', label:'Маржа, %', type:'number' },");
  }
  const stockValueLine="  if (field === 'stock') return Number(product?.stock?.[region] ?? product?.stockValue ?? 0);";
  if(!app.includes(stockValueLine)) throw new Error(MARKER+': automationProductValue stock anchor missing');
  app=app.replace(stockValueLine,stockValueLine+"\n  if (field === 'sizeAvailability') return automationSizeAvailabilityV77(product,region);\n  if (field === 'margin') return automationMarginV77(product);");

  const helpers=String.raw`
const AUTOMATION_SCENARIO_EDITOR_V77 = true;

const AUTOMATION_SORT_OPTIONS_V77 = [
  {value:'l7d:asc',criterion:'l7d',direction:'asc',label:'Продажи / L7D: от наименьшего к наибольшему'},
  {value:'l7d:desc',criterion:'l7d',direction:'desc',label:'Продажи / L7D: от наибольшего к наименьшему'},
  {value:'stock:asc',criterion:'stock',direction:'asc',label:'Остаток: от наименьшего к наибольшему'},
  {value:'stock:desc',criterion:'stock',direction:'desc',label:'Остаток: от наибольшего к наименьшему'},
  {value:'sizeAvailability:asc',criterion:'sizeAvailability',direction:'asc',label:'Доступность размеров %: от наименьшего к наибольшему'},
  {value:'sizeAvailability:desc',criterion:'sizeAvailability',direction:'desc',label:'Доступность размеров %: от наибольшего к наименьшему'},
  {value:'freshness:asc',criterion:'freshness',direction:'asc',label:'Новизна: от наименьшего к наибольшему'},
  {value:'freshness:desc',criterion:'freshness',direction:'desc',label:'Новизна: от наибольшего к наименьшему'},
  {value:'price:asc',criterion:'price',direction:'asc',label:'Цена: от наименьшего к наибольшему'},
  {value:'price:desc',criterion:'price',direction:'desc',label:'Цена: от наибольшего к наименьшему'},
  {value:'discount:asc',criterion:'discount',direction:'asc',label:'Процент скидки: от наименьшего к наибольшему'},
  {value:'discount:desc',criterion:'discount',direction:'desc',label:'Процент скидки: от наибольшего к наименьшему'},
  {value:'margin:desc',criterion:'margin',direction:'desc',label:'Маржа: от наибольшего к наименьшему'},
  {value:'margin:asc',criterion:'margin',direction:'asc',label:'Маржа: от наименьшего к наибольшему'},
];

const AUTOMATION_SCENARIOS_V77 = [
  {key:'category',label:'Категория',hint:'Выбрать одну категорию'},
  {key:'new',label:'Новинки',hint:'Новые товары сначала'},
  {key:'last_sizes',label:'Последние размеры',hint:'Сначала модели с меньшей доступностью размеров'},
  {key:'custom',label:'Настроить',hint:'Собственные условия и сортировка'},
];

const AUTOMATION_FALLBACK_STEPS_V77 = [
  {step:'keep_oos',label:'Отображать на витрине'},
  {step:'other_color',label:'Заменить на другой цвет товара'},
  {step:'from_reserve',label:'Заменить на другую модель из резерва'},
  {step:'collapse',label:'Схлопнуть слот + центрирование'},
  {step:'fallback_category',label:'Добавить товары из резервной категории'},
  {step:'similar',label:'Похожие товары',backlog:true},
];

function automationSizeAvailabilityV77(product,region){
  const direct=Number(product?.sizeAvailabilityPercent ?? product?.sizeAvailability ?? product?.sizesAvailablePercent);
  if(Number.isFinite(direct)) return Math.max(0,Math.min(100,direct));
  try{
    const rows=typeof productSizeRows==='function' ? productSizeRows(product,region) : (product?.sizeRows||[]);
    if(Array.isArray(rows)&&rows.length){
      const available=rows.filter((row)=>Number(row?.stock ?? row?.stockValue ?? 0)>0).length;
      return Math.round((available/rows.length)*10000)/100;
    }
  }catch{}
  return Number(product?.stock?.[region] ?? product?.stockValue ?? 0)>0?100:0;
}
function automationMarginV77(product){
  const direct=Number(product?.marginPercent ?? product?.margin ?? product?.grossMarginPercent ?? product?.grossMargin);
  if(Number.isFinite(direct)) return direct;
  const price=Number(product?.price||0);
  const cost=Number(product?.cost ?? product?.costPrice ?? product?.purchasePrice);
  if(price>0&&Number.isFinite(cost)&&cost>0) return ((price-cost)/price)*100;
  return 0;
}
function automationSortOptionValueV77(level){
  const match=AUTOMATION_SORT_OPTIONS_V77.find((item)=>item.criterion===level?.criterion&&item.direction===(level?.direction==='asc'?'asc':'desc'));
  return match?.value || 'l7d:desc';
}
function automationSortLevelV77(value){
  const found=AUTOMATION_SORT_OPTIONS_V77.find((item)=>item.value===value)||AUTOMATION_SORT_OPTIONS_V77[1];
  return {criterion:found.criterion,direction:found.direction};
}
function automationSortLabelV77(level){
  return AUTOMATION_SORT_OPTIONS_V77.find((item)=>item.value===automationSortOptionValueV77(level))?.label || 'Продажи / L7D: от наибольшего к наименьшему';
}
function automationDepartmentFromPageV77(pageId,currentPage,region){
  const options=automationFieldOptionsV63('department',region);
  const values=new Set(options.map((item)=>String(item.value)));
  const id=String(pageId||'').toLowerCase();
  let candidate='';
  if(id.includes('women')) candidate='Женщины';
  else if(id.includes('men')) candidate='Мужчины';
  else if(id.includes('kids')||id.includes('girl')||id.includes('boy')) candidate='Дети';
  else {
    const pageName=String(currentPage?.names?.ru||'');
    if(values.has(pageName)) candidate=pageName;
  }
  return values.has(candidate)?candidate:'';
}
function automationDepartmentFromRuleV77(rule){
  const nodes=Array.isArray(rule?.selection?.conditions)?rule.selection.conditions:[];
  for(const node of nodes){
    if(node?.type==='condition'&&node.field==='department'&&node.operator==='eq'&&node.value) return String(node.value);
    if(node?.type==='group'){
      const found=(node.conditions||[]).find((condition)=>condition?.field==='department'&&condition.operator==='eq'&&condition.value);
      if(found) return String(found.value);
    }
  }
  return '';
}
function automationStripDepartmentV77(groups){
  return (groups||[]).map((group)=>({...group,conditions:(group.conditions||[]).filter((condition)=>condition?.field!=='department')})).filter((group)=>(group.conditions||[]).length>0);
}
function automationScenarioConditionsV77(scenario,category){
  if(scenario==='category') return category?[{type:'condition',id:'scenario-category-v77',field:'category',operator:'eq',value:category}]:[];
  if(scenario==='new') return [{type:'condition',id:'scenario-new-v77',field:'isNew',operator:'eq',value:'true'}];
  if(scenario==='last_sizes') return [
    {type:'condition',id:'scenario-size-stock-v77',field:'stock',operator:'gt',value:'0'},
    {type:'condition',id:'scenario-size-partial-v77',field:'sizeAvailability',operator:'lt',value:'100'},
  ];
  return [];
}
function automationScenarioSortV77(scenario,customLevels){
  if(scenario==='new') return [{criterion:'freshness',direction:'desc'}];
  if(scenario==='last_sizes') return [{criterion:'sizeAvailability',direction:'asc'}];
  if(scenario==='category') return [{criterion:'l7d',direction:'desc'}];
  return customLevels.length?customLevels:[{criterion:'l7d',direction:'desc'}];
}
function automationScenarioLabelV77(key){ return AUTOMATION_SCENARIOS_V77.find((item)=>item.key===key)?.label || 'Настроить'; }
function automationPageContextLabelV77(pageId,currentPage){
  return String(currentPage?.names?.ru || pageId || 'Текущая страница');
}
function automationFallbackInitialV77(rule){
  const stored=rule?.uiV77?.fallbackSteps;
  if(Array.isArray(stored)&&stored.length) return stored.map((item,index)=>({...item,order:index+1}));
  return [
    {step:'keep_oos',enabled:false,order:1},
    {step:'other_color',enabled:true,order:2},
    {step:'from_reserve',enabled:true,order:3},
    {step:'fallback_category',enabled:false,order:4,categoryId:rule?.fallback?.fallbackCategoryId||''},
    {step:'collapse',enabled:true,order:5},
    {step:'similar',enabled:false,order:6,backlog:true},
  ];
}
function automationFallbackSummaryV77(steps){
  const active=(steps||[]).filter((step)=>step.enabled&&!step.backlog).sort((a,b)=>a.order-b.order);
  if(!active.length) return 'Не настроено';
  const names=Object.fromEntries(AUTOMATION_FALLBACK_STEPS_V77.map((item)=>[item.step,item.label]));
  return active.slice(0,2).map((item)=>names[item.step]).join(' → ')+(active.length>2?' → …':'');
}
function AutomationSortEditorV77({levels,onChange}){
  const safe=levels.length?levels:[{criterion:'l7d',direction:'desc'}];
  const setLevel=(index,value)=>onChange(safe.map((level,i)=>i===index?automationSortLevelV77(value):level));
  return <div className="automation-sort-v77">
    {safe.map((level,index)=><div className="automation-sort-row-v77" key={index}><b>{index+1}</b><select value={automationSortOptionValueV77(level)} onChange={(event)=>setLevel(index,event.target.value)}>{AUTOMATION_SORT_OPTIONS_V77.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select>{safe.length>1&&<button onClick={()=>onChange(safe.filter((_,i)=>i!==index))}><X size={15}/></button>}</div>)}
    {safe.length<2&&<button className="automation-inline-add-v76" onClick={()=>onChange([...safe,{criterion:'stock',direction:'desc'}])}><Plus size={15}/>Уровень сортировки</button>}
  </div>;
}
function AutomationConditionRowV77({condition,region,onChange,onDelete}){
  const allowed=AUTOMATION_FIELDS_V63.filter((item)=>item.key!=='department');
  const field=allowed.find((item)=>item.key===condition?.field)||allowed[0];
  const operators=automationOperatorsForFieldV63(field.key);
  const operator=operators.some(([value])=>value===condition.operator)?condition.operator:operators[0]?.[0]||'eq';
  const options=field.type==='boolean'?[{value:'true',label:'Да'},{value:'false',label:'Нет'}]:automationFieldOptionsV63(field.key,region);
  return <div className="automation-condition-row-v76 automation-condition-row-v77">
    <select value={field.key} onChange={(event)=>{const nextField=event.target.value;const nextOps=automationOperatorsForFieldV63(nextField);onChange({...condition,field:nextField,operator:nextOps[0]?.[0]||'eq',value:''});}}>{allowed.map((item)=><option key={item.key} value={item.key}>{item.label}</option>)}</select>
    <select value={operator} onChange={(event)=>onChange({...condition,operator:event.target.value})}>{operators.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
    {options.length?<select value={String(condition?.value??'')} onChange={(event)=>onChange({...condition,value:event.target.value})}><option value="">Значение</option>{options.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:<input type={field.type==='number'?'number':field.type==='date'?'date':'text'} value={condition?.value??''} onChange={(event)=>onChange({...condition,value:event.target.value})} placeholder="Значение"/>}
    <button onClick={onDelete}><X size={16}/></button>
  </div>;
}
function AutomationConditionGroupV77({group,index,region,onChange,onDelete}){
  const update=(id,next)=>onChange({...group,conditions:(group.conditions||[]).map((item)=>item.id===id?next:item)});
  const remove=(id)=>onChange({...group,conditions:(group.conditions||[]).filter((item)=>item.id!==id)});
  const add=()=>onChange({...group,conditions:[...(group.conditions||[]),{type:'condition',id:'condition-v77-'+Date.now()+'-'+Math.random().toString(36).slice(2,5),field:'category',operator:'eq',value:''}]});
  return <div className="automation-condition-group-v76 automation-condition-group-v77">
    <div className="automation-condition-group-head-v76"><strong>Группа {index+1}</strong><div className="automation-segment-v76"><button className={group.operator!=='OR'?'active':''} onClick={()=>onChange({...group,operator:'AND'})}>и</button><button className={group.operator==='OR'?'active':''} onClick={()=>onChange({...group,operator:'OR'})}>или</button></div></div>
    {(group.conditions||[]).map((condition)=><AutomationConditionRowV77 key={condition.id} condition={condition} region={region} onChange={(next)=>update(condition.id,next)} onDelete={()=>remove(condition.id)}/>)}
    <div className="automation-condition-actions-v76"><button onClick={add}><Plus size={14}/>Условие</button><button className="danger" onClick={onDelete}>Удалить группу</button></div>
  </div>;
}
function AutomationFallbackEditorV77({steps,onChange,region}){
  const categories=automationFieldOptionsV63('category',region);
  const names=Object.fromEntries(AUTOMATION_FALLBACK_STEPS_V77.map((item)=>[item.step,item]));
  const move=(from,to)=>{if(from===to)return;const next=[...steps];const [item]=next.splice(from,1);next.splice(to,0,item);onChange(next.map((step,index)=>({...step,order:index+1})));};
  const patch=(index,value)=>onChange(steps.map((step,i)=>i===index?{...step,...value}:step));
  return <div className="automation-fallback-v77">{steps.map((step,index)=>{const meta=names[step.step]||{label:step.step};const backlog=Boolean(meta.backlog||step.backlog);return <div className={'automation-fallback-row-v77 '+(backlog?'backlog':'')} key={step.step} draggable={!backlog} onDragStart={(event)=>event.dataTransfer.setData('application/x-fallback-v77',String(index))} onDragOver={(event)=>{if(!backlog)event.preventDefault();}} onDrop={(event)=>{if(backlog)return;event.preventDefault();move(Number(event.dataTransfer.getData('application/x-fallback-v77')),index);}}>
    <GripVertical size={16}/><b>{index+1}</b><span><strong>{meta.label}</strong>{backlog?<small>IN BACKLOG</small>:<small>{step.enabled?'Используется в цепочке':'Пропустить'}</small>}</span>
    {step.step==='fallback_category'&&<select disabled={!step.enabled} value={step.categoryId||''} onChange={(event)=>patch(index,{categoryId:event.target.value})}><option value="">Выберите категорию</option>{categories.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select>}
    <label className="automation-switch-v77"><input type="checkbox" disabled={backlog} checked={Boolean(step.enabled)} onChange={(event)=>patch(index,{enabled:event.target.checked})}/><i/></label>
  </div>;})}</div>;
}
`;
  app=app.replace(anchor,anchor+'\n'+helpers);

  // Extend the sorter with size availability and margin.
  const comparePart=functionChunk(app,'automationCompareV63');
  const compare=String.raw`function automationCompareV63(a,b,level,region) {
  const criterion = level?.criterion || 'id';
  const direction = level?.direction === 'asc' ? 1 : -1;
  let av; let bv;
  if (criterion === 'freshness') { av=automationFreshnessV63(a); bv=automationFreshnessV63(b); }
  else if (criterion === 'stock') { av=automationProductValueV63(a,'stock',region); bv=automationProductValueV63(b,'stock',region); }
  else if (criterion === 'sizeAvailability') { av=automationSizeAvailabilityV77(a,region); bv=automationSizeAvailabilityV77(b,region); }
  else if (criterion === 'margin') { av=automationMarginV77(a); bv=automationMarginV77(b); }
  else if (criterion === 'id') return direction * String(a.id).localeCompare(String(b.id),'ru',{numeric:true});
  else { av=Number(a?.[criterion] || 0); bv=Number(b?.[criterion] || 0); }
  return av === bv ? 0 : direction * (av > bv ? 1 : -1);
}`;
  app=app.slice(0,comparePart.start)+compare+app.slice(comparePart.end);

  // Make fallback execution honor the exact order configured in V77.
  const replacementNeedle=String.raw`    for (const step of chain) {
      if (step.step === 'other_color') {
        const color = automationOtherColorV63(original,availableRaw,new Set([...usedLocal,...ctx.usedAcross]),region);
        if (color) return {entity:color,warning:'Другой цвет той же модели'};
      }
      if (step.step === 'from_reserve') {
        const fromReserve = takeFromReserve();
        if (fromReserve) return {entity:fromReserve,warning:'Замена из резерва'};
      }
    }
    return null;`;
  const replacementV77=String.raw`    for (const step of chain) {
      if (step.step === 'keep_oos' && original) return {entity:original,warning:'Нет в наличии · оставлен на витрине'};
      if (step.step === 'other_color') {
        const color = automationOtherColorV63(original,availableRaw,new Set([...usedLocal,...ctx.usedAcross]),region);
        if (color) return {entity:color,warning:'Другой цвет той же модели'};
      }
      if (step.step === 'from_reserve') {
        const fromReserve = takeFromReserve();
        if (fromReserve) return {entity:fromReserve,warning:'Замена на другую модель из резерва'};
      }
      if (step.step === 'fallback_category') {
        const category=String(step.categoryId || rule.fallback.fallbackCategoryId || '');
        if(category){
          const used=new Set([...usedLocal,...ctx.usedAcross].map(String));
          const categoryPool=automationSortV63(PRODUCTS.filter((product)=>String(product?.category||'')===category&&Number(automationProductValueV63(product,'stock',region))>0&&!used.has(String(product.id))),rule,region);
          const candidate=categoryPool[0];
          if(candidate) return {entity:candidate,warning:'Товар из резервной категории · '+category};
        }
      }
      if (step.step === 'collapse') return null;
    }
    return null;`;
  if(!app.includes(replacementNeedle)) throw new Error(MARKER+': fallback execution anchor missing');
  app=app.replace(replacementNeedle,replacementV77);

  const drawerPart=functionChunk(app,'UnifiedAutomationDrawerV69');
  const drawer=String.raw`function UnifiedAutomationDrawerV69({ targetSection, allSections=[], selectedIds=[], region, pageId='', currentPage=null, onApplySingle, onApplyGroup, onClose }){
  const existingGroup=targetSection?.automationGroup||null;
  const existingSourceIds=existingGroup?.groupId
    ? ((existingGroup.sourceSectionIdsV68?.length?existingGroup.sourceSectionIdsV68:(existingGroup.memberSectionIds||[]).filter((id)=>{const item=allSections.find((section)=>section.id===id);return item&&!item.generatedByAutomationGroupV64;})).filter((id)=>allSections.some((section)=>section.id===id)))
    : [];
  const pendingIds=(!existingGroup?.groupId&&selectedIds.length>1&&selectedIds.includes(targetSection?.id))?selectedIds.filter((id)=>allSections.some((section)=>section.id===id&&!section.generatedByAutomationGroupV64)):[targetSection?.id].filter(Boolean);
  const initialIds=existingSourceIds.length?existingSourceIds:pendingIds;
  const repeatedSingle=Boolean(existingGroup?.repeatSingleV76&&initialIds.length===1);
  const isGroup=!repeatedSingle&&initialIds.length>1;
  const seed=existingGroup?.groupId?(targetSection?.groupRuleV63||targetSection?.rules):targetSection?.rules;
  const initialRule=normalizeAutomationRuleV63(seed||{},initialIds[0]||targetSection?.id||'section');
  const initialDepartment=automationDepartmentFromRuleV77(initialRule)||automationDepartmentFromPageV77(pageId,currentPage,region);
  const initialScenario=initialRule?.uiV77?.scenario || (String(pageId)==='new'?'new':'custom');
  const [draftV77,setDraftV77]=useState(()=>({...initialRule,state:'draft'}));
  const [memberIdsV77,setMemberIdsV77]=useState(initialIds);
  const [scopeDepartmentV77,setScopeDepartmentV77]=useState(initialDepartment);
  const [scenarioV77,setScenarioV77]=useState(initialScenario);
  const [scenarioCategoryV77,setScenarioCategoryV77]=useState(initialRule?.uiV77?.scenarioCategory||'');
  const [groupsV77,setGroupsV77]=useState(()=>{
    const stripped=automationStripDepartmentV77(automationGroupsForEditorV76(initialRule.selection));
    return stripped.length?stripped:[{type:'group',id:'group-stock-v77',operator:'AND',conditions:[{type:'condition',id:'condition-stock-v77',field:'stock',operator:'gt',value:'0'}]}];
  });
  const [rootLogicV77,setRootLogicV77]=useState(initialRule.selection?.rootOperator==='OR'?'OR':'AND');
  const existingSorts=[initialRule.sorting?.level1,initialRule.sorting?.level2].filter((level)=>AUTOMATION_SORT_OPTIONS_V77.some((item)=>item.criterion===level?.criterion&&item.direction===level?.direction)).slice(0,2);
  const [sortLevelsV77,setSortLevelsV77]=useState(existingSorts.length?existingSorts:[{criterion:'l7d',direction:'desc'}]);
  const [dedupeV77,setDedupeV77]=useState(initialRule?.uiV77?.configured?initialRule.dedup?.noRepeatSkuAcrossSections!==false:true);
  const [colorModeV77,setColorModeV77]=useState(initialRule?.uiV77?.configured?(initialRule.dedup?.colorLimit?.mode||'all_colors'):'all_colors');
  const [colorCountV77,setColorCountV77]=useState(Math.max(2,Number(initialRule?.dedup?.colorLimit?.value||2)));
  const [showAllV77,setShowAllV77]=useState(initialRule.distribution?.groupStrategy==='repeat_section_combo');
  const [fallbackStepsV77,setFallbackStepsV77]=useState(()=>automationFallbackInitialV77(initialRule));
  const [showScopeV77,setShowScopeV77]=useState(false);
  const [openV77,setOpenV77]=useState({distribution:true,oos:true});

  const sourceSectionsV77=memberIdsV77.map((id)=>allSections.find((section)=>section.id===id)).filter(Boolean);
  const scopeConditionV77=scopeDepartmentV77?{type:'condition',id:'scope-department-v77',field:'department',operator:'eq',value:scopeDepartmentV77}:null;
  const customGroupsEngineV77=automationEngineGroupsV76(groupsV77);
  const scenarioConditionsV77=scenarioV77==='custom'?customGroupsEngineV77:automationScenarioConditionsV77(scenarioV77,scenarioCategoryV77);
  const selectionConditionsV77=[scopeConditionV77,...scenarioConditionsV77].filter(Boolean);
  const selectedSortsV77=automationScenarioSortV77(scenarioV77,sortLevelsV77);
  const sortingV77={...draftV77.sorting,enabled:selectedSortsV77.length>0,level1:selectedSortsV77[0]||{criterion:'l7d',direction:'desc'},level2:selectedSortsV77[1]||{criterion:'id',direction:'asc'}};
  const fallbackCategoryStepV77=fallbackStepsV77.find((step)=>step.step==='fallback_category');
  const fallbackChainV77=fallbackStepsV77.filter((step)=>step.step!=='similar').map((step,index)=>({...step,order:index+1,categoryId:step.categoryId||''}));
  const collapseEnabledV77=fallbackChainV77.some((step)=>step.step==='collapse'&&step.enabled);
  const colorLimitV77=colorModeV77==='all_colors'?{mode:'all_colors',value:0}:colorModeV77==='fixed'?{mode:'fixed',value:1}:{mode:'custom',value:Math.max(2,colorCountV77)};
  const autoNameV77=automationScenarioLabelV77(scenarioV77)+(scopeDepartmentV77?' · '+scopeDepartmentV77:' · '+automationPageContextLabelV77(pageId,currentPage));
  const activeRuleV77={
    ...draftV77,
    groupNameV76:autoNameV77,
    scenarioV77,
    selection:{...draftV77.selection,enabled:selectionConditionsV77.length>0,rootOperator:scenarioV77==='custom'&&scopeConditionV77?'AND':rootLogicV77,conditions:selectionConditionsV77},
    sorting:sortingV77,
    dedup:{...draftV77.dedup,noRepeatSkuAcrossSections:dedupeV77,colorLimit:colorLimitV77},
    distribution:{...draftV77.distribution,groupStrategy:showAllV77?'repeat_section_combo':'fill_slots_with_reserve',fillMode:'fixed_slots',sectionUnderfillStrategy:'leave_empty',sectionUnderfillLocked:showAllV77},
    fallback:{...draftV77.fallback,replacementChain:fallbackChainV77,fallbackCategoryId:fallbackCategoryStepV77?.categoryId||'',emptySlotBehavior:collapseEnabledV77?'collapse_and_center':'leave_with_oos_badge'},
    scope:{type:isGroup?'section_group':'single_section',sectionIds:memberIdsV77},
    uiV77:{configured:true,scenario:scenarioV77,scenarioCategory:scenarioCategoryV77,scopeDepartment:scopeDepartmentV77,fallbackSteps:fallbackStepsV77},
  };
  const statsV77=automationGroupCandidateStatsV64(activeRuleV77,sourceSectionsV77.length?sourceSectionsV77:[targetSection].filter(Boolean),region);
  const repeatUnitsV77=Math.max(1,Math.ceil(Math.max(0,statsV77.candidates)/Math.max(1,statsV77.capacity)));
  const invalidV77=(scenarioV77==='category'&&!scenarioCategoryV77)||(isGroup&&memberIdsV77.length<2);
  const departmentsV77=automationFieldOptionsV63('department',region);
  const categoriesV77=automationFieldOptionsV63('category',region);
  const toggleOpen=(key)=>setOpenV77((previous)=>({...previous,[key]:!previous[key]}));
  const save=()=>{
    if(invalidV77)return;
    const normalized={...normalizeAutomationRuleV63(activeRuleV77,memberIdsV77[0]||targetSection?.id||'section'),groupNameV76:autoNameV77,scenarioV77,uiV77:activeRuleV77.uiV77,state:'draft',scope:{type:isGroup?'section_group':'single_section',sectionIds:memberIdsV77}};
    if(isGroup) onApplyGroup?.(normalized,memberIdsV77,{mode:showAllV77?'full':'incremental',groupId:existingGroup?.groupId||null});
    else onApplySingle?.(normalized,memberIdsV77[0]||targetSection.id);
  };
  const addGroup=()=>setGroupsV77((previous)=>[...previous,{type:'group',id:'group-v77-'+Date.now(),operator:'AND',conditions:[{type:'condition',id:'condition-v77-'+Date.now(),field:'category',operator:'eq',value:''}]}]);
  return createPortal(<div className="automation-layer-v76 automation-layer-v77" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}><aside className="automation-modal-v76 automation-modal-v77" onMouseDown={(event)=>event.stopPropagation()}>
    <header className="automation-head-v76 automation-head-v77"><div><span>{isGroup?'АВТО-ПРАВИЛА · ГРУППА СЕКЦИЙ':'АВТО-ПРАВИЛА · СЕКЦИЯ'}</span><strong>Авто-наполнение</strong><small>{isGroup?'Один товарный пул → '+memberIdsV77.length+' макета секций':'Правила для выбранной секции'} · {automationPageContextLabelV77(pageId,currentPage)}</small></div><button onClick={onClose}><X size={20}/></button></header>

    <div className="automation-scroll-v76 automation-scroll-v77">
      <section className="automation-context-v77">
        <label><span>Отдел / секция</span><select value={scopeDepartmentV77} onChange={(event)=>setScopeDepartmentV77(event.target.value)}><option value="">Все отделы · сбросить фильтр</option>{departmentsV77.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select><small>Самый верхний уровень отбора. По умолчанию определяется по текущей странице.</small></label>
        <div className="automation-context-stats-v77"><span><b>{memberIdsV77.length}</b>{memberIdsV77.length===1?'секция':'секций'}</span><span><b>{statsV77.capacity}</b>слотов</span><span><b>{statsV77.candidates}</b>товаров</span>{memberIdsV77.length>1&&<button onClick={()=>setShowScopeV77((value)=>!value)}>Изменить состав</button>}</div>
        {showScopeV77&&<AutomationScopeEditorV76 memberIds={memberIdsV77} onChange={setMemberIdsV77} allSections={allSections}/>} 
      </section>

      <section className="automation-scenarios-v77">
        <div className="automation-section-title-v77"><strong>Сценарий авто-наполнения</strong><small>Выберите готовую механику или настройте собственную.</small></div>
        <div className="automation-scenario-grid-v77">{AUTOMATION_SCENARIOS_V77.map((scenario)=><button key={scenario.key} className={scenarioV77===scenario.key?'active':''} onClick={()=>setScenarioV77(scenario.key)}><strong>{scenario.label}</strong><small>{scenario.hint}</small></button>)}</div>
        {scenarioV77==='category'&&<label className="automation-category-v77"><span>Категория</span><select value={scenarioCategoryV77} onChange={(event)=>setScenarioCategoryV77(event.target.value)}><option value="">Выберите категорию</option>{categoriesV77.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
        {scenarioV77==='new'&&<div className="automation-preset-note-v77"><b>Новинки</b><span>Отбор по признаку «Новинка» → сортировка по новизне от новых к более ранним.</span></div>}
        {scenarioV77==='last_sizes'&&<div className="automation-preset-note-v77"><b>Последние размеры</b><span>Только товары в наличии с неполной размерной сеткой → сначала меньший % доступных размеров.</span></div>}
        {scenarioV77==='custom'&&<div className="automation-custom-v77">
          <div className="automation-custom-block-v77"><div className="automation-custom-title-v77"><strong>Условия отбора</strong><AutomationLogicToggleV76 value={rootLogicV77} onChange={setRootLogicV77} label="Между группами"/></div>{groupsV77.map((group,index)=><AutomationConditionGroupV77 key={group.id} group={group} index={index} region={region} onChange={(next)=>setGroupsV77((previous)=>previous.map((item)=>item.id===group.id?next:item))} onDelete={()=>setGroupsV77((previous)=>previous.filter((item)=>item.id!==group.id))}/>)}<button className="automation-add-group-v76" onClick={addGroup}><Plus size={15}/>Группа условий</button></div>
          <div className="automation-custom-block-v77"><div className="automation-custom-title-v77"><strong>Сортировка</strong><small>До 2 уровней</small></div><AutomationSortEditorV77 levels={sortLevelsV77} onChange={setSortLevelsV77}/><div className="automation-info-v76">Сортировка выполняется для общего пула до распределения товаров по секциям.</div></div>
        </div>}
      </section>

      <AutomationAccordionV76 number="2" title="Резерв / Распределение" summary={showAllV77?(isGroup?'Все товары · дублировать комбинацию':'Все товары · дублировать секцию'):'Остальное — в резерв'} open={openV77.distribution} onToggle={()=>toggleOpen('distribution')}>
        <div className="automation-distribution-v77">
          <div className="automation-option-group-v77"><strong>Повторы SKU</strong><label className="automation-check-v77"><input type="checkbox" checked={dedupeV77} onChange={(event)=>setDedupeV77(event.target.checked)}/><span><b>Не повторять одну SKU в секциях</b><small>Включено по умолчанию</small></span></label></div>
          <div className="automation-option-group-v77"><strong>Количество цветов товара</strong><div className="automation-radio-stack-v77"><label><input type="radio" name="color-v77" checked={colorModeV77==='all_colors'} onChange={()=>setColorModeV77('all_colors')}/><span><b>Все цвета товара</b><small>По умолчанию</small></span></label><label><input type="radio" name="color-v77" checked={colorModeV77==='fixed'} onChange={()=>setColorModeV77('fixed')}/><span><b>Только 1 цвет одного товара</b></span></label><label><input type="radio" name="color-v77" checked={colorModeV77==='custom'} onChange={()=>setColorModeV77('custom')}/><span><b>N цветов одного товара</b>{colorModeV77==='custom'&&<input type="number" min="2" max="20" value={colorCountV77} onChange={(event)=>setColorCountV77(Math.max(2,Number(event.target.value||2)))}/>}</span></label></div></div>
          <div className="automation-option-group-v77"><strong>Все товары / Резерв</strong><div className="automation-radio-cards-v77"><label className={!showAllV77?'active':''}><input type="radio" name="distribution-v77" checked={!showAllV77} onChange={()=>setShowAllV77(false)}/><span><b>Отображать только в выделенных слотах</b><small>Остальные отобранные товары остаются в резерве.</small></span></label><label className={showAllV77?'active':''}><input type="radio" name="distribution-v77" checked={showAllV77} onChange={()=>setShowAllV77(true)}/><span><b>Отображать все товары</b><small>{isGroup?'Дублировать комбинацию секций автоматически.':'Дублировать эту секцию автоматически.'} Система сама рассчитает число повторов.</small></span></label></div>{showAllV77&&<div className="automation-repeat-forecast-v77"><strong>{repeatUnitsV77}</strong><span>{isGroup?'комбинаций':'секций'} потребуется для {statsV77.candidates} товаров<small>Последний неполный макет схлопывает пустые слоты и центрирует оставшиеся.</small></span></div>}</div>
        </div>
      </AutomationAccordionV76>

      <AutomationAccordionV76 number="3" title="OOS / Fallback" summary={automationFallbackSummaryV77(fallbackStepsV77)} open={openV77.oos} onToggle={()=>toggleOpen('oos')}>
        <div className="automation-fallback-intro-v77">Перетащите сценарии в нужном порядке. Выполняется первый доступный вариант; выключенные шаги пропускаются.</div>
        <AutomationFallbackEditorV77 steps={fallbackStepsV77} onChange={setFallbackStepsV77} region={region}/>
      </AutomationAccordionV76>
    </div>

    <footer className="automation-footer-v76 automation-footer-v77"><div><span>{invalidV77?'Заполните обязательные параметры':'Готово к применению'}</span><small>{showAllV77?'Количество повторов рассчитывается автоматически.':'Лишние товары останутся в общем резерве.'}</small></div><button onClick={onClose}>Отмена</button><button className="primary" disabled={invalidV77} onClick={save}>Сохранить</button></footer>
  </aside></div>,document.body);
}`;
  app=app.slice(0,drawerPart.start)+drawer+app.slice(drawerPart.end);

  // Pass page context into the automation editor so the top department filter can be prefilled.
  const drawerRenderStart=app.indexOf('{automationTargetV69 && <UnifiedAutomationDrawerV69');
  if(drawerRenderStart<0) throw new Error(MARKER+': drawer render call missing');
  const drawerRenderEnd=app.indexOf('/>}',drawerRenderStart);
  if(drawerRenderEnd<0) throw new Error(MARKER+': drawer render end missing');
  let drawerRender=app.slice(drawerRenderStart,drawerRenderEnd+3);
  if(!drawerRender.includes('pageId={pageId}')) drawerRender=drawerRender.replace('region={region}','region={region} pageId={pageId} currentPage={currentPage}');
  app=app.slice(0,drawerRenderStart)+drawerRender+app.slice(drawerRenderEnd+3);

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* automation-scenario-editor-v77 */')){
  css+=String.raw`
/* automation-scenario-editor-v77 */
.automation-modal-v77{width:min(900px,94vw)!important}.automation-head-v77>div>strong{font-size:31px!important}.automation-scroll-v77{padding:18px 22px 28px!important;gap:14px!important}.automation-context-v77,.automation-scenarios-v77{border:1px solid #dededb;border-radius:14px;background:#fff;padding:16px;display:grid;gap:14px}.automation-context-v77>label{display:grid;gap:6px}.automation-context-v77>label>span,.automation-category-v77>span{font-size:11px;color:#666}.automation-context-v77 select,.automation-category-v77 select{height:44px;border:1px solid #d7d7d3;border-radius:9px;background:#fff;padding:0 12px;font-size:13px}.automation-context-v77>label>small{font-size:10px;color:#888}.automation-context-stats-v77{display:flex;align-items:center;gap:18px;flex-wrap:wrap}.automation-context-stats-v77>span{display:flex;align-items:baseline;gap:5px;font-size:9px;color:#737373;text-transform:uppercase;letter-spacing:.04em}.automation-context-stats-v77>span>b{font-size:20px;color:#111;letter-spacing:-.03em}.automation-context-stats-v77>button{margin-left:auto;height:36px;padding:0 14px;border:1px solid #d6d6d2;border-radius:8px;background:#fff;font-size:11px;font-weight:600}.automation-section-title-v77{display:grid;gap:3px}.automation-section-title-v77>strong{font-size:15px}.automation-section-title-v77>small{font-size:10px;color:#777}.automation-scenario-grid-v77{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.automation-scenario-grid-v77>button{min-height:72px;padding:11px;text-align:left;border:1px solid #dededb;border-radius:10px;background:#fafaf9;display:grid;align-content:center;gap:4px}.automation-scenario-grid-v77>button.active{border-color:#171717;background:#fff;box-shadow:inset 0 0 0 1px #171717}.automation-scenario-grid-v77 strong{font-size:12px}.automation-scenario-grid-v77 small{font-size:9px;line-height:1.35;color:#777}.automation-category-v77{display:grid;gap:6px;max-width:440px}.automation-preset-note-v77{min-height:58px;border:1px solid #e2e2df;background:#fafaf9;border-radius:10px;padding:11px 13px;display:flex;gap:14px;align-items:center}.automation-preset-note-v77>b{font-size:12px;white-space:nowrap}.automation-preset-note-v77>span{font-size:10px;color:#6d6d6d;line-height:1.45}.automation-custom-v77{display:grid;gap:12px;border-top:1px solid #e4e4e1;padding-top:14px}.automation-custom-block-v77{display:grid;gap:10px}.automation-custom-title-v77{display:flex;align-items:center;justify-content:space-between;gap:12px}.automation-custom-title-v77>strong{font-size:12px}.automation-custom-title-v77>small{font-size:9px;color:#888}.automation-condition-row-v77{grid-template-columns:minmax(125px,1.15fr) minmax(105px,.7fr) minmax(150px,1fr) 38px!important}.automation-sort-v77{display:grid;gap:7px}.automation-sort-row-v77{display:grid;grid-template-columns:38px minmax(0,1fr) 38px;gap:8px;align-items:center}.automation-sort-row-v77>b{height:42px;border-radius:8px;background:#f1f1ef;display:grid;place-items:center;font-size:12px}.automation-sort-row-v77>select{height:42px;border:1px solid #d7d7d3;border-radius:9px;padding:0 12px;background:#fff;font-size:11px}.automation-sort-row-v77>button{height:38px;border:0;background:transparent;display:grid;place-items:center}.automation-distribution-v77{display:grid;gap:18px}.automation-option-group-v77{display:grid;gap:9px}.automation-option-group-v77>strong{font-size:12px}.automation-check-v77{border:1px solid #dededb;border-radius:10px;padding:12px;display:flex;gap:10px;align-items:flex-start}.automation-check-v77 input{margin-top:2px}.automation-check-v77 span{display:grid;gap:2px}.automation-check-v77 b{font-size:11px}.automation-check-v77 small{font-size:9px;color:#888}.automation-radio-stack-v77{display:grid;gap:6px}.automation-radio-stack-v77>label{min-height:42px;border:1px solid #e0e0dd;border-radius:9px;padding:9px 11px;display:flex;align-items:center;gap:9px}.automation-radio-stack-v77>label>span{display:flex;align-items:center;gap:8px;min-width:0}.automation-radio-stack-v77 b{font-size:11px}.automation-radio-stack-v77 small{font-size:9px;color:#888}.automation-radio-stack-v77 input[type=number]{width:70px;height:30px;border:1px solid #d7d7d3;border-radius:6px;padding:0 8px}.automation-radio-cards-v77{display:grid;grid-template-columns:1fr 1fr;gap:8px}.automation-radio-cards-v77>label{min-height:82px;padding:12px;border:1px solid #dededb;border-radius:10px;display:flex;align-items:flex-start;gap:9px}.automation-radio-cards-v77>label.active{border-color:#171717;box-shadow:inset 0 0 0 1px #171717}.automation-radio-cards-v77 span{display:grid;gap:4px}.automation-radio-cards-v77 b{font-size:11px}.automation-radio-cards-v77 small{font-size:9px;line-height:1.4;color:#777}.automation-repeat-forecast-v77{border:1px solid #dcdcd8;background:#f8f8f6;border-radius:10px;padding:11px 13px;display:flex;align-items:center;gap:12px}.automation-repeat-forecast-v77>strong{font-size:27px}.automation-repeat-forecast-v77>span{display:grid;gap:2px;font-size:10px}.automation-repeat-forecast-v77 small{font-size:9px;color:#777}.automation-fallback-intro-v77{font-size:10px;color:#777;line-height:1.45;margin-bottom:10px}.automation-fallback-v77{display:grid;gap:6px}.automation-fallback-row-v77{min-height:52px;border:1px solid #dfdfdc;border-radius:9px;background:#fff;padding:7px 9px;display:grid;grid-template-columns:22px 26px minmax(0,1fr) minmax(0,210px) 36px;gap:7px;align-items:center}.automation-fallback-row-v77>svg{color:#929292;cursor:grab}.automation-fallback-row-v77>b{font-size:10px;color:#888}.automation-fallback-row-v77>span{display:grid;gap:2px}.automation-fallback-row-v77>span>strong{font-size:10px}.automation-fallback-row-v77>span>small{font-size:8px;color:#888;text-transform:uppercase;letter-spacing:.04em}.automation-fallback-row-v77>select{height:34px;border:1px solid #d8d8d5;border-radius:7px;background:#fff;padding:0 8px;font-size:9px}.automation-fallback-row-v77.backlog{opacity:.48;background:#f5f5f3}.automation-fallback-row-v77.backlog>span>small{display:inline-flex;width:max-content;padding:2px 5px;border:1px solid #c7c7c3;border-radius:4px;color:#555}.automation-switch-v77{width:32px;height:18px;position:relative}.automation-switch-v77 input{position:absolute;opacity:0}.automation-switch-v77 i{display:block;width:32px;height:18px;border-radius:10px;background:#d5d5d2;position:relative;transition:.15s}.automation-switch-v77 i:after{content:'';position:absolute;width:14px;height:14px;left:2px;top:2px;border-radius:50%;background:#fff;transition:.15s}.automation-switch-v77 input:checked+i{background:#171717}.automation-switch-v77 input:checked+i:after{transform:translateX(14px)}.automation-switch-v77 input:disabled+i{background:#ddd}.automation-footer-v77>div{margin-right:auto;display:grid;gap:2px}.automation-footer-v77>div>span{font-size:10px;font-weight:700}.automation-footer-v77>div>small{font-size:8px;color:#888}.automation-footer-v77 button:disabled{opacity:.4;cursor:not-allowed}
@media(max-width:760px){.automation-modal-v77{width:96vw!important}.automation-scenario-grid-v77{grid-template-columns:1fr 1fr}.automation-radio-cards-v77{grid-template-columns:1fr}.automation-condition-row-v77{grid-template-columns:1fr!important}.automation-fallback-row-v77{grid-template-columns:20px 24px minmax(0,1fr) 34px}.automation-fallback-row-v77>select{grid-column:3/5}.automation-context-stats-v77>button{margin-left:0}.automation-head-v77>div>strong{font-size:26px!important}}
`;
  writeFileSync(cssPath,css);
}

console.log('V77 applied: page-context filter, scenario presets, exact 14 sorts, reserve/distribution and ordered OOS fallback');
