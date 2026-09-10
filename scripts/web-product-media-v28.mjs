import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const catalogPath = 'public/data/catalog_products.csv';
const variantsPath = 'public/data/catalog_product_variants.csv';
const auditPath = 'public/data/product_media_search_audit.json';
const MARKER = 'WEB_PRODUCT_MEDIA_V28';

function parseCsv(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(';').map((value) => value.trim());
  return lines.map((line) => {
    const values = line.split(';');
    return Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()]));
  });
}

const catalog = parseCsv(readFileSync(catalogPath, 'utf8'));
const variants = parseCsv(readFileSync(variantsPath, 'utf8'));
const baseBySku = new Map(catalog.map((row) => [row['Артикул'], row]));
const products = catalog.map((row) => ({
  sku: row['Артикул'],
  baseSku: row['Артикул'],
  department: row['Отдел'],
  gender: row['Гендер'],
  category: row['Категория'],
  subcategory: row['Подкатегория'],
  name: row['Название товара'],
  material: row['Материал'],
  color: row['Цвет'],
  collection: row['Коллекция'],
  silhouette: row['Силуэт / Фасон'],
  age: row['Возрастная группа'],
  fit: row['Посадка'],
  length: row['Длина изделия'],
  sleeve: row['Длина рукава'],
  details: row['Детали']
}));

for (const variant of variants) {
  const base = baseBySku.get(variant.base_sku);
  if (!base) continue;
  products.push({
    sku: variant.sku,
    baseSku: variant.base_sku,
    department: base['Отдел'],
    gender: base['Гендер'],
    category: base['Категория'],
    subcategory: base['Подкатегория'],
    name: base['Название товара'],
    material: base['Материал'],
    color: variant['Цвет'],
    collection: base['Коллекция'],
    silhouette: base['Силуэт / Фасон'],
    age: base['Возрастная группа'],
    fit: base['Посадка'],
    length: base['Длина изделия'],
    sleeve: base['Длина рукава'],
    details: base['Детали']
  });
}

