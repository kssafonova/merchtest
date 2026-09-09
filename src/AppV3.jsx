import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  Film,
  GripVertical,
  Heart,
  Image as ImageIcon,
  Layers3,
  LayoutGrid,
  Menu,
  Monitor,
  MoreHorizontal,
  Pin,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trash2,
  Undo2,
  Redo2,
  X,
} from 'lucide-react';
import './type-builder.css';
import './appv3.css';

const PRODUCTS = [
  { id: 'P-101', name: 'Пиджак из льна', category: 'Одежда', price: 12999, l7d: 38, collection: 'S26', stock: { RU: 28, KZ: 7, GCC: 5, WW: 12 }, tone: 'sand' },
  { id: 'P-102', name: 'Платье миди', category: 'Одежда', price: 8999, l7d: 54, collection: 'S26', stock: { RU: 19, KZ: 5, GCC: 0, WW: 8 }, tone: 'black' },
  { id: 'P-103', name: 'Топ в рубчик', category: 'Одежда', price: 4599, l7d: 47, collection: 'S26', stock: { RU: 42, KZ: 9, GCC: 8, WW: 17 }, tone: 'cream' },
  { id: 'P-104', name: 'Джинсы прямые', category: 'Одежда', price: 7999, l7d: 63, collection: 'S26', stock: { RU: 31, KZ: 8, GCC: 6, WW: 11 }, tone: 'denim' },
  { id: 'P-105', name: 'Сумка shoulder', category: 'Сумки', price: 9999, l7d: 72, collection: 'S26', stock: { RU: 16, KZ: 3, GCC: 7, WW: 6 }, tone: 'black' },
  { id: 'P-106', name: 'Босоножки', category: 'Обувь', price: 8499, l7d: 41, collection: 'S26', stock: { RU: 11, KZ: 0, GCC: 4, WW: 5 }, tone: 'black' },
  { id: 'P-107', name: 'Юбка миди', category: 'Одежда', price: 6999, l7d: 33, collection: 'S26', stock: { RU: 26, KZ: 6, GCC: 3, WW: 9 }, tone: 'stone' },
  { id: 'P-108', name: 'Кардиган ажурный', category: 'Одежда', price: 10999, l7d: 28, collection: 'S26', stock: { RU: 12, KZ: 2, GCC: 2, WW: 4 }, tone: 'cream' },
  { id: 'P-109', name: 'Туфли slingback', category: 'Обувь', price: 9499, l7d: 35, collection: 'S26', stock: { RU: 0, KZ: 0, GCC: 1, WW: 0 }, tone: 'sand' },
];

const CONTENT = [
  { id: 'L-01', kind: 'look', name: 'Look · Quiet Luxury', tone: 'editorial-a' },
  { id: 'L-02', kind: 'look', name: 'Look · Soft Tailoring', tone: 'editorial-b' },
  { id: 'M-01', kind: 'image', name: 'Summer Campaign 01', tone: 'editorial-c' },
  { id: 'M-02', kind: 'video', name: 'City Motion', tone: 'editorial-d' },
  { id: 'M-03', kind: 'image', name: 'Natural Textures', tone: 'editorial-e' },
  { id: 'M-04', kind: 'svg', name: 'Summer Essentials SVG', tone: 'editorial-f' },
];

