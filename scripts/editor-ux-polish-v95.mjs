import { readFileSync, writeFileSync } from 'node:fs';
const path = 'src/appv3.css';
let css = readFileSync(path, 'utf8');
if (!css.includes('/* editor-ux-polish-v95:')) {
  css += String.raw`

/* editor-ux-polish-v95: consistent visual hierarchy and interaction affordances */
.lego-app {
  --ux-text:#20242a;
  --ux-secondary:#646c77;
  --ux-line:#e1e5ea;
  --ux-blue:#245bc3;
  --ux-blue-soft:#edf3ff;
  --ux-surface:#fff;
  --ux-canvas:#f1f3f5;
  color:var(--ux-text)!important;
}
.lego-app button,
.lego-app input,
.lego-app select,
.lego-app textarea { font-family:Inter,ui-sans-serif,system-ui,sans-serif!important; }
.lego-app button:focus-visible,
.lego-app a:focus-visible,
.lego-app input:focus-visible,
.lego-app select:focus-visible,
.lego-app textarea:focus-visible,
.lego-app summary:focus-visible,
.lego-app [tabindex]:focus-visible {
  outline:2px solid var(--ux-blue)!important;
  outline-offset:2px!important;
}
.lego-app button:disabled { cursor:not-allowed!important; }
.lego-app .editor-header-v43 {
  background:var(--ux-surface)!important;
  border-bottom:1px solid var(--ux-line)!important;
  box-shadow:0 1px 2px rgba(27,37,51,.035)!important;
}
.lego-app .editor-history-v43 button,
.lego-app .editor-layers-v43,
.lego-app .editor-emulator-v43 button { border-radius:7px!important; }
.lego-app .editor-preview-v43,
.lego-app .editor-analytics-v43 {font-size:11px!important;font-weight:600!important;border-radius:7px!important;gap:7px!important;}
.lego-app .editor-publish-v43 {
  min-height:36px!important;
  border-radius:7px!important;
  padding:0 15px!important;
  background:#20242a!important;
  border-color:#20242a!important;
  color:#fff!important;
  font-size:11px!important;
  font-weight:650!important;
  letter-spacing:0!important;
}
.lego-app .editor-publish-v43:hover {background:#373f49!important;}
.lego-app .editor-emulator-v43 {
  background:#f3f5f8!important;
  border:1px solid var(--ux-line)!important;
  border-radius:9px!important;
  gap:2px!important;
}
.lego-app .editor-emulator-v43 button.active {
  color:#fff!important;background:#20242a!important;
  box-shadow:0 1px 4px rgba(0,0,0,.13)!important;
}
.lego-app .editor-language-v43 button { font-size:10px!important;font-weight:650!important; }
.lego-app .editor-language-v43 button.active {color:var(--ux-blue)!important;border-bottom-color:var(--ux-blue)!important;}
.lego-app .editor-zoom-v89 {border-radius:8px!important;}
.lego-app .editor-zoom-v89 button {font-size:10px!important;min-width:40px!important;}
.lego-app .editor-zoom-v89 button.active {background:#20242a!important;}
/* Legible left navigation: the controls stay at the top while the tree scrolls. */
.lego-app .aem-author-side-panel-v40 {
  background:var(--ux-surface)!important;
  border-right:1px solid var(--ux-line)!important;
}
.lego-app .aem-side-rail-v40 {background:#f7f8fa!important;border-right:1px solid var(--ux-line)!important;}
.lego-app .aem-side-rail-v40 button {color:#69727e!important;}
.lego-app .aem-side-rail-v40 button span {font-size:9px!important;font-weight:550!important;line-height:1.2!important;}
.lego-app .aem-side-rail-v40 button:hover {background:#eaf0fa!important;color:#273e64!important;}
.lego-app .aem-side-rail-v40 button.active {color:var(--ux-blue)!important;border-left-color:var(--ux-blue)!important;}
.lego-app .aem-side-head-v40 {
  min-height:66px!important;
  padding:13px 14px 12px!important;
  border-bottom:1px solid var(--ux-line)!important;
}
.lego-app .aem-side-head-v40 span {font-size:9px!important;font-weight:650!important;color:#78808c!important;}
.lego-app .aem-side-head-v40 strong {font-size:15px!important;font-weight:650!important;line-height:1.25!important;color:var(--ux-text)!important;}
.lego-app .aem-side-head-v40>button {width:32px!important;height:32px!important;border-radius:7px!important;}
.lego-app .aem-side-head-v40>button:hover {background:#f1f3f6!important;}
.lego-app .aem-side-search-v40 {
  height:42px!important;
  margin:8px 12px 5px!important;
  padding:0 10px!important;
  border:1px solid var(--ux-line)!important;
  border-radius:8px!important;
  background:#f9fafb!important;
}
.lego-app .aem-side-search-v40:focus-within {border-color:var(--ux-blue)!important;background:#fff!important;box-shadow:0 0 0 3px rgba(36,91,195,.09)!important;}
.lego-app .aem-side-search-v40 input {font-size:11px!important;}
.lego-app .aem-side-scroll-v40 {padding:12px 10px 32px!important;}
.lego-app .aem-content-tree-v40 {padding:0!important;}
.lego-app .aem-content-tree-v40 strong {font-size:11px!important;font-weight:620!important;color:var(--ux-text)!important;}
.lego-app .aem-content-tree-v40 small {font-size:9px!important;color:#79818b!important;}
.lego-app .aem-content-tree-root-v40,
.lego-app .aem-content-tree-main-v40,
.lego-app .aem-content-tree-static-v40 {
  min-height:44px!important;
  padding:5px 7px!important;
  border-bottom:1px solid #f0f2f5!important;
}
.lego-app .aem-content-tree-sections-v40 {padding-left:10px!important;}
.lego-app .aem-content-tree-sections-v40 button {
  min-height:52px!important;
  margin:2px 0!important;
  padding:8px 9px!important;
  border:1px solid transparent!important;
  border-left:3px solid transparent!important;
  border-radius:7px!important;
  background:#fff!important;
  gap:6px!important;
}
.lego-app .aem-content-tree-sections-v40 button:hover {background:#f3f6fa!important;border-color:#e9edf3!important;}
.lego-app .aem-content-tree-sections-v40 button.selected {
  background:var(--ux-blue-soft)!important;
  border-color:#dce7fc!important;
  border-left-color:var(--ux-blue)!important;
}
.lego-app .aem-content-tree-sections-v40 button em {font-size:9px!important;color:#6b7480!important;}
.lego-app .aem-side-add-v40 {
  min-height:40px!important;
  border-radius:8px!important;
  font-size:11px!important;
  font-weight:650!important;
  background:#f9fbff!important;
  color:var(--ux-blue)!important;
  border:1px dashed #a7bce7!important;
}
.lego-app .aem-side-add-v40:hover {background:#eaf2ff!important;border-color:var(--ux-blue)!important;}
/* Canvas stays the middle scroll surface, with clearer selection states. */
.lego-app .canvas-shell {background:var(--ux-canvas)!important;}
.lego-app .canvas-shell>.storefront-frame {
  border:1px solid #dbe0e6!important;
  box-shadow:0 6px 24px rgba(21,29,43,.085)!important;
}
.lego-app:not(.preview-mode) .builder-section.selected {
  outline:2px solid var(--ux-blue)!important;
  outline-offset:2px!important;
}
.lego-app .selected-content-slot {outline-color:var(--ux-blue)!important;}
.lego-app .section-author-toolbar-v57 button {
  font-size:10px!important;
  font-weight:600!important;
  min-height:30px!important;
}
.lego-app .section-author-toolbar-v57 button:hover:not(:disabled) {filter:brightness(.96);}
.lego-app .merch-empty-section-v74 {border-radius:8px!important;}
/* Right content: controls, filters and cards use readable text and visible active states. */
.lego-app .right-side-shell-v45 {background:#fff!important;border-left:1px solid var(--ux-line)!important;}
.lego-app .right-side-shell-v45>.right-edge-rail-v44 {
  background:#f7f8fa!important;
  border-left:1px solid var(--ux-line)!important;
}
.lego-app .right-edge-rail-v44 button {font-size:9px!important;font-weight:600!important;color:#6a727d!important;}
.lego-app .right-edge-rail-v44 button span {line-height:1.25!important;}
.lego-app .right-edge-rail-v44 button:hover:not(:disabled) {background:#eef2f9!important;color:#233f70!important;}
.lego-app .right-edge-rail-v44 button.active {
  color:var(--ux-blue)!important;
  background:#fff!important;
  border-right-color:var(--ux-blue)!important;
}
.lego-app .aem-properties-panel-v40 {background:#fff!important;}
.lego-app .aem-properties-panel-v40 .simple-panel-head {
  min-height:64px!important;
  padding:14px 16px!important;
  background:#fff!important;
  border-bottom:1px solid var(--ux-line)!important;
}
.lego-app .aem-properties-panel-v40 .simple-panel-head strong {font-size:17px!important;font-weight:650!important;letter-spacing:-.015em!important;}
.lego-app .aem-properties-panel-v40 .simple-panel-head small {font-size:10px!important;line-height:1.4!important;color:#6f7884!important;}
.lego-app .content-browser-mode-v44 .aem-browser-shell-v37 {
  padding:12px 14px 18px!important;
  border-bottom:1px solid var(--ux-line)!important;
}
.lego-app .content-browser-mode-v44 .aem-facets-v37 {gap:8px!important;}
.lego-app .content-browser-mode-v44 .aem-facets-title-v37 {min-height:26px!important;}
.lego-app .content-browser-mode-v44 .aem-facets-title-v37 span,
.lego-app .content-browser-mode-v44 .aem-facets-title-v37 button {font-size:10px!important;}
.lego-app .content-browser-mode-v44 .facet-menu-v46>summary {
  min-height:43px!important;height:auto!important;
  padding:7px 9px!important;
  border-radius:7px!important;
  border-color:#d8dee7!important;
}
.lego-app .content-browser-mode-v44 .facet-menu-v46[open]>summary,
.lego-app .content-browser-mode-v44 .facet-menu-v46.has-value>summary {
  background:#f5f8fe!important;border-color:var(--ux-blue)!important;
}
.lego-app .content-browser-mode-v44 .facet-summary-copy-v46 {gap:3px!important;}
.lego-app .content-browser-mode-v44 .facet-summary-copy-v46 strong {font-size:9px!important;color:#65707e!important;}
.lego-app .content-browser-mode-v44 .facet-summary-copy-v46 small {font-size:11px!important;font-weight:600!important;}
.lego-app .content-browser-mode-v44 .facet-options-v46 {max-height:210px!important;border-radius:7px!important;box-shadow:0 8px 22px rgba(25,37,58,.12)!important;}
.lego-app .content-browser-mode-v44 .facet-options-v46 button {min-height:32px!important;padding:5px 8px!important;font-size:10px!important;}
.lego-app .content-browser-mode-v44 .facet-options-v46 button em {font-size:9px!important;}
.lego-app .content-browser-mode-v44 .aem-commerce-status-v37>span,
.lego-app .content-browser-mode-v44 .aem-browser-resultbar-v37 span {font-size:9px!important;}
.lego-app .content-browser-mode-v44 .aem-commerce-status-v37 button {
  min-height:32px!important;height:auto!important;
  font-size:10px!important;padding:5px 7px!important;
  border-radius:6px!important;
}
.lego-app .content-browser-mode-v44 .aem-commerce-status-v37 button.active {border-color:var(--ux-blue)!important;background:var(--ux-blue-soft)!important;color:#173d85!important;}
.lego-app .content-browser-mode-v44 .aem-browser-resultbar-v37 strong {font-size:11px!important;}
.lego-app .content-browser-mode-v44 .aem-active-filters-v37 button {min-height:28px!important;font-size:10px!important;border-radius:5px!important;}
.lego-app .content-browser-mode-v44 .aem-search-field-v37 {min-height:40px!important;height:40px!important;}
.lego-app .content-browser-mode-v44 .aem-search-field-v37 input {font-size:11px!important;}
.lego-app .content-browser-mode-v44 .aem-commerce-mode-v37 button {font-size:10px!important;min-height:30px!important;height:30px!important;}
.lego-app .content-browser-mode-v44 .simple-library-scroll,
.lego-app .content-browser-mode-v44 .content-library-scroll {padding:15px 14px 36px!important;}
.lego-app .content-grid-v46,
.lego-app .content-browser-mode-v44 .reference-library-grid,
.lego-app .content-browser-mode-v44 .visual-library-grid {gap:20px 12px!important;}
.lego-app .content-card-v46 {border-radius:7px!important;overflow:hidden!important;background:#fff!important;}
.lego-app .content-card-v46:hover {box-shadow:0 5px 18px rgba(21,29,43,.13)!important;}
.lego-app .content-card-media-v46 {border-radius:7px!important;background:#f3f4f6!important;}
.lego-app .content-card-copy-v46 {padding:9px 1px 2px!important;gap:5px!important;}
.lego-app .content-card-eyebrow-v46 span,
.lego-app .content-card-eyebrow-v46 em {font-size:9px!important;line-height:1.3!important;}
.lego-app .content-card-title-v46 {font-size:11px!important;line-height:1.4!important;min-height:31px!important;font-weight:650!important;}
.lego-app .content-card-secondary-v46 {font-size:9px!important;line-height:1.3!important;}
.lego-app .content-card-price-v46 {font-size:12px!important;font-weight:700!important;}
.lego-app .content-card-price-v46 span {font-size:9px!important;}
.lego-app .content-card-signals-v46>span {font-size:9px!important;}
.lego-app .content-card-signals-v46>span b {font-size:9px!important;}
.lego-app .content-card-actions-v46 {min-height:33px!important;font-size:9px!important;color:#5f6874!important;}
.lego-app .content-card-add-v46 {font-weight:650!important;color:var(--ux-blue)!important;}
.lego-app .content-card-media-v46 .entity-details-trigger {
  width:34px!important;height:34px!important;
  opacity:1!important;
  border-radius:8px!important;
}
/* Settings readable without altering control behavior. */
.lego-app .section-settings-mode-v44 .settings-scroll label,
.lego-app .aem-page-settings-v43 label {font-size:10px!important;line-height:1.45!important;}
.lego-app .section-settings-mode-v44 input,
.lego-app .section-settings-mode-v44 select,
.lego-app .section-settings-mode-v44 textarea {
  min-height:36px!important;
  font-size:11px!important;
}
.lego-app :is(.aem-side-scroll-v40,.canvas-shell,.aem-properties-panel-v40,.content-library-scroll,.simple-library-scroll) {
  scrollbar-width:thin!important;
  scrollbar-color:#c5ccd6 transparent!important;
}
.lego-app :is(.aem-side-scroll-v40,.canvas-shell,.aem-properties-panel-v40,.content-library-scroll,.simple-library-scroll)::-webkit-scrollbar {width:8px;height:8px;}
.lego-app :is(.aem-side-scroll-v40,.canvas-shell,.aem-properties-panel-v40,.content-library-scroll,.simple-library-scroll)::-webkit-scrollbar-thumb {background:#c5ccd6;border:2px solid transparent;background-clip:padding-box;border-radius:20px;}
@media (min-width:1025px) {
  .lego-app .canvas-shell {padding:24px 26px 48px!important;}
  .lego-app .aem-properties-panel-v40 .simple-panel-head {position:sticky!important;top:0!important;z-index:30!important;}
  .lego-app.preview-mode .builder-workspace,
  .lego-app.aem-mode-preview .builder-workspace {grid-template-columns:minmax(0,1fr)!important;}
  .lego-app.preview-mode .canvas-shell {padding:26px!important;}
}
@media (max-width:1024px) {
  .lego-app .mobile-tabbar-v85 {
    height:calc(60px + env(safe-area-inset-bottom))!important;
    padding-bottom:env(safe-area-inset-bottom)!important;
  }
  .lego-app .mobile-tabbar-v85 button {font-size:10px!important;font-weight:650!important;}
  .lego-app .mobile-tabbar-v85 button.active {color:var(--ux-blue)!important;}
  .lego-app .mobile-tabbar-v85 button.active:before {
    content:"";position:absolute;top:0;width:30px;height:3px;
    background:var(--ux-blue);border-radius:0 0 3px 3px;
  }
  .lego-app .mobile-tabbar-v85 button {position:relative!important;}
  .lego-app .canvas-shell {
    height:calc(100dvh - 114px - env(safe-area-inset-bottom))!important;
    scroll-behavior:auto!important;
  }
  .lego-app .aem-author-side-panel-v40,
  .lego-app .right-side-shell-v45 {
    height:calc(100dvh - 114px - env(safe-area-inset-bottom))!important;
  }
  .lego-app .content-card-title-v46 {font-size:12px!important;}
  .lego-app .content-card-secondary-v46 {font-size:10px!important;}
  .lego-app .content-card-eyebrow-v46 span,
  .lego-app .content-card-eyebrow-v46 em {font-size:9px!important;}
}
@media (prefers-reduced-motion: reduce) {
  .lego-app *, .lego-app *::before, .lego-app *::after {
    scroll-behavior:auto!important;
    animation-duration:.01ms!important;
    transition-duration:.01ms!important;
  }
}

`;
  writeFileSync(path, css);
}
console.log('V95 applied: improved editor hierarchy, controls, and responsive affordances');
