import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Database,
  Eye,
  FileImage,
  Film,
  Globe2,
  GripVertical,
  Heart,
  Image as ImageIcon,
  Layers3,
  LayoutGrid,
  Menu,
  Monitor,
  MoreHorizontal,
  Package,
  PanelBottom,
  Pin,
  Plus,
  Redo2,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

const PRODUCTS = [
  { id: 'P-101', name: 'Пиджак из льна', kind: 'jacket', category: 'Одежда', collection: 'S26', price: 12999, discount: 0, l7d: 38, stock: { RU: 28, KZ: 7, GCC: 5, WW: 12 }, newness: 95, tone: 'sand' },
  { id: 'P-102', name: 'Платье миди', kind: 'dress', category: 'Одежда', collection: 'S26', price: 8999, discount: 10, l7d: 54, stock: { RU: 19, KZ: 5, GCC: 0, WW: 8 }, newness: 88, tone: 'black' },
  { id: 'P-103', name: 'Топ в рубчик', kind: 'top', category: 'Одежда', collection: 'S26', price: 4599, discount: 0, l7d: 47, stock: { RU: 42, KZ: 9, GCC: 8, WW: 17 }, newness: 92, tone: 'cream' },
  { id: 'P-104', name: 'Джинсы прямые', kind: 'jeans', category: 'Одежда', collection: 'S26', price: 7999, discount: 0, l7d: 63, stock: { RU: 31, KZ: 8, GCC: 6, WW: 11 }, newness: 81, tone: 'denim' },
  { id: 'P-105', name: 'Сумка shoulder', kind: 'bag', category: 'Сумки', collection: 'S26', price: 9999, discount: 0, l7d: 72, stock: { RU: 16, KZ: 3, GCC: 7, WW: 6 }, newness: 90, tone: 'black' },
  { id: 'P-106', name: 'Босоножки', kind: 'shoes', category: 'Обувь', collection: 'S26', price: 8499, discount: 15, l7d: 41, stock: { RU: 11, KZ: 0, GCC: 4, WW: 5 }, newness: 76, tone: 'black' },
  { id: 'P-107', name: 'Юбка миди', kind: 'skirt', category: 'Одежда', collection: 'S26', price: 6999, discount: 0, l7d: 33, stock: { RU: 26, KZ: 6, GCC: 3, WW: 9 }, newness: 84, tone: 'stone' },
  { id: 'P-108', name: 'Кардиган ажурный', kind: 'knit', category: 'Одежда', collection: 'S26', price: 10999, discount: 0, l7d: 28, stock: { RU: 12, KZ: 2, GCC: 2, WW: 4 }, newness: 74, tone: 'cream' },
  { id: 'P-109', name: 'Туфли slingback', kind: 'shoes', category: 'Обувь', collection: 'S26', price: 9499, discount: 0, l7d: 35, stock: { RU: 0, KZ: 0, GCC: 1, WW: 0 }, newness: 69, tone: 'sand' },
  { id: 'P-110', name: 'Жакет приталенный', kind: 'jacket', category: 'Одежда', collection: 'S25', price: 11999, discount: 25, l7d: 21, stock: { RU: 14, KZ: 4, GCC: 2, WW: 6 }, newness: 48, tone: 'olive' },
  { id: 'P-111', name: 'Брюки палаццо', kind: 'pants', category: 'Одежда', collection: 'S25', price: 7599, discount: 20, l7d: 31, stock: { RU: 18, KZ: 4, GCC: 3, WW: 7 }, newness: 52, tone: 'stone' },
  { id: 'P-112', name: 'Сумка mini', kind: 'bag', category: 'Сумки', collection: 'S25', price: 7999, discount: 30, l7d: 18, stock: { RU: 9, KZ: 2, GCC: 1, WW: 2 }, newness: 44, tone: 'burgundy' },
  { id: 'P-113', name: 'Платье-комбинация', kind: 'dress', category: 'Одежда', collection: 'S26', price: 9999, discount: 0, l7d: 58, stock: { RU: 24, KZ: 6, GCC: 7, WW: 10 }, newness: 91, tone: 'silver' },
  { id: 'P-114', name: 'Рубашка oversize', kind: 'shirt', category: 'Одежда', collection: 'S26', price: 6599, discount: 0, l7d: 49, stock: { RU: 33, KZ: 8, GCC: 6, WW: 14 }, newness: 86, tone: 'white' },
  { id: 'P-115', name: 'Балетки кожаные', kind: 'shoes', category: 'Обувь', collection: 'S26', price: 8999, discount: 0, l7d: 44, stock: { RU: 20, KZ: 4, GCC: 5, WW: 8 }, newness: 83, tone: 'burgundy' },
  { id: 'P-116', name: 'Тренч укороченный', kind: 'jacket', category: 'Одежда', collection: 'S26', price: 15999, discount: 0, l7d: 26, stock: { RU: 13, KZ: 3, GCC: 4, WW: 5 }, newness: 89, tone: 'sand' },
  { id: 'P-117', name: 'Топ асимметричный', kind: 'top', category: 'Одежда', collection: 'S26', price: 4999, discount: 0, l7d: 37, stock: { RU: 27, KZ: 7, GCC: 5, WW: 9 }, newness: 87, tone: 'black' },
  { id: 'P-118', name: 'Клатч геометричный', kind: 'bag', category: 'Сумки', collection: 'S26', price: 8499, discount: 0, l7d: 29, stock: { RU: 15, KZ: 3, GCC: 4, WW: 5 }, newness: 82, tone: 'cream' },
];

