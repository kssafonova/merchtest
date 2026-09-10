import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'UNIVERSAL_RATIOS_V30';

if (!app.includes(MARKER)) {
  const anchor = 'const PREMIUM_UI_SYSTEM_V29 = true;';
  if (!app.includes(anchor)) throw new Error('UNIVERSAL_RATIOS_V30: V29 marker missing');

  const helpers = String.raw`
function ratioOrientationV30(value, fallback = 'portrait') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return fallback;
  if (raw.includes('landscape') || raw.includes('horizontal')) return 'landscape';
  if (raw.includes('portrait') || raw.includes('vertical')) return 'portrait';
  const match = raw.match(/(\d+(?:\.\d+)?)\s*[:x\/]\s*(\d+(?:\.\d+)?)/);
  if (match) {
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (width > 0 && height > 0) return width > height ? 'landscape' : 'portrait';
  }
  return fallback;
}

function slotOrientationV30(shape) {
  return ratioOrientationV30(shape?.ratio, 'portrait');
}

function slotAspectRatioV30(shape) {
  return slotOrientationV30(shape) === 'landscape' ? '3 / 2' : '2 / 3';
}

function entityRatioOrientationV30(entity) {
  if (!entity) return 'portrait';
  if (Object.prototype.hasOwnProperty.call(entity, 'price') || entity.kind === 'look') return 'portrait';
  const explicit = entity.orientation || entity.mediaOrientation || entity.aspectRatio || entity.ratio;
  if (explicit) return ratioOrientationV30(explicit, 'portrait');
  const source = [entity.file, entity.src, entity.image, entity.name].filter(Boolean).join(' ').toLowerCase();
  if (/horizontal|landscape|16x9|16:9|3x2|3:2/.test(source)) return 'landscape';
  if (/vertical|portrait|9x16|9:16|4x5|4:5|2x3|2:3/.test(source)) return 'portrait';
  return 'portrait';
}
`;

  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  const sectionStart = app.indexOf('function SectionCanvas(');
  const sectionEnd = app.indexOf('\nfunction ', sectionStart + 20);
  if (sectionStart < 0 || sectionEnd < 0) throw new Error('UNIVERSAL_RATIOS_V30: SectionCanvas boundaries missing');
  let sectionChunk = app.slice(sectionStart, sectionEnd);

  if (!sectionChunk.includes('className="v2-slot-wrap"')) throw new Error('UNIVERSAL_RATIOS_V30: v2 slot wrapper missing');
  sectionChunk = sectionChunk.replace(
    'className="v2-slot-wrap"',
    "className={'v2-slot-wrap slot-' + slotOrientationV30(shape)}"
  );

  const oldSizeStyle = "minHeight: shape.minHeight ? shape.minHeight + 'px' : undefined";
  if (!sectionChunk.includes(oldSizeStyle)) throw new Error('UNIVERSAL_RATIOS_V30: slot size style missing');
  sectionChunk = sectionChunk.replace(
    oldSizeStyle,
    "minHeight: undefined, aspectRatio: slotAspectRatioV30(shape), alignSelf: 'start'"
  );
  app = app.slice(0, sectionStart) + sectionChunk + app.slice(sectionEnd);

  const layoutPreviewNeedle = 'return <span key={index} style={{ gridColumn:';
  if (app.includes(layoutPreviewNeedle)) {
    app = app.replace(
      layoutPreviewNeedle,
      "return <span key={index} className={'slot-preview-' + slotOrientationV30(slot)} style={{ aspectRatio: slotAspectRatioV30(slot), gridColumn:"
    );
  }

  const typePreviewNeedle = 'return <span key={si} style={{ gridColumn:';
  if (app.includes(typePreviewNeedle)) {
    app = app.replace(
      typePreviewNeedle,
      "return <span key={si} className={'slot-preview-' + slotOrientationV30(slot)} style={{ aspectRatio: slotAspectRatioV30(slot), gridColumn:"
    );
  }

  const libraryClass = "className={'library-entity reference-merch-card ' + (selectedSlot ? 'clickable' : '')}";
  if (!app.includes(libraryClass)) throw new Error('UNIVERSAL_RATIOS_V30: reference card class missing');
  app = app.replace(
    libraryClass,
    "className={'library-entity reference-merch-card ratio-' + entityRatioOrientationV30(entity) + ' ' + (selectedSlot ? 'clickable' : '')}"
  );

  const editorClass = "className={'entity-editor-modal grouped ' + (editing ? 'editing' : 'view')}";
  if (app.includes(editorClass)) {
    app = app.replace(
      editorClass,
      "className={'entity-editor-modal grouped ratio-' + entityRatioOrientationV30(entity) + ' ' + (editing ? 'editing' : 'view')}"
    );
  }

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* universal-ratios-v30 */')) {
  css += String.raw`
/* universal-ratios-v30 */
/* One media geometry system: portrait = 2:3, landscape = 3:2. */
.slot-grid,.layout-photo-grid,.type-preview-grid{align-items:start!important}
.v2-slot-wrap{height:auto!important;min-height:0!important;overflow:hidden!important}
.v2-slot-wrap.slot-portrait{aspect-ratio:2/3!important}
.v2-slot-wrap.slot-landscape{aspect-ratio:3/2!important}
.v2-slot-wrap>.lego-slot{height:100%!important;min-height:0!important;max-height:none!important}
.v2-slot-wrap .entity-product,.v2-slot-wrap .entity-media,.v2-slot-wrap .merch-card-media{height:100%!important;min-height:0!important}
.v2-slot-wrap img,.v2-slot-wrap video{width:100%;height:100%;object-fit:cover;object-position:center;display:block}

.layout-photo-grid>span,.type-preview-grid>span{height:auto!important;min-height:0!important;align-self:start!important;overflow:hidden!important}
.layout-photo-grid>span.slot-preview-portrait,.type-preview-grid>span.slot-preview-portrait{aspect-ratio:2/3!important}
.layout-photo-grid>span.slot-preview-landscape,.type-preview-grid>span.slot-preview-landscape{aspect-ratio:3/2!important}
.layout-photo-grid>span img,.type-preview-grid>span img{width:100%!important;height:100%!important;object-fit:cover!important}

.wide-settings-panel .reference-merch-card{height:auto!important;min-height:0!important;align-self:start!important}
.wide-settings-panel .reference-merch-card.ratio-portrait{aspect-ratio:2/3!important}
.wide-settings-panel .reference-merch-card.ratio-landscape{aspect-ratio:3/2!important}
.reference-card-body{min-height:0!important}
.reference-card-body img,.reference-card-body video{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important}

.entity-editor-modal.ratio-portrait .entity-editor-preview>div:first-child{aspect-ratio:2/3!important;height:auto!important;max-height:70vh}
.entity-editor-modal.ratio-landscape .entity-editor-preview>div:first-child{aspect-ratio:3/2!important;height:auto!important;max-height:70vh}
.entity-editor-modal.ratio-portrait .entity-editor-preview img,.entity-editor-modal.ratio-portrait .entity-editor-preview video,
.entity-editor-modal.ratio-landscape .entity-editor-preview img,.entity-editor-modal.ratio-landscape .entity-editor-preview video{width:100%!important;height:100%!important;object-fit:cover!important}

.product-ratio-frame.portrait{aspect-ratio:2/3!important}
.product-ratio-frame.landscape{aspect-ratio:3/2!important}
.product-master-thumbs .product-ratio-frame,.product-master-hero .product-ratio-frame{overflow:hidden!important}

/* Old source ratios such as 16:9 or 4:5 only determine orientation; rendered geometry is always 3:2 or 2:3. */
.storefront-frame.mobile .v2-slot-wrap>.lego-slot{min-height:0!important}
@media(max-width:900px){
  .wide-settings-panel .reference-merch-card.ratio-landscape{aspect-ratio:3/2!important}
  .wide-settings-panel .reference-merch-card.ratio-portrait{aspect-ratio:2/3!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('Universal ratios v30 applied: portrait 2:3, landscape 3:2 across slots, products, looks and media');