const TYPE_LIBRARY = [
  { id: 'TYPE-1', name: 'TYPE-1', system: true, category: 'Товары', description: 'Один акцентный слот', containers: [{ cols: 12, slots: [{ span: 12 }] }] },
  { id: 'TYPE-2', name: 'TYPE-2', system: true, category: 'Товары', description: 'Два равных слота', containers: [{ cols: 12, slots: [{ span: 6 }, { span: 6 }] }] },
  { id: 'TYPE-3', name: 'TYPE-3', system: true, category: 'Товары', description: 'Три равных слота', containers: [{ cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }] },
  { id: 'TYPE-4', name: 'TYPE-4', system: true, category: 'Креативные', description: 'Крупный слот + два компактных', containers: [{ cols: 12, slots: [{ span: 8, rows: 2 }, { span: 4 }, { span: 4 }] }] },
  { id: 'TYPE-5', name: 'TYPE-5', system: true, category: 'Главная', description: 'Комбинированный горизонтальный тайп', containers: [{ cols: 12, slots: [{ span: 6 }, { span: 3 }, { span: 3 }] }] },
  { id: 'TYPE-13', name: 'TYPE-13', system: true, category: 'Эдиториал', description: 'Системный тайп: 2 контейнера × 3 ячейки', containers: [{ cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }, { cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }] },
  { id: 'TYPE-13+1', name: 'TYPE-13+1', system: false, category: 'Эдиториал', description: 'Кастомная структура: 4 + 3 ячейки', containers: [{ cols: 12, slots: [{ span: 3 }, { span: 3 }, { span: 3 }, { span: 3 }] }, { cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }] },
  { id: 'PROMO-BLOCK', name: 'Промо-блок', system: false, category: 'Креативные', description: 'Кастомный промо-тайп', containers: [{ cols: 12, slots: [{ span: 3 }, { span: 3 }, { span: 3 }, { span: 3 }] }] },
];

const CONTENT_LABELS = { product: 'Товары / ЦМ', look: 'Образы', image: 'Изображения', video: 'Видео', svg: 'SVG' };
const DEFAULT_RULES = { mode: 'manual', collection: 'S26', stockMin: 3, l7dMin: 10, dedupe: true, oos: 'fallback', emptyBehavior: 'keep', ttl: 15 };
const ALL_CONTENT = ['product', 'look', 'image', 'video', 'svg'];

const SITE_TREE = [
  { id: 'home', ru: 'Главная страница', en: 'Home', page: true },
  { id: 'catalog', ru: 'Каталог', en: 'Catalog', children: [
    { id: 'new', ru: 'Новинки', en: 'New in', page: true },
    { id: 'women', ru: 'Женщинам', en: 'Women', children: [
      { id: 'women-clothes', ru: 'Одежда', en: 'Clothing', page: true },
      { id: 'women-shoes', ru: 'Обувь', en: 'Shoes', page: true },
      { id: 'women-bags', ru: 'Сумки', en: 'Bags', page: true },
      { id: 'women-accessories', ru: 'Аксессуары', en: 'Accessories', page: true },
    ]},
    { id: 'men', ru: 'Мужчинам', en: 'Men', children: [
      { id: 'men-clothes', ru: 'Одежда', en: 'Clothing', page: true },
      { id: 'men-shoes', ru: 'Обувь', en: 'Shoes', page: true },
      { id: 'men-accessories', ru: 'Аксессуары', en: 'Accessories', page: true },
    ]},
    { id: 'kids', ru: 'Детям', en: 'Kids', children: [
      { id: 'girls', ru: 'Девочкам', en: 'Girls', page: true },
      { id: 'boys', ru: 'Мальчикам', en: 'Boys', page: true },
    ]},
    { id: 'sale', ru: 'Распродажа', en: 'Sale', page: true },
  ]},
  { id: 'editorial', ru: 'Editorial', en: 'Editorial', children: [
    { id: 'collections', ru: 'Коллекции', en: 'Collections', page: true },
    { id: 'capsules', ru: 'Капсулы', en: 'Capsules', page: true },
    { id: 'gallery', ru: 'Медиа / Gallery', en: 'Media / Gallery', page: true },
  ]},
  { id: 'service', ru: 'Сервисные страницы', en: 'Service pages', children: [
    { id: 'delivery', ru: 'Доставка и оплата', en: 'Delivery & payment', page: true },
    { id: 'stores', ru: 'Магазины', en: 'Stores', page: true },
    { id: 'contacts', ru: 'Контакты', en: 'Contacts', page: true },
  ]},
];

const slotCount = (type) => type.containers.reduce((sum, c) => sum + c.slots.length, 0);
const money = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const emptyPins = () => ({});

function initialSection(typeId, titleRu, titleEn, pins = {}, mode = 'manual') {
  const type = TYPE_LIBRARY.find((t) => t.id === typeId);
  return { id: `S-${typeId}-${Math.random().toString(36).slice(2, 8)}`, titleRu, titleEn, typeId, template: type, pins, rules: { ...DEFAULT_RULES, mode }, enabled: true };
}

