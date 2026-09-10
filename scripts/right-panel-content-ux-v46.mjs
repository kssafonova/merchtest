import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'RIGHT_PANEL_CONTENT_UX_V46';

if (!app.includes(MARKER)) {
  const anchor = 'const NARROW_FLOWING_SIDEBARS_V45 = true;';
  if (!app.includes(anchor)) throw new Error('RIGHT_PANEL_CONTENT_UX_V46: V45 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // Compact, readable facet selector. It keeps the upper filter zone short and shows the current value immediately.
  const facetStart = app.indexOf('function AemFacetGroupV37(');
  const facetEnd = facetStart >= 0 ? app.indexOf('function AemCommerceCatalogBrowserV37(', facetStart) : -1;
  if (facetStart < 0 || facetEnd < 0) throw new Error('RIGHT_PANEL_CONTENT_UX_V46: facet component boundaries missing');
  const facetSource = String.raw`function AemFacetGroupV37({ title, value, options = [], onChange, countFor }) {
  const active = Boolean(value && value !== 'Все');
  const selectedLabel = active ? value : 'Все';
  return <details className={'aem-facet-group-v37 facet-menu-v46 ' + (active ? 'has-value' : '')}>
    <summary>
      <span className="facet-summary-copy-v46"><strong>{title}</strong><small>{selectedLabel}</small></span>
      {active && <b>1</b>}
      <ChevronDown size={12}/>
    </summary>
    <div className="aem-facet-options-v37 facet-options-v46">
      <button className={!active ? 'active' : ''} onClick={(event) => { event.preventDefault(); onChange('Все'); }}><i/><span>Все</span><em>{countFor ? countFor('Все') : ''}</em></button>
      {options.filter((option) => option && option !== 'Все').map((option) => <button key={option} className={value === option ? 'active' : ''} onClick={(event) => { event.preventDefault(); onChange(value === option ? 'Все' : option); }}><i/><span>{option}</span><em>{countFor ? countFor(option) : ''}</em></button>)}
    </div>
  </details>;
}

`;
  app = app.slice(0, facetStart) + facetSource + app.slice(facetEnd);

  // Rebuild content cards. Media is the hero; identity, merchandising signals and drag affordance are below it.
  const gridStart = app.indexOf('<div className="library-items visual-library-grid reference-library-grid">');
  const gridEnd = gridStart >= 0 ? app.indexOf('</div>{!visibleLibrary.length', gridStart) : -1;
  if (gridStart < 0 || gridEnd < 0) throw new Error('RIGHT_PANEL_CONTENT_UX_V46: content grid boundaries missing');
  const gridSource = String.raw`<div className="library-items visual-library-grid reference-library-grid content-grid-v46">{visibleLibrary.map((entity) => {
        const isProduct = 'price' in entity;
        const isLook = entity.kind === 'look';
        const orientation = isProduct || isLook ? 'portrait' : entityRatioOrientationV30(entity);
        const stockValue = isProduct ? Number(entity.stock?.[region] ?? entity.stockValue ?? 0) : isLook ? Number(entity.stockTotal ?? entity.totalStock ?? entity.stockValue ?? 0) : null;
        const l7dValue = isProduct ? Number(entity.l7d ?? entity.l7dValue ?? 0) : null;
        const lookItems = isLook ? Number(entity.productIds?.length ?? entity.products?.length ?? entity.itemsCount ?? 0) : 0;
        const fileExt = !isProduct && !isLook ? String(entity.file || entity.url || '').split('?')[0].split('.').pop()?.toUpperCase() || '—' : '';
        const typeLabel = isProduct ? (entity.category || entity.subcategory || 'Товар') : isLook ? 'Образ' : String(entity.kind || 'Медиа').toUpperCase();
        const identity = isProduct ? (entity.sku || entity.id) : entity.id;
        const secondary = isProduct ? [entity.color, entity.collection].filter(Boolean).join(' · ') : isLook ? [entity.department, entity.collection].filter(Boolean).join(' · ') : [fileExt, orientation === 'landscape' ? '3:2' : '2:3'].filter(Boolean).join(' · ');
        const stockSignal = stockValue == null ? 'neutral' : stockValue < 8 ? 'bad' : stockValue < 20 ? 'warn' : 'good';
        const l7dSignal = l7dValue == null ? 'neutral' : l7dValue < 6 ? 'bad' : l7dValue < 12 ? 'warn' : 'good';
        return <article key={entity.id} className={'library-entity reference-merch-card content-card-v46 ratio-' + orientation + (selectedSlot ? ' clickable' : '')} draggable onClick={() => { if (selectedSlot) pinEntity(selectedSlot.sectionId, selectedSlot.slotIndex, entity.id); }} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', entity.id); }}>
          <div className="content-card-media-v46 reference-card-body">{isProduct ? <ProductCard product={entity} region={region} compact/> : <MediaCard entity={entity} compact/>}</div>
          <div className="content-card-copy-v46">
            <div className="content-card-eyebrow-v46"><span>{typeLabel}</span><em>{identity}</em></div>
            <strong className="content-card-title-v46">{entity.name || entity.nameRu || entity.title || identity}</strong>
            {secondary && <small className="content-card-secondary-v46">{secondary}</small>}
            {isProduct && <div className="content-card-price-v46">{Number(entity.price || 0).toLocaleString('ru-RU')} ₽{Number(entity.discount || 0) > 0 && <span>−{entity.discount}%</span>}</div>}
            <div className="content-card-signals-v46">
              {isProduct && <><span className={'signal-' + stockSignal}><i/>Остаток <b>{stockValue}</b></span><span className={'signal-' + l7dSignal}><i/>L7D <b>{l7dValue}</b></span></>}
              {isLook && <><span className={'signal-' + stockSignal}><i/>Остаток <b>{stockValue}</b></span><span className="signal-neutral"><i/>Товаров <b>{lookItems}</b></span></>}
              {!isProduct && !isLook && <><span className="signal-neutral"><i/>Формат <b>{fileExt}</b></span><span className="signal-neutral"><i/>Размер <b>{orientation === 'landscape' ? '3:2' : '2:3'}</b></span></>}
            </div>
            <div className="content-card-actions-v46">{selectedSlot ? <span className="content-card-add-v46"><Plus size={12}/>В слот {selectedSlot.slotIndex + 1}</span> : <span>Перетащите в слот</span>}<GripVertical size={14}/></div>
          </div>
        </article>;
      })}</div>`;
  app = app.slice(0, gridStart) + gridSource + app.slice(gridEnd + 6);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* right-panel-content-ux-v46 */')) {
  css += String.raw`
/* right-panel-content-ux-v46 */
/* FILTER AREA — compact hierarchy, not a stack of long accordions. */
.content-browser-mode-v44 .aem-browser-shell-v37{padding:0 10px 9px!important;background:#fff!important;overflow:auto!important;overscroll-behavior:contain!important}
.content-browser-mode-v44 .aem-browser-source-v37{padding:8px 0 5px!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;column-gap:8px!important;align-items:end!important}
.content-browser-mode-v44 .aem-browser-source-v37>span{grid-column:1/-1!important;font-size:6px!important;letter-spacing:.08em!important;color:#9a9a9a!important}
.content-browser-mode-v44 .aem-browser-source-v37 strong{font-size:12px!important;font-weight:500!important;line-height:1.2!important;color:#111!important}
.content-browser-mode-v44 .aem-browser-source-v37 small{font-size:7px!important;color:#8b8b8b!important;text-align:right!important}
.content-browser-mode-v44 .aem-commerce-mode-v37{height:30px!important;margin:0 0 5px!important;padding:2px!important;border:1px solid #e0e0e0!important;background:#f8f8f8!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:2px!important}
.content-browser-mode-v44 .aem-commerce-mode-v37 button{height:24px!important;justify-content:center!important;padding:0 6px!important;border:0!important;background:transparent!important;font-size:7.5px!important;color:#777!important}
.content-browser-mode-v44 .aem-commerce-mode-v37 button.active{background:#fff!important;color:#111!important;box-shadow:0 1px 3px rgba(0,0,0,.07)!important;font-weight:600!important}
.content-browser-mode-v44 .aem-search-field-v37{height:34px!important;margin:0 0 6px!important;padding:0 1px!important;border-bottom:1px solid #a8a8a8!important;gap:6px!important;color:#777!important}
.content-browser-mode-v44 .aem-search-field-v37:focus-within{border-bottom-color:#111!important}
.content-browser-mode-v44 .aem-search-field-v37 input{font-size:9px!important;line-height:1!important}
.content-browser-mode-v44 .aem-search-field-v37 svg{width:13px!important;height:13px!important}

/* Active filters are readable in one horizontal line and never push the cards down. */
.content-browser-mode-v44 .aem-active-filters-v37{display:flex!important;flex-wrap:nowrap!important;gap:4px!important;margin:0 0 5px!important;padding-bottom:1px!important;overflow-x:auto!important;scrollbar-width:none!important}
.content-browser-mode-v44 .aem-active-filters-v37::-webkit-scrollbar{display:none!important}
.content-browser-mode-v44 .aem-active-filters-v37:empty{display:none!important}
.content-browser-mode-v44 .aem-active-filters-v37 button{flex:0 0 auto!important;height:22px!important;padding:0 6px!important;border:1px solid #d8d8d8!important;background:#fafafa!important;color:#333!important;font-size:6.8px!important;white-space:nowrap!important}
.content-browser-mode-v44 .aem-active-filters-v37 button:hover{border-color:#111!important;background:#fff!important}

/* Facets become compact selector cells. */
.content-browser-mode-v44 .aem-facets-v37{position:relative!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;border:0!important;padding:0!important;overflow:visible!important}
.content-browser-mode-v44 .aem-facets-title-v37{grid-column:1/-1!important;height:22px!important;border:0!important;padding:0!important}
.content-browser-mode-v44 .aem-facets-title-v37 span{font-size:6.5px!important;letter-spacing:.08em!important;color:#888!important}
.content-browser-mode-v44 .aem-facets-title-v37 button{font-size:6.5px!important;text-decoration:none!important;color:#666!important;border-bottom:1px solid #aaa!important;padding:0!important}
.content-browser-mode-v44 .facet-menu-v46{position:relative!important;border:0!important;min-width:0!important;overflow:visible!important}
.content-browser-mode-v44 .facet-menu-v46>summary{height:34px!important;min-width:0!important;padding:4px 7px!important;border:1px solid #dedede!important;background:#fff!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto auto!important;align-items:center!important;gap:5px!important;list-style:none!important}
.content-browser-mode-v44 .facet-menu-v46>summary:hover{border-color:#aaa!important;background:#fcfcfc!important}
.content-browser-mode-v44 .facet-menu-v46.has-value>summary{border-color:#111!important}
.content-browser-mode-v44 .facet-summary-copy-v46{display:grid!important;min-width:0!important;gap:0!important}
.content-browser-mode-v44 .facet-summary-copy-v46 strong{font-size:6.5px!important;font-weight:500!important;letter-spacing:.04em!important;text-transform:uppercase!important;color:#858585!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.content-browser-mode-v44 .facet-summary-copy-v46 small{font-size:7.7px!important;line-height:1.2!important;color:#111!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.content-browser-mode-v44 .facet-menu-v46>summary>b{width:15px!important;height:15px!important;min-width:15px!important;border:0!important;border-radius:50%!important;background:#111!important;color:#fff!important;font-size:6px!important;display:grid!important;place-items:center!important}
.content-browser-mode-v44 .facet-menu-v46[open]>summary{border-color:#111!important;background:#fafafa!important}
.content-browser-mode-v44 .facet-menu-v46[open]>summary svg{transform:rotate(180deg)!important}
.content-browser-mode-v44 .facet-options-v46{grid-column:1/-1!important;max-height:118px!important;margin-top:3px!important;padding:3px!important;border:1px solid #d9d9d9!important;background:#fff!important;box-shadow:0 6px 16px rgba(0,0,0,.07)!important;overflow:auto!important;display:grid!important;z-index:20!important}
.content-browser-mode-v44 .facet-options-v46 button{min-height:24px!important;padding:2px 5px!important;grid-template-columns:12px minmax(0,1fr) auto!important;gap:5px!important;font-size:7px!important;background:#fff!important}
.content-browser-mode-v44 .facet-options-v46 button:hover{background:#f7f7f7!important}
.content-browser-mode-v44 .facet-options-v46 button i{width:9px!important;height:9px!important}
.content-browser-mode-v44 .facet-options-v46 button em{font-size:6.5px!important;color:#999!important}

/* Quick commercial states: two-column, instantly scannable, traffic-light only as a dot. */
.content-browser-mode-v44 .aem-commerce-status-v37{grid-column:1/-1!important;padding:5px 0 0!important}
.content-browser-mode-v44 .aem-commerce-status-v37>span{margin:0 0 4px!important;font-size:6.5px!important;letter-spacing:.07em!important;color:#888!important}
.content-browser-mode-v44 .aem-commerce-status-v37>div{display:grid!important;grid-template-columns:1fr 1fr!important;gap:4px!important}
.content-browser-mode-v44 .aem-commerce-status-v37 button{height:25px!important;min-width:0!important;padding:0 6px!important;border:1px solid #dedede!important;background:#fff!important;color:#555!important;font-size:6.8px!important;justify-content:flex-start!important;white-space:nowrap!important;overflow:hidden!important}
.content-browser-mode-v44 .aem-commerce-status-v37 button.active{border-color:#111!important;background:#fafafa!important;color:#111!important}
.content-browser-mode-v44 .aem-commerce-status-v37 button em{margin-left:auto!important;font-size:6.2px!important;color:#999!important}
.content-browser-mode-v44 .aem-browser-resultbar-v37{min-height:24px!important;padding:5px 0 0!important;border-top:0!important}
.content-browser-mode-v44 .aem-browser-resultbar-v37 span{font-size:6px!important;color:#999!important}.content-browser-mode-v44 .aem-browser-resultbar-v37 strong{font-size:7px!important;color:#333!important}
.content-browser-mode-v44 .aem-asset-upload-v37{min-height:30px!important;margin-top:5px!important;padding:5px 7px!important;border:1px dashed #c9c9c9!important}.content-browser-mode-v44 .aem-asset-upload-v37 strong{font-size:7.5px!important}.content-browser-mode-v44 .aem-asset-upload-v37 small{font-size:6.3px!important}

/* Catalog browse: compact list, no giant nested columns. */
.content-browser-mode-v44 .aem-commerce-catalog-v37{border-top:0!important}.content-browser-mode-v44 .aem-catalog-path-v37{min-height:27px!important;font-size:7px!important}.content-browser-mode-v44 .aem-catalog-columns-v37{max-height:145px!important}.content-browser-mode-v44 .aem-catalog-columns-v37 section{padding:5px 0!important}.content-browser-mode-v44 .aem-catalog-columns-v37 section>span{padding:0 5px 3px!important;font-size:6px!important}.content-browser-mode-v44 .aem-catalog-columns-v37 section>button{min-height:25px!important;padding:2px 5px!important;font-size:7px!important}

/* CONTENT AREA — merchandising cards, not admin tiles. */
.content-browser-mode-v44 .simple-library-scroll,.content-browser-mode-v44 .content-library-scroll{padding:11px 10px 18px!important;background:#fff!important}
.content-grid-v46{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-content:start!important;gap:18px 9px!important;padding:0!important}
.content-card-v46{position:relative!important;display:flex!important;flex-direction:column!important;min-width:0!important;height:auto!important;min-height:0!important;margin:0!important;border:0!important;border-radius:0!important;background:#fff!important;box-shadow:none!important;overflow:visible!important;cursor:grab!important;transition:box-shadow .16s ease,transform .16s ease!important}
.content-card-v46:active{cursor:grabbing!important}.content-card-v46:hover{box-shadow:0 5px 16px rgba(0,0,0,.07)!important;transform:translateY(-1px)!important;z-index:2!important}
.content-card-v46.clickable{cursor:pointer!important}.content-card-v46.clickable:hover{box-shadow:0 0 0 1px #111,0 5px 16px rgba(0,0,0,.06)!important}
.content-card-media-v46{position:relative!important;width:100%!important;height:auto!important;overflow:hidden!important;background:#f5f5f3!important;border:0!important}
.content-card-v46.ratio-portrait .content-card-media-v46{aspect-ratio:2/3!important}.content-card-v46.ratio-landscape .content-card-media-v46{aspect-ratio:3/2!important}
.content-card-media-v46>.entity-product,.content-card-media-v46>.entity-media{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;border:0!important;background:transparent!important}
.content-card-media-v46 .merch-card-media{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;background:#f5f5f3!important;overflow:hidden!important}
.content-card-media-v46 .merch-card-media img,.content-card-media-v46 .merch-card-media video{width:100%!important;height:100%!important;display:block!important;object-position:center!important;transition:transform .18s ease!important}
.content-card-media-v46 .entity-product .merch-card-media img{object-fit:contain!important}.content-card-media-v46 .entity-media .merch-card-media img,.content-card-media-v46 .entity-media .merch-card-media video{object-fit:cover!important}.content-card-v46:hover .content-card-media-v46 .merch-card-media img{transform:scale(1.018)!important}
.content-card-media-v46 .store-card-caption,.content-card-media-v46 .commerce-badges,.content-card-media-v46 .media-index,.content-card-media-v46 .look-preview-cta{display:none!important}
.content-card-media-v46 .entity-details-trigger{top:7px!important;right:7px!important;width:27px!important;height:27px!important;border:1px solid rgba(0,0,0,.12)!important;border-radius:50%!important;background:rgba(255,255,255,.94)!important;color:#111!important;box-shadow:none!important;opacity:0!important;transition:opacity .14s ease!important}.content-card-v46:hover .entity-details-trigger{opacity:1!important}
.content-card-v46.clickable:after{display:none!important}

.content-card-copy-v46{display:grid!important;gap:3px!important;padding:7px 1px 0!important;background:#fff!important;min-width:0!important}
.content-card-eyebrow-v46{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;min-width:0!important}.content-card-eyebrow-v46 span,.content-card-eyebrow-v46 em{font-size:5.8px!important;line-height:1.2!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#8a8a8a!important;font-style:normal!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.content-card-eyebrow-v46 em{max-width:50%!important;text-align:right!important}
.content-card-title-v46{font-size:8.3px!important;line-height:1.25!important;font-weight:500!important;color:#111!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;min-height:20px!important}
.content-card-secondary-v46{font-size:6.5px!important;line-height:1.25!important;color:#8b8b8b!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.content-card-price-v46{display:flex!important;align-items:baseline!important;gap:5px!important;margin-top:1px!important;font-size:8px!important;font-weight:600!important;color:#111!important}.content-card-price-v46 span{font-size:6px!important;font-weight:500!important;color:#777!important}
.content-card-signals-v46{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:4px 7px!important;margin-top:3px!important;padding-top:5px!important;border-top:1px solid #ededed!important}.content-card-signals-v46>span{display:flex!important;align-items:center!important;gap:3px!important;min-width:0!important;font-size:6px!important;color:#777!important;white-space:nowrap!important}.content-card-signals-v46>span i{width:5px!important;height:5px!important;border-radius:50%!important;background:#909090!important;flex:none!important}.content-card-signals-v46>span.signal-good i{background:#2e7d32!important}.content-card-signals-v46>span.signal-warn i{background:#c9a227!important}.content-card-signals-v46>span.signal-bad i{background:#c0392b!important}.content-card-signals-v46>span b{font-size:6.5px!important;font-weight:600!important;color:#111!important}
.content-card-actions-v46{min-height:24px;margin-top:2px;border-top:1px solid #ededed;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;color:#8c8c8c!important;font-size:6px!important}.content-card-actions-v46 svg{flex:none!important}.content-card-add-v46{display:flex!important;align-items:center!important;gap:3px!important;color:#111!important;font-weight:500!important}

/* Legacy card chrome is gone inside V46 cards. */
.content-card-v46>.reference-card-id,.content-card-v46>.reference-commerce-stack,.content-card-v46>.reference-card-footer,.content-card-v46>.reference-position-rail{display:none!important}

/* Narrow panels: retain two useful cards per row, one only when genuinely too narrow. */
@media (max-width:1239px) and (min-width:1024px){.content-grid-v46{gap:15px 8px!important}.content-card-title-v46{font-size:7.7px!important}}
@media (max-width:767.98px){.content-browser-mode-v44 .aem-facets-v37{grid-template-columns:repeat(2,minmax(0,1fr))!important}.content-grid-v46{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px 10px!important}}
@media (max-width:390px){.content-grid-v46{grid-template-columns:1fr!important}.content-card-title-v46{font-size:9px!important}.content-card-eyebrow-v46 span,.content-card-eyebrow-v46 em{font-size:6.2px!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('Right panel content UX v46 applied: compact filter selectors, visible active state, merchandising-first cards');
