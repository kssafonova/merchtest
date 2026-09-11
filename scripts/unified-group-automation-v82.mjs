import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
let css=readFileSync(cssPath,'utf8');
const MARKER='UNIFIED_GROUP_AUTOMATION_V82';

if(!app.includes(MARKER)){
  const anchor='const RUNTIME_LOOKS_V81 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V81 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // The legacy group drawer had a different information architecture from the
  // single-section scenario editor. Keep the function for backwards-safe builds,
  // but never render it from the App anymore: every group entry uses V77/V69.
  const legacyRenderRx=/\{groupRulesOpenV60\s*&&\s*selectedSectionIdsEffectiveV60\.length\s*>\s*1\s*&&\s*<GroupSectionRulesDrawerV60[\s\S]*?\/?>\}/g;
  let replacedLegacyRender=false;
  app=app.replace(legacyRenderRx,()=>{
    replacedLegacyRender=true;
    return `{groupRulesOpenV60 && selectedSectionIdsEffectiveV60.length > 1 && (()=>{
      const groupTargetV82=sections.find((item)=>selectedSectionIdsEffectiveV60.includes(item.id) && !item.generatedByAutomationGroupV64) || sections.find((item)=>selectedSectionIdsEffectiveV60.includes(item.id));
      if(!groupTargetV82) return null;
      return <UnifiedAutomationDrawerV69
        key={'group-v82-'+groupTargetV82.id+'-'+selectedSectionIdsEffectiveV60.join('-')}
        targetSection={groupTargetV82}
        allSections={sections}
        selectedIds={selectedSectionIdsEffectiveV60}
        region={region}
        pageId={pageId}
        currentPage={currentPage}
        onApplySingle={applySingleAutomationV69}
        onApplyGroup={(rule,ids,options)=>{ applyGroupRulesV64(rule,ids,options); setGroupRulesOpenV60(false); }}
        onClose={()=>setGroupRulesOpenV60(false)}
      />;
    })()}`;
  });

  // Some intermediate generations use a longer V64 drawer render. Replace any
  // surviving legacy GroupSectionRulesDrawer render defensively.
  if(app.includes('groupRulesOpenV60') && app.includes('<GroupSectionRulesDrawerV60')){
    const genericRx=/\{groupRulesOpenV60[\s\S]{0,260}?<GroupSectionRulesDrawerV60[\s\S]*?\/?>\}/g;
    app=app.replace(genericRx,()=>{
      replacedLegacyRender=true;
      return `{groupRulesOpenV60 && selectedSectionIdsEffectiveV60.length > 1 && (()=>{
        const groupTargetV82=sections.find((item)=>selectedSectionIdsEffectiveV60.includes(item.id) && !item.generatedByAutomationGroupV64) || sections.find((item)=>selectedSectionIdsEffectiveV60.includes(item.id));
        return groupTargetV82 ? <UnifiedAutomationDrawerV69 key={'group-v82-'+groupTargetV82.id} targetSection={groupTargetV82} allSections={sections} selectedIds={selectedSectionIdsEffectiveV60} region={region} pageId={pageId} currentPage={currentPage} onApplySingle={applySingleAutomationV69} onApplyGroup={(rule,ids,options)=>{applyGroupRulesV64(rule,ids,options);setGroupRulesOpenV60(false);}} onClose={()=>setGroupRulesOpenV60(false)}/> : null;
      })()}`;
    });
  }

  if(!replacedLegacyRender && app.includes('<GroupSectionRulesDrawerV60')){
    throw new Error(MARKER+': legacy group drawer still rendered but render anchor was not recognized');
  }

  // When the user clicks Auto-rules on a section inside an existing group, all
  // source + generated sections are still highlighted. For a new explicit
  // multi-selection, preserve that selection and open the exact same editor.
  // Avoid opening both state-driven drawers at once.
  app=app.replaceAll('setGroupRulesOpenV60(true);','setAutomationTargetIdV69(null); setGroupRulesOpenV60(true);');

  // The V77 editor already shares one body for single and group. Make the top
  // context visually identical too: same title and same three KPI cells, with
  // group scope represented as metadata instead of a different-looking editor.
  app=app.replace(
    "<span>{isGroup?'АВТО-ПРАВИЛА · ГРУППА СЕКЦИЙ':'АВТО-ПРАВИЛА · СЕКЦИЯ'}</span><strong>Авто-наполнение</strong><small>{isGroup?'Один товарный пул → '+memberIdsV77.length+' макета секций':'Правила для выбранной секции'} · {automationPageContextLabelV77(pageId,currentPage)}</small>",
    "<span>АВТО-ПРАВИЛА</span><strong>Авто-наполнение</strong><small>{isGroup?('Группа · '+memberIdsV77.length+' секций · единый товарный пул'):('Секция · '+(targetSection?.titles?.ru||'выбранная'))} · {automationPageContextLabelV77(pageId,currentPage)}</small>"
  );

  // Same stats anatomy for both scopes. The only extra action for a group is
  // editing its membership; no separate group-specific card/panel is introduced.
  app=app.replace(
    "<div className=\"automation-context-stats-v77\"><span><b>{memberIdsV77.length}</b>{memberIdsV77.length===1?'секция':'секций'}</span><span><b>{statsV77.capacity}</b>слотов</span><span><b>{statsV77.candidates}</b>товаров</span>{memberIdsV77.length>1&&<button onClick={()=>setShowScopeV77((value)=>!value)}>Изменить состав</button>}</div>",
    "<div className=\"automation-context-stats-v77 automation-context-stats-v82\"><span><b>{memberIdsV77.length}</b>{memberIdsV77.length===1?'секция':'секций'}</span><span><b>{statsV77.capacity}</b>слотов</span><span><b>{statsV77.candidates}</b>товаров</span>{isGroup&&<button onClick={()=>setShowScopeV77((value)=>!value)}>{showScopeV77?'Скрыть состав':'Изменить состав'}</button>}</div>"
  );

  // Keep the same three sections and same wording hierarchy. Only the semantic
  // repeat target differs: one section vs a combination of sections.
  app=app.replaceAll("{isGroup?'Дублировать комбинацию секций автоматически.':'Дублировать эту секцию автоматически.'}","{isGroup?'Дублировать комбинацию секций автоматически.':'Дублировать секцию автоматически.'}");
  app=app.replaceAll("{isGroup?'комбинаций':'секций'} потребуется", "{isGroup?'комбинаций секций':'секций'} потребуется");

  // Keep obsolete group drawer CSS from visually leaking into the unified modal.
  // The old component may remain defined for transform compatibility, but hidden
  // if an unexpected stale branch tries to mount it.
  writeFileSync(appPath,app);
}