const INITIAL_SECTIONS = [
  initialSection('TYPE-3', 'Новинки', 'New in', { 0: 'P-101', 1: 'P-103', 2: 'P-105' }, 'hybrid'),
  initialSection('TYPE-13', 'Editorial · Лето', 'Editorial · Summer', { 0: 'L-01', 1: 'P-102', 2: 'M-01', 3: 'P-104', 4: 'M-02', 5: 'P-106' }, 'manual'),
];

function findPage(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findPage(node.children, id);
      if (found) return found;
    }
  }
  return SITE_TREE[0];
}

function entityKind(id) {
  if (id?.startsWith('P-')) return 'product';
  return CONTENT.find((x) => x.id === id)?.kind;
}

function getEntity(id) {
  return PRODUCTS.find((p) => p.id === id) || CONTENT.find((m) => m.id === id) || null;
}

function resolveSection(section, region) {
  const used = new Set();
  const eligible = PRODUCTS.filter((p) =>
    (section.rules.collection === 'Все' || p.collection === section.rules.collection) &&
    (p.stock[region] ?? 0) >= Number(section.rules.stockMin) &&
    p.l7d >= Number(section.rules.l7dMin)
  ).sort((a, b) => (b.l7d + (b.stock[region] ?? 0)) - (a.l7d + (a.stock[region] ?? 0)));

  const slots = Array.from({ length: slotCount(section.template) }, (_, index) => {
    const pinId = section.pins[index];
    if (pinId) {
      const entity = getEntity(pinId);
      if (!entity) return { index, status: 'empty', entity: null };
      if (entityKind(pinId) === 'product') {
        const available = (entity.stock[region] ?? 0) >= Number(section.rules.stockMin);
        if (!available && section.rules.oos === 'collapse') return { index, status: 'collapsed', entity: null, warning: 'OOS → collapse' };
        if (!available && section.rules.oos === 'fallback' && section.rules.mode !== 'manual') {
          const next = eligible.find((p) => !used.has(p.id));
          if (next) { used.add(next.id); return { index, status: 'auto', entity: next }; }
        }
        used.add(entity.id);
        return { index, status: 'pin', entity, warning: available ? null : 'OOS' };
      }
      return { index, status: 'pin', entity };
    }
    if (section.rules.mode === 'manual') return { index, status: 'empty', entity: null };
    const next = eligible.find((p) => !section.rules.dedupe || !used.has(p.id));
    if (!next) return section.rules.emptyBehavior === 'collapse' ? { index, status: 'collapsed', entity: null } : { index, status: 'empty', entity: null };
    used.add(next.id);
    return { index, status: 'auto', entity: next };
  });
  return { ...section, resolvedSlots: slots, candidates: eligible };
}

function TypePreview({ type, compact = false }) {
  let index = 0;
  return <div className={`type-preview ${compact ? 'compact' : ''}`}>
    {type.containers.map((container, ci) => <div className="type-preview-container" key={ci}>
      <div className="type-preview-grid" style={{ gridTemplateColumns: `repeat(${container.cols}, 1fr)` }}>
        {container.slots.map((slot, si) => { index += 1; return <span key={si} style={{ gridColumn: `span ${slot.span}`, gridRow: slot.rows ? `span ${slot.rows}` : undefined }}>{compact ? '' : index}</span>; })}
      </div>
    </div>)}
  </div>;
}

function ProductCard({ product, region, compact = false }) {
  return <div className={`entity-product tone-${product.tone} ${compact ? 'compact' : ''}`}>
    <div className="entity-art"><span>SKU</span></div>
    <div className="entity-info"><strong>{product.name}</strong>{!compact && <span>{money(product.price)}</span>}<small>Сток {region}: {product.stock[region]} · L7D {product.l7d}</small></div>
  </div>;
}

function MediaCard({ entity, compact = false }) {
  const Icon = entity.kind === 'video' ? Film : entity.kind === 'look' ? Sparkles : ImageIcon;
  return <div className={`entity-media ${entity.tone} ${compact ? 'compact' : ''}`}><Icon size={compact ? 18 : 22}/><div><strong>{entity.name}</strong><span>{CONTENT_LABELS[entity.kind]}</span></div></div>;
}