if (products.length !== 300) {
  throw new Error(`WEB_PRODUCT_MEDIA_V28: expected 300 SKUs, received ${products.length}`);
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function semanticKey(product) {
  return [product.gender, product.name, product.color, product.material, product.silhouette, product.fit, product.length, product.details, product.age]
    .map(clean)
    .join(' | ')
    .toLowerCase();
}

function searchText(product, stockmannOnly = false) {
  const parts = [
    stockmannOnly ? 'site:stockmann.ru' : '',
    clean(product.gender),
    clean(product.name),
    clean(product.color),
    clean(product.material),
    clean(product.subcategory),
    clean(product.silhouette),
    clean(product.fit),
    clean(product.length),
    clean(product.details),
    clean(product.age),
    'одежда на модели фото'
  ].filter(Boolean);
  return parts.join(' ');
}

const preferredDomains = [
  'stockmann.ru', 'lamoda.ru', 'lamoda.kz', 'befree.ru', 'zarina.ru', 'loverepublic.ru', 'sela.ru',
  'ostin.com', 'ostin.ru', 'ostin.kz', 'reserved.com', '12storeez.com', 'lichi.com', 'lime-shop.com',
  'tsum.ru', 'modivo.', 'cos.com', 'arket.com', 'massimodutti.com', 'mango.com', 'zara.com', 'hm.com',
  'uniqlo.com', 'asos.com', 'tommy.com', 'calvinklein.', 'boss.com', 'ralphlauren.'
];
const rejectedDomains = ['pinterest.', 'pinimg.', 'aliexpress.', 'alibaba.', 'joom.', 'shafa.', 'avito.', 'ebay.'];

function domainScore(pageUrl = '', imageUrl = '') {
  const haystack = `${pageUrl} ${imageUrl}`.toLowerCase();
  if (rejectedDomains.some((domain) => haystack.includes(domain))) return -100;
  const preferredIndex = preferredDomains.findIndex((domain) => haystack.includes(domain));
  if (preferredIndex === 0) return 1000;
  if (preferredIndex > 0) return 800 - preferredIndex * 10;
  if (haystack.includes('pexels.com') || haystack.includes('unsplash.com')) return 600;
  return 100;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractBingImages(html) {
  const found = [];
  const attrRe = /m="([^"]+)"/g;
  let match;
  while ((match = attrRe.exec(html))) {
    const decoded = decodeHtml(match[1]);
    if (!decoded.includes('murl')) continue;
    try {
      const data = JSON.parse(decoded);
      const imageUrl = data.murl || '';
      const pageUrl = data.purl || '';
      if (!/^https?:\/\//i.test(imageUrl)) continue;
      if (/\.(svg|gif)(\?|$)/i.test(imageUrl)) continue;
      found.push({
        imageUrl,
        pageUrl,
        title: clean(data.t || data.desc || data.title || ''),
        score: domainScore(pageUrl, imageUrl)
      });
    } catch {}
  }
  const seen = new Set();
  return found
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      const key = item.imageUrl.replace(/[?#].*$/, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function fetchWithTimeout(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
        'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function searchBing(query, count = 35) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC3&first=1&count=${count}&qft=+filterui:photo-photo`;
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return [];
    const html = await response.text();
    return extractBingImages(html);
  } catch {
    return [];
  }
}

async function findMediaForProduct(product) {
  // User requirement: Stockmann first, then the rest of the public web / brands.
  const stockmannQuery = searchText(product, true);
  const generalQuery = searchText(product, false);
  let results = await searchBing(stockmannQuery, 24);
  const stockmannCount = results.filter((item) => `${item.pageUrl} ${item.imageUrl}`.includes('stockmann.ru')).length;
  if (results.length < 6 || stockmannCount < 2) {
    const general = await searchBing(generalQuery, 40);
    const merged = [...results, ...general];
    const seen = new Set();
    results = merged
      .sort((a, b) => b.score - a.score)
      .filter((item) => {
        const key = item.imageUrl.replace(/[?#].*$/, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }
  return { results: results.slice(0, 10), stockmannQuery, generalQuery };
}

const grouped = new Map();
for (const product of products) {
  const key = semanticKey(product);
  if (!grouped.has(key)) grouped.set(key, { representative: product, skus: [] });
  grouped.get(key).skus.push(product.sku);
}

const uniqueGroups = [...grouped.values()];
console.log(`WEB_PRODUCT_MEDIA_V28: 300 SKUs -> ${uniqueGroups.length} unique semantic combinations`);

const searchResults = new Map();
const concurrency = 10;
let cursor = 0;
async function worker() {
  while (cursor < uniqueGroups.length) {
    const index = cursor++;
    const group = uniqueGroups[index];
    const key = semanticKey(group.representative);
    const found = await findMediaForProduct(group.representative);
    searchResults.set(key, found);
    if ((index + 1) % 20 === 0 || index === uniqueGroups.length - 1) {
      console.log(`WEB_PRODUCT_MEDIA_V28: searched ${index + 1}/${uniqueGroups.length}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
}

if (process.env.GITHUB_ACTIONS === 'true') {
  await Promise.all(Array.from({ length: Math.min(concurrency, uniqueGroups.length) }, () => worker()));
} else {
  console.log('WEB_PRODUCT_MEDIA_V28: network search skipped outside GitHub Actions; V27 remains local-dev fallback');
}

const mediaBySku = {};
const audit = [];
for (const group of uniqueGroups) {
  const key = semanticKey(group.representative);
  const found = searchResults.get(key);
  const results = found?.results || [];
  for (const sku of group.skus) {
    mediaBySku[sku] = results.map((item) => ({
      originalSrc: item.imageUrl,
      sourcePage: item.pageUrl,
      title: item.title,
      score: item.score
    }));
    audit.push({
      sku,
      baseSku: group.representative.baseSku,
      name: group.representative.name,
      color: group.representative.color,
      material: group.representative.material,
      silhouette: group.representative.silhouette,
      age: group.representative.age,
      query: found?.generalQuery || searchText(group.representative, false),
      stockmannQuery: found?.stockmannQuery || searchText(group.representative, true),
      found: results.length,
      stockmannFound: results.filter((item) => `${item.pageUrl} ${item.imageUrl}`.includes('stockmann.ru')).length,
      sources: results.slice(0, 6).map((item) => item.pageUrl)
    });
  }
}

writeFileSync(auditPath, JSON.stringify({ generatedAt: new Date().toISOString(), totalSku: products.length, uniqueCombinations: uniqueGroups.length, items: audit }, null, 2));

if (process.env.GITHUB_ACTIONS === 'true') {
  let app = readFileSync(appPath, 'utf8');
  if (!app.includes(MARKER)) {
    const anchor = 'const SEMANTIC_PRODUCT_STOCK_V27 = true;';
    if (!app.includes(anchor)) throw new Error('WEB_PRODUCT_MEDIA_V28: V27 media layer missing');
    app = app.replace(anchor, `${anchor}\nconst ${MARKER} = true;\nconst WEB_MEDIA_BY_SKU_V28 = ${JSON.stringify(mediaBySku)};`);

    const start = app.indexOf('function productMediaItems(product) {');
    const end = app.indexOf('\nfunction RatioMediaImage(', start);
    if (start < 0 || end < 0) throw new Error('WEB_PRODUCT_MEDIA_V28: productMediaItems anchors not found');

    const replacement = String.raw`function mediaProxyUrl(originalSrc, orientation = 'portrait') {
  if (!originalSrc) return '';
  const width = orientation === 'landscape' ? 1350 : 900;
  const height = orientation === 'landscape' ? 900 : 1350;
  return 'https://images.weserv.nl/?url=' + encodeURIComponent(originalSrc) + '&w=' + width + '&h=' + height + '&fit=cover&output=webp&q=86';
}

function productMediaItems(product) {
  const sku = String(product?.id || product?.sku || '');
  const found = Array.isArray(WEB_MEDIA_BY_SKU_V28[sku]) ? WEB_MEDIA_BY_SKU_V28[sku] : [];
  if (!found.length) {
    const fallback = [];
    for (let index = 0; index < 4; index += 1) fallback.push({ kind: 'stock', src: semanticStockUrl(product, index, 'portrait'), source: 'Semantic fallback', orientation: 'portrait' });
    for (let index = 4; index < 6; index += 1) fallback.push({ kind: 'stock', src: semanticStockUrl(product, index, 'landscape'), source: 'Semantic fallback', orientation: 'landscape' });
    return fallback;
  }
  const items = [];
  for (let index = 0; index < 6; index += 1) {
    const source = found[index % found.length];
    const orientation = index < 4 ? 'portrait' : 'landscape';
    items.push({
      kind: 'web-search',
      src: mediaProxyUrl(source.originalSrc, orientation),
      originalSrc: source.originalSrc,
      sourcePage: source.sourcePage,
      source: source.sourcePage?.includes('stockmann.ru') ? 'Stockmann' : 'Web / brand',
      title: source.title || '',
      orientation,
      primary: index === 0
    });
  }
  return items;
}
`;
    app = app.slice(0, start) + replacement + app.slice(end);
    writeFileSync(appPath, app);
  }
}

const covered = Object.values(mediaBySku).filter((items) => items.length > 0).length;
const sixPlus = Object.values(mediaBySku).filter((items) => items.length >= 6).length;
const stockmannCovered = Object.values(mediaBySku).filter((items) => items.some((item) => String(item.sourcePage).includes('stockmann.ru'))).length;
console.log(`WEB_PRODUCT_MEDIA_V28: coverage ${covered}/300; >=6 images ${sixPlus}/300; Stockmann present ${stockmannCovered}/300`);
