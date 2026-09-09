import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

const once = (from, to) => { if (app.includes(from)) app = app.replace(from, to); };

// Runtime media uploaded from the prototype UI is kept for the current browser session.
once(
  "const CONTENT = [...CATALOG_LOOKS, ...CATALOG_MEDIA];",
  "const CONTENT = [...CATALOG_LOOKS, ...CATALOG_MEDIA];\nconst RUNTIME_MEDIA = [];",
);
once(
  "return CONTENT.find((x) => x.id === id)?.kind;",
  "return (CONTENT.find((x) => x.id === id) || RUNTIME_MEDIA.find((x) => x.id === id))?.kind;",
);
once(
  "return PRODUCTS.find((p) => p.id === id) || CONTENT.find((m) => m.id === id) || null;",
  "return PRODUCTS.find((p) => p.id === id) || CONTENT.find((m) => m.id === id) || RUNTIME_MEDIA.find((m) => m.id === id) || null;",
);

// Select a concrete slot, then click a content card to replace its preview/content.
once(
  "function Slot({ slot, region, shape, onDrop, onUnpin }) {",
  "function Slot({ slot, region, shape, sectionId, selectedSlot, onSelectSlot, onDrop, onUnpin }) {",
);
once(
  "return <div className={`lego-slot ${shapeClass} ${slot.entity ? 'filled' : 'empty'} ${slot.status}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>",
  "return <div className={`lego-slot ${shapeClass} ${slot.entity ? 'filled' : 'empty'} ${slot.status} ${selectedSlot?.sectionId === sectionId && selectedSlot?.slotIndex === slot.index ? 'selected-content-slot' : ''}`} onClick={(e) => { e.stopPropagation(); onSelectSlot?.({ sectionId, slotIndex: slot.index }); }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>",
);

