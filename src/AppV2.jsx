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
  {
    id: 'TYPE-1', name: 'TYPE-1', system: true, category: 'Товары',
    description: 'Один акцентный слот',
    containers: [{ cols: 12, slots: [{ span: 12 }] }],
  },
  {
    id: 'TYPE-2', name: 'TYPE-2', system: true, category: 'Товары',
    description: 'Два равных слота',
    containers: [{ cols: 12, slots: [{ span: 6 }, { span: 6 }] }],
  },
  {
    id: 'TYPE-3', name: 'TYPE-3', system: true, category: 'Товары',
    description: 'Три равных слота',
    containers: [{ cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] }],
  },
  {
    id: 'TYPE-4', name: 'TYPE-4', system: true, category: 'Креативные',
    description: 'Крупный слот + два компактных',
    containers: [{ cols: 12, slots: [{ span: 8, rows: 2 }, { span: 4 }, { span: 4 }] }],
  },
  {
    id: 'TYPE-5', name: 'TYPE-5', system: true, category: 'Главная',
    description: 'Комбинированный горизонтальный тайп',
    containers: [{ cols: 12, slots: [{ span: 6 }, { span: 3 }, { span: 3 }] }],
  },
  {
    id: 'TYPE-13', name: 'TYPE-13', system: true, category: 'Эдиториал',
    description: 'Системный тайп: 2 контейнера × 3 ячейки',
    containers: [
      { cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] },
      { cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] },
    ],
  },
  {
    id: 'TYPE-13+1', name: 'TYPE-13+1', system: false, category: 'Эдиториал',
    description: 'Кастомная структура: 4 + 3 ячейки',
    containers: [
      { cols: 12, slots: [{ span: 3 }, { span: 3 }, { span: 3 }, { span: 3 }] },
      { cols: 12, slots: [{ span: 4 }, { span: 4 }, { span: 4 }] },
    ],
  },
  {
    id: 'PROMO-BLOCK', name: 'Промо-блок', system: false, category: 'Креативные',
    description: 'Кастомный промо-тайп',
    containers: [{ cols: 12, slots: [{ span: 3 }, { span: 3 }, { span: 3 }, { span: 3 }] }],
  },
];

const CONTENT_LABELS = {
  product: 'Товары / ЦМ',
  look: 'Образы',
  image: 'Изображения',
  video: 'Видео',
  svg: 'SVG',
};

const DEFAULT_RULES = {
  mode: 'manual',
  collection: 'S26',
  stockMin: 3,
  l7dMin: 10,
  dedupe: true,
  oos: 'fallback',
  emptyBehavior: 'keep',
  ttl: 15,
};

const slotCount = (type) => type.containers.reduce((sum, c) => sum + c.slots.length, 0);
const money = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

function emptyPins() { return {}; }

