import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='SECTION_AUTHORING_UNIFIED_V69';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const REPEAT_COMBO_VISIBLE_V68 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V68 marker missing');

  const helpers=String.raw`
const SECTION_AUTHORING_UNIFIED_V69 = true;

function contentMediaItemsV69(entity){
  if(!entity) return [];
  const normalize=(item,index)=>{
    if(!item) return null;
    if(typeof item==='string') return {src:item,kind:/\.(mp4|webm|mov)(\?|$)/i.test(item)?'video':'image',key:item};
    const src=item.src || item.url || item.image || item.file || '';
    if(!src) return null;
    return {src,kind:item.kind || (/\.(mp4|webm|mov)(\?|$)/i.test(src)?'video':'image'),key:item.id || src || String(index)};
  };
  let items=[];
  if('price' in entity){
    try { items=productMediaItems(entity) || []; } catch { items=[]; }
  } else if(entity.kind==='look'){
    try { items=normalizeLookMediaV55(entity) || []; } catch { items=[]; }
  } else {
    items=[...(entity.mediaItems || []),...(entity.images || []),entity.image,entity.src,entity.url].filter(Boolean);
  }
  const seen=new Set();
  return items.map(normalize).filter((item)=>item && !seen.has(item.src) && seen.add(item.src)).slice(0,8);
}

function ContentMediaPagerV69({entity}){
  const items=contentMediaItemsV69(entity);
  const [activeV69,setActiveV69]=useState(0);
  if(items.length<=1) return null;
  const active=items[Math.min(activeV69,items.length-1)];
  return <>
    {activeV69>0 && <div className="content-media-preview-override-v69">{active.kind==='video' ? <video src={active.src} muted playsInline/> : <img src={active.src} alt=""/>}</div>}
    <div className="content-media-pager-v69" aria-label="Медиа сущности">{items.map((item,index)=><button key={item.key+'-'+index} className={activeV69===index?'active':''} onClick={(event)=>{event.preventDefault();event.stopPropagation();setActiveV69(index);}} title={'Медиа '+(index+1)}>{index+1}</button>)}</div>
  </>;
}

function UnifiedAutomationDrawerV69({ targetSection, allSections=[], region, onApplySingle, onApplyGroup, onClose }){
  const group=targetSection?.automationGroup || null;
  const isGroup=Boolean(group?.groupId);
  const sourceIds=isGroup
    ? ((group.sourceSectionIdsV68?.length ? group.sourceSectionIdsV68 : (group.memberSectionIds || []).filter((id)=>{const item=allSections.find((section)=>section.id===id);return item && !item.generatedByAutomationGroupV64;})).filter((id)=>allSections.some((section)=>section.id===id)))
    : [targetSection?.id].filter(Boolean);
  const scopeSections=sourceIds.map((id)=>allSections.find((section)=>section.id===id)).filter(Boolean);
  const seed=isGroup ? (targetSection?.groupRuleV63 || targetSection?.rules) : targetSection?.rules;
  const [draftV69,setDraftV69]=useState(()=>{
    const rule=normalizeAutomationRuleV63(seed || {},sourceIds[0] || targetSection?.id || 'section');
    return {...rule,state:'draft',scope:{type:isGroup?'section_group':'single_section',sectionIds:sourceIds}};
  });
  const stats=automationGroupCandidateStatsV64(draftV69,scopeSections,region);
  const save=(mode='incremental')=>{
    const rule={...normalizeAutomationRuleV63(draftV69,sourceIds[0] || targetSection.id),state:'draft',scope:{type:isGroup?'section_group':'single_section',sectionIds:sourceIds}};
    if(isGroup) onApplyGroup?.(rule,sourceIds,{mode,groupId:group.groupId});
    else onApplySingle?.(rule,targetSection.id);
  };
  return createPortal(<div className="group-rules-layer-v60 group-rules-layer-v64 unified-automation-layer-v69" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}>
    <aside className="group-rules-drawer-v60 group-rules-drawer-v64 unified-automation-drawer-v69" onMouseDown={(event)=>event.stopPropagation()}>
      <header className="group-rules-head-v60 group-rules-head-v64 unified-automation-head-v69">
        <div><span>{isGroup?'АВТО-ПРАВИЛА · ГРУППА':'АВТО-ПРАВИЛА · СЕКЦИЯ'}</span><strong>{isGroup ? (group.groupLabel || sourceIds.length+' секций') : (targetSection?.titles?.ru || 'Секция')}</strong><small>{isGroup ? 'Редактируется единое правило всей группы. Все секции группы выделены на canvas.' : 'Правило действует только на эту секцию. Ручные PIN остаются приоритетнее AUTO.'}</small></div>
        <button onClick={onClose} title="Закрыть"><X size={18}/></button>
      </header>
      <div className="group-rules-scroll-v60 group-rules-scroll-v64 unified-automation-scroll-v69">
        <div className="automation-scope-summary-v69"><span><b>Область</b><strong>{isGroup ? sourceIds.length+' базовых секций' : '1 секция'}</strong></span><span><b>Подходит</b><strong>{stats.candidates}</strong></span><span><b>Слотов</b><strong>{stats.capacity}</strong></span><span><b>Резерв</b><strong>{stats.reserve}</strong></span></div>
        {isGroup && <div className="automation-group-members-compact-v69">{scopeSections.map((section,index)=><span key={section.id}><b>{index+1}</b>{section.titles?.ru || section.typeId || 'Секция'}</span>)}</div>}
        <AutomationRuleEditorV63 rule={draftV69} region={region} capacity={stats.capacity} scope={isGroup?'group':'single'} matchedCount={stats.candidates} availableCount={stats.candidates} lockedUnderfill={isGroup && draftV69.distribution.groupStrategy==='repeat_section_combo'} onChange={(next)=>setDraftV69({...normalizeAutomationRuleV63(next,sourceIds[0]||targetSection.id),state:'draft',scope:{type:isGroup?'section_group':'single_section',sectionIds:sourceIds}})}/>
      </div>
      <footer className="group-rules-footer-v60 group-rules-footer-v64 unified-automation-footer-v69">
        <span>{isGroup ? 'Изменения применятся ко всей группе.' : 'Изменения применятся только к этой секции.'}</span>
        <button onClick={onClose}>Отмена</button>
        {isGroup && <button onClick={()=>save('full')}>Пересчитать полностью</button>}
        <button className="primary" onClick={()=>save('incremental')}>Сохранить правила</button>
      </footer>
    </aside>
  </div>,document.body);
}
`;
  app=app.replace(anchor,anchor+'\n'+helpers);

  // STYLE: responsive layout editing lives inside the Style drawer.
  const stylePart=functionChunk(app,'SectionStyleDrawerV57');
  let style=stylePart.chunk;
  const hideState="  const [hideElementsV57, setHideElementsV57] = useState(Boolean(initialStyle.hideElements));";
  if(!style.includes(hideState)) throw new Error(MARKER+': style state anchor missing');
  style=style.replace(hideState,hideState+"\n  const [layoutDeviceV69,setLayoutDeviceV69]=useState('desktop');");
  const previewAnchor='<div className="section-style-preview-v57"';
  const previewAt=style.indexOf(previewAnchor);
  if(previewAt<0) throw new Error(MARKER+': style preview anchor missing');
  const layoutBlock=String.raw`<section className="section-style-group-v57 section-style-layout-v69">
          <div className="section-style-label-v57"><span>МАКЕТ СЕКЦИИ</span><small>Responsive layout редактируется здесь же. Отдельного окна «Редактировать макет» больше нет.</small></div>
          <AemLayoutInspectorV36 section={section} device={layoutDeviceV69} onDeviceChange={(next)=>{if(next!=='tablet')setLayoutDeviceV69(next);}} onLayoutChange={(next)=>SECTION_CANVAS_RUNTIME_V58.updateLayout?.(section.id,next)}/>
        </section>

        `;
  style=style.slice(0,previewAt)+layoutBlock+style.slice(previewAt);
  app=app.slice(0,stylePart.start)+style+app.slice(stylePart.end);

  // Persist authored layout from the Style drawer.
  const updateAnchor="  const updateSection = (id, updater) => mutateSections((prev) => prev.map((s) => s.id === id ? updater(s) : s));";
  if(!app.includes(updateAnchor)) throw new Error(MARKER+': updateSection anchor missing');
  app=app.replace(updateAnchor,updateAnchor+"\n  SECTION_CANVAS_RUNTIME_V58.updateLayout = (sectionId, layoutOverrides) => updateSection(sectionId, (source) => ({ ...source, layoutOverrides }));");

  // Selecting a section must not push the user into the obsolete right-side Settings tab.
  const selectStart=app.indexOf('  const selectSectionV60 = (id, event = {}) => {');
  const selectEnd=selectStart>=0?app.indexOf('\n  };',selectStart):-1;
  if(selectStart>=0 && selectEnd>selectStart){
    let selection=app.slice(selectStart,selectEnd+5);
    selection=selection.replace("    setRightTab('settings');","    if (rightTab === 'settings') setRightTab('content');");
    app=app.slice(0,selectStart)+selection+app.slice(selectEnd+5);
  }

  // Unified automation target state.
  const stateAnchor="  const [groupRulesOpenV60, setGroupRulesOpenV60] = useState(false);";
  if(!app.includes(stateAnchor)) throw new Error(MARKER+': group state anchor missing');
  app=app.replace(stateAnchor,stateAnchor+"\n  const [automationTargetIdV69,setAutomationTargetIdV69]=useState(null);");

  // Runtime open/apply functions live after the existing V64 group applier.
  const applyStart=app.indexOf('  const applyGroupRulesV64 = (nextRule,memberIds,options={}) => {');
  const applyEnd=applyStart>=0?app.indexOf('\n  };',applyStart):-1;
  if(applyStart<0||applyEnd<0) throw new Error(MARKER+': applyGroupRulesV64 anchor missing');
  const automationRuntime=String.raw`
  const automationTargetV69 = automationTargetIdV69 ? sections.find((section)=>section.id===automationTargetIdV69) || null : null;
  const openSectionAutomationV69 = (sectionId) => {
    const target=sections.find((section)=>section.id===sectionId);
    if(!target) return;
    const group=target.automationGroup;
    if(group?.groupId){
      const allIds=(group.memberSectionIds || []).filter((id)=>sections.some((section)=>section.id===id));
      const sourceIds=(group.sourceSectionIdsV68?.length ? group.sourceSectionIdsV68 : allIds.filter((id)=>!sections.find((section)=>section.id===id)?.generatedByAutomationGroupV64)).filter((id)=>sections.some((section)=>section.id===id));
      setSelectedSectionIdsV60(allIds.length?allIds:sourceIds);
      setSelectedId(sectionId);
      setSelectionAnchorV60(sourceIds[0] || sectionId);
      window.setTimeout(()=>highlightAutomationGroupV64(group.groupId),0);
    } else {
      setSelectedSectionIdsV60([sectionId]);
      setSelectedId(sectionId);
      setSelectionAnchorV60(sectionId);
    }
    if(rightTab==='settings') setRightTab('content');
    setGroupRulesOpenV60(false);
    setAutomationTargetIdV69(sectionId);
  };
  const applySingleAutomationV69 = (nextRule,sectionId) => {
    updateSection(sectionId,(source)=>{
      const normalized={...normalizeAutomationRuleV63(nextRule,sectionId),state:'draft',scope:{type:'single_section',sectionIds:[sectionId]}};
      return {...source,rules:automationCompatRulesV63(normalized,source.rules),automationRuleV63:normalized,groupRuleV63:null,automationGroup:null};
    });
    setAutomationTargetIdV69(null);
    setToast('Авто-правила секции сохранены');
    window.setTimeout(()=>setToast(''),1400);
  };
`;
  app=app.slice(0,applyEnd+5)+automationRuntime+app.slice(applyEnd+5);

  // Every section toolbar now opens the correct automation scope automatically.
  const oldAutoButton=`<button className="section-author-action-v57" onClick={() => { if (selectedCountV60 > 1) onGroupRulesV60?.(); else { onSelect(section.id); window.setTimeout(openSectionRulesFromCanvasV57, 0); } }}><Sparkles size={13}/><span>Авто-правила</span></button>`;
  const newAutoButton=`<button className="section-author-action-v57" onClick={() => onGroupRulesV60?.(section.id)}><Sparkles size={13}/><span>Авто-правила</span></button>`;
  if(!app.includes(oldAutoButton)) throw new Error(MARKER+': section automation button missing');
  app=app.replace(oldAutoButton,newAutoButton);
  app=app.replaceAll('onGroupRulesV60={() => setGroupRulesOpenV60(true)}','onGroupRulesV60={openSectionAutomationV69}');

  // Render unified automation drawer next to the existing group-creation flow.
  const toastAnchor='{toast && <div className="builder-toast"';
  if(!app.includes(toastAnchor)) throw new Error(MARKER+': toast render anchor missing');
  const automationDrawer=`{automationTargetV69 && <UnifiedAutomationDrawerV69 key={automationTargetV69.id + '-' + (automationTargetV69.automationGroup?.groupId || 'single')} targetSection={automationTargetV69} allSections={sections} region={region} onApplySingle={applySingleAutomationV69} onApplyGroup={(rule,ids,options)=>{ applyGroupRulesV64(rule,ids,options); setAutomationTargetIdV69(null); }} onClose={()=>setAutomationTargetIdV69(null)}/>}\n    `;
  app=app.replace(toastAnchor,automationDrawer+toastAnchor);

  // Remove the old right-rail Section Settings entry completely.
  const separator='<span className="right-edge-rail-separator-v44"/>';
  const sepAt=app.indexOf(separator);
  if(sepAt>=0){
    const settingsEnd=app.indexOf('</button>',sepAt);
    if(settingsEnd>sepAt) app=app.slice(0,sepAt)+app.slice(settingsEnd+'</button>'.length);
  }

  // Restore numbered media selectors on right-panel entity cards.
  const overlayAnchor='<ContentMetricOverlayV47 entity={entity} region={region}/>';
  if(!app.includes(overlayAnchor)) throw new Error(MARKER+': content card overlay anchor missing');
  app=app.replace(overlayAnchor,'<ContentMediaPagerV69 entity={entity}/>'+overlayAnchor);

  // Repair Look media editor layout with a stable media stage and explicit add/replace actions.
  const lookPart=functionChunk(app,'LookMasterDataModalV53');
  let look=lookPart.chunk;
  const visualStart=look.indexOf('<div className="look-master-visual-v53 look-media-editor-v55"');
  const compositionStart=visualStart>=0?look.indexOf('<div className="look-master-composition-v53">',visualStart):-1;
  if(visualStart>=0 && compositionStart>visualStart){
    const visual=String.raw`<div className="look-master-visual-v53 look-media-editor-v55 look-media-editor-v69" onDragOver={(event)=>{event.preventDefault();event.dataTransfer.dropEffect='copy';}} onDrop={(event)=>dropLookMediaV55(event)}>
              <div className="look-media-toolbar-v69">
                <div><span>МЕДИА ОБРАЗА</span><strong>{draftLookMediaV55.length ? 'Файл '+(activeImageV53+1)+' из '+draftLookMediaV55.length : 'Медиа не добавлено'}</strong></div>
                <div className="look-media-actions-v69">
                  <label><Plus size={13}/>Добавить медиа<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm" onChange={(event)=>uploadLookMediaV55(event,false)}/></label>
                  <label><Pencil size={13}/>Заменить медиа<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm" onChange={(event)=>uploadLookMediaV55(event,true)}/></label>
                </div>
              </div>
              <div className="look-media-stage-v69">{activeLookMediaV55 ? (activeLookMediaV55.kind==='video' ? <video src={activeLookMediaV55.src} controls playsInline/> : <img src={activeLookMediaV55.src} alt={draftName}/>) : <div className="look-media-empty-v69"><ImageIcon size={30}/><strong>Добавьте медиа образа</strong><span>Загрузите файл или перетащите медиа из правой панели</span></div>}</div>
              <div className="look-media-pager-v69">{draftLookMediaV55.map((item,index)=><button key={(item.id||item.src)+'-'+index} className={index===activeImageV53?'active':''} onClick={()=>setActiveImageV53(index)}>{index+1}</button>)}</div>
              <div className="look-media-thumbs-v69">{draftLookMediaV55.map((item,index)=><div key={(item.id||item.src)+'-thumb-'+index} className={'look-media-thumb-v69 '+(index===activeImageV53?'active':'')} draggable onDragStart={(event)=>{event.dataTransfer.setData('application/x-look-media-v55',String(index));}} onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>dropLookMediaV55(event,index)}><button onClick={()=>setActiveImageV53(index)}>{item.kind==='video'?<video src={item.src} muted/>:<img src={item.src} alt=""/>}</button><button className="look-media-remove-v69" onClick={()=>removeLookMediaV55(index)} title="Удалить медиа"><X size={12}/></button></div>)}</div>
              <small className="look-media-hint-v69">Drag & drop меняет порядок. «Заменить медиа» заменяет выбранный файл, «Добавить медиа» добавляет новый.</small>
            </div>

            `;
    look=look.slice(0,visualStart)+visual+look.slice(compositionStart);
    app=app.slice(0,lookPart.start)+look+app.slice(lookPart.end);
  }

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* section-authoring-unified-v69 */')){
  css+=String.raw`
/* section-authoring-unified-v69 */
/* One authoring model: Style + Automation only. */
.section-edit-launcher-v38,.section-layout-drawer-shell-v38,.right-edge-rail-v44 .section-settings,.right-edge-rail-separator-v44{display:none!important}
.section-style-drawer-v57{width:min(720px,calc(100vw - 64px))!important}.section-style-layout-v69{padding-bottom:12px!important}.section-style-layout-v69 .aem-layout-inspector-v36{margin:0!important;border:0!important;padding:0!important;background:#fff!important}.section-style-layout-v69 .aem-layout-head{padding:0 0 14px!important}.section-style-layout-v69 .aem-layout-head>div>span{font-size:7px!important}.section-style-layout-v69 .aem-layout-head>div>strong{font-size:15px!important}.section-style-layout-v69 .aem-policy-tag{display:none!important}.section-style-layout-v69 .aem-breakpoint-tabs{position:static!important;padding:8px 0!important}.section-style-layout-v69 .aem-breakpoint-tabs button:nth-child(2){display:none!important}.section-style-layout-v69 .aem-layout-preview-row{grid-template-columns:1fr!important}.section-style-layout-v69 .aem-layout-policy{display:none!important}.section-style-layout-v69 .aem-layout-slot-row{padding:10px 0!important}

.unified-automation-layer-v69{z-index:19000!important}.unified-automation-drawer-v69{width:min(660px,calc(100vw - 64px))!important}.automation-scope-summary-v69{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #e0e0e0;margin:0 0 14px}.automation-scope-summary-v69>span{min-height:52px;padding:8px 10px;border-right:1px solid #e6e6e6;display:grid;gap:3px;align-content:center}.automation-scope-summary-v69>span:last-child{border-right:0}.automation-scope-summary-v69 b{font-size:7px;text-transform:uppercase;letter-spacing:.06em;color:#777}.automation-scope-summary-v69 strong{font-size:13px;font-weight:600}.automation-group-members-compact-v69{display:flex;gap:5px;overflow-x:auto;padding:0 0 12px;scrollbar-width:none}.automation-group-members-compact-v69 span{flex:0 0 auto;height:28px;padding:0 8px;border:1px solid #dcdcdc;display:flex;align-items:center;gap:6px;font-size:8px}.automation-group-members-compact-v69 b{width:15px;height:15px;border-radius:50%;background:#1473e6;color:#fff;display:grid;place-items:center;font-size:7px}.unified-automation-footer-v69{gap:8px!important}.unified-automation-footer-v69>span{margin-right:auto!important}

/* Product master must always scroll inside the modal. */
.product-master-modal-v52{height:min(94vh,980px)!important;max-height:94vh!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr)!important;overflow:hidden!important}.product-master-scroll-v52{min-height:0!important;height:auto!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:48px!important}.master-size-table-wrap{overflow-x:auto!important}

/* Numbered media selectors on content cards. */
.content-media-preview-override-v69{position:absolute;inset:0;z-index:18;background:#f7f7f5;overflow:hidden}.content-media-preview-override-v69 img,.content-media-preview-override-v69 video{width:100%;height:100%;object-fit:cover;display:block}.content-media-pager-v69{position:absolute;left:7px;bottom:7px;z-index:31;display:flex;gap:4px;max-width:calc(100% - 96px);overflow-x:auto;scrollbar-width:none}.content-media-pager-v69::-webkit-scrollbar{display:none}.content-media-pager-v69 button{flex:0 0 auto;width:20px;height:20px;padding:0;border:1px solid rgba(17,17,17,.22);border-radius:50%;background:rgba(255,255,255,.9);color:#555;font-size:7px;font-weight:600;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(6px)}.content-media-pager-v69 button.active{background:#111;color:#fff;border-color:#111}

/* Stable Look media editor. */
.look-master-summary-v53{align-items:start!important}.look-media-editor-v69{min-width:0!important;display:grid!important;grid-template-rows:auto auto auto auto auto!important;gap:10px!important;align-content:start!important}.look-media-toolbar-v69{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:end!important;gap:12px!important}.look-media-toolbar-v69>div:first-child{display:grid;gap:2px}.look-media-toolbar-v69 span{font-size:7px;letter-spacing:.07em;color:#777}.look-media-toolbar-v69 strong{font-size:12px;font-weight:500}.look-media-actions-v69{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.look-media-actions-v69 label{height:34px;padding:0 10px;border:1px solid #111;background:#fff;color:#111;display:flex;align-items:center;gap:5px;font-size:8px;font-weight:600;cursor:pointer;white-space:nowrap}.look-media-actions-v69 label:first-child{background:#111;color:#fff}.look-media-actions-v69 input{display:none!important}.look-media-stage-v69{position:relative;width:100%;aspect-ratio:2/3;max-height:560px;background:#f6f6f4;overflow:hidden;display:grid;place-items:center}.look-media-stage-v69>img,.look-media-stage-v69>video{width:100%;height:100%;object-fit:contain;display:block}.look-media-empty-v69{display:grid;place-items:center;gap:7px;padding:28px;text-align:center;color:#777}.look-media-empty-v69 strong{font-size:12px;font-weight:500;color:#333}.look-media-empty-v69 span{font-size:8px}.look-media-pager-v69{display:flex;gap:5px;overflow-x:auto;scrollbar-width:none}.look-media-pager-v69 button{width:24px;height:24px;flex:0 0 auto;border:1px solid #ccc;border-radius:50%;background:#fff;font-size:8px}.look-media-pager-v69 button.active{background:#111;color:#fff;border-color:#111}.look-media-thumbs-v69{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.look-media-thumb-v69{position:relative;aspect-ratio:2/3;border:1px solid transparent;background:#f6f6f4;overflow:hidden}.look-media-thumb-v69.active{border-color:#111}.look-media-thumb-v69>button:first-child{position:absolute;inset:0;border:0;background:transparent;padding:0}.look-media-thumb-v69 img,.look-media-thumb-v69 video{width:100%;height:100%;object-fit:cover;display:block}.look-media-remove-v69{position:absolute;right:3px;top:3px;z-index:4;width:22px;height:22px;border:0;background:rgba(255,255,255,.94);display:grid;place-items:center}.look-media-hint-v69{font-size:8px;line-height:1.45;color:#888}

@media(max-width:900px){.section-style-drawer-v57,.unified-automation-drawer-v69{width:100vw!important}.automation-scope-summary-v69{grid-template-columns:repeat(2,1fr)}.automation-scope-summary-v69>span:nth-child(2){border-right:0}.look-media-toolbar-v69{grid-template-columns:1fr}.look-media-actions-v69{justify-content:flex-start}.look-media-thumbs-v69{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:600px){.look-media-thumbs-v69{grid-template-columns:repeat(3,minmax(0,1fr))}.content-media-pager-v69 button{width:18px;height:18px}}
`;
  writeFileSync(cssPath,css);
}

console.log('V69 applied: Style owns layout, unified single/group automation, scrollable product master, numbered media preview and repaired Look media editor');