if(!css.includes('/* unified-group-automation-v82 */')){
  css+=String.raw`
/* unified-group-automation-v82 */
/* Group and single automation deliberately share one visual system. */
.automation-layer-v77 .automation-modal-v77{width:min(900px,calc(100vw - 48px))!important}
.automation-head-v77{min-height:82px!important}
.automation-context-stats-v82{grid-template-columns:repeat(3,minmax(0,1fr)) auto!important;align-items:stretch!important}
.automation-context-stats-v82>span{min-width:0!important}
.automation-context-stats-v82>button{align-self:stretch!important;white-space:nowrap!important}
.automation-scope-v76{margin-top:12px!important;border-top:1px solid #e7e7e7!important;padding-top:12px!important}
.automation-scope-list-v76{max-height:210px!important;overflow:auto!important}
/* If an obsolete group-specific drawer is mounted by stale state, never show a second editor. */
.group-rules-layer-v60:not(.unified-automation-layer-v69):has(.group-rules-drawer-v60:not(.unified-automation-drawer-v69)){display:none!important}
@media(max-width:760px){.automation-context-stats-v82{grid-template-columns:repeat(3,minmax(0,1fr))!important}.automation-context-stats-v82>button{grid-column:1/-1!important;height:34px!important}}
`;
  writeFileSync(cssPath,css);
}

console.log('V82 applied: group automation now uses exactly the same V77 scenario editor as a single section');
