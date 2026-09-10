import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'RESPONSIVE_LAYOUT_PREVIEWS_V34';

if (!app.includes(MARKER)) {
  const anchor = 'const FASHION_GRADE_UI_V33 = true;';
  if (!app.includes(anchor)) throw new Error('RESPONSIVE_LAYOUT_PREVIEWS_V34: V33 marker missing');

  const helpers = String.raw`
function layoutContainersForDeviceV34(type, viewport = 'desktop') {
  const desktop = Array.isArray(type?.containers) ? type.containers : [];
  if (viewport !== 'mobile') return desktop;
  if (Array.isArray(type?.mobileContainers) && type.mobileContainers.length) return type.mobileContainers;

  // Legacy/system types without an explicit mobile breakpoint get a deterministic 4-column fallback.
  let globalIndex = 0;
  return desktop.map((container) => {
    const source = Array.isArray(container?.slots) ? container.slots : [];
    const slots = source.map((slot, index) => {
      const slotIndex = slot?.slotIndex != null ? slot.slotIndex : globalIndex++;
      const count = source.length;
      if (count === 1) return { ...slot, slotIndex, start: 1, span: 4, rowStart: 1, rows: 1 };
      if (count === 2) return { ...slot, slotIndex, start: index === 0 ? 1 : 3, span: 2, rowStart: 1, rows: 1 };
      if (count === 3) {
        if (index < 2) return { ...slot, slotIndex, start: index === 0 ? 1 : 3, span: 2, rowStart: 1, rows: 1 };
        return { ...slot, slotIndex, start: 1, span: 4, rowStart: 2, rows: 1 };
      }
      const row = Math.floor(index / 2) + 1;
      return { ...slot, slotIndex, start: index % 2 === 0 ? 1 : 3, span: 2, rowStart: row, rows: 1 };
    });
    return {
      ...container,
      cols: 4,
      rows: Math.max(1, Math.ceil(source.length / 2)),
      columnGap: 12,
      rowGap: 12,
      container: { ...(container?.container || {}), mode: 'full', width: '100%', maxWidth: null, align: 'center', marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 },
      slots,
    };
  });
}

function DualDeviceLayoutPreviewV34({ type, compact = false }) {
  return <div className={'dual-layout-preview-v34 ' + (compact ? 'compact' : '')}>
    <div className="dual-layout-device desktop">
      <span className="dual-layout-label"><Monitor size={compact ? 10 : 12}/>DESKTOP</span>
      <LayoutPhotoPreview type={type} viewport="desktop"/>
    </div>
    <div className="dual-layout-device mobile">
      <span className="dual-layout-label"><Smartphone size={compact ? 10 : 12}/>MOBILE</span>
      <LayoutPhotoPreview type={type} viewport="mobile"/>
    </div>
  </div>;
}
`;

  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  // Use one resolver everywhere: preview and real canvas must read identical responsive geometry.
  app = app.replace(/const containers = viewport === 'mobile' && type\?*\.mobileContainers\?\.length \? type\?*\.mobileContainers : type\?*\.containers \|\| \[\];/g, "const containers = layoutContainersForDeviceV34(type, viewport);");
  app = app.replace(/const containers = viewport === 'mobile' && type\.mobileContainers\?\.length \? type\.mobileContainers : type\.containers;/g, "const containers = layoutContainersForDeviceV34(type, viewport);");
  app = app.replace(/const containers = device === 'mobile' && section\.template\.mobileContainers\?\.length \? section\.template\.mobileContainers : section\.template\.containers;/g, "const containers = layoutContainersForDeviceV34(section.template, device);");

  // Row-spanning editorial cells must stretch across the tracks; their neighbours define exact row height.
  app = app.replaceAll(
    "className={'v2-slot-wrap slot-' + slotOrientationV30(shape)}",
    "className={'v2-slot-wrap slot-' + slotOrientationV30(shape) + (Number(shape?.rows || 1) > 1 ? ' slot-rowspan' : '')}"
  );
  app = app.replaceAll(
    "className={'slot-preview-' + slotOrientationV30(slot)}",
    "className={'slot-preview-' + slotOrientationV30(slot) + (Number(slot?.rows || 1) > 1 ? ' slot-preview-rowspan' : '')}"
  );

  // Every layout card shows both breakpoints, not only the currently selected device.
  app = app.replaceAll('<LayoutPhotoPreview type={type} viewport={device}/>', '<DualDeviceLayoutPreviewV34 type={type} compact/>');

  const addModalStart = app.indexOf('function AddTypeModal(');
  const addModalEnd = addModalStart >= 0 ? app.indexOf('\nfunction ', addModalStart + 20) : -1;
  if (addModalStart >= 0 && addModalEnd > addModalStart) {
    let chunk = app.slice(addModalStart, addModalEnd);
    chunk = chunk.replaceAll('<TypePreview type={type} compact/>', "{type.layoutV2 ? <DualDeviceLayoutPreviewV34 type={type} compact/> : <TypePreview type={type} compact/>}");
    const selectedPair = '{selectedType.layoutV2 ? <div className="responsive-type-previews"><div><span>DESKTOP</span><TypePreview type={selectedType}/></div><div><span>MOBILE</span><TypePreview type={selectedType} viewport="mobile"/></div></div> : <TypePreview type={selectedType}/>}';
    if (chunk.includes(selectedPair)) chunk = chunk.replace(selectedPair, '{selectedType.layoutV2 ? <DualDeviceLayoutPreviewV34 type={selectedType}/> : <TypePreview type={selectedType}/>}');
    app = app.slice(0, addModalStart) + chunk + app.slice(addModalEnd);
  }

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* responsive-layout-previews-v34 */')) {
  css += String.raw`
/* responsive-layout-previews-v34 */
/* Same geometry renderer for layout library and storefront canvas. */
.dual-layout-preview-v34{display:grid;grid-template-columns:minmax(0,1fr) 72px;gap:12px;align-items:start;width:100%;min-width:0}
.dual-layout-preview-v34.compact{grid-template-columns:minmax(0,1fr) 58px;gap:8px}
.dual-layout-device{min-width:0;display:grid;gap:6px;align-content:start}
.dual-layout-label{display:flex;align-items:center;gap:4px;color:#777;font-size:7px;font-weight:500;letter-spacing:.08em;line-height:1;text-transform:uppercase}
.dual-layout-device .layout-photo-preview{width:100%!important;height:auto!important;min-height:0!important;margin:0!important;background:#fff!important}
.dual-layout-device .layout-photo-container{width:100%;min-width:0}
.dual-layout-device.mobile .layout-photo-preview{border-left:1px solid #e5e5e5;padding-left:8px}
.dual-layout-preview-v34.compact .dual-layout-device.mobile .layout-photo-preview{padding-left:6px}

/* Exact grid behaviour: non-spanning slots establish track height; big editorial cells stretch across rows. */
.slot-grid,.layout-photo-grid,.type-preview-grid{grid-auto-flow:row!important;align-items:start!important;min-width:0!important}
.v2-slot-wrap{min-width:0!important;max-width:100%!important}
.v2-slot-wrap.slot-rowspan{aspect-ratio:auto!important;height:100%!important;min-height:0!important;align-self:stretch!important}
.v2-slot-wrap.slot-rowspan>.lego-slot{height:100%!important;min-height:100%!important}
.layout-photo-grid>span.slot-preview-rowspan,.type-preview-grid>span.slot-preview-rowspan{aspect-ratio:auto!important;height:100%!important;min-height:0!important;align-self:stretch!important}
.layout-photo-grid>span,.type-preview-grid>span{min-width:0!important;max-width:100%!important}

/* Layout picker: each option exposes desktop + mobile composition at a glance. */
.section-inline-layout-preview{height:auto!important;min-height:104px!important;padding:10px!important;background:#fff!important;border-bottom:1px solid #eee!important;display:block!important}
.section-inline-layout-card{padding:0!important;overflow:hidden!important;background:#fff!important}
.section-inline-layout-card>span{padding:9px 10px 10px!important;margin:0!important}
.section-inline-layout-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:24px!important;padding:18px!important}
.section-inline-layout-library{border-radius:0!important;border:1px solid #e5e5e5!important;box-shadow:0 12px 30px rgba(0,0,0,.08)!important}

.type-card .dual-layout-preview-v34{margin:10px 0 8px}
.type-card .dual-layout-device .layout-photo-preview{min-height:0!important}
.type-policy-panel .dual-layout-preview-v34{margin:12px 0 18px}

/* Existing settings preview must never hide the mobile breakpoint. */
.responsive-type-previews,.settings-layout-previews{display:grid!important;grid-template-columns:minmax(0,1fr) 110px!important;gap:14px!important;align-items:start!important}
.responsive-type-previews>div,.settings-layout-previews>div{display:grid!important;gap:5px!important;min-width:0!important}
.responsive-type-previews>div:last-child,.settings-layout-previews>div:last-child{display:grid!important}
.responsive-type-previews>div>span,.settings-layout-previews>div>span{font-size:7px!important;font-weight:500!important;letter-spacing:.08em!important;color:#777!important}

/* Device switch changes real section geometry, not merely the frame width. */
.storefront-frame.mobile .builder-section.layout-v2 .section-container{width:100%!important;max-width:100%!important;box-sizing:border-box!important}
.storefront-frame.mobile .builder-section.layout-v2 .slot-grid{width:100%!important;max-width:100%!important}
.storefront-frame.mobile .v2-slot-wrap{min-width:0!important;max-width:100%!important}
.storefront-frame.desktop .builder-section.layout-v2 .slot-grid{width:100%!important}

@media(max-width:1240px){
  .section-inline-layout-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important}
  .dual-layout-preview-v34{grid-template-columns:minmax(0,1fr) 64px}
}
@media(max-width:900px){
  .section-inline-layout-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;padding:14px!important}
  .responsive-type-previews,.settings-layout-previews{grid-template-columns:minmax(0,1fr) 92px!important}
}
@media(max-width:520px){
  .section-inline-layout-grid{grid-template-columns:1fr!important}
  .dual-layout-preview-v34,.dual-layout-preview-v34.compact{grid-template-columns:minmax(0,1fr) 64px!important}
  .responsive-type-previews,.settings-layout-previews{grid-template-columns:minmax(0,1fr) 78px!important;gap:10px!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('Responsive layout previews v34 applied: desktop/mobile previews share the same geometry resolver as canvas');
