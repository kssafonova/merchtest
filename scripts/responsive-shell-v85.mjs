import { readFileSync, writeFileSync } from 'node:fs';

/**
 * V85 — the editor on a real phone, plus the copy and layout defects that made the desktop build
 * look unfinished.
 *
 * The prototype is shared as a link, so it gets opened on a phone as often as on a laptop. Until now
 * a phone got the desktop grid linearised: the toolbar spilled off-screen, both side panels stacked
 * above the canvas, and the storefront scrolled sideways. This patch gives the editor a real mobile
 * shell — a compact toolbar, the canvas as the primary surface, and the two panels as bottom sheets
 * driven by a tab bar — without changing any authoring behaviour.
 *
 * It also fixes: Russian plural agreement ("1 слотов"), the colliding auto-fill drawer header, the
 * page-background control that overlapped its own hex field, the duplicated content-browser headers,
 * and the always-on multi-select hint that held the top of the canvas hostage.
 */

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const MARKER = 'RESPONSIVE_SHELL_V85';

let app = readFileSync(appPath, 'utf8');
if (app.includes(MARKER)) {
  console.log('V85 already applied');
} else {
  const anchor = 'const STOREFRONT_COMMERCE_V84 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V84 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // ---------------------------------------------------------------------------------------------
  // 1. Mobile sheet state + tab bar.
  // ---------------------------------------------------------------------------------------------
  const stateFrom = "  const [aemPanelSearchV40, setAemPanelSearchV40] = useState('');";
  if (!app.includes(stateFrom)) throw new Error(MARKER + ': panel search state missing');
  app = app.replace(stateFrom, stateFrom + "\n  const [mobileSheetV85, setMobileSheetV85] = useState(null);");

  // A phone previewing the desktop 12-column storefront gets an unreadable, overlapping header, so a
  // narrow editor viewport starts on the mobile device rendering.
  const deviceFrom = "  const [device, setDevice] = useState('desktop');";
  if (!app.includes(deviceFrom)) throw new Error(MARKER + ': device state missing');
  app = app.replace(
    deviceFrom,
    deviceFrom + String.raw`
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const narrow = window.matchMedia('(max-width:1024px)');
    const sync = () => { if (narrow.matches) setDevice('mobile'); };
    sync();
    narrow.addEventListener('change', sync);
    return () => narrow.removeEventListener('change', sync);
  }, []);`,
  );

  const shellClassFrom = '${aemPanelOpenV40 ? \'aem-panel-open-v40\' : \'aem-panel-closed-v40\'}`}';
  if (!app.includes(shellClassFrom)) throw new Error(MARKER + ': shell className missing');
  app = app.replace(shellClassFrom, '${aemPanelOpenV40 ? \'aem-panel-open-v40\' : \'aem-panel-closed-v40\'} mobile-sheet-${mobileSheetV85 || \'none\'}`}');

  const headerEnd = '</header>\n\n    <main className="builder-workspace">';
  if (!app.includes(headerEnd)) throw new Error(MARKER + ': header/main boundary missing');
  const tabbar = String.raw`</header>

    <nav className="mobile-tabbar-v85" aria-label="Разделы редактора">
      <button type="button" className={!mobileSheetV85 && !previewMode ? 'active' : ''} onClick={() => { setMobileSheetV85(null); if (previewMode) { setPreviewMode(false); setAemAuthorModeV40('edit'); } }}><LayoutGrid size={17}/><span>Витрина</span></button>
      <button type="button" className={mobileSheetV85 === 'panel' && aemPanelTabV40 !== 'settings' ? 'active' : ''} onClick={() => { setAemPanelTabV40('components'); setAemPanelOpenV40(true); setMobileSheetV85('panel'); }}><Layers3 size={17}/><span>Секции</span></button>
      <button type="button" className={mobileSheetV85 === 'content' ? 'active' : ''} onClick={() => { setRightTab('content'); setMobileSheetV85('content'); }}><ShoppingBag size={17}/><span>Контент</span></button>
      <button type="button" className={mobileSheetV85 === 'panel' && aemPanelTabV40 === 'settings' ? 'active' : ''} onClick={() => { setAemPanelTabV40('settings'); setAemPanelOpenV40(true); setMobileSheetV85('panel'); }}><BarChart3 size={17}/><span>Страница</span></button>
      <button type="button" className={previewMode ? 'active' : ''} onClick={() => { const next = !previewMode; setPreviewMode(next); setAemAuthorModeV40(next ? 'preview' : 'edit'); setMobileSheetV85(null); }}><Eye size={17}/><span>{previewMode ? 'Правка' : 'Превью'}</span></button>
    </nav>

    <main className="builder-workspace">`;
  app = app.replace(headerEnd, tabbar);

  // Closing the left panel from its own header should also dismiss the mobile sheet it lives in.
  const panelCloseFrom = '<button onClick={() => setAemPanelOpenV40(false)} title="Закрыть"><X size={15}/></button>';
  if (!app.includes(panelCloseFrom)) throw new Error(MARKER + ': side panel close button missing');
  app = app.replace(panelCloseFrom, '<button onClick={() => { setAemPanelOpenV40(false); setMobileSheetV85(null); }} title="Закрыть"><X size={15}/></button>');

  // The content browser had no way back to the canvas on a phone.
  const browserHeadFrom = '<div className="simple-panel-head">\n      <div><strong>';
  if (!app.includes(browserHeadFrom)) throw new Error(MARKER + ': content browser head missing');
  app = app.replace(
    browserHeadFrom,
    '<div className="simple-panel-head">\n      <button type="button" className="mobile-sheet-close-v85" onClick={() => setMobileSheetV85(null)} title="Закрыть" aria-label="Закрыть"><X size={16}/></button>\n      <div><strong>',
  );

  // ---------------------------------------------------------------------------------------------
  // 2. Russian plural agreement. "1 слотов" / "30 макета" / "1 результатов" all read as bugs.
  // ---------------------------------------------------------------------------------------------
  const pluralPatches = [
    ['<small>{type.category} · {slotCount(type)} слотов</small>', '<small>{type.category} · {slotCount(type)} {pluralRuV83(slotCount(type), \'слот\', \'слота\', \'слотов\')}</small>'],
    ['<small>{layoutDisplayName(section.template)} · {slotCount(section.template)} слотов</small>', '<small>{layoutDisplayName(section.template)} · {slotCount(section.template)} {pluralRuV83(slotCount(section.template), \'слот\', \'слота\', \'слотов\')}</small>'],
    ['<em>{layouts.length} макета</em>', '<em>{layouts.length} {pluralRuV83(layouts.length, \'макет\', \'макета\', \'макетов\')}</em>'],
    ["' · ' + visibleLibrary.length + ' результатов'", "' · ' + visibleLibrary.length + ' ' + pluralRuV83(visibleLibrary.length, 'результат', 'результата', 'результатов')"],
    ['<small>{visibleLibrary.length} результатов · {region}</small>', '<small>{visibleLibrary.length} {pluralRuV83(visibleLibrary.length, \'результат\', \'результата\', \'результатов\')} · {region}</small>'],
    ['<span><b>{statsV77.capacity}</b>слотов</span><span><b>{statsV77.candidates}</b>товаров</span>', '<span><b>{statsV77.capacity}</b>{pluralRuV83(statsV77.capacity, \'слот\', \'слота\', \'слотов\')}</span><span><b>{statsV77.candidates}</b>{pluralRuV83(statsV77.candidates, \'товар\', \'товара\', \'товаров\')}</span>'],
  ];
  // The result bar was labelled "ФИЛЬТРЫ" and counted looks and media files as "товаров".
  const resultBarFrom = '<div className="aem-browser-resultbar-v37"><span>ФИЛЬТРЫ</span><strong>{visibleLibrary.length} товаров</strong></div>';
  if (!app.includes(resultBarFrom)) throw new Error(MARKER + ': browser result bar missing');
  app = app.replace(
    resultBarFrom,
    '<div className="aem-browser-resultbar-v37"><span>НАЙДЕНО</span><strong>{visibleLibrary.length} {contentTab === \'product\' ? pluralRuV83(visibleLibrary.length, \'товар\', \'товара\', \'товаров\') : contentTab === \'look\' ? pluralRuV83(visibleLibrary.length, \'образ\', \'образа\', \'образов\') : pluralRuV83(visibleLibrary.length, \'файл\', \'файла\', \'файлов\')}</strong></div>',
  );

  // Colour SKUs of one model share the model photography, so the library card has to name the colour
  // (and the price a merchandiser is picking on) or LIM001 and LIM001-C2 are indistinguishable.
  const cardCopyFrom = '<div className="content-card-copy-v47">\n            <span>{identity}</span>\n            <strong>{entity.name || entity.nameRu || entity.title || identity}</strong>\n          </div>';
  if (!app.includes(cardCopyFrom)) throw new Error(MARKER + ': library card copy missing');
  app = app.replace(
    cardCopyFrom,
    '<div className="content-card-copy-v47">\n            <span>{identity}</span>\n            <strong>{entity.name || entity.nameRu || entity.title || identity}</strong>\n            {isProduct && <small className="content-card-commerce-v85"><ColorSwatchV83 color={entity.color} size={8}/><span>{entity.color}</span><b>{money(finalPriceV84(entity))}</b></small>}\n          </div>',
  );

  // "Покрытие" meant two different things at once: share of the catalog exposed by the page, and how
  // many slots of a section are filled. Both were on screen together with the same label.
  const coverageLabelFrom = "<span className={'runtime-metric signal-' + coverageLevel}><i className=\"traffic-dot\"/><b>Покрытие</b><strong>{metrics.coverage}%</strong></span>";
  if (!app.includes(coverageLabelFrom)) throw new Error(MARKER + ': runtime coverage label missing');
  app = app.replace(
    coverageLabelFrom,
    "<span className={'runtime-metric signal-' + coverageLevel} title={page ? 'Доля доступного каталога, выведенная на страницу' : 'Сколько слотов секции заполнено'}><i className=\"traffic-dot\"/><b>{page ? 'Каталог' : 'Заполнение'}</b><strong>{metrics.coverage}%</strong></span>",
  );

  const publishCoverageFrom = '<span><b>Покрытие</b><strong>{metrics?.coverage||0}%</strong></span>';
  if (!app.includes(publishCoverageFrom)) throw new Error(MARKER + ': publish coverage label missing');
  app = app.replace(publishCoverageFrom, '<span><b>Каталог на витрине</b><strong>{metrics?.coverage||0}%</strong></span>');

  pluralPatches.forEach(([from, to], index) => {
    if (!app.includes(from)) throw new Error(MARKER + ': plural anchor ' + index + ' missing');
    app = app.replace(from, to);
  });

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* responsive-shell-v85 */')) {
  css += String.raw`
/* responsive-shell-v85 */
.mobile-tabbar-v85{display:none}
.mobile-sheet-close-v85{display:none}

/* --- Desktop defects ------------------------------------------------------------------------- */
/* The auto-fill drawer header had no layout at all, so eyebrow, title and subtitle collided. */
.automation-head-v76{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:20px!important;padding:26px 30px 20px!important;border-bottom:1px solid #ececec!important;background:#fff!important}
.automation-head-v76>div{display:grid!important;gap:5px!important;min-width:0!important}
.automation-head-v76>div>span{font-size:9px!important;font-weight:700!important;letter-spacing:.12em!important;color:#9a9ea6!important;text-transform:uppercase!important}
.automation-head-v76>div>strong{display:block!important;line-height:1.1!important;letter-spacing:-.01em!important}
.automation-head-v76>div>small{font-size:11px!important;color:#6f747c!important;line-height:1.45!important}
.automation-head-v76>button{flex:0 0 auto!important;width:38px!important;height:38px!important;display:grid!important;place-items:center!important;border:1px solid #e2e2e2!important;border-radius:50%!important;background:#fff!important;color:#17181d!important;cursor:pointer!important}
.automation-head-v76>button:hover{background:#f4f4f2!important}

/* Page background: swatch + label on one row, hex field on its own row — the 210px panel cannot
   fit three columns. */
.page-color-control-v43{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;grid-template-areas:'swatch text' 'hex hex'!important;align-items:center!important;gap:10px!important}
.page-color-control-v43>.page-color-picker-v43{grid-area:swatch!important}
.page-color-control-v43>div{grid-area:text!important;min-width:0!important}
.page-color-control-v43>div>small{display:block!important;line-height:1.35!important}
.page-color-control-v43>.page-color-hex-v43{grid-area:hex!important;width:100%!important;box-sizing:border-box!important}

/* The content browser announced its result count three times. Keep the panel title and the
   system-of-record line; drop the repeats. */
.content-browser-mode-v44 .aem-browser-source-v37>strong,
.content-browser-mode-v44 .aem-browser-source-v37>small{display:none!important}

/* The icon-only publish button kept its arrow glyph after the label came back. */
.editor-header-v43 .editor-header-actions-v43 .editor-publish-v43:after{content:none!important}

/* Vertical rhythm: 32px section margins plus two 13px insert rails put ~90px of dead white between
   every band, which read as "unfinished page" rather than "editorial spacing". */
.builder-section{margin:14px 22px!important}
.section-insert-point{margin:6px 22px!important}
.lego-app.preview-mode .builder-section{margin:0 0 10px!important}

/* Library card commerce line. */
.content-card-commerce-v85{display:flex!important;align-items:center!important;gap:0!important;margin-top:3px!important;font-size:9px!important;color:#8a8e96!important;min-width:0!important}
.content-card-commerce-v85>span{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
.content-card-commerce-v85>b{margin-left:auto!important;padding-left:8px!important;color:#17181d!important;font-weight:600!important;white-space:nowrap!important}

/* The multi-select tip is a tip, not a permanent banner: one line, and only while authoring. */
.section-multiselect-hint-v62{padding:7px 12px!important;align-items:center!important;gap:10px!important}
.section-multiselect-hint-v62>span:last-child{display:flex!important;align-items:baseline!important;gap:8px!important;min-width:0!important}
.section-multiselect-hint-v62 strong{font-size:11px!important;white-space:nowrap!important}
.section-multiselect-hint-v62 small{font-size:10px!important;color:#7b8089!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}

/* --- Editor on a phone / small tablet --------------------------------------------------------- */
@media (max-width:1024px){
  html,body,#root{overflow-x:hidden!important}
  .lego-app{width:100%!important;max-width:100%!important;overflow-x:hidden!important;padding-bottom:60px!important}

  /* Toolbar: page identity + publish only. Everything else moves to the tab bar. */
  .editor-header-v43{position:sticky!important;top:0!important;z-index:160!important;display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;height:54px!important;min-height:54px!important;padding:0 10px!important;background:#fff!important;border-bottom:1px solid #e8e8e8!important}
  .editor-header-left-v43{flex:1 1 auto!important;min-width:0!important;gap:8px!important}
  .editor-header-left-v43 .global-page-switcher-v49{min-width:0!important;flex:1 1 auto!important}
  .global-page-trigger-v49{max-width:100%!important;overflow:hidden!important}
  .global-page-trigger-v49 strong{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  .editor-layers-v43,.editor-language-v43,.editor-history-v43,.editor-emulator-v43,.editor-preview-v43,.editor-analytics-v43,.editor-ops-v79{display:none!important}
  .editor-header-actions-v43{flex:0 0 auto!important;gap:6px!important;overflow:visible!important}
  .editor-header-v43 .editor-header-actions-v43 .editor-publish-v43{display:inline-flex!important;align-items:center!important;width:auto!important;height:36px!important;padding:0 14px!important;font-size:11px!important;white-space:nowrap!important}
  .editor-header-v43 .editor-header-actions-v43 .editor-publish-v43 span{display:inline!important}
  .global-page-popover-v49{position:fixed!important;left:8px!important;right:8px!important;top:58px!important;width:auto!important;max-height:calc(100vh - 130px)!important;overflow:auto!important;z-index:80!important}

  /* Canvas is the page. */
  .builder-workspace{display:block!important;width:100%!important;min-height:0!important;background:#f2f1ef!important}
  /* The canvas is its own scroll container; sizing it to the gap between toolbar and tab bar keeps
     the last row of the storefront from hiding behind the bar and stops the page double-scrolling. */
  .lego-app .canvas-shell{display:block!important;width:100%!important;max-width:100%!important;padding:10px 8px 16px!important;box-sizing:border-box!important;height:calc(100vh - 114px)!important;height:calc(100dvh - 114px)!important;max-height:none!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important}
  .lego-app .canvas-shell .storefront-frame,
  .lego-app .canvas-shell .storefront-frame.mobile,
  .lego-app .canvas-shell .storefront-frame:not(.mobile){width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important;box-sizing:border-box!important}
  .section-multiselect-hint-v62{display:none!important}

  /* Both panels become bottom sheets; the tab bar decides which one is up.
     The docked-panel rules they override are written as .panel.open / .panel.closed, so these have
     to carry at least as much specificity. */
  .lego-app .aem-author-side-panel-v40,
  .lego-app .aem-author-side-panel-v40.open,
  .lego-app .aem-author-side-panel-v40.closed,
  .lego-app .right-side-shell-v45{position:fixed!important;left:0!important;right:0!important;top:54px!important;bottom:auto!important;width:auto!important;max-width:none!important;min-width:0!important;height:calc(100vh - 114px)!important;height:calc(100dvh - 114px)!important;min-height:0!important;max-height:none!important;z-index:140!important;background:#fff!important;border:0!important;border-top:1px solid #e8e8e8!important;box-shadow:0 -8px 30px rgba(17,17,17,.1)!important;display:none!important;grid-template-columns:minmax(0,1fr)!important;flex-direction:column!important;transform:none!important;overflow:hidden!important}
  .lego-app.mobile-sheet-panel .aem-author-side-panel-v40,
  .lego-app.mobile-sheet-panel .aem-author-side-panel-v40.open,
  .lego-app.mobile-sheet-panel .aem-author-side-panel-v40.closed{display:flex!important}
  .lego-app.mobile-sheet-content .right-side-shell-v45{display:flex!important}
  .lego-app .aem-author-side-panel-v40 .aem-side-rail-v40{display:none!important}
  .lego-app .aem-author-side-panel-v40 .aem-side-content-v40{width:100%!important;max-width:none!important;min-width:0!important;height:100%!important;display:flex!important;flex-direction:column!important;min-height:0!important}
  .lego-app .aem-author-side-panel-v40 .aem-side-scroll-v40{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important}
  .lego-app .right-side-shell-v45 .right-edge-rail-v44{flex:0 0 auto!important;order:2!important;flex-direction:row!important;width:100%!important;height:auto!important;border:0!important;border-top:1px solid #ececec!important;justify-content:space-around!important;padding:4px 0!important}
  .lego-app .right-side-shell-v45>.settings-panel{order:1!important;width:100%!important;max-width:none!important;min-width:0!important;flex:1 1 auto!important;min-height:0!important;border:0!important;background:#fff!important}
  /* The browser is a three-row grid sized from its parent; inside a fixed sheet that chain has to be
     re-established or the card grid collapses to zero height. */
  .lego-app .right-side-shell-v45 .aem-right-workspace-v42{flex:1 1 auto!important;min-height:0!important;height:100%!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#fff!important}
  .lego-app .right-side-shell-v45 .aem-right-workspace-content-v42{flex:1 1 auto!important;height:100%!important;min-height:0!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto minmax(0,1fr)!important;overflow:hidden!important;background:#fff!important}
  .lego-app .right-side-shell-v45 .aem-browser-shell-v37{grid-column:1!important;grid-row:2!important;min-height:0!important;max-height:40vh!important;overflow:auto!important;background:#fff!important}
  .lego-app .right-side-shell-v45 .simple-library-scroll,
  .lego-app .right-side-shell-v45 .content-library-scroll{grid-column:1!important;grid-row:3!important;min-height:0!important;height:100%!important;overflow:auto!important;background:#fff!important}
  .lego-app .right-side-shell-v45 .reference-library-grid,
  .lego-app .right-side-shell-v45 .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px 12px!important}
  .mobile-sheet-close-v85{display:grid!important;place-items:center!important;position:absolute!important;right:12px!important;top:50%!important;transform:translateY(-50%)!important;width:32px!important;height:32px!important;border:1px solid #e4e4e4!important;border-radius:50%!important;background:#fff!important;color:#17181d!important;cursor:pointer!important;z-index:3!important}
  .simple-panel-head{position:relative!important;padding-right:52px!important}

  /* Preview on a phone: no sheets, no tab bar chrome over the page. */
  .lego-app.preview-mode .aem-author-side-panel-v40,
  .lego-app.preview-mode .aem-author-side-panel-v40.open,
  .lego-app.preview-mode .right-side-shell-v45{display:none!important}
  .lego-app.preview-mode .canvas-shell{padding:0!important}
  .lego-app.preview-mode .canvas-shell .storefront-frame.mobile{border-radius:0!important;margin:0!important}

  /* Tab bar. */
  .mobile-tabbar-v85{display:grid!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:150!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;height:60px!important;background:#fff!important;border-top:1px solid #e6e6e6!important;box-shadow:0 -2px 14px rgba(17,17,17,.06)!important;padding-bottom:env(safe-area-inset-bottom)!important}
  .mobile-tabbar-v85 button{display:grid!important;place-items:center!important;gap:3px!important;border:0!important;background:transparent!important;color:#8b9097!important;font-size:9px!important;font-weight:600!important;letter-spacing:.02em!important;cursor:pointer!important;padding:0!important;min-width:0!important}
  .mobile-tabbar-v85 button span{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important}
  .mobile-tabbar-v85 button.active{color:#111!important}
  .mobile-tabbar-v85 button.active svg{stroke-width:2.2!important}

  /* Modals and drawers were sized for a 1440px canvas. */
  .automation-head-v76{padding:18px 16px 14px!important;gap:12px!important}
  .automation-head-v77>div>strong{font-size:20px!important}
  .builder-section{margin:8px 0!important}
  .section-insert-point{margin:4px 10px!important}
  .lego-app .right-side-shell-v45 .aem-right-workspace-content-v42{grid-template-rows:auto minmax(0,38vh) minmax(0,1fr)!important}
  .lego-app .right-side-shell-v45 .simple-library-scroll,
  .lego-app .right-side-shell-v45 .content-library-scroll{padding:12px 12px 24px!important}
  .lego-app .right-side-shell-v45 .right-edge-rail-v44 button{flex:1 1 0!important;display:grid!important;place-items:center!important;gap:2px!important;min-height:48px!important;width:auto!important;border:0!important;font-size:9px!important}
  .lego-slot.filled .merch-product-card>.store-card-caption{height:58px!important;min-height:58px!important}
  .lego-slot.filled:has(.merch-product-card) .content-metric-overlay-v47.slot-overlay-v47{bottom:64px!important}
}

@media (max-width:1024px) and (min-width:641px){
  .mobile-tabbar-v85{max-width:520px!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;border-radius:16px 16px 0 0!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('V85 applied: mobile editor shell with bottom sheets, plural agreement, drawer header layout and content-browser de-duplication');