function initialSection(typeId, title, pins = {}, mode = 'manual') {
  const type = TYPE_LIBRARY.find((t) => t.id === typeId);
  return {
    id: `S-${typeId}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    typeId,
    template: type,
    pins,
    rules: { ...DEFAULT_RULES, mode },
    enabled: true,
  };
}

const INITIAL_SECTIONS = [
  initialSection('TYPE-3', 'Новинки', { 0: 'P-101', 1: 'P-103', 2: 'P-105' }, 'hybrid'),
  initialSection('TYPE-13', 'Editorial · Summer', { 0: 'L-01', 1: 'P-102', 2: 'M-01', 3: 'P-104', 4: 'M-02', 5: 'P-106' }, 'manual'),
];

function entityKind(id) {
  if (id?.startsWith('P-')) return 'product';
  return CONTENT.find((x) => x.id === id)?.kind;
}

function getEntity(id) {
  return PRODUCTS.find((p) => p.id === id) || CONTENT.find((m) => m.id === id) || null;
}

function resolveSection(section, region) {
  const used = new Set();
  const eligible = PRODUCTS
    .filter((p) =>
      (section.rules.collection === 'Все' || p.collection === section.rules.collection) &&
      (p.stock[region] ?? 0) >= Number(section.rules.stockMin) &&
      p.l7d >= Number(section.rules.l7dMin))
    .sort((a, b) => (b.l7d + (b.stock[region] ?? 0)) - (a.l7d + (a.stock[region] ?? 0)));

  const total = slotCount(section.template);
  const slots = Array.from({ length: total }, (_, index) => {
    const pinId = section.pins[index];
    if (pinId) {
      const entity = getEntity(pinId);
      if (!entity) return { index, status: 'empty', entity: null };
      const kind = entityKind(pinId);
      if (kind === 'product') {
        const available = (entity.stock[region] ?? 0) >= Number(section.rules.stockMin);
        if (!available && section.rules.oos === 'collapse') return { index, status: 'collapsed', entity: null, warning: 'OOS → collapse' };
        if (!available && section.rules.oos === 'fallback' && section.rules.mode !== 'manual') {
          const next = eligible.find((p) => !used.has(p.id));
          if (next) {
            used.add(next.id);
            return { index, status: 'auto', entity: next };
          }
        }
        used.add(entity.id);
        return { index, status: 'pin', entity, warning: available ? null : 'OOS' };
      }
      return { index, status: 'pin', entity };
    }

    if (section.rules.mode === 'manual') {
      return { index, status: 'empty', entity: null };
    }

    const next = eligible.find((p) => !section.rules.dedupe || !used.has(p.id));
    if (!next) {
      return section.rules.emptyBehavior === 'collapse'
        ? { index, status: 'collapsed', entity: null }
        : { index, status: 'empty', entity: null };
    }
    used.add(next.id);
    return { index, status: 'auto', entity: next };
  });

  return { ...section, resolvedSlots: slots, candidates: eligible };
}

function TypePreview({ type, compact = false }) {
  let index = 0;
  return (
    <div className={`type-preview ${compact ? 'compact' : ''}`}>
      {type.containers.map((container, ci) => (
        <div className="type-preview-container" key={ci}>
          <div className="type-preview-grid" style={{ gridTemplateColumns: `repeat(${container.cols}, 1fr)` }}>
            {container.slots.map((slot, si) => {
              index += 1;
              return <span key={si} style={{ gridColumn: `span ${slot.span}`, gridRow: slot.rows ? `span ${slot.rows}` : undefined }}>{compact ? '' : index}</span>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product, region, compact = false }) {
  return (
    <div className={`entity-product tone-${product.tone} ${compact ? 'compact' : ''}`}>
      <div className="entity-art"><span>LIME</span></div>
      <div className="entity-info">
        <strong>{product.name}</strong>
        {!compact && <span>{money(product.price)}</span>}
        <small>Сток {region}: {product.stock[region]} · L7D {product.l7d}</small>
      </div>
    </div>
  );
}

function MediaCard({ entity, compact = false }) {
  const Icon = entity.kind === 'video' ? Film : entity.kind === 'look' ? Sparkles : ImageIcon;
  return (
    <div className={`entity-media ${entity.tone} ${compact ? 'compact' : ''}`}>
      <Icon size={compact ? 18 : 22} />
      <div>
        <strong>{entity.name}</strong>
        <span>{CONTENT_LABELS[entity.kind]}</span>
      </div>
    </div>
  );
}

function Slot({ slot, region, onDrop, onUnpin }) {
  return (
    <div
      className={`lego-slot ${slot.entity ? 'filled' : ''} ${slot.status}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="slot-head">
        <span>Слот {slot.index + 1}</span>
        {slot.status === 'pin' && <em>PIN</em>}
        {slot.status === 'auto' && <em className="auto">AUTO</em>}
      </div>
      {slot.entity ? (
        <>
          {'price' in slot.entity ? <ProductCard product={slot.entity} region={region} /> : <MediaCard entity={slot.entity} />}
          {slot.status === 'pin' && <button className="slot-remove" onClick={(e) => { e.stopPropagation(); onUnpin(); }}><X size={13}/></button>}
          {slot.warning && <span className="slot-warning"><AlertTriangle size={13}/>{slot.warning}</span>}
        </>
      ) : slot.status === 'collapsed' ? (
        <div className="empty-slot-state"><RefreshCw size={19}/><strong>Слот схлопнут</strong><span>Нет кандидата</span></div>
      ) : (
        <div className="empty-slot-state">
          <Plus size={20}/>
          <strong>Пустой слот</strong>
          <span>Товар · Образ · Медиа</span>
        </div>
      )}
    </div>
  );
}

