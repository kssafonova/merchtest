import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
let css = readFileSync(cssPath, 'utf8');
const MARKER = 'MOBILE_LAYOUT_STABILITY_V78';

if (!app.includes(MARKER)) {
  const anchor = 'const AUTOMATION_SCENARIO_EDITOR_V77 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V77 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');
  writeFileSync(appPath, app);
}

// Remove obsolete pre-responsive mobile rules. The old grid-column:auto!important
// was overriding the explicit gridArea written by SectionCanvas and collapsed
// every mobile slot to one column even when its canonical V73 span was 2 or 4.
css = css
  .replace(/\.storefront-frame\.mobile\s+\.slot-grid\s*\{\s*grid-template-columns\s*:\s*1fr\s*!important\s*;?\s*\}/g, '')
  .replace(/\.storefront-frame\.mobile\s+\.slot-grid\s*>\s*div\s*\{\s*grid-column\s*:\s*auto\s*!important\s*;?\s*\}/g, '')
  .replace(/\.storefront-frame\.mobile\s+\.lego-slot\s*\{\s*min-height\s*:\s*190px\s*;?\s*\}/g, '');

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
/* Deliberately DO NOT set grid-column/grid-row here: SectionCanvas owns them via gridArea. */
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
/* Authoring overlays must never participate in grid sizing. */
.storefront-frame.mobile .section-author-toolbar-v57,
.storefront-frame.mobile .section-select-toggle-v60{
  box-sizing:border-box!important;
}
.storefront-frame.mobile .section-author-toolbar-v57{
  max-width:100%!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  scrollbar-width:none!important;
}
.storefront-frame.mobile .section-author-toolbar-v57::-webkit-scrollbar{display:none!important}
`;
}

writeFileSync(cssPath, css);
console.log('V78 applied: mobile section slots now respect canonical 4-column V73 grid spans and rows');
