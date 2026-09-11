import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
let css=readFileSync(cssPath,'utf8');
const MARKER='UX_SAFETY_FIXES_V80';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const OPS_MIGRATION_LAB_V79 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V79 marker missing');

  const helpers=String.raw`
const UX_SAFETY_FIXES_V80 = true;
function CreateLookModalV80({region,onCreate,onClose}){
  const [name,setName]=useState('');
  const [nameEn,setNameEn]=useState('');
  const [department,setDepartment]=useState('Женщины');
  const [collection,setCollection]=useState('');
  const [productIds,setProductIds]=useState([]);
  const [image,setImage]=useState('');
  const departments=['Женщины','Мужчины','Дети'];
  const collections=[...new Set(PRODUCTS.map((p)=>p.collection).filter(Boolean))];
  const candidates=PRODUCTS.filter((p)=>!department||String(p.department||'')===department).slice(0,24);
  const toggle=(id)=>setProductIds((prev)=>prev.includes(id)?prev.filter((x)=>x!==id):[...prev,id].slice(0,8));
  const save=()=>{
    if(!name.trim()) return;
    const selected=PRODUCTS.filter((p)=>productIds.includes(p.id));
    const totalStock=selected.reduce((sum,p)=>sum+Number(p?.stock?.[region]??p?.stockValue??0),0);
    const id='LOOK-'+Date.now().toString(36).toUpperCase();
    const entity={id,kind:'look',name:name.trim(),nameEn:nameEn.trim(),department,collection,productIds:[...productIds],productCount:productIds.length,stockTotal:totalStock,image:image||'',images:image?[image]:[],tone:'catalog-look',seoTitle:name.trim(),seoH1:name.trim(),seoDescription:'',seoSlug:id.toLowerCase(),seoIndex:true};
    onCreate(entity);
  };
  return createPortal(<div className="create-look-layer-v80" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}}><div className="create-look-modal-v80" onMouseDown={(e)=>e.stopPropagation()}>
    <header><div><span>EDITORIAL MASTER</span><strong>Создать образ</strong><small>Новый образ появится в библиотеке и затем доступен в обычном редакторе образа.</small></div><button onClick={onClose}><X size={18}/></button></header>
    <div className="create-look-scroll-v80">
      <section className="create-look-fields-v80"><label><span>Название RU *</span><input autoFocus value={name} onChange={(e)=>setName(e.target.value)} placeholder="Например, Городская база"/></label><label><span>Название EN</span><input value={nameEn} onChange={(e)=>setNameEn(e.target.value)} placeholder="City essentials"/></label><label><span>Отдел</span><select value={department} onChange={(e)=>setDepartment(e.target.value)}>{departments.map((x)=><option key={x}>{x}</option>)}</select></label><label><span>Коллекция</span><select value={collection} onChange={(e)=>setCollection(e.target.value)}><option value="">Без коллекции</option>{collections.map((x)=><option key={x}>{x}</option>)}</select></label><label className="wide"><span>URL изображения</span><input value={image} onChange={(e)=>setImage(e.target.value)} placeholder="Можно оставить пустым и добавить медиа позже"/></label></section>
      <section className="create-look-products-v80"><div><strong>Состав образа</strong><small>{productIds.length} товаров · до 8</small></div><div className="create-look-product-grid-v80">{candidates.map((p)=><button key={p.id} className={productIds.includes(p.id)?'active':''} onClick={()=>toggle(p.id)}><span>{productMediaItems(p)?.[0]?<ProductMediaVisual media={productMediaItems(p)[0]} alt={p.name} loading="lazy"/>:<ImageIcon size={18}/>}</span><small>{p.id}</small><b>{p.name}</b><em>{Number(p?.stock?.[region]??p?.stockValue??0)} шт.</em></button>)}</div></section>
    </div>
    <footer><button onClick={onClose}>Отмена</button><button className="primary" disabled={!name.trim()} onClick={save}>Создать образ</button></footer>
  </div></div>,document.body);
}
`;
  app=app.replace(anchor,anchor+'\n'+helpers);

  // Full, unambiguous layout names in Components and layout pickers.
  try{
    const part=functionChunk(app,'layoutDisplayName');
    const replacement=String.raw`function layoutDisplayName(type){
  const label=String(type?.label||type?.description||type?.id||'Секция').replace(/^\s*\d+\.\s*/,'').trim();
  if(type?.id==='LAYOUT-5') return 'Editorial 2/3 + 1/3';
  if(type?.id==='LAYOUT-6') return 'Editorial 1/3 + 2/3';
  return label || String(type?.id||'Секция');
}`;
    app=app.slice(0,part.start)+replacement+app.slice(part.end);
  }catch(error){ console.warn(MARKER+': layoutDisplayName patch skipped',error.message); }

  // Normal selection is NOT group selection. Multi-select exists only after Shift/Ctrl/checkbox.
  const selectPart=functionChunk(app,'selectSectionV60');
  let selectChunk=selectPart.chunk;
  selectChunk=selectChunk.replace(
    "    } else {\n      setSelectedSectionIdsV60([id]);\n      setSelectedId(id);\n      setSelectionAnchorV60(id);\n    }",
    "    } else {\n      setSelectedSectionIdsV60([]);\n      setSelectedId(id);\n      setSelectionAnchorV60(id);\n    }"
  );
  selectChunk=selectChunk.replace("    setRightTab('settings');","    setRightTab('content');");
  app=app.slice(0,selectPart.start)+selectChunk+app.slice(selectPart.end);

  // Bulk delete asks for confirmation; single delete stays one click.
  const deletePart=functionChunk(app,'deleteSectionSetV60');
  let deleteChunk=deletePart.chunk;
  if(!deleteChunk.includes('window.confirm')){
    deleteChunk=deleteChunk.replace("    if (!target.size) return;","    if (!target.size) return;\n    if (target.size > 1 && !window.confirm('Удалить выбранные секции (' + target.size + ')? Это массовое действие.')) return;");
  }
  app=app.slice(0,deletePart.start)+deleteChunk+app.slice(deletePart.end);

  // New section starts as a normal selected section, never as an implicit multi-selection.
  app=app.replaceAll('setSelectedId(next.id); setRightTab(', 'setSelectedSectionIdsV60([]); setSelectionAnchorV60(next.id); setSelectedId(next.id); setRightTab(');

  // Dedicated create-look workflow reuses the existing Look Master after the entity is created.
  const stateAnchor="  const [opsPanelOpenV79,setOpsPanelOpenV79]=useState(false);";
  if(!app.includes(stateAnchor)) throw new Error(MARKER+': ops state anchor missing');
  app=app.replace(stateAnchor,stateAnchor+"\n  const [createLookOpenV80,setCreateLookOpenV80]=useState(false);");

  const mediaToolsAnchor="        {contentTab === 'media' && <div className=\"simple-media-tools\">";
  if(app.includes(mediaToolsAnchor)){
    app=app.replace(mediaToolsAnchor,"        {contentTab === 'look' && <button className=\"create-look-button-v80\" onClick={()=>setCreateLookOpenV80(true)}><Plus size={14}/>Создать образ</button>}\n\n"+mediaToolsAnchor);
  } else {
    // Later panel variants retain the same content-tab state; insert before library scroll.
    const libAnchor='<div className="settings-scroll content-library-scroll simple-library-scroll">';
    if(!app.includes(libAnchor)) throw new Error(MARKER+': content library anchor missing');
    app=app.replace(libAnchor,"{contentTab === 'look' && <button className=\"create-look-button-v80\" onClick={()=>setCreateLookOpenV80(true)}><Plus size={14}/>Создать образ</button>}\n      "+libAnchor);
  }

  const opsOverlay='<OpsMigrationPanelV79 open={opsPanelOpenV79}';
  if(!app.includes(opsOverlay)) throw new Error(MARKER+': ops overlay missing');
  app=app.replace(opsOverlay,"{createLookOpenV80 && <CreateLookModalV80 region={region} onClose={()=>setCreateLookOpenV80(false)} onCreate={(entity)=>{ CONTENT.unshift(entity); setCreateLookOpenV80(false); setContentTab('product'); window.setTimeout(()=>setContentTab('look'),0); setToast('Образ '+entity.id+' создан'); window.setTimeout(()=>setToast(''),1600); }}/>}\n    "+opsOverlay);

  // Migration blockers are publish blockers, not merely informational warnings.
  const publishButton='<button className="editor-publish-v43" onClick={()=>setPublishCheckOpenV74(true)}>Опубликовать</button>';
  if(app.includes(publishButton)){
    app=app.replace(publishButton,`<button className="editor-publish-v43" onClick={()=>{ const blockers=opsRuleConflictsV79(sections,currentPageSettingsV43,region).filter((issue)=>issue.severity==='blocker'); if(blockers.length){ setOpsPanelOpenV79(true); setToast('Публикация заблокирована: '+blockers.length+' критических конфликтов'); window.setTimeout(()=>setToast(''),2400); return; } setPublishCheckOpenV74(true); }}>Опубликовать</button>`);
  } else throw new Error(MARKER+': publish button missing');

  writeFileSync(appPath,app);
}

