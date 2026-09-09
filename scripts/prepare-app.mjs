import { readFileSync, writeFileSync } from 'node:fs';

function replaceAll(source, replacements) {
  return replacements.reduce((text, [from, to]) => text.replace(from, to), source);
}

// Legacy prototype safety patches kept for older entry points.
const legacyPath = 'src/App.jsx';
let legacy = readFileSync(legacyPath, 'utf8');
legacy = replaceAll(legacy, [
  [
    "const updateRanking = (id, key, value) => setSections((prev) => prev.map((s) => s.id === id ? { ...s, rules: { ...s.rules, ranking: { ...s.rules.ranking, [key]: Number(value) } } : s));",
    "const updateRanking = (id, key, value) => setSections((prev) => prev.map((s) => s.id === id ? { ...s, rules: { ...s.rules, ranking: { ...s.rules.ranking, [key]: Number(value) } } } : s));",
  ],
  [
    "className={`product-layout ${section.type === 'product-row' ? 'row' : ''}`}",
    "className={`product-layout ${section.type === 'product-row' ? 'row' : ''} ${section.rules.emptyBehavior === 'center' ? 'center' : ''}`}",
  ],
  [
    '<option value="collapse">Схлопнуть слот</option><option value="keep">Оставить пустой слот</option>',
    '<option value="collapse">Схлопнуть слот</option><option value="center">Центрировать оставшийся контент</option><option value="keep">Оставить пустой слот</option>',
  ],
]);
writeFileSync(legacyPath, legacy);

// Current storefront constructor.
const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

// Human-readable section template names. Technical ids stay internal only.
app = replaceAll(app, [
  ["id: 'TYPE-1', system:", "id: 'TYPE-1', label: 'Секция 1', system:"],
  ["id: 'TYPE-2', system:", "id: 'TYPE-2', label: 'Секция 2', system:"],
  ["id: 'TYPE-3', system:", "id: 'TYPE-3', label: 'Секция 3', system:"],
  ["id: 'TYPE-4', system:", "id: 'TYPE-4', label: 'Секция 4', system:"],
  ["id: 'TYPE-5', system:", "id: 'TYPE-5', label: 'Секция 5', system:"],
  ["id: 'TYPE-13', system:", "id: 'TYPE-13', label: 'Секция 13', system:"],
  ["id: 'TYPE-13+1', system:", "id: 'TYPE-13+1', label: 'Секция 13+1', system:"],
  ["id: 'PROMO-BLOCK', system:", "id: 'PROMO-BLOCK', label: 'Промо-секция', system:"],
  ["description: 'Системный тайп: 2 контейнера × 3 ячейки'", "description: 'Два ряда по 3 ячейки'"],
  ["description: 'Кастомный промо-тайп'", "description: 'Промо-сетка из 4 ячеек'"],
]);

// Section canvas: no technical SYSTEM/TYPE naming, direct actions, drag-to-reorder.
app = app.replace(
  "function SectionCanvas({ section, locale, region, selected, onSelect, onPin, onUnpin }) {",
  "function SectionCanvas({ section, locale, region, selected, editable, onSelect, onPin, onUnpin, onDuplicate, onDelete, onSectionDragStart, onSectionDrop }) {",
);
app = app.replace(
  "const onDrop = (event, slotIndex) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (id) onPin(section.id, slotIndex, id); };",
  "const onDrop = (event, slotIndex) => { event.preventDefault(); event.stopPropagation(); const id = event.dataTransfer.getData('text/plain'); if (id) onPin(section.id, slotIndex, id); };",
);
app = app.replace(
  "return <section className={`builder-section ${selected ? 'selected' : ''}`} onClick={() => onSelect(section.id)}>",
  "return <section className={`builder-section ${selected ? 'selected' : ''}`} draggable={Boolean(editable && selected)} onDragStart={(e) => editable && selected ? onSectionDragStart(e, section.id) : e.preventDefault()} onDragOver={(e) => { if (editable) e.preventDefault(); }} onDrop={(e) => { if (editable) { e.preventDefault(); e.stopPropagation(); onSectionDrop(e, section.id); } }} onClick={() => onSelect(section.id)}>",
);
app = app.replace(
  "<div className=\"section-header-line\"><div><span>{section.template.system ? 'SYSTEM TYPE' : 'CUSTOM TYPE'} · {section.typeId}</span><h3>{section.titles[locale] || section.titles.ru}</h3></div><div className=\"section-head-meta\"><span>{section.resolvedSlots.filter((s) => s.entity).length}/{section.resolvedSlots.length} слотов</span><span className={`mode-badge ${section.rules.mode}`}>{section.rules.mode.toUpperCase()}</span><MoreHorizontal size={17}/></div></div>",
  "<div className=\"section-header-line\"><div><h3>{section.titles[locale] || section.titles.ru}</h3></div><div className=\"section-head-meta\"><span>{section.resolvedSlots.filter((s) => s.entity).length}/{section.resolvedSlots.length} слотов</span><span className={`mode-badge ${section.rules.mode}`}>{section.rules.mode.toUpperCase()}</span>{editable && selected && <div className=\"section-inline-actions\" onClick={(e) => e.stopPropagation()}><span className=\"section-drag-handle\" title=\"Перетащить секцию\"><GripVertical size={15}/></span><button title=\"Дублировать\" onClick={() => onDuplicate(section.id)}><Copy size={14}/></button><button title=\"Удалить\" onClick={() => onDelete(section.id)}><Trash2 size={14}/></button></div>}</div></div>",
);
app = app.replace('<div className="container-label">Контейнер {ci + 1}</div>', '');

