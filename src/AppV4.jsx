import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, Check, ChevronDown, Copy, Eye, Film, GripVertical,
  Image as ImageIcon, LayoutGrid, Monitor, MoreHorizontal, Pin, Plus,
  Search, ShoppingBag, Smartphone, Sparkles, Trash2, X
} from 'lucide-react';
import { CATALOG_CATEGORIES, CATALOG_COLLECTIONS, CATALOG_DEPARTMENTS, CATALOG_PRODUCTS, CATALOG_SPRITE_DATA } from './catalogProducts.js';
import './appv4.css';

const REGIONS = ['RU', 'KZ', 'GCC', 'WW'];
const LAYOUTS = [
  { id: 'three', label: '3 равных слота', cols: 3, spans: [1, 1, 1] },
  { id: 'four', label: '4 равных слота', cols: 4, spans: [1, 1, 1, 1] },
  { id: 'feature', label: 'Акцент + 2 слота', cols: 4, spans: [2, 1, 1] },
  { id: 'six', label: '6 слотов / 2 ряда', cols: 3, spans: [1, 1, 1, 1, 1, 1] },
];

const MEDIA = [
  { id: 'MEDIA-01', kind: 'image', name: 'Editorial · Linen story', tone: 'sand' },
  { id: 'MEDIA-02', kind: 'video', name: 'Campaign · City motion', tone: 'black' },
  { id: 'MEDIA-03', kind: 'image', name: 'Editorial · Summer light', tone: 'cream' },
  { id: 'MEDIA-04', kind: 'look', name: 'Look · Soft tailoring', tone: 'stone' },
];

const defaultRules = () => ({
  mode: 'hybrid',
  department: 'Женщины',
  category: 'Все',
  collection: 'Все',
  stockMin: 1,
  newOnly: false,
  ranking: { sales: 45, stock: 25, newness: 20, discount: 10 },
  automation: {
    dedupe: true,
    diversifyCategory: true,
    maxSameCategory: 2,
    diversifyColor: true,
    maxSameColor: 2,
    lowStockThreshold: 3,
    lowStockPenalty: 25,
    newBoost: 10,
  },
  overflow: 'reserve',
  oosPinned: 'temporary',
  emptyBehavior: 'keep',
  regionMode: 'inherit',
});

const initialSections = () => [
  { id: 'best-sellers', title: 'Best Sellers · Women', layoutId: 'three', pins: { 1: 'LIM005' }, rules: defaultRules() },
  {
    id: 'new-edit', title: 'New In · Editorial', layoutId: 'feature', pins: { 0: 'MEDIA-01' },
    rules: { ...defaultRules(), newOnly: true, ranking: { sales: 35, stock: 20, newness: 35, discount: 10 }, automation: { ...defaultRules().automation, maxSameCategory: 1 } },
  },
];

const money = (n) => `${new Intl.NumberFormat('ru-RU').format(Number(n || 0))} ₽`;
const getLayout = (id) => LAYOUTS.find((x) => x.id === id) || LAYOUTS[0];
const getEntity = (id) => CATALOG_PRODUCTS.find((x) => x.id === id) || MEDIA.find((x) => x.id === id) || null;
const isProduct = (entity) => Boolean(entity && 'price' in entity);

function productImageStyle(product) {
  const x = product.spriteCols > 1 ? (product.spriteX / (product.spriteCols - 1)) * 100 : 0;
  const y = product.spriteRows > 1 ? (product.spriteY / (product.spriteRows - 1)) * 100 : 0;
  return { backgroundImage: `url(${CATALOG_SPRITE_DATA})`, backgroundSize: `${product.spriteCols * 100}% ${product.spriteRows * 100}%`, backgroundPosition: `${x}% ${y}%` };
}

