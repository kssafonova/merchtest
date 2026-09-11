import { readFileSync, writeFileSync } from 'node:fs';

/**
 * V87 — markets become real, and out-of-stock becomes visible.
 *
 * Two gaps the audit left open:
 *
 *   1. The feed carried the same number for every market — {RU:18, KZ:18, GCC:18, WW:18} — and every
 *      colour SKU of a model shared it. So the four-market model had nothing to differentiate, and a
 *      colour could never be out while its siblings were in.
 *   2. Nothing in the catalog was ever out of stock (minimum stock 7, availability 100% everywhere),
 *      so the OOS replacement chain — the most commercially valuable part of the system — had never
 *      run. It was written, unit-consistent, and invisible.
 *
 * This patch gives each market its own stock position, splits a model's stock across its colour
 * SKUs, seeds a realistic out-of-stock set, repairs the "other colour of the same model" fallback so
 * it also works in manually filled sections, and seeds a GCC storefront so the same rules can be
 * shown producing a different result in a different market.
 */

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const MARKER = 'MARKET_STOCK_V87';

let app = readFileSync(appPath, 'utf8');
if (app.includes(MARKER)) {
  console.log('V87 already applied');
} else {
  const anchor = 'const LOGIC_AUDIT_V86 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V86 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // ---------------------------------------------------------------------------------------------
  // 1. Per-market, per-colour stock.
  // ---------------------------------------------------------------------------------------------
  const productsAnchor = 'const PRODUCTS = [...expandColorVariants(CATALOG_PRODUCTS), ...FEED_PRODUCTS];';
  if (!app.includes(productsAnchor)) throw new Error(MARKER + ': PRODUCTS composition missing');
  const stockModel = String.raw`// Market stock is not one number. Kazakhstan is a smaller market, the Gulf does not take wool
// outerwear at all and takes little heavy knitwear, and the WW pool is a pilot volume.
const MARKET_SCALE_V87 = { RU: 1, KZ: 0.45, GCC: 0.6, WW: 0.25 };
const GCC_BLOCKED_CATEGORIES_V87 = ['верхняя одежда'];
const GCC_REDUCED_CATEGORIES_V87 = ['трикотаж', 'свитшоты и худи'];

// Deliberately out of stock, so the replacement chain has something to repair. LIM003 and LIM019 sit
// in pinned slots of the RU landing page: their models stay live through another colour, which is
// exactly the behaviour the chain exists for. LIM056 is out in every colour — the case where the
// chain has nothing to offer and the slot has to collapse.
const MARKET_OOS_V87 = {
  RU: ['LIM003', 'LIM019', 'LIM056', 'LIM056-C2', 'LIM056-C3', 'LIM028', 'LIM041', 'LIM048-C2', 'LIM062', 'LIM077', 'LIM088', 'LIM094', 'LIM109', 'LIM121', 'LIM133'],
  KZ: ['LIM001', 'LIM001-C2', 'LIM013', 'LIM026', 'LIM034', 'LIM055', 'LIM071', 'LIM090', 'LIM112'],
  GCC: ['LIM010', 'LIM033', 'LIM045-C3', 'LIM064', 'LIM083'],
  WW: ['LIM002', 'LIM017', 'LIM039', 'LIM068'],
};
const MARKET_OOS_SETS_V87 = Object.fromEntries(Object.entries(MARKET_OOS_V87).map(([market, list]) => [market, new Set(list)]));

function marketModelStockV87(base, market) {
  const total = Number(base?.stockValue ?? base?.stock?.RU ?? 0);
  const category = String(base?.category || '').toLowerCase();
  if (market === 'GCC') {
    if (GCC_BLOCKED_CATEGORIES_V87.some((item) => category.includes(item))) return 0;
    if (GCC_REDUCED_CATEGORIES_V87.some((item) => category.includes(item))) return Math.round(total * 0.25);
  }
  return Math.round(total * (MARKET_SCALE_V87[market] ?? 1));
}

// A model's stock belongs to the model, not to one colour. Split it so the colour SKUs sum back to
// the model total instead of each claiming the whole number.
const COLOR_SPLIT_V87 = { 1: [1], 2: [0.6, 0.4], 3: [0.5, 0.3, 0.2] };
function colorShareV87(variantIndex, variantCount) {
  const weights = COLOR_SPLIT_V87[Math.min(3, Math.max(1, variantCount))] || [1];
  return weights[Math.min(weights.length - 1, Math.max(0, Number(variantIndex || 1) - 1))];
}

function marketStockMapV87(base, sku, variantIndex, variantCount) {
  return Object.fromEntries(Object.keys(MARKET_SCALE_V87).map((market) => {
    if (MARKET_OOS_SETS_V87[market]?.has(sku)) return [market, 0];
    const modelStock = marketModelStockV87(base, market);
    return [market, Math.max(0, Math.round(modelStock * colorShareV87(variantIndex, variantCount)))];
  }));
}

function applyMarketStockV87(products) {
  const counts = new Map();
  products.forEach((product) => counts.set(product.modelId, Math.max(counts.get(product.modelId) || 0, Number(product.variantIndex || 1))));
  return products.map((product) => {
    const stock = marketStockMapV87(product, String(product.id), product.variantIndex, counts.get(product.modelId) || 1);
    return { ...product, stock, stockValue: stock.RU };
  });
}

const PRODUCTS = applyMarketStockV87([...expandColorVariants(CATALOG_PRODUCTS), ...FEED_PRODUCTS]);`;
  app = app.replace(productsAnchor, stockModel);

  // ---------------------------------------------------------------------------------------------
  // 2. The "other colour of the same model" fallback could not fire in a manually filled section.
  //
  // It searched availableRaw — the rule's own candidate pool — which is empty when the section has
  // no rule. So a pinned SKU that sold out simply vanished, even though another colour of the same
  // model was sitting in stock. Manual pins now fall back to the catalog.
  // ---------------------------------------------------------------------------------------------
  const otherColorFrom = "      if (step.step === 'other_color') {\n        const color = automationOtherColorV63(original,availableRaw,new Set([...usedLocal,...ctx.usedAcross]),region);";
  if (!app.includes(otherColorFrom)) throw new Error(MARKER + ': other_color step missing');
  app = app.replace(
    otherColorFrom,
    "      if (step.step === 'other_color') {\n        const colorPoolV87 = availableRaw.length ? availableRaw : PRODUCTS;\n        const color = automationOtherColorV63(original,colorPoolV87,new Set([...usedLocal,...ctx.usedAcross]),region);",
  );

  // ---------------------------------------------------------------------------------------------
  // 3. Make the repair countable: how many slots the chain rescued before publish.
  // ---------------------------------------------------------------------------------------------
  const publishGridFrom = "<div className=\"merch-publish-grid-v74\"><span><b>Секций</b><strong>{sections.length}</strong></span><span><b>Каталог на витрине</b><strong>{metrics?.coverage||0}%</strong></span><span><b>AUTO слотов</b><strong>{auto}</strong></span><span><b>Пустых</b><strong>{empty}</strong></span></div>";
  if (!app.includes(publishGridFrom)) throw new Error(MARKER + ': publish grid missing');
  app = app.replace(
    publishGridFrom,
    "<div className=\"merch-publish-grid-v74\"><span><b>Секций</b><strong>{sections.length}</strong></span><span><b>Каталог на витрине</b><strong>{metrics?.coverage||0}%</strong></span><span><b>AUTO слотов</b><strong>{auto}</strong></span><span><b>Пустых</b><strong>{empty}</strong></span><span title=\"Слоты, где закончившийся товар заменён по цепочке fallback\"><b>Замен по OOS</b><strong>{fallbackSlotsV87}</strong></span></div>",
  );
  const publishCountsAnchor = 'function MerchPublishCheckV74({resolved,metrics,region,pageSettings,onConfirm,onClose}){';
  if (!app.includes(publishCountsAnchor)) throw new Error(MARKER + ': publish component missing');
  app = app.replace(
    publishCountsAnchor,
    publishCountsAnchor + "\n  const fallbackSlotsV87=(resolved||[]).flatMap((section)=>section?.resolvedSlots||[]).filter((slot)=>slot?.origin==='fallback').length;",
  );

  // ---------------------------------------------------------------------------------------------
  // 4. A GCC storefront, so the market switch shows a different page and not an empty one.
  //
  // Gulf assortment, not a translation of the Russian one: no wool outerwear, evening and light
  // tailoring lead, Arabic titles alongside RU/EN.
  // ---------------------------------------------------------------------------------------------
  const demoAnchor = 'const makeInitialSections = () => DEMO_PAGE_V83.map(';
  if (!app.includes(demoAnchor)) throw new Error(MARKER + ': demo page factory missing');
  const gccPage = String.raw`const DEMO_PAGE_GCC_V87 = [
  ['LAYOUT-5', { ru: 'Вечерняя коллекция', en: 'Evening edit', kk: 'Кешкі коллекция', ar: 'تشكيلة السهرة' }, { 0: 'W02', 1: 'LIM004' }],
  ['LAYOUT-3', { ru: 'Платья и юбки', en: 'Dresses & skirts', kk: 'Көйлектер мен белдемшелер', ar: 'الفساتين والتنانير' }, { 0: 'LIM055', 1: 'LIM056', 2: 'LIM054' }],
  ['LAYOUT-7', { ru: 'Лёгкий гардероб', en: 'Lightweight wardrobe', kk: 'Жеңіл гардероб', ar: 'خزانة خفيفة' }, { 0: 'W03', 1: 'LIM005', 2: 'LIM007' }],
  ['LAYOUT-4', { ru: 'Базовые вещи', en: 'Essentials', kk: 'Базалық заттар', ar: 'الأساسيات' }, { 0: 'LIM045', 1: 'LIM047', 2: 'LIM010', 3: 'LIM057' }],
  ['LAYOUT-7', { ru: 'Мужская линия', en: 'Men line', kk: 'Ерлер желісі', ar: 'خط الرجال' }, { 0: 'M05', 1: 'LIM014', 2: 'LIM018' }],
];
const makeGccSectionsV87 = () => DEMO_PAGE_GCC_V87.map(([typeId, titles, pins]) => initialSection(typeId, titles, pins, 'manual'));
` + demoAnchor;
  app = app.replace(demoAnchor, gccPage);

  const pageSectionsFrom = "const [pageSections, setPageSections] = useState(() => Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, { new: r === 'RU' ? makeInitialSections() : makeEmptySectionsV83() }])));";
  if (!app.includes(pageSectionsFrom)) throw new Error(MARKER + ': pageSections init missing');
  app = app.replace(
    pageSectionsFrom,
    "const [pageSections, setPageSections] = useState(() => Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, { new: r === 'RU' ? makeInitialSections() : r === 'GCC' ? makeGccSectionsV87() : makeEmptySectionsV83() }])));",
  );

  // ---------------------------------------------------------------------------------------------
  // 5. Price followed the market, not the catalog.
  //
  // money() was hardcoded to ru-RU and ₽, so the Gulf storefront quoted roubles under an Arabic
  // navigation — which undoes the whole point of showing a separate market. Rates below are demo
  // rates, not a pricing model: they exist so the market switch is tangible.
  // ---------------------------------------------------------------------------------------------
  const moneyFrom = "const money = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;";
  if (!app.includes(moneyFrom)) throw new Error(MARKER + ': money formatter missing');
  app = app.replace(
    moneyFrom,
    String.raw`const MARKET_PRICING_V87 = {
  RU: { locale: 'ru-RU', currency: '₽', rate: 1, round: 1 },
  KZ: { locale: 'ru-RU', currency: '₸', rate: 5.5, round: 100 },
  GCC: { locale: 'ar-AE', currency: 'AED', rate: 0.042, round: 5 },
  WW: { locale: 'en-US', currency: '€', rate: 0.0105, round: 1 },
};
let ACTIVE_MARKET_V87 = 'RU';
const setActiveMarketV87 = (market) => { ACTIVE_MARKET_V87 = MARKET_PRICING_V87[market] ? market : 'RU'; };
const money = (value) => {
  const config = MARKET_PRICING_V87[ACTIVE_MARKET_V87] || MARKET_PRICING_V87.RU;
  const converted = Math.max(0, Math.round((Number(value) || 0) * config.rate / config.round) * config.round);
  return new Intl.NumberFormat(config.locale === 'ar-AE' ? 'en-US' : config.locale).format(converted) + ' ' + config.currency;
};`,
  );
  const marketSyncAnchor = '  const pageId = pageIdByRegion[region];';
  if (!app.includes(marketSyncAnchor)) throw new Error(MARKER + ': pageId anchor missing');
  app = app.replace(marketSyncAnchor, '  setActiveMarketV87(region);\n' + marketSyncAnchor);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* market-stock-v87 */')) {
  css += String.raw`
/* market-stock-v87 */
/* A replaced slot has to say so: the chip is the only evidence that the chain ran. */
/* The base stylesheet hides every slot chrome element on a filled slot, warnings included, so the
   only trace of a replacement was in the DOM. The warning is rare and load-bearing: it is the single
   piece of evidence that the fallback chain ran. */
.lego-slot.filled .slot-warning,.lego-slot .slot-warning{display:inline-flex!important;align-items:center!important;gap:5px!important;z-index:9!important;max-width:calc(100% - 16px)!important;padding:4px 8px!important;border-radius:3px!important;background:rgba(23,24,29,.92)!important;color:#fff!important;font-size:8.5px!important;font-weight:600!important;line-height:1.25!important;letter-spacing:.01em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.lego-slot.filled .slot-warning svg{flex:0 0 auto!important}
.lego-slot.filled:has(.merch-product-card) .slot-warning{left:8px!important;right:auto!important;bottom:58px!important;top:auto!important}
.lego-slot.filled:has(.merch-media-card) .slot-warning{left:8px!important;right:auto!important;bottom:8px!important;top:auto!important}
/* PIN / AUTO status per slot only while its section is selected — otherwise 17 chips fight the wall. */
.builder-section.selected .lego-slot.filled .slot-head{display:flex!important;justify-content:flex-end!important;pointer-events:none!important}
.builder-section.selected .lego-slot.filled .slot-head>span{display:none!important}
.builder-section.selected .lego-slot.filled .slot-head em{pointer-events:auto!important}
.lego-app.preview-mode .lego-slot .slot-warning{display:none!important}
.merch-publish-grid-v74{grid-template-columns:repeat(5,minmax(0,1fr))!important}

/* RTL: Arabic is a real market language here, not a label. */
.lego-app[dir='rtl'] .store-card-caption,
.lego-app[dir='rtl'] .lego-slot.filled .merch-product-card>.store-card-caption{text-align:right!important;direction:rtl!important}
.lego-app[dir='rtl'] .lego-slot.filled .merch-product-card>.store-card-caption>strong{text-align:right!important}
/* Prices and the discount badge are latin/number runs: isolate them so bidi does not move the sign. */
.lego-app[dir='rtl'] .lego-slot.filled .merch-product-card>.store-card-caption>b{direction:ltr!important;unicode-bidi:isolate!important;justify-content:flex-end!important}
.lego-app[dir='rtl'] .lego-slot.filled .merch-product-card>.store-card-caption>em,
.lego-app[dir='rtl'] .content-card-commerce-v85>b{direction:ltr!important;unicode-bidi:isolate!important}
.lego-app[dir='rtl'] .lego-slot.filled .merch-product-card>.store-card-caption>b{flex-direction:row-reverse!important;justify-content:flex-end!important}
.lego-app[dir='rtl'] .lego-slot.filled .merch-product-card>.store-card-caption>em{right:auto!important;left:8px!important;top:auto!important;bottom:8px!important}
.lego-app[dir='rtl'] .lego-slot .slot-head{flex-direction:row-reverse!important}
`;
  writeFileSync(cssPath, css);
}

console.log('V87 applied: per-market and per-colour stock, seeded OOS, repaired colour fallback, OOS-replacement counter and a GCC storefront');