// Section template library: visible terminology is "section", not "type".
app = replaceAll(app, [
  ['БИБЛИОТЕКА ТАЙПОВ', 'ШАБЛОНЫ СЕКЦИЙ'],
  ['Тайп задаёт геометрию. Новая секция создаётся с пустыми слотами, весь контент доступен по умолчанию.', 'Выберите геометрию секции. Новая секция создаётся с пустыми слотами, весь контент доступен по умолчанию.'],
  ['<div className="type-grid-title"><strong>{category}</strong><span>System / Custom</span></div>', '<div className="type-grid-title"><strong>{category}</strong><span>Шаблоны</span></div>'],
  ["<div className=\"type-card-top\"><strong>{type.id}</strong><span>{type.system ? 'SYSTEM' : 'CUSTOM'}</span></div>", '<div className="type-card-top"><strong>{type.label}</strong></div>'],
  ['<div className="policy-head"><span>ВЫБРАННЫЙ ТАЙП</span><strong>{selectedType.id}</strong></div>', '<div className="policy-head"><span>ВЫБРАННАЯ СЕКЦИЯ</span><strong>{selectedType.label}</strong></div>'],
  ['<Plus size={16}/> Добавить {selectedType.id}', '<Plus size={16}/> Добавить секцию'],
]);

// Add-section copy and no technical ids in created titles/toasts.
app = app.replace(
  "const titles = { ru: `Новая секция · ${type.id}`, en: `New section · ${type.id}`, kk: `Жаңа секция · ${type.id}`, ar: `قسم جديد · ${type.id}` };",
  "const titles = { ru: 'Новая секция', en: 'New section', kk: 'Жаңа секция', ar: 'قسم جديد' };",
);
app = app.replace(
  "setToast(`${type.id}: добавлено ${slotCount(type)} пустых слотов`); setTimeout(() => setToast(''), 1600);",
  "setToast(`Секция добавлена: ${slotCount(type)} пустых слотов`); setTimeout(() => setToast(''), 1600);",
);

// Add drag/reorder behaviour to the current page.
const duplicateLine = "const duplicate = (id) => { const source = sections.find((s) => s.id === id); if (!source) return; const copy = { ...source, id: `${source.id}-copy-${Date.now()}`, titles: { ...source.titles, ru: `${source.titles.ru} · копия`, en: `${source.titles.en || source.titles.ru} · copy` }, pins: { ...source.pins }, rules: { ...source.rules } }; mutateSections((prev) => [...prev, copy]); setSelectedId(copy.id); };";
if (!app.includes('const startSectionDrag =')) {
  app = app.replace(duplicateLine, `${duplicateLine}\n  const startSectionDrag = (event, id) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-merch-section', id); setSelectedId(id); };\n  const reorderSection = (event, targetId) => { const dragId = event.dataTransfer.getData('application/x-merch-section'); if (!dragId || dragId === targetId) return; const from = sections.findIndex((s) => s.id === dragId); const to = sections.findIndex((s) => s.id === targetId); if (from < 0 || to < 0) return; const next = [...sections]; const [moved] = next.splice(from, 1); const insertAt = from < to ? to - 1 : to; next.splice(insertAt, 0, moved); mutateSections(next); setSelectedId(dragId); setToast('Секция перемещена'); setTimeout(() => setToast(''), 1200); };`);
}

// Page structure is Header / Main / Footer. Sections live inside Main.
app = app.replace(
  '<div className="tree-static"><ChevronRight size={14}/>Header</div><div className="tree-static"><ChevronRight size={14}/>Hero / Banner</div><div className="section-tree">',
  '<div className="tree-static"><ChevronRight size={14}/>Header</div><div className="tree-main"><ChevronDown size={14}/><LayoutGrid size={14}/><strong>Main</strong></div><div className="main-tree-body"><div className="section-tree">',
);
app = app.replace(
  '</div><button className="add-section-button" onClick={() => setShowAdd(true)}><Plus size={16}/>Добавить секцию</button><div className="tree-static"><ChevronRight size={14}/>Footer</div>',
  '</div><button className="add-section-button" onClick={() => setShowAdd(true)}><Plus size={16}/>Добавить секцию</button></div><div className="tree-static"><ChevronRight size={14}/>Footer</div>',
);

