import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PAGE_RULES_V15';

if (!app.includes(MARKER)) {
  // V15 runs after page-rules-v14 and upgrades the page layer without changing section-rule UX.
  const defaultsRe = /const PAGE_DEFAULT_RULES = \{[^;]+\};/;
  if (!defaultsRe.test(app)) throw new Error('PAGE_RULES_V15: page defaults not found');
  app = app.replace(defaultsRe, "const PAGE_RULES_V15 = true;\nconst PAGE_DEFAULT_RULES = { enabled: false, conditionLogic: 'AND', conditions: [], sorts: [], dedupeAcrossSections: true, distribution: 'section-layouts', overflowMode: 'reserve', colorMode: 'one', maxColors: 2, fallbackMode: 'replace', preferColorFallback: true, noReserveBehavior: 'collapse-center' };");

  // Replace V14 page resolver. Section rules remain a local override over the page master-pool.
  const engineStart = app.indexOf('function buildPageCandidatePool(');
  const engineEnd = app.indexOf('function ruleAttributeOptions(', engineStart);
  if (engineStart < 0 || engineEnd < 0) throw new Error('PAGE_RULES_V15: engine anchors not found');

  const engine = `const PAGE_SORT_OPTIONS = [
  ['none', 'Не выбрано'],
  ['new_desc', 'Новизна · сначала самые новые'],
  ['new_asc', 'Новизна · сначала самые старые'],
  ['l7d_desc', 'Продажи L7D · сначала самые продаваемые'],
  ['l7d_asc', 'Продажи L7D · сначала менее продаваемые'],
  ['stock_desc', 'Остаток · сначала больший остаток'],
  ['stock_asc', 'Остаток · сначала меньший остаток'],
];

function pageStock(product, region) {
  return Number(product?.stock?.[region] ?? product?.stockValue ?? 0);
}

function pageFreshness(product) {
  const raw = product?.publishedAt || product?.published_at || product?.createdAt || product?.created_at || product?.releaseDate || product?.release_date;
  const parsed = raw ? Date.parse(raw) : NaN;
  if (Number.isFinite(parsed)) return parsed;
  const sourceIndex = PRODUCTS.findIndex((item) => item.id === product.id);
  return (product?.isNew ? 1000000 : 0) + Math.max(0, PRODUCTS.length - sourceIndex);
}

function pageProductFamily(product) {
  const explicit = product?.modelId || product?.model_id || product?.parentId || product?.parent_id || product?.familyId || product?.family_id;
  if (explicit) return String(explicit);
  return [product?.name, product?.category, product?.subcategory, product?.material, product?.silhouette, product?.fit, product?.length, product?.details, product?.price]
    .map((value) => String(value ?? '').trim().toLowerCase()).join('|');
}

function pageProductColor(product) {
  return String(product?.color || product?.tone || '').trim().toLowerCase() || 'no-color';
}

function productMatchesPageRules(product, rules, region) {
  const conditions = validConditions(rules);
  if (!conditions.length) return true;
  const results = conditions.map((condition) => matchesRuleCondition(product, condition, region));
  return (rules?.conditionLogic || 'AND') === 'OR' ? results.some(Boolean) : results.every(Boolean);
}

function comparePageSort(a, b, key, region) {
  switch (key) {
    case 'new_desc': return pageFreshness(b) - pageFreshness(a);
    case 'new_asc': return pageFreshness(a) - pageFreshness(b);
    case 'l7d_desc': return Number(b.l7d || 0) - Number(a.l7d || 0);
    case 'l7d_asc': return Number(a.l7d || 0) - Number(b.l7d || 0);
    case 'stock_desc': return pageStock(b, region) - pageStock(a, region);
    case 'stock_asc': return pageStock(a, region) - pageStock(b, region);
    default: return 0;
  }
}

function sortPageCandidates(items, rules, region) {
  const activeSorts = (rules?.sorts || []).filter((key) => key && key !== 'none');
  if (!activeSorts.length) return [...items];
  const sourceOrder = new Map(PRODUCTS.map((product, index) => [product.id, index]));
  return [...items].sort((a, b) => {
    for (const key of activeSorts) {
      const result = comparePageSort(a, b, key, region);
      if (result) return result;
    }
    return (sourceOrder.get(a.id) ?? 0) - (sourceOrder.get(b.id) ?? 0);
  });
}

function applyPageColorLimit(sorted, rules) {
  if (rules?.colorMode === 'all') return { displayPool: [...sorted], colorAlternates: [] };
  const maxColors = rules?.colorMode === 'max' ? Math.max(1, Number(rules.maxColors || 1)) : 1;
  const counts = new Map();
  const seenColors = new Map();
  const displayPool = [];
  const colorAlternates = [];
  sorted.forEach((product) => {
    const family = pageProductFamily(product);
    const color = pageProductColor(product);
    if (!seenColors.has(family)) seenColors.set(family, new Set());
    const colors = seenColors.get(family);
    const count = counts.get(family) || 0;
    if (colors.has(color)) {
      colorAlternates.push(product);
      return;
    }
    if (count < maxColors) {
      colors.add(color);
      counts.set(family, count + 1);
      displayPool.push(product);
    } else {
      colorAlternates.push(product);
    }
  });
  return { displayPool, colorAlternates };
}

function buildPageCandidatePool(pageRules, region) {
  const rules = { ...PAGE_DEFAULT_RULES, ...(pageRules || {}), conditions: pageRules?.conditions || [], sorts: pageRules?.sorts || [] };
  const matched = rules.enabled ? PRODUCTS.filter((product) => productMatchesPageRules(product, rules, region)) : PRODUCTS;
  const rawPool = sortPageCandidates(matched, rules, region);
  const limited = applyPageColorLimit(rawPool, rules);
  return { rawPool, displayPool: limited.displayPool, colorAlternates: limited.colorAlternates };
}

function findColorFallback(original, rawCandidates, pageContext, usedInSection, region) {
  if (!pageContext?.preferColorFallback) return null;
  const family = pageProductFamily(original);
  const color = pageProductColor(original);
  return rawCandidates.find((candidate) => pageProductFamily(candidate) === family
    && pageProductColor(candidate) !== color
    && pageStock(candidate, region) > 0
    && !usedInSection.has(candidate.id)
    && !pageContext.usedAcross.has(candidate.id)
    && !pageContext.pinnedAcross.has(candidate.id));
}

function resolveSection(section, region, pageContext = null) {
  const rules = { ...DEFAULT_RULES, ...(section.rules || {}) };
  const conditions = validConditions(rules);
  const useSectionRules = rules.fillMode === 'rules';
  const inheritPageRules = Boolean(pageContext?.enabled && rules.inheritPageRules !== false);
  const applySectionConditions = useSectionRules && conditions.length > 0;
  const basePool = inheritPageRules ? pageContext.pool : PRODUCTS;
  const rawBasePool = inheritPageRules ? pageContext.rawPool : PRODUCTS;

  let allCandidates = [];
  let rawCandidates = [];
  if (inheritPageRules) {
    allCandidates = applySectionConditions ? basePool.filter((product) => productMatchesSectionRules(product, rules, region)) : [...basePool];
    rawCandidates = applySectionConditions ? rawBasePool.filter((product) => productMatchesSectionRules(product, rules, region)) : [...rawBasePool];
    if (applySectionConditions) allCandidates = sortCandidates(allCandidates, rules, region);
  } else if (useSectionRules && conditions.length) {
    allCandidates = sortCandidates(PRODUCTS.filter((product) => productMatchesSectionRules(product, rules, region)), rules, region);
    rawCandidates = [...allCandidates];
  } else if (rules.oos === 'fallback' && conditions.length) {
    allCandidates = sortCandidates(PRODUCTS.filter((product) => productMatchesSectionRules(product, rules, region)), rules, region);
    rawCandidates = [...allCandidates];
  }

  const usedInSection = new Set();
  const blockedForAuto = (product) => {
    if (!inheritPageRules || !pageContext.dedupeAcrossSections) return false;
    return pageContext.usedAcross.has(product.id) || pageContext.pinnedAcross.has(product.id) || pageContext.skippedAcross.has(product.id);
  };
  const rememberAuto = (product) => {
    if (inheritPageRules && product?.id) pageContext.usedAcross.add(product.id);
  };
  const rememberSkipped = (product) => {
    if (inheritPageRules && product?.id) pageContext.skippedAcross.add(product.id);
  };
  const nextUnblocked = () => allCandidates.find((product) => !usedInSection.has(product.id) && !blockedForAuto(product));
  const nextInStock = () => allCandidates.find((product) => pageStock(product, region) > 0 && !usedInSection.has(product.id) && !blockedForAuto(product));

  const takePageCandidate = () => {
    const candidate = nextUnblocked();
    if (!candidate) return null;
    if (!inheritPageRules || pageContext.fallbackMode === 'keep' || pageStock(candidate, region) > 0) {
      usedInSection.add(candidate.id);
      rememberAuto(candidate);
      return { product: candidate, warning: pageStock(candidate, region) <= 0 ? 'Нет в наличии · оставлен по правилу страницы' : null, fallback: false };
    }

    usedInSection.add(candidate.id);
    rememberSkipped(candidate);
    const colorFallback = findColorFallback(candidate, rawCandidates, pageContext, usedInSection, region);
    if (colorFallback) {
      usedInSection.add(colorFallback.id);
      rememberAuto(colorFallback);
      return { product: colorFallback, warning: 'Другой цвет той же модели', fallback: true };
    }

    const reserveFallback = nextInStock();
    if (reserveFallback) {
      usedInSection.add(reserveFallback.id);
      rememberAuto(reserveFallback);
      return { product: reserveFallback, warning: 'Замена из резерва', fallback: true };
    }
    return null;
  };

  const resolvedSlots = Array.from({ length: slotCount(section.template) }, (_, index) => {
    const pinId = section.pins[index];
    if (pinId) {
      const entity = getEntity(pinId);
      if (!entity) return { index, status: 'empty', entity: null, warning: 'Контент не найден' };
      if (entityKind(pinId) !== 'product') return { index, status: 'pin', entity, origin: 'manual' };

      // Manual intent is never overwritten by page rules. PIN fallback remains a section-level decision.
      const available = pageStock(entity, region) > 0;
      usedInSection.add(entity.id);
      if (available) return { index, status: 'pin', entity, origin: 'manual' };
      if (rules.oos === 'keep') return { index, status: 'pin', entity, warning: 'Нет в наличии', origin: 'manual' };
      if (rules.oos === 'collapse') return emptySlotResult(index, { ...rules, emptyBehavior: 'collapse-center' }, 'PIN скрыт: нет в наличии');
      if (rules.oos === 'fallback') {
        const replacement = allCandidates.find((product) => pageStock(product, region) > 0 && !usedInSection.has(product.id) && !blockedForAuto(product));
        if (replacement) {
          usedInSection.add(replacement.id);
          rememberAuto(replacement);
          return { index, status: 'auto', entity: replacement, warning: 'Автозамена PIN по правилам секции', origin: inheritPageRules ? 'page+section' : 'section' };
        }
        return { index, status: 'pin', entity, warning: 'Нет в наличии · замена не найдена', origin: 'manual' };
      }
    }

    if (!inheritPageRules && !useSectionRules) return { index, status: 'empty', entity: null };
    if (!inheritPageRules && useSectionRules && !conditions.length) return { index, status: 'empty', entity: null, warning: 'Настройте правила отбора' };

    const picked = inheritPageRules ? takePageCandidate() : (() => {
      const next = nextInStock();
      if (!next) return null;
      usedInSection.add(next.id);
      return { product: next, warning: null, fallback: false };
    })();

    if (!picked) {
      const collapseRules = inheritPageRules && pageContext.fallbackMode === 'replace'
        ? { ...rules, emptyBehavior: pageContext.noReserveBehavior }
        : rules;
      return emptySlotResult(index, collapseRules, 'Нет подходящего товара');
    }
    return { index, status: 'auto', entity: picked.product, warning: picked.warning, origin: inheritPageRules ? (applySectionConditions ? 'page+section' : 'page') : 'section' };
  });

  return { ...section, rules, inheritPageRules, resolvedSlots, candidates: allCandidates, availableCandidates: allCandidates.filter((product) => pageStock(product, region) > 0) };
}

function resolveStandardGrid(items, rawPool, rules, region, blockedIds = new Set()) {
  const result = [];
  const used = new Set(blockedIds);
  const skipped = new Set();
  for (const candidate of items) {
    if (used.has(candidate.id) || skipped.has(candidate.id)) continue;
    if (rules.fallbackMode === 'keep' || pageStock(candidate, region) > 0) {
      result.push({ product: candidate, warning: pageStock(candidate, region) <= 0 ? 'Нет в наличии' : null });
      used.add(candidate.id);
      continue;
    }
    skipped.add(candidate.id);
    const family = pageProductFamily(candidate);
    const color = pageProductColor(candidate);
    const colorFallback = rules.preferColorFallback ? rawPool.find((item) => pageProductFamily(item) === family && pageProductColor(item) !== color && pageStock(item, region) > 0 && !used.has(item.id) && !skipped.has(item.id)) : null;
    if (colorFallback) {
      result.push({ product: colorFallback, warning: 'Другой цвет той же модели' });
      used.add(colorFallback.id);
      continue;
    }
    const reserveFallback = items.find((item) => pageStock(item, region) > 0 && !used.has(item.id) && !skipped.has(item.id));
    if (reserveFallback) {
      result.push({ product: reserveFallback, warning: 'Замена из резерва' });
      used.add(reserveFallback.id);
    }
  }
  return result;
}

function resolvePageSections(sections, region, pageRules) {
  const rules = { ...PAGE_DEFAULT_RULES, ...(pageRules || {}), conditions: pageRules?.conditions || [], sorts: pageRules?.sorts || [] };
  const poolData = buildPageCandidatePool(rules, region);
  const pinnedAcross = new Set(sections.flatMap((section) => Object.values(section.pins || {})).filter((id) => entityKind(id) === 'product'));
  const pageContext = {
    enabled: Boolean(rules.enabled),
    pool: poolData.displayPool,
    rawPool: poolData.rawPool,
    usedAcross: new Set(),
    skippedAcross: new Set(),
    pinnedAcross,
    dedupeAcrossSections: Boolean(rules.dedupeAcrossSections),
    fallbackMode: rules.fallbackMode,
    preferColorFallback: Boolean(rules.preferColorFallback),
    noReserveBehavior: rules.noReserveBehavior,
  };

  const resolvedSections = sections.map((section) => resolveSection(section, region, pageContext));
  const allSlots = resolvedSections.flatMap((section) => section.resolvedSlots);
  const productSlots = allSlots.filter((slot) => slot.entity && entityKind(slot.entity.id) === 'product');
  const displayedIds = new Set(productSlots.map((slot) => slot.entity.id));
  const undisplayed = poolData.displayPool.filter((product) => !displayedIds.has(product.id) && !pageContext.skippedAcross.has(product.id));

  let autoGrid = [];
  let reserve = undisplayed;
  if (rules.enabled && !sections.length) {
    autoGrid = resolveStandardGrid(poolData.displayPool, poolData.rawPool, rules, region, new Set());
    reserve = [];
  } else if (rules.enabled && sections.length && rules.overflowMode === 'show-all') {
    autoGrid = resolveStandardGrid(undisplayed, poolData.rawPool, rules, region, displayedIds);
    reserve = [];
  }

  return {
    sections: resolvedSections,
    pool: poolData.displayPool,
    rawPool: poolData.rawPool,
    colorReserve: poolData.colorAlternates,
    reserve,
    autoGrid,
    hasLayouts: sections.length > 0,
    totalCapacity: resolvedSections.reduce((sum, section) => sum + slotCount(section.template), 0),
    pinned: allSlots.filter((slot) => slot.status === 'pin').length,
    auto: allSlots.filter((slot) => slot.status === 'auto').length + autoGrid.length,
    displayed: productSlots.length + autoGrid.length,
  };
}

`;
  app = app.slice(0, engineStart) + engine + app.slice(engineEnd);

  // Replace the V14 modal with a task-oriented five-step editor.
  const modalStart = app.indexOf('function PageRulesModal(');
  const exportStart = app.indexOf('export default function AppV3()', modalStart);
  if (modalStart < 0 || exportStart < 0) throw new Error('PAGE_RULES_V15: modal anchors not found');

  const modal = `function PageAutoGrid({ items, region, device, hasLayouts }) {
  if (!items?.length) return null;
  return <div className={'page-auto-grid-wrap ' + (device === 'mobile' ? 'mobile' : 'desktop')}>
    <div className="page-auto-grid-head"><div><span>{hasLayouts ? 'АВТОМАТИЧЕСКОЕ ПРОДОЛЖЕНИЕ' : 'СТАНДАРТНАЯ ТОВАРНАЯ СЕТКА'}</span><strong>{hasLayouts ? 'Остальные товары' : 'Товары страницы'}</strong></div><em>{device === 'mobile' ? '2 В РЯД' : '4 В РЯД'}</em></div>
    <div className="page-auto-grid">{items.map((item, index) => <div key={item.product.id + '-' + index} className="page-auto-grid-item"><ProductCard product={item.product} region={region}/>{item.warning && <span className="page-auto-grid-warning">{item.warning}</span>}</div>)}</div>
  </div>;
}

function PageRulesModal({ open, onClose, rules, onChange, region, resolution }) {
  if (!open) return null;
  const normalized = { ...PAGE_DEFAULT_RULES, ...(rules || {}), conditions: rules?.conditions || [], sorts: rules?.sorts || [] };
  const update = (patch) => onChange({ ...normalized, ...patch });
  const addCondition = () => {
    const first = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === 'department') || PRODUCT_RULE_ATTRIBUTES[0];
    update({ conditions: [...normalized.conditions, { id: 'page-rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), attribute: first.key, operator: 'eq', value: '' }] });
  };
  const updateCondition = (id, patch) => update({ conditions: normalized.conditions.map((condition) => condition.id === id ? { ...condition, ...patch } : condition) });
  const removeCondition = (id) => update({ conditions: normalized.conditions.filter((condition) => condition.id !== id) });
  const addSort = () => { if (normalized.sorts.length < 3) update({ sorts: [...normalized.sorts, 'none'] }); };
  const updateSort = (index, value) => update({ sorts: normalized.sorts.map((item, itemIndex) => itemIndex === index ? value : item) });
  const removeSort = (index) => update({ sorts: normalized.sorts.filter((_, itemIndex) => itemIndex !== index) });
  const active = validConditions(normalized).length;
  const layoutSummary = resolution.hasLayouts ? resolution.totalCapacity + ' слотов в ' + resolution.sections.length + ' секц.' : '4 desktop / 2 mobile';

  return <div className="modal-backdrop page-rules-backdrop" onClick={onClose}>
    <div className="page-rules-modal page-rules-v15-modal" onClick={(event) => event.stopPropagation()}>
      <div className="page-rules-head page-rules-v15-head">
        <div><span>ГЛОБАЛЬНЫЕ ПРАВИЛА АВТОМАТИЗАЦИИ</span><h2>Наполнение страницы</h2><p>Правила страницы задают общий сценарий. Правила конкретной секции могут дополнительно сузить или переопределить выбор товаров.</p></div>
        <button onClick={onClose}><X size={18}/></button>
      </div>

      <div className="page-rules-body page-rules-v15-body">
        <div className="page-rules-editor-column page-rules-v15-editor">
          <div className="page-rule-master page-rule-master-v15"><label><input type="checkbox" checked={normalized.enabled} onChange={(event) => update({ enabled: event.target.checked })}/><span><strong>Автоматизировать наполнение страницы</strong><small>{normalized.enabled ? 'Включено · правила применяются ко всем секциям, которые наследуют настройки страницы' : 'Выключено · работают только правила отдельных секций'}</small></span><em>{normalized.enabled ? 'ON' : 'OFF'}</em></label></div>

          <section className="page-rule-step">
            <div className="page-rule-step-head"><b>1</b><div><strong>Отбор товаров</strong><span>Какие товары могут участвовать в наполнении страницы</span></div><em>{active ? active + ' усл.' : 'Весь каталог'}</em></div>
            <div className="page-rule-step-body">
              <div className="page-logic-switch"><span>Товар должен соответствовать</span><div><button className={normalized.conditionLogic === 'AND' ? 'active' : ''} onClick={() => update({ conditionLogic: 'AND' })}>ВСЕМ · И</button><button className={normalized.conditionLogic === 'OR' ? 'active' : ''} onClick={() => update({ conditionLogic: 'OR' })}>ЛЮБОМУ · ИЛИ</button></div></div>
              <div className="rule-cards">{normalized.conditions.map((condition, index) => {
                const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute) || PRODUCT_RULE_ATTRIBUTES[0];
                const operators = RULE_OPERATORS[definition.type] || RULE_OPERATORS.text;
                const options = ruleAttributeOptions(definition.key, region);
                return <React.Fragment key={condition.id || index}>
                  {index > 0 && <div className="rule-joiner page-rule-joiner">{normalized.conditionLogic === 'AND' ? 'И' : 'ИЛИ'}</div>}
                  <div className="rule-condition-card page-condition-v15"><div className="rule-condition-head"><span>Условие {index + 1}</span><button title="Удалить" onClick={() => removeCondition(condition.id)}><Trash2 size={13}/></button></div><select className="rule-field" value={condition.attribute} onChange={(event) => { const attribute = event.target.value; const nextDef = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === attribute) || PRODUCT_RULE_ATTRIBUTES[0]; updateCondition(condition.id, { attribute, operator: (RULE_OPERATORS[nextDef.type] || RULE_OPERATORS.text)[0][0], value: '' }); }}>{PRODUCT_RULE_ATTRIBUTES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select><div className="rule-value-row"><select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value })}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{options.length ? <select value={String(condition.value ?? '')} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}><option value="">Выберите значение</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={definition.type === 'number' ? 'number' : 'text'} value={condition.value ?? ''} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} placeholder="Значение"/>}</div></div>
                </React.Fragment>;
              })}{!normalized.conditions.length && <div className="rules-empty-state page-rules-empty"><strong>Нет ограничений</strong><span>В общий пул попадает весь каталог. Можно добавить условия по отделу, категории, коллекции, цене, цвету, остатку, продажам и другим характеристикам.</span></div>}</div>
              <div className="rule-actions"><button className="rule-add" onClick={addCondition}><Plus size={13}/>Добавить условие</button>{normalized.conditions.length > 0 && <button className="rule-clear" onClick={() => update({ conditions: [] })}>Очистить</button>}</div>
            </div>
          </section>

          <section className="page-rule-step">
            <div className="page-rule-step-head"><b>2</b><div><strong>Сортировка</strong><span>В каком порядке товары получают приоритет</span></div><em>{normalized.sorts.filter((item) => item !== 'none').length ? normalized.sorts.filter((item) => item !== 'none').length + ' ур.' : 'Не выбрано'}</em></div>
            <div className="page-rule-step-body"><div className="page-sort-list">{normalized.sorts.map((sort, index) => <div className="page-sort-row" key={index}><b>{index + 1}</b><select value={sort} onChange={(event) => updateSort(index, event.target.value)}>{PAGE_SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button title="Удалить" onClick={() => removeSort(index)}><X size={13}/></button></div>)}{!normalized.sorts.length && <div className="page-inline-empty"><span>Сохранять исходный порядок источника</span><small>Если сортировка не выбрана, система не меняет порядок кандидатов.</small></div>}</div><button className="page-add-sort" disabled={normalized.sorts.length >= 3} onClick={addSort}><Plus size={13}/>Добавить параметр сортировки</button></div>
          </section>

          <section className="page-rule-step">
            <div className="page-rule-step-head"><b>3</b><div><strong>Распределение и резерв</strong><span>Как общий пул превращается в витрину</span></div><em>{layoutSummary}</em></div>
            <div className="page-rule-step-body">
              <div className="page-layout-decision"><div className={resolution.hasLayouts ? 'active' : ''}><LayoutGrid size={17}/><span><strong>Есть макеты секций</strong><small>Товары распределяются по макетам сверху вниз, слоты — слева направо.</small></span><em>{resolution.hasLayouts ? 'ИСПОЛЬЗУЕТСЯ' : 'НЕТ'}</em></div><div className={!resolution.hasLayouts ? 'active' : ''}><Monitor size={17}/><span><strong>Макетов нет</strong><small>Система создаёт стандартную сетку: 4 товара в ряд desktop / 2 mobile.</small></span><em>{!resolution.hasLayouts ? 'ИСПОЛЬЗУЕТСЯ' : 'РЕЗЕРВ'}</em></div></div>
              {resolution.hasLayouts && <div className="page-radio-group"><label className={normalized.overflowMode === 'reserve' ? 'selected' : ''}><input type="radio" name="page-overflow" checked={normalized.overflowMode === 'reserve'} onChange={() => update({ overflowMode: 'reserve' })}/><span><strong>Оставить лишние товары в резерве</strong><small>На витрине сохраняются только добавленные макеты. Резерв используется для автоматических замен.</small></span></label><label className={normalized.overflowMode === 'show-all' ? 'selected' : ''}><input type="radio" name="page-overflow" checked={normalized.overflowMode === 'show-all'} onChange={() => update({ overflowMode: 'show-all' })}/><span><strong>Распределить все товары</strong><small>После последней секции оставшиеся товары выводятся стандартной сеткой 4 / 2 в ряд.</small></span></label></div>}
              <label className="page-rule-check page-dedupe-check"><input type="checkbox" checked={normalized.dedupeAcrossSections} onChange={(event) => update({ dedupeAcrossSections: event.target.checked })}/><span><strong>Не повторять один и тот же SKU между секциями</strong><small>Ручной PIN имеет приоритет и может осознанно повторить товар.</small></span></label>
            </div>
          </section>

          <section className="page-rule-step">
            <div className="page-rule-step-head"><b>4</b><div><strong>Цвета одной модели</strong><span>Сколько цветовых вариантов одного товара может быть на странице</span></div><em>{normalized.colorMode === 'one' ? '1 цвет' : normalized.colorMode === 'max' ? 'до ' + normalized.maxColors : 'Без лимита'}</em></div>
            <div className="page-rule-step-body"><div className="page-color-options"><label className={normalized.colorMode === 'one' ? 'selected' : ''}><input type="radio" name="page-colors" checked={normalized.colorMode === 'one'} onChange={() => update({ colorMode: 'one' })}/><span><strong>Товар в одном цвете</strong><small>В основной пул проходит только один лучший цвет модели.</small></span></label><label className={normalized.colorMode === 'max' ? 'selected' : ''}><input type="radio" name="page-colors" checked={normalized.colorMode === 'max'} onChange={() => update({ colorMode: 'max' })}/><span><strong>Не более N цветов</strong><small>Ограничить число разных цветов одной модели.</small></span>{normalized.colorMode === 'max' && <input className="page-color-number" type="number" min="1" max="12" value={normalized.maxColors} onChange={(event) => update({ maxColors: Math.max(1, Number(event.target.value || 1)) })}/>}</label><label className={normalized.colorMode === 'all' ? 'selected' : ''}><input type="radio" name="page-colors" checked={normalized.colorMode === 'all'} onChange={() => update({ colorMode: 'all' })}/><span><strong>Не ограничивать</strong><small>Все цветовые варианты могут участвовать в распределении.</small></span></label></div><div className="page-color-note"><Sparkles size={14}/><span>Неиспользованные цвета не теряются: при автоматической замене система может сначала попробовать другой доступный цвет той же модели.</span></div></div>
          </section>

          <section className="page-rule-step">
            <div className="page-rule-step-head"><b>5</b><div><strong>Fallback при отсутствии товара</strong><span>Что делать, когда AUTO-товар становится недоступен</span></div><em>{normalized.fallbackMode === 'keep' ? 'Оставить OOS' : 'Автозамена'}</em></div>
            <div className="page-rule-step-body"><div className="page-radio-group fallback-radio"><label className={normalized.fallbackMode === 'replace' ? 'selected' : ''}><input type="radio" name="page-fallback" checked={normalized.fallbackMode === 'replace'} onChange={() => update({ fallbackMode: 'replace' })}/><span><strong>Автоматически заменить</strong><small>Система проходит цепочку fallback и сохраняет заполненность витрины.</small></span></label><label className={normalized.fallbackMode === 'keep' ? 'selected' : ''}><input type="radio" name="page-fallback" checked={normalized.fallbackMode === 'keep'} onChange={() => update({ fallbackMode: 'keep' })}/><span><strong>Ничего не делать — оставить товар на витрине</strong><small>Карточка остаётся на своей позиции даже при нулевом остатке.</small></span></label></div>{normalized.fallbackMode === 'replace' && <><label className="page-rule-check page-color-fallback-check"><input type="checkbox" checked={normalized.preferColorFallback} onChange={(event) => update({ preferColorFallback: event.target.checked })}/><span><strong>Сначала искать другой цвет той же модели</strong><small>Если доступного цвета нет, используется следующий товар из резерва.</small></span></label><div className="page-fallback-chain-v15"><div><b>1</b><span>Другой доступный цвет модели</span></div><i>→</i><div><b>2</b><span>Следующий товар из резерва</span></div><i>→</i><div><b>3</b><span>Схлопнуть слот и центрировать секцию</span></div></div><small className="page-fallback-caption">Замена происходит в освободившейся позиции. Остальные слоты секции не пересобираются.</small></>}</div>
          </section>

          <div className="page-pin-principle"><Pin size={15}/><span><strong>Ручной PIN всегда сильнее правил страницы</strong><small>Глобальная автоматизация не снимает и не перемещает вручную закреплённый контент. Его OOS-поведение задаётся на уровне секции.</small></span></div>
        </div>

        <aside className="page-rules-preview page-rules-v15-preview">
          <span>ПРЕДПРОСМОТР · {region}</span>
          <h3>Что получится сейчас</h3>
          <div className="page-rule-kpis page-rule-kpis-v15"><div><small>Подходит</small><strong>{resolution.pool.length}</strong></div><div><small>Слотов</small><strong>{resolution.hasLayouts ? resolution.totalCapacity : '∞'}</strong></div><div><small>Показано</small><strong>{resolution.displayed}</strong></div><div><small>В резерве</small><strong>{resolution.reserve.length}</strong></div><div><small>Цветов для fallback</small><strong>{resolution.colorReserve.length}</strong></div><div><small>Режим</small><strong className="page-kpi-mode">{resolution.hasLayouts ? 'МАКЕТЫ' : '4 / 2'}</strong></div></div>
          <div className="page-preview-flow"><span>ОТБОР</span><i>→</i><span>СОРТИРОВКА</span><i>→</i><span>ЦВЕТА</span><i>→</i><span>{resolution.hasLayouts ? 'СЕКЦИИ' : 'СЕТКА'}</span><i>→</i><span>РЕЗЕРВ</span></div>
          {resolution.hasLayouts ? <div className="page-section-allocation page-section-allocation-v15">{resolution.sections.map((section, index) => { const filled = section.resolvedSlots.filter((slot) => slot.entity).length; const auto = section.resolvedSlots.filter((slot) => slot.status === 'auto').length; const pins = section.resolvedSlots.filter((slot) => slot.status === 'pin').length; return <div key={section.id}><b>{index + 1}</b><span><strong>{section.titles?.ru || 'Секция ' + (index + 1)}</strong><small>{slotCount(section.template)} слотов · {filled} заполнено</small><em>{auto} AUTO · {pins} PIN {section.inheritPageRules ? '· PAGE' : '· LOCAL'}</em></span></div>; })}</div> : <div className="page-standard-grid-preview"><div>{[1,2,3,4,5,6,7,8].map((item) => <i key={item}/>)}</div><strong>Desktop · 4 в ряд</strong><span>Mobile автоматически перестраивается в 2 в ряд.</span></div>}
          <div className="page-reserve-note page-reserve-v15"><strong>{resolution.reserve.length ? resolution.reserve.length + ' товаров остаётся в резерве' : 'Резерв пуст'}</strong><span>{resolution.hasLayouts && normalized.overflowMode === 'reserve' ? 'Они не занимают слот, пока не понадобятся для fallback.' : resolution.hasLayouts ? 'Оставшиеся товары выводятся после макетов стандартной сеткой.' : 'Без макетов весь отобранный пул выводится стандартной сеткой.'}</span></div>
        </aside>
      </div>
      <div className="page-rules-footer"><span>Изменения применяются в предпросмотре сразу.</span><button onClick={onClose}>Готово</button></div>
    </div>
  </div>;
}

`;
  app = app.slice(0, modalStart) + modal + app.slice(exportStart);

  // When page rules are active without authored sections, the empty state is replaced by the generated 4/2 grid.
  app = app.replace(': <div className="empty-page-state">', ': pageRules.enabled ? null : <div className="empty-page-state">');

  // Render the generated standard grid either as the whole PLP (no layouts) or after authored layouts when "show all" is selected.
  const pageActionsAnchor = '<div className="page-layout-actions">';
  if (!app.includes(pageActionsAnchor)) throw new Error('PAGE_RULES_V15: page actions anchor not found');
  app = app.replace(pageActionsAnchor, `{pageRules.enabled && pageResolution.autoGrid?.length > 0 && <PageAutoGrid items={pageResolution.autoGrid} region={region} device={device} hasLayouts={pageResolution.hasLayouts}/>}<div className="page-layout-actions">`);

  app = app.replace('Автоматическое распределение по секциям', 'Отбор · сортировка · распределение · fallback');
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
const CSS_MARKER = '/* page-rules-v15 */';
if (!css.includes(CSS_MARKER)) {
  css += `\n${CSS_MARKER}
.page-rules-v15-modal{width:min(1220px,96vw)!important;max-height:94vh!important}.page-rules-v15-head{padding:18px 22px 15px!important}.page-rules-v15-head h2{font-size:22px!important;margin:4px 0 5px!important}.page-rules-v15-body{grid-template-columns:minmax(0,1.48fr) minmax(330px,.52fr)!important}.page-rules-v15-editor{padding:14px 16px 34px!important}.page-rule-master-v15{position:sticky;top:-14px;z-index:8;background:#fff!important;border-color:#cfd4db!important;box-shadow:0 5px 15px rgba(30,35,42,.05);margin-bottom:12px!important}.page-rule-master-v15 label{display:grid!important;grid-template-columns:18px 1fr auto;align-items:center!important}.page-rule-master-v15 input{width:16px;height:16px;margin:0!important}.page-rule-master-v15 em{font-style:normal;font-size:8px;font-weight:900;border-radius:999px;padding:4px 7px;background:#20242a;color:#fff}.page-rule-step{border:1px solid #dfe3e8;border-radius:10px;background:#fff;margin:0 0 10px;overflow:hidden}.page-rule-step-head{min-height:58px;padding:10px 12px;display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:9px;background:#fafbfc;border-bottom:1px solid #eceef1}.page-rule-step-head>b{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#20242a;color:#fff;font-size:10px}.page-rule-step-head>div{display:grid;gap:2px}.page-rule-step-head>div>strong{font-size:11px}.page-rule-step-head>div>span{font-size:8px;color:#7b8189}.page-rule-step-head>em{font-style:normal;font-size:8px;color:#666d76;border:1px solid #d9dde2;border-radius:999px;padding:4px 7px;background:#fff}.page-rule-step-body{padding:11px 12px 13px}.page-logic-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}.page-logic-switch>span{font-size:9px;color:#626870}.page-logic-switch>div{display:flex}.page-logic-switch button{height:29px;padding:0 10px;border:1px solid #d9dde2;background:#fff;font-size:8px;font-weight:800;cursor:pointer}.page-logic-switch button:first-child{border-radius:6px 0 0 6px}.page-logic-switch button:last-child{border-radius:0 6px 6px 0;margin-left:-1px}.page-logic-switch button.active{background:#20242a;border-color:#20242a;color:#fff}.page-condition-v15{background:#fbfbfc!important}.page-rule-joiner{font-size:8px!important}.page-rules-empty{min-height:66px!important}.page-sort-list{display:grid;gap:6px}.page-sort-row{display:grid;grid-template-columns:26px 1fr 28px;gap:6px;align-items:center}.page-sort-row>b{width:24px;height:24px;border-radius:5px;background:#f0f2f4;display:grid;place-items:center;font-size:9px}.page-sort-row select{height:32px;border:1px solid #dcdfe4;border-radius:6px;background:#fff;padding:0 8px;font-size:9px}.page-sort-row button{width:28px;height:28px;border:0;background:transparent;display:grid;place-items:center;color:#777;cursor:pointer}.page-inline-empty{border:1px dashed #d9dde2;border-radius:7px;padding:9px 10px;display:grid;gap:2px}.page-inline-empty span{font-size:9px;font-weight:700}.page-inline-empty small{font-size:8px;color:#7c828b}.page-add-sort{margin-top:8px;height:30px;border:1px solid #d7dbe0;border-radius:6px;background:#fff;padding:0 10px;display:flex;align-items:center;gap:5px;font-size:9px;cursor:pointer}.page-add-sort:disabled{opacity:.45;cursor:default}.page-layout-decision{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:9px}.page-layout-decision>div{border:1px solid #e0e3e7;border-radius:8px;padding:9px;display:grid;grid-template-columns:20px 1fr;gap:7px;position:relative;background:#fafbfc}.page-layout-decision>div.active{border-color:#20242a;box-shadow:inset 0 0 0 1px #20242a;background:#fff}.page-layout-decision span{display:grid;gap:2px}.page-layout-decision strong{font-size:9px}.page-layout-decision small{font-size:8px;line-height:1.4;color:#7b8189}.page-layout-decision em{position:absolute;right:7px;top:7px;font-style:normal;font-size:6px;font-weight:900;letter-spacing:.05em}.page-layout-decision>div.active em{color:#20242a}.page-radio-group,.page-color-options{display:grid;gap:6px}.page-radio-group>label,.page-color-options>label{border:1px solid #dfe2e6;border-radius:7px;padding:9px 10px;display:grid;grid-template-columns:16px 1fr auto;gap:8px;align-items:start;cursor:pointer;background:#fff}.page-radio-group>label.selected,.page-color-options>label.selected{border-color:#20242a;box-shadow:inset 0 0 0 1px #20242a;background:#fafbfc}.page-radio-group input,.page-color-options input{margin:2px 0 0}.page-radio-group span,.page-color-options span{display:grid;gap:2px}.page-radio-group strong,.page-color-options strong{font-size:9px}.page-radio-group small,.page-color-options small{font-size:8px;color:#777e87;line-height:1.35}.page-dedupe-check,.page-color-fallback-check{margin-top:8px;padding:8px 9px!important;border-radius:7px;background:#f7f8f9}.page-color-number{width:52px;height:30px;border:1px solid #cfd3d8;border-radius:5px;padding:0 7px}.page-color-note{margin-top:8px;padding:8px 9px;border-radius:7px;background:#f3f6fb;color:#536170;display:flex;align-items:flex-start;gap:7px}.page-color-note span{font-size:8px;line-height:1.45}.page-fallback-chain-v15{display:grid;grid-template-columns:1fr 18px 1fr 18px 1fr;align-items:center;margin-top:9px}.page-fallback-chain-v15>div{min-height:48px;border:1px solid #dfe2e6;border-radius:7px;padding:7px;display:grid;grid-template-columns:20px 1fr;gap:5px;align-items:center}.page-fallback-chain-v15 b{width:19px;height:19px;border-radius:50%;background:#20242a;color:#fff;display:grid;place-items:center;font-size:7px}.page-fallback-chain-v15 span{font-size:8px;line-height:1.3}.page-fallback-chain-v15 i{text-align:center;font-style:normal;color:#9a9fa6}.page-fallback-caption{display:block;margin-top:7px;font-size:8px;color:#777e87}.page-pin-principle{border:1px solid #d8dce1;border-radius:8px;padding:10px 11px;display:flex;gap:8px;align-items:flex-start;background:#20242a;color:#fff}.page-pin-principle span{display:grid;gap:2px}.page-pin-principle strong{font-size:9px}.page-pin-principle small{font-size:8px;color:#c5c9ce;line-height:1.4}.page-rules-v15-preview{padding:17px!important}.page-rules-v15-preview h3{font-size:14px;margin:5px 0 10px}.page-rule-kpis-v15{grid-template-columns:repeat(2,1fr)!important}.page-kpi-mode{font-size:11px!important;margin-top:7px!important}.page-preview-flow{display:flex;align-items:center;justify-content:space-between;gap:3px;padding:8px;background:#20242a;color:#fff;border-radius:7px;margin:0 0 10px}.page-preview-flow span{font-size:6px;font-weight:900;letter-spacing:.05em}.page-preview-flow i{font-style:normal;color:#747a82}.page-section-allocation-v15{max-height:290px;overflow:auto}.page-standard-grid-preview{border:1px solid #dfe2e6;border-radius:8px;background:#fff;padding:10px}.page-standard-grid-preview>div{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-bottom:8px}.page-standard-grid-preview i{aspect-ratio:3/4;background:#e6e7e9;border-radius:2px}.page-standard-grid-preview strong,.page-standard-grid-preview span{display:block}.page-standard-grid-preview strong{font-size:9px}.page-standard-grid-preview span{font-size:8px;color:#777e87;margin-top:3px}.page-reserve-v15{margin-top:10px!important}.page-auto-grid-wrap{margin:10px 18px 18px;border-top:1px solid #e5e6e8;padding-top:11px}.page-auto-grid-head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:8px}.page-auto-grid-head>div{display:grid;gap:2px}.page-auto-grid-head span{font-size:7px;letter-spacing:.08em;color:#868b93;font-weight:800}.page-auto-grid-head strong{font-size:13px}.page-auto-grid-head em{font-style:normal;font-size:7px;border:1px solid #dfe1e4;border-radius:999px;padding:4px 6px;color:#656b73}.page-auto-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px}.page-auto-grid-wrap.mobile .page-auto-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.page-auto-grid-item{min-width:0;position:relative}.page-auto-grid-item .entity-product{height:100%}.page-auto-grid-warning{position:absolute;left:5px;right:5px;bottom:5px;background:rgba(255,255,255,.94);border:1px solid #e1d5a8;border-radius:4px;padding:4px 5px;font-size:7px;color:#6a6040}.page-layout-actions{margin-top:10px!important}@media(max-width:900px){.page-rules-v15-body{grid-template-columns:1fr!important}.page-layout-decision{grid-template-columns:1fr}.page-fallback-chain-v15{grid-template-columns:1fr}.page-fallback-chain-v15>i{transform:rotate(90deg);padding:2px}.page-rule-master-v15{position:static}.page-auto-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n`;
  writeFileSync(cssPath, css);
}

console.log('Page-level rules v15 applied');
