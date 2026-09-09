import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');

const marker = 'SECTION_CATALOG_V1';
if (!app.includes(marker)) {
  app = app.replace(
    "import React, { useMemo, useState } from 'react';",
    "import React, { useEffect, useMemo, useState } from 'react';",
  );

  const helpers = `\nconst SECTION_CATALOG_V1 = true;\n\nfunction fallbackCatalogContainers(count) {\n  const safeCount = Math.max(1, Number(count) || 1);\n  const perRow = safeCount >= 8 ? 5 : safeCount >= 5 ? 4 : safeCount >= 3 ? 3 : safeCount;\n  const rows = [];\n  let left = safeCount;\n  while (left > 0) {\n    const rowCount = Math.min(perRow, left);\n    const span = Math.max(1, Math.floor(12 / rowCount));\n    rows.push({ cols: 12, slots: Array.from({ length: rowCount }, () => ({ span })) });\n    left -= rowCount;\n  }\n  return rows;\n}\n\nfunction decodeCatalogContainers(rows, count) {\n  if (!Array.isArray(rows) || !rows.length) return fallbackCatalogContainers(count);\n  const containers = rows.map((row) => ({\n    cols: 12,\n    slots: (row || []).map((slot) => ({\n      span: Math.max(1, Math.min(12, Number(slot?.[0]) || 1)),\n      ...(Number(slot?.[1]) > 0 ? { start: Math.max(1, Math.min(12, Number(slot[1]))) } : {}),\n    })),\n  })).filter((container) => container.slots.length);\n  const actual = containers.reduce((sum, container) => sum + container.slots.length, 0);\n  return actual === Number(count) ? containers : fallbackCatalogContainers(count);\n}\n\nfunction catalogEntryToType(entry) {\n  const [sourceLayoutId, count, desktopRows, mobileRows] = entry;\n  const containers = decodeCatalogContainers(desktopRows, count);\n  const mobileContainers = decodeCatalogContainers(mobileRows, count);\n  return {\n    id: 'CAT-' + String(sourceLayoutId),\n    label: 'Секция ' + String(sourceLayoutId),\n    system: true,\n    catalog: true,\n    category: 'Товары',\n    description: count + ' товарных слотов · responsive layout из dynamicBlockCatalog',\n    sourceLayoutId: String(sourceLayoutId),\n    containers,\n    mobileContainers,\n  };\n}\n`;

  const contentAnchor = "const ALL_CONTENT = ['product', 'look', 'image', 'video', 'svg'];";
  if (app.includes(contentAnchor)) app = app.replace(contentAnchor, contentAnchor + helpers);

  app = app.replace(
    "function initialSection(typeId, titles, pins = {}, mode = 'manual') {",
    "function initialSection(typeId, titles, pins = {}, mode = 'manual', templateOverride = null) {",
  );
  app = app.replace(
    "const type = TYPE_LIBRARY.find((t) => t.id === typeId);",
    "const type = templateOverride || TYPE_LIBRARY.find((t) => t.id === typeId);",
  );

  const modalStart = app.indexOf('function AddTypeModal(');
  const modalEnd = app.indexOf('\nfunction SiteTree', modalStart);
  if (modalStart >= 0 && modalEnd > modalStart) {
    const modal = `function AddTypeModal({ open, onClose, onAdd, typeLibrary, catalogStatus }) {\n  const [category, setCategory] = useState('Товары');\n  const [selectedTypeId, setSelectedTypeId] = useState('TYPE-1');\n  const [search, setSearch] = useState('');\n  const [slotFilter, setSlotFilter] = useState('all');\n  if (!open) return null;\n  const categories = ['Товары', 'Креативные', 'Эдиториал', 'Главная'];\n  const categoryTypes = typeLibrary.filter((type) => type.category === category);\n  const q = search.trim().toLowerCase();\n  const filteredTypes = categoryTypes.filter((type) => {\n    const matchesSearch = !q || String(type.label || type.id).toLowerCase().includes(q) || String(type.sourceLayoutId || '').toLowerCase().includes(q) || String(type.description || '').toLowerCase().includes(q);\n    const matchesSlots = slotFilter === 'all' || slotCount(type) === Number(slotFilter);\n    return matchesSearch && matchesSlots;\n  });\n  const selectedType = typeLibrary.find((type) => type.id === selectedTypeId) || filteredTypes[0] || categoryTypes[0] || typeLibrary[0];\n  const catalogCount = typeLibrary.filter((type) => type.catalog).length;\n  return <div className=\"modal-backdrop\" onClick={onClose}><div className=\"type-library-modal section-catalog-modal\" onClick={(event) => event.stopPropagation()}>\n    <div className=\"type-modal-head\"><div><span>ШАБЛОНЫ СЕКЦИЙ</span><h2>Добавить секцию</h2><p>Выберите готовую геометрию. Каталог содержит responsive layouts из dynamicBlockCatalog; новая секция создаётся с пустыми слотами.</p></div><button onClick={onClose}><X size={19}/></button></div>\n    <div className=\"type-library-body\"><aside className=\"type-categories\">{categories.map((item) => { const count = typeLibrary.filter((type) => type.category === item).length; return <button key={item} className={category === item ? 'active' : ''} onClick={() => { setCategory(item); setSearch(''); setSlotFilter('all'); }}>{item}<span>{count}</span><ChevronRight size={14}/></button>; })}</aside>\n      <section className=\"type-grid-area\">\n        <div className=\"type-library-tools\"><div className=\"type-library-search\"><Search size={14}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder=\"Поиск секции / layout ID\"/></div><select value={slotFilter} onChange={(event) => setSlotFilter(event.target.value)}><option value=\"all\">Любое число слотов</option>{Array.from({ length: 10 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'слот' : count < 5 ? 'слота' : 'слотов'}</option>)}</select></div>\n        <div className=\"type-grid-title\"><strong>{category}</strong><span>{filteredTypes.length} из {categoryTypes.length}{category === 'Товары' ? ' · ' + catalogCount + ' из каталога' : ''}</span></div>\n        {catalogStatus === 'loading' && category === 'Товары' && <div className=\"catalog-status\"><RefreshCw size={14}/> Загружаем каталог секций…</div>}\n        {catalogStatus === 'error' && category === 'Товары' && <div className=\"catalog-status error\"><AlertTriangle size={14}/> Каталог не загрузился. Базовые секции доступны.</div>}\n        <div className=\"type-card-grid\">{filteredTypes.map((type) => <button className={\`type-card \${selectedType?.id === type.id ? 'selected' : ''}\`} key={type.id} onClick={() => setSelectedTypeId(type.id)}><div className=\"type-card-top\"><strong>{type.label || type.id}</strong>{type.catalog && <span className=\"catalog-pill\">CATALOG</span>}</div><TypePreview type={type} compact/><p>{type.description}</p><small>{slotCount(type)} слотов · {type.containers.length} ряд(а)</small></button>)}</div>\n        {!filteredTypes.length && <div className=\"catalog-empty\"><Search size={20}/><strong>Ничего не найдено</strong><span>Измените поиск или число слотов.</span></div>}\n      </section>\n      <aside className=\"type-policy-panel\">{selectedType ? <><div className=\"policy-head\"><span>ВЫБРАННАЯ СЕКЦИЯ</span><strong>{selectedType.label || selectedType.id}</strong>{selectedType.catalog && <small>Layout {selectedType.sourceLayoutId}</small>}</div><TypePreview type={selectedType}/><div className=\"type-policy-note\"><Plus size={16}/><span>Секция будет пустой. Слоты можно наполнять вручную или правилами автоматического мерчандайзинга.</span></div><button className=\"add-type-primary\" onClick={() => onAdd(selectedType)}><Plus size={16}/> Добавить секцию</button></> : null}</aside>\n    </div>\n  </div></div>;\n}\n`;
    app = app.slice(0, modalStart) + modal + app.slice(modalEnd + 1);
  }

  const stateAnchor = "const [future, setFuture] = useState([]);";
  const stateInjection = `\n  const [catalogTypes, setCatalogTypes] = useState([]);\n  const [catalogStatus, setCatalogStatus] = useState('loading');\n\n  useEffect(() => {\n    let cancelled = false;\n    const url = \`${'${import.meta.env.BASE_URL}'}data/lego_sections_catalog.json\`;\n    fetch(url, { cache: 'no-store' })\n      .then((response) => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })\n      .then((data) => {\n        if (cancelled) return;\n        const entries = Array.isArray(data?.sections) ? data.sections : [];\n        setCatalogTypes(entries.map(catalogEntryToType));\n        setCatalogStatus('ready');\n      })\n      .catch(() => { if (!cancelled) setCatalogStatus('error'); });\n    return () => { cancelled = true; };\n  }, []);\n\n  const sectionTypeLibrary = useMemo(() => [...TYPE_LIBRARY, ...catalogTypes], [catalogTypes]);`;
  if (app.includes(stateAnchor)) app = app.replace(stateAnchor, stateAnchor + stateInjection);

  app = app.replace(
    "initialSection(type.id, titles, {}, 'manual')",
    "initialSection(type.id, titles, {}, 'manual', type)",
  );

  app = app.replace(
    '<AddTypeModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addType}/>',
    '<AddTypeModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addType} typeLibrary={sectionTypeLibrary} catalogStatus={catalogStatus}/>',
  );

  const sectionSignature = "function SectionCanvas({ section, locale, region, selected, editable, onSelect, onPin, onUnpin, onDuplicate, onDelete, onSectionDragStart, onSectionDrop }) {";
  if (app.includes(sectionSignature)) {
    app = app.replace(sectionSignature, "function SectionCanvas({ section, locale, region, device, selected, editable, onSelect, onPin, onUnpin, onDuplicate, onDelete, onSectionDragStart, onSectionDrop }) {");
    const sectionIndex = app.indexOf('function SectionCanvas(');
    const sectionEnd = app.indexOf('\nfunction AddTypeModal', sectionIndex);
    if (sectionIndex >= 0 && sectionEnd > sectionIndex) {
      let sectionSource = app.slice(sectionIndex, sectionEnd);
      sectionSource = sectionSource.replace('  let cursor = 0;', "  let cursor = 0;\n  const renderContainers = device === 'mobile' && section.template.mobileContainers?.length ? section.template.mobileContainers : section.template.containers;");
      sectionSource = sectionSource.replace('section.template.containers.map((container, ci) =>', 'renderContainers.map((container, ci) =>');
      sectionSource = sectionSource.replace('gridColumn: `span ${shape.span}`', 'gridColumn: shape.start ? `${shape.start} / span ${shape.span}` : `span ${shape.span}`');
      app = app.slice(0, sectionIndex) + sectionSource + app.slice(sectionEnd);
    }
  }

  app = app.replace(
    'section={section} locale={locale} region={region} selected=',
    'section={section} locale={locale} region={region} device={device} selected=',
  );
  app = app.replace(
    'gridColumn: `span ${slot.span}`',
    'gridColumn: slot.start ? `${slot.start} / span ${slot.span}` : `span ${slot.span}`',
  );

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
const cssMarker = '/* section-catalog-v1 */';
if (!css.includes(cssMarker)) {
  css += `\n${cssMarker}\n.section-catalog-modal{width:min(1380px,96vw);height:min(860px,90vh)}.section-catalog-modal .type-library-body{min-height:0}.section-catalog-modal .type-grid-area{min-width:0;display:flex;flex-direction:column;overflow:hidden}.type-library-tools{display:grid;grid-template-columns:minmax(240px,1fr) 190px;gap:8px;margin-bottom:10px}.type-library-search{height:36px;border:1px solid #dfe2e8;border-radius:7px;background:#fff;display:flex;align-items:center;gap:7px;padding:0 10px;color:#7a7e87}.type-library-search input{width:100%;border:0;outline:0;background:transparent;font-size:11px}.type-library-tools select{height:36px;border:1px solid #dfe2e8;border-radius:7px;background:#fff;padding:0 9px;font-size:10px;color:#454a55}.section-catalog-modal .type-card-grid{overflow:auto;align-content:start;padding-right:5px;padding-bottom:12px;min-height:0}.section-catalog-modal .type-card{min-height:180px}.type-card-top .catalog-pill{margin-left:auto;background:#eef4ff;color:#3265d1;border:1px solid #d8e5ff;border-radius:4px;padding:2px 5px;font-size:7px;font-weight:800;letter-spacing:.05em}.type-categories button span{margin-left:auto;font-size:8px;color:#8a8e97;background:#f1f2f5;padding:2px 5px;border-radius:9px}.type-categories button.active span{background:#fff;color:#315fc9}.catalog-status{display:flex;align-items:center;gap:6px;padding:8px 10px;margin-bottom:8px;border-radius:6px;background:#f3f7ff;color:#4d638f;font-size:9px}.catalog-status.error{background:#fff5f2;color:#a25146}.catalog-empty{min-height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#8b8f99}.catalog-empty strong{font-size:12px;color:#555a64}.catalog-empty span{font-size:9px}.policy-head small{display:block;margin-top:3px;font-size:8px;color:#8a8d96;font-weight:500}@media(max-width:1050px){.type-library-tools{grid-template-columns:1fr}.section-catalog-modal{width:98vw}}\n`;
  writeFileSync(cssPath, css);
}
