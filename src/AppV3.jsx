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
  { id: 'TYPE-1', system: true, category: 'Товары', description: 'Один акцентный слот', containers: [{ cols: 12, slots: [{ span: 12 }] }] },
  { id: 'TYPE-2', system: true, category: 'Товары', description: 'Два равных слота', containers: [{ cols: 12, slots: [{ span: 6 }, { span: 6 }] }] },
  { id: 'TYPE-3', system: true, category: 'Товары', description: 'Три равных слота', containers: [{ cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }] },
  { id: 'TYPE-4', system: true, category: 'Креативные', description: 'Крупный слот + два компактных', containers: [{ cols: 12, slots: [{ span: 8, rows: 2 }, { span: 4 }, { span: 4 }] }] },
  { id: 'TYPE-5', system: true, category: 'Главная', description: 'Комбинированный горизонтальный тайп', containers: [{ cols: 12, slots: [{ span: 6 }, { span: 3 }, { span: 3 }] }] },
  { id: 'TYPE-13', system: true, category: 'Эдиториал', description: 'Системный тайп: 2 контейнера × 3 ячейки', containers: [{ cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }, { cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }] },
  { id: 'TYPE-13+1', system: false, category: 'Эдиториал', description: 'Кастомная структура: 4 + 3 ячейки', containers: [{ cols: 12, slots: [{ span: 3 }, { span: 3 }, { span: 3 }, { span: 3 }] }, { cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }] },
  { id: 'PROMO-BLOCK', system: false, category: 'Креативные', description: 'Кастомный промо-тайп', containers: [{ cols: 12, slots: [{ span: 3 }, { span: 3 }, { span: 3 }, { span: 3 }] }] },
];

const CONTENT_LABELS = { product: 'Товары / ЦМ', look: 'Образы', image: 'Изображения', video: 'Видео', svg: 'SVG' };
const ALL_CONTENT = ['product', 'look', 'image', 'video', 'svg'];
const DEFAULT_RULES = { mode: 'manual', collection: 'S26', stockMin: 3, l7dMin: 10, dedupe: true, oos: 'fallback', emptyBehavior: 'keep', ttl: 15 };

const REGION_CONFIG = {
  RU: { languages: ['ru', 'en'] },
  KZ: { languages: ['ru', 'kk', 'en'] },
  GCC: { languages: ['ru', 'en', 'ar'] },
  WW: { languages: ['ru', 'en'] },
};
const LANGUAGE_LABELS = { ru: 'RU', en: 'EN', kk: 'KZ', ar: 'AR' };

