import { readFileSync, writeFileSync } from 'node:fs';

function parseSemicolonCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
      continue;
    }
    if (ch === ';' && !quoted) { row.push(cell); cell = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()])));
}

const number = (value) => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const productRows = parseSemicolonCsv(readFileSync('public/data/catalog_products.csv', 'utf8'));
const lookRows = parseSemicolonCsv(readFileSync('public/data/catalog_looks.csv', 'utf8'));

const products = productRows.map((row) => {
  const stock = number(row['Остатки']);
  return {
    id: row['Артикул'],
    sku: row['Артикул'],
    department: row['Отдел'],
    gender: row['Гендер'],
    category: row['Категория'],
    subcategory: row['Подкатегория'],
    name: row['Название товара'],
    material: row['Материал'],
    price: number(row['Цена']),
    discount: number(row['Процент скидки']),
    color: row['Цвет'],
    collection: row['Коллекция'],
    silhouette: row['Силуэт / Фасон'],
    ageGroup: row['Возрастная группа'],
    fit: row['Посадка'],
    length: row['Длина изделия'],
    sleeveLength: row['Длина рукава'],
    details: row['Детали'],
    stockValue: stock,
    stock: { RU: stock, KZ: stock, GCC: stock, WW: stock },
    l7d: number(row['L7D']),
    isNew: String(row['Новинка']).toLowerCase() === 'да',
    imageFile: row['image_file'] || `${row['Артикул']}.jpg`,
    tone: 'catalog',
  };
});

const looks = lookRows.map((row) => {
  const files = (row['Все фотографии'] || [row['Фотография 1'], row['Фотография 2'], row['Фотография 3']].filter(Boolean).join('|')).split('|').filter(Boolean);
  return {
    id: row['look_id'],
    kind: 'look',
    name: row['Название образа RU'],
    nameEn: row['Название образа EN'],
    department: row['Отдел'],
    collection: row['Коллекция'],
    productIds: (row['Артикулы товаров'] || '').split('|').filter(Boolean),
    productCount: number(row['Количество добавленных товаров в образ']),
    stockTotal: number(row['Суммарное количество товаров на стоке']),
    imageFile: row['Фотография 1'] || files[0] || '',
    imageFiles: files,
    tone: 'catalog-look',
  };
});

const generated = `const BASE_URL = import.meta.env.BASE_URL || '/';\nconst RAW_PRODUCTS = ${JSON.stringify(products, null, 2)};\nconst RAW_LOOKS = ${JSON.stringify(looks, null, 2)};\nexport const CATALOG_PRODUCTS = RAW_PRODUCTS.map((product) => ({ ...product, image: product.imageFile ? \`${'${BASE_URL}'}products/${'${product.imageFile}'}\` : '' }));\nexport const CATALOG_LOOKS = RAW_LOOKS.map((look) => ({ ...look, image: look.imageFile ? \`${'${BASE_URL}'}looks/${'${look.imageFile}'}\` : '', images: look.imageFiles.map((file) => \`${'${BASE_URL}'}looks/${'${file}'}\`) }));\n`;
writeFileSync('src/catalog.generated.js', generated);

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

if (!app.includes("./catalog.generated.js")) {
  app = app.replace("import './appv3.css';", "import './appv3.css';\nimport { CATALOG_PRODUCTS, CATALOG_LOOKS } from './catalog.generated.js';");
}

const productsStart = app.indexOf('const PRODUCTS = [');
const contentStart = app.indexOf('const CONTENT = [');
const typeStart = app.indexOf('const TYPE_LIBRARY = [');
if (productsStart >= 0 && contentStart > productsStart && typeStart > contentStart) {
  let contentBlock = app.slice(contentStart, typeStart).replace('const CONTENT = [', 'const MEDIA_CONTENT = [');
  contentBlock += 'const CONTENT = [...CATALOG_LOOKS, ...MEDIA_CONTENT];\n\n';
  app = `${app.slice(0, productsStart)}const PRODUCTS = CATALOG_PRODUCTS;\n\n${contentBlock}${app.slice(typeStart)}`;
}

app = app.replace("const DEFAULT_RULES = { mode: 'manual', collection: 'S26'", "const DEFAULT_RULES = { mode: 'manual', collection: 'Все'");
app = app.replace("if (id?.startsWith('P-')) return 'product';", "if (PRODUCTS.some((product) => product.id === id)) return 'product';");
app = app.replace("{ 0: 'P-101', 1: 'P-103', 2: 'P-105' }", "{ 0: 'LIM001', 1: 'LIM005', 2: 'LIM006' }");
app = app.replace("{ 0: 'L-01', 1: 'P-102', 2: 'M-01', 3: 'P-104', 4: 'M-02', 5: 'P-106' }", "{ 0: 'W01', 1: 'LIM004', 2: 'W02', 3: 'LIM006', 4: 'M-02', 5: 'LIM010' }");

