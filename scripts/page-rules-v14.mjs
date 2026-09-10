import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PAGE_RULES_V14';

if (!app.includes(MARKER)) {
  // 1) Section rules can inherit the page master-pool.
  const defaultRulesMatch = app.match(/const DEFAULT_RULES = \{[^;]+\};/);
  if (!defaultRulesMatch) throw new Error('PAGE_RULES_V14: DEFAULT_RULES not found');
  if (!defaultRulesMatch[0].includes('inheritPageRules')) {
    app = app.replace(defaultRulesMatch[0], defaultRulesMatch[0].replace(/\s*\};$/, ', inheritPageRules: true };'));
  }

  const engineMarker = 'const SECTION_RULE_ENGINE_V3 = true;';
  if (!app.includes(engineMarker)) throw new Error('PAGE_RULES_V14: rule-engine marker not found');
  app = app.replace(
    engineMarker,
    `${engineMarker}\nconst ${MARKER} = true;\nconst PAGE_DEFAULT_RULES = { enabled: false, conditionLogic: 'AND', conditions: [], sortBy: 'l7d_desc', dedupeAcrossSections: true, distribution: 'section-order' };`
  );

  // 2) Resolve the whole page first, then each section according to its slot capacity.
  const resolveStart = app.indexOf('function resolveSection(section, region) {');
  const nextHelperStart = app.indexOf('function ruleAttributeOptions(', resolveStart);
  if (resolveStart < 0 || nextHelperStart < 0) throw new Error('PAGE_RULES_V14: resolveSection anchors not found');

  const engine = `function buildPageCandidatePool(pageRules, region) {
  const rules = { ...PAGE_DEFAULT_RULES, ...(pageRules || {}), conditions: pageRules?.conditions || [] };
  const conditions = validConditions(rules);
  const matched = rules.enabled && conditions.length
    ? PRODUCTS.filter((product) => productMatchesSectionRules(product, rules, region))
    : PRODUCTS;
  return sortCandidates(matched, rules, region);
}

function resolveSection(section, region, pageContext = null) {
  const rules = { ...DEFAULT_RULES, ...(section.rules || {}) };
  const conditions = validConditions(rules);
  const useSectionRules = rules.fillMode === 'rules';
  const inheritPageRules = Boolean(pageContext?.enabled && rules.inheritPageRules !== false);
  const applySectionConditions = useSectionRules && conditions.length > 0;
  const basePool = inheritPageRules ? pageContext.pool : PRODUCTS;
  const needsCandidates = inheritPageRules || useSectionRules || rules.oos === 'fallback';

  let allCandidates = [];
  if (needsCandidates) {
    if (applySectionConditions) allCandidates = basePool.filter((product) => productMatchesSectionRules(product, rules, region));
    else if (inheritPageRules) allCandidates = [...basePool];
    else if (useSectionRules && conditions.length) allCandidates = PRODUCTS.filter((product) => productMatchesSectionRules(product, rules, region));
    else if (rules.oos === 'fallback' && conditions.length) allCandidates = PRODUCTS.filter((product) => productMatchesSectionRules(product, rules, region));
  }

  const inStock = allCandidates.filter((product) => (product.stock?.[region] ?? product.stockValue ?? 0) > 0);
  const availableCandidates = inheritPageRules && !useSectionRules ? inStock : sortCandidates(inStock, rules, region);
  const usedInSection = new Set();

  const blockedForAuto = (product) => {
    if (!inheritPageRules || !pageContext.dedupeAcrossSections) return false;
    return pageContext.usedAcross.has(product.id) || pageContext.pinnedAcross.has(product.id);
  };
  const rememberAuto = (product) => {
    if (inheritPageRules && product?.id) pageContext.usedAcross.add(product.id);
  };
  const nextAvailable = () => availableCandidates.find((product) => (!rules.dedupe || !usedInSection.has(product.id)) && !blockedForAuto(product));

  const resolvedSlots = Array.from({ length: slotCount(section.template) }, (_, index) => {
    const pinId = section.pins[index];
    if (pinId) {
      const entity = getEntity(pinId);
      if (!entity) return { index, status: 'empty', entity: null, warning: 'Контент не найден' };
      if (entityKind(pinId) !== 'product') return { index, status: 'pin', entity, origin: 'manual' };

      const available = (entity.stock?.[region] ?? entity.stockValue ?? 0) > 0;
      usedInSection.add(entity.id);
      if (available) return { index, status: 'pin', entity, origin: 'manual' };
      if (rules.oos === 'keep') return { index, status: 'pin', entity, warning: 'Нет в наличии', origin: 'manual' };
      if (rules.oos === 'collapse') return emptySlotResult(index, { ...rules, emptyBehavior: 'collapse-center' }, 'Товар скрыт: нет в наличии');

      if (rules.oos === 'fallback') {
        const canReplace = inheritPageRules || (conditions.length > 0 && (useSectionRules || rules.oos === 'fallback'));
        if (!canReplace) return { index, status: 'pin', entity, warning: 'Для автозамены нужны правила отбора', origin: 'manual' };
        const replacement = nextAvailable();
        if (replacement) {
          usedInSection.add(replacement.id);
          rememberAuto(replacement);
          return { index, status: 'auto', entity: replacement, warning: 'Автозамена PIN', origin: inheritPageRules ? (applySectionConditions ? 'page+section' : 'page') : 'section' };
        }
        return emptySlotResult(index, rules, 'Замена не найдена');
      }
    }

    // Page rules are an independent automation layer. When inherited, they can fill a section
    // even if no section-specific automatic rule is configured.
    if (!inheritPageRules && !useSectionRules) return { index, status: 'empty', entity: null };
    if (!inheritPageRules && useSectionRules && !conditions.length) return { index, status: 'empty', entity: null, warning: 'Настройте правила отбора' };

    const next = nextAvailable();
    if (!next) return emptySlotResult(index, rules, 'Кандидаты закончились');
    usedInSection.add(next.id);
    rememberAuto(next);
    return { index, status: 'auto', entity: next, origin: inheritPageRules ? (applySectionConditions ? 'page+section' : 'page') : 'section' };
  });

  return { ...section, rules, inheritPageRules, resolvedSlots, candidates: allCandidates, availableCandidates };
}

function resolvePageSections(sections, region, pageRules) {
  const rules = { ...PAGE_DEFAULT_RULES, ...(pageRules || {}), conditions: pageRules?.conditions || [] };
  const pool = buildPageCandidatePool(rules, region);
  const pinnedAcross = new Set(
    sections.flatMap((section) => Object.values(section.pins || {}))
      .filter((id) => entityKind(id) === 'product')
  );
  const pageContext = {
    enabled: Boolean(rules.enabled),
    pool,
    usedAcross: new Set(),
    pinnedAcross,
    dedupeAcrossSections: Boolean(rules.dedupeAcrossSections),
  };

  const resolvedSections = sections.map((section) => resolveSection(section, region, pageContext));
  const allSlots = resolvedSections.flatMap((section) => section.resolvedSlots);
  const productSlots = allSlots.filter((slot) => slot.entity && entityKind(slot.entity.id) === 'product');
  const displayedIds = new Set(productSlots.map((slot) => slot.entity.id));
  const reserve = pool.filter((product) => (product.stock?.[region] ?? product.stockValue ?? 0) > 0 && !displayedIds.has(product.id));

  return {
    sections: resolvedSections,
    pool,
    reserve,
    totalCapacity: resolvedSections.reduce((sum, section) => sum + slotCount(section.template), 0),
    pinned: allSlots.filter((slot) => slot.status === 'pin').length,
    auto: allSlots.filter((slot) => slot.status === 'auto').length,
    displayed: productSlots.length,
  };
}

`;
  app = app.slice(0, resolveStart) + engine + app.slice(nextHelperStart);

  // 3) Page-level rule editor. It reuses the same product attributes/operators as section rules.
  const exportAnchor = 'export default function AppV3() {';
  if (!app.includes(exportAnchor)) throw new Error('PAGE_RULES_V14: AppV3 export anchor not found');

  const modal = `function PageRulesModal({ open, onClose, rules, onChange, region, resolution }) {
  if (!open) return null;
  const normalized = { ...PAGE_DEFAULT_RULES, ...(rules || {}), conditions: rules?.conditions || [] };
  const update = (patch) => onChange({ ...normalized, ...patch });
  const addCondition = () => {
    const first = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === 'department') || PRODUCT_RULE_ATTRIBUTES[0];
    update({ conditions: [...normalized.conditions, { id: 'page-rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), attribute: first.key, operator: 'eq', value: '' }] });
  };
  const updateCondition = (id, patch) => update({ conditions: normalized.conditions.map((condition) => condition.id === id ? { ...condition, ...patch } : condition) });
  const removeCondition = (id) => update({ conditions: normalized.conditions.filter((condition) => condition.id !== id) });
  const active = validConditions(normalized).length;

  return <div className="modal-backdrop page-rules-backdrop" onClick={onClose}>
    <div className="page-rules-modal" onClick={(event) => event.stopPropagation()}>
      <div className="page-rules-head">
        <div><span>ПРАВИЛА СТРАНИЦЫ</span><h2>Автоматическое наполнение всей страницы</h2><p>Общий пул формируется один раз, после чего товары распределяются по секциям сверху вниз. Макет каждой секции определяет её физическую ёмкость.</p></div>
        <button onClick={onClose}><X size={18}/></button>
      </div>
      <div className="page-rules-body">
        <div className="page-rules-editor-column">
          <div className="page-rule-master"><label><input type="checkbox" checked={normalized.enabled} onChange={(event) => update({ enabled: event.target.checked })}/><span><strong>Автоматизировать наполнение страницы</strong><small>{normalized.enabled ? 'PAGE RULES активны' : 'Сейчас работают только правила отдельных секций'}</small></span></label></div>

          <details className="rule-accordion" open>
            <summary><span>1. Какие товары участвуют</span><em>{active ? active + ' усл.' : 'Все товары'}</em></summary>
            <div className="rule-accordion-body">
              <div className="rule-sentence">Товар должен соответствовать <select value={normalized.conditionLogic} onChange={(event) => update({ conditionLogic: event.target.value })}><option value="AND">всем условиям</option><option value="OR">хотя бы одному условию</option></select></div>
              <div className="rule-cards">{normalized.conditions.map((condition, index) => {
                const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute) || PRODUCT_RULE_ATTRIBUTES[0];
                const operators = RULE_OPERATORS[definition.type] || RULE_OPERATORS.text;
                const options = ruleAttributeOptions(definition.key, region);
                return <React.Fragment key={condition.id || index}>
                  {index > 0 && <div className="rule-joiner">{normalized.conditionLogic}</div>}
                  <div className="rule-condition-card">
                    <div className="rule-condition-head"><span>Условие {index + 1}</span><button title="Удалить" onClick={() => removeCondition(condition.id)}><Trash2 size={13}/></button></div>
                    <select className="rule-field" value={condition.attribute} onChange={(event) => { const attribute = event.target.value; const nextDef = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === attribute) || PRODUCT_RULE_ATTRIBUTES[0]; updateCondition(condition.id, { attribute, operator: (RULE_OPERATORS[nextDef.type] || RULE_OPERATORS.text)[0][0], value: '' }); }}>{PRODUCT_RULE_ATTRIBUTES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
                    <div className="rule-value-row"><select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value })}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{options.length ? <select value={String(condition.value ?? '')} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}><option value="">Выберите значение</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={definition.type === 'number' ? 'number' : 'text'} value={condition.value ?? ''} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} placeholder="Значение"/>}</div>
                  </div>
                </React.Fragment>;
              })}{!normalized.conditions.length && <div className="rules-empty-state"><strong>В master-pool попадает весь каталог</strong><span>Добавьте условие, например: Отдел = Женщины или Коллекция = New.</span></div>}</div>
              <div className="rule-actions"><button className="rule-add" onClick={addCondition}><Plus size={13}/>Добавить условие</button>{normalized.conditions.length > 0 && <button className="rule-clear" onClick={() => update({ conditions: [] })}>Очистить</button>}</div>
            </div>
          </details>

          <details className="rule-accordion" open>
            <summary><span>2. Как распределять</span><em>По макетам секций</em></summary>
            <div className="rule-accordion-body">
              <label className="page-rule-field"><span>Порядок товаров</span><select value={normalized.sortBy} onChange={(event) => update({ sortBy: event.target.value })}>{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="page-rule-field"><span>Заполнение</span><select value={normalized.distribution} onChange={(event) => update({ distribution: event.target.value })}><option value="section-order">Секции сверху вниз → слоты слева направо</option></select></label>
              <label className="page-rule-check"><input type="checkbox" checked={normalized.dedupeAcrossSections} onChange={(event) => update({ dedupeAcrossSections: event.target.checked })}/><span><strong>Не повторять AUTO-товар в разных секциях</strong><small>PIN всегда сильнее автоматизации; вручную закреплённые дубли разрешены.</small></span></label>
              <div className="page-rule-flow"><b>PAGE POOL</b><i>→</i><b>СЕКЦИЯ 1</b><i>→</i><b>СЕКЦИЯ 2</b><i>→</i><b>РЕЗЕРВ</b></div>
            </div>
          </details>
        </div>

        <aside className="page-rules-preview">
          <span>РАСПРЕДЕЛЕНИЕ · {region}</span>
          <div className="page-rule-kpis"><div><small>Кандидатов</small><strong>{resolution.pool.length}</strong></div><div><small>Всего слотов</small><strong>{resolution.totalCapacity}</strong></div><div><small>AUTO</small><strong>{resolution.auto}</strong></div><div><small>PIN</small><strong>{resolution.pinned}</strong></div><div><small>Товаров показано</small><strong>{resolution.displayed}</strong></div><div><small>Резерв</small><strong>{resolution.reserve.length}</strong></div></div>
          <div className="page-section-allocation">{resolution.sections.map((section, index) => {
            const filled = section.resolvedSlots.filter((slot) => slot.entity).length;
            const auto = section.resolvedSlots.filter((slot) => slot.status === 'auto').length;
            const pins = section.resolvedSlots.filter((slot) => slot.status === 'pin').length;
            return <div key={section.id}><b>{index + 1}</b><span><strong>{section.titles?.ru || 'Секция ' + (index + 1)}</strong><small>{slotCount(section.template)} слотов · {filled} заполнено · {auto} AUTO · {pins} PIN</small><em>{section.inheritPageRules ? 'PAGE + SECTION' : 'SECTION ONLY'}</em></span></div>;
          })}</div>
          <div className="page-reserve-note"><strong>Пример: 3 слота и 10 кандидатов</strong><span>Первая секция может взять максимум 3 товара. Остальные переходят в общий резерв и используются следующими секциями. Если у секции есть свои правила, она выбирает из page-pool только подходящие ей товары.</span></div>
        </aside>
      </div>
      <div className="page-rules-footer"><span>{normalized.enabled ? 'Автоматизация страницы включена' : 'Автоматизация страницы выключена'}</span><button onClick={onClose}>Готово</button></div>
    </div>
  </div>;
}

`;
  app = app.replace(exportAnchor, modal + exportAnchor);

  // 4) State is inserted directly into AppV3, independent of older toolbar states.
  app = app.replace(
    exportAnchor,
    `${exportAnchor}\n  const [showPageRules, setShowPageRules] = useState(false);\n  const [pageRulesByPage, setPageRulesByPage] = useState({});`
  );

  // 5) Replace the old section-by-section resolver with the page resolver.
  const resolvedRegex = /  const resolved = useMemo\(\(\) => sections\.map\(\(s\) => resolveSection\(s, region\)\), \[[^\]]+\]\);/;
  if (!resolvedRegex.test(app)) throw new Error('PAGE_RULES_V14: resolved useMemo not found');
  app = app.replace(resolvedRegex, `  const pageRuleKey = region + ':' + pageId;
  const pageRules = { ...PAGE_DEFAULT_RULES, ...(pageRulesByPage[pageRuleKey] || {}), conditions: pageRulesByPage[pageRuleKey]?.conditions || [] };
  const setPageRules = (nextRules) => setPageRulesByPage((prev) => ({ ...prev, [pageRuleKey]: { ...PAGE_DEFAULT_RULES, ...(nextRules || {}) } }));
  const pageResolution = useMemo(() => resolvePageSections(sections, region, pageRules), [sections, region, pageRulesByPage, pageRuleKey]);
  const resolved = pageResolution.sections;`);

  // 6) Section-level rules can opt out of the page master-pool.
  const sectionSettingsAnchor = 'return <div className="section-settings-v11">';
  if (!app.includes(sectionSettingsAnchor)) throw new Error('PAGE_RULES_V14: SectionSettingsPanel anchor not found');
  app = app.replace(sectionSettingsAnchor, `return <div className="section-settings-v11"><div className="page-inheritance-control"><label><input type="checkbox" checked={rules.inheritPageRules !== false} onChange={(event) => updateRules({ inheritPageRules: event.target.checked })}/><span><strong>Наследовать правила страницы</strong><small>PAGE формирует общий пул. Если здесь включено «По правилам», условия секции дополнительно сужают этот пул.</small></span></label></div>`);

  // 7) Stable entry point beside the current inline layout picker.
  const picker = '<InlineLayoutPicker open={showAdd} onToggle={() => setShowAdd((value) => !value)} onAdd={addType} device={device}/>';
  if (!app.includes(picker)) throw new Error('PAGE_RULES_V14: InlineLayoutPicker anchor not found');
  app = app.replace(picker, `<div className="page-layout-actions">
    <button className={pageRules.enabled ? 'page-rules-entry active' : 'page-rules-entry'} onClick={() => setShowPageRules(true)}><Sparkles size={15}/><span><strong>Правила страницы</strong><small>Автоматическое распределение по секциям</small></span><em>{pageRules.enabled ? 'ON' : 'OFF'}</em></button>
    ${picker}
    <PageRulesModal open={showPageRules} onClose={() => setShowPageRules(false)} rules={pageRules} onChange={setPageRules} region={region} resolution={pageResolution}/>
  </div>`);

  // Optional compact state in Main label when that label exists.
  const mainLabel = '<div className="main-canvas-label"><LayoutGrid size={15}/><strong>Main</strong><span>{resolved.length} секций</span></div>';
  if (app.includes(mainLabel)) {
    app = app.replace(mainLabel, '<div className="main-canvas-label"><LayoutGrid size={15}/><strong>Main</strong><span>{resolved.length} секций</span><em className={pageRules.enabled ? \'active\' : \'\'}>{pageRules.enabled ? \'PAGE RULES ON\' : \'PAGE RULES OFF\'}</em></div>');
  }

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
const CSS_MARKER = '/* page-rules-v14 */';
if (!css.includes(CSS_MARKER)) {
  css += `\n${CSS_MARKER}
.page-layout-actions{margin:14px 18px 26px;display:grid;gap:8px}.page-layout-actions .inline-layout-picker{margin:0!important}.page-rules-entry{width:100%;min-height:48px;border:1px solid #d9dde3;border-radius:8px;background:#fff;padding:8px 11px;display:grid;grid-template-columns:18px 1fr auto;align-items:center;gap:8px;text-align:left;cursor:pointer;color:#3d434c}.page-rules-entry:hover{border-color:#9da8b6;background:#fafbfc}.page-rules-entry.active{background:#20242a;color:#fff;border-color:#20242a}.page-rules-entry>span{display:grid;gap:2px}.page-rules-entry strong{font-size:10px}.page-rules-entry small{font-size:8px;color:#858b94}.page-rules-entry.active small{color:#bfc4cb}.page-rules-entry em{font-style:normal;font-size:8px;font-weight:800;border:1px solid #d4d8dd;border-radius:999px;padding:3px 6px}.page-rules-entry.active em{border-color:#626872}.page-rules-backdrop{z-index:120!important}.page-rules-modal{width:min(1120px,94vw);max-height:92vh;background:#fff;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;color:#20242a}.page-rules-head{display:flex;justify-content:space-between;gap:20px;padding:20px 22px 16px;border-bottom:1px solid #e7e9ec}.page-rules-head>div{max-width:760px}.page-rules-head span,.page-rules-preview>span{display:block;font-size:8px;letter-spacing:.12em;color:#858b94;font-weight:800}.page-rules-head h2{font-size:20px;margin:5px 0 7px}.page-rules-head p{font-size:10px;line-height:1.5;color:#6d737c;margin:0}.page-rules-head>button{border:0;background:none;width:32px;height:32px;display:grid;place-items:center;cursor:pointer}.page-rules-body{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);min-height:0;overflow:hidden}.page-rules-editor-column{padding:14px 16px 30px;overflow:auto}.page-rules-preview{background:#f7f8fa;border-left:1px solid #e5e7ea;padding:16px;overflow:auto}.page-rule-master{border:1px solid #dfe2e6;border-radius:8px;padding:11px 12px;margin-bottom:10px;background:#fbfbfc}.page-rule-master label,.page-rule-check,.page-inheritance-control label{display:flex;align-items:flex-start;gap:9px;cursor:pointer}.page-rule-master input,.page-rule-check input,.page-inheritance-control input{margin-top:2px}.page-rule-master span,.page-rule-check span,.page-inheritance-control span{display:flex;flex-direction:column;gap:2px}.page-rule-master strong,.page-rule-check strong,.page-inheritance-control strong{font-size:10px}.page-rule-master small,.page-rule-check small,.page-inheritance-control small{font-size:8px;color:#777d86;line-height:1.4}.page-rule-field{display:grid;grid-template-columns:145px 1fr;gap:10px;align-items:center;margin:8px 0}.page-rule-field>span{font-size:9px;color:#666c74}.page-rule-field select{height:32px;border:1px solid #dfe1e5;border-radius:5px;background:#fff;padding:0 7px;font-size:9px}.page-rule-check{padding:10px 0 4px}.page-rule-flow{display:flex;align-items:center;justify-content:space-between;background:#1e2125;color:#fff;border-radius:7px;margin-top:10px;padding:10px 12px}.page-rule-flow b{font-size:8px;letter-spacing:.05em}.page-rule-flow i{font-style:normal;color:#7f858d}.page-rule-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:10px 0 14px}.page-rule-kpis>div{background:#fff;border:1px solid #e1e3e6;border-radius:7px;padding:9px}.page-rule-kpis small,.page-rule-kpis strong{display:block}.page-rule-kpis small{font-size:8px;color:#858a91}.page-rule-kpis strong{font-size:20px;margin-top:3px}.page-section-allocation{display:flex;flex-direction:column;gap:6px}.page-section-allocation>div{display:grid;grid-template-columns:26px 1fr;gap:8px;background:#fff;border:1px solid #e2e4e7;border-radius:7px;padding:8px}.page-section-allocation>div>b{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#1e2125;color:#fff;font-size:9px}.page-section-allocation>div>span{min-width:0}.page-section-allocation strong,.page-section-allocation small,.page-section-allocation em{display:block}.page-section-allocation strong{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.page-section-allocation small{font-size:8px;color:#777d86;margin-top:3px}.page-section-allocation em{font-style:normal;font-size:7px;letter-spacing:.05em;color:#555b64;margin-top:5px}.page-reserve-note{margin-top:12px;border:1px solid #dadde1;background:#fff;padding:10px;border-radius:7px}.page-reserve-note strong,.page-reserve-note span{display:block}.page-reserve-note strong{font-size:9px}.page-reserve-note span{font-size:8px;color:#737982;line-height:1.45;margin-top:4px}.page-rules-footer{border-top:1px solid #e5e7ea;padding:11px 16px;display:flex;align-items:center;justify-content:flex-end;gap:12px}.page-rules-footer span{font-size:9px;color:#777d86}.page-rules-footer button{height:32px;background:#1d2024;color:#fff;border:0;border-radius:6px;padding:0 18px;cursor:pointer}.page-inheritance-control{border:1px solid #dde1e5;background:#f8fafc;border-radius:7px;padding:9px 10px;margin:10px 12px 0}.main-canvas-label em{margin-left:4px;font-style:normal;font-size:8px;border:1px solid #dfe1e5;border-radius:999px;padding:3px 6px;color:#858a91}.main-canvas-label em.active{background:#1e2329;border-color:#1e2329;color:#fff}@media(max-width:900px){.page-rules-body{grid-template-columns:1fr}.page-rules-preview{border-left:0;border-top:1px solid #e5e7ea}.page-rules-modal{max-height:95vh}.page-rule-field{grid-template-columns:1fr}.page-rule-kpis{grid-template-columns:repeat(3,1fr)}}\n`;
  writeFileSync(cssPath, css);
}

console.log('Page-level rules v14 applied');
