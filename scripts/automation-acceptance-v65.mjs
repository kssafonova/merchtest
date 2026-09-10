import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='AUTOMATION_ACCEPTANCE_V65';

if(!app.includes(MARKER)){
  const anchor='const AUTOMATION_GROUPS_EVENTS_V64 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V64 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  const editorSig="function AutomationRuleEditorV63({ rule:sourceRule, region, capacity=0, scope='single', onChange, lockedUnderfill=false }) {";
  if(!app.includes(editorSig)) throw new Error(MARKER+': editor signature missing');
  app=app.replace(editorSig,"function AutomationRuleEditorV63({ rule:sourceRule, region, capacity=0, scope='single', onChange, lockedUnderfill=false, matchedCount=0, availableCount=0 }) {");

  const oldMatch='<div className="automation-match-v63"><span>Активных условий</span><strong>{activeConditions}</strong></div>';
  if(!app.includes(oldMatch)) throw new Error(MARKER+': candidate count anchor missing');
  app=app.replaceAll(oldMatch,'<div className="automation-match-v63 automation-match-v65"><span><b>Условий</b><strong>{activeConditions}</strong></span><span><b>Подходит</b><strong>{matchedCount}</strong></span><span><b>В наличии</b><strong>{availableCount}</strong></span></div>');

  const sectionEditor='<AutomationRuleEditorV63 rule={rule} region={region} capacity={slotCount(section.template)} scope="single" onChange={updateMaster}/>';
  if(!app.includes(sectionEditor)) throw new Error(MARKER+': section editor call missing');
  app=app.replace(sectionEditor,'<AutomationRuleEditorV63 rule={rule} region={region} capacity={slotCount(section.template)} scope="single" matchedCount={section.candidates?.length || 0} availableCount={section.availableCandidates?.length || 0} onChange={updateMaster}/>');

  const groupEditor='<AutomationRuleEditorV63 rule={draftV64} region={region} capacity={statsV64.capacity} scope="group" lockedUnderfill={draftV64.distribution.groupStrategy===\'repeat_section_combo\'} onChange={(next)=>setDraftV64({...normalizeAutomationRuleV63(next,memberIdsV64[0]||\'group\'),scope:{type:\'section_group\',sectionIds:memberIdsV64},state:\'draft\'})}/>';
  if(app.includes(groupEditor)) app=app.replace(groupEditor,'<AutomationRuleEditorV63 rule={draftV64} region={region} capacity={statsV64.capacity} scope="group" matchedCount={statsV64.candidates} availableCount={statsV64.candidates} lockedUnderfill={draftV64.distribution.groupStrategy===\'repeat_section_combo\'} onChange={(next)=>setDraftV64({...normalizeAutomationRuleV63(next,memberIdsV64[0]||\'group\'),scope:{type:\'section_group\',sectionIds:memberIdsV64},state:\'draft\'})}/>');

  const rememberOld="    if (status !== 'pin') ctx.usedAcross.add(String(product.id));";
  if(!app.includes(rememberOld)) throw new Error(MARKER+': PIN dedup anchor missing');
  app=app.replace(rememberOld,"    ctx.usedAcross.add(String(product.id));");

  const capacityAnchor="    if (!rule.selection.enabled) { slots.push({index,status:'empty',entity:null}); continue; }";
  if(!app.includes(capacityAnchor)) throw new Error(MARKER+': capacity anchor missing');
  app=app.replace(capacityAnchor,"    if (index >= capacity) { slots.push({index,status:'empty',entity:null,warning:'В резерве · вне ёмкости сетки'}); continue; }\n"+capacityAnchor);

  const detachOld='<button onClick={()=>SECTION_AUTOMATION_RUNTIME_V63.detachGroup?.(section.id)}>Отключить от группы</button>';
  if(!app.includes(detachOld)) throw new Error(MARKER+': detach group anchor missing');
  app=app.replace(detachOld,"<button onClick={()=>{ if(window.confirm('Отключить секцию от авто-группы?\\n\\nГрупповое правило перестанет действовать. Логика заполнения вернётся к leave_empty и потребует явной настройки.')) SECTION_AUTOMATION_RUNTIME_V63.detachGroup?.(section.id); }}>Отключить от группы</button>");

  const groupVisualOld="{section.automationGroup?.groupId ? <button className=\"automation-group-badge-v64\" style={{'--group-color-v64':section.automationGroup.colorToken || automationGroupColorV64(section.automationGroup.groupId)}} onClick={(event)=>{event.stopPropagation();highlightAutomationGroupV64(section.automationGroup.groupId);}} title=\"Показать все секции группы\">⚡ <span>{section.automationGroup.groupLabel || 'Авто-группа'}</span></button> : normalizeAutomationRuleV63(section.rules,section.id).selection.enabled ? <span className=\"automation-individual-v64\" title=\"Индивидуальные правила секции\">⚙</span> : null}";
  if(app.includes(groupVisualOld)) app=app.replace(groupVisualOld,"{section.automationGroup?.groupId && <button className=\"automation-group-badge-v64\" style={{'--group-color-v64':section.automationGroup.colorToken || automationGroupColorV64(section.automationGroup.groupId)}} onClick={(event)=>{event.stopPropagation();highlightAutomationGroupV64(section.automationGroup.groupId);}} title=\"Показать все секции группы\">⚡ <span>{section.automationGroup.groupLabel || 'Авто-группа'}</span></button>}{(section.hasIndividualAutomation || (!section.automationGroup?.groupId && normalizeAutomationRuleV63(section.rules,section.id).selection.enabled)) && <span className=\"automation-individual-v64\" title=\"Индивидуальные правила секции\">⚙</span>}");

  const eventAnchor="      if(Number(detail.stock)<=0) queueAutomationLiveChangeV64(sku,region,delay,affected);";
  if(!app.includes(eventAnchor)) throw new Error(MARKER+': OOS event anchor missing');
  app=app.replace(eventAnchor,"      if(Number(detail.stock)<=0){\n        for(const [cacheKey,ids] of AUTOMATION_RESERVE_CACHE_V63.entries()){ if(cacheKey.startsWith(region+':') && Array.isArray(ids) && ids.includes(sku)) AUTOMATION_RESERVE_CACHE_V63.set(cacheKey,ids.filter((id)=>id!==sku)); }\n        queueAutomationLiveChangeV64(sku,region,delay,affected);\n      }");

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* automation-acceptance-v65 */')){
  css+=String.raw`
/* automation-acceptance-v65 */
.automation-match-v65{display:grid!important;grid-template-columns:repeat(3,1fr)!important;padding:0!important;border:1px solid #e1e1e1!important;margin-top:10px!important}.automation-match-v65>span{min-height:42px;padding:7px 8px;border-right:1px solid #e8e8e8;display:grid;gap:2px;align-content:center}.automation-match-v65>span:last-child{border-right:0}.automation-match-v65 b{font-size:7px;color:#777;text-transform:uppercase;letter-spacing:.05em}.automation-match-v65 strong{font-size:13px;color:#111}.automation-individual-v64{flex:none!important}
`;
  writeFileSync(cssPath,css);
}
console.log('V65 applied: live candidate counts, PIN-aware dedup, capacity reserve, individual-rule indicator and guarded group detach');