const MEDIA = [
  { id: 'M-01', name: 'Summer motion', type: 'image', tone: 'editorial-a' },
  { id: 'M-02', name: 'City tailoring', type: 'video', tone: 'editorial-b' },
  { id: 'M-03', name: 'Soft utility', type: 'image', tone: 'editorial-c' },
  { id: 'L-01', name: 'Look: Quiet luxury', type: 'look', tone: 'editorial-d' },
];

const SECTION_PRESETS = [
  { type: 'product-grid', name: 'Товарная сетка', icon: LayoutGrid, slots: 6, allowed: ['product'] },
  { type: 'product-row', name: 'Товарный ряд', icon: Package, slots: 4, allowed: ['product'] },
  { type: 'editorial', name: 'Editorial / образ', icon: FileImage, slots: 1, allowed: ['look', 'image', 'video'] },
  { type: 'media-grid', name: 'Медиа-мозаика', icon: ImageIcon, slots: 3, allowed: ['image', 'video', 'look'] },
  { type: 'banner', name: 'Промо-баннер', icon: Sparkles, slots: 1, allowed: ['image'] },
];

const defaultRules = {
  mode: 'hybrid', collection: 'S26', category: 'Все', stockMin: 3, l7dMin: 10, discountMin: 0,
  dedupe: true, oos: 'fallback', emptyBehavior: 'collapse', ttl: 15,
  ranking: { popularity: 40, stock: 25, newness: 20, discount: 10, price: 5 },
};

const INITIAL_SECTIONS = [
  { id: 'S1', title: 'Новинки', type: 'product-grid', slots: 6, allowed: ['product'], rules: { ...defaultRules }, pins: { 1: 'P-105' }, enabled: true, width: 'contained', gap: 'M' },
  { id: 'S2', title: 'Editorial · Summer Motion', type: 'editorial', slots: 1, allowed: ['look', 'image', 'video'], rules: { ...defaultRules, mode: 'manual' }, pins: { 0: 'L-01' }, enabled: true, width: 'full', gap: 'S' },
  { id: 'S3', title: 'Studio selection', type: 'product-row', slots: 4, allowed: ['product'], rules: { ...defaultRules, l7dMin: 20 }, pins: {}, enabled: true, width: 'contained', gap: 'M' },
  { id: 'S4', title: 'Summer essentials', type: 'banner', slots: 1, allowed: ['image'], rules: { ...defaultRules, mode: 'manual' }, pins: { 0: 'M-03' }, enabled: true, width: 'full', gap: 'S' },
  { id: 'S5', title: 'Рекомендуем', type: 'product-grid', slots: 4, allowed: ['product'], rules: { ...defaultRules, category: 'Одежда', stockMin: 2 }, pins: {}, enabled: true, width: 'contained', gap: 'M' },
];

