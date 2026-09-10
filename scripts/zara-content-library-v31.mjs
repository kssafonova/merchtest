import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'ZARA_CONTENT_LIBRARY_V31';

if (!app.includes(MARKER)) {
  const anchor = 'const UNIVERSAL_RATIOS_V30 = true;';
  if (!app.includes(anchor)) throw new Error('ZARA_CONTENT_LIBRARY_V31: V30 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* zara-content-library-v31 */')) {
  css += String.raw`
/* zara-content-library-v31 */
/* Clean, flat merchandising library. Media owns the ratio; metadata lives below it. */

.simple-merch-panel,
.simple-panel-head,
.simple-panel-mode-tabs,
.simple-filter-shell,
.simple-content-type-tabs,
.simple-library-scroll,
.content-library-scroll{background:#fff!important}

.simple-merch-panel{border-left:1px solid #dedede!important}
.simple-panel-head{min-height:70px!important;padding:20px 20px 13px!important;border-bottom:1px solid #e7e7e7!important}
.simple-panel-head strong{font-size:20px!important;font-weight:600!important;letter-spacing:-.025em!important;color:#111!important}
.simple-panel-head small{font-size:10px!important;color:#8a8a8a!important;margin-top:4px!important}

.simple-panel-mode-tabs{height:50px!important;padding:0 20px!important;gap:28px!important;border-bottom:1px solid #e7e7e7!important;align-items:flex-end!important}
.simple-panel-mode-tabs button{height:50px!important;padding:0 0 14px!important;font-size:10px!important;font-weight:600!important;color:#909090!important;border-bottom:1px solid transparent!important}
.simple-panel-mode-tabs button.active{color:#111!important;border-bottom-color:#111!important;background:transparent!important}

.simple-content-type-tabs{padding:14px 20px 0!important;display:flex!important;gap:24px!important;border:0!important}
.simple-content-type-tabs button{height:38px!important;padding:0!important;border:0!important;border-bottom:1px solid transparent!important;border-radius:0!important;background:transparent!important;color:#8b8b8b!important;font-size:10px!important;font-weight:600!important;box-shadow:none!important;flex:0 0 auto!important}
.simple-content-type-tabs button.active{background:transparent!important;color:#111!important;border-bottom-color:#111!important}

.simple-slot-hint{margin:13px 20px 0!important;min-height:36px!important;padding:8px 10px!important;border:1px solid #e1e4e8!important;border-radius:2px!important;background:#fafafa!important;color:#60646b!important;font-size:9px!important}

.simple-filter-shell{padding:14px 20px 16px!important;border-bottom:1px solid #e7e7e7!important}
.simple-search-row{gap:8px!important}
.simple-search-box,.simple-filter-toggle{height:42px!important;border:1px solid #d9d9d9!important;border-radius:2px!important;background:#fff!important;box-shadow:none!important}
.simple-search-box{padding:0 12px!important}
.simple-search-box:focus-within{border-color:#111!important;box-shadow:none!important}
.simple-search-box input{font-size:10px!important;color:#111!important}
.simple-filter-toggle{padding:0 12px!important;font-size:9px!important;color:#111!important}
.simple-filter-toggle.active{background:#fff!important;border-color:#111!important}
.simple-filter-toggle span{background:#111!important}

.simple-quick-filters{gap:6px!important;margin:10px 0 0!important;display:flex!important;flex-wrap:wrap!important}
.simple-quick-filters button,.simple-media-kinds button{height:30px!important;padding:0 10px!important;border:1px solid #dedede!important;border-radius:999px!important;background:#fff!important;color:#6e6e6e!important;font-size:8px!important;box-shadow:none!important}
.simple-quick-filters button.active,.simple-media-kinds button.active{background:#111!important;border-color:#111!important;color:#fff!important}

.simple-advanced-filters{margin-top:11px!important;padding:12px!important;border:1px solid #e1e1e1!important;border-radius:2px!important;background:#fafafa!important}
.simple-filter-grid{gap:10px!important}
.simple-filter-grid label>span,.simple-inline-filters label>span{font-size:8px!important;color:#777!important;font-weight:600!important}
.simple-filter-grid select,.simple-inline-filters select{height:40px!important;border:1px solid #d9d9d9!important;border-radius:2px!important;background:#fff!important;color:#222!important;font-size:9px!important}
.simple-filter-actions{margin-top:10px!important;gap:8px!important}
.simple-find{height:40px!important;border-radius:2px!important;background:#111!important;font-size:9px!important}
.simple-reset{height:40px!important;border:1px solid #d9d9d9!important;border-radius:2px!important;background:#fff!important;color:#666!important;font-size:9px!important}
.simple-filter-actions>span{font-size:8px!important;color:#8a8a8a!important}
.simple-inline-filters{gap:10px!important;margin-top:4px!important}
.simple-media-tools{margin-top:4px!important}
.simple-upload{height:34px!important;border:1px solid #d9d9d9!important;border-radius:2px!important;background:#fff!important;color:#333!important;font-size:8px!important}

/* Library grid */
.simple-library-scroll,.content-library-scroll{padding:18px 20px 32px!important}
.reference-library-grid,.visual-library-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:22px 16px!important;align-items:start!important;margin:0!important}

.wide-settings-panel .reference-merch-card,
.wide-settings-panel .reference-merch-card.ratio-portrait,
.wide-settings-panel .reference-merch-card.ratio-landscape{position:relative!important;display:flex!important;flex-direction:column!important;min-width:0!important;height:auto!important;min-height:0!important;aspect-ratio:auto!important;border:1px solid #e1e1e1!important;border-radius:0!important;background:#fff!important;box-shadow:none!important;overflow:visible!important;transform:none!important}
.wide-settings-panel .reference-merch-card:hover{border-color:#b9b9b9!important;box-shadow:none!important;transform:none!important}

/* The photograph/media itself owns 2:3 / 3:2. */
.reference-card-body{position:relative!important;inset:auto!important;width:100%!important;height:auto!important;min-height:0!important;overflow:hidden!important;background:#f7f7f5!important;border:0!important}
.reference-merch-card.ratio-portrait .reference-card-body{aspect-ratio:2/3!important}
.reference-merch-card.ratio-landscape .reference-card-body{aspect-ratio:3/2!important}
.reference-card-body>.entity-product,.reference-card-body>.entity-media{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;display:block!important;border:0!important;background:#f7f7f5!important}
.reference-card-body .merch-card-media{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;aspect-ratio:auto!important;background:#f7f7f5!important;overflow:hidden!important}
.reference-card-body .merch-card-media img,.reference-card-body .merch-card-media video{width:100%!important;height:100%!important;display:block!important;object-position:center!important}
.reference-card-body .entity-product .merch-card-media img{object-fit:contain!important}
.reference-card-body .entity-media .merch-card-media img,.reference-card-body .entity-media .merch-card-media video{object-fit:cover!important}
.reference-card-body .variant-atlas-frame{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important}

/* Remove caption duplication from the image area. */
.reference-card-body .store-card-caption,
.reference-card-body .commerce-badges,
.reference-card-body .media-index,
.reference-card-body .look-preview-cta{display:none!important}

/* Minimal action controls — no heavy floating pills. */
.reference-card-body .entity-details-trigger{display:grid!important;place-items:center!important;position:absolute!important;top:10px!important;right:10px!important;z-index:12!important;width:32px!important;height:32px!important;border:1px solid rgba(20,20,20,.18)!important;border-radius:50%!important;background:rgba(255,255,255,.92)!important;color:#111!important;box-shadow:none!important;opacity:1!important;backdrop-filter:blur(8px)!important}
.reference-card-body .entity-details-trigger:hover{background:#fff!important;border-color:#111!important}
.reference-card-body .entity-details-trigger svg{width:14px!important;height:14px!important}
.reference-merch-card.clickable:after{content:'+'!important;position:absolute!important;top:10px!important;right:50px!important;z-index:13!important;width:32px!important;height:32px!important;display:grid!important;place-items:center!important;border:1px solid rgba(20,20,20,.18)!important;border-radius:50%!important;background:rgba(255,255,255,.92)!important;color:#111!important;font-size:18px!important;font-weight:300!important;line-height:1!important;pointer-events:none!important;backdrop-filter:blur(8px)!important}

.reference-slot-target{position:absolute!important;left:10px!important;top:10px!important;z-index:14!important;display:grid!important;gap:1px!important;padding:5px 7px!important;background:rgba(255,255,255,.92)!important;border:1px solid rgba(20,20,20,.18)!important;border-radius:0!important;box-shadow:none!important}
.reference-slot-target span{font-size:6px!important;font-weight:600!important;letter-spacing:.05em!important;color:#777!important}
.reference-slot-target b{font-size:9px!important;font-weight:600!important;color:#111!important}

/* SKU/name line below media instead of a dark overlay. */
.reference-card-id{position:static!important;order:2!important;max-width:none!important;margin:0!important;padding:10px 10px 8px!important;background:#fff!important;color:#222!important;border-top:1px solid #ededed!important;font-size:9px!important;font-weight:600!important;letter-spacing:.01em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}

/* Metrics: one thin line, one traffic-light language, no capsules. */
.reference-commerce-stack{position:static!important;order:3!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:0!important;padding:0 10px 8px!important;background:#fff!important;pointer-events:none!important}
.reference-commerce-stack .metric{height:28px!important;min-width:0!important;padding:0 7px!important;border:0!important;border-left:1px solid #e8e8e8!important;border-radius:0!important;background:transparent!important;color:#6d6d6d!important;display:grid!important;grid-template-columns:6px minmax(0,1fr) auto!important;align-items:center!important;column-gap:5px!important;box-shadow:none!important}
.reference-commerce-stack .metric:first-child{border-left:0!important;padding-left:0!important}
.reference-commerce-stack .metric:before{content:'';width:6px;height:6px;border-radius:50%;background:#8b8b8b;display:block}
.reference-commerce-stack .metric.signal-good:before{background:#1f7a59!important}
.reference-commerce-stack .metric.signal-warn:before{background:#a56b0b!important}
.reference-commerce-stack .metric.signal-bad:before{background:#b7443d!important}
.reference-commerce-stack .metric.signal-good,.reference-commerce-stack .metric.signal-warn,.reference-commerce-stack .metric.signal-bad,.reference-commerce-stack .metric.signal-neutral{background:transparent!important;border-color:#e8e8e8!important;color:#6d6d6d!important}
.reference-commerce-stack .metric b{font-size:6px!important;font-weight:600!important;letter-spacing:.06em!important;color:#8a8a8a!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.reference-commerce-stack .metric em{font-size:10px!important;font-style:normal!important;font-weight:600!important;color:#111!important;white-space:nowrap!important}

.reference-card-footer{position:static!important;order:4!important;height:36px!important;padding:0 10px!important;background:#fff!important;border-top:1px solid #ededed!important;display:flex!important;align-items:center!important;justify-content:space-between!important;color:#777!important;z-index:auto!important}
.reference-card-footer span{font-size:8px!important;font-weight:500!important;text-transform:none!important;letter-spacing:.01em!important}
.reference-card-footer svg{width:13px!important;height:13px!important;color:#999!important}

/* Media cards, looks and products share the same frame language. */
.reference-merch-card:not(:has(.entity-product)) .reference-commerce-stack .metric{background:transparent!important;color:#6d6d6d!important}
.reference-merch-card:not(:has(.entity-product)) .reference-commerce-stack .metric:before{background:#8b8f8b!important}
.reference-merch-card .entity-media.compact,.reference-merch-card .entity-product.compact{height:100%!important;display:block!important}
.reference-merch-card .entity-product.compact .entity-art,.reference-merch-card .entity-media.compact>svg{display:none!important}

/* Keep SVG artwork readable and centered without gray cards. */
.reference-merch-card .entity-media{background:#fff!important;color:#111!important}
.reference-merch-card .entity-media .merch-card-media{background:#fff!important}
.reference-merch-card .entity-media .merch-card-media img[src$='.svg'],
.reference-merch-card .entity-media .merch-card-media img[src*='.svg?']{object-fit:contain!important;padding:10%!important;background:#fff!important}

/* Thin, calm scroll and empty state. */
.simple-library-scroll{scrollbar-width:thin;scrollbar-color:#cfcfcf transparent}
.simple-library-scroll::-webkit-scrollbar{width:6px}.simple-library-scroll::-webkit-scrollbar-track{background:transparent}.simple-library-scroll::-webkit-scrollbar-thumb{background:#cfcfcf;border-radius:999px}
.content-empty{border:0!important;background:#fff!important}

@media(max-width:1180px){
  .reference-library-grid,.visual-library-grid{grid-template-columns:1fr!important;gap:18px!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('Zara content library v31 applied: clean white cards, thin lines, full-size 2:3 / 3:2 media');