const productCardStart = app.indexOf('function ProductCard(');
const mediaCardStart = app.indexOf('function MediaCard(');
if (productCardStart >= 0 && mediaCardStart > productCardStart) {
  const productCard = `function ProductCard({ product, region, compact = false }) {\n  const stock = product.stock?.[region] ?? product.stockValue ?? 0;\n  return <div className={\`entity-product tone-${'${product.tone || \'catalog\'}'} ${'${compact ? \'compact\' : \'\'}'}\`}>\n    <div className=\"entity-art\">{product.image ? <img src={product.image} alt={product.name} loading=\"lazy\"/> : <span>{product.id}</span>}</div>\n    <div className=\"entity-info\"><strong>{product.name}</strong>{!compact && <span>{money(product.price)}{product.discount > 0 ? \` · -${'${product.discount}'}%\` : ''}</span>}{compact ? <small>{product.id} · Остатки {stock}</small> : <><small>{product.id} · {product.department} · {product.category}</small><small>{product.color} · {product.material} · {product.collection}</small><small>Остатки: {stock} · L7D {product.l7d}</small></>}</div>\n  </div>;\n}\n`;
  app = `${app.slice(0, productCardStart)}${productCard}${app.slice(mediaCardStart)}`;
}

const mediaStart = app.indexOf('function MediaCard(');
const slotStart = app.indexOf('function Slot(');
if (mediaStart >= 0 && slotStart > mediaStart) {
  const mediaCard = `function MediaCard({ entity, compact = false }) {\n  const Icon = entity.kind === 'video' ? Film : entity.kind === 'look' ? Sparkles : ImageIcon;\n  return <div className={\`entity-media ${'${entity.tone || \'\'}'} ${'${entity.image ? \'has-image\' : \'\'}'} ${'${compact ? \'compact\' : \'\'}'}\`}>{entity.image ? <img className=\"entity-media-image\" src={entity.image} alt={entity.name} loading=\"lazy\"/> : <Icon size={compact ? 18 : 22}/>}<div><strong>{entity.name}</strong><span>{entity.kind === 'look' ? \`${'${entity.department || \'Образ\'}'}${'${entity.collection ? ` · ${entity.collection}` : \'\'}'}\` : CONTENT_LABELS[entity.kind]}</span>{entity.kind === 'look' && !compact && <small>{entity.productCount} товаров · суммарный сток {entity.stockTotal}</small>}</div></div>;\n}\n`;
  app = `${app.slice(0, mediaStart)}${mediaCard}${app.slice(slotStart)}`;
}

app = app.replace(
  "if (contentTab === 'product') return PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()));",
  "if (contentTab === 'product') { const q = query.toLowerCase(); return PRODUCTS.filter((p) => [p.name, p.id, p.department, p.category, p.subcategory, p.material, p.color, p.collection].some((value) => String(value || '').toLowerCase().includes(q))); }",
);

if (!app.includes('const collectionOptions = useMemo')) {
  app = app.replace(
    "const folders = useMemo(() => flattenFolders(currentTree), [currentTree]);",
    "const folders = useMemo(() => flattenFolders(currentTree), [currentTree]);\n  const collectionOptions = useMemo(() => ['Все', ...Array.from(new Set(PRODUCTS.map((product) => product.collection).filter(Boolean))).sort()], []);",
  );
}
app = app.replace('<option>S26</option><option value="Все">Все</option>', '{collectionOptions.map((collection) => <option key={collection} value={collection}>{collection}</option>)}');
app = app.replace(
  '<div className="info-card"><Pin size={15}/><span>Перетащите в любой пустой слот товар, образ, изображение, видео или SVG.</span></div>',
  '<div className="info-card"><Pin size={15}/><span><b>{PRODUCTS.length} товаров · {CATALOG_LOOKS.length} образов</b><br/>Перетащите в любой пустой слот товар, образ, изображение, видео или SVG.</span></div>',
);

writeFileSync(appPath, app);

const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');
const marker = '/* csv-catalog-assets-v1 */';
if (!css.includes(marker)) {
  css += `\n${marker}\n.entity-art{overflow:hidden}.entity-art img{width:100%;height:100%;display:block;object-fit:cover}.entity-product.compact .entity-art img{height:62px}.entity-media.has-image{position:relative;padding:0;overflow:hidden;isolation:isolate}.entity-media-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1}.entity-media.has-image>div{margin-top:auto;width:100%;padding:10px;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.92) 42%,#fff);display:grid;gap:2px}.entity-media.has-image.compact>div{margin-left:0;padding:7px 9px;background:linear-gradient(90deg,rgba(255,255,255,.15),rgba(255,255,255,.96) 48%,#fff)}.entity-media small{font-size:8px;color:#6d7078}.entity-info{min-height:58px}.entity-product:not(.compact) .entity-info small{line-height:1.35}.library-entity .entity-product.compact .entity-info{min-width:0}.library-entity .entity-product.compact .entity-info strong,.library-entity .entity-product.compact .entity-info small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n`;
  writeFileSync(cssPath, css);
}

console.log(`Catalog prepared: ${products.length} products, ${looks.length} looks`);
