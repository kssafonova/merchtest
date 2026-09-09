import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const partsDir = 'scripts/feed-data-parts';
let rows = [];

if (existsSync(partsDir)) {
  const parts = readdirSync(partsDir).filter((name) => name.endsWith('.txt')).sort();
  if (parts.length) {
    try {
      const encoded = parts.map((name) => readFileSync(`${partsDir}/${name}`, 'utf8').trim()).join('');
      const raw = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
      rows = JSON.parse(raw);
    } catch (error) {
      console.warn('Feed data is incomplete, using local catalog only:', error.message);
      rows = [];
    }
  }
}

const sectionMap = { Women: 'Женщины', Men: 'Мужчины', Kids: 'Дети' };
const feedProducts = rows.map((item) => {
  const availability = Number(item.availableVariants || 0);
  const category = item.typePrefix || 'Товар';
  const sizes = Array.isArray(item.sizes) ? item.sizes : [];
  return {
    id: `FEED-${item.id}`,
    sourceId: String(item.id),
    sku: item.vendorCode || String(item.id),
    vendorCode: item.vendorCode || '',
    department: sectionMap[item.section] || item.section || 'Каталог',
    gender: item.gender || '',
    category,
    subcategory: item.categoryName || '',
    name: item.name || item.vendorCode || String(item.id),
    material: item.material || '',
    price: Number(item.price || 0),
    oldprice: Number(item.oldprice || 0),
    discount: Number(item.discount || 0),
    color: item.color || '',
    collection: item.collection || '',
    silhouette: category,
    ageGroup: item.age || '',
    fit: '',
    length: '',
    sleeveLength: '',
    details: sizes.length ? `Размеры: ${sizes.join(', ')}${item.countryOfOrigin ? ` · ${item.countryOfOrigin}` : ''}` : (item.countryOfOrigin || ''),
    sizes,
    sizesUnit: item.sizesUnit || '',
    stockValue: availability,
    stock: { RU: availability, KZ: 0, GCC: 0, WW: 0 },
    availabilityCount: availability,
    availabilityLabel: 'доступных размеров',
    sourceRegion: 'RU',
    source: 'lime_product_feed_all_offers.csv',
    productUrl: item.productUrl || '',
    l7d: 0,
    isNew: Boolean(item.isNew),
    isSale: Boolean(item.isSale),
    image: item.images?.[0] || '',
    images: item.images || [],
    imageFile: '',
    imageFiles: [],
    looksCount: 0,
    tone: 'feed',
  };
});

const source = `export const FEED_PRODUCTS = ${JSON.stringify(feedProducts, null, 2)};\n`;
writeFileSync('src/feed.generated.js', source);

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
if (!app.includes("./feed.generated.js")) {
  app = app.replace(
    "import { CATALOG_PRODUCTS, CATALOG_LOOKS, CATALOG_MEDIA } from './catalog.generated.js';",
    "import { CATALOG_PRODUCTS, CATALOG_LOOKS, CATALOG_MEDIA } from './catalog.generated.js';\nimport { FEED_PRODUCTS } from './feed.generated.js';",
  );
}
app = app.replace(/const PRODUCTS = CATALOG_PRODUCTS;/, 'const PRODUCTS = [...CATALOG_PRODUCTS, ...FEED_PRODUCTS];');
app = app.replace(/const PRODUCTS = \[\.\.\.CATALOG_PRODUCTS, \.\.\.FEED_PRODUCTS\];/, 'const PRODUCTS = [...CATALOG_PRODUCTS, ...FEED_PRODUCTS];');
writeFileSync(appPath, app);

console.log(`Feed prepared: ${feedProducts.length} grouped products`);
