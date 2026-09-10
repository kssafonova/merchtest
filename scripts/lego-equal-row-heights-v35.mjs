import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'LEGO_EQUAL_ROW_HEIGHTS_V35';

if (!app.includes(MARKER)) {
  const anchor = 'const RESPONSIVE_LAYOUT_PREVIEWS_V34 = true;';
  if (!app.includes(anchor)) throw new Error('LEGO_EQUAL_ROW_HEIGHTS_V35: V34 marker missing');

  const helpers = String.raw`
function legoPlacedSlotsV35(container) {
  const cols = Math.max(1, Number(container?.cols || 12));
  const source = Array.isArray(container?.slots) ? container.slots : [];
  let autoRow = 1;
  let autoCol = 1;

  return source.map((slot, index) => {
    const span = Math.max(1, Math.min(cols, Number(slot?.span || cols)));
    const rows = Math.max(1, Number(slot?.rows || 1));
    let start = Number(slot?.start || 0);
    let rowStart = Number(slot?.rowStart || 0);

    if (!rowStart) {
      if (!start) {
        if (autoCol + span - 1 > cols) {
          autoRow += 1;
          autoCol = 1;
        }
        start = autoCol;
        rowStart = autoRow;
        autoCol += span;
        if (autoCol > cols) {
          autoRow += 1;
          autoCol = 1;
        }
      } else {
        rowStart = autoRow;
      }
    }

    return { ...slot, _v35Index: index, start: start || 1, span, rows, rowStart };
  });
}

function legoTrackSizeV35(container, slot, rowGapShare = 0) {
  const cols = Math.max(1, Number(container?.cols || 12));
  const gap = Math.max(0, Number(container?.columnGap || 0));
  const span = Math.max(1, Math.min(cols, Number(slot?.span || cols)));
  const rowSpan = Math.max(1, Number(slot?.rows || 1));
  const orientation = slotOrientationV30(slot);
  const ratio = orientation === 'landscape' ? (2 / 3) : (3 / 2);
  const effectiveRatio = ratio / rowSpan;

  // Exact width of a grid item expressed through container-query width:
  // span/cols * W + correction for column gaps. Then convert width to the media ratio.
  const widthPercent = span / cols;
  const gapCorrection = gap * ((span - 1) - widthPercent * (cols - 1));
  const cqw = 100 * widthPercent * effectiveRatio;
  const px = gapCorrection * effectiveRatio - rowGapShare;
  const roundedCqw = Math.round(cqw * 1000) / 1000;
  const roundedPx = Math.round(px * 100) / 100;
  if (Math.abs(roundedPx) < 0.01) return roundedCqw + 'cqw';
  return 'calc(' + roundedCqw + 'cqw ' + (roundedPx >= 0 ? '+ ' : '- ') + Math.abs(roundedPx) + 'px)';
}

function legoGridTemplateRowsV35(container) {
  const placed = legoPlacedSlotsV35(container);
  if (!placed.length) return undefined;
  const explicitRows = Number(container?.rows || 0);
  const rowCount = Math.max(explicitRows, ...placed.map((slot) => slot.rowStart + slot.rows - 1), 1);
  const rowGap = Math.max(0, Number(container?.rowGap || 0));

  return Array.from({ length: rowCount }, (_, offset) => {
    const row = offset + 1;
    const touching = placed.filter((slot) => slot.rowStart <= row && row < slot.rowStart + slot.rows);
    if (!touching.length) return 'auto';

    // LEGO rule: a normal one-row cell defines the row. If there are several,
    // the narrowest cell is the reference so product/editorial tiles stay visually aligned.
    const singleRow = touching.filter((slot) => slot.rows === 1 && slot.rowStart === row);
    const basisPool = singleRow.length ? singleRow : touching;
    const basis = [...basisPool].sort((a, b) => (a.span / a.rows) - (b.span / b.rows) || a._v35Index - b._v35Index)[0];
    const spanningGapShare = basis.rows > 1 ? (rowGap * (basis.rows - 1)) / basis.rows : 0;
    return legoTrackSizeV35(container, basis, spanningGapShare);
  }).join(' ');
}
`;

  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  // A slot's height is owned by the LEGO row, not by its own aspect-ratio.
  app = app.replaceAll(
    "minHeight: undefined, aspectRatio: slotAspectRatioV30(shape), alignSelf: 'start'",
    "minHeight: undefined, aspectRatio: 'auto', height: '100%', alignSelf: 'stretch'"
  );
  app = app.replaceAll(
    "style={{ aspectRatio: slotAspectRatioV30(slot), gridColumn:",
    "style={{ aspectRatio: 'auto', height: '100%', alignSelf: 'stretch', gridColumn:"
  );

  // Canvas, photo previews and schematic previews use exactly the same row-height calculation.
  const patchGridFunction = (functionName) => {
    const start = app.indexOf('function ' + functionName + '(');
    if (start < 0) return;
    const end = app.indexOf('\nfunction ', start + 20);
    if (end < 0) return;
    let chunk = app.slice(start, end);
    if (!chunk.includes('legoGridTemplateRowsV35(container)')) {
      chunk = chunk.replaceAll(
        'style={{ gridTemplateColumns:',
        "style={{ gridTemplateRows: legoGridTemplateRowsV35(container), gridTemplateColumns:"
      );
    }
    app = app.slice(0, start) + chunk + app.slice(end);
  };

  patchGridFunction('SectionCanvas');
  patchGridFunction('LayoutPhotoPreview');
  patchGridFunction('TypePreview');

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* lego-equal-row-heights-v35 */')) {
  css += String.raw`
/* lego-equal-row-heights-v35 */
/* LEGO invariant: every cell in the same row shares one exact track height. */
.section-container,.layout-photo-container,.type-preview-container{container-type:inline-size!important}
.slot-grid,.layout-photo-grid,.type-preview-grid{align-items:stretch!important;grid-auto-flow:row!important;min-width:0!important}

.v2-slot-wrap,
.v2-slot-wrap.slot-portrait,
.v2-slot-wrap.slot-landscape,
.v2-slot-wrap.slot-rowspan{
  aspect-ratio:auto!important;
  height:100%!important;
  min-height:0!important;
  max-height:none!important;
  align-self:stretch!important;
  overflow:hidden!important;
}
.v2-slot-wrap>.lego-slot{height:100%!important;min-height:0!important;max-height:none!important}
.v2-slot-wrap .entity-product,
.v2-slot-wrap .entity-media,
.v2-slot-wrap .merch-card-media{height:100%!important;min-height:0!important;max-height:none!important}
.v2-slot-wrap img,.v2-slot-wrap video{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}

.layout-photo-grid>span,
.layout-photo-grid>span.slot-preview-portrait,
.layout-photo-grid>span.slot-preview-landscape,
.layout-photo-grid>span.slot-preview-rowspan,
.type-preview-grid>span,
.type-preview-grid>span.slot-preview-portrait,
.type-preview-grid>span.slot-preview-landscape,
.type-preview-grid>span.slot-preview-rowspan{
  aspect-ratio:auto!important;
  height:100%!important;
  min-height:0!important;
  max-height:none!important;
  align-self:stretch!important;
  overflow:hidden!important;
}
.layout-photo-grid>span img,.type-preview-grid>span img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}

/* The source media may be portrait 2:3 or landscape 3:2; the LEGO cell crops it to the shared row box. */
.lego-slot .merch-card-media,.lego-slot .entity-product,.lego-slot .entity-media{aspect-ratio:auto!important}

/* Keep previews deterministic at every breakpoint. */
.dual-layout-device .layout-photo-container,.responsive-type-previews .type-preview-container,.settings-layout-previews .type-preview-container{container-type:inline-size!important}
.storefront-frame.mobile .slot-grid,.storefront-frame.desktop .slot-grid{align-items:stretch!important}

@media(max-width:520px){
  .section-inline-layout-preview{min-height:96px!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('LEGO equal row heights v35 applied: one row = one height across canvas and previews');
