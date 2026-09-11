import { readFileSync, writeFileSync } from 'node:fs';

/**
 * V88 — the automation drawer stops being a settings form and becomes a decision.
 *
 * Before: eight controls, all expanded at once, in engineering language, numbered 2 and 3 with no 1,
 * with the top-level department filter above everything and «Настроить» given the same visual weight
 * as the presets. The candidate count ignored the colour limit, so the promised «153 товара» was not
 * the number that would be placed. Nothing anywhere said, in plain Russian, what the rule would do.
 *
 * After: two numbered steps — what to show and how much — then a plain-language sentence of the whole
 * rule and a preview of the products that will actually land, then one collapsed «Дополнительно» for
 * repeats, colours and the replacement chain.
 */

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const MARKER = 'RULES_UX_V88';

let app = readFileSync(appPath, 'utf8');
if (app.includes(MARKER)) {
  console.log('V88 already applied');
} else {
  const anchor = 'const MARKET_STOCK_V87 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V87 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // ---------------------------------------------------------------------------------------------
  // 1. Helpers: a plain-Russian sentence for the rule, and a preview of the real resulting pool.
  // ---------------------------------------------------------------------------------------------
  const helperAnchor = 'function UnifiedAutomationDrawerV69({';
  if (!app.includes(helperAnchor)) throw new Error(MARKER + ': drawer component missing');
  const helpers = String.raw`const AUTOMATION_SORT_SHORT_V88 = {
  'freshness:desc': 'сначала новые', 'freshness:asc': 'сначала ранние',
  'l7d:desc': 'сначала продаваемые', 'l7d:asc': 'сначала слабо продаваемые',
  'stock:desc': 'сначала с большим остатком', 'stock:asc': 'сначала с малым остатком',
  'sizeAvailability:asc': 'сначала с неполной размерной сеткой', 'sizeAvailability:desc': 'сначала с полной размерной сеткой',
  'price:desc': 'сначала дорогие', 'price:asc': 'сначала доступные',
  'discount:desc': 'сначала со скидкой', 'discount:asc': 'сначала без скидки',
  'margin:desc': 'сначала маржинальные', 'margin:asc': 'сначала низкомаржинальные',
  'id:asc': 'по артикулу', 'id:desc': 'по артикулу в обратном порядке',
};

// The number in the header used to be the raw in-stock match. It ignored the colour limit, so it
// promised more than the rule could place. This runs the same pipeline the resolver runs.
function automationPoolPreviewV88(rule, region, limit = 6) {
  try {
    const raw = queryAutomationIndexV63(rule?.selection, region).filter((product) => Number(automationProductValueV63(product, 'stock', region)) > 0);
    const limited = automationColorLimitV63(automationSortV63(raw, rule, region), rule);
    return { matched: raw.length, pool: limited.length, preview: limited.slice(0, limit) };
  } catch {
    return { matched: 0, pool: 0, preview: [] };
  }
}

function automationChainShortV88(steps) {
  const labels = { keep_oos: 'оставить на витрине', other_color: 'другой цвет модели', from_reserve: 'замена из резерва', fallback_category: 'резервная категория', collapse: 'схлопнуть слот' };
  return (steps || []).filter((item) => item?.enabled).map((item) => labels[item.step]).filter(Boolean);
}

function automationPlainRuleV88(options) {
  const { scenario, category, department, sortLevels, colorMode, colorCount, dedupe, showAll, fallbackSteps, isGroup } = options;
  if (scenario === 'category' && !category) return 'Выберите категорию — пока правило ничего не отберёт.';
  const subject = scenario === 'category'
    ? 'Товары категории «' + category + '»'
    : scenario === 'new' ? 'Новинки'
      : scenario === 'last_sizes' ? 'Товары с неполной размерной сеткой'
        : 'Товары по вашим условиям';
  const scope = department ? ', отдел «' + department + '»' : '';
  const first = (sortLevels || [])[0];
  // A preset whose sort just restates its own filter should not say it twice.
  const echoesSubject = first && ((scenario === 'last_sizes' && first.criterion === 'sizeAvailability')
    || (scenario === 'new' && first.criterion === 'freshness' && first.direction !== 'asc'));
  const order = first && !echoesSubject ? (AUTOMATION_SORT_SHORT_V88[first.criterion + ':' + (first.direction === 'asc' ? 'asc' : 'desc')] || '') : '';
  const colours = colorMode === 'all_colors' ? 'все цвета модели'
    : colorMode === 'fixed' ? 'по одному цвету модели'
      : 'до ' + Math.max(2, Number(colorCount) || 2) + ' цветов модели';
  const repeats = dedupe ? 'без повторов SKU между секциями' : 'повторы SKU разрешены';
  const volume = showAll
    ? (isGroup ? 'Комбинация секций повторится столько раз, сколько нужно, чтобы показать весь отбор.' : 'Секция повторится столько раз, сколько нужно, чтобы показать весь отбор.')
    : 'Лишние товары останутся в резерве.';
  const chain = automationChainShortV88(fallbackSteps);
  const fallback = chain.length ? 'Если товар закончился — ' + chain.join(', затем ') + '.' : 'Если товар закончился — слот схлопнется.';
  return [
    subject + scope + (order ? ', ' + order : '') + '.',
    colours.charAt(0).toUpperCase() + colours.slice(1) + ', ' + repeats + '.',
    volume,
    fallback,
  ].join(' ');
}

function UnifiedAutomationDrawerV69({`;
  app = app.replace(helperAnchor, helpers);

  // Accordion without a number renders as a plain heading.
  const accordionFrom = '<span><strong>{number}. {title}</strong>';
  if (!app.includes(accordionFrom)) throw new Error(MARKER + ': accordion head missing');
  app = app.replace(accordionFrom, '<span><strong>{number ? number + \'. \' : \'\'}{title}</strong>');

  // Advanced settings start closed: they all have defaults that are right most of the time.
  const openStateFrom = 'const [openV77,setOpenV77]=useState({distribution:true,oos:true});';
  if (!app.includes(openStateFrom)) throw new Error(MARKER + ': accordion state missing');
  app = app.replace(openStateFrom, 'const [openV77,setOpenV77]=useState({advanced:false});');

  // ---------------------------------------------------------------------------------------------
  // 2. Rebuild the drawer body.
  // ---------------------------------------------------------------------------------------------
  const bodyStart = '    <div className="automation-scroll-v76 automation-scroll-v77">';
  const bodyEndMarker = '      </AutomationAccordionV76>\n    </div>\n\n    <footer className="automation-footer-v76 automation-footer-v77">';
  const startIndex = app.indexOf(bodyStart);
  const endIndex = app.indexOf(bodyEndMarker);
  if (startIndex < 0 || endIndex < 0) throw new Error(MARKER + ': drawer body bounds missing');

  const previousBody = app.slice(startIndex, endIndex);
  // Reuse the existing custom-conditions block and the fallback editor verbatim; only the frame changes.
  const customBlockStart = previousBody.indexOf('<div className="automation-custom-v77">');
  const customBlockEnd = previousBody.indexOf('</div>}\n      </section>', customBlockStart);
  if (customBlockStart < 0 || customBlockEnd < 0) throw new Error(MARKER + ': custom conditions block missing');
  const customBlock = previousBody.slice(customBlockStart, customBlockEnd + '</div>'.length);

  const distributionStart = previousBody.indexOf('<div className="automation-option-group-v77"><strong>Все товары / Резерв</strong>');
  const distributionEnd = previousBody.indexOf('\n        </div>\n      </AutomationAccordionV76>', distributionStart);
  if (distributionStart < 0 || distributionEnd < 0) throw new Error(MARKER + ': distribution block missing');
  const distributionBlock = previousBody
    .slice(distributionStart, distributionEnd)
    .replace('<strong>Все товары / Резерв</strong>', '');

  const newBody = String.raw`    <div className="automation-scroll-v76 automation-scroll-v77 automation-scroll-v88">
      <section className="automation-step-v88">
        <div className="automation-step-head-v88"><b>1</b><div><strong>Что показываем</strong><small>Готовая механика отбора — её можно донастроить ниже</small></div></div>
        <div className="automation-scenario-grid-v77 automation-scenario-grid-v88">{AUTOMATION_SCENARIOS_V77.filter((scenario)=>scenario.key!=='custom').map((scenario)=><button key={scenario.key} className={scenarioV77===scenario.key?'active':''} onClick={()=>setScenarioV77(scenario.key)}><strong>{scenario.label}</strong><small>{scenario.hint}</small></button>)}</div>
        {scenarioV77==='category'&&<label className="automation-category-v77"><span>Категория</span><select value={scenarioCategoryV77} onChange={(event)=>setScenarioCategoryV77(event.target.value)}><option value="">Выберите категорию</option>{categoriesV77.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
        <div className="automation-step-extras-v88">
          <label className="automation-dep-v88"><span>Отдел</span><select value={scopeDepartmentV77} onChange={(event)=>setScopeDepartmentV77(event.target.value)}><option value="">Все отделы</option>{departmentsV77.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <button type="button" className={'automation-custom-link-v88 '+(scenarioV77==='custom'?'active':'')} onClick={()=>setScenarioV77(scenarioV77==='custom'?'new':'custom')}>{scenarioV77==='custom'?'Скрыть ручные условия':'Настроить условия вручную'}</button>
        </div>
        {scenarioV77==='custom'&&` + customBlock + String.raw`}
      </section>

      <section className="automation-step-v88">
        <div className="automation-step-head-v88"><b>2</b><div><strong>Сколько показываем</strong><small>Что делать с товарами, которые не поместились в слоты</small></div></div>
        ` + distributionBlock + String.raw`
      </section>

      <section className="automation-result-v88">
        <div className="automation-result-head-v88"><span>ЧТО ПОЛУЧИТСЯ</span>{memberIdsV77.length>1&&<button onClick={()=>setShowScopeV77((value)=>!value)}>Изменить состав секций</button>}</div>
        <p className="automation-result-sentence-v88">{automationPlainRuleV88({scenario:scenarioV77,category:scenarioCategoryV77,department:scopeDepartmentV77,sortLevels:(activeRuleV77?.sorting?.enabled?[activeRuleV77.sorting.level1,activeRuleV77.sorting.level2]:[]),colorMode:colorModeV77,colorCount:colorCountV77,dedupe:dedupeV77,showAll:showAllV77,fallbackSteps:fallbackStepsV77,isGroup})}</p>
        <div className="automation-result-numbers-v88">
          <span><b>{previewV88.pool}</b><small>{pluralRuV83(previewV88.pool,'товар подходит','товара подходят','товаров подходят')}</small></span>
          <span><b>{Math.min(freeSlotsV86,previewV88.pool)}</b><small>{showAllV77?'в первом повторе':pluralRuV83(Math.min(freeSlotsV86,previewV88.pool),'встанет в слот','встанут в слоты','встанут в слоты')}</small></span>
          <span><b>{showAllV77?0:Math.max(0,previewV88.pool-freeSlotsV86)}</b><small>в резерве</small></span>
          {pinnedSlotsV86>0&&<span className="pinned"><b>{pinnedSlotsV86}</b><small>{pluralRuV83(pinnedSlotsV86,'слот закреплён','слота закреплены','слотов закреплены')}</small></span>}
        </div>
        {previewV88.preview.length>0&&freeSlotsV86>0&&<div className="automation-result-preview-v88">{previewV88.preview.map((product,index)=>{const media=productMediaItems(product)[0];const url=typeof media==='string'?media:media?.src;return <figure key={product.id+'-'+index} className={index<freeSlotsV86?'placed':'reserved'}><span>{url?<img src={url} alt={product.name} loading="lazy"/>:null}</span><figcaption>{product.name}</figcaption></figure>;})}</div>}
        {freeSlotsV86===0&&pinnedSlotsV86>0&&<div className="automation-result-block-v88">Все слоты закреплены вручную — авто-правило ничего не изменит, пока PIN не снят.</div>}
        {showScopeV77&&<AutomationScopeEditorV76 memberIds={memberIdsV77} onChange={setMemberIdsV77} allSections={allSections}/>}
      </section>

      <AutomationAccordionV76 title="Дополнительно" summary={automationAdvancedSummaryV88} open={openV77.advanced} onToggle={()=>toggleOpen('advanced')}>
        <div className="automation-advanced-v88">
          <div className="automation-option-group-v77"><strong>Повторы SKU</strong><label className="automation-check-v77"><input type="checkbox" checked={dedupeV77} onChange={(event)=>setDedupeV77(event.target.checked)}/><span><b>Не повторять одну SKU в секциях</b><small>Включено по умолчанию</small></span></label></div>
          <div className="automation-option-group-v77"><strong>Сколько цветов одной модели</strong><div className="automation-radio-stack-v77"><label><input type="radio" name="color-v77" checked={colorModeV77==='all_colors'} onChange={()=>setColorModeV77('all_colors')}/><span><b>Все цвета</b><small>По умолчанию</small></span></label><label><input type="radio" name="color-v77" checked={colorModeV77==='fixed'} onChange={()=>setColorModeV77('fixed')}/><span><b>Только один цвет</b></span></label><label><input type="radio" name="color-v77" checked={colorModeV77==='custom'} onChange={()=>setColorModeV77('custom')}/><span><b>Не больше N цветов</b>{colorModeV77==='custom'&&<input type="number" min="2" max="20" value={colorCountV77} onChange={(event)=>setColorCountV77(Math.max(2,Number(event.target.value||2)))}/>}</span></label></div></div>
          <div className="automation-option-group-v77"><strong>Если товар закончился</strong><div className="automation-fallback-intro-v77">Порядок важен: выполняется первый доступный вариант, выключенные шаги пропускаются.</div><AutomationFallbackEditorV77 steps={fallbackStepsV77} onChange={setFallbackStepsV77} region={region}/></div>
        </div>
      </AutomationAccordionV76>
    </div>

    <footer className="automation-footer-v76 automation-footer-v77">`;
  app = app.slice(0, startIndex) + newBody + app.slice(endIndex + bodyEndMarker.length);

  // Preview + advanced summary are computed once per render, next to the other derived values.
  const derivedAnchor = 'const statsV77=automationGroupCandidateStatsV64(';
  if (!app.includes(derivedAnchor)) throw new Error(MARKER + ': stats anchor missing');
  app = app.replace(
    derivedAnchor,
    "const previewV88=automationPoolPreviewV88(activeRuleV77,region,8);\n  const automationAdvancedSummaryV88=[colorModeV77==='all_colors'?'все цвета':colorModeV77==='fixed'?'один цвет модели':'до '+colorCountV77+' цветов',dedupeV77?'без повторов SKU':'повторы разрешены',(automationChainShortV88(fallbackStepsV77).join(' → ')||'схлопнуть слот')].join(' · ');\n  " + derivedAnchor,
  );

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* rules-ux-v88 */')) {
  css += String.raw`
/* rules-ux-v88 */
.automation-scroll-v88{padding:0 30px 26px!important}
.automation-step-v88{padding:22px 0 20px!important;border-bottom:1px solid #ededed!important}
.automation-step-head-v88{display:flex!important;align-items:flex-start!important;gap:12px!important;margin-bottom:14px!important}
.automation-step-head-v88>b{flex:0 0 auto!important;width:22px!important;height:22px!important;display:grid!important;place-items:center!important;border-radius:50%!important;background:#17181d!important;color:#fff!important;font-size:11px!important;font-weight:700!important}
.automation-step-head-v88>div{display:grid!important;gap:2px!important}
.automation-step-head-v88 strong{font-size:15px!important;font-weight:600!important;color:#17181d!important}
.automation-step-head-v88 small{font-size:11px!important;color:#7d828a!important}
.automation-scenario-grid-v88{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}
.automation-step-extras-v88{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:16px!important;margin-top:14px!important}
.automation-dep-v88{display:grid!important;gap:5px!important;min-width:0!important;flex:0 1 280px!important}
.automation-dep-v88>span{font-size:10px!important;font-weight:600!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#8b9097!important}
.automation-dep-v88>select{height:36px!important;padding:0 10px!important;border:1px solid #dcdcdc!important;border-radius:6px!important;background:#fff!important;font-size:12px!important}
.automation-custom-link-v88{flex:0 0 auto!important;height:36px!important;padding:0 12px!important;border:1px solid transparent!important;border-radius:6px!important;background:transparent!important;color:#3d5fd1!important;font-size:12px!important;font-weight:600!important;cursor:pointer!important}
.automation-custom-link-v88:hover{background:#f2f5fd!important}
.automation-custom-link-v88.active{border-color:#d6ddf4!important;background:#f2f5fd!important}

/* What the rule will actually do — the block the drawer never had. */
.automation-result-v88{margin:20px 0 6px!important;padding:18px 20px!important;border:1px solid #e4e6ea!important;border-radius:10px!important;background:#fafafa!important}
.automation-result-head-v88{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin-bottom:10px!important}
.automation-result-head-v88>span{font-size:9px!important;font-weight:700!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#8b9097!important}
.automation-result-head-v88>button{border:1px solid #dcdcdc!important;border-radius:6px!important;background:#fff!important;padding:5px 10px!important;font-size:11px!important;cursor:pointer!important}
.automation-result-sentence-v88{margin:0 0 14px!important;font-size:13px!important;line-height:1.55!important;color:#23252b!important}
.automation-result-numbers-v88{display:flex!important;flex-wrap:wrap!important;gap:10px!important;margin-bottom:14px!important}
.automation-result-numbers-v88>span{display:flex!important;align-items:baseline!important;gap:6px!important;padding:7px 11px!important;border-radius:7px!important;background:#fff!important;border:1px solid #e6e8ec!important}
.automation-result-numbers-v88>span>b{font-size:15px!important;font-weight:700!important;color:#17181d!important}
.automation-result-numbers-v88>span>small{font-size:10.5px!important;color:#71767e!important}
.automation-result-numbers-v88>span.pinned{border-color:#e8d9bd!important;background:#fdf8ef!important}
.automation-result-preview-v88{display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:8px!important}
.automation-result-preview-v88 figure{margin:0!important;display:grid!important;gap:5px!important;min-width:0!important}
.automation-result-preview-v88 figure>span{display:block!important;position:relative!important;aspect-ratio:2/3!important;overflow:hidden!important;border-radius:5px!important;background:#efefee!important;border:1px solid #e6e8ec!important}
.automation-result-preview-v88 figure img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
.automation-result-preview-v88 figure.reserved>span{opacity:.4!important}
.automation-result-preview-v88 figure.reserved figcaption{color:#a2a6ad!important}
.automation-result-preview-v88 figcaption{font-size:9px!important;line-height:1.25!important;color:#6f747c!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
.automation-result-block-v88{margin-top:12px!important;padding:9px 12px!important;border-radius:7px!important;background:#fdf1ef!important;color:#9b4132!important;font-size:11.5px!important;line-height:1.45!important}

.automation-advanced-v88{display:grid!important;gap:22px!important}
@media (max-width:900px){
  .automation-scroll-v88{padding:0 16px 20px!important}
  .automation-scenario-grid-v88{grid-template-columns:1fr!important}
  .automation-step-extras-v88{flex-direction:column!important;align-items:stretch!important}
  /* In a column flex container flex-basis sizes the height — 280px of empty space under the label. */
  .automation-dep-v88{flex:0 0 auto!important}
  .automation-custom-link-v88{flex:0 0 auto!important;text-align:left!important;padding-left:0!important}
  .automation-result-preview-v88{grid-template-columns:repeat(4,minmax(0,1fr))!important}
  .automation-result-v88{padding:14px 14px!important}
  .automation-footer-v77>div>small{display:none!important}
  .automation-footer-v77>div{min-width:0!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('V88 applied: two-step rule drawer with a plain-language summary, a real result preview and one collapsed advanced block');