function scoreProduct(product, rules, region, maxima) {
  const stock = Number(product.stock?.[region] ?? product.stockValue ?? 0);
  const salesNorm = maxima.sales ? Number(product.l7d || 0) / maxima.sales : 0;
  const stockNorm = maxima.stock ? stock / maxima.stock : 0;
  const discountNorm = Math.min(Number(product.discount || 0) / 50, 1);
  const r = rules.ranking;
  let score = salesNorm * Number(r.sales || 0) + stockNorm * Number(r.stock || 0) + (product.isNew ? 1 : 0) * Number(r.newness || 0) + discountNorm * Number(r.discount || 0);
  const a = rules.automation;
  if (product.isNew) score += Number(a.newBoost || 0);
  if (stock > 0 && stock <= Number(a.lowStockThreshold || 0)) score -= Number(a.lowStockPenalty || 0);
  return Math.max(0, Math.round(score * 10) / 10);
}

function buildCandidates(section, region) {
  const rules = section.rules;
  const source = CATALOG_PRODUCTS.filter((p) => {
    const stock = Number(p.stock?.[region] ?? p.stockValue ?? 0);
    return (rules.department === 'Все' || p.department === rules.department)
      && (rules.category === 'Все' || p.category === rules.category)
      && (rules.collection === 'Все' || p.collection === rules.collection)
      && stock >= Number(rules.stockMin || 0)
      && (!rules.newOnly || p.isNew);
  });
  const maxima = {
    sales: Math.max(1, ...source.map((p) => Number(p.l7d || 0))),
    stock: Math.max(1, ...source.map((p) => Number(p.stock?.[region] ?? p.stockValue ?? 0))),
  };
  return source.map((product) => ({ product, score: scoreProduct(product, rules, region, maxima) })).sort((a, b) => b.score - a.score || Number(b.product.l7d || 0) - Number(a.product.l7d || 0));
}

function constraintAllows(product, chosen, rules) {
  const a = rules.automation;
  if (a.dedupe && chosen.some((p) => p.id === product.id)) return false;
  if (a.diversifyCategory && chosen.filter((p) => p.category === product.category).length >= Number(a.maxSameCategory || 99)) return false;
  if (a.diversifyColor && chosen.filter((p) => p.color === product.color).length >= Number(a.maxSameColor || 99)) return false;
  return true;
}

function resolveSection(section, region) {
  const layout = getLayout(section.layoutId);
  const ranked = buildCandidates(section, region);
  const used = new Set();
  const chosenProducts = [];
  const slots = [];
  const takeNext = () => {
    const hit = ranked.find(({ product }) => !used.has(product.id) && constraintAllows(product, chosenProducts, section.rules));
    if (!hit) return null;
    used.add(hit.product.id); chosenProducts.push(hit.product); return hit;
  };

  layout.spans.forEach((span, index) => {
    const pinId = section.pins[index];
    if (pinId) {
      const entity = getEntity(pinId);
      if (!entity) { slots.push({ index, span, status: 'empty', entity: null }); return; }
      if (!isProduct(entity)) { slots.push({ index, span, status: 'pinned', entity, reasons: ['Редакционный контент закреплён мерчендайзером'] }); return; }
      const stock = Number(entity.stock?.[region] ?? entity.stockValue ?? 0);
      if (stock < Number(section.rules.stockMin || 0) && section.rules.oosPinned === 'temporary' && section.rules.mode !== 'manual') {
        const fallback = takeNext();
        if (fallback) {
          slots.push({ index, span, status: 'fallback', entity: fallback.product, score: fallback.score, originalPin: entity, warning: `PIN ${entity.id} недоступен → временная замена`, reasons: ['Закреплённый товар недоступен', 'Взят лучший товар из резерва', `Рейтинг ${fallback.score}`] });
          return;
        }
      }
      if (stock < Number(section.rules.stockMin || 0) && section.rules.oosPinned === 'collapse') { slots.push({ index, span, status: 'collapsed', entity: null, originalPin: entity, warning: 'PIN OOS → слот схлопнут' }); return; }
      used.add(entity.id); chosenProducts.push(entity);
      slots.push({ index, span, status: stock >= Number(section.rules.stockMin || 0) ? 'pinned' : 'oos', entity, warning: stock >= Number(section.rules.stockMin || 0) ? null : 'OOS', reasons: ['Товар закреплён мерчендайзером', `Сток ${region}: ${stock}`, 'Автоматическое ранжирование не меняет позицию PIN'] });
      return;
    }
    if (section.rules.mode === 'manual') { slots.push({ index, span, status: 'empty', entity: null, reasons: ['MANUAL: автоматическое заполнение выключено'] }); return; }
    const next = takeNext();
    if (next) {
      slots.push({ index, span, status: 'auto', entity: next.product, score: next.score, reasons: ['Подходит под источник и фильтры', `Коммерческий рейтинг: ${next.score}`, `Сток ${region}: ${next.product.stock?.[region] ?? next.product.stockValue ?? 0}`, `Продажи L7D: ${next.product.l7d || 0}`, 'Не нарушает ограничения композиции'] });
    } else {
      slots.push({ index, span, status: section.rules.emptyBehavior === 'collapse' ? 'collapsed' : 'empty', entity: null, reasons: ['Нет кандидата, который проходит фильтры и ограничения'] });
    }
  });

  const displayedIds = new Set(slots.filter((s) => isProduct(s.entity)).map((s) => s.entity.id));
  const reserveAll = ranked.filter(({ product }) => !displayedIds.has(product.id));
  const reserve = section.rules.overflow === 'reserve' ? reserveAll : [];
  return { ...section, layout, slots, candidates: ranked, reserve };
}

