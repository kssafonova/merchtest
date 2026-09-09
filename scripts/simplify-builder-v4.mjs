import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');

if (!app.includes('SIMPLIFIED_BUILDER_V4')) {
  const marker = "const nav = navByLocale[locale] || navByLocale.ru;";
  const picker = `
const SIMPLIFIED_BUILDER_V4 = true;

function InlineLayoutPicker({ open, onToggle, onAdd, device }) {
  const layouts = TYPE_LIBRARY.filter((type) => type.layoutV2);
  return <div className="inline-layout-picker">
    <button className={open ? 'inline-layout-trigger open' : 'inline-layout-trigger'} onClick={onToggle}>
      <Plus size={16}/><span>{open ? 'Скрыть макеты' : 'Добавить секцию'}</span><em>{layouts.length} макета</em>
    </button>
    {open && <div className="inline-layout-library">
      <div className="inline-layout-head"><div><span>МАКЕТЫ СЕКЦИЙ</span><strong>Выберите геометрию</strong><small>Секция добавится сразу в страницу. Контент настраивается справа.</small></div><button onClick={onToggle}><X size={16}/></button></div>
      <div className="inline-layout-grid">
        {layouts.map((type) => <button className="inline-layout-card" key={type.id} onClick={() => onAdd(type)}>
          <div className="inline-layout-preview"><TypePreview type={type} compact viewport={device}/></div>
          <div className="inline-layout-card-meta"><strong>{type.label || type.id}</strong><small>{slotCount(type)} слот(а)</small></div>
        </button>)}
      </div>
    </div>}
  </div>;
}
`;
  if (!app.includes(marker)) throw new Error('Navigation marker not found');
  app = app.replace(marker, marker + picker);

  app = app.replace("const [rightTab, setRightTab] = useState('content');", "const [rightTab, setRightTab] = useState('settings');");

  const structureStart = app.indexOf('<aside className="structure-panel">');
  if (structureStart >= 0) {
    const structureEnd = app.indexOf('</aside>', structureStart);
    if (structureEnd < 0) throw new Error('Structure panel end not found');
    app = app.slice(0, structureStart) + app.slice(structureEnd + '</aside>'.length);
  }

  const settingsStart = app.indexOf('<aside className="settings-panel">');
  if (settingsStart < 0) throw new Error('Settings panel not found');
  const settingsEnd = app.indexOf('</aside>', settingsStart);
  if (settingsEnd < 0) throw new Error('Settings panel end not found');

  const newSettings = `<aside className="settings-panel wide-settings-panel">{selected ? <>
        <div className="settings-head simplified-settings-head"><div><span>СЕКЦИЯ</span><strong>{selected.titles[locale] || selected.titles.ru}</strong><small>{selected.typeId} · {selected.template.layoutV2 ? 'Responsive layout' : selected.template.system ? 'System' : 'Custom'}</small></div><div><button onClick={() => duplicate(selected.id)} title="Дублировать"><Copy size={15}/></button><button onClick={() => removeSection(selected.id)} title="Удалить"><Trash2 size={15}/></button></div></div>
        <div className="settings-tabs simplified-tabs"><button className={rightTab === 'settings' ? 'active' : ''} onClick={() => setRightTab('settings')}>Настройки секции</button><button className={rightTab === 'content' ? 'active' : ''} onClick={() => setRightTab('content')}>Контент</button></div>
        {rightTab === 'settings' && <div className="settings-scroll simplified-settings-scroll">
          <div className="section-geometry-card"><div className="section-geometry-head"><span>ГЕОМЕТРИЯ</span><strong>{selected.template.label || selected.template.id}</strong></div>{selected.template.layoutV2 ? <div className="settings-layout-previews"><div><span>DESKTOP</span><TypePreview type={selected.template} compact/></div><div><span>MOBILE</span><TypePreview type={selected.template} compact viewport="mobile"/></div></div> : <TypePreview type={selected.template} compact/>}</div>
          <SectionRuleBuilder section={selected} region={region} onChange={(rules) => updateSection(selected.id, (source) => ({ ...source, rules }))}/>
        </div>}
        {rightTab === 'content' && <div className="settings-scroll content-settings-scroll"><div className="content-tabs"><button className={contentTab === 'product' ? 'active' : ''} onClick={() => setContentTab('product')}>Товары</button><button className={contentTab === 'look' ? 'active' : ''} onClick={() => setContentTab('look')}>Образы</button><button className={contentTab === 'media' ? 'active' : ''} onClick={() => setContentTab('media')}>Медиа</button></div>{contentTab === 'product' && <div className="panel-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название / ID"/></div>}<div className="content-help"><Pin size={14}/><span>Перетащите контент в слот или выберите слот на странице.</span></div><div className="library-items">{visibleLibrary.map((entity) => <div key={entity.id} className="library-entity" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', entity.id)}>{'price' in entity ? <ProductCard product={entity} region={region} compact/> : <MediaCard entity={entity} compact/>}<GripVertical size={14}/></div>)}</div></div>}
      </> : <div className="settings-empty"><LayoutGrid size={26}/><strong>Выберите секцию</strong><span>Настройки и контент появятся здесь.</span></div>}</aside>`;

  app = app.slice(0, settingsStart) + newSettings + app.slice(settingsEnd + '</aside>'.length);

  const addButton = '<button className="canvas-add-section" onClick={() => setShowAdd(true)}><Plus size={17}/>Добавить секцию / тайп</button>';
  const inlinePicker = '<InlineLayoutPicker open={showAdd} onToggle={() => setShowAdd((value) => !value)} onAdd={addType} device={device}/>';
  if (!app.includes(addButton)) throw new Error('Canvas add button not found');
  app = app.replace(addButton, inlinePicker);

  app = app.replace('<AddTypeModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addType}/>', '');
  app = app.replace('Секция = тайп. Геометрия задаётся шаблоном; любой слот может содержать товар, образ или медиа.', 'Выберите секцию на странице. Настройки и контент находятся справа.');
  app = app.replace('Добавить первую секцию', 'Выбрать макет секции');

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('simplified-builder-v4')) {
  css += `
/* simplified-builder-v4 */
.builder-workspace{grid-template-columns:minmax(0,1fr) 430px!important}.structure-panel{display:none!important}.canvas-shell{min-width:0}.settings-panel.wide-settings-panel{width:430px;min-width:430px;border-left:1px solid #dfe2e8;background:#fff}.simplified-settings-head{min-height:68px;padding:12px 14px}.simplified-tabs{grid-template-columns:1fr 1fr!important;padding:0 12px;border-bottom:1px solid #e8eaee}.simplified-tabs button{min-height:38px;font-size:9px!important}.simplified-settings-scroll{padding:0 12px 24px}.section-geometry-card{margin:12px 0 6px;border:1px solid #e1e4e9;border-radius:8px;background:#fafbfc;padding:10px}.section-geometry-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.section-geometry-head span,.settings-layout-previews>div>span{font-size:7px;font-weight:800;letter-spacing:.08em;color:#8b8f98}.section-geometry-head strong{font-size:10px;color:#30343c}.settings-layout-previews{display:grid;grid-template-columns:minmax(0,1fr) 115px;gap:8px}.settings-layout-previews>div{display:grid;gap:4px}.section-rules-editor{margin:10px 0 0!important;border-top:0!important;padding-top:0!important}.content-settings-scroll{padding:12px 12px 24px}.content-help{display:flex;align-items:flex-start;gap:7px;margin:8px 0 10px;padding:8px 9px;border-radius:7px;background:#f6f7f9;color:#6f747d;font-size:8px;line-height:1.4}.content-help svg{flex:0 0 auto;margin-top:1px}.inline-layout-picker{margin:14px 18px 26px}.inline-layout-trigger{width:100%;min-height:42px;border:1px dashed #bfc5cf;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;gap:7px;color:#454a53;font-size:10px;font-weight:800;cursor:pointer}.inline-layout-trigger:hover,.inline-layout-trigger.open{border-style:solid;border-color:#9fb6e5;background:#f8faff;color:#315fbd}.inline-layout-trigger em{font-style:normal;font-size:8px;font-weight:700;color:#9297a0;background:#f0f1f4;border-radius:999px;padding:3px 6px}.inline-layout-library{margin-top:8px;border:1px solid #dfe2e8;border-radius:10px;background:#fff;overflow:hidden;box-shadow:0 8px 24px rgba(25,31,43,.06)}.inline-layout-head{min-height:58px;padding:10px 12px;border-bottom:1px solid #eceef1;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;background:#fbfbfc}.inline-layout-head>div{display:grid;gap:2px}.inline-layout-head span{font-size:7px;letter-spacing:.09em;font-weight:800;color:#8b8f98}.inline-layout-head strong{font-size:12px;color:#272b32}.inline-layout-head small{font-size:8px;color:#858a93}.inline-layout-head>button{border:0;background:transparent;padding:4px;color:#7c818a}.inline-layout-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px;max-height:380px;overflow:auto}.inline-layout-card{min-width:0;border:1px solid #e0e3e8;border-radius:8px;background:#fff;padding:8px;text-align:left;cursor:pointer;transition:.15s}.inline-layout-card:hover{border-color:#7ea0df;box-shadow:0 3px 12px rgba(47,91,168,.09);transform:translateY(-1px)}.inline-layout-preview{height:74px;display:flex;align-items:center;justify-content:center;background:#fafbfc;border-radius:6px;overflow:hidden}.inline-layout-preview .type-preview{width:100%;margin:0!important}.inline-layout-card-meta{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-top:7px}.inline-layout-card-meta strong{font-size:8px;line-height:1.25;color:#343840}.inline-layout-card-meta small{font-size:7px;color:#8c9199;white-space:nowrap}.preview-mode .builder-workspace{grid-template-columns:1fr!important}.preview-mode .wide-settings-panel{display:none!important}@media(max-width:1250px){.builder-workspace{grid-template-columns:minmax(0,1fr) 380px!important}.settings-panel.wide-settings-panel{width:380px;min-width:380px}.inline-layout-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:980px){.builder-workspace{grid-template-columns:minmax(0,1fr)!important}.settings-panel.wide-settings-panel{display:none}.inline-layout-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
  writeFileSync(cssPath, css);
}

console.log('Simplified builder v4 prepared: no structure sidebar, wider contextual inspector, inline layout picker');
