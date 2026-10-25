// One explicit source-transform pipeline for dev and production builds.
// Keep this list ordered: later patches intentionally depend on markers/functions created above.
const pipeline = [
  'catalog-data.mjs','feed-data.mjs','prepare-app.mjs','fix-content-panel-source.mjs','content-panel.mjs',
  'section-rules-v3.mjs','section-layouts-v2.mjs','simplify-builder-v4.mjs','runtime-hotfix-v5.mjs',
  'visual-merch-panel-v6.mjs','fit-handler-v6b.mjs','site-tree-chrome-v7.mjs','reference-library-cards-v8.mjs',
  'page-tree-merch-v9.mjs','simple-content-panel-v10.mjs','section-settings-v11.mjs','runtime-hotfix-v12.mjs',
  'page-rules-v14.mjs','page-rules-v15.mjs','page-rules-v16-hotfix.mjs','page-rules-v17-hotfix.mjs',
  'ux-unification-v18.mjs','runtime-hotfix-v19.mjs','adjacent-section-insert-v21.mjs','product-master-data-v22.mjs',
  'product-variants-v23-compat-pre.mjs','product-variants-v23.mjs','product-variants-v23-compat-post.mjs','product-media-ratios-v24.mjs',
  'premium-ui-system-v29.mjs','universal-ratios-v30.mjs','zara-content-library-v31.mjs','responsive-editor-v32.mjs',
  'fashion-grade-ui-v33.mjs','responsive-layout-previews-v34.mjs','lego-equal-row-heights-v35.mjs','aem-dynamic-layout-mode-v36.mjs',
  'aem-sites-commerce-browser-v37.mjs','section-layout-drawer-v38.mjs','aem-authoring-shell-v40.mjs','aem-panels-dnd-v41.mjs',
  'aem-panel-tabs-v42.mjs','page-settings-header-v43.mjs','right-content-workspace-v44.mjs','narrow-flowing-sidebars-v45.mjs',
  'right-panel-content-ux-v46.mjs','content-card-overlays-v47.mjs','content-filters-reset-v48.mjs','global-pages-local-automation-v49.mjs',
  'product-master-context-v50.mjs','product-master-context-v50-hotfix.mjs','center-canvas-scroll-v51.mjs','product-master-tabs-v52.mjs',
  'look-master-editor-v53.mjs','media-master-editor-v54.mjs','master-tabs-media-dnd-v56.mjs','section-canvas-toolbar-v58.mjs',
  'master-tabs-dnd-stability-v59.mjs','section-multiselect-group-rules-v61.mjs','section-toolbar-visibility-hint-v62.mjs',
  'automation-master-v63.mjs','automation-master-v63-hotfix.mjs','automation-groups-events-v64.mjs','automation-acceptance-v65.mjs',
  'automation-runtime-init-v66.mjs','section-canvas-runtime-v67.mjs','repeat-combo-visible-v68.mjs','section-authoring-unified-v69.mjs',
  'mobile-canvas-stability-v70.mjs','media-pager-vertical-v71.mjs','auto-repeat-dynamic-collapse-v72.mjs','layout-library-zara-v73.mjs',
  'merchandiser-ux-v74.mjs','runtime-context-hotfix-v75.mjs','automation-editor-reference-v76.mjs','automation-scenario-editor-v77.mjs',
  'mobile-layout-stability-v78.mjs','ops-migration-lab-v79.mjs','ux-audit-fixes-v80.mjs','runtime-looks-v81.mjs',
  'group-automation-unified-v82.mjs','sales-merch-v83.mjs','storefront-commerce-v84.mjs','responsive-shell-v85.mjs',
  'logic-audit-v86.mjs','market-stock-v87.mjs','rules-ux-v88.mjs','canvas-ux-v89.mjs','ui-layout-stability-v90.mjs',
  'slot-badges-metrics-v91.mjs','panel-flow-slot-metrics-v92.mjs','document-scroll-content-flow-v93.mjs',
  'independent-panel-scroll-v94.mjs','editor-ux-polish-v95.mjs',
  'autofill-user-flow-v96.mjs',
  'figma-editor-bridge-v97.mjs','figma-visual-v98.mjs','figma-hosted-import-v99.mjs',
  'figma-slot-templates-v100.mjs','figma-json-primary-v103.mjs',
  'automation-apply-fix-v104.mjs','content-browser-focus-v105.mjs','figma-mobile-and-automation-ux-v106.mjs','automation-repeat-cleanup-v107.mjs','automation-dialog-tdz-fix-v108.mjs','figma-overlap-render-v111.mjs',
];
for (const file of pipeline) {
  await import(new URL('./' + file, import.meta.url));
}
if (process.env.npm_lifecycle_event === 'prebuild') {
  await import(new URL('./runtime-smoke-v75.mjs', import.meta.url));
  await import(new URL('./automation-dialog-runtime-smoke-v109.mjs', import.meta.url));
  await import(new URL('./figma-overlap-runtime-smoke-v112.mjs', import.meta.url));
}