function Slot({ slot, region, onDrop, onUnpin }) {
  return <div className={`lego-slot ${slot.entity ? 'filled' : ''} ${slot.status}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
    <div className="slot-head"><span>Слот {slot.index + 1}</span>{slot.status === 'pin' && <em>PIN</em>}{slot.status === 'auto' && <em className="auto">AUTO</em>}</div>
    {slot.entity ? <>{'price' in slot.entity ? <ProductCard product={slot.entity} region={region}/> : <MediaCard entity={slot.entity}/>} {slot.status === 'pin' && <button className="slot-remove" onClick={(e) => { e.stopPropagation(); onUnpin(); }}><X size={13}/></button>} {slot.warning && <span className="slot-warning"><AlertTriangle size={13}/>{slot.warning}</span>}</>
      : slot.status === 'collapsed' ? <div className="empty-slot-state"><RefreshCw size={19}/><strong>Слот схлопнут</strong><span>Нет кандидата</span></div>
      : <div className="empty-slot-state"><Plus size={20}/><strong>Пустой слот</strong><span>Товар · Образ · Медиа</span></div>}
  </div>;
}

function SectionCanvas({ section, locale, region, selected, onSelect, onPin, onUnpin }) {
  let cursor = 0;
  const onDrop = (event, slotIndex) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (id) onPin(section.id, slotIndex, id); };
  return <section className={`builder-section ${selected ? 'selected' : ''}`} onClick={() => onSelect(section.id)}>
    <div className="section-header-line"><div><span>{section.template.system ? 'SYSTEM TYPE' : 'CUSTOM TYPE'} · {section.typeId}</span><h3>{locale === 'ru' ? section.titleRu : section.titleEn}</h3></div><div className="section-head-meta"><span>{section.resolvedSlots.filter((s) => s.entity).length}/{section.resolvedSlots.length} слотов</span><span className={`mode-badge ${section.rules.mode}`}>{section.rules.mode.toUpperCase()}</span><MoreHorizontal size={17}/></div></div>
    <div className="section-containers">{section.template.containers.map((container, ci) => <div className="section-container" key={ci}><div className="container-label">Контейнер {ci + 1}</div><div className="slot-grid" style={{ gridTemplateColumns: `repeat(${container.cols}, minmax(0,1fr))` }}>{container.slots.map((shape, si) => { const slot = section.resolvedSlots[cursor++]; return <div key={si} style={{ gridColumn: `span ${shape.span}`, gridRow: shape.rows ? `span ${shape.rows}` : undefined }}><Slot slot={slot} region={region} onDrop={(e) => onDrop(e, slot.index)} onUnpin={() => onUnpin(section.id, slot.index)}/></div>; })}</div></div>)}</div>
  </section>;
}

function AddTypeModal({ open, onClose, onAdd }) {
  const [category, setCategory] = useState('Товары');
  const [selectedTypeId, setSelectedTypeId] = useState('TYPE-1');
  const selectedType = TYPE_LIBRARY.find((t) => t.id === selectedTypeId) || TYPE_LIBRARY[0];
  if (!open) return null;
  const categories = ['Товары', 'Креативные', 'Эдиториал', 'Главная'];
  return <div className="modal-backdrop" onClick={onClose}><div className="type-library-modal" onClick={(e) => e.stopPropagation()}>
    <div className="type-modal-head"><div><span>БИБЛИОТЕКА ТАЙПОВ</span><h2>Добавить секцию</h2><p>Тайп задаёт только геометрию секции. Новая секция создаётся с пустыми слотами.</p></div><button onClick={onClose}><X size={19}/></button></div>
    <div className="type-library-body"><aside className="type-categories">{categories.map((c) => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}<ChevronRight size={14}/></button>)}</aside>
      <section className="type-grid-area"><div className="type-grid-title"><strong>{category}</strong><span>System / Custom</span></div><div className="type-card-grid">{TYPE_LIBRARY.filter((t) => t.category === category).map((type) => <button className={`type-card ${selectedTypeId === type.id ? 'selected' : ''}`} key={type.id} onClick={() => setSelectedTypeId(type.id)}><div className="type-card-top"><strong>{type.name}</strong><span>{type.system ? 'SYSTEM' : 'CUSTOM'}</span></div><TypePreview type={type} compact/><p>{type.description}</p><small>{slotCount(type)} слотов · {type.containers.length} контейнер(а)</small></button>)}</div></section>
      <aside className="type-policy-panel"><div className="policy-head"><span>ВЫБРАННЫЙ ТАЙП</span><strong>{selectedType.name}</strong></div><TypePreview type={selectedType}/><div className="type-policy-note"><Plus size={16}/><span>Секция будет добавлена пустой. В любой слот можно перетащить товар, образ, изображение, видео или SVG.</span></div><button className="add-type-primary" onClick={() => onAdd(selectedType)}><Plus size={16}/> Добавить {selectedType.name}</button></aside>
    </div>
  </div></div>;
}

function SiteTree({ nodes, locale, selectedId, onSelect, depth = 0 }) {
  const [expanded, setExpanded] = useState(() => new Set(['catalog', 'women', 'editorial']));
  const toggle = (id) => setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  return <div className="site-tree-level">{nodes.map((node) => {
    const hasChildren = Boolean(node.children?.length);
    const isOpen = expanded.has(node.id);
    return <div className="site-tree-node" key={node.id}>
      <div className={`site-tree-row ${selectedId === node.id ? 'selected' : ''}`} style={{ paddingLeft: 8 + depth * 16 }}>
        <button className="tree-chevron" onClick={() => hasChildren && toggle(node.id)}>{hasChildren ? (isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <span/>}</button>
        <button className="tree-page-label" onClick={() => node.page ? onSelect(node.id) : hasChildren && toggle(node.id)}>{locale === 'ru' ? node.ru : node.en}</button>
        {node.page && <span className="tree-page-status">PUBLIC</span>}
      </div>
      {hasChildren && isOpen && <SiteTree nodes={node.children} locale={locale} selectedId={selectedId} onSelect={onSelect} depth={depth + 1}/>} 
    </div>;
  })}</div>;
}

export default function AppV3() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [selectedId, setSelectedId] = useState(INITIAL_SECTIONS[0].id);
  const [device, setDevice] = useState('desktop');
  const [region, setRegion] = useState('RU');
  const [locale, setLocale] = useState('ru');
  const [pageId, setPageId] = useState('home');
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [rightTab, setRightTab] = useState('content');
  const [contentTab, setContentTab] = useState('product');
  const [showAdd, setShowAdd] = useState(false);
  const [showCoverage, setShowCoverage] = useState(true);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');

  const currentPage = findPage(SITE_TREE, pageId);
  const currentPageName = locale === 'ru' ? currentPage.ru : currentPage.en;
  const resolved = useMemo(() => sections.map((s) => resolveSection(s, region)), [sections, region]);
  const selected = resolved.find((s) => s.id === selectedId) || resolved[0];

  const metrics = useMemo(() => {
    const slots = resolved.flatMap((s) => s.resolvedSlots);
    const filled = slots.filter((s) => s.entity).length;
    const productSlots = slots.filter((s) => s.entity && 'price' in s.entity);
    const unique = new Set(productSlots.map((s) => s.entity.id));
    const available = PRODUCTS.filter((p) => (p.stock[region] ?? 0) > 0).length;
    return { total: slots.length, filled, fill: slots.length ? Math.round(filled / slots.length * 100) : 0, unique: unique.size, available, coverage: available ? Math.round(unique.size / available * 100) : 0, oos: productSlots.filter((s) => (s.entity.stock[region] ?? 0) <= 0).length };
  }, [resolved, region]);

  const updateSection = (id, updater) => setSections((prev) => prev.map((s) => s.id === id ? updater(s) : s));
  const addType = (type) => { const next = initialSection(type.id, `Новая секция · ${type.id}`, `New section · ${type.id}`, emptyPins(), 'manual'); setSections((prev) => [...prev, next]); setSelectedId(next.id); setRightTab('content'); setShowAdd(false); setToast(`${type.id} добавлен: ${slotCount(type)} пустых слотов`); setTimeout(() => setToast(''), 1800); };
  const pinEntity = (sectionId, slotIndex, entityId) => { const kind = entityKind(entityId); if (!kind || !ALL_CONTENT.includes(kind)) return; updateSection(sectionId, (s) => ({ ...s, pins: { ...s.pins, [slotIndex]: entityId } })); setToast(`Слот ${slotIndex + 1}: ${CONTENT_LABELS[kind]} закреплён`); setTimeout(() => setToast(''), 1600); };
  const unpin = (sectionId, slotIndex) => updateSection(sectionId, (s) => { const pins = { ...s.pins }; delete pins[slotIndex]; return { ...s, pins }; });
  const removeSection = (id) => { setSections((prev) => prev.filter((s) => s.id !== id)); const next = sections.find((s) => s.id !== id); if (next) setSelectedId(next.id); };
  const duplicate = (id) => { const source = sections.find((s) => s.id === id); if (!source) return; const copy = { ...source, id: `${source.id}-copy-${Date.now()}`, titleRu: `${source.titleRu} · копия`, titleEn: `${source.titleEn} · copy`, pins: { ...source.pins }, rules: { ...source.rules } }; setSections((prev) => [...prev, copy]); setSelectedId(copy.id); };

  const visibleLibrary = useMemo(() => {
    if (!selected) return [];
    if (contentTab === 'product') return PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()));
    if (contentTab === 'look') return CONTENT.filter((x) => x.kind === 'look');
    return CONTENT.filter((x) => ['image', 'video', 'svg'].includes(x.kind));
  }, [selected, contentTab, query]);

  const nav = locale === 'ru' ? ['НОВИНКИ', 'ОДЕЖДА', 'ОБУВЬ', 'СУМКИ', 'АКСЕССУАРЫ', 'SALE'] : ['NEW IN', 'CLOTHING', 'SHOES', 'BAGS', 'ACCESSORIES', 'SALE'];

  return <div className="lego-app">
    <header className="app-topbar"><div className="top-brand"><span>LEGO</span><b>Storefront Builder</b></div><div className="crumbs">Sites <ChevronRight size={14}/> <strong>{currentPageName}</strong></div><div className="top-icons"><Search size={17}/><Menu size={17}/><div className="avatar">KS</div></div></header>

    <div className="builder-toolbar">
      <div className="toolbar-group edit-toolbar-anchor">
        <button className={showEditMenu ? 'active' : ''} onClick={() => setShowEditMenu((v) => !v)}><Menu size={16}/> Edit <ChevronDown size={14}/></button>
        <button><Undo2 size={16}/></button><button><Redo2 size={16}/></button>
        {showEditMenu && <div className="edit-navigation-popover">
          <div className="edit-popover-head"><div><span>СТРУКТУРА САЙТА</span><strong>{currentPageName}</strong></div><button onClick={() => setShowEditMenu(false)}><X size={16}/></button></div>
          <div className="edit-context-row"><div><span>Регион</span><div className="mini-segment">{['RU','KZ','GCC','WW'].map((r) => <button key={r} className={region === r ? 'active' : ''} onClick={() => setRegion(r)}>{r}</button>)}</div></div><div><span>Язык</span><div className="mini-segment"><button className={locale === 'ru' ? 'active' : ''} onClick={() => setLocale('ru')}>RU</button><button className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')}>EN</button></div></div></div>
          <div className="edit-tree-search"><Search size={14}/><input placeholder={locale === 'ru' ? 'Поиск страницы / категории' : 'Search page / category'}/></div>
          <div className="edit-tree-scroll"><SiteTree nodes={SITE_TREE} locale={locale} selectedId={pageId} onSelect={(id) => { setPageId(id); setShowEditMenu(false); }}/></div>
        </div>}
      </div>
      <div className="device-group"><button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={18}/></button><button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={18}/></button></div>
      <div className="toolbar-group right"><span className="context-badge">{region}</span><div className="language-switch"><button className={locale === 'ru' ? 'active' : ''} onClick={() => setLocale('ru')}>RU</button><button className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')}>EN</button></div><button onClick={() => setShowCoverage((v) => !v)}><BarChart3 size={16}/> {locale === 'ru' ? 'Покрытие' : 'Coverage'}</button><button><Eye size={16}/> {locale === 'ru' ? 'Предпросмотр' : 'Preview'}</button><button className="primary">{locale === 'ru' ? 'Опубликовать' : 'Publish'}</button></div>
    </div>

    <main className="builder-workspace">
      <aside className="structure-panel"><div className="panel-heading"><span>{locale === 'ru' ? 'СТРУКТУРА СТРАНИЦЫ' : 'PAGE STRUCTURE'}</span><strong>{currentPageName}</strong></div><div className="panel-search"><Search size={15}/><input placeholder={locale === 'ru' ? 'Поиск компонентов' : 'Search components'}/></div><div className="tree-root"><ChevronDown size={14}/><Monitor size={15}/><strong>{currentPageName}</strong></div><div className="tree-static"><ChevronRight size={14}/>Header</div><div className="tree-static"><ChevronRight size={14}/>Hero / Banner</div><div className="section-tree">{resolved.map((s) => <button key={s.id} className={`tree-type ${selectedId === s.id ? 'selected' : ''}`} onClick={() => setSelectedId(s.id)}><GripVertical size={13}/><LayoutGrid size={14}/><div><strong>{locale === 'ru' ? s.titleRu : s.titleEn}</strong><small>{s.typeId} · {s.resolvedSlots.filter((x) => x.entity).length}/{s.resolvedSlots.length}</small></div><span>{s.rules.mode.toUpperCase()}</span></button>)}</div><button className="add-section-button" onClick={() => setShowAdd(true)}><Plus size={16}/>{locale === 'ru' ? 'Добавить секцию' : 'Add section'}</button><div className="tree-static"><ChevronRight size={14}/>Footer</div><div className="mini-coverage"><span>{locale === 'ru' ? 'ПОКРЫТИЕ АССОРТИМЕНТА' : 'ASSORTMENT COVERAGE'}</span><strong>{metrics.coverage}%</strong><div><i style={{ width: `${metrics.coverage}%` }}/></div><small>{locale === 'ru' ? `${metrics.unique} из ${metrics.available} доступных товаров показано` : `${metrics.unique} of ${metrics.available} available products shown`}</small></div></aside>

      <section className="canvas-shell"><div className={`storefront-frame ${device}`}><div className="site-store-header"><nav>{nav.map((item) => <span key={item}>{item}</span>)}</nav><div><Search size={17}/><Heart size={17}/><ShoppingBag size={17}/></div></div><div className="page-context-strip"><span>{currentPageName}</span><b>{region}</b><b>{locale.toUpperCase()}</b></div><div className="canvas-note"><Layers3 size={15}/><span>{locale === 'ru' ? 'Секция = тайп. Геометрия задаётся шаблоном; любой слот может содержать товар, образ или медиа.' : 'Section = type. Geometry is defined by the template; any slot can contain a product, look or media.'}</span></div>{resolved.map((section) => <SectionCanvas key={section.id} section={section} locale={locale} region={region} selected={selectedId === section.id} onSelect={setSelectedId} onPin={pinEntity} onUnpin={unpin}/>)}<button className="canvas-add-section" onClick={() => setShowAdd(true)}><Plus size={17}/>{locale === 'ru' ? 'Добавить секцию / тайп' : 'Add section / type'}</button></div></section>

      <aside className="settings-panel">{selected ? <><div className="settings-head"><div><span>{locale === 'ru' ? 'СЕКЦИЯ / ТАЙП' : 'SECTION / TYPE'}</span><strong>{locale === 'ru' ? selected.titleRu : selected.titleEn}</strong><small>{selected.typeId} · {selected.template.system ? 'System' : 'Custom'}</small></div><div><button onClick={() => duplicate(selected.id)}><Copy size={15}/></button><button onClick={() => removeSection(selected.id)}><Trash2 size={15}/></button></div></div><div className="settings-tabs"><button className={rightTab === 'content' ? 'active' : ''} onClick={() => setRightTab('content')}>{locale === 'ru' ? 'Контент' : 'Content'}</button><button className={rightTab === 'rules' ? 'active' : ''} onClick={() => setRightTab('rules')}>{locale === 'ru' ? 'Правила' : 'Rules'}</button><button className={rightTab === 'type' ? 'active' : ''} onClick={() => setRightTab('type')}>{locale === 'ru' ? 'Тайп' : 'Type'}</button></div>
        {rightTab === 'content' && <div className="settings-scroll"><div className="info-card"><Pin size={15}/><span>{locale === 'ru' ? 'Перетащите в любой пустой слот товар, образ, изображение, видео или SVG.' : 'Drag a product, look, image, video or SVG into any empty slot.'}</span></div><div className="content-tabs"><button className={contentTab === 'product' ? 'active' : ''} onClick={() => setContentTab('product')}>{locale === 'ru' ? 'Товары' : 'Products'}</button><button className={contentTab === 'look' ? 'active' : ''} onClick={() => setContentTab('look')}>{locale === 'ru' ? 'Образы' : 'Looks'}</button><button className={contentTab === 'media' ? 'active' : ''} onClick={() => setContentTab('media')}>{locale === 'ru' ? 'Медиа' : 'Media'}</button></div>{contentTab === 'product' && <div className="panel-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={locale === 'ru' ? 'Название / ID' : 'Name / ID'}/></div>}<div className="library-items">{visibleLibrary.map((entity) => <div key={entity.id} className="library-entity" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', entity.id)}>{'price' in entity ? <ProductCard product={entity} region={region} compact/> : <MediaCard entity={entity} compact/>}<GripVertical size={14}/></div>)}</div></div>}
        {rightTab === 'rules' && <div className="settings-scroll"><div className="setting-block"><label>{locale === 'ru' ? 'Режим наполнения' : 'Fill mode'}</label><div className="segmented">{['manual','hybrid','auto'].map((mode) => <button key={mode} className={selected.rules.mode === mode ? 'active' : ''} onClick={() => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, mode } }))}>{mode.toUpperCase()}</button>)}</div><p>{locale === 'ru' ? 'Новый тайп создаётся в MANUAL: все слоты пустые. AUTO/HYBRID автоматически наполняет товарные позиции; любой контент можно закрепить вручную.' : 'A new type starts in MANUAL with empty slots. AUTO/HYBRID can fill product positions; any content can be pinned manually.'}</p></div><div className="setting-block"><label>{locale === 'ru' ? 'Товарные ограничения' : 'Product rules'}</label><div className="form-two"><label>{locale === 'ru' ? 'Коллекция' : 'Collection'}<select value={selected.rules.collection} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, collection: e.target.value } }))}><option>S26</option><option value="Все">{locale === 'ru' ? 'Все' : 'All'}</option></select></label><label>Stock ≥<input type="number" value={selected.rules.stockMin} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, stockMin: e.target.value } }))}/></label><label>L7D ≥<input type="number" value={selected.rules.l7dMin} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, l7dMin: e.target.value } }))}/></label><label>TTL, min<input type="number" value={selected.rules.ttl} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, ttl: e.target.value } }))}/></label></div></div></div>}
        {rightTab === 'type' && <div className="settings-scroll"><div className="setting-block"><label>{locale === 'ru' ? 'Структура тайпа' : 'Type structure'}</label><TypePreview type={selected.template}/><div className="type-stats"><span>{selected.template.containers.length} container(s)</span><span>{slotCount(selected.template)} slots</span></div></div></div>}
      </> : null}</aside>
    </main>

    {showCoverage && <div className="coverage-panel"><div className="coverage-title"><div><BarChart3 size={17}/><strong>{locale === 'ru' ? 'ПОКРЫТИЕ ВИТРИНЫ' : 'STOREFRONT COVERAGE'}</strong><span>{region} · {locale.toUpperCase()}</span></div><button onClick={() => setShowCoverage(false)}><X size={16}/></button></div><div className="coverage-cards"><div><span>{locale === 'ru' ? 'Заполнение слотов' : 'Slot fill'}</span><strong>{metrics.filled}/{metrics.total}</strong><em>{metrics.fill}%</em></div><div><span>{locale === 'ru' ? 'Покрытие ассортиментом' : 'Assortment coverage'}</span><strong>{metrics.unique}/{metrics.available}</strong><em>{metrics.coverage}%</em></div><div><span>OOS</span><strong>{metrics.oos}</strong><em>{metrics.oos ? 'CHECK' : 'CLEAN'}</em></div></div></div>}
    <AddTypeModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addType}/>
    {toast && <div className="builder-toast"><CheckCircle2 size={16}/>{toast}</div>}
  </div>;
}
