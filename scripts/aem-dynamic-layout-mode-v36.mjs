import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'AEM_DYNAMIC_LAYOUT_MODE_V36';

if (!app.includes(MARKER)) {
  const anchor = 'const LEGO_EQUAL_ROW_HEIGHTS_V35 = true;';
  if (!app.includes(anchor)) throw new Error('AEM_DYNAMIC_LAYOUT_MODE_V36: V35 marker missing');

  const helpers = String.raw`
const AEM_BREAKPOINTS_V36 = {
  desktop: { label: 'Desktop', cols: 12, hint: '≥ 1025 px' },
  tablet: { label: 'Tablet', cols: 8, hint: '768–1024 px' },
  mobile: { label: 'Mobile', cols: 4, hint: '≤ 767 px' },
};

function aemScaleContainerV36(container, targetCols) {
  const sourceCols = Math.max(1, Number(container?.cols || 12));
  if (sourceCols === targetCols) return { ...container, slots: (container?.slots || []).map((slot) => ({ ...slot })) };
  const scale = targetCols / sourceCols;
  const slots = (container?.slots || []).map((slot) => {
    const sourceStart = Math.max(1, Number(slot?.start || 1));
    const sourceSpan = Math.max(1, Number(slot?.span || sourceCols));
    const start = Math.max(1, Math.min(targetCols, Math.round((sourceStart - 1) * scale) + 1));
    const span = Math.max(1, Math.min(targetCols - start + 1, Math.round(sourceSpan * scale)));
    return { ...slot, start, span };
  });
  return { ...container, cols: targetCols, slots };
}

function aemBaseContainersV36(type, device = 'desktop') {
  if (device === 'mobile') return layoutContainersForDeviceV34(type, 'mobile').map((container) => ({ ...container, slots: (container.slots || []).map((slot) => ({ ...slot })) }));
  const desktop = layoutContainersForDeviceV34(type, 'desktop').map((container) => ({ ...container, slots: (container.slots || []).map((slot) => ({ ...slot })) }));
  if (device !== 'tablet') return desktop;
  return desktop.map((container) => aemScaleContainerV36(container, AEM_BREAKPOINTS_V36.tablet.cols));
}

function aemSlotIndexV36(slot, fallbackIndex) {
  return slot?.slotIndex != null ? Number(slot.slotIndex) : fallbackIndex;
}

function aemEffectiveSlotV36(section, device, slot, fallbackIndex, cols) {
  const slotIndex = aemSlotIndexV36(slot, fallbackIndex);
  const override = section?.layoutOverrides?.[device]?.[slotIndex] || {};
  const span = Math.max(1, Math.min(cols, Number(override.span ?? slot?.span ?? cols)));
  const start = Math.max(1, Math.min(cols - span + 1, Number(override.start ?? slot?.start ?? 1)));
  const rowStart = Math.max(1, Number(override.rowStart ?? slot?.rowStart ?? 1));
  const rows = Math.max(1, Math.min(4, Number(override.rows ?? slot?.rows ?? 1)));
  return { ...slot, ...override, slotIndex, span, start, rowStart, rows, hidden: Boolean(override.hidden) };
}

function aemPackSlotsV36(container, slots) {
  const cols = Math.max(1, Number(container?.cols || 12));
  const occupancy = [];
  const isFree = (row, start, span, rows) => {
    for (let r = row; r < row + rows; r += 1) {
      const cells = occupancy[r] || new Set();
      for (let c = start; c < start + span; c += 1) if (cells.has(c)) return false;
    }
    return true;
  };
  const occupy = (row, start, span, rows) => {
    for (let r = row; r < row + rows; r += 1) {
      if (!occupancy[r]) occupancy[r] = new Set();
      for (let c = start; c < start + span; c += 1) occupancy[r].add(c);
    }
  };

  return slots.filter((slot) => !slot.hidden).map((slot) => {
    const span = Math.max(1, Math.min(cols, Number(slot.span || cols)));
    const rows = Math.max(1, Number(slot.rows || 1));
    const desiredRow = Math.max(1, Number(slot.rowStart || 1));
    const desiredStart = Math.max(1, Math.min(cols - span + 1, Number(slot.start || 1)));
    let row = desiredRow;
    let start = desiredStart;
    let placed = false;

    for (let scanRow = desiredRow; scanRow < desiredRow + 40 && !placed; scanRow += 1) {
      const starts = [];
      if (scanRow === desiredRow) starts.push(desiredStart);
      for (let candidate = 1; candidate <= cols - span + 1; candidate += 1) if (!starts.includes(candidate)) starts.push(candidate);
      for (const candidate of starts) {
        if (isFree(scanRow, candidate, span, rows)) {
          row = scanRow;
          start = candidate;
          placed = true;
          break;
        }
      }
    }
    occupy(row, start, span, rows);
    return { ...slot, start, span, rowStart: row, rows };
  });
}

function aemSectionContainersV36(section, device = 'desktop') {
  const base = aemBaseContainersV36(section?.template, device);
  let globalIndex = 0;
  return base.map((container) => {
    const cols = Math.max(1, Number(container?.cols || AEM_BREAKPOINTS_V36[device]?.cols || 12));
    const effective = (container?.slots || []).map((slot) => {
      const fallbackIndex = globalIndex;
      globalIndex += 1;
      return aemEffectiveSlotV36(section, device, slot, fallbackIndex, cols);
    });
    const slots = aemPackSlotsV36(container, effective);
    const rows = Math.max(1, ...slots.map((slot) => Number(slot.rowStart || 1) + Number(slot.rows || 1) - 1));
    return { ...container, cols, rows, slots };
  });
}

function aemSetSlotOverrideV36(layoutOverrides, device, slotIndex, patch) {
  const current = layoutOverrides || {};
  const byDevice = current[device] || {};
  const previous = byDevice[slotIndex] || {};
  return { ...current, [device]: { ...byDevice, [slotIndex]: { ...previous, ...patch } } };
}

function aemResetSlotV36(layoutOverrides, device, slotIndex) {
  const current = { ...(layoutOverrides || {}) };
  const byDevice = { ...(current[device] || {}) };
  delete byDevice[slotIndex];
  current[device] = byDevice;
  return current;
}

function aemResetBreakpointV36(layoutOverrides, device) {
  return { ...(layoutOverrides || {}), [device]: {} };
}

function aemCopyBreakpointV36(section, fromDevice, toDevice) {
  const fromBase = aemBaseContainersV36(section?.template, fromDevice);
  const toBase = aemBaseContainersV36(section?.template, toDevice);
  const fromCols = AEM_BREAKPOINTS_V36[fromDevice]?.cols || Number(fromBase[0]?.cols || 12);
  const toCols = AEM_BREAKPOINTS_V36[toDevice]?.cols || Number(toBase[0]?.cols || 12);
  const sourceOverrides = section?.layoutOverrides?.[fromDevice] || {};
  const next = { ...(section?.layoutOverrides || {}), [toDevice]: {} };
  const scale = toCols / fromCols;
  Object.entries(sourceOverrides).forEach(([slotIndex, override]) => {
    const span = override.span == null ? undefined : Math.max(1, Math.min(toCols, Math.round(Number(override.span) * scale)));
    const start = override.start == null ? undefined : Math.max(1, Math.min(toCols - (span || 1) + 1, Math.round((Number(override.start) - 1) * scale) + 1));
    next[toDevice][slotIndex] = { ...override, ...(span == null ? {} : { span }), ...(start == null ? {} : { start }) };
  });
  return next;
}

function AemMiniSectionPreviewV36({ section, device }) {
  const containers = aemSectionContainersV36(section, device);
  let imageCursor = 0;
  return <div className={'aem-mini-preview-v36 ' + device}>{containers.map((container, ci) => <div className="aem-mini-container" key={ci} style={previewContainerStyle(container.container)}><div className="aem-mini-grid" style={{ gridTemplateColumns: 'repeat(' + container.cols + ',minmax(0,1fr))', gridTemplateRows: legoGridTemplateRowsV35(container), columnGap: device === 'mobile' ? 3 : 4, rowGap: device === 'mobile' ? 3 : 4 }}>{container.slots.map((slot) => { const entity = section?.resolvedSlots?.[slot.slotIndex]?.entity || PRODUCTS[(imageCursor++) % Math.max(PRODUCTS.length, 1)]; const url = layoutPhotoUrl(entity); return <span key={slot.slotIndex} style={{ gridColumn: slot.start + ' / span ' + slot.span, gridRow: slot.rowStart + ' / span ' + slot.rows }}>{url ? <img src={url} alt=""/> : <i/>}</span>; })}</div></div>)}</div>;
}

function AemLayoutInspectorV36({ section, device = 'desktop', onDeviceChange, onLayoutChange }) {
  if (!section) return null;
  const breakpoint = AEM_BREAKPOINTS_V36[device] ? device : 'desktop';
  const baseContainers = aemBaseContainersV36(section.template, breakpoint);
  const effectiveContainers = aemSectionContainersV36(section, breakpoint);
  const changed = Object.keys(section?.layoutOverrides?.[breakpoint] || {}).length;
  let globalIndex = 0;
  const rows = [];

  baseContainers.forEach((container, ci) => {
    const cols = Math.max(1, Number(container.cols || AEM_BREAKPOINTS_V36[breakpoint].cols));
    (container.slots || []).forEach((slot) => {
      const slotIndex = aemSlotIndexV36(slot, globalIndex++);
      const current = aemEffectiveSlotV36(section, breakpoint, slot, slotIndex, cols);
      const update = (patch) => onLayoutChange(aemSetSlotOverrideV36(section.layoutOverrides, breakpoint, slotIndex, patch));
      const setSpan = (nextSpan) => {
        const span = Math.max(1, Math.min(cols, nextSpan));
        const start = Math.min(current.start, cols - span + 1);
        update({ span, start });
      };
      const setStart = (nextStart) => update({ start: Math.max(1, Math.min(cols - current.span + 1, nextStart)) });
      rows.push(<div className={'aem-layout-slot-row ' + (current.hidden ? 'is-hidden' : '')} key={breakpoint + '-' + ci + '-' + slotIndex}>
        <div className="aem-slot-identity"><b>{slotIndex + 1}</b><span><strong>Слот {slotIndex + 1}</strong><small>{current.hidden ? 'Скрыт на ' + AEM_BREAKPOINTS_V36[breakpoint].label : current.span + '/' + cols + ' колонок · строка ' + current.rowStart}</small></span></div>
        <div className="aem-span-visual" aria-label={'Ширина ' + current.span + ' из ' + cols}>{Array.from({ length: cols }, (_, index) => <i key={index} className={index >= current.start - 1 && index < current.start - 1 + current.span ? 'active' : ''}/>)}</div>
        <div className="aem-layout-controls">
          <span className="aem-control-group"><em>Ширина</em><button disabled={current.span <= 1} onClick={() => setSpan(current.span - 1)}>−</button><strong>{current.span}</strong><button disabled={current.span >= cols} onClick={() => setSpan(current.span + 1)}>+</button></span>
          <span className="aem-control-group"><em>Позиция</em><button disabled={current.start <= 1} onClick={() => setStart(current.start - 1)}>←</button><strong>{current.start}</strong><button disabled={current.start + current.span - 1 >= cols} onClick={() => setStart(current.start + 1)}>→</button></span>
          <span className="aem-control-group"><em>Высота</em><button disabled={current.rows <= 1} onClick={() => update({ rows: current.rows - 1 })}>−</button><strong>{current.rows}×</strong><button disabled={current.rows >= 4} onClick={() => update({ rows: current.rows + 1 })}>+</button></span>
          <button className={'aem-visibility-toggle ' + (current.hidden ? 'off' : '')} onClick={() => update({ hidden: !current.hidden })} title={current.hidden ? 'Показать на breakpoint' : 'Скрыть на breakpoint'}>{current.hidden ? 'Показать' : 'Скрыть'}</button>
          <button className="aem-reset-slot" onClick={() => onLayoutChange(aemResetSlotV36(section.layoutOverrides, breakpoint, slotIndex))}>Сбросить</button>
        </div>
      </div>);
    });
  });

  return <section className="aem-layout-inspector-v36">
    <div className="aem-layout-head"><div><span>LAYOUT MODE · AEM-LIKE</span><strong>Responsive Layout Container</strong><small>Preset задаёт старт. Дальше геометрия редактируется отдельно для каждого breakpoint.</small></div><span className="aem-policy-tag">POLICY · SNAP TO GRID</span></div>
    <div className="aem-breakpoint-tabs">{Object.entries(AEM_BREAKPOINTS_V36).map(([key, config]) => <button key={key} className={breakpoint === key ? 'active' : ''} onClick={() => onDeviceChange(key)}>{key === 'desktop' ? <Monitor size={14}/> : key === 'mobile' ? <Smartphone size={14}/> : <LayoutGrid size={14}/>}<span><strong>{config.label}</strong><small>{config.cols} cols · {config.hint}</small></span></button>)}</div>
    <div className="aem-layout-preview-row"><div><span>ТЕКУЩИЙ BREAKPOINT</span><AemMiniSectionPreviewV36 section={section} device={breakpoint}/></div><div className="aem-layout-policy"><span>ПОЛИТИКА СЕКЦИИ</span><strong>{section.template.layoutV2 ? 'Responsive Grid' : 'Legacy → Responsive Grid'}</strong><small>{AEM_BREAKPOINTS_V36[breakpoint].cols} колонок · равная высота строки · без overlap</small><small>Контент: товар / образ / image / video / SVG</small><small>Commerce: ручной PIN или динамический candidate source</small></div></div>
    <div className="aem-layout-toolbar"><span><b>{rows.length}</b> слотов · <b>{changed}</b> override на {AEM_BREAKPOINTS_V36[breakpoint].label}</span><div>{breakpoint !== 'desktop' && <button onClick={() => onLayoutChange(aemCopyBreakpointV36(section, 'desktop', breakpoint))}>Наследовать Desktop</button>}<button onClick={() => onLayoutChange(aemResetBreakpointV36(section.layoutOverrides, breakpoint))}>Сбросить breakpoint</button></div></div>
    <div className="aem-layout-slot-list">{rows}</div>
    <div className="aem-layout-footnote">Изменения применяются сразу к canvas. Если два блока конфликтуют, следующий автоматически переносится на ближайшую свободную позицию — как snap/reflow в responsive grid.</div>
  </section>;
}
`;

  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  // Real canvas uses authored responsive overrides, while presets remain immutable templates.
  app = app.replaceAll('const containers = layoutContainersForDeviceV34(section.template, device);', 'const containers = aemSectionContainersV36(section, device);');

  // Add a tablet emulator breakpoint alongside desktop/mobile.
  const deviceGroupPattern = /<div className="device-group"><button className=\{device === 'desktop'[\s\S]*?<\/div>/;
  const deviceMatch = app.match(deviceGroupPattern);
  if (deviceMatch) {
    app = app.replace(deviceMatch[0], `<div className="device-group aem-device-group-v36"><button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} title="Desktop"><Monitor size={18}/></button><button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')} title="Tablet 768–1024"><LayoutGrid size={17}/></button><button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} title="Mobile"><Smartphone size={18}/></button></div>`);
  }

  // Inject AEM-like Layout Mode into section settings before merchandising rules.
  const panelStart = app.indexOf('function SectionSettingsPanel(');
  const panelEnd = app.indexOf('function TypePreview(', panelStart);
  if (panelStart < 0 || panelEnd < 0) throw new Error('AEM_DYNAMIC_LAYOUT_MODE_V36: SectionSettingsPanel not found');
  let panel = app.slice(panelStart, panelEnd);
  panel = panel.replace('function SectionSettingsPanel({ section, region, locale, pageRules, pageResolution, onChange, onDuplicate, onDelete })', 'function SectionSettingsPanel({ section, region, locale, pageRules, pageResolution, device, onDeviceChange, onLayoutChange, onChange, onDuplicate, onDelete })');
  const insertBeforeRules = '    <section className="unified-rule-block"><RuleBlockTitle number="1"';
  if (!panel.includes(insertBeforeRules)) throw new Error('AEM_DYNAMIC_LAYOUT_MODE_V36: section rules insertion anchor missing');
  panel = panel.replace(insertBeforeRules, '    <AemLayoutInspectorV36 section={section} device={device} onDeviceChange={onDeviceChange} onLayoutChange={onLayoutChange}/>\n\n' + insertBeforeRules);
  app = app.slice(0, panelStart) + panel + app.slice(panelEnd);

  // Pass the editor breakpoint and immutable layout-update callback into settings.
  app = app.replace(/<SectionSettingsPanel section=\{selected\} region=\{region\} locale=\{locale\} pageRules=\{pageRules\} pageResolution=\{pageResolution\}/g, '<SectionSettingsPanel section={selected} region={region} locale={locale} pageRules={pageRules} pageResolution={pageResolution} device={device} onDeviceChange={setDevice} onLayoutChange={(layoutOverrides) => updateSection(selected.id, (current) => ({ ...current, layoutOverrides }))}');

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* aem-dynamic-layout-mode-v36 */')) {
  css += String.raw`
/* aem-dynamic-layout-mode-v36 */
/* AEM-inspired authoring: preset/template policy + authored responsive grid overrides. */
.storefront-frame.tablet{width:min(820px,100%)!important;max-width:100%!important;margin:0 auto!important}
.aem-device-group-v36{display:flex!important;gap:2px!important}
.aem-device-group-v36 button{width:36px!important;min-width:36px!important}

.aem-layout-inspector-v36{margin:18px 0 28px!important;padding:0!important;background:#fff!important;border-top:1px solid #111!important;border-bottom:1px solid #e5e5e5!important}
.aem-layout-head{padding:16px 0 14px!important;display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:16px!important;border-bottom:1px solid #e5e5e5!important}
.aem-layout-head>div{display:grid!important;gap:4px!important}.aem-layout-head>div>span{font-size:8px!important;font-weight:600!important;letter-spacing:.09em!important;color:#6b6b6b!important}.aem-layout-head strong{font-size:16px!important;font-weight:500!important;color:#111!important}.aem-layout-head small{font-size:9px!important;line-height:1.45!important;color:#777!important}.aem-policy-tag{white-space:nowrap!important;font-size:7px!important;letter-spacing:.08em!important;color:#555!important;padding-top:3px!important}

.aem-breakpoint-tabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;border-bottom:1px solid #e5e5e5!important}
.aem-breakpoint-tabs>button{min-height:58px!important;border:0!important;border-right:1px solid #e5e5e5!important;border-radius:0!important;background:#fff!important;color:#777!important;padding:10px 12px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;text-align:left!important}.aem-breakpoint-tabs>button:last-child{border-right:0!important}.aem-breakpoint-tabs>button.active{background:#111!important;color:#fff!important}.aem-breakpoint-tabs>button>span{display:grid!important;gap:2px!important}.aem-breakpoint-tabs strong{font-size:9px!important;font-weight:600!important}.aem-breakpoint-tabs small{font-size:7px!important;color:inherit!important;opacity:.68!important}

.aem-layout-preview-row{display:grid!important;grid-template-columns:minmax(0,1.55fr) minmax(150px,.75fr)!important;gap:20px!important;padding:18px 0!important;border-bottom:1px solid #e5e5e5!important}.aem-layout-preview-row>div:first-child{display:grid!important;gap:8px!important}.aem-layout-preview-row>div:first-child>span,.aem-layout-policy>span{font-size:7px!important;font-weight:600!important;letter-spacing:.08em!important;color:#777!important}.aem-layout-policy{padding-left:18px!important;border-left:1px solid #e5e5e5!important;display:grid!important;align-content:start!important;gap:6px!important}.aem-layout-policy strong{font-size:11px!important;font-weight:500!important}.aem-layout-policy small{font-size:8px!important;line-height:1.4!important;color:#777!important}
.aem-mini-preview-v36{width:100%!important;min-width:0!important;background:#fafafa!important;padding:10px!important;box-sizing:border-box!important}.aem-mini-preview-v36.mobile{max-width:190px!important}.aem-mini-preview-v36.tablet{max-width:420px!important}.aem-mini-container{container-type:inline-size!important;width:100%!important}.aem-mini-grid{display:grid!important;align-items:stretch!important;min-width:0!important}.aem-mini-grid>span{height:100%!important;min-width:0!important;overflow:hidden!important;background:#f3f3f3!important}.aem-mini-grid img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}.aem-mini-grid i{display:block!important;width:100%!important;height:100%!important;background:#f7f5f2!important}

.aem-layout-toolbar{min-height:46px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;border-bottom:1px solid #e5e5e5!important}.aem-layout-toolbar>span{font-size:8px!important;color:#777!important}.aem-layout-toolbar>span b{color:#111!important;font-weight:600!important}.aem-layout-toolbar>div{display:flex!important;gap:8px!important}.aem-layout-toolbar button,.aem-reset-slot,.aem-visibility-toggle{min-height:28px!important;border:0!important;border-bottom:1px solid #aaa!important;border-radius:0!important;background:#fff!important;color:#555!important;padding:0 4px!important;font-size:7px!important;font-weight:500!important}.aem-layout-toolbar button:hover,.aem-reset-slot:hover,.aem-visibility-toggle:hover{border-bottom-color:#111!important;color:#111!important}

.aem-layout-slot-list{display:grid!important}.aem-layout-slot-row{padding:14px 0!important;border-bottom:1px solid #eeeeee!important;display:grid!important;grid-template-columns:130px minmax(120px,1fr)!important;gap:10px 16px!important}.aem-layout-slot-row.is-hidden{opacity:.46!important}.aem-slot-identity{display:flex!important;align-items:center!important;gap:9px!important}.aem-slot-identity>b{width:25px!important;height:25px!important;border:1px solid #cfcfcf!important;display:grid!important;place-items:center!important;font-size:8px!important;font-weight:500!important}.aem-slot-identity>span{display:grid!important;gap:2px!important}.aem-slot-identity strong{font-size:9px!important;font-weight:500!important}.aem-slot-identity small{font-size:7px!important;color:#777!important}
.aem-span-visual{display:grid!important;grid-template-columns:repeat(12,minmax(2px,1fr))!important;gap:2px!important;align-self:center!important;height:8px!important}.aem-span-visual i{background:#ececec!important;min-width:0!important}.aem-span-visual i.active{background:#111!important}.aem-layout-slot-row:has(.aem-span-visual i:nth-child(8):last-child) .aem-span-visual{grid-template-columns:repeat(8,minmax(2px,1fr))!important}.aem-layout-slot-row:has(.aem-span-visual i:nth-child(4):last-child) .aem-span-visual{grid-template-columns:repeat(4,minmax(2px,1fr))!important}
.aem-layout-controls{grid-column:1/-1!important;display:flex!important;align-items:flex-end!important;gap:14px!important;flex-wrap:wrap!important}.aem-control-group{display:grid!important;grid-template-columns:28px 30px 26px!important;grid-template-rows:12px 30px!important;align-items:center!important}.aem-control-group em{grid-column:1/-1!important;font-size:7px!important;font-style:normal!important;color:#777!important;text-transform:uppercase!important;letter-spacing:.06em!important}.aem-control-group button{height:28px!important;border:1px solid #e1e1e1!important;border-radius:0!important;background:#fff!important;font-size:13px!important;color:#333!important}.aem-control-group button:disabled{opacity:.25!important}.aem-control-group strong{height:28px!important;display:grid!important;place-items:center!important;font-size:8px!important;font-weight:500!important;border-top:1px solid #e1e1e1!important;border-bottom:1px solid #e1e1e1!important}.aem-visibility-toggle,.aem-reset-slot{height:28px!important;margin-bottom:1px!important}.aem-visibility-toggle.off{color:#8b423b!important}
.aem-layout-footnote{padding:12px 0 14px!important;font-size:8px!important;line-height:1.5!important;color:#777!important}

/* Authored grid: row height still belongs to the LEGO row (V35), never to an individual cell ratio. */
.storefront-frame.tablet .section-container{box-sizing:border-box!important}.storefront-frame.tablet .slot-grid{width:100%!important;align-items:stretch!important}.storefront-frame.tablet .v2-slot-wrap{min-width:0!important;height:100%!important;aspect-ratio:auto!important}.storefront-frame.tablet .v2-slot-wrap>.lego-slot{height:100%!important}

@media(max-width:1180px){.aem-layout-preview-row{grid-template-columns:1fr!important}.aem-layout-policy{padding:12px 0 0!important;border-left:0!important;border-top:1px solid #eee!important}.aem-layout-slot-row{grid-template-columns:110px minmax(100px,1fr)!important}}
@media(max-width:900px){.aem-layout-inspector-v36{padding:0 18px!important}.aem-layout-head{padding-top:18px!important}.aem-layout-slot-row{grid-template-columns:1fr!important}.aem-span-visual{grid-column:1!important}.aem-layout-controls{grid-column:1!important}}
@media(max-width:520px){.aem-layout-inspector-v36{padding:0 14px!important}.aem-layout-head{display:grid!important}.aem-policy-tag{padding:0!important}.aem-breakpoint-tabs>button{padding:9px 7px!important;gap:5px!important}.aem-breakpoint-tabs small{display:none!important}.aem-layout-toolbar{align-items:flex-start!important;padding:10px 0!important;display:grid!important}.aem-layout-controls{gap:10px!important}.aem-control-group{grid-template-columns:26px 28px 26px!important}.aem-layout-preview-row{padding:14px 0!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('AEM dynamic layout mode v36 applied: responsive grid authoring + CIF-aware policy model');
