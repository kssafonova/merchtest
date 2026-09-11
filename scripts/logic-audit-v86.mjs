import { readFileSync, writeFileSync } from 'node:fs';

/**
 * V86 — logic audit fixes.
 *
 * Findings from a full pass over content entities, page CRUD, sections, automation, slots and
 * metrics. Each fix is listed with the symptom that exposed it.
 */

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const MARKER = 'LOGIC_AUDIT_V86';

let app = readFileSync(appPath, 'utf8');
if (app.includes(MARKER)) {
  console.log('V86 already applied');
} else {
  const anchor = 'const RESPONSIVE_SHELL_V85 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V85 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // ---------------------------------------------------------------------------------------------
  // 1. BLOCKER — the whole app crashed on any page with zero sections.
  //
  // The empty-page branch read `pageRules.enabled`, but page-level rules were removed from this
  // component back in V49, so the identifier is not in scope. Every path that empties a page hit a
  // ReferenceError and the error boundary replaced the editor: creating a page, opening a page that
  // has no sections yet, or deleting the last section of a page.
  // ---------------------------------------------------------------------------------------------
  const crashFrom = ' : pageRules.enabled ? null : <div className="empty-page-state">';
  if (!app.includes(crashFrom)) throw new Error(MARKER + ': empty-page branch missing');
  app = app.replace(crashFrom, ' : <div className="empty-page-state">');

  // ---------------------------------------------------------------------------------------------
  // 2. Section «Резерв» reported the raw candidate count, not the reserve pool.
  //
  // sectionRuntimeMetrics derived reserve as `availableCandidates - placed`, which ignores the
  // colour limit, cross-section de-duplication and pins that the resolver already applied. A
  // three-slot section matching 161 candidates reported 158 in reserve while the resolver had a
  // pool of far fewer. The resolver publishes the real pool as reserveV63; use it.
  // ---------------------------------------------------------------------------------------------
  const reserveFrom = "  const reserve = Math.max(0, (section?.availableCandidates?.length || 0) - autoIds.size);";
  if (!app.includes(reserveFrom)) throw new Error(MARKER + ': section reserve metric missing');
  app = app.replace(
    reserveFrom,
    "  const reserve = Array.isArray(section?.reserveV63)\n    ? section.reserveV63.length\n    : Math.max(0, (section?.availableCandidates?.length || 0) - autoIds.size);",
  );

  // ---------------------------------------------------------------------------------------------
  // 3. Shift / Ctrl multi-select never worked, although a permanent banner instructs exactly that.
  //
  // A section's click handler carries the modifier keys, but every pixel of a section is covered by
  // a slot, and the slot stopped propagation unconditionally. The section handler therefore never
  // ran, selectionAnchorV60 was never set, and the only way into a group was the hover checkbox.
  // Modified clicks now fall through to the section, and a plain slot click sets the range anchor.
  // ---------------------------------------------------------------------------------------------
  const slotClickFrom = 'onClick={(e) => { e.stopPropagation(); onSelectSlot?.({ sectionId, slotIndex: slot.index }); }}';
  if (!app.includes(slotClickFrom)) throw new Error(MARKER + ': slot click handler missing');
  app = app.replace(
    slotClickFrom,
    'onClick={(e) => { if (e.shiftKey || e.metaKey || e.ctrlKey) return; e.stopPropagation(); onSelectSlot?.({ sectionId, slotIndex: slot.index }); }}',
  );

  const selectSlotFrom = "onSelectSlot={(slot) => { setSelectedSlot(slot); setSelectedId(slot.sectionId); setRightTab('content'); }}";
  if (!app.includes(selectSlotFrom)) throw new Error(MARKER + ': onSelectSlot handler missing');
  app = app.replace(
    selectSlotFrom,
    "onSelectSlot={(slot) => { setSelectedSlot(slot); setSelectedId(slot.sectionId); setSelectionAnchorV60(slot.sectionId); setRightTab('content'); }}",
  );

  // ---------------------------------------------------------------------------------------------
  // 4. A selection that matched nothing deleted manually pinned content.
  //
  // fallback.hideSection is on by default. When the rule returned no candidates the resolver
  // replaced every slot — pinned ones included — with an empty slot, so applying a too-narrow rule
  // silently wiped the merchandiser's own picks. Manual pins are manual: they survive.
  // ---------------------------------------------------------------------------------------------
  const hiddenFrom = "const hiddenSlots = Array.from({length:slotCapacity},(_,index)=>automationEmptySlotV63(index,rule,null,'Отбор не дал товаров · секция скрыта на live'));";
  if (!app.includes(hiddenFrom)) throw new Error(MARKER + ': hideSection branch missing');
  app = app.replace(
    hiddenFrom,
    "const hiddenSlots = Array.from({length:slotCapacity},(_,index)=>{\n      const pinnedId = section.pins?.[index];\n      const pinnedEntity = pinnedId ? getEntity(pinnedId) : null;\n      if (pinnedEntity) return {index,status:'pin',entity:pinnedEntity,origin:'manual',warning:'Отбор не дал товаров · ручной PIN сохранён'};\n      return automationEmptySlotV63(index,rule,null,'Отбор не дал товаров · секция скрыта на live');\n    });",
  );
  const hiddenStatusFrom = "const status = {coverage:0,reserveCount:0,pinCount:pinEntries.length,skuConflicts:0,lastRecalculatedAt:new Date().toISOString()};";
  if (!app.includes(hiddenStatusFrom)) throw new Error(MARKER + ': hideSection status missing');
  app = app.replace(
    hiddenStatusFrom,
    "const hiddenFilled = hiddenSlots.filter((slot)=>slot.entity).length;\n    const status = {coverage:slotCapacity?Math.round(hiddenFilled/slotCapacity*100):0,reserveCount:0,pinCount:pinEntries.length,skuConflicts:0,lastRecalculatedAt:new Date().toISOString()};",
  );

  // ---------------------------------------------------------------------------------------------
  // 5. Applying a rule to a fully pinned section looked like a no-op.
  //
  // Pins win over automation for their slot — correct — but the drawer promised "N товаров" and
  // then changed nothing, with no explanation. The scope line now states how many slots automation
  // can actually reach.
  // ---------------------------------------------------------------------------------------------
  const scopeStatsFrom = "<div className=\"automation-context-stats-v77\"><span><b>{memberIdsV77.length}</b>{memberIdsV77.length===1?'секция':'секций'}</span>";
  if (!app.includes(scopeStatsFrom)) throw new Error(MARKER + ': scope stats markup missing');
  app = app.replace(
    scopeStatsFrom,
    "<div className=\"automation-context-stats-v77\"><span><b>{memberIdsV77.length}</b>{pluralRuV83(memberIdsV77.length,'секция','секции','секций')}</span>",
  );
  const forecastAnchor = "{memberIdsV77.length>1&&<button onClick={()=>setShowScopeV77((value)=>!value)}>Изменить состав</button>}</div>";
  if (!app.includes(forecastAnchor)) throw new Error(MARKER + ': scope stats tail missing');
  app = app.replace(
    forecastAnchor,
    "{memberIdsV77.length>1&&<button onClick={()=>setShowScopeV77((value)=>!value)}>Изменить состав</button>}</div>{pinnedSlotsV86>0&&<div className={'automation-pin-note-v86 '+(freeSlotsV86===0?'blocking':'')}><strong>{pinnedSlotsV86} {pluralRuV83(pinnedSlotsV86,'слот','слота','слотов')} закреплено вручную</strong><small>{freeSlotsV86===0?'Свободных слотов нет — авто-правило не изменит витрину, пока PIN не снят.':'Авто-наполнение затронет '+freeSlotsV86+' '+pluralRuV83(freeSlotsV86,'слот','слота','слотов')+'; закреплённые останутся как есть.'}</small></div>}",
  );
  const statsDefFrom = "const statsV77=automationGroupCandidateStatsV64(";
  if (!app.includes(statsDefFrom)) throw new Error(MARKER + ': statsV77 definition missing');
  app = app.replace(
    statsDefFrom,
    "const automationScopeSectionsV86=sourceSectionsV77.length?sourceSectionsV77:[targetSection].filter(Boolean);\n  const pinnedSlotsV86=automationScopeSectionsV86.reduce((sum,item)=>sum+Object.keys(item?.pins||{}).filter((key)=>Number(key)<slotCount(item.template)).length,0);\n  const capacitySlotsV86=automationScopeSectionsV86.reduce((sum,item)=>sum+slotCount(item.template),0);\n  const freeSlotsV86=Math.max(0,capacitySlotsV86-pinnedSlotsV86);\n  const statsV77=automationGroupCandidateStatsV64(",
  );

  // ---------------------------------------------------------------------------------------------
  // 6. The four-market model was unreachable.
  //
  // REGION_CONFIG defines RU / KZ / GCC / WW, stock is stored per market, and site trees, pages and
  // page sections are all keyed by region — but switchRegion was wired to nothing, so the editor was
  // permanently locked to RU and none of that logic could be exercised. The toolbar now exposes it
  // next to the language switch.
  // ---------------------------------------------------------------------------------------------
  const languageBlock = '<div className="editor-language-v43">{languages.map((lang) => <button key={lang} className={locale === lang ? \'active\' : \'\'} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div>';
  if (!app.includes(languageBlock)) throw new Error(MARKER + ': language switcher missing');
  app = app.replace(
    languageBlock,
    '<div className="editor-region-v86" aria-label="Рынок" title="Рынок: остатки, дерево страниц и контент считаются отдельно">{Object.keys(REGION_CONFIG).map((market) => <button key={market} className={region === market ? \'active\' : \'\'} onClick={() => switchRegion(market)}>{market}</button>)}</div>' + languageBlock,
  );

  // switchRegion cleared the selection but left the slot target and the open drawers pointing at
  // sections from the previous market.
  const switchRegionFrom = "    setSelectedId(null); setHistory([]); setFuture([]);\n  };";
  if (!app.includes(switchRegionFrom)) throw new Error(MARKER + ': switchRegion body missing');
  app = app.replace(
    switchRegionFrom,
    "    setSelectedId(null); setHistory([]); setFuture([]);\n    setSelectedSlot(null); setSelectedSectionIdsV60([]); setSelectionAnchorV60(null); setAutomationTargetIdV69(null); setGroupRulesOpenV60(false);\n  };",
  );

  // ---------------------------------------------------------------------------------------------
  // 7. Escape did not dismiss the analytics overlay, the efficiency panel or the publish gate, and
  // opening one left the other stacked underneath it.
  // ---------------------------------------------------------------------------------------------
  const escAnchor = "  const switchRegion = (nextRegion) => {";
  if (!app.includes(escAnchor)) throw new Error(MARKER + ': switchRegion anchor missing');
  app = app.replace(
    escAnchor,
    "  useEffect(() => {\n    const onKeyV86 = (event) => {\n      if (event.key !== 'Escape') return;\n      setShowCoverage(false); setOpsPanelOpenV79(false); setPublishCheckOpenV74(false); setShowAdd(false); setShowMenu(false);\n    };\n    window.addEventListener('keydown', onKeyV86);\n    return () => window.removeEventListener('keydown', onKeyV86);\n  }, []);\n\n" + escAnchor,
  );
  const analyticsFrom = '<button className="editor-analytics-v43" onClick={() => setShowCoverage((value) => !value)}>';
  if (!app.includes(analyticsFrom)) throw new Error(MARKER + ': analytics button missing');
  app = app.replace(
    analyticsFrom,
    '<button className="editor-analytics-v43" title="Доля доступного каталога, выведенная на страницу" onClick={() => { setOpsPanelOpenV79(false); setShowCoverage((value) => !value); }}>',
  );
  const opsFrom = "onClick={()=>setOpsPanelOpenV79((value)=>!value)}";
  if (!app.includes(opsFrom)) throw new Error(MARKER + ': ops button missing');
  app = app.replace(opsFrom, "onClick={()=>{ setShowCoverage(false); setOpsPanelOpenV79((value)=>!value); }}");

  // ---------------------------------------------------------------------------------------------
  // 8. «Последние размеры» could never match a single product, and the size-availability sort was a
  // no-op.
  //
  // The synthetic size grid split stock across five sizes by fixed weights, and the smallest stock
  // in the feed is 7, so every size always had at least one unit: sizeAvailability was 100% for the
  // whole catalog. The grid now models a week of sell-through — mid sizes go first — and puts the
  // model's full stock on the sizes that are still open, so row stock still sums to the SKU stock.
  // ---------------------------------------------------------------------------------------------
  const sizeRowsFrom = "  const stocks = splitMetric(stockTotal, weights);\n  const sales = splitMetric(l7dTotal, weights);\n  return template.map((item, index) => ({\n    ...item,\n    sku: entity.id + '-' + String(index + 1).padStart(2, '0'),\n    stock: stocks[index] || 0,\n    l7d: sales[index] || 0,\n  }));";
  if (!app.includes(sizeRowsFrom)) throw new Error(MARKER + ': synthetic size rows missing');
  app = app.replace(
    sizeRowsFrom,
    "  const demandWeights = template.length === 1 ? [1] : [0.06, 0.18, 0.40, 0.28, 0.08];\n  const initial = splitMetric(stockTotal, weights);\n  const sales = splitMetric(l7dTotal, demandWeights);\n  const soldOut = initial.map((value, index) => value - (sales[index] || 0) <= 0);\n  const openIndexes = template.map((_, index) => index).filter((index) => !soldOut[index]);\n  const liveIndexes = openIndexes.length ? openIndexes : template.map((_, index) => index);\n  const liveWeights = liveIndexes.map((index) => weights[index]);\n  const liveTotal = liveWeights.reduce((sum, value) => sum + value, 0) || 1;\n  const stocks = splitMetric(stockTotal, liveWeights.map((value) => value / liveTotal));\n  return template.map((item, index) => {\n    const position = liveIndexes.indexOf(index);\n    return {\n      ...item,\n      sku: entity.id + '-' + String(index + 1).padStart(2, '0'),\n      stock: position >= 0 ? (stocks[position] || 0) : 0,\n      l7d: sales[index] || 0,\n    };\n  });",
  );

  // ---------------------------------------------------------------------------------------------
  // 9. Media assets were listed by raw file GUID, which reads as unfinished data rather than a DAM.
  // ---------------------------------------------------------------------------------------------
  const mediaLibraryFrom = 'return [...uploadedMedia, ...CATALOG_MEDIA].filter((item) => {';
  const contentFrom = 'const CONTENT = [...CATALOG_LOOKS, ...CATALOG_MEDIA];';
  if (!app.includes(contentFrom)) throw new Error(MARKER + ': CONTENT composition missing');
  app = app.replace(
    contentFrom,
    "function mediaDisplayNameV86(item, index) {\n  const raw = String(item?.name || '').trim();\n  const guidLike = /^[0-9a-f]{6,}(\\s|$)/i.test(raw) || /^img\\d/i.test(raw) || /editorial[ _]title/i.test(raw) || /^video\\d/i.test(raw);\n  if (raw && !guidLike) return raw.replace(/_/g, ' ');\n  const kind = String(item?.kind || '').toLowerCase();\n  if (kind === 'video') return 'Видео ' + (String(item?.file || '').includes('9x16') ? '9:16 вертикальное' : '16:9 горизонтальное') + ' · ' + String(index + 1).padStart(2, '0');\n  if (kind === 'svg') return 'Заголовок editorial · ' + String(item?.file || '').split('_')[0];\n  return 'Кадр кампании · ' + String(index + 1).padStart(2, '0');\n}\nconst CATALOG_MEDIA_NAMED_V86 = CATALOG_MEDIA.map((item, index) => ({ ...item, name: mediaDisplayNameV86(item, index) }));\nconst CONTENT = [...CATALOG_LOOKS, ...CATALOG_MEDIA_NAMED_V86];",
  );
  if (!app.includes(mediaLibraryFrom)) throw new Error(MARKER + ': media library source missing');
  app = app.replace(mediaLibraryFrom, 'return [...uploadedMedia, ...CATALOG_MEDIA_NAMED_V86].filter((item) => {');

  // ---------------------------------------------------------------------------------------------
  // 10. Remaining Russian plural agreement, and the editorial SVG titles that kept their file names.
  // ---------------------------------------------------------------------------------------------
  const pluralsV86 = [
    [
      "layoutDisplayName(section?.template) + ' · ' + (section?.resolvedSlots?.length || 0) + ' слотов'",
      "layoutDisplayName(section?.template) + ' · ' + (section?.resolvedSlots?.length || 0) + ' ' + pluralRuV83(section?.resolvedSlots?.length || 0, 'слот', 'слота', 'слотов')",
    ],
    [
      '{section?.resolvedSlots?.length || 0} слотов · {layoutDisplayName(section?.template)}',
      "{section?.resolvedSlots?.length || 0} {pluralRuV83(section?.resolvedSlots?.length || 0, 'слот', 'слота', 'слотов')} · {layoutDisplayName(section?.template)}",
    ],
    [
      '{section.resolvedSlots.length} слотов',
      "{section.resolvedSlots.length} {pluralRuV83(section.resolvedSlots.length, 'слот', 'слота', 'слотов')}",
    ],
    [
      '<b>{rows.length}</b> слотов',
      "<b>{rows.length}</b> {pluralRuV83(rows.length, 'слот', 'слота', 'слотов')}",
    ],
    [
      "{isGroup?'комбинаций':'секций'} потребуется для {statsV77.candidates} товаров",
      "{isGroup?pluralRuV83(repeatUnitsV77,'комбинация','комбинации','комбинаций'):pluralRuV83(repeatUnitsV77,'секция','секции','секций')} потребуется для {statsV77.candidates} {pluralRuV83(statsV77.candidates,'товара','товаров','товаров')}",
    ],
  ];
  pluralsV86.forEach(([from, to], index) => {
    if (!app.includes(from)) throw new Error(MARKER + ': plural anchor ' + index + ' missing');
    app = app.replace(from, to);
  });


  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* logic-audit-v86 */')) {
  css += String.raw`
/* logic-audit-v86 */
/* Market switch sits next to the language switch and reads as one control group. */
.editor-region-v86{display:flex;align-items:center;gap:2px;padding:0 10px 0 0;margin-right:10px;border-right:1px solid #e6e6e6}
.editor-region-v86 button{height:26px;min-width:34px;padding:0 7px;border:1px solid transparent;border-radius:6px;background:transparent;color:#8b9097;font-size:10px;font-weight:700;letter-spacing:.06em;cursor:pointer}
.editor-region-v86 button:hover{background:#f4f4f2;color:#17181d}
.editor-region-v86 button.active{background:#17181d;color:#fff}

/* Scope note in the auto-fill drawer: how many slots automation can actually reach. */
.automation-pin-note-v86{display:grid;gap:3px;margin-top:10px;padding:10px 12px;border:1px solid #e8e3d6;border-radius:10px;background:#fbf8f1}
.automation-pin-note-v86.blocking{border-color:#e7cfcb;background:#fdf4f2}
.automation-pin-note-v86 strong{font-size:11px;font-weight:700;color:#17181d}
.automation-pin-note-v86 small{font-size:10.5px;line-height:1.45;color:#6f747c}

@media (max-width:1024px){
  .editor-region-v86{display:none!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('V86 applied: empty-page crash, multi-select modifiers, pin survival, region switch, size availability, media naming, modal dismissal and metric labels');
