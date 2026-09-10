import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'UX_UNIFICATION_V18';

function replaceBetween(source, startToken, endToken, replacement, label) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start + startToken.length);
  if (start < 0 || end < 0) throw new Error('UX_UNIFICATION_V18: ' + label + ' anchors not found');
  return source.slice(0, start) + replacement + source.slice(end);
}

if (!app.includes(MARKER)) {
  const markerAnchor = 'const PAGE_RULES_V15 = true;';
  if (!app.includes(markerAnchor)) throw new Error('UX_UNIFICATION_V18: PAGE_RULES_V15 marker missing');
  app = app.replace(markerAnchor, markerAnchor + '\nconst ' + MARKER + ' = true;');

  app = app.replace(/const DEFAULT_RULES = \{[^;]+\};/, "const DEFAULT_RULES = { fillMode: 'manual', conditionLogic: 'AND', conditions: [], sortBy: 'l7d_desc', sorts: [], dedupe: true, oos: 'keep', emptyBehavior: 'collapse-center', ttl: 15, inheritPageRules: true, colorMode: 'inherit', maxColors: 2 };");

  const sortStart = app.indexOf('function sortCandidates(');
  const sortEnd = app.indexOf('function emptySlotResult(', sortStart);
  if (sortStart < 0 || sortEnd < 0) throw new Error('UX_UNIFICATION_V18: section sort anchors not found');
  const sortSource = String.raw`function merchFreshness(product) {
  const raw = product?.publishedAt || product?.published_at || product?.createdAt || product?.created_at || product?.releaseDate || product?.release_date;
  const parsed = raw ? Date.parse(raw) : NaN;
  if (Number.isFinite(parsed)) return parsed;
  const sourceIndex = PRODUCTS.findIndex((item) => item.id === product.id);
  return (product?.isNew ? 1000000 : 0) + Math.max(0, PRODUCTS.length - sourceIndex);
}

function normalizeMerchSortKey(key) {
  if (key === 'new_first') return 'new_desc';
  return key || 'none';
}

function merchSortCompare(a, b, key, region) {
  const stock = (product) => Number(product?.stock?.[region] ?? product?.stockValue ?? 0);
  switch (normalizeMerchSortKey(key)) {
    case 'new_desc': return merchFreshness(b) - merchFreshness(a);
    case 'new_asc': return merchFreshness(a) - merchFreshness(b);
    case 'l7d_desc': return Number(b?.l7d || 0) - Number(a?.l7d || 0);
    case 'l7d_asc': return Number(a?.l7d || 0) - Number(b?.l7d || 0);
    case 'stock_desc': return stock(b) - stock(a);
    case 'stock_asc': return stock(a) - stock(b);
    case 'discount_desc': return Number(b?.discount || 0) - Number(a?.discount || 0);
    case 'price_asc': return Number(a?.price || 0) - Number(b?.price || 0);
    case 'price_desc': return Number(b?.price || 0) - Number(a?.price || 0);
    default: return 0;
  }
}

function merchTieBreak(a, b) {
  const freshness = merchFreshness(b) - merchFreshness(a);
  if (freshness) return freshness;
  return String(a?.id || '').localeCompare(String(b?.id || ''), 'ru', { numeric: true });
}

function sortCandidates(items, rules, region) {
  const explicit = Array.isArray(rules?.sorts) ? rules.sorts.filter((key) => key && key !== 'none') : [];
  const legacy = normalizeMerchSortKey(rules?.sortBy);
  const activeSorts = explicit.length ? explicit : legacy && legacy !== 'none' ? [legacy] : [];
  if (!activeSorts.length) return [...items];
  return [...items].sort((a, b) => {
    for (const key of activeSorts) {
      const result = merchSortCompare(a, b, key, region);
      if (result) return result;
    }
    return merchTieBreak(a, b);
  });
}

`;
  app = app.slice(0, sortStart) + sortSource + app.slice(sortEnd);

  const pageSortStart = app.indexOf('function sortPageCandidates(');
  const pageSortEnd = app.indexOf('function applyPageColorLimit(', pageSortStart);
  if (pageSortStart < 0 || pageSortEnd < 0) throw new Error('UX_UNIFICATION_V18: page sort anchors not found');
  const pageSortSource = String.raw`function sortPageCandidates(items, rules, region) {
  const activeSorts = (rules?.sorts || []).filter((key) => key && key !== 'none');
  if (!activeSorts.length) return [...items];
  return [...items].sort((a, b) => {
    for (const key of activeSorts) {
      const result = merchSortCompare(a, b, key, region);
      if (result) return result;
    }
    return merchTieBreak(a, b);
  });
}

`;
  app = app.slice(0, pageSortStart) + pageSortSource + app.slice(pageSortEnd);

  const resolveStart = app.indexOf('function resolveSection(section, region, pageContext = null) {');
  const resolveEnd = app.indexOf('function resolveStandardGrid(', resolveStart);
  if (resolveStart < 0 || resolveEnd < 0) throw new Error('UX_UNIFICATION_V18: resolveSection anchors not found');
  let resolveChunk = app.slice(resolveStart, resolveEnd);
  const usedAnchor = '  const usedInSection = new Set();';
  if (!resolveChunk.includes(usedAnchor)) throw new Error('UX_UNIFICATION_V18: usedInSection anchor missing');
  resolveChunk = resolveChunk.replace(usedAnchor, String.raw`  const hasLocalSort = Array.isArray(rules.sorts) && rules.sorts.some((key) => key && key !== 'none');
  if (hasLocalSort) {
    allCandidates = sortCandidates(allCandidates, rules, region);
    rawCandidates = sortCandidates(rawCandidates, rules, region);
  }
  if (rules.colorMode && rules.colorMode !== 'inherit') {
    const localColorResult = applyPageColorLimit(allCandidates, { colorMode: rules.colorMode, maxColors: rules.maxColors });
    allCandidates = localColorResult.displayPool;
  }

  const usedInSection = new Set();`);

  const pinFallbackNeedle = String.raw`      if (rules.oos === 'fallback') {
        const replacement = allCandidates.find((product) => pageStock(product, region) > 0 && !usedInSection.has(product.id) && !blockedForAuto(product));
        if (replacement) {
          usedInSection.add(replacement.id);
          rememberAuto(replacement);
          return { index, status: 'auto', entity: replacement, warning: 'Автозамена PIN по правилам секции', origin: inheritPageRules ? 'page+section' : 'section' };
        }
        return { index, status: 'pin', entity, warning: 'Нет в наличии · замена не найдена', origin: 'manual' };
      }`;
  if (resolveChunk.includes(pinFallbackNeedle)) {
    resolveChunk = resolveChunk.replace(pinFallbackNeedle, String.raw`      if (rules.oos === 'fallback') {
        const colorReplacement = findColorFallback(entity, rawCandidates, pageContext || { preferColorFallback: true, usedAcross: new Set(), pinnedAcross: new Set() }, usedInSection, region);
        if (colorReplacement) {
          usedInSection.add(colorReplacement.id);
          rememberAuto(colorReplacement);
          return { index, status: 'auto', entity: colorReplacement, warning: 'Другой цвет той же модели', origin: inheritPageRules ? 'page+section' : 'section' };
        }
        const replacement = allCandidates.find((product) => pageStock(product, region) > 0 && !usedInSection.has(product.id) && !blockedForAuto(product));
        if (replacement) {
          usedInSection.add(replacement.id);
          rememberAuto(replacement);
          return { index, status: 'auto', entity: replacement, warning: 'Автозамена PIN по правилам секции', origin: inheritPageRules ? 'page+section' : 'section' };
        }
        return { index, status: 'pin', entity, warning: 'Нет в наличии · замена не найдена', origin: 'manual' };
      }`);
  }
  app = app.slice(0, resolveStart) + resolveChunk + app.slice(resolveEnd);

  const pageModalStart = app.indexOf('function PageRulesModal(');
  if (pageModalStart < 0) throw new Error('UX_UNIFICATION_V18: PageRulesModal missing');

  const helpers = String.raw`function merchSortLabel(key) {
  const option = PAGE_SORT_OPTIONS.find(([value]) => value === key);
  return option ? option[1] : 'Не выбрано';
}

function MerchSortControl({ sorts = [], onChange, max = 3, compact = false }) {
  const active = (sorts || []).filter((key) => key && key !== 'none');
  const updateAt = (index, value) => {
    const next = [...active];
    if (value === 'none') next.splice(index, 1); else next[index] = value;
    onChange(next.slice(0, max));
  };
  const add = () => { if (active.length < max) onChange([...active, 'new_desc']); };
  return <div className={'shared-sort-control ' + (compact ? 'compact' : '')}>
    {active.length ? active.map((key, index) => <div className="shared-sort-row" key={index}><b>{index + 1}</b><select value={key} onChange={(event) => updateAt(index, event.target.value)}>{PAGE_SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button title="Удалить критерий" onClick={() => updateAt(index, 'none')}><X size={12}/></button></div>) : <div className="shared-sort-empty">Сортировка не выбрана — сохраняется исходный порядок источника.</div>}
    <div className="shared-sort-actions">{active.length < max && <button onClick={add}><Plus size={12}/>Добавить критерий</button>}<span>При равенстве: дата добавления → артикул.</span></div>
  </div>;
}

function layoutDisplayName(type) {
  const raw = String(type?.label || type?.description || type?.id || 'Макет').replace(/^\d+\.\s*/, '');
  const replacements = {
    '2/3 + 1/3': 'Большой слева + узкий справа',
    '1/3 + 2/3': 'Узкий слева + большой справа',
    '1/2 + 1/4 + 1/4': 'Большой слева + 2 компактных справа',
    '1/4 + 1/4 + 1/2': '2 компактных слева + большой справа',
    '1/4 + 1/2 + 1/4': 'Большой по центру + компактные по краям',
    '3 равных · boxed': '3 равных · с полями',
    '4 равных · boxed': '4 равных · с полями',
    '2/3 + 1/3 · boxed': 'Большой слева + узкий справа · с полями',
    '1/3 + 2/3 · boxed': 'Узкий слева + большой справа · с полями',
    'Центр 10/12': 'Широкий блок по центру',
    'Центр 8/12': 'Узкий блок по центру',
    '8/12 слева': 'Широкий блок слева',
    '8/12 справа': 'Широкий блок справа',
    'Editorial pair 5/12 + 5/12': 'Два editorial-блока по центру',
  };
  if (replacements[raw]) return replacements[raw];
  return raw.replace(/boxed/gi, 'с полями').replace(/(\d+)\/(\d+)/g, '').replace(/\s*\+\s*/g, ' + ').replace(/\s{2,}/g, ' ').trim() || 'Макет секции';
}

function layoutPhotoUrl(product) {
  return product?.images?.[0] || product?.image || product?.src || '';
}

function LayoutPhotoPreview({ type, viewport = 'desktop' }) {
  const containers = viewport === 'mobile' && type?.mobileContainers?.length ? type.mobileContainers : type?.containers || [];
  let fallbackIndex = 0;
  return <div className="layout-photo-preview">{containers.map((container, ci) => <div className="layout-photo-container" key={ci} style={previewContainerStyle(container.container)}><div className="layout-photo-grid" style={{ gridTemplateColumns: 'repeat(' + container.cols + ',1fr)', columnGap: 3, rowGap: 3 }}>{container.slots.map((slot, index) => { const product = PRODUCTS[(slot.slotIndex ?? fallbackIndex++) % Math.max(PRODUCTS.length, 1)]; const url = layoutPhotoUrl(product); return <span key={index} style={{ gridColumn: slot.start ? slot.start + ' / span ' + slot.span : 'span ' + slot.span, gridRow: slot.rowStart ? slot.rowStart + ' / span ' + (slot.rows || 1) : slot.rows ? 'span ' + slot.rows : undefined }}>{url ? <img src={url} alt=""/> : <i/>}</span>; })}</div></div>)}</div>;
}

function sectionRuntimeMetrics(section) {
  const slots = section?.resolvedSlots || [];
  const filled = slots.filter((slot) => slot.entity).length;
  const productIds = slots.filter((slot) => slot.entity && 'price' in slot.entity).map((slot) => slot.entity.id);
  const counts = productIds.reduce((map, id) => map.set(id, (map.get(id) || 0) + 1), new Map());
  const conflicts = Array.from(counts.values()).filter((count) => count > 1).length;
  const autoIds = new Set(slots.filter((slot) => slot.status === 'auto' && slot.entity && 'price' in slot.entity).map((slot) => slot.entity.id));
  const reserve = Math.max(0, (section?.availableCandidates?.length || 0) - autoIds.size);
  return { coverage: slots.length ? Math.round(filled / slots.length * 100) : 0, reserve, pin: slots.filter((slot) => slot.status === 'pin').length, conflicts };
}

function pageRuntimeMetrics(resolution) {
  const slots = resolution?.sections?.flatMap((section) => section.resolvedSlots || []) || [];
  const productIds = slots.filter((slot) => slot.entity && 'price' in slot.entity).map((slot) => slot.entity.id);
  const counts = productIds.reduce((map, id) => map.set(id, (map.get(id) || 0) + 1), new Map());
  const conflicts = Array.from(counts.values()).filter((count) => count > 1).length;
  const capacity = resolution?.hasLayouts ? resolution.totalCapacity : Math.max(1, resolution?.displayed || 0);
  const filled = resolution?.hasLayouts ? slots.filter((slot) => slot.entity).length : resolution?.displayed || 0;
  return { coverage: capacity ? Math.round(filled / capacity * 100) : 0, reserve: resolution?.reserve?.length || 0, pin: resolution?.pinned || 0, conflicts };
}

function RuntimeStatusLine({ metrics, page = false }) {
  return <div className={'runtime-status-line ' + (page ? 'page' : 'section')}><span><b>Покрытие</b>{metrics.coverage}%</span><span><b>Резерв</b>{metrics.reserve}</span><span><b>📌 PIN</b>{metrics.pin}</span><span className={metrics.conflicts ? 'danger' : ''}><b>Конфликты SKU</b>{metrics.conflicts}</span></div>;
}

function SectionCanvasStatus({ section }) {
  return <RuntimeStatusLine metrics={sectionRuntimeMetrics(section)}/>;
}

function PageMerchTopStatus({ resolution, pageRules, onOpen }) {
  const metrics = pageRuntimeMetrics(resolution);
  return <div className="page-merch-top-status"><button className={pageRules?.enabled ? 'active' : ''} onClick={onOpen}><Sparkles size={13}/><span><strong>Правила наполнения страницы</strong><small>{pageRules?.enabled ? 'Активны' : 'Выключены'}</small></span></button><RuntimeStatusLine metrics={metrics} page/></div>;
}

function PageSectionNavigator({ sections, selectedId, onSelect, pageRules, resolution }) {
  const pageMetrics = pageRuntimeMetrics(resolution);
  return <aside className="page-section-navigator"><div className="section-nav-head"><span>СТРУКТУРА СТРАНИЦЫ</span><strong>{sections.length} секций</strong><small>{pageRules?.enabled ? 'Правила страницы активны' : 'Локальное наполнение'}</small></div><RuntimeStatusLine metrics={pageMetrics}/><div className="section-nav-list">{sections.map((section, index) => { const m = sectionRuntimeMetrics(section); const local = section?.rules?.inheritPageRules === false || section?.rules?.fillMode === 'rules'; return <button key={section.id} className={selectedId === section.id ? 'active' : ''} onClick={() => onSelect(section.id)}><b>{index + 1}</b><span><strong>{section.titles?.ru || 'Секция ' + (index + 1)}</strong><small>{layoutDisplayName(section.template)}</small><em className={local ? 'local' : 'page'}>{local ? 'LOCAL / OVERRIDE' : 'PAGE'}</em></span><i>{m.coverage}% · 📌{m.pin} · R{m.reserve}{m.conflicts ? ' · ⚠' + m.conflicts : ''}</i></button>; })}</div></aside>;
}

function sectionOverrideFlags(rules, pageRules) {
  const page = { ...PAGE_DEFAULT_RULES, ...(pageRules || {}) };
  const section = { ...DEFAULT_RULES, ...(rules || {}) };
  if (section.inheritPageRules === false) return [true, true, true, true, true];
  const sectionSorts = (section.sorts || []).filter((key) => key && key !== 'none');
  const pageSorts = (page.sorts || []).filter((key) => key && key !== 'none');
  const fallbackMap = page.fallbackMode === 'keep' ? 'keep' : page.fallbackMode === 'hide' ? 'collapse' : 'fallback';
  return [
    section.fillMode === 'rules' && validConditions(section).length > 0,
    sectionSorts.length > 0 && JSON.stringify(sectionSorts) !== JSON.stringify(pageSorts),
    Boolean(section.dedupe) !== Boolean(page.dedupeAcrossSections),
    section.colorMode && section.colorMode !== 'inherit' && (section.colorMode !== page.colorMode || Number(section.maxColors || 1) !== Number(page.maxColors || 1)),
    section.oos !== fallbackMap || (section.emptyBehavior || 'collapse-center') !== (page.noReserveBehavior || 'collapse-center'),
  ];
}

function RuleBlockTitle({ number, title, subtitle, overridden, inherited }) {
  return <div className="unified-rule-title"><b>{number}</b><span><strong>{title}</strong><small>{subtitle}</small></span>{overridden ? <em className="override">✎ Переопределено</em> : inherited ? <em>Наследует</em> : null}</div>;
}

function ProductSignal({ type, value }) {
  const number = Number(value || 0);
  const level = type === 'stock' ? (number >= 10 ? 'good' : number >= 3 ? 'warn' : 'bad') : (number >= 50 ? 'good' : number >= 20 ? 'warn' : 'bad');
  return <span className={'product-signal ' + level} title={type === 'stock' ? 'Демо-пороги остатка; требуют финального подтверждения' : 'Демо-пороги L7D; требуют финального подтверждения'}><b>{type === 'stock' ? 'Остаток' : 'Продажи L7D'}</b><em>{number}</em></span>;
}

`;
  app = app.slice(0, pageModalStart) + helpers + app.slice(pageModalStart);

  const modalStart = app.indexOf('function PageRulesModal(');
  const exportStart = app.indexOf('export default function AppV3()', modalStart);
  if (modalStart < 0 || exportStart < 0) throw new Error('UX_UNIFICATION_V18: PageRulesModal replacement anchors missing');
  const pageDrawer = String.raw`function PageRulesModal({ open, onClose, rules, onChange, region, resolution }) {
  if (!open) return null;
  const normalized = { ...PAGE_DEFAULT_RULES, ...(rules || {}), conditions: rules?.conditions || [], sorts: rules?.sorts || [] };
  const update = (patch) => onChange({ ...normalized, ...patch });
  const addCondition = () => {
    const first = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === 'department') || PRODUCT_RULE_ATTRIBUTES[0];
    update({ conditions: [...normalized.conditions, { id: 'page-rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), attribute: first.key, operator: 'eq', value: '' }] });
  };
  const updateCondition = (id, patch) => update({ conditions: normalized.conditions.map((condition) => condition.id === id ? { ...condition, ...patch } : condition) });
  const removeCondition = (id) => update({ conditions: normalized.conditions.filter((condition) => condition.id !== id) });
  const active = validConditions(normalized).length;
  const available = resolution.rawPool?.filter((product) => pageStock(product, region) > 0).length || 0;
  const metrics = pageRuntimeMetrics(resolution);
  return <div className="page-rules-slide-shell" aria-hidden={!open}>
    <aside className="page-rules-slide-over">
      <div className="page-slide-head"><div><span>ПРАВИЛА НАПОЛНЕНИЯ</span><strong>Вся страница</strong><small>Сначала общий пул → затем секции → резерв</small></div><button onClick={onClose}><X size={18}/></button></div>
      <div className="page-slide-summary"><label><input type="checkbox" checked={normalized.enabled} onChange={(event) => update({ enabled: event.target.checked })}/><span><strong>Автоматизировать страницу</strong><small>{normalized.enabled ? 'Общий пул активен' : 'Работают только правила секций и ручные PIN'}</small></span></label><RuntimeStatusLine metrics={metrics}/></div>
      <div className="page-slide-scroll">
        <section className="unified-rule-block"><RuleBlockTitle number="1" title="Отбор товаров" subtitle="Характеристики и логика И / ИЛИ"/><div className="rule-logic-toggle"><span>Товар соответствует</span><div><button className={normalized.conditionLogic === 'AND' ? 'active' : ''} onClick={() => update({ conditionLogic: 'AND' })}>Всем · И</button><button className={normalized.conditionLogic === 'OR' ? 'active' : ''} onClick={() => update({ conditionLogic: 'OR' })}>Любому · ИЛИ</button></div></div><div className="unified-condition-list">{normalized.conditions.map((condition, index) => { const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute) || PRODUCT_RULE_ATTRIBUTES[0]; const operators = RULE_OPERATORS[definition.type] || RULE_OPERATORS.text; const options = ruleAttributeOptions(definition.key, region); return <div className="unified-condition" key={condition.id || index}><b>{index + 1}</b><select value={condition.attribute} onChange={(event) => { const attribute = event.target.value; const nextDef = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === attribute) || PRODUCT_RULE_ATTRIBUTES[0]; updateCondition(condition.id, { attribute, operator: (RULE_OPERATORS[nextDef.type] || RULE_OPERATORS.text)[0][0], value: '' }); }}>{PRODUCT_RULE_ATTRIBUTES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select><select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value })}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{options.length ? <select value={String(condition.value ?? '')} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}><option value="">Значение</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={definition.type === 'number' ? 'number' : 'text'} value={condition.value ?? ''} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} placeholder="Значение"/>}<button onClick={() => removeCondition(condition.id)}><X size={12}/></button></div>; })}</div><button className="unified-add-rule" onClick={addCondition}><Plus size={12}/>Добавить условие</button><div className="candidate-strip unified-candidate-strip"><div><span>Подходит</span><strong>{resolution.rawPool?.length || 0}</strong></div><div><span>В наличии · {region}</span><strong>{available}</strong></div></div>{normalized.enabled && active > 0 && (resolution.rawPool?.length || 0) === 0 && <div className="explicit-zero-state"><AlertTriangle size={14}/><span><strong>0 товаров по выборке.</strong> Страница останется без товарного наполнения, пока правила не дадут результат.</span></div>}</section>

        <section className="unified-rule-block"><RuleBlockTitle number="2" title="Сортировка" subtitle="Один компонент и одинаковая логика на всех уровнях"/><MerchSortControl sorts={normalized.sorts} onChange={(sorts) => update({ sorts })}/></section>

        <section className="unified-rule-block"><RuleBlockTitle number="3" title="Распределение и резерв" subtitle="Макеты определяют ёмкость; без макетов — сетка 4 / 2"/><div className="layout-mode-card"><LayoutGrid size={16}/><span><strong>{resolution.hasLayouts ? 'Распределять по добавленным макетам' : 'Стандартная товарная сетка'}</strong><small>{resolution.hasLayouts ? resolution.totalCapacity + ' слотов на странице' : 'Desktop 4 в ряд · Mobile 2 в ряд'}</small></span></div>{resolution.hasLayouts && <div className="page-radio-group prominent"><label className={normalized.overflowMode === 'reserve' ? 'selected' : ''}><input type="radio" checked={normalized.overflowMode === 'reserve'} onChange={() => update({ overflowMode: 'reserve' })}/><span><strong>Оставить лишние товары в резерве</strong><small>Резерв используется для fallback.</small></span></label><label className={normalized.overflowMode === 'show-all' ? 'selected' : ''}><input type="radio" checked={normalized.overflowMode === 'show-all'} onChange={() => update({ overflowMode: 'show-all' })}/><span><strong>Распределить все</strong><small>После секций добавить стандартную сетку 4 / 2.</small></span></label></div>}<label className="page-rule-check"><input type="checkbox" checked={normalized.dedupeAcrossSections} onChange={(event) => update({ dedupeAcrossSections: event.target.checked })}/><span><strong>Не повторять один SKU между секциями</strong><small>Ручной 📌 PIN остаётся сильнее этого ограничения.</small></span></label><RuntimeStatusLine metrics={metrics}/></section>

        <section className="unified-rule-block"><RuleBlockTitle number="4" title="Цвета одной модели" subtitle="Ограничение применяется после сортировки"/><div className="color-mode-grid"><label className={normalized.colorMode === 'one' ? 'selected' : ''}><input type="radio" checked={normalized.colorMode === 'one'} onChange={() => update({ colorMode: 'one' })}/><span><strong>Товар в 1 цвете</strong><small>Первый цвет по текущей сортировке.</small></span></label><label className={normalized.colorMode === 'max' ? 'selected' : ''}><input type="radio" checked={normalized.colorMode === 'max'} onChange={() => update({ colorMode: 'max' })}/><span><strong>Не более N цветов</strong><small>Лимит на одну модель.</small></span>{normalized.colorMode === 'max' && <input type="number" min="1" max="12" value={normalized.maxColors || 2} onChange={(event) => update({ maxColors: Number(event.target.value || 1) })}/>}</label><label className={normalized.colorMode === 'all' ? 'selected' : ''}><input type="radio" checked={normalized.colorMode === 'all'} onChange={() => update({ colorMode: 'all' })}/><span><strong>Не ограничивать</strong><small>Все цвета могут участвовать.</small></span></label></div><div className="unified-helper">Какие цвета попадут на витрину: в порядке выбранной сортировки. Если сортировка не задана — в исходном порядке каталога.</div></section>

        <section className="unified-rule-block"><RuleBlockTitle number="5" title="Fallback" subtitle="Что делать, когда товар становится недоступен"/><div className="fallback-mode-grid"><label className={normalized.fallbackMode === 'replace' ? 'selected' : ''}><input type="radio" checked={normalized.fallbackMode === 'replace'} onChange={() => update({ fallbackMode: 'replace', preferColorFallback: true, noReserveBehavior: 'collapse-center' })}/><span><strong>Заменить</strong><small>Поддерживать заполненную витрину.</small></span></label><label className={normalized.fallbackMode === 'keep' ? 'selected' : ''}><input type="radio" checked={normalized.fallbackMode === 'keep'} onChange={() => update({ fallbackMode: 'keep' })}/><span><strong>Оставить на витрине</strong><small>Ничего не менять при OOS.</small></span></label></div>{normalized.fallbackMode === 'replace' && <div className="fallback-flow-v18"><span><b>1</b>Другой цвет модели</span><i>→</i><span><b>2</b>Товар из резерва</span><i>→</i><span><b>3</b>Схлопнуть слот + центрировать</span></div>}<div className="unified-helper">Ручной 📌 PIN не снимается правилами страницы. Его fallback настраивается на уровне секции.</div></section>
      </div>
      <div className="page-slide-footer"><span>Изменения видны на холсте сразу.</span><button onClick={onClose}>Готово</button></div>
    </aside>
  </div>;
}

`;
  app = app.slice(0, modalStart) + pageDrawer + app.slice(exportStart);

  const sectionPanelStart = app.indexOf('function SectionSettingsPanel(');
  const sectionPanelEnd = app.indexOf('function TypePreview(', sectionPanelStart);
  if (sectionPanelStart < 0 || sectionPanelEnd < 0) throw new Error('UX_UNIFICATION_V18: SectionSettingsPanel anchors missing');
  const sectionPanel = String.raw`function SectionSettingsPanel({ section, region, locale, pageRules, pageResolution, onChange, onDuplicate, onDelete }) {
  if (!section) return null;
  const rules = { ...DEFAULT_RULES, ...(section.rules || {}), conditions: section.rules?.conditions || [], sorts: section.rules?.sorts || [] };
  const updateRules = (patch) => onChange({ ...rules, ...patch });
  const conditions = rules.conditions || [];
  const activeRules = validConditions(rules).length;
  const matched = section.candidates?.length || 0;
  const available = section.availableCandidates?.length || 0;
  const inherit = rules.inheritPageRules !== false;
  const overrides = sectionOverrideFlags(rules, pageRules);
  const metrics = sectionRuntimeMetrics(section);
  const needsRules = rules.fillMode === 'rules' || rules.oos === 'fallback';
  const noRules = needsRules && activeRules === 0 && !inherit;
  const zeroResults = rules.fillMode === 'rules' && activeRules > 0 && matched === 0;
  const zeroAvailable = rules.fillMode === 'rules' && activeRules > 0 && matched > 0 && available === 0;
  const addCondition = () => { const first = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === 'category') || PRODUCT_RULE_ATTRIBUTES[0]; updateRules({ conditions: [...conditions, { id: 'rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), attribute: first.key, operator: 'eq', value: '' }] }); };
  const updateCondition = (id, patch) => updateRules({ conditions: conditions.map((condition) => condition.id === id ? { ...condition, ...patch } : condition) });
  const removeCondition = (id) => updateRules({ conditions: conditions.filter((condition) => condition.id !== id) });
  const pageFallback = pageRules?.fallbackMode === 'keep' ? 'keep' : 'fallback';
  const effectiveOos = inherit && !overrides[4] ? pageFallback : rules.oos;
  const scenario = rules.fillMode === 'rules' ? 'По правилам' : inherit && pageRules?.enabled ? 'По правилам страницы' : 'Вручную';
  return <div className="section-settings-v18">
    <div className="settings-v18-head"><div><span>ПРАВИЛА НАПОЛНЕНИЯ · СЕКЦИЯ</span><strong>{section.titles[locale] || section.titles.ru}</strong><small>{layoutDisplayName(section.template)}</small></div><div><button onClick={onDuplicate}><Copy size={14}/></button><button onClick={onDelete}><Trash2 size={14}/></button></div></div>
    <div className="pin-priority-banner"><Pin size={13}/><span><strong>📌 Ручной PIN сильнее правил страницы и секции.</strong><small>Автоматизация не перемещает закреплённый контент.</small></span></div>
    <label className="inherit-page-toggle"><input type="checkbox" checked={inherit} onChange={(event) => updateRules({ inheritPageRules: event.target.checked })}/><span><strong>Наследовать правила страницы</strong><small>{inherit ? 'PAGE → SECTION: локальные настройки работают как override.' : 'LOCAL ONLY: секция полностью независима от страницы.'}</small></span></label>
    <div className="section-scenario-badge"><span><strong>Сценарий: {scenario}</strong><small>OOS → {effectiveOos === 'fallback' ? 'заменить' : effectiveOos === 'collapse' ? 'скрыть' : 'оставить'} · {available} в наличии</small></span><RuntimeStatusLine metrics={metrics}/></div>
    {noRules && <div className="settings-v11-alert"><AlertTriangle size={14}/><span>Автозаполнение включено, но выборка не настроена.</span></div>}
    {zeroResults && <div className="explicit-zero-state"><AlertTriangle size={14}/><span><strong>0 товаров по выборке.</strong> {rules.emptyBehavior === 'collapse-center' ? 'Секция будет скрыта / схлопнута.' : 'Секция останется пустой.'}</span></div>}
    {zeroAvailable && <div className="explicit-zero-state"><AlertTriangle size={14}/><span><strong>Подходящие товары найдены, но 0 в наличии.</strong> Дальше сработает выбранный fallback.</span></div>}

    <section className="unified-rule-block"><RuleBlockTitle number="1" title="Отбор товаров" subtitle="Характеристики и логика И / ИЛИ" overridden={overrides[0]} inherited={inherit}/><div className="fill-mode-cards compact"><button className={rules.fillMode !== 'rules' ? 'active' : ''} onClick={() => updateRules({ fillMode: 'manual' })}><strong>Только ручное</strong><span>Не добавлять AUTO-товары локально.</span></button><button className={rules.fillMode === 'rules' ? 'active' : ''} onClick={() => updateRules({ fillMode: 'rules' })}><strong>Добавить локальные правила</strong><span>Сужают inherited master-pool.</span></button></div>{rules.fillMode === 'rules' && <><div className="rule-logic-toggle"><span>Товар соответствует</span><div><button className={rules.conditionLogic === 'AND' ? 'active' : ''} onClick={() => updateRules({ conditionLogic: 'AND' })}>Всем · И</button><button className={rules.conditionLogic === 'OR' ? 'active' : ''} onClick={() => updateRules({ conditionLogic: 'OR' })}>Любому · ИЛИ</button></div></div><div className="unified-condition-list">{conditions.map((condition, index) => { const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute) || PRODUCT_RULE_ATTRIBUTES[0]; const operators = RULE_OPERATORS[definition.type] || RULE_OPERATORS.text; const options = ruleAttributeOptions(definition.key, region); return <div className="unified-condition" key={condition.id || index}><b>{index + 1}</b><select value={condition.attribute} onChange={(event) => { const attribute = event.target.value; const nextDef = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === attribute) || PRODUCT_RULE_ATTRIBUTES[0]; updateCondition(condition.id, { attribute, operator: (RULE_OPERATORS[nextDef.type] || RULE_OPERATORS.text)[0][0], value: '' }); }}>{PRODUCT_RULE_ATTRIBUTES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select><select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value })}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{options.length ? <select value={String(condition.value ?? '')} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}><option value="">Значение</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={definition.type === 'number' ? 'number' : 'text'} value={condition.value ?? ''} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}/>}<button onClick={() => removeCondition(condition.id)}><X size={12}/></button></div>; })}</div><button className="unified-add-rule" onClick={addCondition}><Plus size={12}/>Добавить условие</button></>}<div className="candidate-strip unified-candidate-strip"><div><span>Подходит</span><strong>{matched}</strong></div><div><span>В наличии · {region}</span><strong>{available}</strong></div></div></section>

    <section className="unified-rule-block"><RuleBlockTitle number="2" title="Сортировка" subtitle="Тот же компонент, что на уровне страницы" overridden={overrides[1]} inherited={inherit}/><MerchSortControl sorts={rules.sorts || []} onChange={(sorts) => updateRules({ sorts, sortBy: sorts[0] || 'none' })} compact/></section>

    <section className="unified-rule-block"><RuleBlockTitle number="3" title="Распределение и резерв" subtitle="Товары занимают физические слоты текущего макета" overridden={overrides[2]} inherited={inherit}/><div className="layout-mode-card"><LayoutGrid size={15}/><span><strong>{layoutDisplayName(section.template)}</strong><small>{section.resolvedSlots.length} слотов · распределение слева направо по макету</small></span></div><label className="page-rule-check"><input type="checkbox" checked={Boolean(rules.dedupe)} onChange={(event) => updateRules({ dedupe: event.target.checked })}/><span><strong>Не повторять SKU внутри секции</strong><small>Межсекционные повторы управляются правилами страницы.</small></span></label><RuntimeStatusLine metrics={metrics}/></section>

    <section className="unified-rule-block"><RuleBlockTitle number="4" title="Цвета одной модели" subtitle="По умолчанию наследуются со страницы" overridden={overrides[3]} inherited={inherit}/><div className="color-mode-grid section"><label className={rules.colorMode === 'inherit' ? 'selected' : ''}><input type="radio" checked={rules.colorMode === 'inherit'} onChange={() => updateRules({ colorMode: 'inherit' })}/><span><strong>Наследовать</strong><small>Использовать лимит страницы.</small></span></label><label className={rules.colorMode === 'one' ? 'selected' : ''}><input type="radio" checked={rules.colorMode === 'one'} onChange={() => updateRules({ colorMode: 'one' })}/><span><strong>1 цвет</strong><small>Первый по сортировке.</small></span></label><label className={rules.colorMode === 'max' ? 'selected' : ''}><input type="radio" checked={rules.colorMode === 'max'} onChange={() => updateRules({ colorMode: 'max' })}/><span><strong>Не более N</strong><small>Локальный лимит.</small></span>{rules.colorMode === 'max' && <input type="number" min="1" max="12" value={rules.maxColors || 2} onChange={(event) => updateRules({ maxColors: Number(event.target.value || 1) })}/>}</label><label className={rules.colorMode === 'all' ? 'selected' : ''}><input type="radio" checked={rules.colorMode === 'all'} onChange={() => updateRules({ colorMode: 'all' })}/><span><strong>Все цвета</strong><small>Без ограничений.</small></span></label></div><div className="unified-helper">При превышении лимита остаются первые цвета после текущей сортировки.</div></section>

    <section className="unified-rule-block"><RuleBlockTitle number="5" title="Fallback" subtitle="Локальное поведение этой секции" overridden={overrides[4]} inherited={inherit}/><div className="oos-choice-grid"><button className={rules.oos === 'fallback' ? 'active' : ''} onClick={() => updateRules({ oos: 'fallback', emptyBehavior: 'collapse-center' })}><strong>Заменить</strong><span>Цвет → резерв → схлопнуть.</span></button><button className={rules.oos === 'collapse' ? 'active' : ''} onClick={() => updateRules({ oos: 'collapse' })}><strong>Скрыть слот</strong><span>Не показывать OOS.</span></button><button className={rules.oos === 'keep' ? 'active' : ''} onClick={() => updateRules({ oos: 'keep' })}><strong>Оставить</strong><span>Сохранить OOS на витрине.</span></button></div>{rules.oos === 'fallback' && <div className="fallback-flow-v18 compact"><span><b>1</b>Другой цвет</span><i>→</i><span><b>2</b>Резерв</span><i>→</i><span><b>3</b>Схлопнуть + центр</span></div>}</section>
  </div>;
}

`;
  app = app.slice(0, sectionPanelStart) + sectionPanel + app.slice(sectionPanelEnd);

  app = app.replace(/<SectionSettingsPanel section=\{selected\} region=\{region\} locale=\{locale\}/g, '<SectionSettingsPanel section={selected} region={region} locale={locale} pageRules={pageRules} pageResolution={pageResolution}');

  const mainAnchor = '<main className="builder-workspace">';
  if (!app.includes(mainAnchor)) throw new Error('UX_UNIFICATION_V18: builder-workspace anchor missing');
  app = app.replace(mainAnchor, '<PageMerchTopStatus resolution={pageResolution} pageRules={pageRules} onOpen={() => setShowPageRules(true)}/>' + mainAnchor + '<PageSectionNavigator sections={resolved} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setRightTab(\'settings\'); }} pageRules={pageRules} resolution={pageResolution}/>');

  const sectionCanvasStart = app.indexOf('function SectionCanvas(');
  const nextFunctionAfterCanvas = app.indexOf('\nfunction ', sectionCanvasStart + 20);
  if (sectionCanvasStart > -1 && nextFunctionAfterCanvas > sectionCanvasStart) {
    let chunk = app.slice(sectionCanvasStart, nextFunctionAfterCanvas);
    const containersAnchor = '<div className="section-containers">';
    if (chunk.includes(containersAnchor) && !chunk.includes('<SectionCanvasStatus section={section}/>')) chunk = chunk.replace(containersAnchor, '<SectionCanvasStatus section={section}/>' + containersAnchor);
    app = app.slice(0, sectionCanvasStart) + chunk + app.slice(nextFunctionAfterCanvas);
  }

  app = app.replace(/\{slot\.status === 'pin' && <em>PIN<\/em>\}/g, "{slot.status === 'pin' && <em className=\"pin-with-icon\"><Pin size={10}/>PIN</em>}");

  app = app.replace('<span className="metric looks"><b>ОБРАЗ</b><em>{lookValue}</em></span>', '');
  app = app.replace(/<div className="reference-position-rail"[^>]*>\{Array\.from\(\{ length: 10 \}[\s\S]*?<\/div>/, '<div className="reference-slot-target"><span>Слот →</span><b>{selectedSlot ? selectedSlot.slotIndex + 1 : \'drag\'}</b></div>');

  app = app.replace(/>Фильтры\{appliedProductFilterCount/g, '>Ещё фильтры{appliedProductFilterCount');

  app = app.replace(/\{type\.label \|\| type\.id\}/g, '{layoutDisplayName(type)}');
  app = app.replace(/\{selected\.template\.label \|\| selected\.typeId\}/g, '{layoutDisplayName(selected.template)}');
  app = app.replace(/\{section\.template\.label \|\| section\.typeId\}/g, '{layoutDisplayName(section.template)}');
  app = app.replace(/<TypePreview type=\{type\} compact viewport=\{device\}\/>/g, '<LayoutPhotoPreview type={type} viewport={device}/>');

  const editorStart = app.indexOf('function EditableEntityModal(');
  const productCardStart = app.indexOf('function ProductCard(', editorStart);
  if (editorStart < 0 || productCardStart < 0) throw new Error('UX_UNIFICATION_V18: EditableEntityModal anchors missing');
  const editor = String.raw`function EditableEntityModal({ entity, region = 'RU', onClose }) {
  const isProduct = Boolean(entity && Object.prototype.hasOwnProperty.call(entity, 'price'));
  const isLook = entity?.kind === 'look';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => editorDraft(entity, region));
  const [gallery, setGallery] = useState(() => editorImages(entity));
  const [saved, setSaved] = useState(false);
  const set = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setSaved(false); };
  const movePhoto = (index, direction) => { setGallery((items) => { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; }); setSaved(false); };
  const removePhoto = (index) => { setGallery((items) => items.filter((_, i) => i !== index)); setSaved(false); };
  const addPhotos = (files) => { const urls = Array.from(files || []).map((file) => URL.createObjectURL(file)); if (urls.length) setGallery((items) => [...items, ...urls]); setSaved(false); };
  const reset = () => { setDraft(editorDraft(entity, region)); setGallery(editorImages(entity)); setEditing(false); setSaved(false); };
  const save = () => {
    if (isProduct) {
      ['name','department','gender','category','subcategory','material','color','collection','silhouette','ageGroup','fit','length','sleeveLength','details'].forEach((key) => { entity[key] = String(draft[key] || '').trim(); });
      ['price','discount','l7d'].forEach((key) => { entity[key] = editorNumber(draft[key]); });
      entity.isNew = Boolean(draft.isNew);
      const stock = editorNumber(draft.stock); entity.stock = { ...(entity.stock || {}), [region]: stock }; if (region === 'RU' || entity.stockValue === undefined) entity.stockValue = stock;
      entity.images = [...gallery]; entity.image = gallery[0] || '';
    } else if (isLook) {
      ['name','nameEn','department','collection'].forEach((key) => { entity[key] = String(draft[key] || '').trim(); });
      entity.productIds = editorList(draft.productIds); entity.productCount = entity.productIds.length; entity.stockTotal = editorNumber(draft.stockTotal); entity.images = [...gallery]; entity.image = gallery[0] || '';
    } else {
      entity.name = String(draft.name || '').trim(); entity.kind = draft.kind; entity.file = String(draft.file || '').trim(); entity.src = String(draft.src || '').trim();
    }
    setEditing(false); setSaved(true);
  };
  const field = (key, label, type = 'text') => editing ? <label className={'editor-field ' + (type === 'textarea' ? 'wide' : '')} key={key}><span>{label}</span>{type === 'textarea' ? <textarea rows="3" value={draft[key] || ''} onChange={(event) => set(key, event.target.value)}/> : type === 'boolean' ? <div className="toggle-field"><input type="checkbox" checked={Boolean(draft[key])} onChange={(event) => set(key, event.target.checked)}/><b>{draft[key] ? 'Да' : 'Нет'}</b></div> : <input type={type === 'number' ? 'number' : 'text'} value={draft[key] ?? ''} onChange={(event) => set(key, event.target.value)}/>}</label> : <div className={'entity-view-field ' + (type === 'textarea' ? 'wide' : '')} key={key}><span>{label}</span><strong>{key === 'price' ? money(entity?.price || 0) : key === 'stock' ? (entity?.stock?.[region] ?? entity?.stockValue ?? 0) : key === 'isNew' ? (entity?.isNew ? 'Да' : 'Нет') : String(entity?.[key] ?? '—')}</strong></div>;
  const productGroups = [
    ['Идентификация', [field('name','Название'), <div className="entity-view-field" key="sku"><span>Артикул</span><strong>{entity?.id}</strong></div>]],
    ['Атрибуты', [field('department','Отдел'), field('gender','Гендер'), field('category','Категория'), field('subcategory','Подкатегория'), field('collection','Коллекция'), field('color','Цвет'), field('material','Материал'), field('silhouette','Силуэт / фасон'), field('fit','Посадка'), field('length','Длина изделия'), field('sleeveLength','Длина рукава'), field('ageGroup','Возрастная группа'), field('details','Детали','textarea')]],
    ['Коммерция', [field('price','Цена','number'), field('discount','Скидка, %','number'), field('isNew','Новинка','boolean')]],
  ];
  const preview = gallery[0] || entity?.src || entity?.image || '';
  return createPortal(<div className="entity-editor-backdrop" onClick={(event) => { event.stopPropagation(); onClose(); }}><div className={'entity-editor-modal grouped ' + (editing ? 'editing' : 'view')} onClick={(event) => event.stopPropagation()}><div className="entity-editor-head"><div><span>{isProduct ? 'ТОВАР' : isLook ? 'ОБРАЗ' : 'МЕДИАФАЙЛ'}</span><strong>{entity?.name || entity?.file || entity?.id}</strong><small>{entity?.id}{isProduct ? ' · ' + region : ''}</small></div><div className="entity-editor-actions">{saved && !editing && <em>Сохранено</em>}{editing ? <><button onClick={reset}>Отмена</button><button className="primary" onClick={save}>Сохранить</button></> : <button className="primary" onClick={() => { setDraft(editorDraft(entity, region)); setGallery(editorImages(entity)); setEditing(true); setSaved(false); }}>Редактировать</button>}<button className="close" onClick={onClose}><X size={18}/></button></div></div><div className="entity-editor-body"><aside className="entity-editor-preview"><div>{entity?.kind === 'video' && entity?.src ? <video src={entity.src} controls playsInline/> : preview ? <img src={preview} alt=""/> : <span className="empty"><ImageIcon size={34}/>Нет превью</span>}</div><span className={'editor-mode-pill ' + (editing ? 'editing' : 'view')}>{editing ? 'РЕЖИМ РЕДАКТИРОВАНИЯ' : 'РЕЖИМ ПРОСМОТРА'}</span></aside><section className="entity-editor-fields">{isProduct ? <>{productGroups.map(([title, fields]) => <div className="editor-group" key={title}><h4>{title}</h4><div className="entity-editor-grid">{fields}</div></div>)}<div className="editor-group"><h4>Остатки и продажи</h4><div className="editor-status-signals"><ProductSignal type="l7d" value={editing ? draft.l7d : entity?.l7d}/><ProductSignal type="stock" value={editing ? draft.stock : (entity?.stock?.[region] ?? entity?.stockValue)}/></div><div className="entity-editor-grid">{field('stock','Остаток · ' + region,'number')}{field('l7d','Продажи L7D','number')}</div></div><div className="editor-group"><h4>Медиа</h4><div className="gallery-editor">{gallery.map((src, index) => <div className="gallery-thumb" key={src + index}><img src={src} alt={'Фото ' + (index + 1)}/><b>{index + 1}</b>{editing && <div><button disabled={index === 0} onClick={() => movePhoto(index, -1)}>←</button><button disabled={index === gallery.length - 1} onClick={() => movePhoto(index, 1)}>→</button><button onClick={() => removePhoto(index)}>×</button></div>}</div>)}{editing && <label className="gallery-upload"><Plus size={16}/><span>Добавить фото</span><input type="file" accept="image/*" multiple onChange={(event) => { addPhotos(event.target.files); event.target.value = ''; }}/></label>}</div><small className="gallery-note">Первая фотография используется как основная. В режиме редактирования можно менять порядок.</small></div></> : isLook ? <><div className="editor-group"><h4>Идентификация и состав</h4><div className="entity-editor-grid">{field('name','Название RU')}{field('nameEn','Название EN')}{field('department','Отдел')}{field('collection','Коллекция')}{field('productIds','Артикулы товаров','textarea')}{field('stockTotal','Суммарный остаток','number')}</div></div><div className="editor-group"><h4>Медиа</h4><div className="gallery-editor">{gallery.map((src,index) => <div className="gallery-thumb" key={src+index}><img src={src} alt=""/><b>{index+1}</b></div>)}</div></div></> : <div className="editor-group"><h4>Файл</h4><div className="entity-editor-grid">{field('name','Название')}{field('file','Имя файла')}{field('src','URL / источник','textarea')}</div></div>}</section></div></div></div>, document.body);
}

`;
  app = app.slice(0, editorStart) + editor + app.slice(productCardStart);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* ux-unification-v18 */')) {
  css += String.raw`
/* ux-unification-v18 */
.page-rules-slide-shell{position:fixed;inset:0;z-index:150;pointer-events:none;background:transparent}.page-rules-slide-over{pointer-events:auto;position:absolute;top:0;right:0;width:min(590px,48vw);height:100vh;background:#fff;border-left:1px solid #dfe3e8;box-shadow:-18px 0 45px rgba(22,28,36,.12);display:flex;flex-direction:column;color:#242931}.page-slide-head{min-height:70px;padding:14px 16px;border-bottom:1px solid #e7eaee;display:flex;justify-content:space-between;gap:14px}.page-slide-head>div{display:grid;gap:3px}.page-slide-head span,.section-nav-head span,.settings-v18-head span{font-size:7px;font-weight:900;letter-spacing:.1em;color:#8b919a}.page-slide-head strong{font-size:17px}.page-slide-head small{font-size:8px;color:#7d838c}.page-slide-head>button{width:32px;height:32px;border:0;background:#f5f6f8;border-radius:7px;display:grid;place-items:center}.page-slide-summary{padding:10px 14px;border-bottom:1px solid #e7eaee;background:#fafbfc;display:grid;gap:9px}.page-slide-summary>label{display:flex;align-items:flex-start;gap:8px}.page-slide-summary>label span{display:grid;gap:2px}.page-slide-summary>label strong{font-size:10px}.page-slide-summary>label small{font-size:8px;color:#7e848d}.page-slide-scroll{min-height:0;overflow:auto;padding:12px 14px 30px}.page-slide-footer{min-height:55px;border-top:1px solid #e5e8ec;padding:10px 14px;display:flex;align-items:center;justify-content:space-between}.page-slide-footer span{font-size:8px;color:#7f858e}.page-slide-footer button{height:34px;border:0;border-radius:6px;background:#1d2127;color:#fff;padding:0 18px;font-size:9px;font-weight:800}.unified-rule-block{border:1px solid #e1e4e8;border-radius:9px;background:#fff;margin-bottom:9px;padding:11px}.unified-rule-title{display:grid;grid-template-columns:26px 1fr auto;align-items:start;gap:8px;margin-bottom:10px}.unified-rule-title>b{width:24px;height:24px;border-radius:50%;background:#20242a;color:#fff;display:grid;place-items:center;font-size:9px}.unified-rule-title>span{display:grid;gap:2px}.unified-rule-title strong{font-size:11px}.unified-rule-title small{font-size:8px;color:#828891}.unified-rule-title em{font-style:normal;font-size:7px;font-weight:800;color:#77808a;background:#f2f4f6;border-radius:999px;padding:4px 6px;white-space:nowrap}.unified-rule-title em.override{color:#6a4b00;background:#fff4cc}.unified-condition-list{display:grid;gap:5px;margin-top:8px}.unified-condition{display:grid;grid-template-columns:22px minmax(95px,1.2fr) 88px minmax(90px,1fr) 25px;gap:5px;align-items:center}.unified-condition>b{font-size:8px;color:#8c929a;text-align:center}.unified-condition select,.unified-condition input{min-width:0;width:100%;height:31px;border:1px solid #dfe2e6;border-radius:5px;background:#fff;padding:0 6px;font-size:8px}.unified-condition>button{width:25px;height:25px;border:0;background:#f4f5f6;border-radius:5px;display:grid;place-items:center}.unified-add-rule{height:31px;margin-top:7px;border:1px dashed #c9cdd3;border-radius:6px;background:#fafbfc;padding:0 9px;font-size:8px;font-weight:800;display:flex;align-items:center;gap:5px}.shared-sort-control{display:grid;gap:6px}.shared-sort-row{display:grid;grid-template-columns:24px 1fr 26px;gap:6px;align-items:center}.shared-sort-row>b{width:22px;height:22px;border-radius:50%;background:#f0f2f4;display:grid;place-items:center;font-size:8px}.shared-sort-row select{height:32px;border:1px solid #dfe2e6;border-radius:6px;background:#fff;padding:0 7px;font-size:8px}.shared-sort-row button{width:26px;height:26px;border:0;background:#f5f6f7;border-radius:5px}.shared-sort-empty{padding:9px;border:1px dashed #d6d9de;border-radius:6px;color:#858b94;font-size:8px}.shared-sort-actions{display:flex;align-items:center;justify-content:space-between;gap:8px}.shared-sort-actions button{height:28px;border:1px solid #d8dce1;border-radius:5px;background:#fff;padding:0 8px;font-size:8px;font-weight:800;display:flex;align-items:center;gap:4px}.shared-sort-actions span{font-size:7px;color:#8a9098;text-align:right}.layout-mode-card{display:flex;align-items:center;gap:8px;padding:9px;border:1px solid #dfe3e7;border-radius:7px;background:#f9fafb}.layout-mode-card>span{display:grid;gap:2px}.layout-mode-card strong{font-size:9px}.layout-mode-card small{font-size:8px;color:#838a93}.page-radio-group.prominent{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}.page-radio-group.prominent label,.color-mode-grid label,.fallback-mode-grid label{border:1px solid #dfe2e6;border-radius:7px;background:#fff;padding:8px;display:flex;align-items:flex-start;gap:6px}.page-radio-group.prominent label.selected,.color-mode-grid label.selected,.fallback-mode-grid label.selected{border-color:#30363d;background:#f7f8f9}.page-radio-group.prominent span,.color-mode-grid span,.fallback-mode-grid span{display:grid;gap:2px}.page-radio-group.prominent strong,.color-mode-grid strong,.fallback-mode-grid strong{font-size:8px}.page-radio-group.prominent small,.color-mode-grid small,.fallback-mode-grid small{font-size:7px;color:#838991;line-height:1.35}.color-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.color-mode-grid.section{grid-template-columns:1fr 1fr}.color-mode-grid label>input[type=number]{width:45px;height:26px;margin-left:auto;border:1px solid #d8dce1;border-radius:5px}.fallback-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.fallback-flow-v18{margin-top:8px;padding:9px;background:#20242a;color:#fff;border-radius:7px;display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:5px;align-items:center}.fallback-flow-v18 span{font-size:7px;display:flex;align-items:center;gap:5px}.fallback-flow-v18 span b{width:18px;height:18px;border-radius:50%;background:#fff;color:#222;display:grid;place-items:center}.fallback-flow-v18 i{font-style:normal;color:#7c828a}.fallback-flow-v18.compact{padding:7px}.unified-helper{margin-top:8px;padding:7px 8px;border-left:2px solid #b8bec7;background:#f7f8f9;color:#737a83;font-size:7px;line-height:1.45}.explicit-zero-state{margin:8px 0;padding:9px;border:1px solid #e8c7c2;background:#fff6f4;border-radius:7px;color:#934437;display:flex;gap:7px;align-items:flex-start;font-size:8px;line-height:1.4}.unified-candidate-strip{margin-top:8px}.runtime-status-line{display:flex;flex-wrap:wrap;gap:4px}.runtime-status-line>span{min-height:24px;border:1px solid #dde1e5;border-radius:5px;background:#fff;padding:4px 6px;display:flex;align-items:center;gap:5px;font-size:8px}.runtime-status-line>span b{font-size:7px;color:#7e858e}.runtime-status-line>span.danger{border-color:#e4b3ad;background:#fff1ef;color:#a23e34}.page-merch-top-status{position:sticky;top:100px;z-index:42;min-height:43px;background:rgba(255,255,255,.97);border-bottom:1px solid #e1e4e8;display:flex;align-items:center;justify-content:space-between;padding:6px 14px;gap:10px}.page-merch-top-status>button{height:31px;border:1px solid #dbe0e6;border-radius:6px;background:#fff;padding:0 9px;display:flex;align-items:center;gap:6px}.page-merch-top-status>button.active{background:#20242a;color:#fff;border-color:#20242a}.page-merch-top-status>button span{display:grid;text-align:left}.page-merch-top-status>button strong{font-size:8px}.page-merch-top-status>button small{font-size:7px;color:#858b94}.page-merch-top-status>button.active small{color:#bec4cc}.builder-workspace{grid-template-columns:210px minmax(0,1fr) 440px!important}.page-section-navigator{min-width:0;border-right:1px solid #e1e4e8;background:#fafbfc;position:sticky;top:143px;height:calc(100vh - 143px);overflow:auto}.section-nav-head{padding:12px;border-bottom:1px solid #e3e6ea;display:grid;gap:3px}.section-nav-head strong{font-size:12px}.section-nav-head small{font-size:8px;color:#858b94}.page-section-navigator>.runtime-status-line{padding:8px;border-bottom:1px solid #e5e8eb}.page-section-navigator>.runtime-status-line>span{padding:4px 5px}.section-nav-list{padding:7px}.section-nav-list>button{width:100%;border:1px solid transparent;background:transparent;border-radius:7px;padding:8px;display:grid;grid-template-columns:22px 1fr;gap:6px;text-align:left;position:relative;margin-bottom:4px}.section-nav-list>button.active{border-color:#b8c0ca;background:#fff}.section-nav-list>button>b{width:20px;height:20px;border-radius:50%;background:#e7eaee;display:grid;place-items:center;font-size:8px}.section-nav-list>button>span{display:grid;min-width:0}.section-nav-list strong{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.section-nav-list small{font-size:7px;color:#868c94;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.section-nav-list em{justify-self:start;margin-top:4px;font-style:normal;font-size:6px;font-weight:900;letter-spacing:.05em;border-radius:999px;padding:3px 5px;background:#eef2f7;color:#5d6877}.section-nav-list em.local{background:#fff0cb;color:#735400}.section-nav-list>button>i{grid-column:2;font-style:normal;font-size:7px;color:#737a83;margin-top:4px}.section-settings-v18{padding-bottom:30px}.settings-v18-head{padding:12px 13px;border-bottom:1px solid #e5e8ec;display:flex;justify-content:space-between}.settings-v18-head>div:first-child{display:grid;gap:3px}.settings-v18-head strong{font-size:13px}.settings-v18-head small{font-size:8px;color:#858b94}.settings-v18-head>div:last-child{display:flex;gap:4px}.settings-v18-head button{width:29px;height:29px;border:1px solid #e0e3e7;border-radius:6px;background:#fff;display:grid;place-items:center}.pin-priority-banner{margin:10px 12px 0;padding:9px;border:1px solid #ead89f;background:#fff9e7;border-radius:7px;display:flex;gap:7px}.pin-priority-banner span{display:grid;gap:2px}.pin-priority-banner strong{font-size:8px}.pin-priority-banner small{font-size:7px;color:#7b704d}.inherit-page-toggle{margin:8px 12px;padding:9px;border:1px solid #dfe3e8;border-radius:7px;background:#fafbfc;display:flex;align-items:flex-start;gap:7px}.inherit-page-toggle span{display:grid;gap:2px}.inherit-page-toggle strong{font-size:8px}.inherit-page-toggle small{font-size:7px;color:#7e858e}.section-scenario-badge{margin:8px 12px 10px;padding:9px;border:1px solid #dfe3e8;border-radius:7px;background:#fff;display:grid;gap:8px}.section-scenario-badge>span{display:grid;gap:2px}.section-scenario-badge strong{font-size:9px}.section-scenario-badge small{font-size:7px;color:#7f858d}.section-settings-v18>.unified-rule-block,.section-settings-v18>.explicit-zero-state,.section-settings-v18>.settings-v11-alert{margin-left:12px;margin-right:12px}.fill-mode-cards.compact{grid-template-columns:1fr 1fr}.builder-section .runtime-status-line.section{padding:6px 8px;border-top:1px solid #eceef1;border-bottom:1px solid #eceef1;background:#fafbfc}.builder-section .runtime-status-line.section>span{background:#fff}.pin-with-icon{display:inline-flex!important;align-items:center;gap:3px}.reference-position-rail{display:none!important}.reference-slot-target{position:absolute;left:6px;top:7px;z-index:9;display:grid;gap:2px;padding:5px 6px;background:rgba(255,255,255,.92);border:1px solid #aeb4bc}.reference-slot-target span{font-size:6px;font-weight:900;letter-spacing:.06em;color:#747a82}.reference-slot-target b{font-size:9px}.reference-commerce-stack{bottom:39px}.reference-commerce-stack .looks:empty{display:none}.simple-filter-toggle{min-width:92px}.layout-photo-preview{width:100%;height:100%;min-height:72px;padding:4px;background:#f3f4f5}.layout-photo-container{height:100%}.layout-photo-grid{height:100%;display:grid}.layout-photo-grid>span{min-height:28px;background:#e4e6e8;overflow:hidden}.layout-photo-grid img{width:100%;height:100%;object-fit:cover;display:block}.layout-photo-grid i{display:block;width:100%;height:100%;background:linear-gradient(135deg,#e1e3e6,#f4f5f6)}.entity-editor-modal.grouped .entity-editor-fields{padding:14px 18px 30px}.editor-group{padding:0 0 16px;margin-bottom:15px;border-bottom:1px solid #e6e9ed}.editor-group:last-child{border-bottom:0}.editor-group h4{margin:0 0 9px;font-size:9px;letter-spacing:.04em;text-transform:uppercase;color:#555d68}.editor-mode-pill{display:inline-block!important;margin-top:9px;padding:5px 7px;border-radius:999px;font-size:7px!important;font-weight:900!important;letter-spacing:.05em}.editor-mode-pill.view{background:#eef2f6;color:#5c6776}.editor-mode-pill.editing{background:#fff2c9;color:#765800}.editor-status-signals{display:flex;gap:6px;margin-bottom:9px}.product-signal{min-width:115px;border-radius:7px;padding:8px;display:flex;align-items:center;justify-content:space-between}.product-signal b{font-size:7px}.product-signal em{font-style:normal;font-size:14px;font-weight:900}.product-signal.good{background:#e9f7f0;color:#247456}.product-signal.warn{background:#fff5d9;color:#846400}.product-signal.bad{background:#fff0ee;color:#a13e35}.gallery-editor{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.gallery-thumb{position:relative;aspect-ratio:3/4;border:1px solid #dfe2e6;border-radius:6px;overflow:hidden;background:#f2f3f5}.gallery-thumb img{width:100%;height:100%;object-fit:cover}.gallery-thumb>b{position:absolute;left:4px;top:4px;width:20px;height:20px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;font-size:7px}.gallery-thumb>div{position:absolute;left:3px;right:3px;bottom:3px;display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.gallery-thumb>div button{height:24px;border:0;background:rgba(255,255,255,.92);font-size:10px}.gallery-upload{aspect-ratio:3/4;border:1px dashed #bfc5cd;border-radius:6px;background:#fafbfc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:#69727d;font-size:8px}.gallery-upload input{display:none}.gallery-note{display:block;margin-top:7px;font-size:7px;color:#858b94}.entity-editor-modal.grouped.view .editor-field{display:none}.entity-editor-modal.grouped.editing .entity-view-field:not(.editor-group .entity-view-field){opacity:.7}@media(max-width:1180px){.builder-workspace{grid-template-columns:180px minmax(0,1fr) 390px!important}.page-rules-slide-over{width:min(560px,62vw)}}@media(max-width:900px){.page-section-navigator{display:none}.builder-workspace{grid-template-columns:minmax(0,1fr)!important}.page-merch-top-status{top:100px}.page-rules-slide-over{width:min(540px,92vw)}.settings-panel{display:none!important}}`;
  writeFileSync(cssPath, css);
}

console.log('UX unification v18 applied');
