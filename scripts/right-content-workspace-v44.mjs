import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'RIGHT_CONTENT_WORKSPACE_V44';

if (!app.includes(MARKER)) {
  const anchor = 'const PAGE_SETTINGS_HEADER_V43 = true;';
  if (!app.includes(anchor)) throw new Error('RIGHT_CONTENT_WORKSPACE_V44: V43 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // A section is only considered selected after an explicit user selection.
  app = app.replaceAll("rightTab === 'settings' && selected", "rightTab === 'settings' && selectedId && selected");

  // Selecting from Content Tree should expose Settings without forcing a context switch.
  app = app.replaceAll("onClick={() => { setSelectedId(section.id); setRightTab('settings'); }}", "onClick={() => { setSelectedId(section.id); }}");

  // Keep one navigation source at the physical right edge of the application.
  const asideAnchor = '<aside className="settings-panel content-panel wide-settings-panel simple-merch-panel aem-properties-panel-v40">';
  if (!app.includes(asideAnchor)) throw new Error('RIGHT_CONTENT_WORKSPACE_V44: right panel anchor missing');
  const rail = `<nav className="right-edge-rail-v44" aria-label="Контент и настройки секции">
      <button className={rightTab !== 'settings' && contentTab === 'product' ? 'active' : ''} onClick={() => { setRightTab('content'); setContentTab('product'); setQuery(''); }} title="Товары"><ShoppingBag size={18}/><span>Товары</span></button>
      <button className={rightTab !== 'settings' && contentTab === 'look' ? 'active' : ''} onClick={() => { setRightTab('content'); setContentTab('look'); setQuery(''); }} title="Образы"><Sparkles size={18}/><span>Образы</span></button>
      <button className={rightTab !== 'settings' && contentTab === 'media' ? 'active' : ''} onClick={() => { setRightTab('content'); setContentTab('media'); setQuery(''); }} title="Медиа"><ImageIcon size={18}/><span>Медиа</span></button>
      <span className="right-edge-rail-separator-v44"/>
      <button className={rightTab === 'settings' && selectedId && selected ? 'active section-settings' : 'section-settings'} disabled={!selectedId || !selected} onClick={() => { if (selectedId && selected) setRightTab('settings'); }} title={selectedId && selected ? 'Настройки выбранной секции' : 'Сначала выберите секцию'}><LayoutGrid size={18}/><span>Настройки секции</span></button>
    </nav>\n    <aside className={'settings-panel content-panel wide-settings-panel simple-merch-panel aem-properties-panel-v40 ' + (rightTab === 'settings' && selectedId && selected ? 'section-settings-mode-v44' : 'content-browser-mode-v44')}>`;
  app = app.replace(asideAnchor, rail);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* right-content-workspace-v44 */')) {
  css += String.raw`
/* right-content-workspace-v44 */
/* The outer rail is the single navigation layer for the right side. */
.right-edge-rail-v44{position:fixed;top:58px;right:0;bottom:0;width:64px;z-index:420;background:#f7f7f7;border-left:1px solid #dedede;display:flex;flex-direction:column;align-items:stretch;padding:7px 0 10px;gap:2px}
.right-edge-rail-v44 button{width:64px;min-height:62px;border:0;border-right:2px solid transparent;background:transparent;color:#717171;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:7px 3px;font-size:7px;font-weight:500;line-height:1.15;cursor:pointer}
.right-edge-rail-v44 button:hover:not(:disabled){background:#ededed;color:#111}.right-edge-rail-v44 button.active{background:#fff;color:#111;border-right-color:#111}.right-edge-rail-v44 button span{max-width:58px;text-align:center;white-space:normal}.right-edge-rail-v44 button:disabled{opacity:.32;cursor:not-allowed}.right-edge-rail-v44 button.section-settings{margin-top:auto;min-height:72px}.right-edge-rail-separator-v44{height:1px;margin:5px 10px;background:#dedede}
.preview-mode .right-edge-rail-v44,.aem-mode-preview .right-edge-rail-v44{display:none!important}

/* Remove duplicated navigation inside the legacy content workspace. */
.aem-properties-panel-v40 .aem-right-rail-v42{display:none!important}.aem-properties-panel-v40 .simple-panel-mode-tabs{display:none!important}.aem-properties-panel-v40 .aem-right-workspace-v42{grid-template-columns:minmax(0,1fr)!important;display:grid!important;min-height:0!important;flex:1!important;overflow:hidden!important}.aem-properties-panel-v40 .aem-right-workspace-content-v42{grid-column:1!important;min-width:0!important}

/* Desktop: filters 1/3, cards 2/3. Each area scrolls independently. */
.content-browser-mode-v44{padding-right:0!important;display:flex!important;flex-direction:column!important;min-height:0!important;overflow:hidden!important}
.content-browser-mode-v44 .simple-panel-head{flex:0 0 auto!important;min-height:54px!important;padding:10px 16px!important;border-bottom:1px solid #e7e7e7!important}
.content-browser-mode-v44 .simple-panel-head strong{font-size:15px!important;font-weight:500!important}.content-browser-mode-v44 .simple-panel-head small{font-size:8px!important;color:#888!important}
.content-browser-mode-v44 .aem-right-workspace-content-v42{height:100%!important;min-height:0!important;display:grid!important;grid-template-columns:minmax(210px,1fr) minmax(0,2fr)!important;grid-template-rows:auto minmax(0,1fr)!important;overflow:hidden!important;background:#fff!important}
.content-browser-mode-v44 .aem-selected-slot-v37{grid-column:1/-1!important;grid-row:1!important;margin:0!important;min-height:38px!important;border:0!important;border-bottom:1px solid #e6e6e6!important;border-left:2px solid #111!important;background:#fafafa!important;padding:7px 10px!important}
.content-browser-mode-v44 .aem-browser-shell-v37{grid-column:1!important;grid-row:2!important;min-width:0!important;min-height:0!important;height:100%!important;overflow:auto!important;overscroll-behavior:contain!important;padding:0 12px 18px!important;border-right:1px solid #e5e5e5!important;border-bottom:0!important;background:#fff!important;scrollbar-width:thin!important}
.content-browser-mode-v44 .simple-library-scroll,.content-browser-mode-v44 .content-library-scroll{grid-column:2!important;grid-row:2!important;min-width:0!important;min-height:0!important;height:100%!important;max-height:none!important;overflow:auto!important;overscroll-behavior:contain!important;padding:16px 18px 28px!important;background:#fff!important;scrollbar-width:thin!important}
.content-browser-mode-v44 .aem-browser-source-v37{padding:13px 0 8px!important}.content-browser-mode-v44 .aem-browser-source-v37>span{font-size:6px!important}.content-browser-mode-v44 .aem-browser-source-v37 strong{font-size:13px!important}.content-browser-mode-v44 .aem-browser-source-v37 small{font-size:7px!important}
.content-browser-mode-v44 .aem-commerce-mode-v37{height:32px!important;margin-bottom:5px!important}.content-browser-mode-v44 .aem-commerce-mode-v37 button{height:32px!important;padding:0 9px!important;font-size:8px!important}.content-browser-mode-v44 .aem-search-field-v37{height:35px!important;margin-bottom:5px!important}.content-browser-mode-v44 .aem-search-field-v37 input{font-size:9px!important}
.content-browser-mode-v44 .aem-facets-title-v37{height:29px!important}.content-browser-mode-v44 .aem-facet-group-v37>summary{height:31px!important}.content-browser-mode-v44 .aem-facet-options-v37{max-height:135px!important;padding-bottom:5px!important}.content-browser-mode-v44 .aem-facet-options-v37 button{min-height:25px!important;font-size:7.5px!important}.content-browser-mode-v44 .aem-commerce-status-v37{padding:7px 0 0!important}.content-browser-mode-v44 .aem-commerce-status-v37>div{gap:4px!important}.content-browser-mode-v44 .aem-commerce-status-v37 button{height:24px!important;padding:0 6px!important;font-size:7px!important}.content-browser-mode-v44 .aem-browser-resultbar-v37{min-height:28px!important;padding-top:6px!important}

/* Cards remain visible next to filters and retain their metadata/status labels. */
.content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-content:start!important;gap:20px 16px!important;padding:0!important;overflow:visible!important}
.content-browser-mode-v44 .reference-merch-card{min-width:0!important;margin:0!important;background:#fff!important;overflow:visible!important}.content-browser-mode-v44 .reference-card-body{overflow:hidden!important}.content-browser-mode-v44 .reference-card-footer{min-height:52px!important;height:auto!important;padding:8px 0 0!important;overflow:visible!important;background:#fff!important}.content-browser-mode-v44 .reference-card-footer strong,.content-browser-mode-v44 .reference-card-footer span,.content-browser-mode-v44 .reference-card-footer small{max-width:100%!important;overflow:visible!important;text-overflow:clip!important}.content-browser-mode-v44 .reference-commerce-stack{position:static!important;margin-top:6px!important;display:flex!important;flex-wrap:wrap!important;gap:8px!important;background:transparent!important}.content-browser-mode-v44 .reference-commerce-stack>span{background:transparent!important;border:0!important;padding:0!important;box-shadow:none!important}
.content-browser-mode-v44 .reference-card-media img{transition:transform .18s ease!important}.content-browser-mode-v44 .reference-merch-card:hover .reference-card-media img{transform:scale(1.015)!important}

/* Section settings gets the full inspector width; the edge rail stays visible. */
.section-settings-mode-v44{display:flex!important;flex-direction:column!important;min-height:0!important;overflow:hidden!important}.section-settings-mode-v44 .simple-panel-head{flex:0 0 auto!important}.section-settings-mode-v44 .simple-section-settings,.section-settings-mode-v44 .settings-scroll{flex:1!important;min-height:0!important;height:auto!important;max-height:none!important;overflow:auto!important;padding-bottom:36px!important}

/* Use available viewport space instead of starving the content browser. */
@media (min-width:1600px){
  .aem-panel-closed-v40 .builder-workspace{grid-template-columns:64px minmax(0,1fr) 760px!important}.aem-panel-open-v40 .builder-workspace{grid-template-columns:320px minmax(0,1fr) 760px!important}
  .aem-properties-panel-v40{width:760px!important;max-width:760px!important;margin-right:64px!important}
  .content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}
@media (min-width:1440px) and (max-width:1599.98px){
  .aem-panel-closed-v40 .builder-workspace{grid-template-columns:64px minmax(0,1fr) 680px!important}.aem-panel-open-v40 .builder-workspace{grid-template-columns:300px minmax(0,1fr) 680px!important}
  .aem-properties-panel-v40{width:680px!important;max-width:680px!important;margin-right:64px!important}
}
@media (min-width:1240px) and (max-width:1439.98px){
  .aem-panel-closed-v40 .builder-workspace{grid-template-columns:64px minmax(0,1fr) 610px!important}.aem-panel-open-v40 .builder-workspace{grid-template-columns:280px minmax(0,1fr) 610px!important}
  .aem-properties-panel-v40{width:610px!important;max-width:610px!important;margin-right:64px!important}.content-browser-mode-v44 .aem-right-workspace-content-v42{grid-template-columns:minmax(195px,1fr) minmax(0,2fr)!important}.content-browser-mode-v44 .simple-library-scroll{padding:14px!important}.content-browser-mode-v44 .reference-library-grid{gap:16px 12px!important}
}
@media (min-width:1024px) and (max-width:1239.98px){
  .aem-panel-closed-v40 .builder-workspace{grid-template-columns:58px minmax(0,1fr) 540px!important}.aem-panel-open-v40 .builder-workspace{grid-template-columns:260px minmax(0,1fr) 540px!important}
  .aem-properties-panel-v40{width:540px!important;max-width:540px!important;margin-right:58px!important}.right-edge-rail-v44{width:58px}.right-edge-rail-v44 button{width:58px}.content-browser-mode-v44 .aem-right-workspace-content-v42{grid-template-columns:180px minmax(0,1fr)!important}.content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px 10px!important}.content-browser-mode-v44 .simple-library-scroll{padding:12px!important}
}

/* Tablet: right browser becomes a wide overlay; filters remain a compact fixed column. */
@media (min-width:768px) and (max-width:1023.98px){
  .right-edge-rail-v44{top:58px;width:58px}.right-edge-rail-v44 button{width:58px;min-height:58px}.aem-properties-panel-v40{position:fixed!important;top:58px!important;right:58px!important;bottom:0!important;left:0!important;width:auto!important;max-width:none!important;height:auto!important;margin:0!important;z-index:310!important;border-top:0!important;border-left:0!important;box-shadow:-8px 0 24px rgba(0,0,0,.08)!important}.content-browser-mode-v44 .aem-right-workspace-content-v42{grid-template-columns:230px minmax(0,1fr)!important}.content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))!important;gap:16px!important}
}

/* Mobile: the same rail becomes bottom navigation; content remains usable without horizontal squeezing. */
@media (max-width:767.98px){
  .right-edge-rail-v44{top:auto!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;height:56px!important;padding:0!important;border-left:0!important;border-top:1px solid #ddd!important;display:grid!important;grid-template-columns:repeat(4,1fr)!important;background:#f8f8f8!important}.right-edge-rail-v44 button,.right-edge-rail-v44 button.section-settings{width:100%!important;min-width:0!important;min-height:56px!important;height:56px!important;margin:0!important;border-right:0!important;border-bottom:2px solid transparent!important;gap:2px!important;padding:4px 2px!important}.right-edge-rail-v44 button.active{border-right-color:transparent!important;border-bottom-color:#111!important}.right-edge-rail-v44 button span{font-size:6px!important;max-width:none!important}.right-edge-rail-separator-v44{display:none!important}
  .aem-properties-panel-v40{position:fixed!important;top:58px!important;left:0!important;right:0!important;bottom:56px!important;width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;margin:0!important;z-index:300!important;border:0!important;overflow:hidden!important;background:#fff!important}.content-browser-mode-v44 .aem-right-workspace-content-v42{grid-template-columns:1fr!important;grid-template-rows:auto minmax(150px,34vh) minmax(0,1fr)!important}.content-browser-mode-v44 .aem-selected-slot-v37{grid-column:1!important;grid-row:1!important}.content-browser-mode-v44 .aem-browser-shell-v37{grid-column:1!important;grid-row:2!important;border-right:0!important;border-bottom:1px solid #e5e5e5!important;padding:0 12px 10px!important}.content-browser-mode-v44 .simple-library-scroll,.content-browser-mode-v44 .content-library-scroll{grid-column:1!important;grid-row:3!important;padding:12px!important}.content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px 10px!important}.section-settings-mode-v44 .settings-scroll{padding-bottom:72px!important}
}
@media (max-width:390px){.content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{grid-template-columns:1fr!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('Right content workspace v44 applied: edge rail, 1/3 filters, 2/3 cards, section settings tab');
