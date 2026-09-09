import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

if (!app.includes('SECTION_RULE_ENGINE_V3')) {
  app = app.replace(
    /const DEFAULT_RULES = \{[^;]+\};/,
    "const DEFAULT_RULES = { conditionLogic: 'AND', conditions: [], sortBy: 'l7d_desc', dedupe: true, oos: 'fallback', emptyBehavior: 'collapse-center', ttl: 15 };\nconst SECTION_RULE_ENGINE_V3 = true;"
  );

  app = app.replace(
    "return { id: `S-${typeId}-${Math.random().toString(36).slice(2, 8)}`, titles, typeId, template: type, pins, rules: { ...DEFAULT_RULES, mode }, enabled: true };",
    "return { id: 'S-' + typeId + '-' + Math.random().toString(36).slice(2, 8), titles, typeId, template: type, pins, rules: { ...DEFAULT_RULES, conditionLogic: 'AND', conditions: [] }, enabled: true };"
  );

  const resolveStart = app.indexOf('function resolveSection(section, region) {');
  const typePreviewStart = app.indexOf('function TypePreview(', resolveStart);
  if (resolveStart >= 0 && typePreviewStart > resolveStart) {
    const engine = `const PRODUCT_RULE_ATTRIBUTES = [
  { key: 'id', label: 'Артикул', type: 'text' },
  { key: 'department', label: 'Отдел', type: 'select' },
  { key: 'gender', label: 'Гендер', type: 'select' },
  { key: 'category', label: 'Категория', type: 'select' },
  { key: 'subcategory', label: 'Подкатегория', type: 'select' },
  { key: 'name', label: 'Название товара', type: 'text' },
  { key: 'material', label: 'Материал', type: 'select' },
  { key: 'price', label: 'Цена', type: 'number' },
  { key: 'discount', label: 'Скидка, %', type: 'number' },
  { key: 'color', label: 'Цвет', type: 'select' },
  { key: 'collection', label: 'Коллекция', type: 'select' },
  { key: 'silhouette', label: 'Силуэт / фасон', type: 'select' },
  { key: 'ageGroup', label: 'Возрастная группа', type: 'select' },
  { key: 'fit', label: 'Посадка', type: 'select' },
  { key: 'length', label: 'Длина изделия', type: 'select' },
  { key: 'sleeveLength', label: 'Длина рукава', type: 'select' },
  { key: 'details', label: 'Детали', type: 'text' },
  { key: 'stock', label: 'Остаток в регионе', type: 'number' },
  { key: 'l7d', label: 'Продажи L7D', type: 'number' },
  { key: 'isNew', label: 'Новинка', type: 'boolean' },
  { key: 'looksCount', label: 'Количество образов', type: 'number' },
];

const RULE_OPERATORS = {
  text: [['eq', 'равно'], ['neq', 'не равно'], ['contains', 'содержит'], ['not_contains', 'не содержит']],
  select: [['eq', 'равно'], ['neq', 'не равно']],
  number: [['eq', '='], ['neq', '≠'], ['gt', '>'], ['gte', '≥'], ['lt', '<'], ['lte', '≤']],
  boolean: [['eq', 'равно'], ['neq', 'не равно']],
};

const SORT_OPTIONS = [
  ['l7d_desc', 'Продажи L7D · сначала самые продаваемые'],
  ['stock_desc', 'Остаток · сначала больший остаток'],
  ['discount_desc', 'Скидка · сначала большая скидка'],
  ['price_asc', 'Цена · сначала дешевле'],
  ['price_desc', 'Цена · сначала дороже'],
  ['new_first', 'Новинки · сначала новые'],
];

function productRuleValue(product, attribute, region) {
  if (attribute === 'stock') return product.stock?.[region] ?? product.stockValue ?? 0;
  return product[attribute];
}

function normalizeRuleValue(value, type) {
  if (type === 'number') return Number(value || 0);
  if (type === 'boolean') return String(value) === 'true';
  return String(value ?? '').trim().toLowerCase();
}

function matchesRuleCondition(product, condition, region) {
  const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute);
  if (!definition) return true;
  const actual = normalizeRuleValue(productRuleValue(product, condition.attribute, region), definition.type);
  const expected = normalizeRuleValue(condition.value, definition.type);
  switch (condition.operator) {
    case 'neq': return actual !== expected;
    case 'contains': return String(actual).includes(String(expected));
    case 'not_contains': return !String(actual).includes(String(expected));
    case 'gt': return Number(actual) > Number(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lt': return Number(actual) < Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    case 'eq':
    default: return actual === expected;
  }
}

function validConditions(rules) {
  return (rules?.conditions || []).filter((condition) => condition.attribute && String(condition.value ?? '') !== '');
}

function productMatchesSectionRules(product, rules, region) {
  const conditions = validConditions(rules);
  if (!conditions.length) return false;
  const results = conditions.map((condition) => matchesRuleCondition(product, condition, region));
  return (rules?.conditionLogic || 'AND') === 'OR' ? results.some(Boolean) : results.every(Boolean);
}

function sortCandidates(items, rules, region) {
  const list = [...items];
  const stock = (product) => product.stock?.[region] ?? product.stockValue ?? 0;
  switch (rules?.sortBy) {
    case 'stock_desc': return list.sort((a, b) => stock(b) - stock(a));
    case 'discount_desc': return list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    case 'price_asc': return list.sort((a, b) => (a.price || 0) - (b.price || 0));
    case 'price_desc': return list.sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'new_first': return list.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || (b.l7d || 0) - (a.l7d || 0));
    case 'l7d_desc':
    default: return list.sort((a, b) => (b.l7d || 0) - (a.l7d || 0) || stock(b) - stock(a));
  }
}

function emptySlotResult(index, rules, warning) {
  if (rules?.emptyBehavior === 'collapse' || rules?.emptyBehavior === 'collapse-center') return { index, status: 'collapsed', entity: null, warning: warning || null };
  return { index, status: 'empty', entity: null, warning: warning || null };
}

function resolveSection(section, region) {
  const rules = { ...DEFAULT_RULES, ...(section.rules || {}) };
  const conditions = validConditions(rules);
  const allCandidates = conditions.length ? PRODUCTS.filter((product) => productMatchesSectionRules(product, rules, region)) : [];
  const availableCandidates = sortCandidates(allCandidates.filter((product) => (product.stock?.[region] ?? product.stockValue ?? 0) > 0), rules, region);
  const used = new Set();
  const slots = Array.from({ length: slotCount(section.template) }, (_, index) => {
    const pinId = section.pins[index];
    if (pinId) {
      const entity = getEntity(pinId);
      if (!entity) return { index, status: 'empty', entity: null };
      if (entityKind(pinId) !== 'product') return { index, status: 'pin', entity };
      const available = (entity.stock?.[region] ?? entity.stockValue ?? 0) > 0;
      if (available) { used.add(entity.id); return { index, status: 'pin', entity }; }
      if (rules.oos === 'keep') { used.add(entity.id); return { index, status: 'pin', entity, warning: 'Нет в наличии' }; }
      if (rules.oos === 'collapse') return emptySlotResult(index, { ...rules, emptyBehavior: rules.emptyBehavior === 'keep' ? 'collapse' : rules.emptyBehavior }, 'Нет в наличии');
      if (rules.oos === 'fallback') {
        const replacement = availableCandidates.find((product) => !rules.dedupe || !used.has(product.id));
        if (replacement) { used.add(replacement.id); return { index, status: 'auto', entity: replacement, warning: 'Автозамена' }; }
        if (!conditions.length) { used.add(entity.id); return { index, status: 'pin', entity, warning: 'Нет правил для замены' }; }
        return emptySlotResult(index, rules, 'Замена не найдена');
      }
    }
    if (!conditions.length) return { index, status: 'empty', entity: null };
    const next = availableCandidates.find((product) => !rules.dedupe || !used.has(product.id));
    if (!next) return emptySlotResult(index, rules, 'Кандидаты закончились');
    used.add(next.id);
    return { index, status: 'auto', entity: next };
  });
  return { ...section, rules, resolvedSlots: slots, candidates: allCandidates, availableCandidates };
}

function ruleAttributeOptions(attribute, region) {
  const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === attribute);
  if (!definition) return [];
  if (definition.type === 'boolean') return [{ value: 'true', label: 'Да' }, { value: 'false', label: 'Нет' }];
  if (definition.type !== 'select') return [];
  const values = Array.from(new Set(PRODUCTS.map((product) => productRuleValue(product, attribute, region)).filter((value) => value !== undefined && value !== null && String(value).trim() !== '')))
    .map(String).sort((a, b) => a.localeCompare(b, 'ru'));
  return values.map((value) => ({ value, label: value }));
}

function SectionRuleBuilder({ section, region, onChange }) {
  if (!section) return null;
  const rules = { ...DEFAULT_RULES, ...(section.rules || {}), conditions: section.rules?.conditions || [] };
  const updateRules = (patch) => onChange({ ...rules, ...patch });
  const addCondition = () => {
    const first = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === 'category') || PRODUCT_RULE_ATTRIBUTES[0];
    const id = 'rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    updateRules({ conditions: [...rules.conditions, { id, attribute: first.key, operator: 'eq', value: '' }] });
  };
  const updateCondition = (id, patch) => updateRules({ conditions: rules.conditions.map((condition) => condition.id === id ? { ...condition, ...patch } : condition) });
  const removeCondition = (id) => updateRules({ conditions: rules.conditions.filter((condition) => condition.id !== id) });
  const matched = section.candidates?.length || 0;
  const available = section.availableCandidates?.length || 0;
  const activeRules = validConditions(rules).length;
  return <div className="section-rules-editor">
    <div className="section-rules-title"><div><span>НАСТРОЙКИ СЕКЦИИ</span><strong>Автоматическое наполнение</strong></div><button className="rules-status" data-active={activeRules > 0}>{activeRules > 0 ? 'Настроено' : 'Не настроено'}</button></div>

    <details className="rule-accordion" open>
      <summary><span>Правила отбора</span><em>{activeRules ? activeRules + ' усл.' : 'Нет условий'}</em></summary>
      <div className="rule-accordion-body">
        <div className="rule-sentence">Товар должен соответствовать <select value={rules.conditionLogic} onChange={(event) => updateRules({ conditionLogic: event.target.value })}><option value="AND">всем условиям</option><option value="OR">хотя бы одному условию</option></select></div>
        <div className="rule-cards">
          {rules.conditions.map((condition, index) => {
            const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute) || PRODUCT_RULE_ATTRIBUTES[0];
            const operators = RULE_OPERATORS[definition.type] || RULE_OPERATORS.text;
            const options = ruleAttributeOptions(definition.key, region);
            return <React.Fragment key={condition.id || index}>
              {index > 0 && <div className="rule-joiner">{rules.conditionLogic}</div>}
              <div className="rule-condition-card">
                <div className="rule-condition-head"><span>Условие {index + 1}</span><button title="Удалить" onClick={() => removeCondition(condition.id)}><Trash2 size={13}/></button></div>
                <select className="rule-field" value={condition.attribute} onChange={(event) => { const attribute = event.target.value; const nextDef = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === attribute) || PRODUCT_RULE_ATTRIBUTES[0]; const nextOperator = (RULE_OPERATORS[nextDef.type] || RULE_OPERATORS.text)[0][0]; updateCondition(condition.id, { attribute, operator: nextOperator, value: '' }); }}>{PRODUCT_RULE_ATTRIBUTES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
                <div className="rule-value-row"><select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value })}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{options.length ? <select value={String(condition.value ?? '')} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}><option value="">Выберите значение</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={definition.type === 'number' ? 'number' : 'text'} value={condition.value ?? ''} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} placeholder="Введите значение"/>}</div>
              </div>
            </React.Fragment>;
          })}
          {!rules.conditions.length && <div className="rules-empty-state"><strong>Секция пока не заполняется автоматически</strong><span>Добавьте первое условие. Например: Категория = Платья.</span></div>}
        </div>
        <div className="rule-actions"><button className="rule-add" onClick={addCondition}><Plus size={13}/> Добавить условие</button>{rules.conditions.length > 0 && <button className="rule-clear" onClick={() => updateRules({ conditions: [] })}>Очистить</button>}</div>
        <div className="candidate-preview"><div><span>Подходит по правилам</span><strong>{matched}</strong></div><div><span>В наличии в {region}</span><strong>{available}</strong></div></div>
      </div>
    </details>

    <details className="rule-accordion" open>
      <summary><span>Порядок и замены</span><em>Fallback</em></summary>
      <div className="rule-accordion-body compact-body">
        <label className="rules-label">Чем заполнять сначала<select value={rules.sortBy} onChange={(event) => updateRules({ sortBy: event.target.value })}>{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="check-row"><input type="checkbox" checked={rules.dedupe !== false} onChange={(event) => updateRules({ dedupe: event.target.checked })}/><span><strong>Не повторять товары</strong><small>Один артикул не занимает несколько слотов секции</small></span></label>
        <div className="behavior-group"><span>Если товар закончился</span><div className="behavior-options"><button className={rules.oos === 'fallback' ? 'active' : ''} onClick={() => updateRules({ oos: 'fallback' })}><RefreshCw size={14}/><span><strong>Заменить</strong><small>Следующим подходящим товаром</small></span></button><button className={rules.oos === 'collapse' ? 'active' : ''} onClick={() => updateRules({ oos: 'collapse' })}><LayoutGrid size={14}/><span><strong>Схлопнуть</strong><small>Убрать слот из секции</small></span></button><button className={rules.oos === 'keep' ? 'active' : ''} onClick={() => updateRules({ oos: 'keep' })}><AlertTriangle size={14}/><span><strong>Оставить</strong><small>Показать OOS с предупреждением</small></span></button></div></div>
        <div className="behavior-group"><span>Если заменить нечем</span><div className="behavior-options"><button className={rules.emptyBehavior === 'collapse-center' ? 'active' : ''} onClick={() => updateRules({ emptyBehavior: 'collapse-center' })}><LayoutGrid size={14}/><span><strong>Схлопнуть + центрировать</strong><small>Оставшиеся карточки в центре ряда</small></span></button><button className={rules.emptyBehavior === 'collapse' ? 'active' : ''} onClick={() => updateRules({ emptyBehavior: 'collapse' })}><LayoutGrid size={14}/><span><strong>Схлопнуть слева</strong><small>Сдвинуть оставшиеся карточки к началу</small></span></button><button className={rules.emptyBehavior === 'keep' ? 'active' : ''} onClick={() => updateRules({ emptyBehavior: 'keep' })}><Plus size={14}/><span><strong>Оставить пустым</strong><small>Сохранить геометрию секции</small></span></button></div></div>
      </div>
    </details>

    <details className="rule-accordion">
      <summary><span>Дополнительно</span><em>TTL</em></summary>
      <div className="rule-accordion-body compact-body"><label className="rules-label">Проверять доступность каждые<div className="ttl-control"><input type="number" min="1" value={rules.ttl || 15} onChange={(event) => updateRules({ ttl: Number(event.target.value) || 1 })}/><span>минут</span></div></label></div>
    </details>
  </div>;
}

`;
    app = app.slice(0, resolveStart) + engine + app.slice(typePreviewStart);
  }

  // Replace slot and section canvas with a clean editing surface and real collapse/centering behaviour.
  const slotStart = app.indexOf('function Slot(');
  const addTypeStart = app.indexOf('function AddTypeModal', slotStart);
  if (slotStart >= 0 && addTypeStart > slotStart) {
    const canvas = `function Slot({ slot, region, shape, sectionId, selectedSlot, onSelectSlot, onDrop, onUnpin }) {
  if (slot.status === 'collapsed') return null;
  const selected = selectedSlot?.sectionId === sectionId && selectedSlot?.slotIndex === slot.index;
  const classes = ['lego-slot', slot.entity ? 'filled' : 'empty', slot.status, selected ? 'selected-content-slot' : ''].filter(Boolean).join(' ');
  return <div className={classes} onClick={(event) => { event.stopPropagation(); onSelectSlot?.({ sectionId, slotIndex: slot.index }); }} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
    <div className="slot-head"><span>Слот {slot.index + 1}</span>{slot.status === 'pin' && <em>PIN</em>}{slot.status === 'auto' && <em className="auto">AUTO</em>}</div>
    {slot.entity ? <>{'price' in slot.entity ? <ProductCard product={slot.entity} region={region}/> : <MediaCard entity={slot.entity}/>} {slot.status === 'pin' && <button className="slot-remove" onClick={(event) => { event.stopPropagation(); onUnpin(); }}><X size={13}/></button>}{slot.warning && <span className="slot-warning"><AlertTriangle size={13}/>{slot.warning}</span>}</> : <div className="empty-slot-state"><Plus size={20}/><strong>Пустой слот</strong><span>Выберите контент справа</span></div>}
  </div>;
}

function SectionCanvas({ section, locale, region, selected, editable, selectedSlot, onSelectSlot, onSelect, onPin, onUnpin, onDuplicate, onDelete, onSectionDragStart, onSectionDrop }) {
  let cursor = 0;
  const onDrop = (event, slotIndex) => { event.preventDefault(); event.stopPropagation(); const id = event.dataTransfer.getData('text/plain'); if (id) onPin(section.id, slotIndex, id); };
  return <section className={['builder-section', selected ? 'selected' : ''].filter(Boolean).join(' ')} draggable={Boolean(editable && selected)} onDragStart={(event) => editable && selected ? onSectionDragStart(event, section.id) : event.preventDefault()} onDragOver={(event) => { if (editable) event.preventDefault(); }} onDrop={(event) => { if (editable) { event.preventDefault(); event.stopPropagation(); onSectionDrop(event, section.id); } }} onClick={() => onSelect(section.id)}>
    {editable && <div className="section-header-line"><div><h3>{section.titles[locale] || section.titles.ru}</h3></div><div className="section-head-meta"><span>{section.resolvedSlots.filter((item) => item.entity).length}/{section.resolvedSlots.length}</span>{selected && <div className="section-inline-actions" onClick={(event) => event.stopPropagation()}><span className="section-drag-handle" title="Перетащить"><GripVertical size={15}/></span><button title="Дублировать" onClick={() => onDuplicate(section.id)}><Copy size={14}/></button><button title="Удалить" onClick={() => onDelete(section.id)}><Trash2 size={14}/></button></div>}</div></div>}
    <div className="section-containers">{section.template.containers.map((container, containerIndex) => {
      const entries = container.slots.map((shape, shapeIndex) => ({ shape, shapeIndex, slot: section.resolvedSlots[cursor++] }));
      const visible = entries.filter((entry) => entry.slot.status !== 'collapsed');
      const center = section.rules?.emptyBehavior === 'collapse-center' && visible.length < entries.length;
      const usedSpan = visible.reduce((sum, entry) => sum + Number(entry.shape.span || 1), 0);
      let startColumn = center ? Math.max(1, Math.floor((container.cols - Math.min(container.cols, usedSpan)) / 2) + 1) : null;
      return <div className="section-container" key={containerIndex}><div className={['slot-grid', center ? 'centered-after-collapse' : ''].filter(Boolean).join(' ')} style={{ gridTemplateColumns: 'repeat(' + container.cols + ', minmax(0,1fr))' }}>{visible.map((entry) => {
        const style = { gridColumn: 'span ' + entry.shape.span, gridRow: entry.shape.rows ? 'span ' + entry.shape.rows : undefined };
        if (center && startColumn !== null) { style.gridColumnStart = startColumn; startColumn += Number(entry.shape.span || 1); }
        return <div key={entry.shapeIndex} style={style}><Slot slot={entry.slot} region={region} shape={entry.shape} sectionId={section.id} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} onDrop={(event) => onDrop(event, entry.slot.index)} onUnpin={() => onUnpin(section.id, entry.slot.index)}/></div>;
      })}</div></div>;
    })}</div>
  </section>;
}

`;
    app = app.slice(0, slotStart) + canvas + app.slice(addTypeStart);
  }

  // Remove old mode badges and duplicated editor chrome.
  app = app.replace(/<span className=\{`mode-badge \$\{section\.rules\.mode\}`\}>\{section\.rules\.mode\.toUpperCase\(\)\}<\/span>/g, '');
  app = app.replace(/<span>\{s\.rules\.mode\.toUpperCase\(\)\}<\/span>/g, '');
  app = app.replace("const [showCoverage, setShowCoverage] = useState(true);", "const [showCoverage, setShowCoverage] = useState(false);");
  app = app.replace('<div className="page-context-strip"><span>{currentPageName}</span><b>{region}</b><b>{LANGUAGE_LABELS[locale]}</b></div>', '');
  app = app.replace('{!previewMode && <div className="main-canvas-label"><LayoutGrid size={15}/><strong>Main</strong><span>{resolved.length} секций</span></div>}', '');

  // Replace the small coverage widget in the left column with contextual section settings.
  const structureStart = app.indexOf('<aside className="structure-panel">');
  const structureEnd = app.indexOf('</aside>', structureStart);
  const miniCoverageStart = app.indexOf('<div className="mini-coverage">', structureStart);
  if (structureStart >= 0 && structureEnd > structureStart) {
    const settings = '{selectedId && selected?.id === selectedId && <SectionRuleBuilder section={selected} region={region} onChange={(rules) => updateSection(selected.id, (source) => ({ ...source, rules }))}/>}';
    if (miniCoverageStart >= 0 && miniCoverageStart < structureEnd) {
      app = app.slice(0, miniCoverageStart) + settings + app.slice(structureEnd);
    } else {
      app = app.slice(0, structureEnd) + settings + app.slice(structureEnd);
    }
  }

  writeFileSync(appPath, app);
}

