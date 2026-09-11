import { readFileSync, writeFileSync } from 'node:fs';

/**
 * V83 — merchandising credibility pass.
 *
 * The prototype has to read like a real storefront the moment it opens, so this patch fixes the two
 * things that broke that illusion:
 *   1. Colour variants were painted from a 400x214 sprite atlas (~13px per cell), which upscaled
 *      into grey blur on every card. Every colour SKU of a model now uses the model's real
 *      photography; the SKU itself stays the identifier, as it is in the feed.
 *   2. First load opened on an empty three-slot section: zero coverage, zero products, nothing to
 *      judge. The page now opens as a merchandised «Новинки» storefront.
 *
 * Colour SKUs are deliberately NOT collapsed anywhere: automation keeps the shipped "all colours of
 * a model" default, and cards carry no colour swatch and no colour name.
 */

const appPath = 'src/AppV3.jsx';
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
  const helpers = String.raw`function pluralRuV83(count, one, few, many) {
  const n = Math.abs(Number(count) || 0) % 100;
  const tail = n % 10;
  if (n > 10 && n < 20) return many;
  if (tail > 1 && tail < 5) return few;
  if (tail === 1) return one;
  return many;
}

// Every colour SKU of a model shares the model's packshots. Showing the real garment beats an
// upscaled sprite cell.
function productPackshotsV83(base) {
  if (Array.isArray(base?.images) && base.images.length) return base.images;
  return base?.image ? [base.image] : [];
}

function productLookGroup(product) {`;
  app = app.replace(helperAnchor, helpers);

  // Colour SKUs are deliberately NOT collapsed: a section keeps showing every colour of a model, and
  // the card carries no colour swatch or colour name.

  // ---------------------------------------------------------------------------------------------
  // 2. First load opens on a merchandised page instead of an empty grid.
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

console.log('V83 applied: real variant photography and a merchandised first-load page');
