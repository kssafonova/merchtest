import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='AUTOMATION_GROUPS_EVENTS_V64';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const AUTOMATION_MASTER_V63 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V63 marker missing');

  const helpers=String.raw`
const AUTOMATION_GROUPS_EVENTS_V64 = true;

function automationGroupColorV64(groupId='') {
  let hash=0; for(const char of String(groupId)) hash=(hash*31+char.charCodeAt(0))>>>0;
  return AUTOMATION_GROUP_COLORS_V63[hash % AUTOMATION_GROUP_COLORS_V63.length];
}
function automationGroupIdV64(){ return 'AG-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(); }
function automationGroupLabelV64(sections){ return sections.length===1 ? (sections[0]?.titles?.ru || 'Авто-группа') : 'Авто-группа · '+sections.length+' секций'; }
function highlightAutomationGroupV64(groupId){
  if(!groupId) return;
  document.querySelectorAll('[data-group-id="'+groupId+'"]').forEach((node)=>node.classList.add('automation-group-highlight-v64'));
  window.setTimeout(()=>document.querySelectorAll('[data-group-id="'+groupId+'"]').forEach((node)=>node.classList.remove('automation-group-highlight-v64')),2000);
}
function automationGroupCandidateStatsV64(rule,memberSections,region){
  const candidates=queryAutomationIndexV63(rule.selection,region).filter((product)=>Number(automationProductValueV63(product,'stock',region))>0);
  const capacity=(memberSections||[]).reduce((sum,section)=>sum+slotCount(section.template),0);
  const reserve=Math.max(0,candidates.length-capacity);
  return {candidates:candidates.length,capacity,reserve,underfill:Math.max(0,capacity-candidates.length)};
}
function registerAutomationWatchV64(resolved,region){
  for(const [key,value] of AUTOMATION_SKU_WATCH_V63.entries()) if(key.startsWith(region+':')) AUTOMATION_SKU_WATCH_V63.delete(key);
  (resolved||[]).forEach((section)=>(section.resolvedSlots||[]).forEach((slot)=>{
    if(!slot.entity || entityKind(slot.entity.id)!=='product') return;
    const key=region+':'+String(slot.entity.id);
    if(!AUTOMATION_SKU_WATCH_V63.has(key)) AUTOMATION_SKU_WATCH_V63.set(key,new Set());
    AUTOMATION_SKU_WATCH_V63.get(key).add(section.id);
  }));
}
function queueAutomationLiveChangeV64(sku,region,delaySec,sectionIds){
  const id=region+':'+sku+':'+Date.now();
  const dueAt=Date.now()+Math.max(300,Number(delaySec||300))*1000;
  AUTOMATION_LIVE_QUEUE_V63.set(id,{id,sku,region,sectionIds:[...(sectionIds||[])],queuedAt:new Date().toISOString(),dueAt:new Date(dueAt).toISOString(),state:'queued'});
  window.setTimeout(()=>{ const item=AUTOMATION_LIVE_QUEUE_V63.get(id); if(item) AUTOMATION_LIVE_QUEUE_V63.set(id,{...item,state:'applied',appliedAt:new Date().toISOString()}); },Math.max(300,Number(delaySec||300))*1000);
}
if(typeof window!=='undefined'){
  window.__MERCH_AUTOMATION__={
    emitStockChange:(sku,stock,region='RU')=>window.dispatchEvent(new CustomEvent('merch:stock-change-v64',{detail:{sku:String(sku),stock:Number(stock),region}})),
    watched:()=>Array.from(AUTOMATION_SKU_WATCH_V63.entries()).map(([key,value])=>({key,sections:Array.from(value)})),
    liveQueue:()=>Array.from(AUTOMATION_LIVE_QUEUE_V63.values()),
    reserve:(ruleId,region='RU')=>AUTOMATION_RESERVE_CACHE_V63.get(region+':'+ruleId)||[],
  };
}
`;
  app=app.replace(anchor,anchor+'\n'+helpers);

  const drawerPart=functionChunk(app,'GroupSectionRulesDrawerV60');
  const drawer=String.raw`function GroupSectionRulesDrawerV60({ sections, allSections=[], region, onApply, onClose }) {
  const initialMembers = sections || [];
  const existingGroup = initialMembers.find((section)=>section.automationGroup?.groupId)?.automationGroup || null;
  const initialIds = existingGroup?.memberSectionIds?.filter((id)=>allSections.some((section)=>section.id===id)) || initialMembers.map((section)=>section.id);
  const seedRule = initialMembers.find((section)=>section.groupRuleV63)?.groupRuleV63 || initialMembers[0]?.rules || defaultAutomationRuleV63(initialIds[0]||'group');
  const [memberIdsV64,setMemberIdsV64]=useState(initialIds.slice(0,AUTOMATION_MAX_GROUP_SECTIONS_V63));
  const [draftV64,setDraftV64]=useState(()=>{ const rule=normalizeAutomationRuleV63(seedRule,initialIds[0]||'group'); return {...rule,state:'draft',scope:{type:'section_group',sectionIds:initialIds}}; });
  const [showAddV64,setShowAddV64]=useState(false);
  const memberSectionsV64=memberIdsV64.map((id)=>allSections.find((section)=>section.id===id)).filter(Boolean);
  const statsV64=automationGroupCandidateStatsV64(draftV64,memberSectionsV64,region);
  const overLimitV64=memberIdsV64.length>AUTOMATION_MAX_GROUP_SECTIONS_V63;
  const availableToAddV64=allSections.filter((section)=>!memberIdsV64.includes(section.id) && !section.generatedByAutomationGroupV64);
  const toggleMemberV64=(id)=>setMemberIdsV64((previous)=> previous.includes(id) ? previous.filter((item)=>item!==id) : previous.length>=AUTOMATION_MAX_GROUP_SECTIONS_V63 ? previous : [...previous,id]);
  const applyV64=(mode)=>{ if(memberIdsV64.length<2 || overLimitV64) return; const rule={...draftV64,state:'draft',scope:{type:'section_group',sectionIds:memberIdsV64}}; onApply(rule,memberIdsV64,{mode,groupId:existingGroup?.groupId || null}); };
  return createPortal(<div className="group-rules-layer-v60 group-rules-layer-v64" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}>
    <aside className="group-rules-drawer-v60 group-rules-drawer-v64" onMouseDown={(event)=>event.stopPropagation()}>
      <header className="group-rules-head-v60 group-rules-head-v64"><div><span>АВТО-ПРАВИЛА · ГРУППА</span><strong>{memberIdsV64.length} из {AUTOMATION_MAX_GROUP_SECTIONS_V63} секций</strong><small>Общее правило. Ручные PIN сохраняют фиксированные позиции.</small></div><button onClick={onClose}><X size={18}/></button></header>
      <div className="group-rules-scroll-v60 group-rules-scroll-v64">
        <section className="automation-group-members-v64"><div className="automation-group-members-head-v64"><div><span>СОСТАВ ГРУППЫ</span><strong>Фиксированный набор секций</strong></div><button onClick={()=>setShowAddV64((value)=>!value)}><Plus size={12}/>Добавить секции в группу</button></div>
          <div className="automation-group-member-list-v64">{memberSectionsV64.map((section,index)=><label key={section.id}><input type="checkbox" checked onChange={()=>toggleMemberV64(section.id)}/><span><strong>{section.titles?.ru || section.typeId}</strong><small>{layoutDisplayName(section.template)} · {slotCount(section.template)} слотов</small></span><em>{index+1}</em></label>)}</div>
          {showAddV64 && <div className="automation-group-add-v64"><span>Можно добавить ещё {Math.max(0,AUTOMATION_MAX_GROUP_SECTIONS_V63-memberIdsV64.length)} секций</span>{availableToAddV64.map((section)=><label key={section.id} className={memberIdsV64.length>=AUTOMATION_MAX_GROUP_SECTIONS_V63?'disabled':''}><input type="checkbox" disabled={memberIdsV64.length>=AUTOMATION_MAX_GROUP_SECTIONS_V63} checked={false} onChange={()=>toggleMemberV64(section.id)}/><span><strong>{section.titles?.ru || section.typeId}</strong><small>{layoutDisplayName(section.template)}</small></span></label>)}</div>}
        </section>
        <div className={'automation-group-capacity-v64 '+(statsV64.underfill?'warning':'ok')}><span><b>Подходит</b><strong>{statsV64.candidates}</strong></span><span><b>Слотов</b><strong>{statsV64.capacity}</strong></span><span><b>Резерв</b><strong>{statsV64.reserve}</strong></span>{statsV64.underfill>0 && <em>Не хватает {statsV64.underfill} товаров: проверьте fallback или заполнение.</em>}</div>
        <AutomationRuleEditorV63 rule={draftV64} region={region} capacity={statsV64.capacity} scope="group" lockedUnderfill={draftV64.distribution.groupStrategy==='repeat_section_combo'} onChange={(next)=>setDraftV64({...normalizeAutomationRuleV63(next,memberIdsV64[0]||'group'),scope:{type:'section_group',sectionIds:memberIdsV64},state:'draft'})}/>
        {statsV64.reserve===0 && memberIdsV64.length>2 && <div className="automation-reserve-warning-v64"><AlertTriangle size={14}/><span>Резерв-пул исчерпан. При добавлении новых секций система довыполнит индексный отбор; если товаров не хватит, слоты останутся по выбранной fallback-логике.</span></div>}
      </div>
      <footer className="group-rules-footer-v60 group-rules-footer-v64"><span>По умолчанию — инкрементально: существующие секции сохраняют порядок распределения.</span><button onClick={()=>applyV64('full')} disabled={memberIdsV64.length<2}>Пересчитать полностью</button><button className="primary" onClick={()=>applyV64('incremental')} disabled={memberIdsV64.length<2 || overLimitV64}>{existingGroup?'Сохранить группу':'Создать авто-группу'}</button></footer>
    </aside>
  </div>,document.body);
}
`;
  app=app.slice(0,drawerPart.start)+drawer+app.slice(drawerPart.end);

  const applyStart=app.indexOf('  const applyGroupRulesV60 = (nextRules) => {');
  const applyEnd=applyStart>=0?app.indexOf('\n  };',applyStart):-1;
  if(applyStart<0||applyEnd<0) throw new Error(MARKER+': applyGroupRulesV60 anchor missing');
  const applyV64=String.raw`
  const applyGroupRulesV64 = (nextRule,memberIds,options={}) => {
    const uniqueIds=Array.from(new Set(memberIds||[])).slice(0,AUTOMATION_MAX_GROUP_SECTIONS_V63);
    if(uniqueIds.length<2){ setToast('Для авто-группы выберите минимум 2 секции'); window.setTimeout(()=>setToast(''),1500); return; }
    const sourceSections=sections.filter((section)=>uniqueIds.includes(section.id) && !section.generatedByAutomationGroupV64);
    const existing=sourceSections.find((section)=>section.automationGroup?.groupId)?.automationGroup;
    const groupId=options.groupId || existing?.groupId || automationGroupIdV64();
    const colorToken=existing?.colorToken || automationGroupColorV64(groupId);
    let finalIds=[...uniqueIds];
    let repeatClones=[];
    const normalized=normalizeAutomationRuleV63(nextRule,uniqueIds[0]);
    normalized.scope={type:'section_group',sectionIds:finalIds};
    normalized.state='draft';
    if(normalized.distribution.groupStrategy==='repeat_section_combo' && options.mode==='full'){
      const stats=automationGroupCandidateStatsV64(normalized,sourceSections,region);
      const baseCapacity=Math.max(1,stats.capacity);
      const repeatCount=Math.max(1,Math.min(normalized.distribution.maxRepeatCount,Math.ceil(Math.max(stats.candidates,1)/baseCapacity)));
      for(let repeatIndex=2;repeatIndex<=repeatCount;repeatIndex+=1){
        for(const source of sourceSections){
          if(finalIds.length>=AUTOMATION_MAX_GROUP_SECTIONS_V63) break;
          const cloneId=source.id+'-AUTO-'+groupId+'-'+repeatIndex;
          finalIds.push(cloneId);
          repeatClones.push({...source,id:cloneId,pins:{},generatedByAutomationGroupV64:true,automationRepeatIndexV64:repeatIndex,automationGroup:null,groupRuleV63:null});
        }
      }
    }
    normalized.scope={type:'section_group',sectionIds:finalIds};
    mutateSections((previous)=>{
      const withoutOldGenerated=previous.filter((section)=>!(section.generatedByAutomationGroupV64 && section.automationGroup?.groupId===groupId));
      const baseUpdated=withoutOldGenerated.map((section)=>{
        const wasMember=section.automationGroup?.groupId===groupId;
        if(!finalIds.includes(section.id)) return wasMember ? {...section,automationGroup:null,groupRuleV63:null,rules:automationCompatRulesV63({...normalizeAutomationRuleV63(section.rules,section.id),state:'draft',distribution:{...normalizeAutomationRuleV63(section.rules,section.id).distribution,sectionUnderfillLocked:false,sectionUnderfillStrategy:'leave_empty'}},section.rules)} : section;
        const individual=normalizeAutomationRuleV63(section.rules,section.id).selection.enabled;
        return {...section,automationGroup:{groupId,groupLabel:'Авто-группа · '+finalIds.length+' секций',memberSectionIds:finalIds,colorToken},groupRuleV63:automationCloneV63(normalized),hasIndividualAutomation:individual};
      });
      const clones=repeatClones.map((clone)=>({...clone,automationGroup:{groupId,groupLabel:'Авто-группа · '+finalIds.length+' секций',memberSectionIds:finalIds,colorToken},groupRuleV63:automationCloneV63(normalized),hasIndividualAutomation:false}));
      return [...baseUpdated,...clones];
    });
    setSelectedSectionIdsV60(finalIds.filter((id)=>!id.includes('-AUTO-')));
    setGroupRulesOpenV60(false);
    setToast((options.mode==='full'?'Полный пересчёт':'Инкрементальное применение')+' · '+finalIds.length+' секций');
    window.setTimeout(()=>setToast(''),1800);
  };
`;
  app=app.slice(0,applyEnd+5)+applyV64+app.slice(applyEnd+5);

  app=app.replace(/<GroupSectionRulesDrawerV60 sections=\{sections\.filter\(\(item\) => selectedSectionIdsEffectiveV60\.includes\(item\.id\)\)\} region=\{region\} onApply=\{applyGroupRulesV60\}/g,'<GroupSectionRulesDrawerV60 sections={sections.filter((item) => selectedSectionIdsEffectiveV60.includes(item.id))} allSections={sections} region={region} onApply={applyGroupRulesV64}');

  const canvasPart=functionChunk(app,'SectionCanvas');
  let canvas=canvasPart.chunk;
  const clickAnchor='onClick={(event) => onSelect(section.id, event)}';
  if(canvas.includes(clickAnchor)) canvas=canvas.replace(clickAnchor,"data-section-id={section.id} data-group-id={section.automationGroup?.groupId || ''} onClick={(event) => onSelect(section.id, event)}");
  const identityAnchor='<div className="section-author-identity-v57 section-author-identity-v60"><strong>{section.titles?.[locale] || section.titles?.ru || \'Секция\'}</strong><small>{layoutDisplayName(section.template)} · {section.resolvedSlots?.filter((slot) => slot.entity).length || 0}/{section.resolvedSlots?.length || 0}</small></div>';
  if(canvas.includes(identityAnchor)){
    canvas=canvas.replace(identityAnchor,identityAnchor+String.raw`{section.automationGroup?.groupId ? <button className="automation-group-badge-v64" style={{'--group-color-v64':section.automationGroup.colorToken || automationGroupColorV64(section.automationGroup.groupId)}} onClick={(event)=>{event.stopPropagation();highlightAutomationGroupV64(section.automationGroup.groupId);}} title="Показать все секции группы">⚡ <span>{section.automationGroup.groupLabel || 'Авто-группа'}</span></button> : normalizeAutomationRuleV63(section.rules,section.id).selection.enabled ? <span className="automation-individual-v64" title="Индивидуальные правила секции">⚙</span> : null}`);
  }
  app=app.slice(0,canvasPart.start)+canvas+app.slice(canvasPart.end);

  const treeNeedle='<small>{layoutDisplayName(section.template)} · {section.resolvedSlots.filter((slot) => slot.entity).length}/{section.resolvedSlots.length}</small></span><em>{index + 1}</em>';
  if(app.includes(treeNeedle)) app=app.replaceAll(treeNeedle,'<small>{layoutDisplayName(section.template)} · {section.resolvedSlots.filter((slot) => slot.entity).length}/{section.resolvedSlots.length}</small></span>{section.automationGroup?.groupId ? <i className="automation-tree-group-dot-v64" style={{background:section.automationGroup.colorToken || automationGroupColorV64(section.automationGroup.groupId)}} title={section.automationGroup.groupLabel || \'Авто-группа\'}/> : normalizeAutomationRuleV63(section.rules,section.id).selection.enabled ? <i className="automation-tree-individual-v64" title="Индивидуальная автоматизация">⚙</i> : null}<em>{index + 1}</em>');

  const selectedAnchor='  const selected = resolved.find((s) => s.id === selectedId) || resolved[0] || null;';
  if(!app.includes(selectedAnchor)) throw new Error(MARKER+': selected anchor missing');
  app=app.replace(selectedAnchor,selectedAnchor+String.raw`
  useEffect(()=>{ registerAutomationWatchV64(resolved,region); },[resolved,region]);
  useEffect(()=>{
    const onStock=(event)=>{
      const detail=event.detail || {}; const eventRegion=detail.region || region; const sku=String(detail.sku || '');
      if(eventRegion!==region || !sku || !AUTOMATION_SKU_WATCH_V63.has(region+':'+sku)) return;
      const product=PRODUCTS.find((item)=>String(item.id)===sku || String(item.sku||'')===sku); if(!product) return;
      product.stock={...(product.stock||{}),[region]:Number(detail.stock)};
      const affected=Array.from(AUTOMATION_SKU_WATCH_V63.get(region+':'+sku)||[]);
      const delays=affected.map((id)=>normalizeAutomationRuleV63(sections.find((section)=>section.id===id)?.groupRuleV63 || sections.find((section)=>section.id===id)?.rules || {},id).fallback.applyOnLiveDelaySec);
      const delay=Math.max(300,Math.min(...(delays.length?delays:[300])));
      if(Number(detail.stock)<=0) queueAutomationLiveChangeV64(sku,region,delay,affected);
      setPageSections((previous)=>({...previous,[region]:{...(previous[region]||{}),[pageId]:[...(previous[region]?.[pageId]||[])]}}));
      setToast('OOS-событие · '+sku+' · пересчитано '+affected.length+' слотов/секций'); window.setTimeout(()=>setToast(''),1800);
    };
    window.addEventListener('merch:stock-change-v64',onStock); return ()=>window.removeEventListener('merch:stock-change-v64',onStock);
  },[region,pageId,sections]);`);

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* automation-groups-events-v64 */')){
  css+=String.raw`
/* automation-groups-events-v64 */
.automation-group-badge-v64{height:25px!important;max-width:170px!important;border:1px dashed var(--group-color-v64,#1473e6)!important;background:#fff!important;color:#222!important;padding:0 7px!important;display:flex!important;align-items:center!important;gap:4px!important;font-size:7px!important;white-space:nowrap!important;overflow:hidden!important}.automation-group-badge-v64 span{overflow:hidden;text-overflow:ellipsis}.automation-individual-v64{width:24px;height:24px;display:grid;place-items:center;color:#555;font-size:11px}.builder-section[data-group-id]:not([data-group-id=""]){outline:1px dashed color-mix(in srgb,var(--group-color-v64,#1473e6) 55%,#bbb);outline-offset:3px}.automation-group-highlight-v64{box-shadow:0 0 0 3px rgba(20,115,230,.18)!important;transition:box-shadow .18s!important}.automation-tree-group-dot-v64{width:7px;height:7px;border-radius:50%;flex:none}.automation-tree-individual-v64{font-size:9px;color:#666;font-style:normal}
.group-rules-drawer-v64{width:min(620px,calc(100vw - 70px))!important}.group-rules-scroll-v64{padding-top:14px!important}.automation-group-members-v64{border-bottom:1px solid #e5e5e5;padding-bottom:16px;margin-bottom:14px}.automation-group-members-head-v64{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.automation-group-members-head-v64>div{display:grid;gap:2px}.automation-group-members-head-v64 span{font-size:7px;color:#777}.automation-group-members-head-v64 strong{font-size:11px}.automation-group-members-head-v64>button{height:30px;border:1px solid #d5d5d5;background:#fff;padding:0 8px;display:flex;align-items:center;gap:4px;font-size:8px}.automation-group-member-list-v64,.automation-group-add-v64{display:grid;margin-top:9px;border-top:1px solid #eee}.automation-group-member-list-v64 label,.automation-group-add-v64 label{min-height:38px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:7px;padding:5px 4px}.automation-group-member-list-v64 label>span,.automation-group-add-v64 label>span{display:grid;gap:1px;flex:1}.automation-group-member-list-v64 strong,.automation-group-add-v64 strong{font-size:8px}.automation-group-member-list-v64 small,.automation-group-add-v64 small{font-size:7px;color:#888}.automation-group-member-list-v64 em{font-size:7px;color:#999}.automation-group-add-v64>span{padding:8px 3px;font-size:7px;color:#777}.automation-group-add-v64 label.disabled{opacity:.45}
.automation-group-capacity-v64{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #ddd;margin-bottom:12px}.automation-group-capacity-v64>span{min-height:44px;padding:7px;border-right:1px solid #eee;display:grid;gap:2px;align-content:center}.automation-group-capacity-v64 b{font-size:7px;color:#777;text-transform:uppercase}.automation-group-capacity-v64 strong{font-size:13px}.automation-group-capacity-v64>em{grid-column:1/-1;padding:7px 9px;background:#fff8e6;color:#8a5a00;font-size:7px;font-style:normal}.automation-reserve-warning-v64{margin-top:12px;padding:9px;border:1px solid #e3c98a;background:#fffaf0;display:flex;align-items:flex-start;gap:7px;font-size:8px;line-height:1.4;color:#74520b}.group-rules-footer-v64{display:grid!important;grid-template-columns:1fr auto auto!important}.group-rules-footer-v64>span{font-size:7px;color:#777;line-height:1.35}.group-rules-footer-v64 button:disabled{opacity:.35}
@media(max-width:700px){.group-rules-drawer-v64{width:100vw!important}.group-rules-footer-v64{grid-template-columns:1fr!important}.group-rules-footer-v64>span{display:none}.automation-group-badge-v64 span{display:none}.automation-group-badge-v64{width:27px!important;padding:0!important;justify-content:center!important}}
`;
  writeFileSync(cssPath,css);
}
console.log('V64 applied: persistent automation groups, 20-section limit, incremental/full recalc UX, group visuals and event-driven OOS adapter');