const BASE_TREE = [
  { id: 'home', names: { ru: 'Главная страница', en: 'Home', kk: 'Басты бет', ar: 'الصفحة الرئيسية' }, page: true },
  { id: 'catalog', names: { ru: 'Каталог', en: 'Catalog', kk: 'Каталог', ar: 'الكتالوج' }, children: [
    { id: 'new', names: { ru: 'Новинки', en: 'New in', kk: 'Жаңалықтар', ar: 'وصل حديثاً' }, page: true },
    { id: 'women', names: { ru: 'Женщинам', en: 'Women', kk: 'Әйелдерге', ar: 'نساء' }, children: [
      { id: 'women-clothes', names: { ru: 'Одежда', en: 'Clothing', kk: 'Киім', ar: 'ملابس' }, page: true },
      { id: 'women-shoes', names: { ru: 'Обувь', en: 'Shoes', kk: 'Аяқ киім', ar: 'أحذية' }, page: true },
      { id: 'women-bags', names: { ru: 'Сумки', en: 'Bags', kk: 'Сөмкелер', ar: 'حقائب' }, page: true },
      { id: 'women-accessories', names: { ru: 'Аксессуары', en: 'Accessories', kk: 'Аксессуарлар', ar: 'إكسسوارات' }, page: true },
    ]},
    { id: 'men', names: { ru: 'Мужчинам', en: 'Men', kk: 'Ерлерге', ar: 'رجال' }, children: [
      { id: 'men-clothes', names: { ru: 'Одежда', en: 'Clothing', kk: 'Киім', ar: 'ملابس' }, page: true },
      { id: 'men-shoes', names: { ru: 'Обувь', en: 'Shoes', kk: 'Аяқ киім', ar: 'أحذية' }, page: true },
      { id: 'men-accessories', names: { ru: 'Аксессуары', en: 'Accessories', kk: 'Аксессуарлар', ar: 'إكسسوارات' }, page: true },
    ]},
    { id: 'kids', names: { ru: 'Детям', en: 'Kids', kk: 'Балаларға', ar: 'أطفال' }, children: [
      { id: 'girls', names: { ru: 'Девочкам', en: 'Girls', kk: 'Қыздарға', ar: 'بنات' }, page: true },
      { id: 'boys', names: { ru: 'Мальчикам', en: 'Boys', kk: 'Ұлдарға', ar: 'أولاد' }, page: true },
    ]},
    { id: 'sale', names: { ru: 'Распродажа', en: 'Sale', kk: 'Жеңілдіктер', ar: 'تخفيضات' }, page: true },
  ]},
  { id: 'editorial', names: { ru: 'Editorial', en: 'Editorial', kk: 'Editorial', ar: 'تحرير' }, children: [
    { id: 'collections', names: { ru: 'Коллекции', en: 'Collections', kk: 'Коллекциялар', ar: 'مجموعات' }, page: true },
    { id: 'capsules', names: { ru: 'Капсулы', en: 'Capsules', kk: 'Капсулалар', ar: 'كبسولات' }, page: true },
    { id: 'gallery', names: { ru: 'Медиа / Gallery', en: 'Media / Gallery', kk: 'Медиа / Gallery', ar: 'الوسائط / المعرض' }, page: true },
  ]},
  { id: 'service', names: { ru: 'Сервисные страницы', en: 'Service pages', kk: 'Сервистік беттер', ar: 'صفحات الخدمة' }, children: [
    { id: 'delivery', names: { ru: 'Доставка и оплата', en: 'Delivery & payment', kk: 'Жеткізу және төлем', ar: 'التوصيل والدفع' }, page: true },
    { id: 'stores', names: { ru: 'Магазины', en: 'Stores', kk: 'Дүкендер', ar: 'المتاجر' }, page: true },
    { id: 'contacts', names: { ru: 'Контакты', en: 'Contacts', kk: 'Байланыстар', ar: 'جهات الاتصال' }, page: true },
  ]},
];

const cloneTree = (tree) => tree.map((n) => ({ ...n, names: { ...n.names }, children: n.children ? cloneTree(n.children) : undefined }));
const slotCount = (type) => type.containers.reduce((sum, c) => sum + c.slots.length, 0);
const money = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const nameFor = (node, locale) => node?.names?.[locale] || node?.names?.ru || node?.names?.en || 'Без названия';

