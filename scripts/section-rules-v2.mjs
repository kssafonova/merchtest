import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

if (!app.includes('SECTION_RULE_ENGINE_V2')) {
  app = app.replace(
    /const DEFAULT_RULES = \{[^;]+\};/,
    "const DEFAULT_RULES = { conditionLogic: 'AND', conditions: [], dedupe: true, oos: 'fallback', emptyBehavior: 'keep', ttl: 15 };\nconst SECTION_RULE_ENGINE_V2 = true;"
  );

  app = app.replace(
    "return { id: `S-${typeId}-${Math.random().toString(36).slice(2, 8)}`, titles, typeId, template: type, pins, rules: { ...DEFAULT_RULES, mode }, enabled: true };",
    "return { id: `S-${typeId}-${Math.random().toString(36).slice(2, 8)}`, titles, typeId, template: type, pins, rules: { ...DEFAULT_RULES, conditionLogic: 'AND', conditions: [] }, enabled: true };"
  );

  const resolveStart = app.indexOf('function resolveSection(section, region) {');
  const typePreviewStart = app.indexOf('function TypePreview(', resolveStart);
  if (resolveStart >= 0 && typePreviewStart > resolveStart) {
    const ruleEngine = `const PRODUCT_RULE_ATTRIBUTES = [
  { key: 'id', label: 'Артикул', type: 'text' },
  { key: 'department', label: 'Отдел', type: 'select' },
  { key: 'gender', label: 'Гендер', type: 'select' },
  { key: 'category', label: 'Категория', type: 'select' },
  { key: 'subcategory', label: 'Подкатегория', type: 'select' },
  { key: 'name', label: 'Название товара', type: 'text' },
  { key: 'material', label: 'Материал', type: 'select' },
  { key: 'price', label: 'Цена', type: 'number' },
  { key: 'discount', label: 'Процент скидки', type: 'number' },
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
  text: [['eq', '='], ['neq', '≠'], ['contains', 'содержит'], ['not_contains', 'не содержит']],
  select: [['eq', '='], ['neq', '≠'], ['contains', 'содержит'], ['not_contains', 'не содержит']],
  number: [['eq', '='], ['neq', '≠'], ['gt', '>'], ['gte', '≥'], ['lt', '<'], ['lte', '≤']],
  boolean: [['eq', '='], ['neq', '≠']],
};

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

function productMatchesSectionRules(product, rules, region) {
  const conditions = (rules?.conditions || []).filter((condition) => condition.attribute && String(condition.value ?? '') !== '');
  if (!conditions.length) return false;
  const results = conditions.map((condition) => matchesRuleCondition(product, condition, region));
  return (rules?.conditionLogic || 'AND') === 'OR' ? results.some(Boolean) : results.every(Boolean);
}

function resolveSection(section, region) {
  const used = new Set();
  const conditions = (section.rules?.conditions || []).filter((condition) => condition.attribute && String(condition.value ?? '') !== '');
  const eligible = conditions.length
    ? PRODUCTS.filter((product) => productMatchesSectionRules(product, section.rules, region))
        .sort((a, b) => ((b.l7d || 0) + (b.stock?.[region] ?? b.stockValue ?? 0)) - ((a.l7d || 0) + (a.stock?.[region] ?? a.stockValue ?? 0)))
    : [];
  const slots = Array.from({ length: slotCount(section.template) }, (_, index) => {
    const pinId = section.pins[index];
    if (pinId) {
      const entity = getEntity(pinId);
      if (!entity) return { index, status: 'empty', entity: null };
      if (entityKind(pinId) === 'product') {
        const available = (entity.stock?.[region] ?? entity.stockValue ?? 0) > 0;
        if (!available && section.rules.oos === 'collapse') return { index, status: 'collapsed', entity: null, warning: 'OOS → collapse' };
        if (!available && section.rules.oos === 'fallback' && eligible.length) {
          const next = eligible.find((product) => !used.has(product.id));
          if (next) { used.add(next.id); return { index, status: 'auto', entity: next }; }
        }
        used.add(entity.id);
        return { index, status: 'pin', entity, warning: available ? null : 'OOS' };
      }
      return { index, status: 'pin', entity };
    }
    if (!eligible.length) return { index, status: 'empty', entity: null };
    const next = eligible.find((product) => !section.rules.dedupe || !used.has(product.id));
    if (!next) return section.rules.emptyBehavior === 'collapse' ? { index, status: 'collapsed', entity: null } : { index, status: 'empty', entity: null };
    used.add(next.id);
    return { index, status: 'auto', entity: next };
  });
  return { ...section, resolvedSlots: slots, candidates: eligible };
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

function ruleLabel(condition) {
  const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute);
  const operators = RULE_OPERATORS[definition?.type || 'text'] || RULE_OPERATORS.text;
  const operator = operators.find((item) => item[0] === condition.operator)?.[1] || '=';
  return (definition?.label || condition.attribute || 'Параметр') + ' ' + operator + ' ' + (condition.value || '…');
}

function SectionRuleBuilder({ section, region, onChange }) {
  if (!section) return null;
  const rules = { ...DEFAULT_RULES, ...(section.rules || {}), conditions: section.rules?.conditions || [] };
  const updateRules = (patch) => onChange({ ...rules, ...patch });
  const addCondition = () => {
    const first = PRODUCT_RULE_ATTRIBUTES[0];
    const id = 'rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    updateRules({ conditions: [...rules.conditions, { id, attribute: first.key, operator: 'eq', value: '' }] });
  };
  const updateCondition = (id, patch) => updateRules({ conditions: rules.conditions.map((condition) => condition.id === id ? { ...condition, ...patch } : condition) });
  const removeCondition = (id) => updateRules({ conditions: rules.conditions.filter((condition) => condition.id !== id) });
  const candidateCount = section.candidates?.length || 0;
  return <div className="section-rule-panel">
    <div className="section-rule-head"><div><span>АВТОМАТИЧЕСКОЕ НАПОЛНЕНИЕ</span><strong>Правила секции</strong></div><em>{candidateCount} товаров</em></div>
    <div className="rule-logic-row"><span>Совпадение условий</span><div className="rule-logic-toggle"><button className={rules.conditionLogic === 'AND' ? 'active' : ''} onClick={() => updateRules({ conditionLogic: 'AND' })}>Все · AND</button><button className={rules.conditionLogic === 'OR' ? 'active' : ''} onClick={() => updateRules({ conditionLogic: 'OR' })}>Любое · OR</button></div></div>
    <div className="rule-builder-list">
      {rules.conditions.map((condition, index) => {
        const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute) || PRODUCT_RULE_ATTRIBUTES[0];
        const operators = RULE_OPERATORS[definition.type] || RULE_OPERATORS.text;
        const options = ruleAttributeOptions(definition.key, region);
        return <div className="rule-condition" key={condition.id || index}>
          <div className="rule-condition-index">{index + 1}</div>
          <select className="rule-attribute" value={condition.attribute} onChange={(event) => { const attribute = event.target.value; const nextDef = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === attribute) || PRODUCT_RULE_ATTRIBUTES[0]; const nextOperator = (RULE_OPERATORS[nextDef.type] || RULE_OPERATORS.text)[0][0]; updateCondition(condition.id, { attribute, operator: nextOperator, value: '' }); }}>{PRODUCT_RULE_ATTRIBUTES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
          <select className="rule-operator" value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value })}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          {options.length ? <select className="rule-value" value={String(condition.value ?? '')} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}><option value="">Выберите</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input className="rule-value" type={definition.type === 'number' ? 'number' : 'text'} value={condition.value ?? ''} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} placeholder="Значение"/>}
          <button className="rule-remove" title="Удалить условие" onClick={() => removeCondition(condition.id)}><Trash2 size={13}/></button>
        </div>;
      })}
      {!rules.conditions.length && <div className="rule-empty"><strong>Правила не заданы</strong><span>Слоты остаются пустыми. Добавьте условие, чтобы включить автоматическое наполнение.</span></div>}
    </div>
    <div className="rule-builder-actions"><button onClick={addCondition}><Plus size={13}/> Добавить условие</button>{rules.conditions.length > 0 && <button className="secondary" onClick={() => updateRules({ conditions: [] })}>Очистить</button>}</div>
    <div className="rule-summary"><span>Логика</span><strong>{rules.conditions.length ? rules.conditions.map((condition, index) => (index ? ' ' + rules.conditionLogic + ' ' : '') + ruleLabel(condition)).join('') : '—'}</strong></div>
  </div>;
}

`;
    app = app.slice(0, resolveStart) + ruleEngine + app.slice(typePreviewStart);
  }

  // Remove visible manual/hybrid/auto badges. Pins remain manual overrides over rule-based filling.
  app = app.replace(/<span className=\{`mode-badge \$\{section\.rules\.mode\}`\}>\{section\.rules\.mode\.toUpperCase\(\)\}<\/span>/g, '');
  app = app.replace(/<span>\{s\.rules\.mode\.toUpperCase\(\)\}<\/span>/g, '');

  const leftTail = '<small>{metrics.unique} из {metrics.available} доступных товаров показано</small></div></aside>';
  if (app.includes(leftTail)) {
    app = app.replace(
      leftTail,
      '<small>{metrics.unique} из {metrics.available} доступных товаров показано</small></div>{selectedId && selected?.id === selectedId && <SectionRuleBuilder section={selected} region={region} onChange={(rules) => updateSection(selected.id, (source) => ({ ...source, rules }))}/>}</aside>'
    );
  }

  writeFileSync(appPath, app);
}

