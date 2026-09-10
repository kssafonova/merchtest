import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'AEM_PANEL_TABS_V42';

if (!app.includes(MARKER)) {
  const anchor = 'const AEM_PANELS_DND_V41 = true;';
  if (!app.includes(anchor)) throw new Error('AEM_PANEL_TABS_V42: V41 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // LEFT PANEL: Components / Structure / Pages / Settings use one shared vertical rail.
  const leftRailStart = app.indexOf('<div className="aem-side-rail-v40 aem-side-rail-v41">');
  const leftRailEnd = leftRailStart >= 0 ? app.indexOf('<div className="aem-side-content-v40">', leftRailStart) : -1;
  if (leftRailStart < 0 || leftRailEnd < 0) throw new Error('AEM_PANEL_TABS_V42: left rail boundaries missing');
  const leftRail = `<div className="aem-side-rail-v40 aem-side-rail-v41 aem-side-rail-v42">
          <button className={aemPanelTabV40 === 'components' ? 'active' : ''} onClick={() => { setAemPanelTabV40('components'); setAemPanelOpenV40(true); setAemPanelSearchV40(''); }} title="Компоненты"><LayoutGrid size={17}/><span>Компоненты</span></button>
          <button className={aemPanelTabV40 === 'tree' ? 'active' : ''} onClick={() => { setAemPanelTabV40('tree'); setAemPanelOpenV40(true); setAemPanelSearchV40(''); }} title="Структура текущей страницы"><Layers3 size={17}/><span>Структура</span></button>
          <button className={aemPanelTabV40 === 'pages' ? 'active' : ''} onClick={() => { setAemPanelTabV40('pages'); setAemPanelOpenV40(true); setAemPanelSearchV40(''); setShowMenu(false); }} title="Страницы сайта"><Monitor size={17}/><span>Страницы</span></button>
          <button className={aemPanelTabV40 === 'settings' ? 'active' : ''} onClick={() => { setAemPanelTabV40('settings'); setAemPanelOpenV40(true); setAemPanelSearchV40(''); }} title="Настройки страницы"><BarChart3 size={17}/><span>Настройки</span></button>
        </div>
        `;
  app = app.slice(0, leftRailStart) + leftRail + app.slice(leftRailEnd);

  app = app.replace(
    "{aemPanelTabV40 === 'components' ? 'COMPONENTS' : 'CONTENT TREE'}",
    "{aemPanelTabV40 === 'components' ? 'COMPONENTS' : aemPanelTabV40 === 'tree' ? 'CONTENT TREE' : aemPanelTabV40 === 'pages' ? 'SITES' : 'PAGE SETTINGS'}"
  );
  app = app.replace(
    "{aemPanelTabV40 === 'tree' ? currentPageName : 'Компоненты'}",
    "{aemPanelTabV40 === 'components' ? 'Компоненты' : aemPanelTabV40 === 'tree' ? currentPageName : aemPanelTabV40 === 'pages' ? 'Страницы' : 'Настройки'}"
  );

  const leftSearch = `<div className="aem-side-search-v40"><Search size={14}/><input value={aemPanelSearchV40} onChange={(event) => setAemPanelSearchV40(event.target.value)} placeholder={aemPanelTabV40 === 'tree' ? 'Поиск в структуре' : 'Поиск компонента или секции'}/>{aemPanelSearchV40 && <button onClick={() => setAemPanelSearchV40('')}><X size={12}/></button>}</div>`;
  if (!app.includes(leftSearch)) throw new Error('AEM_PANEL_TABS_V42: left search anchor missing');
  const leftSearchNew = `{aemPanelTabV40 !== 'settings' && <div className="aem-side-search-v40"><Search size={14}/><input value={aemPanelSearchV40} onChange={(event) => setAemPanelSearchV40(event.target.value)} placeholder={aemPanelTabV40 === 'tree' ? 'Поиск в структуре' : aemPanelTabV40 === 'pages' ? 'Поиск страницы' : 'Поиск компонента или секции'}/>{aemPanelSearchV40 && <button onClick={() => setAemPanelSearchV40('')}><X size={12}/></button>}</div>}`;
  app = app.replace(leftSearch, leftSearchNew);

  // Add Pages and Settings bodies after the existing Components browser.
  const componentsEndAnchor = `              </details>
            </div>}`;
  const componentsStart = app.indexOf('{aemPanelTabV40 === \'components\' && <div className="aem-components-browser-v41">');
  const componentsEnd = componentsStart >= 0 ? app.indexOf(componentsEndAnchor, componentsStart) : -1;
  if (componentsStart < 0 || componentsEnd < 0) throw new Error('AEM_PANEL_TABS_V42: components body end missing');
  const insertAt = componentsEnd + componentsEndAnchor.length;
  const extraLeftBodies = `
            {aemPanelTabV40 === 'pages' && <div className="aem-pages-browser-v42">
              <div className="aem-pages-context-v42"><span>SITES / STOREFRONT</span><strong>{region}</strong><small>{LANGUAGE_LABELS[locale]} · {currentPageName}</small></div>
              <div className="aem-pages-actions-v42"><button onClick={() => openCreate('page')}><Plus size={13}/>Создать страницу</button><button onClick={() => openCreate('folder')}><Plus size={13}/>Создать раздел</button></div>
              <CreateTreeItem open={Boolean(createKind)} kind={createKind || 'page'} parentId={createParent} folders={folders} locale={locale} onClose={() => { setCreateKind(null); setCreateParent(''); }} onCreate={createTreeItem}/>
              <div className="aem-pages-path-v42"><span>Sites</span><ChevronRight size={11}/><span>Storefront</span><ChevronRight size={11}/><strong>{region}</strong></div>
              <div className="aem-pages-tree-v42"><SiteTree nodes={filterTree(currentTree, aemPanelSearchV40, locale)} locale={locale} selectedId={pageId} onSelect={(id) => { switchPage(id); setAemPanelOpenV40(true); setAemPanelTabV40('pages'); }} onCreateInFolder={(folderId) => openCreate('page', folderId)} onRename={renameTreeItem} onDelete={deleteTreeItem} onMove={moveTreeItem} getStats={getTreeNodeStats} query={aemPanelSearchV40}/></div>
            </div>}
            {aemPanelTabV40 === 'settings' && <div className="aem-page-settings-v42">
              <section><span className="aem-settings-kicker-v42">КОНТЕКСТ СТРАНИЦЫ</span><h3>{currentPageName}</h3><code>/content/storefront/{region.toLowerCase()}/{pageId}</code></section>
              <section><label>РЕГИОН</label><div className="aem-settings-segment-v42">{Object.keys(REGION_CONFIG).map((item) => <button key={item} className={region === item ? 'active' : ''} onClick={() => switchRegion(item)}>{item}</button>)}</div><small>Контент, дерево и остатки переключаются вместе с рынком.</small></section>
              <section><label>ЯЗЫК</label><div className="aem-settings-segment-v42">{languages.map((lang) => <button key={lang} className={locale === lang ? 'active' : ''} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div></section>
              <section className="aem-page-summary-v42"><label>СВОДКА</label><div><span>Секций<strong>{resolved.length}</strong></span><span>Слотов<strong>{metrics.filled}/{metrics.total}</strong></span><span>Покрытие<strong>{metrics.coverage}%</strong></span><span>OOS<strong>{metrics.oos}</strong></span></div></section>
              <button className="aem-page-info-action-v42" onClick={() => setShowCoverage(true)}><BarChart3 size={14}/><span><strong>Информация о странице</strong><small>Покрытие, заполнение и OOS</small></span><ChevronRight size={13}/></button>
            </div>}`;
  app = app.slice(0, insertAt) + extraLeftBodies + app.slice(insertAt);

  // RIGHT PANEL: use the same rail pattern as the left panel and keep filters/cards in an adjacent workspace.
  const rightTabsStart = app.indexOf('<div className="aem-content-source-tabs-v37 aem-right-content-tabs-v41">');
  const rightTabsEnd = rightTabsStart >= 0 ? app.indexOf('</div>', rightTabsStart) : -1;
  if (rightTabsStart < 0 || rightTabsEnd < 0) throw new Error('AEM_PANEL_TABS_V42: right tabs missing');
  const rightWorkspaceOpen = `<div className="aem-right-workspace-v42">
      <div className="aem-right-rail-v42">
        <button className={contentTab === 'product' ? 'active' : ''} onClick={() => { setContentTab('product'); setRightTab('content'); setQuery(''); }} title="Товары"><ShoppingBag size={17}/><span>Товары</span></button>
        <button className={contentTab === 'look' ? 'active' : ''} onClick={() => { setContentTab('look'); setRightTab('content'); setQuery(''); }} title="Образы"><Sparkles size={17}/><span>Образы</span></button>
        <button className={contentTab === 'media' ? 'active' : ''} onClick={() => { setContentTab('media'); setRightTab('content'); setQuery(''); }} title="Медиа"><ImageIcon size={17}/><span>Медиа</span></button>
      </div>
      <div className="aem-right-workspace-content-v42">`;
  app = app.slice(0, rightTabsStart) + rightWorkspaceOpen + app.slice(rightTabsEnd + 6);

  const rightContentClose = app.indexOf('\n    </>}\n  </aside>', rightTabsStart);
  if (rightContentClose < 0) throw new Error('AEM_PANEL_TABS_V42: right content close missing');
  app = app.slice(0, rightContentClose) + '\n      </div>\n    </div>' + app.slice(rightContentClose);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* aem-panel-tabs-v42 */')) {
  css += String.raw`
/* aem-panel-tabs-v42 */
/* One navigation language for both side panels. */
.aem-side-rail-v42,.aem-right-rail-v42{width:64px!important;min-width:64px!important;background:#f7f7f7!important;border-right:1px solid #dedede!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;padding:6px 0!important;gap:2px!important}
.aem-side-rail-v42>button,.aem-right-rail-v42>button{width:64px!important;min-height:58px!important;border:0!important;border-left:2px solid transparent!important;background:transparent!important;color:#6f6f6f!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:5px!important;padding:6px 3px!important;font-size:7px!important;font-weight:500!important;line-height:1.1!important;cursor:pointer!important}
.aem-side-rail-v42>button:hover,.aem-right-rail-v42>button:hover{background:#ededed!important;color:#222!important}.aem-side-rail-v42>button.active,.aem-right-rail-v42>button.active{background:#fff!important;color:#111!important;border-left-color:#111!important}.aem-side-rail-v42>button span,.aem-right-rail-v42>button span{max-width:58px!important;text-align:center!important;white-space:normal!important}

/* Pages */
.aem-pages-browser-v42{padding:0 0 18px;background:#fff;min-height:100%}.aem-pages-context-v42{padding:14px 14px 10px;border-bottom:1px solid #e8e8e8;display:grid;gap:2px}.aem-pages-context-v42>span,.aem-settings-kicker-v42{font-size:7px;letter-spacing:.09em;color:#888;font-weight:600}.aem-pages-context-v42 strong{font-size:16px;font-weight:500;color:#111}.aem-pages-context-v42 small{font-size:8px;color:#8a8a8a}.aem-pages-actions-v42{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 12px}.aem-pages-actions-v42 button{height:32px;border:1px solid #d7d7d7;background:#fff;display:flex;align-items:center;justify-content:center;gap:5px;font-size:8px;color:#333;cursor:pointer}.aem-pages-actions-v42 button:hover{border-color:#111}.aem-pages-path-v42{min-height:34px;padding:0 12px;display:flex;align-items:center;gap:4px;border-top:1px solid #eee;border-bottom:1px solid #eee;color:#888;font-size:8px}.aem-pages-path-v42 strong{color:#111;font-weight:500}.aem-pages-tree-v42{padding:5px 7px 14px}.aem-pages-tree-v42 .aem-tree-row-v37{padding-right:4px}

/* Settings */
.aem-page-settings-v42{padding:0 14px 22px;background:#fff;display:grid}.aem-page-settings-v42 section{padding:16px 0;border-bottom:1px solid #e9e9e9}.aem-page-settings-v42 h3{font-size:18px;font-weight:500;margin:5px 0;color:#111}.aem-page-settings-v42 code{display:block;font-size:8px;color:#777;word-break:break-all;background:#fafafa;padding:7px 8px}.aem-page-settings-v42 section>label{display:block;margin-bottom:9px;font-size:7px;letter-spacing:.09em;color:#777;font-weight:600}.aem-page-settings-v42 section>small{display:block;margin-top:7px;font-size:7px;line-height:1.4;color:#929292}.aem-settings-segment-v42{display:flex;flex-wrap:wrap;gap:5px}.aem-settings-segment-v42 button{min-width:42px;height:29px;padding:0 8px;border:1px solid #d5d5d5;background:#fff;color:#555;font-size:8px;cursor:pointer}.aem-settings-segment-v42 button.active{background:#222;color:#fff;border-color:#222}.aem-page-summary-v42>div{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #eee;border-left:1px solid #eee}.aem-page-summary-v42>div>span{min-height:58px;padding:9px;border-right:1px solid #eee;border-bottom:1px solid #eee;display:grid;align-content:space-between;color:#777;font-size:7px}.aem-page-summary-v42>div strong{font-size:16px;font-weight:500;color:#111}.aem-page-info-action-v42{margin-top:14px;min-height:48px;border:0;border-bottom:1px solid #ccc;background:#fff;padding:0;display:grid;grid-template-columns:20px minmax(0,1fr) 16px;align-items:center;gap:7px;text-align:left;cursor:pointer}.aem-page-info-action-v42>span{display:grid}.aem-page-info-action-v42 strong{font-size:9px;font-weight:500}.aem-page-info-action-v42 small{font-size:7px;color:#888}

/* Right content browser is now a mirror of the left AEM panel. */
.aem-right-workspace-v42{flex:1!important;min-height:0!important;display:grid!important;grid-template-columns:64px minmax(0,1fr)!important;background:#fff!important;overflow:hidden!important}.aem-right-rail-v42{height:100%!important;border-left:0!important;border-right:1px solid #dedede!important}.aem-right-workspace-content-v42{min-width:0!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}.aem-right-workspace-content-v42>.aem-selected-slot-v37{flex:0 0 auto!important}.aem-right-workspace-content-v42>.aem-browser-shell-v37{flex:0 0 auto!important;max-height:48vh!important;overflow:auto!important}.aem-right-workspace-content-v42>.simple-library-scroll{flex:1 1 auto!important;min-height:160px!important;overflow:auto!important}.aem-right-workspace-content-v42 .aem-browser-source-v37{padding-top:11px!important}.aem-right-workspace-content-v42 .reference-library-grid{padding-left:12px!important;padding-right:12px!important}

/* V41 horizontal content tabs are superseded by the rail. */
.aem-right-content-tabs-v41{display:none!important}

@media(max-width:1024px){.aem-side-rail-v42,.aem-right-rail-v42{width:58px!important;min-width:58px!important}.aem-side-rail-v42>button,.aem-right-rail-v42>button{width:58px!important;min-height:54px!important}.aem-right-workspace-v42{grid-template-columns:58px minmax(0,1fr)!important}.aem-right-workspace-content-v42>.aem-browser-shell-v37{max-height:none!important}}
@media(max-width:520px){.aem-side-rail-v42,.aem-right-rail-v42{width:54px!important;min-width:54px!important}.aem-side-rail-v42>button,.aem-right-rail-v42>button{width:54px!important;min-height:50px!important;font-size:6.5px!important}.aem-right-workspace-v42{grid-template-columns:54px minmax(0,1fr)!important}.aem-pages-actions-v42{grid-template-columns:1fr}.aem-page-settings-v42{padding-left:10px;padding-right:10px}}
`;
  writeFileSync(cssPath, css);
}

console.log('AEM panel tabs v42 applied: mirrored rails + Pages + Settings');