if(!css.includes('/* ux-safety-fixes-v80 */')){
  css+=String.raw`
/* ux-safety-fixes-v80 */
/* Strong target affordance: slot selection must be unmistakable before a content-card click. */
.lego-slot.selected-content-slot{outline:2px solid #111!important;outline-offset:2px!important;box-shadow:0 0 0 4px rgba(255,255,255,.92),0 0 0 5px rgba(17,17,17,.12)!important;z-index:20!important}
.lego-slot.selected-content-slot:after{content:'ВЫБРАННЫЙ СЛОТ';position:absolute;left:6px;bottom:6px;z-index:40;background:#111;color:#fff;padding:4px 6px;font-size:7px;font-weight:700;letter-spacing:.06em;pointer-events:none}
.simple-slot-hint{border-color:#111!important;background:#fff!important;color:#111!important;font-weight:600!important}
.simple-slot-hint:before{content:'TARGET';font-size:7px;letter-spacing:.08em;font-weight:800;background:#111;color:#fff;padding:3px 5px}

/* Old section-settings tab is removed from the prototype. Style and Auto-rules live on the canvas toolbar. */
.simple-panel-mode-tabs button:nth-child(2){display:none!important}
.simple-panel-mode-tabs{grid-template-columns:1fr!important}

/* Create Look is a first-class editorial action. */
.create-look-button-v80{margin:10px 20px 4px;width:calc(100% - 40px);height:38px;border:1px solid #111;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;gap:7px;font-size:9px;font-weight:700}
.create-look-layer-v80{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.34);display:grid;place-items:center;padding:24px}
.create-look-modal-v80{width:min(900px,calc(100vw - 48px));max-height:calc(100vh - 48px);background:#fff;border:1px solid #d8d8d8;display:flex;flex-direction:column;box-shadow:0 24px 70px rgba(0,0,0,.2)}
.create-look-modal-v80>header{min-height:74px;padding:16px 18px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:flex-start}.create-look-modal-v80>header>div{display:grid;gap:3px}.create-look-modal-v80>header span{font-size:8px;letter-spacing:.1em;color:#888}.create-look-modal-v80>header strong{font-size:22px}.create-look-modal-v80>header small{font-size:9px;color:#777}.create-look-modal-v80>header button{width:34px;height:34px;border:1px solid #ddd;background:#fff}
.create-look-scroll-v80{overflow:auto;padding:18px;display:grid;gap:20px}.create-look-fields-v80{display:grid;grid-template-columns:1fr 1fr;gap:12px}.create-look-fields-v80 label{display:grid;gap:5px}.create-look-fields-v80 label.wide{grid-column:1/-1}.create-look-fields-v80 span{font-size:8px;font-weight:700;color:#777}.create-look-fields-v80 input,.create-look-fields-v80 select{height:38px;border:1px solid #d8d8d8;padding:0 10px;background:#fff}.create-look-products-v80>div:first-child{display:flex;justify-content:space-between;margin-bottom:10px}.create-look-products-v80 strong{font-size:12px}.create-look-products-v80 small{font-size:8px;color:#888}.create-look-product-grid-v80{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.create-look-product-grid-v80>button{min-width:0;border:1px solid #e1e1e1;background:#fff;text-align:left;padding:6px;display:grid;gap:3px}.create-look-product-grid-v80>button.active{border-color:#111;box-shadow:inset 0 0 0 1px #111}.create-look-product-grid-v80>button>span{aspect-ratio:2/3;overflow:hidden;background:#f5f5f3}.create-look-product-grid-v80 img{width:100%;height:100%;object-fit:contain}.create-look-product-grid-v80 b{font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.create-look-product-grid-v80 em{font-size:7px;font-style:normal;color:#777}.create-look-modal-v80>footer{min-height:64px;border-top:1px solid #e5e5e5;padding:12px 18px;display:flex;justify-content:flex-end;gap:8px}.create-look-modal-v80>footer button{height:38px;padding:0 18px;border:1px solid #d8d8d8;background:#fff}.create-look-modal-v80>footer button.primary{background:#111;color:#fff;border-color:#111}.create-look-modal-v80>footer button:disabled{opacity:.35}

/* Explicit multi-selection looks different from ordinary selected-section focus. */
.section-select-toggle-v60.active{background:#111!important;border-color:#111!important;color:#fff!important;box-shadow:0 0 0 2px #fff,0 0 0 3px #111!important}
@media(max-width:700px){.create-look-layer-v80{padding:0}.create-look-modal-v80{width:100vw;max-height:100dvh;height:100dvh}.create-look-fields-v80{grid-template-columns:1fr}.create-look-fields-v80 label.wide{grid-column:auto}.create-look-product-grid-v80{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
  writeFileSync(cssPath,css);
}

console.log('V80 applied: explicit multi-select, selected-slot target, create Look, full layout labels and publish blocker');
