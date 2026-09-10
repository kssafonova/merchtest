import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'SECTION_MULTISELECT_GROUP_RULES_V60';

function functionChunk(source, name) {
  const start = source.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(MARKER + ': function ' + name + ' missing');
  const end = source.indexOf('\nfunction ', start + name.length + 10);
  if (end < 0) throw new Error(MARKER + ': end of ' + name + ' missing');
  return { start, end, chunk: source.slice(start, end) };
}

if (!app.includes(MARKER)) {
  const markerAnchor = 'const MASTER_TABS_DND_STABILITY_V59 = true;';
  if (!app.includes(markerAnchor)) throw new Error(MARKER + ': V59 marker missing');

  const helpers = String.raw`
function GroupSectionRulesDrawerV60({ sections, region, onApply, onClose }) {
  const sourceRules = sections?.[0]?.rules || {};
  const [draftV60, setDraftV60] = useState(() => ({
    ...DEFAULT_RULES,
    ...sourceRules,
    conditions: (sourceRules.conditions || []).map((item) => ({ ...item }))
  }));
  const conditionsV60 = draftV60.conditions || [];
  const updateV60 = (patch) => setDraftV60((previous) => ({ ...previous, ...patch }));
  const addConditionV60 = () => {
    const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === 'category') || PRODUCT_RULE_ATTRIBUTES[0];
    updateV60({ conditions: [...conditionsV60, { id: 'group-rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), attribute: definition.key, operator: 'eq', value: '' }] });
  };
  const updateConditionV60 = (id, patch) => updateV60({ conditions: conditionsV60.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const removeConditionV60 = (id) => updateV60({ conditions: conditionsV60.filter((item) => item.id !== id) });
  const activeV60 = conditionsV60.filter((item) => String(item.value ?? '').trim() !== '').length;

  return createPortal(<div className="group-rules-layer-v60" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="group-rules-drawer-v60" onMouseDown={(event) => event.stopPropagation()}>
      <header className="group-rules-head-v60">
        <div><span>ГРУППОВАЯ АВТОМАТИЗАЦИЯ</span><strong>{sections.length} секций</strong><small>Одна конфигурация будет применена ко всем выбранным секциям. Ручные PIN сохранятся.</small></div>
        <button onClick={onClose} title="Закрыть"><X size={18}/></button>
      </header>
      <div className="group-rules-scroll-v60">
        <section className="group-rules-section-v60">
          <div className="group-rules-title-v60"><b>1</b><div><strong>Сценарий наполнения</strong><small>Для всех выбранных секций</small></div></div>
          <div className="group-rules-choice-v60">
            <button className={draftV60.fillMode !== 'rules' ? 'active' : ''} onClick={() => updateV60({ fillMode: 'manual' })}><strong>Вручную</strong><span>Автоматическое заполнение выключено</span></button>
            <button className={draftV60.fillMode === 'rules' ? 'active' : ''} onClick={() => updateV60({ fillMode: 'rules' })}><strong>По правилам</strong><span>Пустые слоты получают товары из выборки</span></button>
          </div>
        </section>

        <section className="group-rules-section-v60">
          <div className="group-rules-title-v60"><b>2</b><div><strong>Отбор товаров</strong><small>{activeV60} активных условий</small></div></div>
          <div className="group-rules-logic-v60"><span>Соответствует</span><div><button className={draftV60.conditionLogic === 'AND' ? 'active' : ''} onClick={() => updateV60({ conditionLogic: 'AND' })}>всем · И</button><button className={draftV60.conditionLogic === 'OR' ? 'active' : ''} onClick={() => updateV60({ conditionLogic: 'OR' })}>любому · ИЛИ</button></div></div>
          <div className="group-rules-conditions-v60">
            {conditionsV60.map((condition, index) => {
              const definition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === condition.attribute) || PRODUCT_RULE_ATTRIBUTES[0];
              const operators = RULE_OPERATORS[definition.type] || RULE_OPERATORS.text;
              const options = ruleAttributeOptions(definition.key, region);
              return <div className="group-rule-row-v60" key={condition.id || index}>
                <span>{index + 1}</span>
                <select value={condition.attribute} onChange={(event) => { const attribute = event.target.value; const nextDefinition = PRODUCT_RULE_ATTRIBUTES.find((item) => item.key === attribute) || PRODUCT_RULE_ATTRIBUTES[0]; const operator = (RULE_OPERATORS[nextDefinition.type] || RULE_OPERATORS.text)[0][0]; updateConditionV60(condition.id, { attribute, operator, value: '' }); }}>{PRODUCT_RULE_ATTRIBUTES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
                <select value={condition.operator} onChange={(event) => updateConditionV60(condition.id, { operator: event.target.value })}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                {options.length ? <select value={String(condition.value ?? '')} onChange={(event) => updateConditionV60(condition.id, { value: event.target.value })}><option value="">Значение</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={definition.type === 'number' ? 'number' : 'text'} value={condition.value ?? ''} onChange={(event) => updateConditionV60(condition.id, { value: event.target.value })} placeholder="Значение"/>}
                <button onClick={() => removeConditionV60(condition.id)} title="Удалить"><X size={13}/></button>
              </div>;
            })}
            {!conditionsV60.length && <div className="group-rules-empty-v60"><strong>Условия не заданы</strong><span>Добавьте условия, например «Категория = Платья».</span></div>}
          </div>
          <button className="group-rules-add-v60" onClick={addConditionV60}><Plus size={13}/>Добавить условие</button>
        </section>

        <section className="group-rules-section-v60">
          <div className="group-rules-title-v60"><b>3</b><div><strong>Сортировка и распределение</strong><small>Общий порядок кандидатов</small></div></div>
          <label className="group-rules-field-v60"><span>Сортировка</span><select value={draftV60.sortBy || 'l7d_desc'} onChange={(event) => updateV60({ sortBy: event.target.value })}>{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="group-rules-switch-v60"><div><strong>Не повторять товар</strong><small>SKU не дублируется внутри секции</small></div><input type="checkbox" checked={Boolean(draftV60.dedupe)} onChange={(event) => updateV60({ dedupe: event.target.checked })}/></label>
        </section>

        <section className="group-rules-section-v60">
          <div className="group-rules-title-v60"><b>4</b><div><strong>Fallback</strong><small>Если товар закончился или кандидаты исчерпаны</small></div></div>
          <div className="group-rules-choice-v60 three">
            <button className={draftV60.oos === 'fallback' ? 'active' : ''} onClick={() => updateV60({ oos: 'fallback' })}><strong>Заменить</strong><span>Следующий товар</span></button>
            <button className={draftV60.oos === 'collapse' ? 'active' : ''} onClick={() => updateV60({ oos: 'collapse' })}><strong>Скрыть</strong><span>Схлопнуть слот</span></button>
            <button className={draftV60.oos === 'keep' ? 'active' : ''} onClick={() => updateV60({ oos: 'keep' })}><strong>Оставить</strong><span>Показывать OOS</span></button>
          </div>
          <label className="group-rules-field-v60"><span>Если кандидаты закончились</span><select value={draftV60.emptyBehavior || 'collapse-center'} onChange={(event) => updateV60({ emptyBehavior: event.target.value })}><option value="collapse-center">Схлопнуть слот и центрировать</option><option value="keep">Оставить слот пустым</option></select></label>
        </section>
      </div>
      <footer className="group-rules-footer-v60"><button onClick={onClose}>Отмена</button><button className="primary" onClick={() => onApply(draftV60)}>Применить к {sections.length} секциям</button></footer>
    </aside>
  </div>, document.body);
}
`;

  app = app.replace(markerAnchor, markerAnchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  const selectedState = "const [selectedId, setSelectedId] = useState(null);";
  if (!app.includes(selectedState)) throw new Error(MARKER + ': selected state missing');
  app = app.replace(selectedState, selectedState + `
  const [selectedSectionIdsV60, setSelectedSectionIdsV60] = useState([]);
  const [selectionAnchorV60, setSelectionAnchorV60] = useState(null);
  const [groupRulesOpenV60, setGroupRulesOpenV60] = useState(false);`);

  const mutateAnchor = "  const mutateSections = (updater) => setCurrentSections(typeof updater === 'function' ? updater(sections) : updater, true);";
  if (!app.includes(mutateAnchor)) throw new Error(MARKER + ': mutateSections anchor missing');
  const selectionRuntime = String.raw`
  const selectedSectionIdsEffectiveV60 = selectedSectionIdsV60.length ? selectedSectionIdsV60 : (selectedId ? [selectedId] : []);
  const selectSectionV60 = (id, event = {}) => {
    if (!id) return;
    const order = resolved.map((item) => item.id);
    if (event.shiftKey && selectionAnchorV60 && order.includes(selectionAnchorV60)) {
      const first = order.indexOf(selectionAnchorV60);
      const second = order.indexOf(id);
      const [start, end] = first <= second ? [first, second] : [second, first];
      const range = order.slice(start, end + 1);
      setSelectedSectionIdsV60(range);
      setSelectedId(id);
    } else if (event.metaKey || event.ctrlKey || event.additiveV60) {
      setSelectedSectionIdsV60((previous) => {
        const base = previous.length ? previous : (selectedId ? [selectedId] : []);
        const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id];
        setSelectedId(next.length ? id : null);
        return next;
      });
      setSelectionAnchorV60(id);
    } else {
      setSelectedSectionIdsV60([id]);
      setSelectedId(id);
      setSelectionAnchorV60(id);
    }
    setRightTab('settings');
  };
  const clearSectionSelectionV60 = () => { setSelectedSectionIdsV60([]); setSelectedId(null); setSelectionAnchorV60(null); setGroupRulesOpenV60(false); };
  const moveSectionV60 = (id, delta) => mutateSections((previous) => {
    const index = previous.findIndex((item) => item.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= previous.length) return previous;
    const next = [...previous];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    return next;
  });
  const moveSectionDropV60 = (sourceId, targetId) => mutateSections((previous) => {
    const sourceIndex = previous.findIndex((item) => item.id === sourceId);
    const targetIndex = previous.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return previous;
    const next = [...previous];
    const [item] = next.splice(sourceIndex, 1);
    const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    next.splice(adjustedTarget, 0, item);
    return next;
  });
  const duplicateSectionSetV60 = (ids) => {
    const selectedSet = new Set(ids || []);
    const createdIds = [];
    mutateSections((previous) => {
      const next = [];
      previous.forEach((item) => {
        next.push(item);
        if (selectedSet.has(item.id)) {
          const cloneId = item.id + '-copy-' + Math.random().toString(36).slice(2, 7);
          createdIds.push(cloneId);
          next.push({ ...item, id: cloneId, titles: { ...(item.titles || {}) }, pins: { ...(item.pins || {}) }, rules: { ...(item.rules || {}), conditions: (item.rules?.conditions || []).map((condition) => ({ ...condition })) }, layoutOverrides: item.layoutOverrides ? JSON.parse(JSON.stringify(item.layoutOverrides)) : item.layoutOverrides });
        }
      });
      return next;
    });
    window.setTimeout(() => { if (createdIds.length) { setSelectedSectionIdsV60(createdIds); setSelectedId(createdIds[createdIds.length - 1]); setSelectionAnchorV60(createdIds[0]); } }, 0);
  };
  const deleteSectionSetV60 = (ids) => {
    const target = new Set(ids || []);
    if (!target.size) return;
    mutateSections((previous) => previous.filter((item) => !target.has(item.id)));
    clearSectionSelectionV60();
  };
  const applyGroupRulesV60 = (nextRules) => {
    const target = new Set(selectedSectionIdsEffectiveV60);
    mutateSections((previous) => previous.map((item) => target.has(item.id) ? { ...item, rules: { ...(item.rules || {}), ...nextRules, conditions: (nextRules.conditions || []).map((condition) => ({ ...condition })) } } : item));
    setGroupRulesOpenV60(false);
    setToast('Авто-правила применены к ' + target.size + ' секциям');
    window.setTimeout(() => setToast(''), 1500);
  };
`;
  app = app.replace(mutateAnchor, mutateAnchor + selectionRuntime);

  // Upgrade SectionCanvas to understand selection groups and section-level movement/actions.
  const canvasPart = functionChunk(app, 'SectionCanvas');
  let canvas = canvasPart.chunk;
  canvas = canvas.replace(/function SectionCanvas\(\{([^}]*)\}\) \{/, (match, args) => {
    const additions = ['onMoveSectionV60','onMoveSectionDropV60','onDuplicateSectionV60','onDeleteSectionV60','onGroupRulesV60','selectedCountV60','sectionIndexV60','sectionCountV60'];
    let next = args;
    additions.forEach((name) => { if (!next.includes(name)) next += ', ' + name; });
    return 'function SectionCanvas({' + next + '}) {';
  });

  canvas = canvas.replace('onClick={() => onSelect(section.id)}', 'onClick={(event) => onSelect(section.id, event)}');

  // Section root accepts only the dedicated section drag payload, so slot/content DnD stays untouched.
  const rootNeedle = 'onClick={(event) => onSelect(section.id, event)}>';
  if (!canvas.includes(rootNeedle)) throw new Error(MARKER + ': SectionCanvas click root missing');
  canvas = canvas.replace(rootNeedle, `onClick={(event) => onSelect(section.id, event)}
    onDragOver={(event) => { if (Array.from(event.dataTransfer?.types || []).includes('application/x-storefront-section-v60')) { event.preventDefault(); event.currentTarget.classList.add('section-drop-target-v60'); } }}
    onDragLeave={(event) => { if (event.currentTarget === event.target || !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.classList.remove('section-drop-target-v60'); }}
    onDrop={(event) => { const sourceId = event.dataTransfer.getData('application/x-storefront-section-v60'); if (sourceId) { event.preventDefault(); event.stopPropagation(); event.currentTarget.classList.remove('section-drop-target-v60'); onMoveSectionDropV60?.(sourceId, section.id); } }}>`);

  const toolbarStart = canvas.indexOf("{editable !== false && <div className={'section-author-toolbar-v57 '");
  const toolbarEnd = toolbarStart >= 0 ? canvas.indexOf('\n    {styleDrawerOpenV57 &&', toolbarStart) : -1;
  if (toolbarStart < 0 || toolbarEnd < 0) throw new Error(MARKER + ': V57 toolbar boundaries missing');
  const toolbarV60 = String.raw`{editable !== false && <div className={'section-author-toolbar-v57 section-author-toolbar-v60 ' + (selected ? 'visible' : '')} onClick={(event) => event.stopPropagation()}>
      <button className={'section-select-toggle-v60 ' + (selected ? 'active' : '')} title={selected ? 'Убрать из выделения' : 'Добавить к выделению'} onClick={() => onSelect(section.id, { additiveV60: true })}><span>{selected ? '✓' : ''}</span></button>
      <span className="section-author-drag-v57 section-author-drag-v60" title="Drag & drop · переместить секцию" draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-storefront-section-v60', section.id); }} onDragEnd={() => document.querySelectorAll('.section-drop-target-v60').forEach((node) => node.classList.remove('section-drop-target-v60'))}><GripVertical size={14}/></span>
      <div className="section-author-identity-v57 section-author-identity-v60"><strong>{section.titles?.[locale] || section.titles?.ru || 'Секция'}</strong><small>{layoutDisplayName(section.template)} · {section.resolvedSlots?.filter((slot) => slot.entity).length || 0}/{section.resolvedSlots?.length || 0}</small></div>
      <button className="section-author-action-v57" onClick={() => { onSelect(section.id); setStyleDrawerOpenV57(true); }}><LayoutGrid size={13}/><span>Стиль</span></button>
      <button className="section-author-action-v57" onClick={() => { if (selectedCountV60 > 1) onGroupRulesV60?.(); else { onSelect(section.id); window.setTimeout(openSectionRulesFromCanvasV57, 0); } }}><Sparkles size={13}/><span>Авто-правила</span></button>
      <button className="section-author-action-v57 section-author-icon-v60" title="Переместить выше" disabled={sectionIndexV60 <= 0} onClick={() => onMoveSectionV60?.(section.id, -1)}>↑</button>
      <button className="section-author-action-v57 section-author-icon-v60" title="Переместить ниже" disabled={sectionIndexV60 >= sectionCountV60 - 1} onClick={() => onMoveSectionV60?.(section.id, 1)}>↓</button>
      <button className="section-author-action-v57 section-author-icon-v60" title="Дублировать" onClick={() => onDuplicateSectionV60?.([section.id])}><Copy size={13}/></button>
      <button className="section-author-action-v57 section-author-icon-v60 danger" title="Удалить" onClick={() => onDeleteSectionV60?.([section.id])}><Trash2 size={13}/></button>
    </div>}`;
  canvas = canvas.slice(0, toolbarStart) + toolbarV60 + canvas.slice(toolbarEnd);
  app = app.slice(0, canvasPart.start) + canvas + app.slice(canvasPart.end);

  // Canvas render: one selection source of truth for single and multiple selection.
  app = app.replace(/selected=\{!previewMode && selectedId === section\.id\}/g, "selected={!previewMode && selectedSectionIdsEffectiveV60.includes(section.id)}");
  app = app.replace(/onSelect=\{setSelectedId\}/g, 'onSelect={selectSectionV60}');

  const sectionCallPattern = /<SectionCanvas key=\{section\.id\} section=\{section\}[\s\S]*?\/>/g;
  let sectionCallCount = 0;
  app = app.replace(sectionCallPattern, (match) => {
    sectionCallCount += 1;
    if (match.includes('onMoveSectionV60=')) return match;
    return match.replace('/>', ` onMoveSectionV60={moveSectionV60} onMoveSectionDropV60={moveSectionDropV60} onDuplicateSectionV60={duplicateSectionSetV60} onDeleteSectionV60={deleteSectionSetV60} onGroupRulesV60={() => setGroupRulesOpenV60(true)} selectedCountV60={selectedSectionIdsEffectiveV60.length} sectionIndexV60={resolved.findIndex((item) => item.id === section.id)} sectionCountV60={resolved.length}/>`);
  });
  if (!sectionCallCount) throw new Error(MARKER + ': SectionCanvas render call missing');

  // Current AEM Structure tree shares the same selection state and modifier-key semantics.
  const treeClass = "className={selectedId === section.id ? 'selected' : ''}";
  if (app.includes(treeClass)) app = app.replaceAll(treeClass, "className={selectedSectionIdsEffectiveV60.includes(section.id) ? 'selected multi-selected-v60' : ''}");
  const treeClick = "onClick={() => { setSelectedId(section.id); setRightTab('settings'); }}";
  if (app.includes(treeClick)) app = app.replaceAll(treeClick, "onClick={(event) => selectSectionV60(section.id, event)}");

  // Legacy structure row, kept for compatibility if an earlier shell is ever restored.
  app = app.replace(/className=\{`tree-type \$\{selectedId === s\.id \? 'selected' : ''\}`\} onClick=\{\(\) => setSelectedId\(s\.id\)\}/g, "className={`tree-type ${selectedSectionIdsEffectiveV60.includes(s.id) ? 'selected multi-selected-v60' : ''}`} onClick={(event) => selectSectionV60(s.id, event)}");

  // Group action bar is inside the central editing area and scrolls with the canvas content.
  const canvasShellAnchor = '<section className="canvas-shell">';
  if (!app.includes(canvasShellAnchor)) throw new Error(MARKER + ': canvas shell anchor missing');
  const groupBar = String.raw`<section className="canvas-shell">
        {!previewMode && selectedSectionIdsEffectiveV60.length > 1 && <div className="multi-section-bar-v60">
          <div><span className="multi-count-v60">{selectedSectionIdsEffectiveV60.length}</span><span><strong>Секций выбрано</strong><small>Shift — диапазон · Cmd/Ctrl — добавить или убрать</small></span></div>
          <div className="multi-actions-v60"><button className="primary" onClick={() => setGroupRulesOpenV60(true)}><Sparkles size={13}/>Авто-правила</button><button onClick={() => duplicateSectionSetV60(selectedSectionIdsEffectiveV60)}><Copy size={13}/>Дублировать</button><button className="danger" onClick={() => deleteSectionSetV60(selectedSectionIdsEffectiveV60)}><Trash2 size={13}/>Удалить</button><button onClick={clearSectionSelectionV60}><X size={13}/>Снять выделение</button></div>
        </div>}`;
  app = app.replace(canvasShellAnchor, groupBar);

  const modalAnchor = '<AddTypeModal open={showAdd}';
  if (!app.includes(modalAnchor)) throw new Error(MARKER + ': AddTypeModal anchor missing');
  app = app.replace(modalAnchor, `{groupRulesOpenV60 && selectedSectionIdsEffectiveV60.length > 1 && <GroupSectionRulesDrawerV60 sections={sections.filter((item) => selectedSectionIdsEffectiveV60.includes(item.id))} region={region} onApply={applyGroupRulesV60} onClose={() => setGroupRulesOpenV60(false)}/>}
    ${modalAnchor}`);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* section-multiselect-group-rules-v60 */')) {
  css += String.raw`
/* section-multiselect-group-rules-v60 */
/* Selected section: strong AEM-blue identity, quiet white action strip. */
.builder-section.selected{border-color:#2680eb!important;box-shadow:0 0 0 1px #2680eb inset!important}
.builder-section.selected .section-author-toolbar-v60{border-color:#2680eb!important}
.builder-section.selected .section-author-identity-v60 strong{color:#1473e6!important}
.section-author-toolbar-v60{max-width:calc(100% + 2px)!important;overflow:visible!important}
.section-select-toggle-v60{width:34px;min-width:34px;border:0;border-right:1px solid #dedede;background:#fff;display:grid;place-items:center;cursor:pointer}
.section-select-toggle-v60>span{width:14px;height:14px;border:1px solid #9b9b9b;display:grid;place-items:center;font-size:10px;line-height:1;color:#fff;background:#fff}
.section-select-toggle-v60.active>span{background:#2680eb;border-color:#2680eb}
.section-author-drag-v60{cursor:grab!important}.section-author-drag-v60:active{cursor:grabbing!important}
.section-author-icon-v60{width:34px!important;padding:0!important;justify-content:center!important;font-size:15px!important;font-weight:400!important}
.section-author-icon-v60:disabled{opacity:.28!important;cursor:not-allowed!important;background:#fff!important}.section-author-icon-v60.danger:hover{color:#b42318!important;background:#fff5f4!important}
.section-drop-target-v60{outline:2px solid #2680eb!important;outline-offset:3px!important}

/* Structure and canvas use the same visual selection language. */
.aem-content-tree-sections-v40>button.multi-selected-v60,.section-tree>button.multi-selected-v60{background:#eaf3ff!important;color:#111!important;box-shadow:inset 2px 0 0 #2680eb!important}
.aem-content-tree-sections-v40>button.multi-selected-v60::after{content:'✓';margin-left:auto;color:#1473e6;font-size:10px;font-weight:700}

/* Group bar belongs to the canvas and therefore scrolls with the editing area. */
.multi-section-bar-v60{margin:0 0 16px;padding:9px 10px 9px 12px;background:#fff;border:1px solid #2680eb;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;color:#111}
.multi-section-bar-v60>div:first-child{display:flex;align-items:center;gap:9px}.multi-count-v60{width:25px;height:25px;background:#2680eb;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:700}
.multi-section-bar-v60>div:first-child>span:last-child{display:grid;gap:1px}.multi-section-bar-v60 strong{font-size:10px;font-weight:600}.multi-section-bar-v60 small{font-size:7px;color:#777}
.multi-actions-v60{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.multi-actions-v60 button{height:30px;padding:0 9px;border:1px solid #d2d2d2;background:#fff;color:#333;display:flex;align-items:center;gap:5px;font-size:8px;font-weight:600;cursor:pointer}.multi-actions-v60 button:hover{border-color:#111}.multi-actions-v60 button.primary{background:#111;color:#fff;border-color:#111}.multi-actions-v60 button.danger{color:#a52a22}

/* Group automation drawer */
.group-rules-layer-v60{position:fixed;inset:0;z-index:17000;background:rgba(15,15,15,.18)}
.group-rules-drawer-v60{position:absolute;top:0;right:0;bottom:0;width:min(560px,calc(100vw - 72px));background:#fff;border-left:1px solid #d6d6d6;box-shadow:-18px 0 46px rgba(0,0,0,.12);display:grid;grid-template-rows:auto minmax(0,1fr) auto;color:#111}
.group-rules-head-v60{min-height:84px;padding:17px 18px 15px 22px;border-bottom:1px solid #e5e5e5;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.group-rules-head-v60>div{display:grid;gap:3px;min-width:0}.group-rules-head-v60 span{font-size:8px;letter-spacing:.08em;color:#666}.group-rules-head-v60 strong{font-size:20px;font-weight:500}.group-rules-head-v60 small{font-size:8px;line-height:1.4;color:#828282}.group-rules-head-v60>button{width:32px;height:32px;border:0;background:#fff;display:grid;place-items:center;cursor:pointer}
.group-rules-scroll-v60{min-height:0;overflow-y:auto;padding:20px 22px 28px}.group-rules-section-v60{padding:0 0 24px;margin-bottom:24px;border-bottom:1px solid #e8e8e8}.group-rules-title-v60{display:flex;gap:9px;align-items:flex-start;margin-bottom:14px}.group-rules-title-v60>b{width:20px;height:20px;background:#111;color:#fff;display:grid;place-items:center;font-size:8px}.group-rules-title-v60>div{display:grid;gap:2px}.group-rules-title-v60 strong{font-size:12px;font-weight:600}.group-rules-title-v60 small{font-size:8px;color:#858585}
.group-rules-choice-v60{display:grid;grid-template-columns:1fr 1fr;border:1px solid #d7d7d7}.group-rules-choice-v60.three{grid-template-columns:repeat(3,1fr)}.group-rules-choice-v60 button{min-height:62px;padding:10px;border:0;border-right:1px solid #d7d7d7;background:#fff;text-align:left;display:grid;align-content:center;gap:4px;cursor:pointer}.group-rules-choice-v60 button:last-child{border-right:0}.group-rules-choice-v60 button.active{box-shadow:inset 0 -2px 0 #111;background:#fafafa}.group-rules-choice-v60 strong{font-size:10px}.group-rules-choice-v60 span{font-size:8px;color:#777;line-height:1.35}
.group-rules-logic-v60{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.group-rules-logic-v60>span{font-size:8px;color:#777}.group-rules-logic-v60>div{display:flex;border:1px solid #d6d6d6}.group-rules-logic-v60 button{height:28px;padding:0 9px;border:0;border-right:1px solid #d6d6d6;background:#fff;font-size:8px}.group-rules-logic-v60 button:last-child{border-right:0}.group-rules-logic-v60 button.active{background:#111;color:#fff}
.group-rules-conditions-v60{display:grid;gap:6px}.group-rule-row-v60{display:grid;grid-template-columns:22px minmax(110px,1fr) minmax(100px,1fr) minmax(110px,1fr) 28px;gap:5px;align-items:center}.group-rule-row-v60>span{font-size:8px;color:#777;text-align:center}.group-rule-row-v60 select,.group-rule-row-v60 input,.group-rules-field-v60 select{height:34px;border:1px solid #d7d7d7;background:#fff;padding:0 7px;font-size:8px;min-width:0}.group-rule-row-v60>button{height:30px;border:0;background:#fff;display:grid;place-items:center;color:#777}.group-rules-empty-v60{padding:18px;border:1px dashed #d4d4d4;background:#fafafa;display:grid;gap:3px;text-align:center}.group-rules-empty-v60 strong{font-size:10px}.group-rules-empty-v60 span{font-size:8px;color:#888}.group-rules-add-v60{margin-top:8px;height:32px;border:1px solid #d2d2d2;background:#fff;padding:0 10px;display:flex;align-items:center;gap:5px;font-size:8px}
.group-rules-field-v60{display:grid;gap:6px;margin-top:12px}.group-rules-field-v60>span{font-size:8px;color:#666}.group-rules-switch-v60{margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:14px}.group-rules-switch-v60>div{display:grid;gap:2px}.group-rules-switch-v60 strong{font-size:9px}.group-rules-switch-v60 small{font-size:8px;color:#888}.group-rules-switch-v60 input{width:16px;height:16px}
.group-rules-footer-v60{min-height:62px;padding:11px 18px;border-top:1px solid #e5e5e5;display:flex;justify-content:flex-end;align-items:center;gap:6px;background:#fff}.group-rules-footer-v60 button{height:36px;padding:0 14px;border:1px solid #ccc;background:#fff;font-size:9px}.group-rules-footer-v60 button.primary{background:#111;color:#fff;border-color:#111}

@media(max-width:980px){.section-author-action-v57 span{display:none!important}.section-author-identity-v60{min-width:120px!important;max-width:180px!important}.multi-section-bar-v60{align-items:flex-start;flex-direction:column}.group-rule-row-v60{grid-template-columns:22px 1fr 1fr}.group-rule-row-v60>*:nth-child(4){grid-column:2/4}.group-rule-row-v60>*:last-child{grid-column:4;grid-row:1}}
@media(max-width:640px){.group-rules-drawer-v60{width:100vw}.group-rules-choice-v60,.group-rules-choice-v60.three{grid-template-columns:1fr}.group-rules-choice-v60 button{border-right:0;border-bottom:1px solid #d7d7d7}.multi-actions-v60 button span{display:none}.section-author-identity-v60{display:none!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('V60 applied: section toolbar, multi-select, structure selection, DnD reorder and grouped automation rules');