app = app.replace(
  /function SectionCanvas\(\{ section, locale, region, selected, editable, onSelect, onPin, onUnpin, onDuplicate, onDelete, onSectionDragStart, onSectionDrop \}\) \{/,
  "function SectionCanvas({ section, locale, region, selected, editable, selectedSlot, onSelectSlot, onSelect, onPin, onUnpin, onDuplicate, onDelete, onSectionDragStart, onSectionDrop }) {",
);
app = app.replace(
  /<Slot slot=\{slot\} region=\{region\} shape=\{shape\} onDrop=/g,
  '<Slot slot={slot} region={region} shape={shape} sectionId={section.id} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} onDrop=',
);

// Preview CTA for looks. It is only visible in desktop preview via CSS.
once(
  "<div className=\"store-card-caption\"><span>{isLook ? (entity.department || 'ОБРАЗ') : CONTENT_LABELS[entity.kind]}</span><strong>{entity.name}</strong>{isLook && <b>{entity.collection}</b>}</div>\n    {detailsOpen && <EntityDetailsModal entity={entity} region={'RU'} onClose={() => setDetailsOpen(false)}/>}",
  "<div className=\"store-card-caption\"><span>{isLook ? (entity.department || 'ОБРАЗ') : CONTENT_LABELS[entity.kind]}</span><strong>{entity.name}</strong>{isLook && <b>{entity.collection}</b>}</div>{isLook && <button className=\"look-preview-cta\">Смотреть образ</button>}\n    {detailsOpen && <EntityDetailsModal entity={entity} region={'RU'} onClose={() => setDetailsOpen(false)}/>}",
);

// Content-panel state and filters.
once(
  "const [query, setQuery] = useState('');",
  "const [query, setQuery] = useState('');\n  const [selectedSlot, setSelectedSlot] = useState(null);\n  const [productDepartment, setProductDepartment] = useState('Все');\n  const [productCategory, setProductCategory] = useState('Все');\n  const [productCollection, setProductCollection] = useState('Все');\n  const [productAvailability, setProductAvailability] = useState('Все');\n  const [lookDepartment, setLookDepartment] = useState('Все');\n  const [lookCollection, setLookCollection] = useState('Все');\n  const [mediaKind, setMediaKind] = useState('Все');\n  const [uploadedMedia, setUploadedMedia] = useState([]);",
);

once(
  "const collectionOptions = useMemo(() => ['Все', ...Array.from(new Set(PRODUCTS.map((product) => product.collection).filter(Boolean))).sort()], []);",
  "const collectionOptions = useMemo(() => ['Все', ...Array.from(new Set(PRODUCTS.map((product) => product.collection).filter(Boolean))).sort()], []);\n  const productDepartmentOptions = useMemo(() => ['Все', ...Array.from(new Set(PRODUCTS.map((product) => product.department).filter(Boolean))).sort()], []);\n  const productCategoryOptions = useMemo(() => ['Все', ...Array.from(new Set(PRODUCTS.map((product) => product.category).filter(Boolean))).sort()], []);\n  const lookDepartmentOptions = useMemo(() => ['Все', ...Array.from(new Set(CATALOG_LOOKS.map((look) => look.department).filter(Boolean))).sort()], []);\n  const lookCollectionOptions = useMemo(() => ['Все', ...Array.from(new Set(CATALOG_LOOKS.flatMap((look) => String(look.collection || '').split('|')).filter(Boolean))).sort()], []);",
);

// Replace existing library selection with tab-specific search + filters.
app = app.replace(
  /const visibleLibrary = useMemo\(\(\) => \{[\s\S]*?\}, \[contentTab, query\]\);/,
  `const visibleLibrary = useMemo(() => {\n    const q = query.trim().toLowerCase();\n    if (contentTab === 'product') return PRODUCTS.filter((p) => {\n      const searchMatch = !q || [p.name, p.id, p.department, p.category, p.subcategory, p.material, p.color, p.collection].some((value) => String(value || '').toLowerCase().includes(q));\n      const departmentMatch = productDepartment === 'Все' || p.department === productDepartment;\n      const categoryMatch = productCategory === 'Все' || p.category === productCategory;\n      const collectionMatch = productCollection === 'Все' || p.collection === productCollection;\n      const availabilityMatch = productAvailability === 'Все' || (productAvailability === 'В наличии' ? (p.stock?.[region] ?? p.stockValue ?? 0) > 0 : (p.stock?.[region] ?? p.stockValue ?? 0) <= 0);\n      return searchMatch && departmentMatch && categoryMatch && collectionMatch && availabilityMatch;\n    });\n    if (contentTab === 'look') return CATALOG_LOOKS.filter((look) => {\n      const searchMatch = !q || [look.name, look.nameEn, look.id, look.department, look.collection, ...(look.productIds || [])].some((value) => String(value || '').toLowerCase().includes(q));\n      const departmentMatch = lookDepartment === 'Все' || look.department === lookDepartment;\n      const collectionMatch = lookCollection === 'Все' || String(look.collection || '').split('|').includes(lookCollection);\n      return searchMatch && departmentMatch && collectionMatch;\n    });\n    return [...uploadedMedia, ...CATALOG_MEDIA].filter((item) => {\n      const searchMatch = !q || [item.name, item.file, item.kind].some((value) => String(value || '').toLowerCase().includes(q));\n      const kindMatch = mediaKind === 'Все' || item.kind === mediaKind;\n      return searchMatch && kindMatch;\n    });\n  }, [contentTab, query, productDepartment, productCategory, productCollection, productAvailability, lookDepartment, lookCollection, mediaKind, uploadedMedia, region]);`,
);

// Upload local media into the active prototype session.
once(
  "const navByLocale = {",
  "const addMediaFiles = (files) => {\n    const items = Array.from(files || []).map((file, index) => {\n      const lower = file.name.toLowerCase();\n      const kind = file.type.startsWith('video/') || lower.endsWith('.mp4') || lower.endsWith('.webm') ? 'video' : lower.endsWith('.svg') ? 'svg' : 'image';\n      const src = URL.createObjectURL(file);\n      return { id: `UPLOAD-${Date.now()}-${index}`, kind, name: file.name.replace(/\\.[^.]+$/, ''), file: file.name, src, image: kind === 'video' ? '' : src, images: kind === 'video' ? [] : [src], uploaded: true, tone: 'catalog-media' };\n    });\n    if (!items.length) return;\n    RUNTIME_MEDIA.push(...items);\n    setUploadedMedia((prev) => [...items, ...prev]);\n    setToast(`Добавлено медиа: ${items.length}`);\n    setTimeout(() => setToast(''), 1500);\n  };\n\n  const navByLocale = {",
);

// Pass slot selection state to the canvas sections.
app = app.replace(
  /editable=\{!previewMode\} onSelect=\{setSelectedId\}/g,
  'editable={!previewMode} selectedSlot={selectedSlot} onSelectSlot={(slot) => { setSelectedSlot(slot); setSelectedId(slot.sectionId); }} onSelect={setSelectedId}',
);

// Replace the right side with a dedicated content library. Rules/structure no longer compete with content.
app = app.replace(
  /<aside className="settings-panel">[\s\S]*?<\/aside>\n    <\/main>/,
  `<aside className="settings-panel content-panel">\n        <div className="content-panel-head"><div><span>КОНТЕНТ</span><strong>{contentTab === 'product' ? 'Товары' : contentTab === 'look' ? 'Образы' : 'Медиа'}</strong><small>{visibleLibrary.length} найдено</small></div>{selectedSlot && <button className="clear-slot-selection" onClick={() => setSelectedSlot(null)} title="Снять выбор слота"><X size={14}/></button>}</div>\n        <div className="content-tabs content-tabs-main"><button className={contentTab === 'product' ? 'active' : ''} onClick={() => { setContentTab('product'); setQuery(''); }}>Товары</button><button className={contentTab === 'look' ? 'active' : ''} onClick={() => { setContentTab('look'); setQuery(''); }}>Образы</button><button className={contentTab === 'media' ? 'active' : ''} onClick={() => { setContentTab('media'); setQuery(''); }}>Медиа</button></div>\n        {selectedSlot && <div className="selected-slot-hint"><Pin size={13}/><span>Слот {selectedSlot.slotIndex + 1} выбран. Клик по карточке заменит контент в превью.</span></div>}\n        <div className="content-panel-filters">\n          <div className="panel-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={contentTab === 'product' ? 'Поиск по названию / артикулу' : contentTab === 'look' ? 'Поиск образа / артикула' : 'Поиск медиа'}/></div>\n          {contentTab === 'product' && <div className="filter-grid"><label>Отдел<select value={productDepartment} onChange={(e) => setProductDepartment(e.target.value)}>{productDepartmentOptions.map((value) => <option key={value}>{value}</option>)}</select></label><label>Категория<select value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>{productCategoryOptions.map((value) => <option key={value}>{value}</option>)}</select></label><label>Коллекция<select value={productCollection} onChange={(e) => setProductCollection(e.target.value)}>{collectionOptions.map((value) => <option key={value}>{value}</option>)}</select></label><label>Наличие<select value={productAvailability} onChange={(e) => setProductAvailability(e.target.value)}><option>Все</option><option>В наличии</option><option>Нет в наличии</option></select></label></div>}\n          {contentTab === 'look' && <div className="filter-grid"><label>Отдел<select value={lookDepartment} onChange={(e) => setLookDepartment(e.target.value)}>{lookDepartmentOptions.map((value) => <option key={value}>{value}</option>)}</select></label><label>Коллекция<select value={lookCollection} onChange={(e) => setLookCollection(e.target.value)}>{lookCollectionOptions.map((value) => <option key={value}>{value}</option>)}</select></label></div>}\n          {contentTab === 'media' && <div className="media-filter-row"><label>Тип<select value={mediaKind} onChange={(e) => setMediaKind(e.target.value)}><option>Все</option><option value="image">Изображения</option><option value="video">Видео</option><option value="svg">SVG</option></select></label><label className="upload-media-button"><Plus size={14}/>Загрузить медиа<input type="file" multiple accept="image/*,video/*,.svg" onChange={(e) => { addMediaFiles(e.target.files); e.target.value = ''; }}/></label></div>}\n        </div>\n        <div className="settings-scroll content-library-scroll"><div className="library-items">{visibleLibrary.map((entity) => <div key={entity.id} className={\`library-entity ${selectedSlot ? 'clickable' : ''}\`} draggable onClick={() => { if (selectedSlot) pinEntity(selectedSlot.sectionId, selectedSlot.slotIndex, entity.id); }} onDragStart={(e) => e.dataTransfer.setData('text/plain', entity.id)}>{'price' in entity ? <ProductCard product={entity} region={region} compact/> : <MediaCard entity={entity} compact/>}<GripVertical size={14}/></div>)}</div>{!visibleLibrary.length && <div className="content-empty">Ничего не найдено</div>}</div>\n      </aside>\n    </main>`,
);

writeFileSync(appPath, app);

const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');
const marker = '/* content-panel-v4 */';
if (!css.includes(marker)) {
  css += `\n${marker}\n.content-panel{display:flex;flex-direction:column;overflow:hidden!important;background:#fff}.content-panel-head{min-height:66px;padding:13px 14px 10px;border-bottom:1px solid #e8e9ed;display:flex;align-items:flex-start;justify-content:space-between}.content-panel-head>div{display:grid;gap:2px}.content-panel-head span{font-size:8px;letter-spacing:.09em;color:#81858e;font-weight:800}.content-panel-head strong{font-size:14px}.content-panel-head small{font-size:8px;color:#8a8e96}.clear-slot-selection{width:27px;height:27px;border:1px solid #e1e3e8;background:#fff;border-radius:5px;display:grid;place-items:center}.content-tabs-main{margin:10px 12px 0;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #dfe2e8;border-radius:7px;overflow:hidden}.content-tabs-main button{height:34px;border:0;border-right:1px solid #e4e6ea;background:#fff;font-size:9px;font-weight:800}.content-tabs-main button:last-child{border-right:0}.content-tabs-main button.active{background:#17191e;color:#fff}.selected-slot-hint{margin:9px 12px 0;padding:8px 9px;border-radius:6px;background:#eef4ff;color:#315fab;display:flex;align-items:flex-start;gap:6px;font-size:8px;line-height:1.35}.content-panel-filters{padding:10px 12px 9px;border-bottom:1px solid #e9eaed;display:grid;gap:8px}.content-panel-filters .panel-search{margin:0}.filter-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.filter-grid label,.media-filter-row>label:first-child{display:grid;gap:3px;font-size:7px;font-weight:800;color:#7f838c;text-transform:uppercase}.filter-grid select,.media-filter-row select{height:30px;border:1px solid #dfe2e8;border-radius:5px;background:#fff;padding:0 7px;font-size:8px;min-width:0}.media-filter-row{display:grid;grid-template-columns:1fr 1.25fr;gap:6px;align-items:end}.upload-media-button{height:30px;border:1px solid #bfcbe3;border-radius:5px;background:#f7faff;color:#315fae;display:flex;align-items:center;justify-content:center;gap:5px;font-size:8px;font-weight:800;cursor:pointer}.upload-media-button input{display:none}.content-library-scroll{flex:1;min-height:0;overflow:auto;padding:9px 10px 22px}.content-empty{padding:35px 10px;text-align:center;color:#93969d;font-size:9px}.library-entity.clickable{cursor:pointer}.library-entity.clickable:hover{outline:2px solid #8aaaf0;outline-offset:1px}.selected-content-slot{outline:3px solid #4678df!important;outline-offset:2px;position:relative}.selected-content-slot:after{content:'ВЫБРАН';position:absolute;left:7px;top:7px;z-index:11;padding:3px 5px;border-radius:3px;background:#4678df;color:#fff;font-size:7px;font-weight:900;letter-spacing:.04em}.look-preview-cta{display:none}.preview-mode .commerce-badges,.preview-mode .entity-details-trigger,.preview-mode .media-index,.preview-mode .slot-mode-badge,.preview-mode .selected-content-slot:after{display:none!important}.preview-mode .selected-content-slot{outline:0!important}.preview-mode .merch-product-card .store-card-caption>span{display:none}.preview-mode .merch-product-card .store-card-caption{min-height:48px;padding:8px 9px}.preview-mode .merch-media-card:not(.look-card) .store-card-caption{display:none}.preview-mode .look-card .store-card-caption{display:none}.preview-mode .storefront-frame.desktop .look-card .look-preview-cta{display:block;width:100%;height:38px;border:0;border-top:1px solid #e7e7e8;background:#fff;color:#16171a;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.preview-mode .storefront-frame.mobile .look-card .look-preview-cta{display:none!important}.preview-mode .storefront-frame.mobile .look-card .store-card-caption{display:none!important}.preview-mode .merch-media-card{background:#fff}.preview-mode .merch-media-card .merch-card-media{min-height:100%}\n`;
  writeFileSync(cssPath, css);
}

console.log('Content panel prepared: filters, media upload, slot selection, clean preview');
