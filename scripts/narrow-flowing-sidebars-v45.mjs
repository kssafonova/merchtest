import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'NARROW_FLOWING_SIDEBARS_V45';

if (!app.includes(MARKER)) {
  const anchor = 'const RIGHT_CONTENT_WORKSPACE_V44 = true;';
  if (!app.includes(anchor)) throw new Error('NARROW_FLOWING_SIDEBARS_V45: V44 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // V44 placed the rail as a fixed sibling. Wrap rail + panel into one normal-flow right column.
  const navStart = app.indexOf('<nav className="right-edge-rail-v44"');
  if (navStart < 0) throw new Error('NARROW_FLOWING_SIDEBARS_V45: right rail missing');
  const asideEndStart = app.indexOf('\n  </aside>', navStart);
  if (asideEndStart < 0) throw new Error('NARROW_FLOWING_SIDEBARS_V45: right panel closing tag missing');
  const asideEnd = asideEndStart + '\n  </aside>'.length;
  app = app.slice(0, navStart) + '<div className="right-side-shell-v45">\n    ' + app.slice(navStart, asideEnd) + '\n  </div>' + app.slice(asideEnd);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* narrow-flowing-sidebars-v45 */')) {
  css += String.raw`
/* narrow-flowing-sidebars-v45 */
/* V45 principle: sidebars belong to the document flow. No fixed/sticky authoring columns. */
.builder-workspace{align-items:start!important;height:auto!important;min-height:0!important;overflow:visible!important}
.canvas-shell{height:auto!important;max-height:none!important;overflow-x:auto!important;overflow-y:visible!important;align-self:start!important}

/* LEFT: narrow, normal-flow, scrolls away together with the page. */
.aem-author-side-panel-v40{position:static!important;top:auto!important;left:auto!important;bottom:auto!important;height:calc(100vh - 74px)!important;max-height:760px!important;min-height:560px!important;align-self:start!important;transform:none!important;box-shadow:none!important;overflow:hidden!important}
.aem-author-side-panel-v40.open{display:grid!important}
.aem-author-side-panel-v40.closed{display:none!important}
.aem-author-side-panel-v40 .aem-side-content-v40{min-height:0!important;height:100%!important}
.aem-author-side-panel-v40 .aem-side-scroll-v40{min-height:0!important;overflow:auto!important;overscroll-behavior:contain!important;scrollbar-width:thin!important}

/* RIGHT: rail and content are one compact grid item. Rail is at the physical right edge of this panel, not the viewport. */
.right-side-shell-v45{position:static!important;align-self:start!important;width:100%!important;height:calc(100vh - 74px)!important;max-height:760px!important;min-height:560px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 58px!important;grid-template-rows:minmax(0,1fr)!important;background:#fff!important;border-left:1px solid #dedede!important;overflow:hidden!important}
.right-side-shell-v45>.right-edge-rail-v44{position:static!important;inset:auto!important;grid-column:2!important;grid-row:1!important;width:58px!important;height:100%!important;min-height:0!important;border-left:1px solid #dedede!important;border-right:0!important;border-top:0!important;background:#f7f7f7!important;z-index:auto!important}
.right-side-shell-v45>.right-edge-rail-v44 button{width:58px!important;min-height:58px!important}
.right-side-shell-v45>.aem-properties-panel-v40{position:static!important;inset:auto!important;grid-column:1!important;grid-row:1!important;width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;min-height:0!important;margin:0!important;border:0!important;box-shadow:none!important;overflow:hidden!important}

/* Content browser: FILTERS TOP 1/3, CONTENT BOTTOM 2/3. */
.content-browser-mode-v44{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
.content-browser-mode-v44 .simple-panel-head{flex:0 0 auto!important;min-height:50px!important;height:50px!important;padding:9px 12px!important}
.content-browser-mode-v44 .aem-right-workspace-v42{flex:1 1 auto!important;min-height:0!important;height:auto!important;display:block!important;overflow:hidden!important}
.content-browser-mode-v44 .aem-right-workspace-content-v42{height:100%!important;min-height:0!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto minmax(150px,1fr) minmax(260px,2fr)!important;overflow:hidden!important;background:#fff!important}
.content-browser-mode-v44 .aem-selected-slot-v37{grid-column:1!important;grid-row:1!important;min-height:34px!important;margin:0!important;padding:6px 9px!important}
.content-browser-mode-v44 .aem-browser-shell-v37{grid-column:1!important;grid-row:2!important;height:100%!important;min-height:0!important;overflow:auto!important;padding:0 10px 10px!important;border-right:0!important;border-bottom:1px solid #e5e5e5!important;scrollbar-width:thin!important}
.content-browser-mode-v44 .simple-library-scroll,
.content-browser-mode-v44 .content-library-scroll{grid-column:1!important;grid-row:3!important;height:100%!important;min-height:0!important;max-height:none!important;overflow:auto!important;padding:12px 12px 20px!important;scrollbar-width:thin!important}

/* Compact filter density: the whole filter area must fit into the upper third. */
.content-browser-mode-v44 .aem-browser-source-v37{padding:9px 0 5px!important}
.content-browser-mode-v44 .aem-browser-source-v37 strong{font-size:12px!important}
.content-browser-mode-v44 .aem-browser-source-v37 small{font-size:7px!important}
.content-browser-mode-v44 .aem-commerce-mode-v37{height:28px!important;margin-bottom:3px!important}
.content-browser-mode-v44 .aem-commerce-mode-v37 button{height:28px!important;padding:0 7px!important;font-size:7px!important}
.content-browser-mode-v44 .aem-search-field-v37{height:31px!important;margin-bottom:3px!important}
.content-browser-mode-v44 .aem-search-field-v37 input{font-size:8px!important}
.content-browser-mode-v44 .aem-facets-title-v37{height:25px!important}
.content-browser-mode-v44 .aem-facet-group-v37>summary{height:27px!important;font-size:7px!important}
.content-browser-mode-v44 .aem-facet-options-v37{max-height:92px!important;padding-bottom:3px!important}
.content-browser-mode-v44 .aem-facet-options-v37 button{min-height:22px!important;font-size:7px!important;padding-top:2px!important;padding-bottom:2px!important}
.content-browser-mode-v44 .aem-commerce-status-v37{padding:4px 0 0!important}
.content-browser-mode-v44 .aem-commerce-status-v37>div{gap:3px!important}
.content-browser-mode-v44 .aem-commerce-status-v37 button{height:22px!important;padding:0 5px!important;font-size:6.5px!important}
.content-browser-mode-v44 .aem-browser-resultbar-v37{min-height:24px!important;padding-top:4px!important;font-size:7px!important}

/* Cards get the larger lower zone and keep metadata visible. */
.content-browser-mode-v44 .reference-library-grid,
.content-browser-mode-v44 .visual-library-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-content:start!important;gap:16px 10px!important;padding:0!important}
.content-browser-mode-v44 .reference-card-footer{min-height:46px!important;padding:6px 0 0!important}
.content-browser-mode-v44 .reference-card-footer strong{font-size:8px!important;line-height:1.25!important}
.content-browser-mode-v44 .reference-card-footer small,
.content-browser-mode-v44 .reference-card-footer span{font-size:7px!important;line-height:1.25!important}
.content-browser-mode-v44 .reference-commerce-stack{margin-top:4px!important;gap:5px!important}

/* Section settings uses the same narrow panel and scrolls inside it. */
.section-settings-mode-v44{height:100%!important;min-height:0!important;overflow:hidden!important}
.section-settings-mode-v44 .simple-section-settings,
.section-settings-mode-v44 .settings-scroll{min-height:0!important;max-height:none!important;height:auto!important;overflow:auto!important;scrollbar-width:thin!important}

/* Desktop widths: intentionally compact. */
@media (min-width:1600px){
  .aem-panel-open-v40 .builder-workspace{grid-template-columns:300px minmax(0,1fr) 420px!important}
  .aem-panel-closed-v40 .builder-workspace{grid-template-columns:minmax(0,1fr) 420px!important}
}
@media (min-width:1440px) and (max-width:1599.98px){
  .aem-panel-open-v40 .builder-workspace{grid-template-columns:286px minmax(0,1fr) 400px!important}
  .aem-panel-closed-v40 .builder-workspace{grid-template-columns:minmax(0,1fr) 400px!important}
}
@media (min-width:1240px) and (max-width:1439.98px){
  .aem-panel-open-v40 .builder-workspace{grid-template-columns:270px minmax(0,1fr) 380px!important}
  .aem-panel-closed-v40 .builder-workspace{grid-template-columns:minmax(0,1fr) 380px!important}
  .right-side-shell-v45{grid-template-columns:minmax(0,1fr) 56px!important}.right-side-shell-v45>.right-edge-rail-v44,.right-side-shell-v45>.right-edge-rail-v44 button{width:56px!important}
}
@media (min-width:1024px) and (max-width:1239.98px){
  .aem-panel-open-v40 .builder-workspace{grid-template-columns:250px minmax(0,1fr) 350px!important}
  .aem-panel-closed-v40 .builder-workspace{grid-template-columns:minmax(0,1fr) 350px!important}
  .right-side-shell-v45{grid-template-columns:minmax(0,1fr) 54px!important}.right-side-shell-v45>.right-edge-rail-v44,.right-side-shell-v45>.right-edge-rail-v44 button{width:54px!important}
  .content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px 8px!important}
}

/* Tablet: panels stay in document flow and stack with canvas; no overlay, no fixed rail. */
@media (min-width:768px) and (max-width:1023.98px){
  .builder-workspace{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-areas:'left' 'canvas' 'right'!important;gap:0!important}
  .aem-author-side-panel-v40.open{grid-area:left!important;position:static!important;width:100%!important;height:520px!important;min-height:0!important;max-height:520px!important;box-shadow:none!important}
  .aem-author-side-panel-v40.closed{display:none!important}
  .canvas-shell{grid-area:canvas!important}
  .right-side-shell-v45{grid-area:right!important;width:100%!important;height:620px!important;min-height:0!important;max-height:620px!important;grid-template-columns:minmax(0,1fr) 58px!important;border-top:1px solid #ddd!important;border-left:0!important}
  .content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important}
}

/* Mobile: same vertical flow. Rail remains part of the panel instead of becoming fixed bottom navigation. */
@media (max-width:767.98px){
  .builder-workspace{display:flex!important;flex-direction:column!important;overflow:visible!important}
  .aem-author-side-panel-v40.open{order:1!important;position:static!important;width:100%!important;height:480px!important;min-height:0!important;max-height:480px!important;grid-template-columns:54px minmax(0,1fr)!important;transform:none!important;box-shadow:none!important}
  .aem-author-side-panel-v40.closed{display:none!important}
  .canvas-shell{order:2!important;overflow-x:auto!important;overflow-y:visible!important}
  .right-side-shell-v45{order:3!important;position:static!important;width:100%!important;height:600px!important;min-height:0!important;max-height:600px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 54px!important;border-left:0!important;border-top:1px solid #ddd!important}
  .right-side-shell-v45>.right-edge-rail-v44{position:static!important;inset:auto!important;width:54px!important;height:100%!important;display:flex!important;flex-direction:column!important;border-top:0!important;border-left:1px solid #ddd!important}
  .right-side-shell-v45>.right-edge-rail-v44 button,
  .right-side-shell-v45>.right-edge-rail-v44 button.section-settings{width:54px!important;height:auto!important;min-height:54px!important;margin:0!important;border-right:2px solid transparent!important;border-bottom:0!important}
  .right-side-shell-v45>.right-edge-rail-v44 button.active{border-right-color:#111!important;border-bottom-color:transparent!important}
  .content-browser-mode-v44 .aem-right-workspace-content-v42{grid-template-rows:auto minmax(150px,1fr) minmax(250px,2fr)!important}
  .content-browser-mode-v44 .reference-library-grid,.content-browser-mode-v44 .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px 8px!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('Narrow flowing sidebars v45 applied: right filters 1/3 top, cards 2/3 below; both sidebars scroll away with page');
