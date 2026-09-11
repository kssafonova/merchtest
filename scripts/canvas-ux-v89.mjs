import { readFileSync, writeFileSync } from 'node:fs';

/**
 * V89 — four things the editing canvas and the rule drawer still got wrong.
 *
 *   1. Sorting was only reachable through «Настроить»: picking a preset locked its sort with no way
 *      to say «новинки, но сначала маржинальные». The order is now a first-class control on every
 *      scenario, seeded from the preset and overridable.
 *   2. Sections rendered at full storefront size while authoring, so one editorial block filled the
 *      screen and the page rhythm was impossible to judge. The editing canvas now has a zoom, and
 *      preview always shows 100%.
 *   3. The bulk-action bar was painted once at the top of the canvas, so it scrolled out of sight
 *      exactly when a long multi-selection needed it. It now sticks to the top of the canvas.
 *   4. «Добавить секцию» appeared above and below every selected section, which turned a bulk
 *      selection into a wall of buttons. It now appears only when exactly one section is selected,
 *      and collapses to an icon that expands on hover.
 */

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const MARKER = 'CANVAS_UX_V89';

let app = readFileSync(appPath, 'utf8');
if (app.includes(MARKER)) {
  console.log('V89 already applied');
} else {
  const anchor = 'const RULES_UX_V88 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V88 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // ---------------------------------------------------------------------------------------------
  // 1. Sort order belongs to every scenario, not only to the manual one.
  // ---------------------------------------------------------------------------------------------
  const sortStateFrom = '  const [showScopeV77,setShowScopeV77]=useState(false);';
  if (!app.includes(sortStateFrom)) throw new Error(MARKER + ': drawer scope state missing');
  app = app.replace(sortStateFrom, sortStateFrom + '\n  const [sortTouchedV89,setSortTouchedV89]=useState(false);');

  const selectedSortsFrom = 'const selectedSortsV77=automationScenarioSortV77(scenarioV77,sortLevelsV77);';
  if (!app.includes(selectedSortsFrom)) throw new Error(MARKER + ': selectedSorts missing');
  app = app.replace(
    selectedSortsFrom,
    "const selectedSortsV77=(scenarioV77==='custom'||sortTouchedV89)&&sortLevelsV77.length?sortLevelsV77:automationScenarioSortV77(scenarioV77,sortLevelsV77);\n  const pickScenarioV89=(key)=>{setScenarioV77(key);setSortTouchedV89(false);setSortLevelsV77(automationScenarioSortV77(key,sortLevelsV77));};\n  const changeSortV89=(levels)=>{setSortLevelsV77(levels);setSortTouchedV89(true);};",
  );

  // The scenario buttons and the manual-conditions link go through the seeding helper.
  const scenarioButtonsFrom = "onClick={()=>setScenarioV77(scenario.key)}><strong>{scenario.label}</strong>";
  if (!app.includes(scenarioButtonsFrom)) throw new Error(MARKER + ': scenario buttons missing');
  app = app.replace(scenarioButtonsFrom, "onClick={()=>pickScenarioV89(scenario.key)}><strong>{scenario.label}</strong>");

  const customLinkFrom = "onClick={()=>setScenarioV77(scenarioV77==='custom'?'new':'custom')}";
  if (!app.includes(customLinkFrom)) throw new Error(MARKER + ': manual conditions link missing');
  app = app.replace(customLinkFrom, "onClick={()=>pickScenarioV89(scenarioV77==='custom'?'new':'custom')}");

  // The manual block keeps its own sort editor; wire it to the same handler so the flag is set.
  app = app.replace(
    '<AutomationSortEditorV77 levels={sortLevelsV77} onChange={setSortLevelsV77}/>',
    '<AutomationSortEditorV77 levels={sortLevelsV77} onChange={changeSortV89}/>',
  );

  // Order is part of «что показываем»: it sits next to the department, available for any scenario.
  const extrasFrom = '<div className="automation-step-extras-v88">';
  if (!app.includes(extrasFrom)) throw new Error(MARKER + ': step extras missing');
  app = app.replace(
    extrasFrom,
    '{scenarioV77!==\'custom\'&&<div className="automation-order-v89"><div className="automation-order-head-v89"><span>ПОРЯДОК</span>{sortTouchedV89&&<button type="button" onClick={()=>{setSortTouchedV89(false);setSortLevelsV77(automationScenarioSortV77(scenarioV77,sortLevelsV77));}}>Вернуть порядок сценария</button>}</div><AutomationSortEditorV77 levels={selectedSortsV77} onChange={changeSortV89}/></div>}\n        ' + extrasFrom,
  );

  // Say what is behind the collapsed block, so nobody has to guess.
  app = app.replace(
    '<AutomationAccordionV76 title="Дополнительно"',
    '<AutomationAccordionV76 title="Дополнительно · повторы, цвета, замены"',
  );

  // ---------------------------------------------------------------------------------------------
  // 2. Zoom for the editing canvas; preview stays at 100%.
  // ---------------------------------------------------------------------------------------------
  const deviceStateFrom = "  const [device, setDevice] = useState('desktop');";
  if (!app.includes(deviceStateFrom)) throw new Error(MARKER + ': device state missing');
  app = app.replace(deviceStateFrom, deviceStateFrom + "\n  const [canvasZoomV89, setCanvasZoomV89] = useState(0.7);");

  const shellOpenFrom = "mobile-sheet-${mobileSheetV85 || 'none'}`}";
  if (!app.includes(shellOpenFrom)) throw new Error(MARKER + ': shell className missing');
  app = app.replace(shellOpenFrom, "mobile-sheet-${mobileSheetV85 || 'none'}`} style={{ '--edit-zoom-v89': previewMode ? 1 : canvasZoomV89 }}");

  const emulatorFrom = '<div className="editor-emulator-v43 editor-emulator-v49" aria-label="Эмулятор устройств">';
  if (!app.includes(emulatorFrom)) throw new Error(MARKER + ': device switch missing');
  // The header is a three-column grid; the zoom lives inside the device switch so the grid keeps
  // exactly three children and the action group stays in its own column.
  const zoomControl = emulatorFrom + String.raw`
        {!previewMode && <span className="editor-zoom-v89" aria-label="Масштаб холста">{[0.5,0.7,1].map((level)=><button key={level} type="button" className={canvasZoomV89===level?'active':''} onClick={()=>setCanvasZoomV89(level)} title={'Масштаб холста ' + Math.round(level*100) + '%'}>{Math.round(level*100)}%</button>)}</span>}`;
  app = app.replace(emulatorFrom, zoomControl);

  // ---------------------------------------------------------------------------------------------
  // 4. Insert points follow a single selection only.
  // ---------------------------------------------------------------------------------------------
  const insertBefore = '<SectionInsertPoint sectionId={section.id} position="before" selected={selected}';
  const insertAfter = '<SectionInsertPoint sectionId={section.id} position="after" selected={selected}';
  if (!app.includes(insertBefore) || !app.includes(insertAfter)) throw new Error(MARKER + ': insert points missing');
  app = app.replace(insertBefore, '<SectionInsertPoint sectionId={section.id} position="before" selected={selected && (selectedCountV60 || 1) <= 1}');
  app = app.replace(insertAfter, '<SectionInsertPoint sectionId={section.id} position="after" selected={selected && (selectedCountV60 || 1) <= 1}');

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* canvas-ux-v89 */')) {
  css += String.raw`
/* canvas-ux-v89 */
/* --- 1. Order control in the rule drawer ---------------------------------------------------- */
.automation-order-v89{margin-top:14px!important;display:grid!important;gap:6px!important}
.automation-order-head-v89{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important}
.automation-order-head-v89>span{font-size:10px!important;font-weight:600!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#8b9097!important}
.automation-order-head-v89>button{border:0!important;background:transparent!important;padding:0!important;color:#3d5fd1!important;font-size:11px!important;font-weight:600!important;cursor:pointer!important}
.automation-order-v89 .automation-sort-v77{display:grid!important;gap:7px!important}
.automation-order-v89 .automation-sort-row-v77 select{width:100%!important;min-width:0!important}

/* --- 2. Canvas zoom -------------------------------------------------------------------------- */
/* Media scales with the page; authoring chrome is counter-zoomed so it stays the same size and
   stays clickable at 50%. */
.lego-app:not(.preview-mode) .canvas-shell .storefront-frame{zoom:var(--edit-zoom-v89,.7)}
.lego-app:not(.preview-mode) .canvas-shell .section-author-toolbar-v57,
.lego-app:not(.preview-mode) .canvas-shell .section-insert-point,
.lego-app:not(.preview-mode) .canvas-shell .runtime-status-line.section,
.lego-app:not(.preview-mode) .canvas-shell .merch-empty-section-v74,
.lego-app:not(.preview-mode) .canvas-shell .empty-page-state,
.lego-app:not(.preview-mode) .canvas-shell .page-layout-actions{zoom:calc(1 / var(--edit-zoom-v89,.7))}
.lego-app.preview-mode .canvas-shell .storefront-frame{zoom:1}
.editor-zoom-v89{display:inline-flex!important;align-items:center!important;gap:2px!important;margin-left:8px!important;padding-left:8px!important;border-left:1px solid var(--fg-line,#e6e6e6)!important;background:transparent!important}
.editor-zoom-v89 button{height:26px!important;width:auto!important;min-width:38px!important;padding:0 7px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:#7d828a!important;font-size:10px!important;font-weight:700!important;cursor:pointer!important;box-shadow:none!important}
.editor-zoom-v89 button:hover{background:#f3f3f1!important;color:#17181d!important}
.editor-zoom-v89 button.active{background:#17181d!important;color:#fff!important}

/* --- 3. Bulk-action bar follows the scroll ---------------------------------------------------- */
.multi-section-bar-v60{position:sticky!important;top:0!important;z-index:46!important;box-shadow:0 6px 18px rgba(17,17,17,.1)!important}

/* --- 4. Compact insert points ---------------------------------------------------------------- */
.section-insert-point{margin:4px 22px!important;min-height:0!important}
.section-insert-trigger{height:26px!important;width:26px!important;padding:0!important;gap:0!important;justify-content:center!important;border-radius:999px!important;overflow:hidden!important;transition:width .14s ease,padding .14s ease!important}
.section-insert-trigger>span,.section-insert-trigger>small{display:none!important}
.section-insert-point:hover .section-insert-trigger,
.section-insert-point.open .section-insert-trigger,
.section-insert-trigger:focus-visible{width:auto!important;padding:0 12px!important;gap:6px!important}
.section-insert-point:hover .section-insert-trigger>span,
.section-insert-point.open .section-insert-trigger>span,
.section-insert-trigger:focus-visible>span{display:inline!important}
.section-insert-point:hover .section-insert-trigger>small,
.section-insert-point.open .section-insert-trigger>small,
.section-insert-trigger:focus-visible>small{display:inline!important}

@media (max-width:1024px){
  .editor-zoom-v89{display:none!important}
  .lego-app:not(.preview-mode) .canvas-shell .storefront-frame{zoom:1}
  .lego-app:not(.preview-mode) .canvas-shell .section-author-toolbar-v57,
  .lego-app:not(.preview-mode) .canvas-shell .section-insert-point,
  .lego-app:not(.preview-mode) .canvas-shell .runtime-status-line.section,
  .lego-app:not(.preview-mode) .canvas-shell .merch-empty-section-v74,
  .lego-app:not(.preview-mode) .canvas-shell .empty-page-state,
  .lego-app:not(.preview-mode) .canvas-shell .page-layout-actions{zoom:1}
  .section-insert-trigger{width:auto!important;padding:0 12px!important;gap:6px!important}
  .section-insert-trigger>span{display:inline!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('V89 applied: sort order on every scenario, canvas zoom in edit mode, sticky bulk bar and compact single-selection insert points');