function money(value) { return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`; }

function scoreProduct(product, rules, region) {
  const stock = product.stock[region] ?? 0;
  return (product.l7d / 80) * rules.ranking.popularity + (Math.min(stock, 50) / 50) * rules.ranking.stock +
    (product.newness / 100) * rules.ranking.newness + (product.discount / 50) * rules.ranking.discount +
    (1 - Math.min(product.price, 18000) / 18000) * rules.ranking.price;
}

function eligible(product, rules, region) {
  return (rules.collection === 'Все' || product.collection === rules.collection) &&
    (rules.category === 'Все' || product.category === rules.category) &&
    (product.stock[region] ?? 0) >= Number(rules.stockMin) && product.l7d >= Number(rules.l7dMin) &&
    product.discount >= Number(rules.discountMin);
}

function resolveSection(section, region) {
  const candidates = PRODUCTS.filter((p) => eligible(p, section.rules, region))
    .sort((a, b) => scoreProduct(b, section.rules, region) - scoreProduct(a, section.rules, region));
  const used = new Set();
  const slots = Array.from({ length: section.slots }, (_, index) => {
    const pin = section.pins[index];
    if (pin) {
      const media = MEDIA.find((m) => m.id === pin);
      if (media) return { index, status: 'pin', entity: media, contentType: media.type, score: null };
      const pinnedProduct = PRODUCTS.find((p) => p.id === pin);
      if (pinnedProduct) {
        const available = (pinnedProduct.stock[region] ?? 0) >= Number(section.rules.stockMin);
        if (available || section.rules.oos === 'keep') {
          used.add(pinnedProduct.id);
          return { index, status: 'pin', entity: pinnedProduct, contentType: 'product', score: scoreProduct(pinnedProduct, section.rules, region), warning: available ? null : 'OOS' };
        }
        if (section.rules.oos === 'collapse') return { index, status: 'collapsed', entity: null, contentType: 'product', score: null, warning: 'OOS → collapse' };
      }
    }
    if (!section.allowed.includes('product') || section.rules.mode === 'manual') return { index, status: 'empty', entity: null, contentType: section.allowed[0], score: null };
    const next = candidates.find((p) => !section.rules.dedupe || !used.has(p.id));
    if (!next) return { index, status: section.rules.emptyBehavior === 'collapse' ? 'collapsed' : 'empty', entity: null, contentType: 'product', score: null };
    used.add(next.id);
    return { index, status: 'auto', entity: next, contentType: 'product', score: scoreProduct(next, section.rules, region) };
  });
  return { ...section, candidates, resolvedSlots: slots };
}

function ProductVisual({ product, compact = false }) {
  return <div className={`product-visual tone-${product.tone} kind-${product.kind} ${compact ? 'compact' : ''}`}><div className="garment-shape"><span>{product.category === 'Сумки' ? 'BAG' : product.category === 'Обувь' ? 'SHOE' : 'LIME'}</span></div></div>;
}

function EntityCard({ entity, status, region, compact = false }) {
  const isProduct = entity && 'price' in entity;
  if (!entity) return null;
  if (!isProduct) return <div className={`media-visual ${entity.tone}`}><div className="media-label">{entity.type === 'video' ? <Film size={18} /> : entity.type === 'look' ? <Sparkles size={18} /> : <ImageIcon size={18} />}</div><div className="media-copy"><strong>{entity.name}</strong><span>{entity.type === 'look' ? 'Образ' : entity.type === 'video' ? 'Видео' : 'Изображение'}</span></div></div>;
  return <div className={`entity-card ${compact ? 'compact' : ''}`}><ProductVisual product={entity} compact={compact} /><div className="entity-copy"><strong>{entity.name}</strong>{!compact && <span>{money(entity.price)}</span>}{!compact && <small>Сток {region}: {entity.stock[region]} · L7D {entity.l7d}</small>}</div>{status && <span className={`slot-badge ${status}`}>{status === 'pin' ? 'PIN' : 'AUTO'}</span>}</div>;
}

function DropSlot({ slot, region, onDrop, onDeletePin, large = false }) {
  return <div className={`drop-slot ${!slot.entity ? 'empty' : ''} ${slot.status === 'collapsed' ? 'collapsed' : ''} ${large ? 'large' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}><div className="slot-number">Слот {slot.index + 1}</div>{slot.entity ? <><EntityCard entity={slot.entity} status={slot.status} region={region} />{slot.status === 'pin' && <button className="unpin" onClick={(e) => { e.stopPropagation(); onDeletePin(); }}><X size={13} /></button>}</> : slot.status === 'collapsed' ? <div className="collapsed-state"><RefreshCw size={22} /><strong>Слот схлопнут</strong><span>Нет подходящего кандидата</span></div> : <div className="empty-state"><Plus size={22} /><strong>Перетащите контент</strong><span>или включите AUTO</span></div>}</div>;
}