function Status({ value }) {
  const label = { auto: 'AUTO', pinned: 'PINNED', fallback: 'FALLBACK', oos: 'OOS', empty: 'EMPTY', collapsed: 'COLLAPSED' }[value] || value;
  return <span className={`v4-status ${value}`}>{label}</span>;
}

function ProductCard({ product, region, compact = false }) {
  return <div className={`v4-product-card ${compact ? 'compact' : ''}`}><div className="v4-product-image" style={productImageStyle(product)} /><div className="v4-product-copy"><strong>{product.name}</strong>{!compact && <span>{money(product.price)}</span>}<small>{product.id} · {product.category}</small><small>Сток {region}: {product.stock?.[region] ?? product.stockValue ?? 0} · L7D {product.l7d || 0}</small></div></div>;
}
function MediaCard({ media }) {
  const Icon = media.kind === 'video' ? Film : media.kind === 'look' ? Sparkles : ImageIcon;
  return <div className={`v4-media-card ${media.tone}`}><Icon size={28}/><strong>{media.name}</strong><span>{media.kind.toUpperCase()}</span></div>;
}
function SlotCard({ slot, region, selected, onSelect, onUnpin }) {
  return <div className={`v4-slot ${slot.status} ${selected ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); onSelect(slot.index); }}><div className="v4-slot-top"><span>Слот {slot.index + 1}</span><Status value={slot.status}/></div>{slot.entity ? (isProduct(slot.entity) ? <ProductCard product={slot.entity} region={region}/> : <MediaCard media={slot.entity}/>) : <div className="v4-empty-slot"><Plus size={22}/><strong>{slot.status === 'collapsed' ? 'Слот схлопнут' : 'Свободный слот'}</strong><span>Контент или AUTO-товар</span></div>}{slot.warning && <div className="v4-warning"><AlertTriangle size={13}/>{slot.warning}</div>}{['pinned','oos'].includes(slot.status) && <button className="v4-unpin" onClick={(e) => { e.stopPropagation(); onUnpin(slot.index); }} title="Вернуть слот в AUTO"><X size={13}/></button>}</div>;
}
function NumberField({ label, value, onChange, min = 0, max = 100 }) {
  return <label className="v4-field"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}/></label>;
}

export default function AppV4() {
  const [sections, setSections] = useState(initialSections);
  const [selectedId, setSelectedId] = useState('best-sellers');
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [tab, setTab] = useState('source');
  const [region, setRegion] = useState('RU');
  const [device, setDevice] = useState('desktop');
  const [preview, setPreview] = useState(false);
  const [coverage, setCoverage] = useState(true);
  const [libraryTab, setLibraryTab] = useState('products');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [dragSectionId, setDragSectionId] = useState(null);

  const resolved = useMemo(() => sections.map((s) => resolveSection(s, region)), [sections, region]);
  const selected = resolved.find((s) => s.id === selectedId) || resolved[0];
  const selectedSlotData = selected?.slots?.[selectedSlot] || null;
  const updateSection = (id, updater) => setSections((prev) => prev.map((s) => s.id === id ? updater(s) : s));
  const updateRules = (patch) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, ...patch } }));
  const updateRanking = (key, value) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, ranking: { ...s.rules.ranking, [key]: value } } }));
  const updateAutomation = (patch) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, automation: { ...s.rules.automation, ...patch } } }));

  const pinToSlot = (entityId, slotIndex = selectedSlot) => {
    updateSection(selected.id, (s) => ({ ...s, pins: { ...s.pins, [slotIndex]: entityId }, rules: { ...s.rules, mode: s.rules.mode === 'auto' ? 'hybrid' : s.rules.mode } }));
    setToast(`Слот ${slotIndex + 1} закреплён вручную`); setTimeout(() => setToast(''), 1400);
  };
  const unpin = (slotIndex) => updateSection(selected.id, (s) => { const pins = { ...s.pins }; delete pins[slotIndex]; return { ...s, pins }; });
  const addSection = () => { const id = `section-${Date.now()}`; setSections((prev) => [...prev, { id, title: 'Новая товарная секция', layoutId: 'three', pins: {}, rules: defaultRules() }]); setSelectedId(id); setSelectedSlot(0); setTab('source'); };
  const duplicateSection = (sectionId = selected?.id) => { const base = sections.find((s) => s.id === sectionId); if (!base) return; const copy = { ...base, id: `${base.id}-copy-${Date.now()}`, title: `${base.title} · копия`, pins: { ...base.pins }, rules: { ...base.rules, ranking: { ...base.rules.ranking }, automation: { ...base.rules.automation } } }; setSections((prev) => [...prev, copy]); setSelectedId(copy.id); };
  const deleteSection = (sectionId = selected?.id) => { setSections((prev) => prev.filter((s) => s.id !== sectionId)); const next = resolved.find((s) => s.id !== sectionId); setSelectedId(next?.id || ''); setSelectedSlot(0); };
  const reorder = (targetId) => { if (!dragSectionId || dragSectionId === targetId) return; setSections((prev) => { const next = [...prev], from = next.findIndex((s) => s.id === dragSectionId), to = next.findIndex((s) => s.id === targetId); const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; }); setDragSectionId(null); };

  const metrics = useMemo(() => {
    const slots = resolved.flatMap((s) => s.slots), productSlots = slots.filter((s) => isProduct(s.entity));
    const inStock = productSlots.filter((s) => Number(s.entity.stock?.[region] ?? s.entity.stockValue ?? 0) > 0).length;
    return { total: slots.length, filled: slots.filter((s) => s.entity).length, auto: slots.filter((s) => s.status === 'auto').length, pinned: slots.filter((s) => s.status === 'pinned').length, fallback: slots.filter((s) => s.status === 'fallback').length, oos: slots.filter((s) => s.status === 'oos').length, exposure: productSlots.length ? Math.round(inStock / productSlots.length * 100) : 100 };
  }, [resolved, region]);

  const productsForLibrary = CATALOG_PRODUCTS.filter((p) => !search || `${p.name} ${p.id} ${p.category}`.toLowerCase().includes(search.toLowerCase())).slice(0, 40);
  const tabs = [['content','Контент'],['source','Источник'],['layout','Сетка'],['ranking','Рейтинг'],['automation','Автоматизация'],['fallback','Fallback'],['region','Регион']];

  return <div className={`v4-app ${preview ? 'preview' : ''}`}>
    <header className="v4-topbar"><div className="v4-brand"><b>Storefront Builder</b><span>Hybrid Merchandising</span></div><div className="v4-breadcrumb">Sites <span>/</span> {region} <span>/</span> Women <span>/</span> Best Sellers</div><div className="v4-top-actions"><div className="v4-device"><button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={16}/></button><button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={16}/></button></div><select value={region} onChange={(e) => setRegion(e.target.value)}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select><button onClick={() => setCoverage((v) => !v)}><BarChart3 size={15}/> Покрытие</button><button onClick={() => setPreview((v) => !v)}><Eye size={15}/> {preview ? 'Редактировать' : 'Предпросмотр'}</button><button className="primary" onClick={() => { setToast('Страница опубликована'); setTimeout(() => setToast(''), 1400); }}><Check size={15}/> Опубликовать</button></div></header>

    <main className="v4-workspace">
      {!preview && <aside className="v4-tree"><div className="v4-panel-head"><span>СТРУКТУРА СТРАНИЦЫ</span><strong>Women / Best Sellers</strong></div><div className="v4-tree-row muted">Header</div><div className="v4-tree-main"><ChevronDown size={14}/><LayoutGrid size={14}/><strong>Main</strong></div><div className="v4-section-list">{resolved.map((section) => <button key={section.id} draggable onDragStart={() => setDragSectionId(section.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(section.id)} className={selected?.id === section.id ? 'active' : ''} onClick={() => { setSelectedId(section.id); setSelectedSlot(0); }}><GripVertical size={13}/><div><strong>{section.title}</strong><small>{section.slots.filter((x) => x.entity).length}/{section.layout.spans.length} слота · {section.candidates.length} кандидатов</small></div><span className="v4-tree-mode">{section.rules.mode.toUpperCase()}</span></button>)}<button className="v4-add-section" onClick={addSection}><Plus size={15}/> Добавить секцию</button></div><div className="v4-tree-row muted">Footer</div><div className="v4-tree-kpi"><span>ПОКРЫТИЕ</span><strong>{metrics.exposure}%</strong><small>товарных показов доступны в {region}</small></div></aside>}

      <section className="v4-canvas-shell"><div className={`v4-storefront ${device}`}><div className="v4-store-nav"><span>NEW IN</span><span>WOMAN</span><span>MAN</span><span>KIDS</span><span>EDITORIAL</span><div><Search size={16}/><ShoppingBag size={16}/></div></div><div className="v4-page-title"><span>WOMAN</span><strong>BEST SELLERS</strong><small>{region} · динамическая витрина</small></div>{resolved.map((section) => <section key={section.id} className={`v4-section ${!preview && selected?.id === section.id ? 'selected' : ''}`} onClick={() => !preview && setSelectedId(section.id)}>{!preview && <div className="v4-section-toolbar"><div><GripVertical size={14}/><strong>{section.title}</strong><span>{section.candidates.length} найдено → {section.slots.filter((x) => x.entity).length} показано → {section.reserve.length} в резерве</span></div><div><span className="v4-tree-mode">{section.rules.mode.toUpperCase()}</span><button onClick={(e) => { e.stopPropagation(); duplicateSection(section.id); }}><Copy size={14}/></button><button onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}><Trash2 size={14}/></button></div></div>}<div className="v4-grid" style={{ gridTemplateColumns: `repeat(${section.layout.cols}, minmax(0,1fr))` }}>{section.slots.map((slot) => <div key={slot.index} style={{ gridColumn: `span ${slot.span}` }}><SlotCard slot={slot} region={region} selected={!preview && selected?.id === section.id && selectedSlot === slot.index} onSelect={(index) => { setSelectedId(section.id); setSelectedSlot(index); }} onUnpin={(index) => { setSelectedId(section.id); unpin(index); }}/></div>)}</div></section>)}</div></section>

      {!preview && <aside className="v4-settings">{selected ? <><div className="v4-settings-head"><div><span>СЕКЦИЯ</span><strong>{selected.title}</strong><small>{selected.layout.spans.length} слота · {selected.candidates.length} кандидатов · {selected.reserve.length} резерв</small></div><button><MoreHorizontal size={17}/></button></div><div className="v4-tabs">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div><div className="v4-settings-scroll">
        {selectedSlotData?.entity && <div className="v4-explain"><div><Status value={selectedSlotData.status}/><strong>Почему этот контент в слоте {selectedSlotData.index + 1}</strong></div>{(selectedSlotData.reasons || []).map((reason) => <span key={reason}><Check size={12}/>{reason}</span>)}{selectedSlotData.originalPin && <small>Исходный PIN: {selectedSlotData.originalPin.name}</small>}</div>}

        {tab === 'content' && <><div className="v4-setting-card"><label>Режим наполнения</label><div className="v4-segment">{['manual','hybrid','auto'].map((m) => <button key={m} className={selected.rules.mode === m ? 'active' : ''} onClick={() => updateRules({ mode: m })}>{m.toUpperCase()}</button>)}</div><p>HYBRID: правила заполняют AUTO-слоты, а мерчендайзер может закрепить любой товар или editorial-контент.</p></div><div className="v4-setting-card"><label>Выбран слот {selectedSlot + 1}</label><div className="v4-library-tabs"><button className={libraryTab === 'products' ? 'active' : ''} onClick={() => setLibraryTab('products')}>Товары</button><button className={libraryTab === 'media' ? 'active' : ''} onClick={() => setLibraryTab('media')}>Editorial</button></div>{libraryTab === 'products' && <><div className="v4-search"><Search size={14}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SKU / название / категория"/></div><div className="v4-library">{productsForLibrary.map((p) => <button key={p.id} onClick={() => pinToSlot(p.id)}><ProductCard product={p} region={region} compact/><Pin size={13}/></button>)}</div></>}{libraryTab === 'media' && <div className="v4-library media">{MEDIA.map((m) => <button key={m.id} onClick={() => pinToSlot(m.id)}><MediaCard media={m}/><Pin size={13}/></button>)}</div>}</div><div className="v4-setting-card"><label>Резерв кандидатов</label><div className="v4-pipeline-kpis"><span><b>{selected.candidates.length}</b> подходят</span><span><b>{selected.layout.spans.length}</b> ёмкость</span><span><b>{selected.reserve.length}</b> резерв</span></div><div className="v4-reserve">{selected.reserve.slice(0, 8).map(({ product, score }, i) => <button key={product.id} onClick={() => pinToSlot(product.id)}><span>#{i + 1 + selected.slots.filter((s) => isProduct(s.entity)).length}</span><div><strong>{product.name}</strong><small>{product.id} · score {score}</small></div><Pin size={12}/></button>)}</div></div></>}

        {tab === 'source' && <><div className="v4-setting-card"><label>1. Источник кандидатов</label><label className="v4-field"><span>Отдел</span><select value={selected.rules.department} onChange={(e) => updateRules({ department: e.target.value })}><option>Все</option>{CATALOG_DEPARTMENTS.map((x) => <option key={x}>{x}</option>)}</select></label><label className="v4-field"><span>Категория</span><select value={selected.rules.category} onChange={(e) => updateRules({ category: e.target.value })}><option>Все</option>{CATALOG_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></label><label className="v4-field"><span>Коллекция</span><select value={selected.rules.collection} onChange={(e) => updateRules({ collection: e.target.value })}><option>Все</option>{CATALOG_COLLECTIONS.map((x) => <option key={x}>{x}</option>)}</select></label><NumberField label="Остаток ≥" value={selected.rules.stockMin} onChange={(v) => updateRules({ stockMin: v })} max={999}/><label className="v4-check"><input type="checkbox" checked={selected.rules.newOnly} onChange={(e) => updateRules({ newOnly: e.target.checked })}/><span>Только новинки</span></label></div><div className="v4-pipeline"><div><b>{CATALOG_PRODUCTS.length}</b><span>каталог</span></div><i>→</i><div><b>{selected.candidates.length}</b><span>после фильтров</span></div><i>→</i><div><b>{selected.layout.spans.length}</b><span>слотов</span></div></div></>}

        {tab === 'layout' && <><div className="v4-setting-card"><label>Ёмкость и геометрия</label><div className="v4-layout-options">{LAYOUTS.map((layout) => <button key={layout.id} className={selected.layoutId === layout.id ? 'active' : ''} onClick={() => updateSection(selected.id, (s) => ({ ...s, layoutId: layout.id }))}><div style={{ gridTemplateColumns: `repeat(${layout.cols},1fr)` }}>{layout.spans.map((span, i) => <i key={i} style={{ gridColumn: `span ${span}` }}/>)}</div><span>{layout.label}</span></button>)}</div></div><div className="v4-setting-card"><label>Если найдено больше, чем слотов</label><select value={selected.rules.overflow} onChange={(e) => updateRules({ overflow: e.target.value })}><option value="reserve">Показать лучшие N + остальные в резерв</option><option value="truncate">Показать лучшие N без резерва</option></select><p>Рекомендуемый режим — резерв: OOS или снятый SKU автоматически заменяется следующим подходящим кандидатом.</p></div><div className="v4-capacity-card"><span>Найдено <b>{selected.candidates.length}</b></span><span>Показано <b>{selected.slots.filter((s) => s.entity).length}</b></span><span>В резерве <b>{selected.reserve.length}</b></span></div></>}

        {tab === 'ranking' && <><div className="v4-setting-card"><label>2. Коммерческий рейтинг</label><p>После фильтрации кандидаты получают score. В свободные AUTO-слоты попадают лучшие товары.</p><NumberField label="Продажи L7D, вес %" value={selected.rules.ranking.sales} onChange={(v) => updateRanking('sales', v)}/><NumberField label="Наличие, вес %" value={selected.rules.ranking.stock} onChange={(v) => updateRanking('stock', v)}/><NumberField label="Новизна, вес %" value={selected.rules.ranking.newness} onChange={(v) => updateRanking('newness', v)}/><NumberField label="Скидка, вес %" value={selected.rules.ranking.discount} onChange={(v) => updateRanking('discount', v)}/></div><div className="v4-ranking-list">{selected.candidates.slice(0, 8).map(({ product, score }, i) => <div key={product.id}><b>#{i + 1}</b><span>{product.name}<small>{product.id}</small></span><em>{score}</em></div>)}</div></>}

        {tab === 'automation' && <><div className="v4-rule-flow"><span>FILTER</span><i>→</i><span>RANK</span><i>→</i><span>CONSTRAINTS</span><i>→</i><span>CAPACITY</span><i>→</i><span>RESERVE</span></div><div className="v4-setting-card"><label>3. Ограничения композиции</label><label className="v4-check"><input type="checkbox" checked={selected.rules.automation.dedupe} onChange={(e) => updateAutomation({ dedupe: e.target.checked })}/><span>Не повторять один SKU</span></label><label className="v4-check"><input type="checkbox" checked={selected.rules.automation.diversifyCategory} onChange={(e) => updateAutomation({ diversifyCategory: e.target.checked })}/><span>Ограничить повторы категории</span></label><NumberField label="Не более товаров одной категории" value={selected.rules.automation.maxSameCategory} onChange={(v) => updateAutomation({ maxSameCategory: v })} min={1} max={10}/><label className="v4-check"><input type="checkbox" checked={selected.rules.automation.diversifyColor} onChange={(e) => updateAutomation({ diversifyColor: e.target.checked })}/><span>Ограничить повторы цвета</span></label><NumberField label="Не более товаров одного цвета" value={selected.rules.automation.maxSameColor} onChange={(v) => updateAutomation({ maxSameColor: v })} min={1} max={10}/></div><div className="v4-setting-card"><label>4. Автоматические boost / bury</label><NumberField label="Если NEW → поднять score на" value={selected.rules.automation.newBoost} onChange={(v) => updateAutomation({ newBoost: v })}/><NumberField label="Low stock: остаток ≤" value={selected.rules.automation.lowStockThreshold} onChange={(v) => updateAutomation({ lowStockThreshold: v })} max={999}/><NumberField label="→ понизить score на" value={selected.rules.automation.lowStockPenalty} onChange={(v) => updateAutomation({ lowStockPenalty: v })}/></div><div className="v4-automation-list"><div><span>ЕСЛИ</span><b>товар не проходит Stock ≥ {selected.rules.stockMin}</b><span>ТО</span><b>не участвует в пуле</b></div><div><span>ЕСЛИ</span><b>NEW = Да</b><span>ТО</span><b>boost +{selected.rules.automation.newBoost}</b></div><div><span>ЕСЛИ</span><b>Stock ≤ {selected.rules.automation.lowStockThreshold}</b><span>ТО</span><b>bury −{selected.rules.automation.lowStockPenalty}</b></div><div><span>ЕСЛИ</span><b>слот PINNED</b><span>ТО</span><b>ranking не меняет позицию</b></div></div></>}

        {tab === 'fallback' && <><div className="v4-setting-card"><label>PINNED товар стал OOS</label><select value={selected.rules.oosPinned} onChange={(e) => updateRules({ oosPinned: e.target.value })}><option value="temporary">Временно заменить лучшим из резерва</option><option value="keep">Оставить OOS на месте</option><option value="collapse">Схлопнуть слот</option></select></div><div className="v4-fallback-chain"><strong>Цепочка fallback</strong><div><b>1</b><span>Следующий eligible товар по ranking</span></div><div><b>2</b><span>Соблюсти ограничения категории / цвета</span></div><div><b>3</b><span>Заполнить освободившийся слот</span></div><div><b>4</b><span>Если исходный PIN вернулся — восстановить PIN</span></div></div><div className="v4-setting-card"><label>Если кандидатов больше нет</label><select value={selected.rules.emptyBehavior} onChange={(e) => updateRules({ emptyBehavior: e.target.value })}><option value="keep">Оставить пустой слот</option><option value="collapse">Схлопнуть слот</option></select></div></>}

        {tab === 'region' && <><div className="v4-setting-card"><label>Наследование страницы</label><div className="v4-segment"><button className={selected.rules.regionMode === 'inherit' ? 'active' : ''} onClick={() => updateRules({ regionMode: 'inherit' })}>GLOBAL</button><button className={selected.rules.regionMode === 'override' ? 'active' : ''} onClick={() => updateRules({ regionMode: 'override' })}>OVERRIDE</button></div><p>GLOBAL хранит структуру и правила один раз. Регион может переопределить ассортимент, наличие или контент без копирования страницы.</p></div><div className="v4-region-grid">{REGIONS.map((r) => <div key={r} className={r === region ? 'active' : ''}><b>{r}</b><span>{r === region ? 'редактируется' : 'наследует Global'}</span><small>{selected.candidates.filter(({ product }) => Number(product.stock?.[r] ?? product.stockValue ?? 0) >= selected.rules.stockMin).length} eligible SKU</small></div>)}</div></>}
      </div></> : <div className="v4-settings-empty">Добавьте секцию</div>}</aside>}
    </main>

    {coverage && !preview && <div className="v4-coverage"><div className="v4-coverage-head"><div><BarChart3 size={16}/><strong>ПОКРЫТИЕ ВИТРИНЫ</strong></div><button onClick={() => setCoverage(false)}><X size={15}/></button></div><div className="v4-coverage-grid"><div><span>Заполнено</span><b>{metrics.filled}/{metrics.total}</b></div><div><span>AUTO</span><b>{metrics.auto}</b></div><div><span>PINNED</span><b>{metrics.pinned}</b></div><div><span>FALLBACK</span><b>{metrics.fallback}</b></div><div><span>OOS</span><b>{metrics.oos}</b></div><div><span>In-stock exposure</span><b>{metrics.exposure}%</b></div></div><div className="v4-coverage-sections">{resolved.map((s) => <div key={s.id}><strong>{s.title}</strong><span>{s.candidates.length} кандидатов</span><span>{s.slots.filter((x) => x.entity).length}/{s.layout.spans.length} показано</span><span>{s.reserve.length} резерв</span></div>)}</div></div>}
    {toast && <div className="v4-toast"><Check size={15}/>{toast}</div>}
  </div>;
}