// Remove technical ids from the Main tree and enable drag/drop there too.
app = app.replace(
  "{resolved.map((s) => <button key={s.id} className={`tree-type ${selectedId === s.id ? 'selected' : ''}`} onClick={() => setSelectedId(s.id)}><GripVertical size={13}/><LayoutGrid size={14}/><div><strong>{s.titles[locale] || s.titles.ru}</strong><small>{s.typeId} · {s.resolvedSlots.filter((x) => x.entity).length}/{s.resolvedSlots.length}</small></div><span>{s.rules.mode.toUpperCase()}</span></button>)}",
  "{resolved.map((s) => <button key={s.id} className={`tree-type ${selectedId === s.id ? 'selected' : ''}`} draggable onDragStart={(e) => startSectionDrag(e, s.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); reorderSection(e, s.id); }} onClick={() => setSelectedId(s.id)}><GripVertical size={13}/><LayoutGrid size={14}/><div><strong>{s.titles[locale] || s.titles.ru}</strong><small>{s.resolvedSlots.filter((x) => x.entity).length}/{s.resolvedSlots.length} слотов</small></div><span>{s.rules.mode.toUpperCase()}</span></button>)}",
);

// Main label on the editable canvas; remove the explanatory system note.
app = app.replace(
  '<div className="page-context-strip"><span>{currentPageName}</span><b>{region}</b><b>{LANGUAGE_LABELS[locale]}</b></div>{!previewMode && <div className="canvas-note"><Layers3 size={15}/><span>Секция = тайп. Геометрия задаётся шаблоном; любой слот может содержать товар, образ или медиа.</span></div>}',
  '<div className="page-context-strip"><span>{currentPageName}</span><b>{region}</b><b>{LANGUAGE_LABELS[locale]}</b></div>{!previewMode && <div className="main-canvas-label"><LayoutGrid size={15}/><strong>Main</strong><span>{resolved.length} секций</span></div>}',
);
app = app.replace('Добавить секцию / тайп', 'Добавить секцию');

// Pass edit/reorder actions into each canvas section.
app = app.replace(
  'onSelect={setSelectedId} onPin={pinEntity} onUnpin={unpin}/>',
  'editable={!previewMode} onSelect={setSelectedId} onPin={pinEntity} onUnpin={unpin} onDuplicate={duplicate} onDelete={removeSection} onSectionDragStart={startSectionDrag} onSectionDrop={reorderSection}/>',
);

// Right editor: only user-facing section terminology; no system/template ids.
app = replaceAll(app, [
  ['<span>СЕКЦИЯ / ТАЙП</span>', '<span>СЕКЦИЯ</span>'],
  ["<small>{selected.typeId} · {selected.template.system ? 'System' : 'Custom'}</small>", ''],
  [">Тайп</button>", '>Структура</button>'],
  ['Новый тайп создаётся в MANUAL:', 'Новая секция создаётся в MANUAL:'],
  ['<label>Структура тайпа</label>', '<label>Структура секции</label>'],
  ['<small>{s.typeId}</small>', '<small>{s.resolvedSlots.length} слотов</small>'],
]);

writeFileSync(appPath, app);

// Small visual additions for Main and section controls.
const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');
const marker = '/* main-section-editing-v2 */';
if (!css.includes(marker)) {
  css += `\n${marker}\n.tree-main{display:flex;align-items:center;gap:7px;min-height:34px;padding-left:10px;font-size:12px;color:#343842}.tree-main strong{font-size:12px}.main-tree-body{margin-left:17px;padding:2px 0 9px 9px;border-left:1px solid #e3e5ea}.main-tree-body .add-section-button{margin-top:4px}.main-canvas-label{margin:14px 18px 0;padding:8px 10px;border:1px solid #e4e6eb;border-radius:7px;background:#fafbfc;display:flex;align-items:center;gap:7px;font-size:10px;color:#60656f}.main-canvas-label strong{font-size:11px;color:#2e3239}.main-canvas-label span{margin-left:auto;color:#8a8e97}.section-inline-actions{display:flex;align-items:center;gap:3px;padding-left:3px;border-left:1px solid #e4e5e9}.section-inline-actions button{width:27px;height:27px;padding:0;border:1px solid transparent;border-radius:5px;background:#fff;display:grid;place-items:center;color:#5e626b}.section-inline-actions button:hover{background:#f2f4f7;border-color:#e0e3e8}.section-drag-handle{width:27px;height:27px;display:grid;place-items:center;border-radius:5px;color:#727680;cursor:grab}.section-drag-handle:hover{background:#f2f4f7}.builder-section.selected{cursor:grab}.builder-section.selected:active{cursor:grabbing}.builder-section .section-container{padding:8px}.builder-section .section-header-line h3{margin-top:0}.preview-mode .section-inline-actions{display:none}.tree-type[draggable=true]{cursor:grab}.tree-type[draggable=true]:active{cursor:grabbing}\n`;
  writeFileSync(cssPath, css);
}

console.log('Prepared storefront constructor: Main + section editing');
