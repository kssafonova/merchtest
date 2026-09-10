import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const baseCssPath = 'src/type-builder.css';
let app = readFileSync(appPath, 'utf8');
let css = readFileSync(cssPath, 'utf8');
let baseCss = readFileSync(baseCssPath, 'utf8');
const MARKER = 'MOBILE_LAYOUT_STABILITY_V78';

if (!app.includes(MARKER)) {
  const anchor = 'const AUTOMATION_SCENARIO_EDITOR_V77 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V77 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');
  writeFileSync(appPath, app);
}

function cleanLegacyMobileCss(source) {
  source = source.replace(/grid-column\s*:\s*auto\s*!important\s*;?/g, '');
  source = source.replace(/(\.storefront-frame\.mobile\s+\.slot-grid\s*\{)([^}]*)\}/g, (full, head, body) => {
    return head + body.replace(/grid-template-columns\s*:\s*1fr\s*!important\s*;?/g, '') + '}';
  });
  source = source.replace(/(\.storefront-frame\.mobile\s+\.lego-slot\s*\{)([^}]*)\}/g, (full, head, body) => {
    return head + body.replace(/min-height\s*:\s*190px\s*;?/g, '') + '}';
  });
  return source;
}

// The obsolete mobile rules exist in the original type-builder stylesheet,
// while later responsive patches live in appv3.css. Sanitize both sources so
// no !important declaration can override the explicit V73 slot gridArea.
css = cleanLegacyMobileCss(css);
baseCss = cleanLegacyMobileCss(baseCss);
writeFileSync(baseCssPath, baseCss);

if (!css.includes('/* mobile-layout-stability-v78 */')) {
  css += String.raw`
/* mobile-layout-stability-v78 */
/* One source of truth: explicit V73 mobileContainers, 4 columns, exact inline gridArea. */
.storefront-frame.mobile{
  width:375px!important;
  min-width:375px!important;
  max-width:375px!important;
  overflow:visible!important;
}
.storefront-frame.mobile .builder-section.layout-v2,
.storefront-frame.mobile .builder-section.layout-v2 .section-containers,
.storefront-frame.mobile .builder-section.layout-v2 .section-container{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
}
.storefront-frame.mobile .builder-section.layout-v2 .slot-grid{
  display:grid!important;
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
  grid-auto-flow:row!important;
  grid-auto-columns:0!important;
  column-gap:4px!important;
  row-gap:4px!important;
  align-items:stretch!important;
  justify-items:stretch!important;
  box-sizing:border-box!important;
}
/* DO NOT set grid-column/grid-row: inline gridArea owns canonical placement. */
.storefront-frame.mobile .builder-section.layout-v2 .slot-grid>.v2-slot-wrap{
  min-width:0!important;
  max-width:none!important;
  width:auto!important;
  height:100%!important;
  margin:0!important;
  align-self:stretch!important;
  justify-self:stretch!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
}
.storefront-frame.mobile .builder-section.layout-v2 .v2-slot-wrap>.lego-slot,
.storefront-frame.mobile .builder-section.layout-v2 .v2-slot-wrap .entity-product,
.storefront-frame.mobile .builder-section.layout-v2 .v2-slot-wrap .entity-media,
.storefront-frame.mobile .builder-section.layout-v2 .v2-slot-wrap .merch-card-media{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  height:100%!important;
  min-height:0!important;
  box-sizing:border-box!important;
}
.storefront-frame.mobile .builder-section.layout-v2 .v2-slot-wrap img,
.storefront-frame.mobile .builder-section.layout-v2 .v2-slot-wrap video,
.storefront-frame.mobile .builder-section.layout-v2 .v2-slot-wrap .variant-atlas-frame{
  width:100%!important;
  height:100%!important;
  max-width:100%!important;
  display:block!important;
  object-fit:cover!important;
}
.storefront-frame.mobile .section-author-toolbar-v57,
.storefront-frame.mobile .section-select-toggle-v60{box-sizing:border-box!important}
.storefront-frame.mobile .section-author-toolbar-v57{
  max-width:100%!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  scrollbar-width:none!important;
}
.storefront-frame.mobile .section-author-toolbar-v57::-webkit-scrollbar{display:none!important}
/* Restore the unrelated filter layout that previously used grid-column:auto. */
@media (max-width:390px){.simple-filter-actions>span{grid-column:auto!important}}
`;
}

writeFileSync(cssPath, css);
console.log('V78 applied: mobile section slots now respect canonical 4-column V73 grid spans and rows; legacy base CSS removed');
