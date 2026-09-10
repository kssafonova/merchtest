import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
let css=readFileSync(cssPath,'utf8');
const MARKER='UX_AUDIT_FIXES_V80';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) return null;
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) return null;
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const OPS_MIGRATION_LAB_V79 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V79 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // 1. A normal single selection is not an implicit multi-selection.
  // Explicit checkbox/Ctrl selection starts from an empty explicit set.
  app=app.replace(
    "const base = previous.length ? previous : (selectedId ? [selectedId] : []);",
    "const base = previous;"
  );
  app=app.replace(
    "setSelectedSectionIdsV60([id]);\n      setSelectedId(id);\n      setSelectionAnchorV60(id);",
    "setSelectedSectionIdsV60([]);\n      setSelectedId(id);\n      setSelectionAnchorV60(id);"
  );

  // Guard bulk delete: destructive group actions must be explicit.
  const bulkDeleteAnchor="if (!target.size) return;\n    mutateSections((previous) => previous.filter((item) => !target.has(item.id)));";
  if(app.includes(bulkDeleteAnchor)){
    app=app.replace(bulkDeleteAnchor,"if (!target.size) return;\n    if (target.size > 1 && !window.confirm('Удалить выбранные секции: ' + target.size + '?')) return;\n    mutateSections((previous) => previous.filter((item) => !target.has(item.id)));");
  }

  // 2. Restore the intended information architecture: section editing is Style / Automation only.
  // The right rail is a content browser, not a second settings surface.
  app=app.replaceAll("setRightTab('settings')","setRightTab('content')");
  const modeTabsStart=app.indexOf('<div className="simple-panel-mode-tabs">');
  if(modeTabsStart>=0){
    const modeTabsEnd=app.indexOf('</div>',modeTabsStart);
    if(modeTabsEnd>modeTabsStart) app=app.slice(0,modeTabsStart)+app.slice(modeTabsEnd+6);
  }
  app=app.replaceAll('<span>Авто</span>','<span>Авто-правила</span>');

  // 3. Never collapse meaningful fractions in layout names. This fixes the two Editorial layouts
  // that both rendered as "Editorial +" in the Components library.
  const layoutNamePart=functionChunk(app,'layoutDisplayName');
  if(layoutNamePart){
    const replacement=String.raw`function layoutDisplayName(type) {
  if (!type) return 'Секция';
  const canonical = {
    'LAYOUT-5': 'Editorial 2/3 + 1/3',
    'LAYOUT-6': 'Editorial 1/3 + 2/3',
  };
  if (canonical[type.id]) return canonical[type.id];
  return String(type.label || type.description || type.id || 'Секция').replace(/^\s*\d+\.\s*/, '').trim();
}`;
    app=app.slice(0,layoutNamePart.start)+replacement+app.slice(layoutNamePart.end);
  }

  // 4. First-class Look creation flow. New looks are added to the same in-memory editorial catalog
  // and immediately opened in the existing Look Master editor for composition/media/SEO.
  const helpers=String.raw`
function CreateLookModalV80({ region='RU', defaultDepartment='', onClose, onCreated }) {
  const [name,setName]=useState('');
  const [nameEn,setNameEn]=useState('');
  const [department,setDepartment]=useState(defaultDepartment||'Женщины');
  const [collection,setCollection]=useState('');
  const canCreate=Boolean(name.trim());
  const create=()=>{
    if(!canCreate) return;
    const id='LOOK-'+Date.now().toString(36).toUpperCase();
    const entity={
      id,kind:'look',name:name.trim(),nameEn:nameEn.trim(),department:department.trim(),collection:collection.trim(),
      productIds:[],productCount:0,stockTotal:0,imageFile:'',imageFiles:[],image:'',images:[],tone:'catalog-look',
      seoTitle:name.trim(),seoH1:name.trim(),seoDescription:'',seoSlug:id.toLowerCase(),seoIndex:true,
      seo:{title:name.trim(),h1:name.trim(),description:'',slug:id.toLowerCase(),index:true},createdInPrototypeV80:true,
    };
    onCreated?.(entity);
  };
  return createPortal(<div className="create-look-layer-v80" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="create-look-modal-v80" onMouseDown={(event)=>event.stopPropagation()}>
      <header><div><span>EDITORIAL MASTER</span><strong>Создать образ</strong><small>После создания откроется карточка образа: товары, медиа и SEO.</small></div><button onClick={onClose}><X size={18}/></button></header>
      <div className="create-look-body-v80">
        <label><span>Название RU *</span><input autoFocus value={name} onChange={(event)=>setName(event.target.value)} placeholder="Например, City tailoring"/></label>
        <label><span>Название EN</span><input value={nameEn} onChange={(event)=>setNameEn(event.target.value)} placeholder="City tailoring"/></label>
        <div className="create-look-grid-v80">
          <label><span>Отдел</span><select value={department} onChange={(event)=>setDepartment(event.target.value)}><option>Женщины</option><option>Мужчины</option><option>Дети</option></select></label>
          <label><span>Коллекция</span><input value={collection} onChange={(event)=>setCollection(event.target.value)} placeholder="Например, AW26"/></label>
        </div>
      </div>
      <footer><button onClick={onClose}>Отмена</button><button className="primary" disabled={!canCreate} onClick={create}>Создать и открыть</button></footer>
    </div>
  </div>,document.body);
}
`;
  app=app.replace(anchor,anchor+'\n'+helpers);

  const opsState="  const [opsPanelOpenV79,setOpsPanelOpenV79]=useState(false);";
  if(!app.includes(opsState)) throw new Error(MARKER+': V79 state anchor missing');
  app=app.replace(opsState,opsState+"\n  const [createLookOpenV80,setCreateLookOpenV80]=useState(false);\n  const [newLookEntityV80,setNewLookEntityV80]=useState(null);");

  // Add the CTA just above the editorial library, where a merchandiser expects it.
  const libraryScroll='<div className="settings-scroll content-library-scroll simple-library-scroll">';
  if(!app.includes(libraryScroll)) throw new Error(MARKER+': content library anchor missing');
  app=app.replace(libraryScroll,libraryScroll+"{contentTab === 'look' && <button className=\"create-look-cta-v80\" onClick={()=>setCreateLookOpenV80(true)}><Plus size={14}/><span><strong>Создать образ</strong><small>Товары · медиа · SEO</small></span></button>}");

  const opsOverlay='<OpsMigrationPanelV79 open={opsPanelOpenV79}';
  if(!app.includes(opsOverlay)) throw new Error(MARKER+': ops overlay anchor missing');
  const createOverlays=`{createLookOpenV80 && <CreateLookModalV80 region={region} defaultDepartment={automationDepartmentFromPageV77(pageId,currentPage,region)} onClose={()=>setCreateLookOpenV80(false)} onCreated={(entity)=>{ CONTENT.unshift(entity); setCreateLookOpenV80(false); setContentTab('media'); window.setTimeout(()=>{ setContentTab('look'); setNewLookEntityV80(entity); },0); setToast('Образ создан · '+entity.id); window.setTimeout(()=>setToast(''),1600); }}/>}\n    {newLookEntityV80 && <LookMasterDataModalV53 entity={newLookEntityV80} region={region} onClose={()=>setNewLookEntityV80(null)}/>}\n    `;
  app=app.replace(opsOverlay,createOverlays+opsOverlay);

  // 5. Migration blockers become an actual publish gate, not a passive report.
  app=app.replace(
    'function MerchPublishCheckV74({resolved,metrics,region,onConfirm,onClose}){',
    'function MerchPublishCheckV74({resolved,metrics,region,pageSettings,onConfirm,onClose}){'
  );
  const publishSections='  const sections=resolved || [];';
  if(app.includes(publishSections)){
    app=app.replace(publishSections,publishSections+"\n  const migrationIssuesV80=typeof opsRuleConflictsV79==='function'?opsRuleConflictsV79(sections,pageSettings||{},region):[];\n  const migrationBlockersV80=migrationIssuesV80.filter((issue)=>issue.severity==='blocker');");
  }
  app=app.replace(
    '<footer><button onClick={onClose}>Вернуться</button><button className="primary" onClick={onConfirm}>Опубликовать сейчас</button></footer>',
    `{migrationBlockersV80.length>0&&<div className="merch-publish-blocker-v80"><AlertTriangle size={16}/><span><strong>Публикация заблокирована</strong><small>{migrationBlockersV80.length} критич. конфликт(а) · исправьте их в «Эффективность»</small></span></div>}<footer><button onClick={onClose}>Вернуться</button><button className="primary" disabled={migrationBlockersV80.length>0} onClick={onConfirm}>{migrationBlockersV80.length>0?'Исправить blockers':'Опубликовать сейчас'}</button></footer>`
  );
  app=app.replaceAll(
    '<MerchPublishCheckV74 resolved={resolved} metrics={metrics} region={region}',
    '<MerchPublishCheckV74 resolved={resolved} metrics={metrics} region={region} pageSettings={currentPageSettingsV43}'
  );

  // 6. Obsolete repeat-limit validation contradicts V72: repeats are system-calculated.
  app=app.replace(/\s*if\(rule\?\.distribution\?\.groupStrategy==='repeat_section_combo'[\s\S]*?\);\n/g,'\n');

  // 7. Extra migration checks for ordered fallback semantics.
  const fallbackKeys="    const chainKeys=chain.map((step)=>step.step);";
  if(app.includes(fallbackKeys)){
    app=app.replace(fallbackKeys,fallbackKeys+String.raw`
    const keepIndex=chainKeys.indexOf('keep_oos');
    if(keepIndex>=0 && keepIndex<chainKeys.length-1) add('warning','FALLBACK_UNREACHABLE',sectionName+': «Отображать на витрине» стоит раньше замен и делает последующие шаги недостижимыми',section.id,'Переместить «Отображать на витрине» в конец или выключить');
    const fallbackCategoryStep=chain.find((step)=>step.step==='fallback_category');
    if(fallbackCategoryStep && !String(fallbackCategoryStep.categoryId||rule?.fallback?.fallbackCategoryId||'').trim()) add('blocker','FALLBACK_CATEGORY_EMPTY',sectionName+': включена резервная категория, но категория не выбрана',section.id,'Выбрать резервную категорию');`);
  }

  writeFileSync(appPath,app);
}