const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');
if (!css.includes('section-rule-ux-v3')) {
  css += `
/* section-rule-ux-v3 */
.section-rules-editor{margin:12px 10px 18px;border-top:1px solid #e2e4e8;padding-top:12px;display:grid;gap:8px}.section-rules-title{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:0 2px 2px}.section-rules-title>div{display:grid;gap:2px}.section-rules-title span{font-size:7px;letter-spacing:.09em;font-weight:800;color:#8a8e97}.section-rules-title strong{font-size:12px;color:#20242b}.rules-status{border:0;border-radius:999px;padding:5px 7px;background:#f1f2f4;color:#747881;font-size:7px;font-weight:800}.rules-status[data-active="true"]{background:#eaf6ee;color:#267840}
.rule-accordion{border:1px solid #e1e3e7;border-radius:7px;background:#fff;overflow:hidden}.rule-accordion summary{min-height:38px;padding:0 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;list-style:none;font-size:9px;font-weight:800;color:#2c3037}.rule-accordion summary::-webkit-details-marker{display:none}.rule-accordion summary:after{content:'›';font-size:16px;color:#8c9098;transform:rotate(90deg);transition:.15s}.rule-accordion:not([open]) summary:after{transform:rotate(0deg)}.rule-accordion summary em{margin-left:auto;font-size:7px;font-style:normal;color:#8a8e96;font-weight:700}.rule-accordion-body{border-top:1px solid #eceef1;padding:10px;display:grid;gap:9px;background:#fbfbfc}.rule-accordion-body.compact-body{gap:11px}
.rule-sentence{font-size:8px;line-height:1.4;color:#666b74}.rule-sentence select{margin-top:5px;width:100%;height:31px;border:1px solid #d9dce2;border-radius:5px;background:#fff;padding:0 7px;font-size:8px;color:#262a31}.rule-cards{display:grid;gap:0}.rule-condition-card{border:1px solid #dfe2e7;border-radius:6px;background:#fff;padding:8px;display:grid;gap:6px}.rule-condition-head{display:flex;align-items:center;justify-content:space-between}.rule-condition-head span{font-size:7px;font-weight:800;color:#7e828a;text-transform:uppercase}.rule-condition-head button{border:0;background:transparent;color:#9a9da4;padding:2px;display:grid;place-items:center}.rule-condition-card select,.rule-condition-card input,.rules-label select,.ttl-control input{height:31px;border:1px solid #d9dce2;border-radius:5px;background:#fff;padding:0 7px;font-size:8px;color:#252930;min-width:0}.rule-field{width:100%}.rule-value-row{display:grid;grid-template-columns:.8fr 1.2fr;gap:5px}.rule-value-row>*{width:100%}.rule-joiner{justify-self:center;margin:4px 0;padding:3px 6px;border-radius:999px;background:#eef2fa;color:#456aa9;font-size:7px;font-weight:900;letter-spacing:.04em}.rules-empty-state{padding:13px 10px;border:1px dashed #ccd1da;border-radius:6px;background:#fff;display:grid;gap:3px;text-align:left}.rules-empty-state strong{font-size:9px;color:#343840}.rules-empty-state span{font-size:8px;line-height:1.4;color:#81858d}.rule-actions{display:flex;align-items:center;gap:6px}.rule-add{height:31px;border:1px solid #cfd6e4;border-radius:5px;background:#f7f9fd;color:#315d9f;padding:0 9px;display:flex;align-items:center;gap:5px;font-size:8px;font-weight:800}.rule-clear{height:31px;border:0;background:transparent;color:#8d5960;font-size:8px}.candidate-preview{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e1e4e9;border-radius:6px;background:#fff;overflow:hidden}.candidate-preview>div{padding:8px 9px;display:grid;gap:2px}.candidate-preview>div+div{border-left:1px solid #e8eaed}.candidate-preview span{font-size:7px;color:#858991}.candidate-preview strong{font-size:14px;color:#282c32}
.rules-label{display:grid;gap:5px;font-size:7px;font-weight:800;color:#747982;text-transform:uppercase}.rules-label select{width:100%;text-transform:none;font-weight:500}.check-row{display:flex;align-items:flex-start;gap:7px;padding:8px;border:1px solid #e2e4e8;border-radius:6px;background:#fff}.check-row input{margin-top:2px}.check-row span{display:grid;gap:2px}.check-row strong{font-size:8px;color:#30343b}.check-row small{font-size:7px;line-height:1.35;color:#888c94}.behavior-group{display:grid;gap:6px}.behavior-group>span{font-size:7px;font-weight:800;color:#747982;text-transform:uppercase}.behavior-options{display:grid;gap:5px}.behavior-options button{min-height:44px;border:1px solid #dde0e5;border-radius:6px;background:#fff;padding:7px 8px;display:flex;align-items:flex-start;gap:7px;text-align:left;color:#646973}.behavior-options button.active{border-color:#7193d1;background:#f4f7fd;color:#315b9d;box-shadow:0 0 0 1px rgba(73,112,177,.08)}.behavior-options button>span{display:grid;gap:2px}.behavior-options strong{font-size:8px;color:#30343b}.behavior-options button.active strong{color:#294f8e}.behavior-options small{font-size:7px;line-height:1.3;color:#858a93}.ttl-control{display:grid;grid-template-columns:75px auto;align-items:center;gap:6px}.ttl-control span{font-size:8px;color:#70757e;text-transform:none;font-weight:500}
.centered-after-collapse{grid-auto-flow:row}.builder-section .section-header-line{min-height:38px;padding:7px 9px}.builder-section .section-header-line h3{font-size:11px}.section-head-meta>span{font-size:8px;color:#858a93}.preview-mode .section-header-line{display:none!important}.preview-mode .slot-head,.preview-mode .slot-remove,.preview-mode .slot-warning,.preview-mode .empty-slot-state{display:none!important}.preview-mode .lego-slot{border-color:transparent!important;box-shadow:none!important}.structure-panel .mini-coverage{display:none!important}
`;
  writeFileSync(cssPath, css);
}

console.log('Section rules v3 prepared: clear rules UX, ranking, fallback, collapse and centering');
