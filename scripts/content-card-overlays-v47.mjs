import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'CONTENT_CARD_OVERLAYS_V47';

if (!app.includes(MARKER)) {
  const anchor = 'const RIGHT_PANEL_CONTENT_UX_V46 = true;';
  if (!app.includes(anchor)) throw new Error('CONTENT_CARD_OVERLAYS_V47: V46 marker missing');

  const helpers = String.raw`
function ContentMetricOverlayV47({ entity, region, slot = false }) {
  if (!entity) return null;
  const isProduct = 'price' in entity;
  const isLook = entity.kind === 'look';
  const orientation = isProduct || isLook ? 'portrait' : entityRatioOrientationV30(entity);
  const stockValue = isProduct
    ? Number(entity.stock?.[region] ?? entity.stockValue ?? 0)
    : isLook
      ? Number(entity.stockTotal ?? entity.totalStock ?? entity.stockValue ?? 0)
      : null;
  const l7dValue = isProduct ? Number(entity.l7d ?? entity.l7dValue ?? 0) : null;
  const lookItems = isLook ? Number(entity.productIds?.length ?? entity.products?.length ?? entity.itemsCount ?? entity.productCount ?? 0) : null;
  const fileExt = !isProduct && !isLook ? String(entity.file || entity.url || entity.src || '').split('?')[0].split('.').pop()?.toUpperCase() || String(entity.kind || 'MEDIA').toUpperCase() : '';
  const stockSignal = stockValue == null ? 'neutral' : stockValue < 8 ? 'bad' : stockValue < 20 ? 'warn' : 'good';
  const l7dSignal = l7dValue == null ? 'neutral' : l7dValue < 6 ? 'bad' : l7dValue < 12 ? 'warn' : 'good';
  return <div className={'content-metric-overlay-v47 ' + (slot ? 'slot-overlay-v47' : 'library-overlay-v47')}>
    {isProduct && <><span className={'signal-' + stockSignal}><i/><em>Остаток</em><b>{stockValue}</b></span><span className={'signal-' + l7dSignal}><i/><em>L7D</em><b>{l7dValue}</b></span></>}
    {isLook && <><span className={'signal-' + stockSignal}><i/><em>Остаток</em><b>{stockValue}</b></span><span className="signal-neutral"><i/><em>Товаров</em><b>{lookItems}</b></span></>}
    {!isProduct && !isLook && <><span className="signal-neutral"><i/><em>Формат</em><b>{fileExt}</b></span><span className="signal-neutral"><i/><em>Ориентация</em><b>{orientation === 'landscape' ? '3:2' : '2:3'}</b></span></>}
  </div>;
}

`;
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  // The details affordance is an edit action visually, not a passive view action.
  app = app.replace(/(<button className="entity-details-trigger"[^<]*?)<Eye([^>]*)\/>/g, '$1<Pencil$2/>');
  app = app.replaceAll('title="Полная информация"', 'title="Редактировать"');

  // Rebuild the right-panel card: media + overlay, then only identity and title below.
  const gridStart = app.indexOf('<div className="library-items visual-library-grid reference-library-grid content-grid-v46">');
  const gridEnd = gridStart >= 0 ? app.indexOf('</div>{!visibleLibrary.length', gridStart) : -1;
  if (gridStart < 0 || gridEnd < 0) throw new Error('CONTENT_CARD_OVERLAYS_V47: V46 content grid boundaries missing');
  const gridSource = String.raw`<div className="library-items visual-library-grid reference-library-grid content-grid-v46 content-grid-v47">{visibleLibrary.map((entity) => {
        const isProduct = 'price' in entity;
        const isLook = entity.kind === 'look';
        const orientation = isProduct || isLook ? 'portrait' : entityRatioOrientationV30(entity);
        const identity = isProduct ? (entity.sku || entity.id) : entity.id;
        return <article key={entity.id} className={'library-entity reference-merch-card content-card-v46 content-card-v47 ratio-' + orientation + (selectedSlot ? ' clickable' : '')} draggable onClick={() => { if (selectedSlot) pinEntity(selectedSlot.sectionId, selectedSlot.slotIndex, entity.id); }} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', entity.id); }}>
          <div className="content-card-media-v46 content-card-media-v47 reference-card-body">
            {isProduct ? <ProductCard product={entity} region={region} compact/> : <MediaCard entity={entity} compact/>}
            <ContentMetricOverlayV47 entity={entity} region={region}/>
          </div>
          <div className="content-card-copy-v47">
            <span>{identity}</span>
            <strong>{entity.name || entity.nameRu || entity.title || identity}</strong>
          </div>
        </article>;
      })}</div>`;
  app = app.slice(0, gridStart) + gridSource + app.slice(gridEnd + 6);

  // Add the exact same operational overlay to content already placed in a storefront slot.
  const slotStart = app.indexOf('function Slot(');
  const slotEnd = slotStart >= 0 ? app.indexOf('function SectionCanvas(', slotStart) : -1;
  if (slotStart < 0 || slotEnd < 0) throw new Error('CONTENT_CARD_OVERLAYS_V47: Slot boundaries missing');
  let slotChunk = app.slice(slotStart, slotEnd);
  const entityRender = /\{'price' in slot\.entity \? <ProductCard product=\{slot\.entity\} region=\{region\}\/> : <MediaCard entity=\{slot\.entity\}\/>\}/;
  if (!entityRender.test(slotChunk)) throw new Error('CONTENT_CARD_OVERLAYS_V47: Slot entity renderer missing');
  slotChunk = slotChunk.replace(entityRender, (match) => match + '<ContentMetricOverlayV47 entity={slot.entity} region={region} slot/>');
  app = app.slice(0, slotStart) + slotChunk + app.slice(slotEnd);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* content-card-overlays-v47 */')) {
  css += String.raw`
/* content-card-overlays-v47 */
/* Media is the card. Operational merchandising data sits on top of it, bottom-right. */
.content-card-v47{position:relative!important;display:flex!important;flex-direction:column!important;border:0!important;background:#fff!important;box-shadow:none!important;overflow:visible!important}
.content-card-media-v47{position:relative!important;width:100%!important;overflow:hidden!important;background:#f7f7f5!important}
.content-card-v47.ratio-portrait .content-card-media-v47{aspect-ratio:2/3!important}
.content-card-v47.ratio-landscape .content-card-media-v47{aspect-ratio:3/2!important}
.content-card-media-v47>.entity-product,.content-card-media-v47>.entity-media{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}

.content-metric-overlay-v47{position:absolute;right:7px;bottom:7px;z-index:24;display:grid;gap:3px;pointer-events:none}
.content-metric-overlay-v47>span{min-width:74px;height:21px;padding:0 6px;display:grid;grid-template-columns:5px minmax(0,1fr) auto;align-items:center;gap:5px;background:rgba(255,255,255,.92);border:1px solid rgba(17,17,17,.12);backdrop-filter:blur(8px);color:#111;line-height:1}
.content-metric-overlay-v47>span i{width:5px;height:5px;border-radius:50%;background:#8b8b8b}.content-metric-overlay-v47>span.signal-good i{background:#2e7d32}.content-metric-overlay-v47>span.signal-warn i{background:#c9a227}.content-metric-overlay-v47>span.signal-bad i{background:#c0392b}
.content-metric-overlay-v47 em{font-style:normal;font-size:6px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;color:#6f6f6f;white-space:nowrap}.content-metric-overlay-v47 b{font-size:8px;font-weight:600;color:#111;white-space:nowrap}

/* Only two quiet lines remain below cards in the right browser. */
.content-card-copy-v47{min-width:0;padding:7px 0 1px;display:grid;gap:2px;background:#fff}
.content-card-copy-v47>span{font-size:6.5px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:#8a8a8a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.content-card-copy-v47>strong{font-size:8.5px;font-weight:500;line-height:1.25;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.content-card-v47:hover .content-card-copy-v47>strong{text-decoration:underline;text-underline-offset:2px}

/* V46 data below the image is no longer part of V47 cards. */
.content-card-v47 .content-card-copy-v46,.content-card-v47 .content-card-signals-v46,.content-card-v47 .content-card-actions-v46,.content-card-v47 .content-card-price-v46,.content-card-v47 .content-card-secondary-v46,.content-card-v47 .content-card-eyebrow-v46{display:none!important}

/* Edit, not view. Keep the action subtle and only expose it on intent. */
.content-card-v47 .entity-details-trigger{top:7px!important;right:7px!important;width:28px!important;height:28px!important;border:1px solid rgba(17,17,17,.14)!important;background:rgba(255,255,255,.92)!important;color:#111!important;border-radius:0!important;opacity:0!important;transition:opacity .12s ease,background .12s ease!important}
.content-card-v47:hover .entity-details-trigger,.content-card-v47:focus-within .entity-details-trigger{opacity:1!important}.content-card-v47 .entity-details-trigger:hover{background:#111!important;color:#fff!important}
.content-card-v47 .entity-details-trigger svg{width:13px!important;height:13px!important}

/* CONTENT INSIDE STOREFRONT SLOT: remove admin/card captions. Only media + V47 overlay remain. */
.lego-slot.filled{position:relative!important;overflow:hidden!important}
.lego-slot.filled>.entity-product,.lego-slot.filled>.entity-media{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
.lego-slot.filled .merch-card-media{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
.lego-slot.filled .merch-card-media>img,.lego-slot.filled .merch-card-media>video{width:100%!important;height:100%!important;object-fit:cover!important}
.lego-slot.filled .store-card-caption,
.lego-slot.filled .commerce-badges,
.lego-slot.filled .media-index,
.lego-slot.filled .slot-head,
.lego-slot.filled .slot-warning,
.lego-slot.filled .slot-fit-control,
.lego-slot.filled .look-preview-cta{display:none!important}
.lego-slot.filled>.content-metric-overlay-v47{right:8px!important;bottom:8px!important;z-index:35!important}

/* Slot edit/remove controls are icon-only, never metadata labels. */
.lego-slot.filled .entity-details-trigger{position:absolute!important;top:8px!important;right:8px!important;z-index:36!important;width:28px!important;height:28px!important;border:1px solid rgba(17,17,17,.14)!important;border-radius:0!important;background:rgba(255,255,255,.9)!important;color:#111!important;display:grid!important;place-items:center!important;opacity:0!important;transition:opacity .12s ease!important}
.lego-slot.filled:hover .entity-details-trigger,.lego-slot.filled.selected-content-slot .entity-details-trigger{opacity:1!important}
.lego-slot.filled .slot-remove{top:8px!important;left:8px!important;right:auto!important;width:28px!important;height:28px!important;border:1px solid rgba(17,17,17,.14)!important;border-radius:0!important;background:rgba(255,255,255,.9)!important;color:#111!important;z-index:36!important;opacity:0!important}
.lego-slot.filled:hover .slot-remove,.lego-slot.filled.selected-content-slot .slot-remove{opacity:1!important}

/* Right panel keeps a clean two-column browser while cards stay large enough to read. */
.content-browser-mode-v44 .content-grid-v47{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:15px 10px!important}
@media(max-width:1239px){.content-browser-mode-v44 .content-grid-v47{gap:13px 8px!important}}
@media(max-width:420px){.content-browser-mode-v44 .content-grid-v47{grid-template-columns:1fr!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('Content card overlays v47 applied: operational metrics on media, minimal card footer, edit affordance, clean slot rendering');
