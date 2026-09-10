import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'GLOBAL_PAGES_LOCAL_AUTOMATION_V49';

if (!app.includes(MARKER)) {
  const anchor = 'const CONTENT_FILTERS_RESET_V48 = true;';
  if (!app.includes(anchor)) throw new Error('GLOBAL_PAGES_LOCAL_AUTOMATION_V49: V48 marker missing');
  app = app.replace(anchor, `${anchor}\nconst ${MARKER} = true;`);

  // ---------------------------------------------------------------------------
  // 1. GLOBAL PAGE AUTOMATION IS REMOVED. Sections resolve only their own rules.
  // ---------------------------------------------------------------------------
  app = app.replace(/\n\s*const \[showPageRules, setShowPageRules\] = useState\(false\);/g, '');
  app = app.replace(/\n\s*const \[pageRulesByPage, setPageRulesByPage\] = useState\(\{\}\);/g, '');

  const pageRulesStateStart = app.indexOf("  const pageRuleKey = region + ':' + pageId;");
  const pageRulesStateEndMarker = '  const resolved = pageResolution.sections;';
  const pageRulesStateEnd = pageRulesStateStart >= 0 ? app.indexOf(pageRulesStateEndMarker, pageRulesStateStart) : -1;
  if (pageRulesStateStart >= 0 && pageRulesStateEnd >= 0) {
    const localResolution = `  const resolved = useMemo(() => sections.map((section) => resolveSection(section, region, null)), [sections, region]);\n  const pageResolution = useMemo(() => {\n    const slots = resolved.flatMap((section) => section.resolvedSlots || []);\n    const productSlots = slots.filter((slot) => slot.entity && 'price' in slot.entity);\n    return {\n      sections: resolved,\n      pool: [],\n      rawPool: [],\n      colorReserve: [],\n      reserve: [],\n      autoGrid: [],\n      hasLayouts: resolved.length > 0,\n      totalCapacity: resolved.reduce((sum, section) => sum + slotCount(section.template), 0),\n      pinned: slots.filter((slot) => slot.status === 'pin').length,\n      auto: slots.filter((slot) => slot.status === 'auto').length,\n      displayed: productSlots.length,\n    };\n  }, [resolved]);`;
    app = app.slice(0, pageRulesStateStart) + localResolution + app.slice(pageRulesStateEnd + pageRulesStateEndMarker.length);
  } else {
    throw new Error('GLOBAL_PAGES_LOCAL_AUTOMATION_V49: page rules state block missing');
  }

  // Remove the page rules drawer component entirely. V18 places it directly before AppV3.
  const pageModalStart = app.indexOf('function PageRulesModal(');
  const appExportStart = pageModalStart >= 0 ? app.indexOf('export default function AppV3()', pageModalStart) : -1;
  if (pageModalStart >= 0 && appExportStart > pageModalStart) {
    app = app.slice(0, pageModalStart) + app.slice(appExportStart);
  }

  // Remove every live entry point to page automation / generated page grid.
  app = app.replace(/<PageMerchTopStatus[\s\S]*?\/>/g, '');
  app = app.replace(/<PageSectionNavigator[\s\S]*?\/>/g, '');
  app = app.replace(/<PageAutoGrid items=\{pageRules\.enabled \? pageResolution\.autoGrid : \[\]\} region=\{region\} device=\{device\} hasLayouts=\{pageResolution\.hasLayouts\}\/>/g, '');
  app = app.replace(/<button className=\{pageRules\.enabled \? 'page-rules-entry active' : 'page-rules-entry'\}[\s\S]*?<\/button>/g, '');
  app = app.replace(/<PageRulesModal[\s\S]*?\/>/g, '');
  app = app.replace(/<em className=\{pageRules\.enabled \? 'active' : ''\}>\{pageRules\.enabled \? 'PAGE RULES ON' : 'PAGE RULES OFF'\}<\/em>/g, '');
  app = app.replace(/\s+pageRules=\{pageRules\}/g, '');

  // Section rules are fully local now: no inheritance UI or semantics.
  app = app.replace(/,\s*pageRules,\s*pageResolution/g, '');
  app = app.replace("colorMode: 'inherit'", "colorMode: 'all'");
  app = app.replace("const inherit = rules.inheritPageRules !== false;", 'const inherit = false;');
  app = app.replace("const overrides = sectionOverrideFlags(rules, pageRules);", 'const overrides = [false, false, false, false, false];');
  app = app.replace(/\s*const pageFallback = pageRules\?\.fallbackMode === 'keep' \? 'keep' : 'fallback';\s*const effectiveOos = inherit && !overrides\[4\] \? pageFallback : rules\.oos;\s*const scenario = rules\.fillMode === 'rules' \? 'По правилам' : inherit && pageRules\?\.enabled \? 'По правилам страницы' : 'Вручную';/, "\n  const effectiveOos = rules.oos;\n  const scenario = rules.fillMode === 'rules' ? 'По правилам' : 'Вручную';");
  app = app.replace(/\s*<label className="inherit-page-toggle">[\s\S]*?<\/label>/g, '');
  app = app.replace(/<label className=\{rules\.colorMode === 'inherit' \? 'selected' : ''\}><input type="radio" checked=\{rules\.colorMode === 'inherit'\} onChange=\{\(\) => updateRules\(\{ colorMode: 'inherit' \}\)\}\/><span><strong>Наследовать<\/strong><small>Использовать лимит страницы\.<\/small><\/span><\/label>/g, '');
  app = app.replaceAll('📌 Ручной PIN сильнее правил страницы и секции.', '📌 Ручной PIN сильнее автоматизации секции.');
  app = app.replaceAll('Тот же компонент, что на уровне страницы', 'Приоритет товаров внутри секции');
  app = app.replaceAll('Межсекционные повторы управляются правилами страницы.', 'Правило действует только внутри текущей секции.');
  app = app.replaceAll('По умолчанию наследуются со страницы', 'Лимит цветов внутри текущей секции');
  app = app.replaceAll('PAGE → SECTION: локальные настройки работают как override.', 'Локальные правила применяются только к текущей секции.');
  app = app.replaceAll('LOCAL ONLY: секция полностью независима от страницы.', 'Правила применяются только к текущей секции.');

  // Any newly created section must not carry page inheritance state.
  app = app.replace(/,\s*inheritPageRules:\s*true/g, '');

  // ---------------------------------------------------------------------------
  // 2. ONLY DESKTOP + MOBILE AUTHORING EMULATORS.
  // Tablet layout data may remain backward-compatible, but it is not authorable.
  // ---------------------------------------------------------------------------
  app = app.replace("  tablet: { label: 'Tablet', cols: 8, hint: '768–1024 px' },\n", '');

  // ---------------------------------------------------------------------------
  // 3. LEFT PANEL: Components / Structure / Settings only. Pages are global.
  // ---------------------------------------------------------------------------
  const leftRailStart = app.indexOf('<div className="aem-side-rail-v40 aem-side-rail-v41 aem-side-rail-v42">');
  const leftRailEnd = leftRailStart >= 0 ? app.indexOf('<div className="aem-side-content-v40">', leftRailStart) : -1;
  if (leftRailStart < 0 || leftRailEnd < 0) throw new Error('GLOBAL_PAGES_LOCAL_AUTOMATION_V49: left rail boundaries missing');
  const leftRail = `<div className="aem-side-rail-v40 aem-side-rail-v41 aem-side-rail-v42 aem-side-rail-v49">\n          <button className={aemPanelTabV40 === 'components' ? 'active' : ''} onClick={() => { setAemPanelTabV40('components'); setAemPanelOpenV40(true); setAemPanelSearchV40(''); }} title="Компоненты"><LayoutGrid size={17}/><span>Компоненты</span></button>\n          <button className={aemPanelTabV40 === 'tree' ? 'active' : ''} onClick={() => { setAemPanelTabV40('tree'); setAemPanelOpenV40(true); setAemPanelSearchV40(''); }} title="Структура текущей страницы"><Layers3 size={17}/><span>Структура</span></button>\n          <button className={aemPanelTabV40 === 'settings' ? 'active' : ''} onClick={() => { setAemPanelTabV40('settings'); setAemPanelOpenV40(true); setAemPanelSearchV40(''); }} title="Настройки страницы"><BarChart3 size={17}/><span>Настройки</span></button>\n        </div>\n        `;
  app = app.slice(0, leftRailStart) + leftRail + app.slice(leftRailEnd);

  const pagesBodyStart = app.indexOf("{aemPanelTabV40 === 'pages' && <div className=\"aem-pages-browser-v42\">");
  const settingsBodyStart = pagesBodyStart >= 0 ? app.indexOf("{aemPanelTabV40 === 'settings' && <div className=\"aem-page-settings-v42", pagesBodyStart) : -1;
  if (pagesBodyStart >= 0 && settingsBodyStart > pagesBodyStart) {
    app = app.slice(0, pagesBodyStart) + app.slice(settingsBodyStart);
  }

  app = app.replace("{aemPanelTabV40 === 'components' ? 'COMPONENTS' : aemPanelTabV40 === 'tree' ? 'CONTENT TREE' : aemPanelTabV40 === 'pages' ? 'SITES' : 'PAGE SETTINGS'}", "{aemPanelTabV40 === 'components' ? 'COMPONENTS' : aemPanelTabV40 === 'tree' ? 'CONTENT TREE' : 'PAGE SETTINGS'}");
  app = app.replace("{aemPanelTabV40 === 'components' ? 'Компоненты' : aemPanelTabV40 === 'tree' ? currentPageName : aemPanelTabV40 === 'pages' ? 'Страницы' : 'Настройки'}", "{aemPanelTabV40 === 'components' ? 'Компоненты' : aemPanelTabV40 === 'tree' ? currentPageName : 'Настройки'}");
  app = app.replace("placeholder={aemPanelTabV40 === 'tree' ? 'Поиск в структуре' : aemPanelTabV40 === 'pages' ? 'Поиск страницы' : 'Поиск компонента или секции'}", "placeholder={aemPanelTabV40 === 'tree' ? 'Поиск в структуре' : 'Поиск компонента или секции'}");

  // ---------------------------------------------------------------------------
  // 4. GLOBAL PAGE TREE LIVES IN THE HEADER.
  // ---------------------------------------------------------------------------
  const headerPattern = /<header className="editor-header-v43">[\s\S]*?<\/header>/;
  if (!headerPattern.test(app)) throw new Error('GLOBAL_PAGES_LOCAL_AUTOMATION_V49: V43 header missing');
  const header = `<header className="editor-header-v43 editor-header-v49">\n      <div className="editor-header-left-v43 editor-header-left-v49">\n        <button className={'editor-layers-v43 ' + (aemPanelOpenV40 ? 'active' : '')} onClick={() => setAemPanelOpenV40((value) => !value)} title={aemPanelOpenV40 ? 'Скрыть боковую панель' : 'Открыть боковую панель'} aria-label="Слои"><Layers3 size={18}/></button>\n        <div className="global-page-switcher-v49">\n          <button className={'global-page-trigger-v49 ' + (showMenu ? 'active' : '')} onClick={() => { setShowMenu((value) => !value); setMenuSearch(''); }} aria-expanded={showMenu}>\n            <span>СТРАНИЦА</span><strong>{currentPageName}</strong><ChevronDown size={13}/>\n          </button>\n          {showMenu && <div className="global-page-popover-v49">\n            <div className="global-page-head-v49"><div><span>СТРУКТУРА САЙТА</span><strong>Страницы</strong><small>Глобальная навигация по storefront</small></div><button onClick={() => setShowMenu(false)} title="Закрыть"><X size={15}/></button></div>\n            <div className="global-page-search-v49"><Search size={14}/><input autoFocus value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Найти страницу"/>{menuSearch && <button onClick={() => setMenuSearch('')}><X size={12}/></button>}</div>\n            <div className="global-page-actions-v49"><button onClick={() => openCreate('page')}><Plus size={12}/>Страница</button><button onClick={() => openCreate('folder')}><Plus size={12}/>Раздел</button></div>\n            <CreateTreeItem open={Boolean(createKind)} kind={createKind || 'page'} parentId={createParent} folders={folders} locale={locale} onClose={() => { setCreateKind(null); setCreateParent(''); }} onCreate={createTreeItem}/>\n            <div className="global-page-tree-v49"><SiteTree nodes={filterTree(currentTree, menuSearch, locale)} locale={locale} selectedId={pageId} onSelect={(id) => { switchPage(id); setShowMenu(false); }} onCreateInFolder={(folderId) => openCreate('page', folderId)} onRename={renameTreeItem} onDelete={deleteTreeItem} onMove={moveTreeItem} getStats={getTreeNodeStats} query={menuSearch}/></div>\n          </div>}\n        </div>\n        <div className="editor-language-v43">{languages.map((lang) => <button key={lang} className={locale === lang ? 'active' : ''} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div>\n      </div>\n      <div className="editor-emulator-v43 editor-emulator-v49" aria-label="Эмулятор устройств">\n        <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} title="Desktop"><Monitor size={17}/></button>\n        <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} title="Mobile"><Smartphone size={17}/></button>\n      </div>\n      <div className="editor-header-actions-v43">\n        <div className="editor-history-v43"><button disabled={!history.length} onClick={undo} title="Отменить"><Undo2 size={16}/></button><button disabled={!future.length} onClick={redo} title="Повторить"><Redo2 size={16}/></button></div>\n        <button className={'editor-preview-v43 ' + (previewMode ? 'active' : '')} onClick={() => { const next = !previewMode; setPreviewMode(next); setAemAuthorModeV40(next ? 'preview' : 'edit'); }}><Eye size={16}/><span>{previewMode ? 'Редактирование' : 'Предпросмотр'}</span></button>\n        <button className="editor-analytics-v43" onClick={() => setShowCoverage((value) => !value)}><BarChart3 size={16}/><span>Аналитика</span><em>{metrics.coverage}%</em></button>\n        <button className="editor-publish-v43" onClick={() => { setToast('Опубликовано: ' + region + ' · ' + LANGUAGE_LABELS[locale] + ' · ' + currentPageName); setTimeout(() => setToast(''), 2000); }}>Опубликовать</button>\n      </div>\n    </header>`;
  app = app.replace(headerPattern, header);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* global-pages-local-automation-v49 */')) {
  css += String.raw`
/* global-pages-local-automation-v49 */
/* The authoring document itself scrolls. Canvas height is driven by page content. */
html,body,#root{min-height:100%!important;height:auto!important;overflow-y:auto!important;overflow-x:hidden!important}
.lego-app,.aem-author-shell-v40{min-height:100vh!important;height:auto!important;max-height:none!important;overflow:visible!important}
.builder-workspace{height:auto!important;max-height:none!important;min-height:calc(100vh - 56px)!important;overflow:visible!important;align-items:start!important}
.canvas-shell{height:auto!important;max-height:none!important;min-height:0!important;overflow-x:auto!important;overflow-y:visible!important}
.storefront-frame,.storefront-page,.storefront-main,.main-canvas,.main-canvas-body,.section-canvas{height:auto!important;max-height:none!important;overflow:visible!important}

/* Pages are global, so the left author panel is only local page work. */
.aem-side-rail-v49{align-self:stretch!important}
.aem-side-rail-v49>button{flex:0 0 auto!important}

/* Header page switcher — global navigation next to the local layers control. */
.editor-header-v49{overflow:visible!important;grid-template-columns:minmax(430px,1fr) auto minmax(420px,1fr)!important}
.editor-header-left-v49{position:relative!important;min-width:0!important;gap:10px!important}
.global-page-switcher-v49{position:relative;min-width:0}
.global-page-trigger-v49{height:38px;min-width:190px;max-width:310px;padding:0 9px 0 10px;border:0;border-left:1px solid #e3e3e3;border-right:1px solid #e3e3e3;background:#fff;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:13px 16px;column-gap:8px;align-content:center;text-align:left;cursor:pointer;color:#111}
.global-page-trigger-v49>span{grid-column:1;grid-row:1;font-size:6px;font-weight:600;letter-spacing:.09em;color:#909090;line-height:1}.global-page-trigger-v49>strong{grid-column:1;grid-row:2;min-width:0;font-size:9px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}.global-page-trigger-v49>svg{grid-column:2;grid-row:1/3;align-self:center;color:#777}.global-page-trigger-v49:hover,.global-page-trigger-v49.active{background:#f7f7f7}
.global-page-popover-v49{position:absolute;z-index:420;left:0;top:44px;width:min(430px,calc(100vw - 32px));max-height:min(720px,calc(100vh - 76px));display:flex;flex-direction:column;background:#fff;border:1px solid #d6d6d6;box-shadow:0 16px 38px rgba(0,0,0,.12);overflow:hidden}
.global-page-head-v49{flex:0 0 auto;min-height:68px;padding:13px 14px;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;justify-content:space-between;gap:12px}.global-page-head-v49>div{display:grid;gap:2px}.global-page-head-v49 span{font-size:6.5px;font-weight:600;letter-spacing:.09em;color:#888}.global-page-head-v49 strong{font-size:17px;font-weight:500;color:#111}.global-page-head-v49 small{font-size:7px;color:#999}.global-page-head-v49>button{width:30px;height:30px;border:0;background:#fff;display:grid;place-items:center;cursor:pointer}.global-page-head-v49>button:hover{background:#f4f4f4}
.global-page-search-v49{flex:0 0 auto;height:40px;margin:8px 12px 4px;border-bottom:1px solid #aaa;display:flex;align-items:center;gap:7px;color:#777}.global-page-search-v49 input{flex:1;min-width:0;border:0!important;outline:0!important;background:#fff!important;padding:0!important;font-size:9px!important}.global-page-search-v49>button{width:24px;height:24px;border:0;background:transparent;display:grid;place-items:center;cursor:pointer}
.global-page-actions-v49{flex:0 0 auto;padding:7px 12px 9px;display:flex;gap:6px;border-bottom:1px solid #eee}.global-page-actions-v49 button{height:30px;padding:0 9px;border:1px solid #d8d8d8;background:#fff;display:flex;align-items:center;gap:5px;color:#333;font-size:7.5px;cursor:pointer}.global-page-actions-v49 button:hover{border-color:#111}
.global-page-tree-v49{min-height:160px;overflow:auto;padding:6px 8px 14px;scrollbar-width:thin;background:#fff}.global-page-tree-v49 .aem-tree-row-v37{min-height:38px!important}

/* No page-automation remnants are visible anywhere. */
.page-rules-entry,.page-merch-top-status,.page-rules-modal,.page-rules-backdrop,.page-inheritance-control,.inherit-page-toggle,.page-auto-grid{display:none!important}

/* Two-device authoring only. */
.editor-emulator-v49{grid-template-columns:repeat(2,34px)!important}

@media(max-width:1239.98px){
  .editor-header-v49{grid-template-columns:minmax(330px,1fr) auto minmax(360px,1fr)!important;padding-left:10px!important;padding-right:10px!important}
  .global-page-trigger-v49{min-width:160px;max-width:230px}
}
@media(max-width:900px){
  .editor-header-v49{height:auto!important;min-height:56px!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:'left emulator' 'actions actions'!important;padding:6px 8px!important;row-gap:4px!important}
  .editor-header-left-v49{grid-area:left!important}.editor-emulator-v49{grid-area:emulator!important}.editor-header-actions-v43{grid-area:actions!important;justify-content:flex-end!important;border-top:1px solid #eee!important;padding-top:4px!important}
  .global-page-trigger-v49{min-width:140px;max-width:220px}
  .global-page-popover-v49{position:fixed;left:8px;top:60px;width:calc(100vw - 16px);max-height:calc(100vh - 72px)}
}
@media(max-width:560px){
  .editor-header-left-v49{gap:5px!important}.editor-language-v43{display:none!important}.global-page-trigger-v49{min-width:120px;max-width:calc(100vw - 178px)}
  .editor-header-actions-v43 span{display:none}.editor-analytics-v43 em{display:inline!important}.editor-publish-v43{padding:0 9px!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('Global pages / local automation v49 applied: document-scroll canvas, desktop+mobile emulator, page rules removed, pages moved to header');