function SectionCanvas({ section, region, selected, onSelect, onDropEntity, onDeletePin }) {
  const commonDrop = (event, slotIndex) => { event.preventDefault(); const payload = event.dataTransfer.getData('text/plain'); if (payload) onDropEntity(section.id, slotIndex, payload); };
  const content = section.resolvedSlots;
  return <section className={`canvas-section ${selected ? 'selected' : ''} type-${section.type}`} onClick={() => onSelect(section.id)}>
    <div className="section-topline"><div><span className="section-kicker">{section.type.replace('-', ' ')}</span><h3>{section.title}</h3></div><div className="section-meta"><span>{content.filter((s) => s.entity).length}/{section.slots} слотов</span><span>{section.candidates.length} кандидатов</span><MoreHorizontal size={17} /></div></div>
    {section.type === 'editorial' && <div className="editorial-layout"><div className="editorial-copy-block"><span>NEW SEASON</span><h2>ТИХАЯ ФОРМА.<br />ЛЕГКИЙ РИТМ.</h2><p>Editorial-сценарий сохраняет визуальный ритм, а товарные блоки рядом обновляются автоматически.</p><button>Смотреть коллекцию</button></div><DropSlot slot={content[0]} region={region} onDrop={(e) => commonDrop(e, 0)} onDeletePin={() => onDeletePin(section.id, 0)} large /></div>}
    {section.type === 'banner' && <div className="banner-layout" onDragOver={(e) => e.preventDefault()} onDrop={(e) => commonDrop(e, 0)}><div><span>SUMMER ESSENTIALS</span><h2>ЛЕГКОСТЬ. ФОРМА. НАТУРАЛЬНЫЕ ТКАНИ.</h2></div><span className="banner-pin">PIN</span></div>}
    {section.type === 'media-grid' && <div className="media-grid-layout">{content.map((slot) => <DropSlot key={slot.index} slot={slot} region={region} onDrop={(e) => commonDrop(e, slot.index)} onDeletePin={() => onDeletePin(section.id, slot.index)} />)}</div>}
    {(section.type === 'product-grid' || section.type === 'product-row') && <div className={`product-layout ${section.type === 'product-row' ? 'row' : ''}`}>{content.map((slot) => <DropSlot key={slot.index} slot={slot} region={region} onDrop={(e) => commonDrop(e, slot.index)} onDeletePin={() => onDeletePin(section.id, slot.index)} />)}</div>}
    <div className="section-health-row"><span><CheckCircle2 size={14} /> Правила активны</span><span><RefreshCw size={14} /> TTL {section.rules.ttl} мин</span><span><Zap size={14} /> OOS: {section.rules.oos === 'fallback' ? 'следующий кандидат' : section.rules.oos}</span></div>
  </section>;
}

function MetricCard({ title, value, suffix, note, progress, warning }) {
  return <div className={`metric-card ${warning ? 'warning' : ''}`}><div className="metric-title">{title}</div><div className="metric-value"><strong>{value}</strong><span>{suffix}</span></div><div className="progress"><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div><small>{note}</small></div>;
}