const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');
if (!css.includes('section-rule-panel-v2')) {
  css += `
/* section-rule-panel-v2 */
.section-rule-panel{margin:12px 10px 18px;border:1px solid #dfe2e7;border-radius:8px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(20,24,32,.03)}
.section-rule-head{padding:11px 11px 9px;border-bottom:1px solid #e9eaed;display:flex;justify-content:space-between;gap:8px;align-items:flex-start;background:#fafbfc}.section-rule-head>div{display:grid;gap:2px}.section-rule-head span{font-size:7px;letter-spacing:.09em;font-weight:800;color:#7e828a}.section-rule-head strong{font-size:11px;color:#262a31}.section-rule-head em{font-size:8px;font-style:normal;font-weight:800;color:#2f63c9;background:#edf3ff;padding:4px 6px;border-radius:4px;white-space:nowrap}
.rule-logic-row{padding:9px 10px;display:grid;gap:6px;border-bottom:1px solid #eceef1}.rule-logic-row>span{font-size:7px;text-transform:uppercase;letter-spacing:.06em;color:#858992;font-weight:800}.rule-logic-toggle{display:grid;grid-template-columns:1fr 1fr;border:1px solid #dfe2e8;border-radius:6px;overflow:hidden}.rule-logic-toggle button{height:29px;border:0;background:#fff;font-size:8px;font-weight:800;color:#636771}.rule-logic-toggle button+button{border-left:1px solid #e1e3e7}.rule-logic-toggle button.active{background:#17191e;color:#fff}
.rule-builder-list{padding:8px;display:grid;gap:6px}.rule-condition{display:grid;grid-template-columns:22px minmax(0,1.55fr) minmax(66px,.72fr) minmax(0,1.2fr) 28px;gap:4px;align-items:center}.rule-condition-index{width:22px;height:28px;display:grid;place-items:center;border-radius:4px;background:#f2f3f5;color:#727780;font-size:8px;font-weight:800}.rule-condition select,.rule-condition input{width:100%;min-width:0;height:29px;border:1px solid #dfe2e7;border-radius:5px;background:#fff;padding:0 6px;font-size:8px;color:#333840;outline:none}.rule-condition select:focus,.rule-condition input:focus{border-color:#7fa6f3;box-shadow:0 0 0 2px rgba(70,121,220,.08)}.rule-remove{width:28px;height:28px;border:1px solid #e4e5e9;background:#fff;border-radius:5px;display:grid;place-items:center;color:#8b4a4a}.rule-remove:hover{background:#fff3f3;border-color:#efcccc;color:#bd3737}
.rule-empty{min-height:72px;border:1px dashed #ccd1da;border-radius:6px;background:#fafbfc;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px;gap:3px}.rule-empty strong{font-size:9px;color:#454a53}.rule-empty span{font-size:7px;line-height:1.45;color:#858a94;max-width:210px}.rule-builder-actions{padding:0 9px 9px;display:flex;gap:5px}.rule-builder-actions button{height:30px;border:1px solid #202329;background:#202329;color:#fff;border-radius:5px;padding:0 9px;font-size:8px;font-weight:800;display:flex;align-items:center;gap:5px}.rule-builder-actions button.secondary{background:#fff;color:#5f646d;border-color:#dfe2e7}.rule-summary{border-top:1px solid #eceef1;background:#fafbfc;padding:8px 10px;display:grid;gap:3px}.rule-summary span{font-size:7px;text-transform:uppercase;color:#8a8e96;font-weight:800}.rule-summary strong{font-size:7px;line-height:1.45;color:#4b5059;font-weight:600;word-break:break-word}.structure-panel .tree-type>span{display:none}.preview-mode .section-rule-panel{display:none}
@media(max-width:1200px){.rule-condition{grid-template-columns:20px 1fr 56px 1fr 26px}.rule-condition select,.rule-condition input{font-size:7px;padding:0 4px}}
`;
  writeFileSync(cssPath, css);
}