function SectionCanvas({ section, region, selected, onSelect, onPin, onUnpin }) {
  let cursor = 0;
  const onDrop = (event, slotIndex) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    if (id) onPin(section.id, slotIndex, id);
  };
  return (
    <section className={`builder-section ${selected ? 'selected' : ''}`} onClick={() => onSelect(section.id)}>
      <div className="section-header-line">
        <div>
          <span>{section.template.system ? 'SYSTEM TYPE' : 'CUSTOM TYPE'} · {section.typeId}</span>
          <h3>{section.title}</h3>
        </div>
        <div className="section-head-meta">
          <span>{section.resolvedSlots.filter((s) => s.entity).length}/{section.resolvedSlots.length} слотов</span>
          <span className={`mode-badge ${section.rules.mode}`}>{section.rules.mode.toUpperCase()}</span>
          <MoreHorizontal size={17}/>
        </div>
      </div>
      <div className="section-containers">
        {section.template.containers.map((container, ci) => (
          <div className="section-container" key={ci}>
            <div className="container-label">Контейнер {ci + 1}</div>
            <div className="slot-grid" style={{ gridTemplateColumns: `repeat(${container.cols}, minmax(0,1fr))` }}>
              {container.slots.map((shape, si) => {
                const slot = section.resolvedSlots[cursor++];
                return (
                  <div key={si} style={{ gridColumn: `span ${shape.span}`, gridRow: shape.rows ? `span ${shape.rows}` : undefined }}>
                    <Slot
                      slot={slot}
                      region={region}
                      onDrop={(e) => onDrop(e, slot.index)}
                      onUnpin={() => onUnpin(section.id, slot.index)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AddTypeModal({ open, onClose, onAdd }) {
  const [category, setCategory] = useState('Товары');
  const [selectedTypeId, setSelectedTypeId] = useState('TYPE-1');
  const selectedType = TYPE_LIBRARY.find((t) => t.id === selectedTypeId) || TYPE_LIBRARY[0];

  if (!open) return null;
  const categories = ['Товары', 'Креативные', 'Эдиториал', 'Главная'];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="type-library-modal" onClick={(e) => e.stopPropagation()}>
        <div className="type-modal-head">
          <div><span>БИБЛИОТЕКА ТАЙПОВ</span><h2>Добавить секцию</h2><p>Тайп задаёт геометрию секции. Новая секция создаётся с пустыми слотами.</p></div>
          <button onClick={onClose}><X size={19}/></button>
        </div>
        <div className="type-library-body">
          <aside className="type-categories">
            {categories.map((c) => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}<ChevronRight size={14}/></button>)}
          </aside>
          <section className="type-grid-area">
            <div className="type-grid-title"><strong>{category}</strong><span>System / Custom</span></div>
            <div className="type-card-grid">
              {TYPE_LIBRARY.filter((t) => t.category === category).map((type) => (
                <button className={`type-card ${selectedTypeId === type.id ? 'selected' : ''}`} key={type.id} onClick={() => setSelectedTypeId(type.id)}>
                  <div className="type-card-top"><strong>{type.name}</strong><span>{type.system ? 'SYSTEM' : 'CUSTOM'}</span></div>
                  <TypePreview type={type} compact />
                  <p>{type.description}</p>
                  <small>{slotCount(type)} слотов · {type.containers.length} контейнер(а)</small>
                </button>
              ))}
            </div>
          </section>
          <aside className="type-policy-panel">
            <div className="policy-head"><span>ВЫБРАННЫЙ ТАЙП</span><strong>{selectedType.name}</strong></div>
            <TypePreview type={selectedType}/>
            <div className="type-policy-note">
              <Layers3 size={16}/>
              <span><b>Все типы контента доступны во всех слотах:</b> товары, образы, изображения, видео и SVG.</span>
            </div>
            <div className="type-policy-note">
              <Plus size={16}/>
              <span>После добавления секция остаётся пустой до ручного наполнения или включения AUTO/HYBRID.</span>
            </div>
            <button className="add-type-primary" onClick={() => onAdd(selectedType)}>
              <Plus size={16}/> Добавить {selectedType.name}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function AppV2() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [selectedId, setSelectedId] = useState(INITIAL_SECTIONS[0].id);
  const [device, setDevice] = useState('desktop');
  const [region, setRegion] = useState('RU');
  const [rightTab, setRightTab] = useState('content');
  const [contentTab, setContentTab] = useState('product');
  const [showAdd, setShowAdd] = useState(false);
  const [showCoverage, setShowCoverage] = useState(true);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');

  const resolved = useMemo(() => sections.map((s) => resolveSection(s, region)), [sections, region]);
  const selected = resolved.find((s) => s.id === selectedId) || resolved[0];

  const metrics = useMemo(() => {
    const slots = resolved.flatMap((s) => s.resolvedSlots);
    const filled = slots.filter((s) => s.entity).length;
    const productSlots = slots.filter((s) => s.entity && 'price' in s.entity);
    const unique = new Set(productSlots.map((s) => s.entity.id));
    const available = PRODUCTS.filter((p) => (p.stock[region] ?? 0) > 0).length;
    return {
      total: slots.length,
      filled,
      fill: slots.length ? Math.round(filled / slots.length * 100) : 0,
      unique: unique.size,
      available,
      coverage: available ? Math.round(unique.size / available * 100) : 0,
      oos: productSlots.filter((s) => (s.entity.stock[region] ?? 0) <= 0).length,
    };
  }, [resolved, region]);

  const updateSection = (id, updater) => setSections((prev) => prev.map((s) => s.id === id ? updater(s) : s));

  const addType = (type) => {
    const next = initialSection(type.id, `Новая секция · ${type.id}`, emptyPins(), 'manual');
    setSections((prev) => [...prev, next]);
    setSelectedId(next.id);
    setRightTab('content');
    setShowAdd(false);
    setToast(`${type.id} добавлен: ${slotCount(type)} пустых слотов`);
    setTimeout(() => setToast(''), 1800);
  };

  const pinEntity = (sectionId, slotIndex, entityId) => {
    const kind = entityKind(entityId);
    if (!kind) return;
    updateSection(sectionId, (s) => ({ ...s, pins: { ...s.pins, [slotIndex]: entityId } }));
    setToast(`Слот ${slotIndex + 1}: ${CONTENT_LABELS[kind]} закреплён`);
    setTimeout(() => setToast(''), 1600);
  };

  const unpin = (sectionId, slotIndex) => updateSection(sectionId, (s) => {
    const pins = { ...s.pins };
    delete pins[slotIndex];
    return { ...s, pins };
  });

  const removeSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    const next = sections.find((s) => s.id !== id);
    if (next) setSelectedId(next.id);
  };

  const duplicate = (id) => {
    const source = sections.find((s) => s.id === id);
    if (!source) return;
    const copy = { ...source, id: `${source.id}-copy-${Date.now()}`, title: `${source.title} · копия`, pins: { ...source.pins }, rules: { ...source.rules } };
    setSections((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const visibleLibrary = useMemo(() => {
    if (!selected) return [];
    if (contentTab === 'product') {
      return PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()));
    }
    if (contentTab === 'look') return CONTENT.filter((x) => x.kind === 'look');
    return CONTENT.filter((x) => ['image', 'video', 'svg'].includes(x.kind));
  }, [selected, contentTab, query]);

  return (
    <div className="lego-app">
      <header className="app-topbar">
        <div className="top-brand"><span>LEGO</span><b>LIME Storefront Builder</b></div>
        <div className="crumbs">Sites <ChevronRight size={14}/> LIME <ChevronRight size={14}/> <strong>Главная страница</strong></div>
        <div className="top-icons"><Search size={17}/><Menu size={17}/><div className="avatar">KS</div></div>
      </header>

      <div className="builder-toolbar">
        <div className="toolbar-group">
          <button><Menu size={16}/> Edit <ChevronDown size={14}/></button>
          <button><Undo2 size={16}/></button>
          <button><Redo2 size={16}/></button>
        </div>
        <div className="device-group">
          <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={18}/></button>
          <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={18}/></button>
        </div>
        <div className="toolbar-group right">
          <select value={region} onChange={(e) => setRegion(e.target.value)}><option>RU</option><option>KZ</option><option>GCC</option><option>WW</option></select>
          <button onClick={() => setShowCoverage((v) => !v)}><BarChart3 size={16}/> Покрытие</button>
          <button><Eye size={16}/> Предпросмотр</button>
          <button className="primary">Опубликовать</button>
        </div>
      </div>

      <main className="builder-workspace">
        <aside className="structure-panel">
          <div className="panel-heading"><span>СТРУКТУРА СТРАНИЦЫ</span><strong>Главная</strong></div>
          <div className="panel-search"><Search size={15}/><input placeholder="Поиск компонентов"/></div>
          <div className="tree-root"><ChevronDown size={14}/><Monitor size={15}/><strong>Главная страница</strong></div>
          <div className="tree-static"><ChevronRight size={14}/>Header</div>
          <div className="tree-static"><ChevronRight size={14}/>Hero / Баннер</div>
          <div className="section-tree">
            {resolved.map((s) => (
              <button key={s.id} className={`tree-type ${selectedId === s.id ? 'selected' : ''}`} onClick={() => setSelectedId(s.id)}>
                <GripVertical size={13}/><LayoutGrid size={14}/>
                <div><strong>{s.title}</strong><small>{s.typeId} · {s.resolvedSlots.filter((x) => x.entity).length}/{s.resolvedSlots.length}</small></div>
                <span>{s.rules.mode.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <button className="add-section-button" onClick={() => setShowAdd(true)}><Plus size={16}/>Добавить секцию</button>
          <div className="tree-static"><ChevronRight size={14}/>Footer</div>
          <div className="mini-coverage">
            <span>ПОКРЫТИЕ АССОРТИМЕНТА</span><strong>{metrics.coverage}%</strong>
            <div><i style={{ width: `${metrics.coverage}%` }}/></div>
            <small>{metrics.unique} из {metrics.available} доступных товаров показано</small>
          </div>
        </aside>

        <section className="canvas-shell">
          <div className={`storefront-frame ${device}`}>
            <div className="lime-store-header"><b>LIME</b><nav><span>НОВИНКИ</span><span>ОДЕЖДА</span><span>ОБУВЬ</span><span>СУМКИ</span><span>SALE</span></nav><div><Search size={17}/><Heart size={17}/><ShoppingBag size={17}/></div></div>
            <div className="canvas-note"><Layers3 size={15}/><span>Секция = тайп. Геометрия задаётся шаблоном; любой слот может содержать товар, образ или медиа.</span></div>
            {resolved.map((section) => (
              <SectionCanvas
                key={section.id}
                section={section}
                region={region}
                selected={selectedId === section.id}
                onSelect={setSelectedId}
                onPin={pinEntity}
                onUnpin={unpin}
              />
            ))}
            <button className="canvas-add-section" onClick={() => setShowAdd(true)}><Plus size={17}/>Добавить секцию / тайп</button>
          </div>
        </section>

        <aside className="settings-panel">
          {selected ? <>
            <div className="settings-head">
              <div><span>СЕКЦИЯ / ТАЙП</span><strong>{selected.title}</strong><small>{selected.typeId} · {selected.template.system ? 'System' : 'Custom'}</small></div>
              <div><button onClick={() => duplicate(selected.id)}><Copy size={15}/></button><button onClick={() => removeSection(selected.id)}><Trash2 size={15}/></button></div>
            </div>
            <div className="settings-tabs">
              <button className={rightTab === 'content' ? 'active' : ''} onClick={() => setRightTab('content')}>Контент</button>
              <button className={rightTab === 'rules' ? 'active' : ''} onClick={() => setRightTab('rules')}>Правила</button>
              <button className={rightTab === 'type' ? 'active' : ''} onClick={() => setRightTab('type')}>Тайп</button>
            </div>

            {rightTab === 'content' && <div className="settings-scroll">
              <div className="info-card"><Pin size={15}/><span>Перетащите в любой пустой слот товар, образ, изображение, видео или SVG.</span></div>
              <div className="content-tabs">
                <button className={contentTab === 'product' ? 'active' : ''} onClick={() => setContentTab('product')}>Товары</button>
                <button className={contentTab === 'look' ? 'active' : ''} onClick={() => setContentTab('look')}>Образы</button>
                <button className={contentTab === 'media' ? 'active' : ''} onClick={() => setContentTab('media')}>Медиа</button>
              </div>
              {contentTab === 'product' && <div className="panel-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название / ID"/></div>}
              <div className="library-items">
                {visibleLibrary.map((entity) => (
                  <div
                    key={entity.id}
                    className="library-entity"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', entity.id)}
                  >
                    {'price' in entity ? <ProductCard product={entity} region={region} compact/> : <MediaCard entity={entity} compact/>}
                    <GripVertical size={14}/>
                  </div>
                ))}
              </div>
            </div>}

            {rightTab === 'rules' && <div className="settings-scroll">
              <div className="setting-block">
                <label>Режим наполнения</label>
                <div className="segmented">
                  {['manual', 'hybrid', 'auto'].map((mode) => <button key={mode} className={selected.rules.mode === mode ? 'active' : ''} onClick={() => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, mode } }))}>{mode.toUpperCase()}</button>)}
                </div>
                <p>Новый тайп создаётся в MANUAL, поэтому все слоты изначально пустые. AUTO/HYBRID может автоматически наполнять товарные позиции, а ручной drag-and-drop доступен для любого контента.</p>
              </div>
              <div className="setting-block">
                <label>Товарные ограничения</label>
                <div className="form-two">
                  <label>Коллекция<select value={selected.rules.collection} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, collection: e.target.value } }))}><option>S26</option><option>Все</option></select></label>
                  <label>Сток ≥<input type="number" value={selected.rules.stockMin} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, stockMin: e.target.value } }))}/></label>
                  <label>L7D ≥<input type="number" value={selected.rules.l7dMin} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, l7dMin: e.target.value } }))}/></label>
                  <label>TTL, мин<input type="number" value={selected.rules.ttl} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, ttl: e.target.value } }))}/></label>
                </div>
              </div>
              <div className="setting-block">
                <label>OOS / пустые слоты</label>
                <label>Если товар недоступен<select value={selected.rules.oos} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, oos: e.target.value } }))}><option value="fallback">Следующий AUTO-кандидат</option><option value="collapse">Схлопнуть слот</option><option value="keep">Оставить OOS</option></select></label>
                <label>Если кандидатов нет<select value={selected.rules.emptyBehavior} onChange={(e) => updateSection(selected.id, (s) => ({ ...s, rules: { ...s.rules, emptyBehavior: e.target.value } }))}><option value="keep">Оставить пустой слот</option><option value="collapse">Схлопнуть слот</option></select></label>
              </div>
            </div>}

            {rightTab === 'type' && <div className="settings-scroll">
              <div className="setting-block">
                <label>Структура тайпа</label>
                <TypePreview type={selected.template}/>
                <div className="type-stats"><span>{selected.template.containers.length} контейнер(а)</span><span>{slotCount(selected.template)} ячеек</span></div>
              </div>
              <div className="setting-block">
                <label>Контент слотов</label>
                <p>Во всех слотах по умолчанию доступен весь контент: товары / цветомодели, образы, изображения, видео и SVG.</p>
              </div>
            </div>}
          </> : null}
        </aside>
      </main>

      {showCoverage && <div className="coverage-panel">
        <div className="coverage-title"><div><BarChart3 size={17}/><strong>ПОКРЫТИЕ ВИТРИНЫ</strong><span>регион {region}</span></div><button onClick={() => setShowCoverage(false)}><X size={16}/></button></div>
        <div className="coverage-cards">
          <div><span>Заполнение слотов</span><strong>{metrics.filled}/{metrics.total}</strong><em>{metrics.fill}%</em></div>
          <div><span>Покрытие ассортиментом</span><strong>{metrics.unique}/{metrics.available}</strong><em>{metrics.coverage}%</em></div>
          <div><span>OOS на витрине</span><strong>{metrics.oos}</strong><em>{metrics.oos ? 'CHECK' : 'CLEAN'}</em></div>
        </div>
        <div className="coverage-rows">
          {resolved.map((s) => {
            const filled = s.resolvedSlots.filter((x) => x.entity).length;
            const pct = Math.round(filled / s.resolvedSlots.length * 100);
            return <div key={s.id}><span>{s.title}<small>{s.typeId}</small></span><div><i style={{ width: `${pct}%` }}/></div><b>{filled}/{s.resolvedSlots.length}</b><em>{pct}%</em></div>;
          })}
        </div>
      </div>}

      <AddTypeModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addType}/>
      {toast && <div className="builder-toast"><CheckCircle2 size={16}/>{toast}</div>}
    </div>
  );
}
