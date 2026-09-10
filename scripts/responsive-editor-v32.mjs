import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'RESPONSIVE_EDITOR_V32';

if (!app.includes(MARKER)) {
  const anchor = 'const ZARA_CONTENT_LIBRARY_V31 = true;';
  if (!app.includes(anchor)) throw new Error('RESPONSIVE_EDITOR_V32: V31 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* responsive-editor-v32 */')) {
  css += String.raw`
/* responsive-editor-v32 */
/* Responsive shell for the editor itself. Storefront device preview remains independently switchable. */
html,body,#root,.lego-app{width:100%;max-width:100%;min-width:0}
body{overflow-x:hidden}
.lego-app,.builder-workspace,.canvas-shell,.settings-panel,.wide-settings-panel,.page-section-navigator{min-width:0!important}
.canvas-shell{width:100%;max-width:100%;overscroll-behavior-x:contain}
.storefront-frame{max-width:100%}
.wide-settings-panel{width:auto!important;max-width:none!important}
.simple-library-scroll,.content-library-scroll{min-width:0}
.visual-library-grid,.reference-library-grid{min-width:0}
.visual-library-grid>*{min-width:0}

/* XL desktop: 1600+ */
@media (min-width:1600px){
  .builder-workspace{grid-template-columns:240px minmax(760px,1fr) 520px!important}
  .canvas-shell{padding:24px 28px!important}
  .storefront-frame{width:min(1220px,100%)!important}
  .wide-settings-panel{width:520px!important}
  .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important}
  .simple-filter-shell,.simple-content-type-tabs,.simple-panel-head,.simple-panel-mode-tabs{padding-left:22px!important;padding-right:22px!important}
}

/* Standard desktop: 1440–1599 */
@media (min-width:1440px) and (max-width:1599.98px){
  .builder-workspace{grid-template-columns:220px minmax(680px,1fr) 470px!important}
  .canvas-shell{padding:22px!important}
  .storefront-frame{width:min(1120px,100%)!important}
  .wide-settings-panel{width:470px!important}
  .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important}
}

/* Compact desktop: 1240–1439 */
@media (min-width:1240px) and (max-width:1439.98px){
  .builder-workspace{grid-template-columns:188px minmax(590px,1fr) 408px!important}
  .page-section-navigator{width:auto!important}
  .canvas-shell{padding:18px!important}
  .storefront-frame{width:min(1040px,100%)!important}
  .wide-settings-panel{width:408px!important}
  .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
  .page-merch-top-status{padding-left:12px!important;padding-right:12px!important;gap:7px!important}
  .runtime-status-line>span.runtime-metric{padding-left:8px!important;padding-right:8px!important}
  .simple-filter-shell,.simple-content-type-tabs,.simple-panel-head,.simple-panel-mode-tabs{padding-left:16px!important;padding-right:16px!important}
}

/* Narrow desktop: 1025–1239 */
@media (min-width:1025px) and (max-width:1239.98px){
  .builder-workspace{grid-template-columns:164px minmax(500px,1fr) 350px!important}
  .page-section-navigator{width:auto!important;padding-left:8px!important;padding-right:8px!important}
  .canvas-shell{padding:14px!important}
  .storefront-frame{width:min(920px,100%)!important}
  .wide-settings-panel{width:350px!important}
  .visual-library-grid{grid-template-columns:1fr!important;gap:14px!important}
  .simple-filter-shell,.simple-content-type-tabs,.simple-panel-head,.simple-panel-mode-tabs{padding-left:14px!important;padding-right:14px!important}
  .simple-search-row{grid-template-columns:1fr!important}
  .simple-filter-toggle{width:100%!important;justify-content:center!important}
  .simple-filter-grid,.simple-inline-filters{grid-template-columns:1fr!important}
  .page-merch-top-status{overflow-x:auto!important;white-space:nowrap!important;scrollbar-width:thin}
  .page-merch-top-status .runtime-status-line{flex-wrap:nowrap!important}
  .app-topbar{gap:12px!important}.top-brand{min-width:190px!important}.crumbs{min-width:0!important}
}

/* Tablet: 768–1024. Panels stop competing with the canvas and become stacked work areas. */
@media (min-width:768px) and (max-width:1024px){
  .app-topbar{height:52px!important;padding:0 14px!important;gap:12px!important}
  .top-brand{min-width:0!important;flex:0 0 auto}.top-brand>span{font-size:17px!important}.crumbs{min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  .builder-toolbar{min-height:56px!important;height:auto!important;padding:7px 12px!important;grid-template-columns:auto 1fr auto!important;gap:8px!important;overflow-x:auto!important}
  .builder-toolbar .toolbar-group{flex-wrap:nowrap!important}.builder-toolbar button,.builder-toolbar select{height:36px!important;white-space:nowrap!important}
  .page-merch-top-status{position:relative!important;top:auto!important;min-height:54px!important;padding:8px 12px!important;overflow-x:auto!important;white-space:nowrap!important;z-index:12!important}
  .page-merch-top-status .runtime-status-line{flex-wrap:nowrap!important;min-width:max-content}

  .builder-workspace{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-areas:'navigator' 'canvas' 'settings'!important;min-height:0!important}
  .page-section-navigator{grid-area:navigator!important;display:block!important;position:relative!important;top:auto!important;left:auto!important;width:100%!important;height:auto!important;max-height:176px!important;overflow:auto!important;border-right:0!important;border-bottom:1px solid #e5e5e5!important;background:#fff!important;z-index:8!important;padding:10px 12px!important}
  .canvas-shell{grid-area:canvas!important;order:2!important;padding:16px!important;overflow-x:auto!important;background:#f7f7f7!important}
  .storefront-frame{width:min(900px,100%)!important;min-width:0!important;margin:0 auto!important}
  .storefront-frame.mobile{width:min(420px,100%)!important}

  .settings-panel.wide-settings-panel,.wide-settings-panel.simple-merch-panel{grid-area:settings!important;order:3!important;display:block!important;position:relative!important;inset:auto!important;top:auto!important;right:auto!important;width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;border-left:0!important;border-top:1px solid #dedede!important;z-index:7!important;overflow:visible!important}
  .settings-scroll,.simple-library-scroll,.content-library-scroll{height:auto!important;max-height:none!important;overflow:visible!important}
  .visual-library-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;gap:18px!important}
  .simple-panel-head{padding:18px 20px 12px!important}.simple-filter-shell{padding:14px 20px 18px!important}.simple-content-type-tabs{padding-left:20px!important;padding-right:20px!important}
  .simple-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .simple-inline-filters{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .page-rules-overlay{align-items:stretch!important;justify-content:flex-end!important}.page-rules-drawer{width:min(470px,70vw)!important;max-width:470px!important}
  .product-master-shell,.entity-editor-modal{width:calc(100vw - 28px)!important;max-width:none!important;margin:14px!important}
}

/* Small tablet / large phone bridge: 481–767 */
@media (min-width:481px) and (max-width:767.98px){
  .app-topbar{height:50px!important;padding:0 10px!important}.crumbs{display:none!important}.top-brand{min-width:0!important}.top-icons{margin-left:auto!important}
  .builder-toolbar{height:auto!important;min-height:54px!important;display:flex!important;align-items:center!important;gap:6px!important;padding:7px 9px!important;overflow-x:auto!important;white-space:nowrap!important}
  .builder-toolbar>.toolbar-group,.device-group{flex:0 0 auto!important}
  .page-merch-top-status{position:relative!important;top:auto!important;overflow-x:auto!important;padding:7px 9px!important}.page-merch-top-status .runtime-status-line{flex-wrap:nowrap!important;min-width:max-content}
  .builder-workspace{display:flex!important;flex-direction:column!important;min-height:0!important}
  .page-section-navigator{display:block!important;position:relative!important;top:auto!important;width:100%!important;height:auto!important;max-height:150px!important;overflow:auto!important;border-right:0!important;border-bottom:1px solid #e5e5e5!important;background:#fff!important}
  .canvas-shell{order:2!important;width:100%!important;padding:10px!important;overflow-x:auto!important}
  .storefront-frame:not(.mobile){width:720px!important;max-width:none!important}.storefront-frame.mobile{width:min(420px,100%)!important}
  .settings-panel.wide-settings-panel,.wide-settings-panel.simple-merch-panel{order:3!important;display:block!important;position:relative!important;inset:auto!important;width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;border-left:0!important;border-top:1px solid #dedede!important;overflow:visible!important}
  .settings-scroll,.simple-library-scroll,.content-library-scroll{height:auto!important;max-height:none!important;overflow:visible!important}
  .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
  .simple-filter-grid,.simple-inline-filters{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .page-rules-drawer{width:min(92vw,460px)!important}.product-master-shell,.entity-editor-modal{width:calc(100vw - 20px)!important;max-width:none!important;margin:10px!important}
}

/* Mobile editor: <=480 */
@media (max-width:480px){
  html,body,#root,.lego-app{width:100%!important;min-width:0!important;overflow-x:hidden!important}
  .app-topbar{height:48px!important;min-height:48px!important;padding:0 9px!important;gap:7px!important}.crumbs{display:none!important}.top-brand{min-width:0!important;gap:8px!important}.top-brand>span{font-size:15px!important}.top-brand>b{font-size:11px!important}.top-icons{margin-left:auto!important;gap:7px!important}.avatar{width:26px!important;height:26px!important}
  .builder-toolbar{position:sticky!important;top:0!important;z-index:30!important;height:52px!important;min-height:52px!important;display:flex!important;align-items:center!important;gap:5px!important;padding:6px 8px!important;overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap!important;background:#fff!important;scrollbar-width:none!important}
  .builder-toolbar::-webkit-scrollbar{display:none}.builder-toolbar>.toolbar-group,.device-group{display:flex!important;flex:0 0 auto!important;gap:3px!important}.builder-toolbar button,.builder-toolbar select{height:34px!important;min-width:34px!important;padding:0 8px!important;font-size:9px!important;border-radius:0!important}.device-group button{width:34px!important;padding:0!important}
  .page-merch-top-status{position:relative!important;top:auto!important;z-index:10!important;min-height:48px!important;padding:6px 8px!important;display:flex!important;overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap!important;scrollbar-width:none!important}.page-merch-top-status::-webkit-scrollbar{display:none}.page-merch-top-status .runtime-status-line{display:flex!important;flex-wrap:nowrap!important;min-width:max-content!important}.runtime-status-line>span.runtime-metric{min-height:32px!important;padding:5px 8px!important}

  .builder-workspace{display:flex!important;flex-direction:column!important;width:100%!important;min-height:0!important}
  .page-section-navigator{order:1!important;display:block!important;position:relative!important;top:auto!important;left:auto!important;width:100%!important;height:auto!important;max-height:132px!important;overflow:auto!important;padding:8px!important;border-right:0!important;border-bottom:1px solid #e5e5e5!important;background:#fff!important;z-index:6!important}
  .canvas-shell{order:2!important;width:100%!important;min-width:0!important;padding:8px!important;overflow-x:auto!important;overflow-y:visible!important;background:#f7f7f7!important}
  .storefront-frame:not(.mobile){width:680px!important;max-width:none!important;margin:0!important}.storefront-frame.mobile{width:min(420px,calc(100vw - 16px))!important;max-width:calc(100vw - 16px)!important;margin:0 auto!important;border-radius:0!important}
  .storefront-frame.mobile .builder-section{margin-left:8px!important;margin-right:8px!important}

  .settings-panel.wide-settings-panel,.wide-settings-panel.simple-merch-panel{order:3!important;display:block!important;position:relative!important;inset:auto!important;top:auto!important;right:auto!important;width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;overflow:visible!important;border-left:0!important;border-top:1px solid #dedede!important;box-shadow:none!important;z-index:5!important}
  .settings-scroll,.simple-library-scroll,.content-library-scroll{height:auto!important;max-height:none!important;overflow:visible!important}
  .simple-panel-head{min-height:62px!important;padding:16px 14px 10px!important}.simple-panel-head strong{font-size:18px!important}.simple-panel-mode-tabs{padding:0 14px!important;gap:22px!important}.simple-content-type-tabs{padding:10px 14px 0!important;gap:18px!important;overflow-x:auto!important}.simple-filter-shell{padding:10px 14px 14px!important}
  .simple-search-row{grid-template-columns:1fr!important}.simple-filter-toggle{width:100%!important;justify-content:center!important}.simple-quick-filters{display:flex!important;overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:2px!important}.simple-quick-filters button{flex:0 0 auto!important;white-space:nowrap!important}.simple-filter-grid,.simple-inline-filters{grid-template-columns:1fr!important}.simple-filter-actions{grid-template-columns:1fr auto!important;gap:8px!important}.simple-filter-actions>span{grid-column:1/-1!important}
  .simple-media-tools{display:flex!important;align-items:center!important;gap:8px!important;overflow-x:auto!important}.simple-media-kinds{display:flex!important;flex:0 0 auto!important}.simple-upload{flex:0 0 auto!important}
  .visual-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;padding:0!important}.simple-library-scroll{padding:10px!important}
  .reference-merch-card .reference-card-body{min-height:0!important}.reference-card-footer{min-height:34px!important;padding:7px 8px!important}

  .page-rules-overlay{align-items:stretch!important}.page-rules-drawer{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important}.page-rules-body{height:calc(100dvh - 64px)!important;overflow:auto!important}
  .product-master-backdrop,.entity-editor-backdrop{padding:0!important;align-items:stretch!important}.product-master-shell,.entity-editor-modal{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important;overflow:auto!important}
  .product-master-main{grid-template-columns:1fr!important}.product-master-gallery{position:relative!important;top:auto!important}.product-master-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}.product-master-attributes{grid-template-columns:1fr!important}
}

/* Very narrow phones */
@media (max-width:390px){
  .visual-library-grid{grid-template-columns:1fr!important;gap:14px!important}
  .simple-filter-actions{grid-template-columns:1fr!important}.simple-reset{width:100%!important}.simple-filter-actions>span{grid-column:auto!important}
  .product-master-kpis{grid-template-columns:1fr!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('Responsive editor v32 applied: XL desktop, desktop, tablet and mobile shell');