export default function App() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [selectedId, setSelectedId] = useState('S1');
  const [device, setDevice] = useState('desktop');
  const [region, setRegion] = useState('RU');
  const [rightTab, setRightTab] = useState('rules');
  const [bottomOpen, setBottomOpen] = useState(true);
  const [showLogic, setShowLogic] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');
  const [dragSection, setDragSection] = useState(null);
  const [toast, setToast] = useState('');
  const resolved = useMemo(() => sections.map((s) => resolveSection(s, region)), [sections, region]);
  const selected = resolved.find((s) => s.id === selectedId) || resolved[0];
  const pageMetrics = useMemo(() => {
    const slots = resolved.filter((s) => s.enabled).flatMap((s) => s.resolvedSlots);
    const productSlots = slots.filter((s) => s.entity && 'price' in s.entity);
    const filled = slots.filter((s) => s.entity).length;
    const uniqueProducts = new Set(productSlots.map((s) => s.entity.id));
    const availableCatalog = PRODUCTS.filter((p) => (p.stock[region] ?? 0) > 0);
    const inStockShown = productSlots.filter((s) => (s.entity.stock[region] ?? 0) > 0).length;
    return { totalSlots: slots.length, filled, fillRate: slots.length ? Math.round(filled / slots.length * 100) : 0, uniqueProducts: uniqueProducts.size, availableCatalog: availableCatalog.length, assortmentCoverage: availableCatalog.length ? Math.round(uniqueProducts.size / availableCatalog.length * 100) : 0, inStockExposure: productSlots.length ? Math.round(inStockShown / productSlots.length * 100) : 100, warnings: slots.filter((s) => s.warning || s.status === 'collapsed').length };
  }, [resolved, region]);
  const updateSection = (id, patch) => setSections((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  const updateRules = (id, patch) => setSections((prev) => prev.map((s) => s.id === id ? { ...s, rules: { ...s.rules, ...patch } } : s));
  const updateRanking = (id, key, value) => setSections((prev) => prev.map((s) => s.id === id ? { ...s, rules: { ...s.rules, ranking: { ...s.rules.ranking, [key]: Number(value) } } : s));
  const pinEntity = (sectionId, slotIndex, entityId) => { setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, pins: { ...s.pins, [slotIndex]: entityId }, rules: { ...s.rules, mode: s.rules.mode === 'auto' ? 'hybrid' : s.rules.mode } } : s)); setToast(`Слот ${slotIndex + 1}: ручное переопределение PIN`); setTimeout(() => setToast(''), 1800); };
  const unpin = (sectionId, slotIndex) => setSections((prev) => prev.map((s) => { if (s.id !== sectionId) return s; const pins = { ...s.pins }; delete pins[slotIndex]; return { ...s, pins }; }));
  const addSection = (preset) => { const id = `S${Date.now()}`; const next = { id, title: preset.name, type: preset.type, slots: preset.slots, allowed: preset.allowed, rules: { ...defaultRules, mode: preset.allowed.includes('product') ? 'hybrid' : 'manual' }, pins: {}, enabled: true, width: preset.type === 'editorial' || preset.type === 'banner' ? 'full' : 'contained', gap: 'M' }; setSections((prev) => [...prev, next]); setSelectedId(id); setShowAdd(false); };
  const duplicateSection = (id) => { const source = sections.find((s) => s.id === id); if (!source) return; const next = { ...source, id: `S${Date.now()}`, title: `${source.title} · копия`, pins: { ...source.pins }, rules: { ...source.rules, ranking: { ...source.rules.ranking } } }; const index = sections.findIndex((s) => s.id === id); const arr = [...sections]; arr.splice(index + 1, 0, next); setSections(arr); setSelectedId(next.id); };
  const removeSection = (id) => { setSections((prev) => prev.filter((s) => s.id !== id)); if (selectedId === id) setSelectedId(sections.find((s) => s.id !== id)?.id); };
  const reorder = (targetId) => { if (!dragSection || dragSection === targetId) return; const from = sections.findIndex((s) => s.id === dragSection); const to = sections.findIndex((s) => s.id === targetId); const arr = [...sections]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved); setSections(arr); setDragSection(null); };
  const libraryProducts = PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()));

  return <div className="app-shell">
    <header className="global-header"><div className="brand-lockup"><div className="lego-mark">LEGO</div><strong>LIME Storefront Builder</strong></div><div className="breadcrumbs"><span>Sites</span><ChevronRight size={14} /><span>LIME</span><ChevronRight size={14} /><b>Главная страница</b></div><div className="global-actions"><Search size={18} /><CircleHelp size={18} /><Menu size={18} /><div className="avatar">KS</div></div></header>
    <div className="toolbar"><div className="toolbar-left"><button className="plain-btn"><Menu size={17} /> Edit <ChevronDown size={14} /></button><button className="icon-btn"><Undo2 size={17} /></button><button className="icon-btn"><Redo2 size={17} /></button></div><div className="device-switch"><button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={18} /></button><button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={18} /></button></div><div className="toolbar-right"><select value={region} onChange={(e) => setRegion(e.target.value)}><option>RU</option><option>KZ</option><option>GCC</option><option>WW</option></select><button className="plain-btn" onClick={() => setShowLogic(true)}><Layers3 size={17} /> Логика</button><button className={`plain-btn ${bottomOpen ? 'active-subtle' : ''}`} onClick={() => setBottomOpen((v) => !v)}><BarChart3 size={17} /> Покрытие</button><button className="plain-btn"><Eye size={17} /> Предпросмотр</button><button className="publish-btn" onClick={() => { setToast('Версия опубликована в staging'); setTimeout(() => setToast(''), 1800); }}>Опубликовать</button></div></div>
    <main className="workspace">
      <aside className="left-panel"><div className="panel-title-row"><div><span>СТРУКТУРА СТРАНИЦЫ</span><strong>Главная</strong></div><button className="icon-btn small"><MoreHorizontal size={16} /></button></div><div className="mini-search"><Search size={15} /><input placeholder="Поиск компонентов" /></div><div className="tree-root"><ChevronDown size={15} /><Monitor size={15} /><strong>Главная страница</strong></div><div className="tree-static"><ChevronRight size={14} /><span>Header</span></div><div className="tree-static"><ChevronRight size={14} /><span>Hero / Баннер</span></div><div className="section-tree">{resolved.map((s) => <div key={s.id} className={`tree-section ${selectedId === s.id ? 'selected' : ''}`} draggable onDragStart={() => setDragSection(s.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(s.id)} onClick={() => setSelectedId(s.id)}><GripVertical size={14} className="grip" /><ChevronRight size={14} /><span className="tree-icon">{s.type === 'editorial' ? <ImageIcon size={14} /> : s.type === 'banner' ? <Sparkles size={14} /> : <LayoutGrid size={14} />}</span><div className="tree-label"><strong>{s.title}</strong><small>{s.resolvedSlots.filter((x) => x.entity).length}/{s.slots} · {s.candidates.length} кандид.</small></div><span className={`mode-pill ${s.rules.mode}`}>{s.rules.mode === 'hybrid' ? 'HYBRID' : s.rules.mode.toUpperCase()}</span></div>)}</div><button className="add-tree-btn" onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить секцию</button><div className="tree-static"><ChevronRight size={14} /><span>Footer</span></div><div className="left-summary"><div className="summary-head"><span>ВИТРИНА</span><b>{pageMetrics.assortmentCoverage}%</b></div><div className="progress"><span style={{ width: `${pageMetrics.assortmentCoverage}%` }} /></div><p>{pageMetrics.uniqueProducts} уникальных товаров показано из {pageMetrics.availableCatalog} доступных в {region}</p></div></aside>
      <section className="canvas-area"><div className={`storefront ${device}`}><div className="store-header"><div className="lime-logo">LIME</div><nav><span>НОВИНКИ</span><span>ОДЕЖДА</span><span>ОБУВЬ</span><span>СУМКИ</span><span>АКСЕССУАРЫ</span><span>SALE</span></nav><div><Search size={18} /><Heart size={18} /><ShoppingBag size={18} /></div></div>{resolved.filter((s) => s.enabled).map((s) => <SectionCanvas key={s.id} section={s} region={region} selected={selectedId === s.id} onSelect={setSelectedId} onDropEntity={pinEntity} onDeletePin={unpin} />)}<button className="canvas-add" onClick={() => setShowAdd(true)}><Plus size={18} /> Добавить секцию</button></div></section>
      <aside className="right-panel"><div className="right-head"><div><span>СЕКЦИЯ</span><strong>{selected?.title}</strong></div><div className="right-head-actions"><button onClick={() => duplicateSection(selected.id)}><Copy size={15} /></button><button onClick={() => removeSection(selected.id)}><Trash2 size={15} /></button></div></div><div className="tabbar"><button className={rightTab === 'rules' ? 'active' : ''} onClick={() => setRightTab('rules')}>Правила</button><button className={rightTab === 'content' ? 'active' : ''} onClick={() => setRightTab('content')}>Контент</button><button className={rightTab === 'layout' ? 'active' : ''} onClick={() => setRightTab('layout')}>Секция</button></div>
        {rightTab === 'rules' && selected && <div className="right-scroll"><div className="settings-block"><label>Режим наполнения</label><div className="segmented three">{['auto', 'hybrid', 'manual'].map((mode) => <button key={mode} className={selected.rules.mode === mode ? 'active' : ''} onClick={() => updateRules(selected.id, { mode })}>{mode === 'auto' ? 'AUTO' : mode === 'hybrid' ? 'HYBRID' : 'MANUAL'}</button>)}</div><p className="hint">HYBRID = AUTO по правилам + ручные PIN/override в отдельных слотах.</p></div>{selected.allowed.includes('product') && <><div className="settings-block"><div className="block-title"><Wand2 size={16} /><strong>Базовые правила товаров</strong></div><div className="form-grid"><label>Коллекция<select value={selected.rules.collection} onChange={(e) => updateRules(selected.id, { collection: e.target.value })}><option>S26</option><option>S25</option><option>Все</option></select></label><label>Категория<select value={selected.rules.category} onChange={(e) => updateRules(selected.id, { category: e.target.value })}><option>Все</option><option>Одежда</option><option>Обувь</option><option>Сумки</option></select></label><label>Сток ≥<input type="number" value={selected.rules.stockMin} onChange={(e) => updateRules(selected.id, { stockMin: e.target.value })} /></label><label>L7D ≥<input type="number" value={selected.rules.l7dMin} onChange={(e) => updateRules(selected.id, { l7dMin: e.target.value })} /></label><label>Скидка ≥ %<input type="number" value={selected.rules.discountMin} onChange={(e) => updateRules(selected.id, { discountMin: e.target.value })} /></label><label>TTL, мин<input type="number" value={selected.rules.ttl} onChange={(e) => updateRules(selected.id, { ttl: e.target.value })} /></label></div><div className="toggle-row"><span><strong>Дедупликация</strong><small>Не повторять товар внутри секции</small></span><button className={`toggle ${selected.rules.dedupe ? 'on' : ''}`} onClick={() => updateRules(selected.id, { dedupe: !selected.rules.dedupe })}><span /></button></div></div><div className="settings-block"><div className="block-title"><SlidersHorizontal size={16} /><strong>Ранжирование</strong><span className="score-chip">Σ {Object.values(selected.rules.ranking).reduce((a, b) => a + b, 0)}</span></div>{[['popularity', 'Популярность L7D'], ['stock', 'Сток онлайн'], ['newness', 'Новизна'], ['discount', 'Скидка'], ['price', 'Цена']].map(([key, label]) => <div className="range-row" key={key}><span>{label}</span><input type="range" min="0" max="60" value={selected.rules.ranking[key]} onChange={(e) => updateRanking(selected.id, key, e.target.value)} /><b>{selected.rules.ranking[key]}</b></div>)}</div></>}<div className="settings-block"><div className="block-title"><RefreshCw size={16} /><strong>OOS / fallback</strong></div><label>Если PIN/AUTO товар недоступен<select value={selected.rules.oos} onChange={(e) => updateRules(selected.id, { oos: e.target.value })}><option value="fallback">Следующий AUTO-кандидат</option><option value="collapse">Схлопнуть слот</option><option value="keep">Оставить OOS (warning)</option></select></label><label>Если кандидатов не осталось<select value={selected.rules.emptyBehavior} onChange={(e) => updateRules(selected.id, { emptyBehavior: e.target.value })}><option value="collapse">Схлопнуть слот</option><option value="keep">Оставить пустой слот</option></select></label><div className="flow-mini"><span>TTL</span><ChevronRight size={13}/><span>availability</span><ChevronRight size={13}/><span>ranking</span><ChevronRight size={13}/><span>fallback</span></div></div><div className="candidate-box"><div><strong>{selected.candidates.length}</strong><span>подходящих кандидатов</span></div><div><strong>{selected.resolvedSlots.filter((s) => s.entity).length}/{selected.slots}</strong><span>слотов заполнено</span></div></div></div>}
        {rightTab === 'content' && selected && <div className="right-scroll content-library"><div className="library-note"><Pin size={15} /><span>Перетащите сущность в слот — она станет <b>PIN</b> и переопределит AUTO.</span></div><div className="mini-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Товар / ID" /></div><div className="content-tabs"><button className="active">Товары</button><button>Образы</button><button>Медиа</button></div><div className="library-list">{libraryProducts.map((p) => <div className="library-card" key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}><ProductVisual product={p} compact /><div><strong>{p.name}</strong><span>{p.id} · {money(p.price)}</span><small className={(p.stock[region] ?? 0) < 3 ? 'bad' : ''}>Сток {region}: {p.stock[region]} · L7D {p.l7d}</small></div><GripVertical size={15} /></div>)}<div className="media-library-title">Медиа / образы</div>{MEDIA.map((m) => <div className="library-card media" key={m.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', m.id)}><div className={`media-thumb ${m.tone}`}>{m.type === 'video' ? <Film size={18}/> : <ImageIcon size={18}/>}</div><div><strong>{m.name}</strong><span>{m.id} · {m.type}</span></div><GripVertical size={15} /></div>)}</div></div>}
        {rightTab === 'layout' && selected && <div className="right-scroll"><div className="settings-block"><div className="block-title"><LayoutGrid size={16}/><strong>Секция → контейнер → слоты</strong></div><label>Ширина<select value={selected.width} onChange={(e) => updateSection(selected.id, { width: e.target.value })}><option value="contained">Inset / contained</option><option value="full">Full width</option></select></label><label>Количество слотов<input type="number" min="1" max="12" value={selected.slots} onChange={(e) => updateSection(selected.id, { slots: Math.max(1, Math.min(12, Number(e.target.value))) })} /></label><label>Gap<select value={selected.gap} onChange={(e) => updateSection(selected.id, { gap: e.target.value })}><option>XS</option><option>S</option><option>M</option><option>L</option></select></label><label>Разрешенный контент<div className="chips">{selected.allowed.map((x) => <span key={x}>{x}</span>)}</div></label></div><div className="settings-block"><div className="block-title"><Settings size={16}/><strong>Политики</strong></div><div className="policy-row"><Check size={14}/><span>Desktop / Mobile visibility</span></div><div className="policy-row"><Check size={14}/><span>Tokenized spacing & background</span></div><div className="policy-row"><Check size={14}/><span>Allowed content types</span></div><div className="policy-row"><Check size={14}/><span>Region availability</span></div></div><div className="settings-block"><div className="block-title"><Globe2 size={16}/><strong>Региональная модель</strong></div><p className="hint">Глобальная структура наследуется регионом; остатки, цены и локальные PIN могут переопределяться локально.</p><div className="region-flow"><span>GLOBAL</span><ChevronRight size={14}/><span>{region}</span><ChevronRight size={14}/><span>STOREFRONT</span></div></div></div>}
      </aside>
    </main>
    {bottomOpen && <div className="bottom-panel"><div className="bottom-topline"><div><PanelBottom size={18}/><strong>ПОКРЫТИЕ ВИТРИНЫ</strong><span>обновлено сейчас · регион {region}</span></div><button onClick={() => setBottomOpen(false)}><X size={17}/></button></div><div className="metric-grid"><MetricCard title="Заполнение блоков" value={`${pageMetrics.filled}/${pageMetrics.totalSlots}`} suffix={`${pageMetrics.fillRate}%`} note="заполненных слотов" progress={pageMetrics.fillRate} /><MetricCard title="Покрытие ассортиментом" value={`${pageMetrics.uniqueProducts}/${pageMetrics.availableCatalog}`} suffix={`${pageMetrics.assortmentCoverage}%`} note="уникальных товаров на витрине" progress={pageMetrics.assortmentCoverage} /><MetricCard title="In-stock exposure" value={`${pageMetrics.inStockExposure}%`} suffix={pageMetrics.inStockExposure >= 95 ? 'OK' : 'CHECK'} note="показываемых товарных слотов в наличии" progress={pageMetrics.inStockExposure} /><MetricCard title="Проблемные позиции" value={pageMetrics.warnings} suffix={pageMetrics.warnings ? 'warning' : 'clean'} note="OOS / collapsed / empty" progress={pageMetrics.warnings ? 55 : 100} warning={pageMetrics.warnings > 0} /></div><div className="coverage-sections">{resolved.map((s) => { const filled = s.resolvedSlots.filter((x) => x.entity).length; const pct = Math.round(filled / s.slots * 100); return <div className="coverage-row" key={s.id}><span>{s.title}</span><div className="coverage-bar"><i style={{ width: `${pct}%` }} /></div><b>{filled}/{s.slots}</b><small>{s.candidates.length} кандид.</small></div>; })}</div></div>}
    {showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="add-modal" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><span>КОНСТРУКТОР</span><h2>Добавить секцию</h2></div><button onClick={() => setShowAdd(false)}><X size={18}/></button></div><p>Системный тайп задает геометрию и разрешенные типы контента. После добавления можно настроить правила и PIN.</p><div className="preset-grid">{SECTION_PRESETS.map((p) => { const Icon = p.icon; return <button key={p.type} className="preset-card" onClick={() => addSection(p)}><Icon size={24}/><strong>{p.name}</strong><span>{p.slots} слотов</span><small>{p.allowed.join(' · ')}</small></button>; })}</div></div></div>}
    {showLogic && <div className="modal-backdrop" onClick={() => setShowLogic(false)}><div className="logic-modal" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><span>LEGO · ГИБРИДНЫЙ ПОДХОД</span><h2>Как собирается витрина</h2></div><button onClick={() => setShowLogic(false)}><X size={18}/></button></div><div className="logic-layers"><div className="logic-layer"><Layers3 size={24}/><strong>1. Секция / тайп</strong><span>Геометрия, контейнер, колонки, разрешенный контент, токены и политики.</span></div><ChevronRight size={24}/><div className="logic-layer"><LayoutGrid size={24}/><strong>2. Слот</strong><span>AUTO по правилам или ручной PIN / override от мерчендайзера.</span></div><ChevronRight size={24}/><div className="logic-layer"><Package size={24}/><strong>3. Сущность</strong><span>Товар / цветомодель, образ, изображение или видео.</span></div></div><div className="logic-pipeline"><div><RefreshCw/><strong>TTL-проверка</strong><span>по расписанию</span></div><ChevronRight/><div><Database/><strong>Availability</strong><span>региональный сток</span></div><ChevronRight/><div><SlidersHorizontal/><strong>Ranking</strong><span>L7D · stock · new · discount · price</span></div><ChevronRight/><div><Wand2/><strong>Fallback</strong><span>следующий кандидат</span></div><ChevronRight/><div><CheckCircle2/><strong>Storefront</strong><span>без пустых слотов</span></div></div><div className="logic-note"><AlertTriangle size={18}/><span><b>Почему не full-auto:</b> editorial-ритм и кампании остаются под контролем мерчендайзера, рутинные решения автоматизируются.</span></div><div className="logic-footer"><span>GLOBAL SHOWROOM</span><ChevronRight size={15}/><span>RU / KZ / GCC / WW</span><ChevronRight size={15}/><span>LOCAL STOCK + OVERRIDE</span></div></div></div>}
    {toast && <div className="toast"><CheckCircle2 size={16}/>{toast}</div>}
  </div>;
}