if(!css.includes('/* ux-audit-fixes-v80 */')){
  css+=String.raw`
/* ux-audit-fixes-v80 */
/* Selected content target must be unmistakable, even for a first-time legacy user. */
.storefront-frame .lego-slot.selected-content-slot{outline:2px solid #111!important;outline-offset:-2px!important;box-shadow:0 0 0 3px rgba(255,255,255,.92),0 0 0 5px #111!important;z-index:18!important}
.storefront-frame .lego-slot.selected-content-slot:after{content:'ВЫБРАН ДЛЯ КОНТЕНТА';position:absolute;top:6px;right:6px;z-index:40;background:#111;color:#fff;padding:4px 6px;font-size:6px;font-weight:700;letter-spacing:.06em;line-height:1;pointer-events:none}
.simple-slot-hint,.aem-selected-slot-v37{position:sticky!important;top:0!important;z-index:35!important;border:1px solid #111!important;background:#fff!important;color:#111!important;box-shadow:0 4px 12px rgba(0,0,0,.07)!important}
.simple-slot-hint span,.aem-selected-slot-v37 span{font-weight:600!important}

/* Right rail is content-only. Style and Automation live on the section toolbar. */
.simple-panel-mode-tabs{display:none!important}
.simple-panel-head{min-height:54px!important}

/* Create Look lives as a first-class editorial action. */
.create-look-cta-v80{width:100%;min-height:50px;margin:0 0 16px;padding:9px 11px;border:1px solid #111;background:#fff;color:#111;display:flex;align-items:center;gap:9px;text-align:left;cursor:pointer}
.create-look-cta-v80:hover{background:#f7f7f7}.create-look-cta-v80>span{display:grid;gap:2px}.create-look-cta-v80 strong{font-size:10px;font-weight:650}.create-look-cta-v80 small{font-size:7px;color:#777}
.create-look-layer-v80{position:fixed;inset:0;z-index:1300;background:rgba(20,20,20,.35);display:grid;place-items:center;padding:24px}.create-look-modal-v80{width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 48px);overflow:auto;background:#fff;border:1px solid #ccc;box-shadow:0 24px 70px rgba(0,0,0,.22)}
.create-look-modal-v80>header{min-height:82px;padding:18px 20px;border-bottom:1px solid #ddd;display:flex;justify-content:space-between;align-items:flex-start}.create-look-modal-v80>header>div{display:grid;gap:4px}.create-look-modal-v80>header span{font-size:7px;letter-spacing:.1em;color:#888}.create-look-modal-v80>header strong{font-size:24px;font-weight:650}.create-look-modal-v80>header small{font-size:9px;color:#777}.create-look-modal-v80>header button{width:32px;height:32px;border:1px solid #ddd;background:#fff;display:grid;place-items:center}
.create-look-body-v80{padding:20px;display:grid;gap:16px}.create-look-body-v80 label{display:grid;gap:6px}.create-look-body-v80 label>span{font-size:8px;font-weight:600;color:#666}.create-look-body-v80 input,.create-look-body-v80 select{height:42px;border:1px solid #d3d3d3;background:#fff;padding:0 11px;font-size:11px;outline:none}.create-look-body-v80 input:focus,.create-look-body-v80 select:focus{border-color:#111}.create-look-grid-v80{display:grid;grid-template-columns:1fr 1fr;gap:12px}.create-look-modal-v80>footer{padding:14px 20px;border-top:1px solid #ddd;display:flex;justify-content:flex-end;gap:8px}.create-look-modal-v80>footer button{height:40px;padding:0 16px;border:1px solid #ccc;background:#fff;font-size:10px;font-weight:600}.create-look-modal-v80>footer button.primary{background:#111;color:#fff;border-color:#111}.create-look-modal-v80>footer button:disabled{opacity:.35;cursor:not-allowed}

.merch-publish-blocker-v80{margin:0 18px 12px;padding:11px 12px;border:1px solid #b8423b;background:#fff6f5;color:#8e302b;display:flex;align-items:flex-start;gap:9px}.merch-publish-blocker-v80 span{display:grid;gap:2px}.merch-publish-blocker-v80 strong{font-size:10px}.merch-publish-blocker-v80 small{font-size:8px;line-height:1.35}.merch-publish-v74 footer .primary:disabled{opacity:.38!important;cursor:not-allowed!important;background:#777!important;border-color:#777!important}

/* Longer action label stays readable instead of colliding with neighbouring controls. */
.section-author-toolbar-v57 .section-author-action-v57{white-space:nowrap!important;min-width:max-content!important}

@media(max-width:520px){.create-look-layer-v80{padding:0}.create-look-modal-v80{width:100vw;max-height:100dvh;height:100dvh}.create-look-grid-v80{grid-template-columns:1fr}.storefront-frame .lego-slot.selected-content-slot:after{font-size:5.5px}}
`;
  writeFileSync(cssPath,css);
}

console.log('V80 applied: multi-select isolation, content-only inspector, create Look, strong slot target, distinct editorial labels and migration-aware publish gate');
