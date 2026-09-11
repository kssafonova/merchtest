import { readFileSync, writeFileSync } from 'node:fs';

/**
 * V83 — merchandising credibility pass.
 *
 * The prototype has to read like a real storefront the moment it opens, so this patch fixes the
 * three things that broke that illusion:
 *   1. Colour variants were painted from a 400x214 sprite atlas (~13px per cell), which upscaled
 *      into grey blur on every card. Variants now reuse the real model photography and carry an
 *      explicit colour identity (swatch + name + position) instead.
 *   2. A section filled itself with every colour of the same model, so a "new in" row showed one
 *      coat three times. One colour per model is now the default; "all colours" stays available.
 *   3. First load opened on an empty three-slot section: zero coverage, zero products, nothing to
 *      judge. The page now opens as a merchandised «Новинки» storefront.
 */

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const MARKER = 'SALES_MERCH_V83';

let app = readFileSync(appPath, 'utf8');
if (app.includes(MARKER)) {
  console.log('V83 already applied');
} else {
  const anchor = 'const GROUP_AUTOMATION_UNIFIED_V82 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V82 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // ---------------------------------------------------------------------------------------------
  // 1. Real photography for colour variants.
  // ---------------------------------------------------------------------------------------------
  const baseMediaFrom = 'const baseMedia = [\n      ...((base.images && base.images.length) ? base.images : (base.image ? [base.image] : [])),\n      ...(eligible ? variantAtlasShots(base.id, 1) : []),\n      ...productModelShots(base),\n    ];';
  if (!app.includes(baseMediaFrom)) throw new Error(MARKER + ': baseMedia block missing');
  app = app.replace(baseMediaFrom, 'const baseMedia = [\n      ...productPackshotsV83(base),\n      ...productModelShots(base),\n    ];');

  const variantMediaFrom = 'mediaItems: [...variantAtlasShots(base.id, row.variantIndex), ...productModelShots(base)],';
  if (!app.includes(variantMediaFrom)) throw new Error(MARKER + ': variant mediaItems missing');
  app = app.replace(variantMediaFrom, 'mediaItems: [...productPackshotsV83(base), ...productModelShots(base)],');

  const helperAnchor = 'function productLookGroup(product) {';
  if (!app.includes(helperAnchor)) throw new Error(MARKER + ': productLookGroup anchor missing');
  const helpers = String.raw`const COLOR_SWATCH_V83 = {
  'черный': '#1b1b1d', 'чёрный': '#1b1b1d', 'графитовый': '#4a4d52', 'темно-серый': '#5d6067',
  'серый': '#8f9299', 'светло-серый': '#c3c6cb', 'темно-сине-серый': '#4c5663',
  'белый': '#ffffff', 'молочный': '#f3ece1', 'кремовый': '#efe4d2', 'шампань': '#e8d7bb',
  'бежевый': '#d9c3a5', 'песочный': '#dbc8a8', 'кэмел': '#b98c56', 'шоколадный': '#6b4630',
  'темно-синий': '#25304d', 'синий': '#2f4a8a', 'голубой': '#9ec2e0', 'светло-голубой': '#c3dcef',
  'оливковый': '#7b7f4d', 'хаки': '#8d8862', 'темно-зеленый': '#2f4636', 'зелено-молочный': '#d6ddc9',
  'изумрудный': '#1f6b56', 'бордовый': '#6d2230', 'красный': '#b3242c',
  'розовый': '#e9a7bb', 'пыльно-розовый': '#d7a9a6', 'пастельно-розовый': '#f0cdd2', 'пудровый': '#e8c9c2',
  'лавандовый': '#bdb3dd', 'черно-бежевый': '#8b7d6c',
};

// Colour names in the feed are free text ("Розовый с цветочным принтом"), so fall back to the first
// token that we do know before giving up on a swatch.
function colorSwatchV83(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (COLOR_SWATCH_V83[raw]) return COLOR_SWATCH_V83[raw];
  const head = raw.split(/[\s,/]+/)[0];
  return COLOR_SWATCH_V83[head] || null;
}

function pluralRuV83(count, one, few, many) {
  const n = Math.abs(Number(count) || 0) % 100;
  const tail = n % 10;
  if (n > 10 && n < 20) return many;
  if (tail > 1 && tail < 5) return few;
  if (tail === 1) return one;
  return many;
}

// Every colour SKU of a model shares the model's packshots. Showing the real garment beats an
// upscaled sprite cell; the colour itself is carried by the swatch and the SKU label.
function productPackshotsV83(base) {
  if (Array.isArray(base?.images) && base.images.length) return base.images;
  return base?.image ? [base.image] : [];
}

function ColorSwatchV83({ color, size = 9 }) {
  const hex = colorSwatchV83(color);
  if (!hex) return null;
  return <i className="color-swatch-v83" style={{ width: size, height: size, background: hex }} aria-hidden="true"/>;
}

function productLookGroup(product) {`;
  app = app.replace(helperAnchor, helpers);

  // ---------------------------------------------------------------------------------------------
  // 2. Merchandising default: one colour per model.
  // ---------------------------------------------------------------------------------------------
  const rulesFrom = "ttl: 15, colorMode: 'all', maxColors: 2 };";
  if (!app.includes(rulesFrom)) throw new Error(MARKER + ': DEFAULT_RULES colour defaults missing');
  app = app.replace(rulesFrom, "ttl: 15, colorMode: 'one', maxColors: 1 };");

  // ---------------------------------------------------------------------------------------------
  // 3. Product card reads as commerce: colour swatch, colour name, how many colours exist.
  // ---------------------------------------------------------------------------------------------
  const captionFrom = '<small className="product-color-meta">{product.color} · {product.colorVariantCount || 1} цветовых SKU</small>';
  if (!app.includes(captionFrom)) throw new Error(MARKER + ': product colour caption missing');
  app = app.replace(
    captionFrom,
    '<small className="product-color-meta"><ColorSwatchV83 color={product.color}/>{product.color}{(product.colorVariantCount || 1) > 1 ? " · " + product.colorVariantCount + " " + pluralRuV83(product.colorVariantCount, "цвет", "цвета", "цветов") : ""}</small>',
  );

  // ---------------------------------------------------------------------------------------------
  // 4. First load opens on a merchandised page instead of an empty grid.
  // ---------------------------------------------------------------------------------------------
  const initialStart = app.indexOf('const makeInitialSections = () => [');
  const initialEnd = app.indexOf('];', initialStart);
  if (initialStart < 0 || initialEnd < 0) throw new Error(MARKER + ': makeInitialSections missing');
  const demoPage = String.raw`const DEMO_PAGE_V83 = [
  ['LAYOUT-5', { ru: 'Новая коллекция', en: 'New collection', kk: 'Жаңа коллекция', ar: 'مجموعة جديدة' }, { 0: 'W02', 1: 'LIM004' }],
  ['LAYOUT-3', { ru: 'Новинки недели', en: 'New this week', kk: 'Апта жаңалықтары', ar: 'جديد هذا الأسبوع' }, { 0: 'LIM001', 1: 'LIM003', 2: 'LIM005' }],
  ['LAYOUT-28', { ru: 'Женский гардероб', en: 'Women essentials', kk: 'Әйелдер гардеробы', ar: 'أساسيات النساء' }, { 0: 'W01', 1: 'LIM006', 2: 'LIM007', 3: 'LIM051', 4: 'LIM052' }],
  ['LAYOUT-7', { ru: 'Мужская линия', en: 'Men line', kk: 'Ерлер желісі', ar: 'خط الرجال' }, { 0: 'M01', 1: 'LIM014', 2: 'LIM018' }],
  ['LAYOUT-4', { ru: 'Выбор редакции', en: 'Editor picks', kk: 'Редакция таңдауы', ar: 'اختيار المحرر' }, { 0: 'LIM009', 1: 'LIM019', 2: 'LIM002', 3: 'LIM013' }],
];
const makeInitialSections = () => DEMO_PAGE_V83.map(([typeId, titles, pins]) => initialSection(typeId, titles, pins, 'manual'));
const makeEmptySectionsV83 = () => [
  initialSection('LAYOUT-3', { ru: 'Секция', en: 'Section', kk: 'Секция', ar: 'قسم' }, {}, 'manual'),
];`;
  app = app.slice(0, initialStart) + demoPage + app.slice(initialEnd + 2);

  // Only the landing page ships the demo; every other page starts from a clean single section so the
  // authoring flow stays honest.
  const pageSectionsFrom = "const [pageSections, setPageSections] = useState(() => Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, { new: makeInitialSections() }])));";
  if (!app.includes(pageSectionsFrom)) throw new Error(MARKER + ': pageSections init missing');
  app = app.replace(
    pageSectionsFrom,
    "const [pageSections, setPageSections] = useState(() => Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, { new: r === 'RU' ? makeInitialSections() : makeEmptySectionsV83() }])));",
  );

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* sales-merch-v83 */')) {
  css += String.raw`
/* sales-merch-v83 */
.color-swatch-v83{display:inline-block;flex:0 0 auto;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(17,17,17,.18);margin-right:5px;vertical-align:middle}
.product-color-meta{display:flex!important;align-items:center;gap:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.reference-merch-card .product-color-meta{font-size:8px}
`;
  writeFileSync(cssPath, css);
}

console.log('V83 applied: real variant photography, one-colour-per-model default, colour swatches and a merchandised first-load page');
