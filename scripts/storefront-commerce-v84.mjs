import { readFileSync, writeFileSync } from 'node:fs';

/**
 * V84 — the canvas has to look like a storefront that sells, and the preview has to look like the
 * live site.
 *
 *   1. Product slots showed a bare image wall: no name, no price, no discount. A PLP without a price
 *      cannot be judged commercially, so the product card now carries a real caption (name, final
 *      price, struck original price, discount badge).
 *   2. The coverage / reserve / PIN / conflicts strip was repeated above every single section, which
 *      buried the storefront under authoring telemetry. It now appears on the selected section only;
 *      the page-level numbers already live in the toolbar and in the publish check.
 *   3. Preview mode still showed authoring chrome (metrics strip, slot labels, section headers, insert
 *      rails) and kept both side panels docked. Preview is now a clean, centred storefront.
 */

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const MARKER = 'STOREFRONT_COMMERCE_V84';

let app = readFileSync(appPath, 'utf8');
if (app.includes(MARKER)) {
  console.log('V84 already applied');
} else {
  const anchor = 'const SALES_MERCH_V83 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V83 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // ---------------------------------------------------------------------------------------------
  // 1. Commerce caption: price is the one fact a storefront may never hide.
  // ---------------------------------------------------------------------------------------------
  const priceFrom = '<b>{money(product.price)}</b>{product.discount > 0 && <em>-{product.discount}%</em>}';
  if (!app.includes(priceFrom)) throw new Error(MARKER + ': product price markup missing');
  app = app.replace(
    priceFrom,
    '<b className={product.discount > 0 ? "price-sale-v84" : ""}>{money(finalPriceV84(product))}{product.discount > 0 && <s>{money(product.price)}</s>}</b>{product.discount > 0 && <em>-{product.discount}%</em>}',
  );

  const moneyAnchor = "const money = (value) => ";
  if (!app.includes(moneyAnchor)) throw new Error(MARKER + ': money helper missing');
  app = app.replace(
    moneyAnchor,
    'const finalPriceV84 = (product) => Math.round(Number(product?.price || 0) * (100 - Number(product?.discount || 0)) / 100);\n' + moneyAnchor,
  );

  // ---------------------------------------------------------------------------------------------
  // 2. Section telemetry follows the selection instead of repeating on every section.
  // ---------------------------------------------------------------------------------------------
  const statusFrom = '<SectionCanvasStatus section={section}/>';
  if (!app.includes(statusFrom)) throw new Error(MARKER + ': SectionCanvasStatus usage missing');
  app = app.replace(statusFrom, '{editable !== false && selected && <SectionCanvasStatus section={section}/>}');

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* storefront-commerce-v84 */')) {
  css += String.raw`
/* storefront-commerce-v84 */
/* Product slots become real commerce cards: media fills the remaining height, caption is pinned under it. */
.lego-slot.filled .merch-product-card{position:relative!important;display:flex!important;flex-direction:column!important;width:100%!important;height:100%!important;background:transparent!important}
.lego-slot.filled .merch-product-card .merch-card-media{position:relative!important;inset:auto!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;height:auto!important;overflow:hidden!important}
.lego-slot.filled .merch-product-card .merch-card-media>img,.lego-slot.filled .merch-product-card .merch-card-media>.product-ratio-frame,.lego-slot.filled .merch-product-card .merch-card-media>span{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important}
/* The caption is a fixed 52px band so every card in a row ends on the same baseline and the
   authoring overlays have a deterministic area to avoid. */
.lego-slot.filled .merch-product-card>.store-card-caption{display:grid!important;flex:0 0 auto!important;position:relative!important;grid-auto-rows:min-content;align-content:start;gap:3px!important;height:52px!important;min-height:52px!important;padding:9px 2px 4px!important;background:transparent!important;text-align:left!important;overflow:hidden!important}
.lego-slot.filled .merch-product-card>.store-card-caption>span{display:none!important}
.lego-slot.filled .merch-product-card>.store-card-caption>strong{font-size:10px!important;line-height:1.25!important;letter-spacing:.02em!important;color:#17181d!important;text-transform:none!important;display:-webkit-box!important;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
/* Colour name and colour swatch stay off the card: the model's colour SKUs are shown as separate
   products, identified by SKU. */
.lego-slot.filled .merch-product-card>.store-card-caption>.product-color-meta{display:none!important}
.lego-slot.filled .merch-product-card>.store-card-caption>b{display:flex!important;align-items:baseline!important;gap:6px!important;font-size:11px!important;font-weight:600!important;color:#17181d!important}
.lego-slot.filled .merch-product-card>.store-card-caption>b.price-sale-v84{color:#a4252d!important}
.lego-slot.filled .merch-product-card>.store-card-caption>b>s{font-size:9px!important;font-weight:400!important;color:#9a9ea6!important;text-decoration:line-through!important}
/* Discount reads as a sale badge on the image, the way a real PLP shows it — and it stops fighting
   the strike-through price for the last few pixels of a narrow card. */
.lego-slot.filled .merch-product-card>.store-card-caption>em{position:absolute!important;top:8px!important;right:8px!important;left:auto!important;bottom:auto!important;z-index:6!important;padding:3px 6px!important;border-radius:2px!important;background:#17181d!important;color:#fff!important;font-size:9px!important;font-style:normal!important;font-weight:700!important;letter-spacing:.04em!important;line-height:1.1!important}
/* Looks and media stay editorial: no caption, full-bleed media. */
.lego-slot.filled .merch-media-card>.store-card-caption{display:none!important}
/* Stock / L7D chips belong to the image, not to the price line they used to overlap. */
.lego-slot.filled:has(.merch-product-card) .content-metric-overlay-v47.slot-overlay-v47{bottom:58px!important}

/* Preview mode is the live storefront: no authoring chrome, no docked panels, centred page. */
.preview-mode .aem-author-side-panel-v40,
.preview-mode .right-side-shell-v45,
.preview-mode .section-multiselect-hint-v62,
.preview-mode .multi-section-bar-v60,
.preview-mode .runtime-status-line.section,
.preview-mode .section-author-toolbar-v57,
.preview-mode .section-insert-point,
.preview-mode .page-layout-actions,
.preview-mode .merch-empty-section-v74,
.preview-mode .lego-slot .slot-head,
.preview-mode .lego-slot .slot-warning,
.preview-mode .lego-slot .slot-fit-control,
.preview-mode .lego-slot .entity-details-trigger,
.preview-mode .content-metric-overlay-v47,
.preview-mode .content-media-pager-v69,
.preview-mode .media-index{display:none!important}
/* These authoring overlays are pinned with high-specificity !important rules of their own. */
.lego-app.preview-mode .lego-slot.filled>.slot-media-pager-v71,
.lego-app.preview-mode .lego-slot.filled .slot-media-pager-v71,
.lego-app.preview-mode .lego-slot.filled .content-metric-overlay-v47,
.lego-app.preview-mode .lego-slot.filled .entity-details-trigger,
.lego-app.preview-mode .builder-section .section-head-meta,
.lego-app.preview-mode .builder-section .section-inline-actions{display:none!important}

/* A storefront still needs its section headings — keep the title, drop the authoring metadata. */
.lego-app.preview-mode .builder-section .section-header-line{display:block!important;border:0!important;background:transparent!important;padding:34px 0 14px!important;margin:0!important}
.lego-app.preview-mode .builder-section .section-header-line h3{margin:0!important;font-size:15px!important;font-weight:600!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#17181d!important;text-align:center!important}
.preview-mode .builder-workspace{display:block!important;grid-template-columns:minmax(0,1fr)!important;background:#f2f1ef!important}
.preview-mode .canvas-shell{width:100%!important;max-width:100%!important;padding:0!important;display:block!important}
.preview-mode .storefront-frame{margin:0 auto!important;box-shadow:0 1px 40px rgba(17,17,17,.07)!important}
.preview-mode .storefront-frame.desktop{max-width:1360px!important;width:100%!important}
.preview-mode .storefront-frame.mobile{max-width:390px!important;width:390px!important;border-radius:18px!important;overflow:hidden!important;margin-top:22px!important;margin-bottom:22px!important}
.preview-mode .builder-section{border:0!important;box-shadow:none!important;background:transparent!important}
.preview-mode .lego-slot{border:0!important;outline:0!important;cursor:default!important}
.preview-mode .lego-slot.filled .merch-product-card>.store-card-caption{padding:10px 2px 18px!important}
`;
  writeFileSync(cssPath, css);
}

console.log('V84 applied: commerce product cards with price, selection-scoped section telemetry and a clean preview mode');