function initialSection(typeId, titles, pins = {}, mode = 'manual') {
  const type = TYPE_LIBRARY.find((t) => t.id === typeId);
  return { id: `S-${typeId}-${Math.random().toString(36).slice(2, 8)}`, titles, typeId, template: type, pins, rules: { ...DEFAULT_RULES, mode }, enabled: true };
}
const makeInitialSections = () => [
  initialSection('TYPE-3', { ru: 'Новинки', en: 'New in', kk: 'Жаңалықтар', ar: 'وصل حديثاً' }, { 0: 'P-101', 1: 'P-103', 2: 'P-105' }, 'hybrid'),
  initialSection('TYPE-13', { ru: 'Editorial · Лето', en: 'Editorial · Summer', kk: 'Editorial · Жаз', ar: 'تحرير · الصيف' }, { 0: 'L-01', 1: 'P-102', 2: 'M-01', 3: 'P-104', 4: 'M-02', 5: 'P-106' }, 'manual'),
];

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
function insertNode(nodes, parentId, newNode) {
  if (!parentId) return [...nodes, newNode];
  return nodes.map((node) => {
    if (node.id === parentId) return { ...node, children: [...(node.children || []), newNode] };
    if (node.children) return { ...node, children: insertNode(node.children, parentId, newNode) };
    return node;
  });
}
function flattenFolders(nodes, depth = 0, out = []) {
  nodes.forEach((node) => {
    if (!node.page) out.push({ id: node.id, label: `${'— '.repeat(depth)}${node.names.ru}` });
    if (node.children) flattenFolders(node.children, depth + 1, out);
  });
  return out;
}
function filterTree(nodes, query, locale) {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  return nodes.reduce((acc, node) => {
    const children = node.children ? filterTree(node.children, query, locale) : [];
    const matches = nameFor(node, locale).toLowerCase().includes(q);
    if (matches || children.length) acc.push({ ...node, children });
    return acc;
  }, []);
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
  return <div className={`lego-slot ${slot.entity ? 'filled' : 'empty'} ${slot.status}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
    <div className="slot-head"><span>Слот {slot.index + 1}</span>{slot.status === 'pin' && <em>PIN</em>}{slot.status === 'auto' && <em className="auto">AUTO</em>}</div>
    {slot.entity ? <>{'price' in slot.entity ? <ProductCard product={slot.entity} region={region}/> : <MediaCard entity={slot.entity}/>} {slot.status === 'pin' && <button className="slot-remove" onClick={(e) => { e.stopPropagation(); onUnpin(); }}><X size={13}/></button>}{slot.warning && <span className="slot-warning"><AlertTriangle size={13}/>{slot.warning}</span>}</> : slot.status === 'collapsed' ? <div className="empty-slot-state"><RefreshCw size={19}/><strong>Слот схлопнут</strong><span>Нет кандидата</span></div> : <div className="empty-slot-state"><Plus size={20}/><strong>Пустой слот</strong><span>Товар · Образ · Медиа</span></div>}
  </div>;
}
function SectionCanvas({ section, locale, region, selected, onSelect, onPin, onUnpin }) {
  let cursor = 0;
  const onDrop = (event, slotIndex) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (id) onPin(section.id, slotIndex, id); };
  return <section className={`builder-section ${selected ? 'selected' : ''}`} onClick={() => onSelect(section.id)}>
    <div className="section-header-line"><div><span>{section.template.system ? 'SYSTEM TYPE' : 'CUSTOM TYPE'} · {section.typeId}</span><h3>{section.titles[locale] || section.titles.ru}</h3></div><div className="section-head-meta"><span>{section.resolvedSlots.filter((s) => s.entity).length}/{section.resolvedSlots.length} слотов</span><span className={`mode-badge ${section.rules.mode}`}>{section.rules.mode.toUpperCase()}</span><MoreHorizontal size={17}/></div></div>
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
    <div className="type-modal-head"><div><span>БИБЛИОТЕКА ТАЙПОВ</span><h2>Добавить секцию</h2><p>Тайп задаёт геометрию. Новая секция создаётся с пустыми слотами, весь контент доступен по умолчанию.</p></div><button onClick={onClose}><X size={19}/></button></div>
    <div className="type-library-body"><aside className="type-categories">{categories.map((c) => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}<ChevronRight size={14}/></button>)}</aside>
      <section className="type-grid-area"><div className="type-grid-title"><strong>{category}</strong><span>System / Custom</span></div><div className="type-card-grid">{TYPE_LIBRARY.filter((t) => t.category === category).map((type) => <button className={`type-card ${selectedTypeId === type.id ? 'selected' : ''}`} key={type.id} onClick={() => setSelectedTypeId(type.id)}><div className="type-card-top"><strong>{type.id}</strong><span>{type.system ? 'SYSTEM' : 'CUSTOM'}</span></div><TypePreview type={type} compact/><p>{type.description}</p><small>{slotCount(type)} слотов · {type.containers.length} контейнер(а)</small></button>)}</div></section>
      <aside className="type-policy-panel"><div className="policy-head"><span>ВЫБРАННЫЙ ТАЙП</span><strong>{selectedType.id}</strong></div><TypePreview type={selectedType}/><div className="type-policy-note"><Plus size={16}/><span>Секция будет пустой. В любой слот можно перетащить товар, образ, изображение, видео или SVG.</span></div><button className="add-type-primary" onClick={() => onAdd(selectedType)}><Plus size={16}/> Добавить {selectedType.id}</button></aside>
    </div>
  </div></div>;
}

function SiteTree({ nodes, locale, selectedId, onSelect, onCreateInFolder, query = '', depth = 0 }) {
  const [expanded, setExpanded] = useState(() => new Set(['catalog', 'women', 'editorial', 'service']));
  const toggle = (id) => setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  return <div className="site-tree-level">{nodes.map((node) => {
    const isFolder = !node.page;
    const isOpen = query ? true : expanded.has(node.id);
    return <div className="site-tree-node" key={node.id}>
      <div className={`site-tree-row ${selectedId === node.id ? 'selected' : ''}`} style={{ paddingLeft: 8 + depth * 16 }}>
        <button className="tree-chevron" onClick={() => isFolder && toggle(node.id)}>{isFolder ? (isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <span/>}</button>
        <button className="tree-page-label" onClick={() => node.page ? onSelect(node.id) : toggle(node.id)}>{nameFor(node, locale)}</button>
        {node.page ? <span className="tree-page-status">PUBLIC</span> : <button className="tree-add-child" title="Создать страницу в папке" onClick={(e) => { e.stopPropagation(); onCreateInFolder(node.id); }}><Plus size={12}/></button>}
      </div>
      {node.children && isOpen && <SiteTree nodes={node.children} locale={locale} selectedId={selectedId} onSelect={onSelect} onCreateInFolder={onCreateInFolder} query={query} depth={depth + 1}/>} 
    </div>;
  })}</div>;
}

function CreateTreeItem({ open, kind, parentId, folders, locale, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [parent, setParent] = useState(parentId || '');
  if (!open) return null;
  return <div className="tree-create-card">
    <div className="tree-create-head"><strong>{kind === 'page' ? 'Новая пустая страница' : 'Новая папка'}</strong><button onClick={onClose}><X size={14}/></button></div>
    <label>Название ({LANGUAGE_LABELS[locale]})<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'page' ? 'Например, Подарки' : 'Например, Спецпроекты'}/></label>
    <label>Расположение<select value={parent} onChange={(e) => setParent(e.target.value)}><option value="">В корне дерева</option>{folders.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
    <div className="tree-create-actions"><button onClick={onClose}>Отмена</button><button className="primary" disabled={!name.trim()} onClick={() => onCreate({ kind, name: name.trim(), parentId: parent })}>Создать</button></div>
  </div>;
}

export default function AppV3() {
  const [siteTrees, setSiteTrees] = useState(() => Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, cloneTree(BASE_TREE)])));
  const [pageIdByRegion, setPageIdByRegion] = useState({ RU: 'home', KZ: 'home', GCC: 'home', WW: 'home' });
  const [pageSections, setPageSections] = useState(() => Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, { home: makeInitialSections() }])));
  const [device, setDevice] = useState('desktop');
  const [region, setRegion] = useState('RU');
  const [locale, setLocale] = useState('ru');
  const [showMenu, setShowMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [createKind, setCreateKind] = useState(null);
  const [createParent, setCreateParent] = useState('');
  const [rightTab, setRightTab] = useState('content');
  const [contentTab, setContentTab] = useState('product');
  const [showAdd, setShowAdd] = useState(false);
  const [showCoverage, setShowCoverage] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const pageId = pageIdByRegion[region];
  const currentTree = siteTrees[region];
  const currentPage = findNode(currentTree, pageId) || findNode(currentTree, 'home');
  const currentPageName = nameFor(currentPage, locale);
  const sections = pageSections[region]?.[pageId] || [];
  const resolved = useMemo(() => sections.map((s) => resolveSection(s, region)), [sections, region]);
  const selected = resolved.find((s) => s.id === selectedId) || resolved[0] || null;
  const languages = REGION_CONFIG[region].languages;
  const filteredTree = useMemo(() => filterTree(currentTree, menuSearch, locale), [currentTree, menuSearch, locale]);
  const folders = useMemo(() => flattenFolders(currentTree), [currentTree]);

  const metrics = useMemo(() => {
    const slots = resolved.flatMap((s) => s.resolvedSlots);
    const filled = slots.filter((s) => s.entity).length;
    const productSlots = slots.filter((s) => s.entity && 'price' in s.entity);
    const unique = new Set(productSlots.map((s) => s.entity.id));
    const available = PRODUCTS.filter((p) => (p.stock[region] ?? 0) > 0).length;
    return { total: slots.length, filled, fill: slots.length ? Math.round(filled / slots.length * 100) : 0, unique: unique.size, available, coverage: available ? Math.round(unique.size / available * 100) : 0, oos: productSlots.filter((s) => (s.entity.stock[region] ?? 0) <= 0).length };
  }, [resolved, region]);

  const setCurrentSections = (nextSections, track = true) => {
    if (track) { setHistory((prev) => [...prev.slice(-24), sections]); setFuture([]); }
    setPageSections((prev) => ({ ...prev, [region]: { ...(prev[region] || {}), [pageId]: nextSections } }));
  };
  const mutateSections = (updater) => setCurrentSections(typeof updater === 'function' ? updater(sections) : updater, true);
  const updateSection = (id, updater) => mutateSections((prev) => prev.map((s) => s.id === id ? updater(s) : s));
  const undo = () => { if (!history.length) return; const prev = history[history.length - 1]; setFuture((f) => [sections, ...f].slice(0, 25)); setHistory((h) => h.slice(0, -1)); setCurrentSections(prev, false); };
  const redo = () => { if (!future.length) return; const next = future[0]; setHistory((h) => [...h, sections].slice(-25)); setFuture((f) => f.slice(1)); setCurrentSections(next, false); };

  const switchRegion = (nextRegion) => {
    setRegion(nextRegion);
    const allowed = REGION_CONFIG[nextRegion].languages;
    if (!allowed.includes(locale)) setLocale('ru');
    setSelectedId(null); setHistory([]); setFuture([]);
  };
  const switchPage = (id) => {
    setPageIdByRegion((prev) => ({ ...prev, [region]: id }));
    setPageSections((prev) => ({ ...prev, [region]: { ...(prev[region] || {}), [id]: prev[region]?.[id] || [] } }));
    setSelectedId(null); setHistory([]); setFuture([]); setShowMenu(false);
  };
  const createTreeItem = ({ kind, name, parentId }) => {
    const id = `${kind === 'page' ? 'page' : 'folder'}-${region.toLowerCase()}-${Date.now()}`;
    const names = { ru: name, en: name, kk: name, ar: name };
    const newNode = kind === 'page' ? { id, names, page: true } : { id, names, children: [] };
    setSiteTrees((prev) => ({ ...prev, [region]: insertNode(prev[region], parentId || null, newNode) }));
    if (kind === 'page') {
      setPageSections((prev) => ({ ...prev, [region]: { ...(prev[region] || {}), [id]: [] } }));
      setPageIdByRegion((prev) => ({ ...prev, [region]: id }));
      setSelectedId(null);
    }
    setCreateKind(null); setCreateParent('');
    setToast(kind === 'page' ? 'Пустая страница создана' : 'Папка создана');
    setTimeout(() => setToast(''), 1600);
  };
  const openCreate = (kind, parent = '') => { setCreateKind(kind); setCreateParent(parent); };

  const addType = (type) => {
    const titles = { ru: `Новая секция · ${type.id}`, en: `New section · ${type.id}`, kk: `Жаңа секция · ${type.id}`, ar: `قسم جديد · ${type.id}` };
    const next = initialSection(type.id, titles, {}, 'manual');
    mutateSections((prev) => [...prev, next]); setSelectedId(next.id); setRightTab('content'); setShowAdd(false);
    setToast(`${type.id}: добавлено ${slotCount(type)} пустых слотов`); setTimeout(() => setToast(''), 1600);
  };
  const pinEntity = (sectionId, slotIndex, entityId) => {
    const kind = entityKind(entityId); if (!kind || !ALL_CONTENT.includes(kind)) return;
    updateSection(sectionId, (s) => ({ ...s, pins: { ...s.pins, [slotIndex]: entityId } }));
    setToast(`Слот ${slotIndex + 1}: ${CONTENT_LABELS[kind]} закреплён`); setTimeout(() => setToast(''), 1400);
  };
  const unpin = (sectionId, slotIndex) => updateSection(sectionId, (s) => { const pins = { ...s.pins }; delete pins[slotIndex]; return { ...s, pins }; });
  const removeSection = (id) => { mutateSections((prev) => prev.filter((s) => s.id !== id)); setSelectedId(null); };
  const duplicate = (id) => { const source = sections.find((s) => s.id === id); if (!source) return; const copy = { ...source, id: `${source.id}-copy-${Date.now()}`, titles: { ...source.titles, ru: `${source.titles.ru} · копия`, en: `${source.titles.en || source.titles.ru} · copy` }, pins: { ...source.pins }, rules: { ...source.rules } }; mutateSections((prev) => [...prev, copy]); setSelectedId(copy.id); };

  const visibleLibrary = useMemo(() => {
    if (contentTab === 'product') return PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()));
    if (contentTab === 'look') return CONTENT.filter((x) => x.kind === 'look');
    return CONTENT.filter((x) => ['image', 'video', 'svg'].includes(x.kind));
  }, [contentTab, query]);

  const navByLocale = {
    ru: ['НОВИНКИ', 'ОДЕЖДА', 'ОБУВЬ', 'СУМКИ', 'АКСЕССУАРЫ', 'SALE'],
    en: ['NEW IN', 'CLOTHING', 'SHOES', 'BAGS', 'ACCESSORIES', 'SALE'],
    kk: ['ЖАҢАЛЫҚТАР', 'КИІМ', 'АЯҚ КИІМ', 'СӨМКЕЛЕР', 'АКСЕССУАРЛАР', 'SALE'],
    ar: ['وصل حديثاً', 'ملابس', 'أحذية', 'حقائب', 'إكسسوارات', 'SALE'],
  };
  const nav = navByLocale[locale] || navByLocale.ru;

  return <div className={`lego-app ${previewMode ? 'preview-mode' : ''}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <header className="app-topbar"><div className="top-brand"><span>LEGO</span><b>Storefront Builder</b></div><div className="crumbs">Sites <ChevronRight size={14}/> <span>{region}</span><ChevronRight size={14}/><strong>{currentPageName}</strong></div><div className="top-icons"><button onClick={() => { setToast('Глобальный поиск открыт'); setTimeout(() => setToast(''), 1200); }}><Search size={17}/></button><button onClick={() => setShowMenu((v) => !v)}><Menu size={17}/></button><div className="avatar">KS</div></div></header>

    <div className="builder-toolbar">
      <div className="toolbar-group menu-toolbar-anchor">
        <button className={showMenu ? 'active' : ''} onClick={() => setShowMenu((v) => !v)}><Menu size={16}/> Меню <ChevronDown size={14}/></button>
        <button className="icon-action" disabled={!history.length} onClick={undo} title="Отменить"><Undo2 size={16}/></button>
        <button className="icon-action" disabled={!future.length} onClick={redo} title="Повторить"><Redo2 size={16}/></button>
        {showMenu && <div className="edit-navigation-popover">
          <div className="edit-popover-head"><div><span>СТРУКТУРА САЙТА · {region}</span><strong>{currentPageName}</strong></div><button onClick={() => setShowMenu(false)}><X size={16}/></button></div>
          <div className="edit-context-row"><div><span>Регион</span><div className="mini-segment">{Object.keys(REGION_CONFIG).map((r) => <button key={r} className={region === r ? 'active' : ''} onClick={() => switchRegion(r)}>{r}</button>)}</div></div><div><span>Язык</span><div className="mini-segment">{languages.map((lang) => <button key={lang} className={locale === lang ? 'active' : ''} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div></div></div>
          <div className="tree-create-toolbar"><button onClick={() => openCreate('page')}><Plus size={13}/> Пустая страница</button><button onClick={() => openCreate('folder')}><Plus size={13}/> Папка</button></div>
          <CreateTreeItem open={Boolean(createKind)} kind={createKind || 'page'} parentId={createParent} folders={folders} locale={locale} onClose={() => { setCreateKind(null); setCreateParent(''); }} onCreate={createTreeItem}/>
          <div className="edit-tree-search"><Search size={14}/><input value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="Поиск страницы / категории"/></div>
          <div className="region-tree-hint">Дерево страниц хранится отдельно для региона {region}</div>
          <div className="edit-tree-scroll"><SiteTree nodes={filteredTree} locale={locale} selectedId={pageId} onSelect={switchPage} onCreateInFolder={(folderId) => openCreate('page', folderId)} query={menuSearch}/></div>
        </div>}
      </div>
      <div className="device-group"><button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} title="Desktop"><Monitor size={18}/></button><button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} title="Mobile"><Smartphone size={18}/></button></div>
      <div className="toolbar-group right"><select value={region} onChange={(e) => switchRegion(e.target.value)}>{Object.keys(REGION_CONFIG).map((r) => <option key={r}>{r}</option>)}</select><div className="language-switch">{languages.map((lang) => <button key={lang} className={locale === lang ? 'active' : ''} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div><button onClick={() => setShowCoverage((v) => !v)}><BarChart3 size={16}/> Покрытие</button><button className={previewMode ? 'active' : ''} onClick={() => setPreviewMode((v) => !v)}><Eye size={16}/> {previewMode ? 'Вернуться' : 'Предпросмотр'}</button><button className="primary" onClick={() => { setToast(`Опубликовано: ${region} · ${LANGUAGE_LABELS[locale]} · ${currentPageName}`); setTimeout(() => setToast(''), 2000); }}>Опубликовать</button></div>
    </div>

    <main className="builder-workspace">
      <aside className="structure-panel"><div className="panel-heading"><span>СТРУКТУРА СТРАНИЦЫ</span><strong>{currentPageName}</strong></div><div className="panel-search"><Search size={15}/><input placeholder="Поиск компонентов"/></div><div className="tree-root"><ChevronDown size={14}/><Monitor size={15}/><strong>{currentPageName}</strong></div><div className="tree-static"><ChevronRight size={14}/>Header</div><div className="tree-static"><ChevronRight size={14}/>Hero / Banner</div><div className="section-tree">{resolved.map((s) => <button key={s.id} className={`tree-type ${selectedId === s.id ? 'selected' : ''}`} onClick={() => setSelectedId(s.id)}><GripVertical size={13}/><LayoutGrid size={14}/><div><strong>{s.titles[locale] || s.titles.ru}</strong><small>{s.typeId} · {s.resolvedSlots.filter((x) => x.entity).length}/{s.resolvedSlots.length}</small></div><span>{s.rules.mode.toUpperCase()}</span></button>)}</div><button className="add-section-button" onClick={() => setShowAdd(true)}><Plus size={16}/>Добавить секцию</button><div className="tree-static"><ChevronRight size={14}/>Footer</div><div className="mini-coverage"><span>ПОКРЫТИЕ АССОРТИМЕНТА</span><strong>{metrics.coverage}%</strong><div><i style={{ width: `${metrics.coverage}%` }}/></div><small>{metrics.unique} из {metrics.available} доступных товаров показано</small></div></aside>

      <section className="canvas-shell"><div className={`storefront-frame ${device}`}><div className="site-store-header"><nav>{nav.map((item) => <span key={item}>{item}</span>)}</nav><div><Search size={17}/><Heart size={17}/><ShoppingBag size={17}/></div></div><div className="page-context-strip"><span>{currentPageName}</span><b>{region}</b><b>{LANGUAGE_LABELS[locale]}</b></div>{!previewMode && <div className="canvas-note"><Layers3 size={15}/><span>Секция = тайп. Геометрия задаётся шаблоном; любой слот может содержать товар, образ или медиа.</span></div>}{resolved.length ? resolved.map((section) => <SectionCanvas key={section.id} section={section} locale={locale} region={region} selected={!previewMode && selectedId === section.id} onSelect={setSelectedId} onPin={pinEntity} onUnpin={unpin}/>) : <div className="empty-page-state"><LayoutGrid size={34}/><strong>Пустая страница</strong><span>На странице пока нет секций.</span>{!previewMode && <button onClick={() => setShowAdd(true)}><Plus size={16}/>Добавить первую секцию</button>}</div>}{!previewMode && <button className="canvas-add-section" onClick={() => setShowAdd(true)}><Plus size={17}/>Добавить секцию / тайп</button>}</div></section>

      <aside className="settings-panel">{selected ? <><div className="settings-head"><div><span>СЕКЦИЯ / ТАЙП</span><strong>{selected.titles[locale] || selected.titles.ru}</strong><small>{selected.typeId} · {selected.template.system ? 'System' : 'Custom'}</small></div><div><button onClick={() => duplicate(selected.id)} title="Дублировать"><Copy size={15}/></button><button onClick={() => removeSection(selected.id)} title="Удалить"><Trash2 size={15}/></button></div></div><div className="settings-tabs"><button className={rightTab === 'content' ? 'active' : ''} onClick={() => setRightTab('content')}>Контент</button><button className={rightTab === 'rules' ? 'active' : ''} onClick={() => setRightTab('rules')}>Правила</button><button className={rightTab === 'type' ? 'active' : ''} onClick={() => setRightTab('type')}>Тайп</button></div>
        {rightTab === 'content' && <div className="settings-scroll"><div className="info-card"><Pin size={15}/><span>Перетащите в любой пустой слот товар, образ, изображение, видео или SVG.</span></div><div className="content-tabs"><button className={contentTab === 'product' ? 'active' : ''} onClick={() => setContentTab('product')}>Товары</button><button className={contentTab === 'look' ? 'active' : ''} onClick={() => setContentTab('look')}>Образы</button><button className={contentTab === 'media' ? 'active' : ''} onClick={() => setContentTab('media')}>Медиа</button></div>{contentTab === 'product' && <div className="panel-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название / ID"/></div>}<div className="library-items">{visibleLibrary.map((entity) => <div key={entity.id} className="library-entity" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', entity.id)}>{'price' in entity ? <ProductCard product={entity} region={region} compact/> : <MediaCard entity={entity} compact/>}<GripVertical size={14}/></div>)}</div></div>}
        {rightTab === 'rules' && <div className="settings-scroll"><div className="setting-block"><label>Режим наполнения</label><div className="segmented">{['manual','hybrid','auto'].map((mode) => <button key={mode} className={selected.rules.mode === mode ? 'active' : ''} onClick={() => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, mode } }))}>{mode.toUpperCase()}</button>)}</div><p>Новый тайп создаётся в MANUAL: все слоты пустые. AUTO/HYBRID автоматически наполняет товарные позиции; любой контент можно закрепить вручную.</p></div><div className="setting-block"><label>Товарные ограничения</label><div className="form-two"><label>Коллекция<select value={selected.rules.collection} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, collection: e.target.value } }))}><option>S26</option><option value="Все">Все</option></select></label><label>Stock ≥<input type="number" value={selected.rules.stockMin} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, stockMin: e.target.value } }))}/></label><label>L7D ≥<input type="number" value={selected.rules.l7dMin} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, l7dMin: e.target.value } }))}/></label><label>TTL, мин<input type="number" value={selected.rules.ttl} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, ttl: e.target.value } }))}/></label></div></div><div className="setting-block"><label>OOS / пустые слоты</label><label>Если товар недоступен<select value={selected.rules.oos} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, oos: e.target.value } }))}><option value="fallback">Следующий AUTO-кандидат</option><option value="collapse">Схлопнуть слот</option><option value="keep">Оставить OOS</option></select></label><label>Если кандидатов нет<select value={selected.rules.emptyBehavior} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, emptyBehavior: e.target.value } }))}><option value="keep">Оставить пустой слот</option><option value="collapse">Схлопнуть слот</option></select></label></div></div>}
        {rightTab === 'type' && <div className="settings-scroll"><div className="setting-block"><label>Структура тайпа</label><TypePreview type={selected.template}/><div className="type-stats"><span>{selected.template.containers.length} контейнер(а)</span><span>{slotCount(selected.template)} ячеек</span></div></div></div>}
      </> : <div className="settings-empty"><LayoutGrid size={26}/><strong>Нет выбранной секции</strong><span>Выберите секцию или добавьте новую.</span></div>}</aside>
    </main>

    {showCoverage && !previewMode && <div className="coverage-panel"><div className="coverage-title"><div><BarChart3 size={17}/><strong>ПОКРЫТИЕ ВИТРИНЫ</strong><span>{region} · {LANGUAGE_LABELS[locale]}</span></div><button onClick={() => setShowCoverage(false)}><X size={16}/></button></div><div className="coverage-cards"><div><span>Заполнение слотов</span><strong>{metrics.filled}/{metrics.total}</strong><em>{metrics.fill}%</em></div><div><span>Покрытие ассортиментом</span><strong>{metrics.unique}/{metrics.available}</strong><em>{metrics.coverage}%</em></div><div><span>OOS на витрине</span><strong>{metrics.oos}</strong><em>{metrics.oos ? 'CHECK' : 'CLEAN'}</em></div></div><div className="coverage-rows">{resolved.map((s) => { const filled = s.resolvedSlots.filter((x) => x.entity).length; const pct = s.resolvedSlots.length ? Math.round(filled / s.resolvedSlots.length * 100) : 0; return <div key={s.id}><span>{s.titles[locale] || s.titles.ru}<small>{s.typeId}</small></span><div><i style={{ width: `${pct}%` }}/></div><b>{filled}/{s.resolvedSlots.length}</b><em>{pct}%</em></div>; })}</div></div>}

    <AddTypeModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addType}/>
    {toast && <div className="builder-toast"><CheckCircle2 size={16}/>{toast}</div>}
  </div>;
}
