import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { extname } from 'node:path';

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
const uniq = (items) => [...new Set(items.filter(Boolean))];
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const mediaExtensions = new Set([...imageExtensions, '.svg', '.mp4', '.webm']);
const filesIn = (dir) => existsSync(dir) ? readdirSync(dir).filter((name) => !name.startsWith('.')) : [];

const productRows = parseSemicolonCsv(readFileSync('public/data/catalog_products.csv', 'utf8'));
const lookRows = parseSemicolonCsv(readFileSync('public/data/catalog_looks.csv', 'utf8'));
const productFiles = filesIn('public/products');
const lookFiles = filesIn('public/looks');
const mediaFiles = filesIn('public/media');

const looks = lookRows.map((row) => {
  const id = row['look_id'];
  const declared = (row['Все фотографии'] || [row['Фотография 1'], row['Фотография 2'], row['Фотография 3']].filter(Boolean).join('|')).split('|').filter(Boolean);
  const found = lookFiles.filter((file) => imageExtensions.has(extname(file).toLowerCase()) && (file === `${id}.jpg` || file.startsWith(`${id}_`) || file.startsWith(`${id}-`)));
  const files = uniq([...declared, ...found]);
  return {
    id,
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

const lookCountBySku = looks.reduce((acc, look) => {
  look.productIds.forEach((sku) => { acc[sku] = (acc[sku] || 0) + 1; });
  return acc;
}, {});

const products = productRows.map((row) => {
  const id = row['Артикул'];
  const stock = number(row['Остатки']);
  const declared = row['image_file'] || `${id}.jpg`;
  const found = productFiles.filter((file) => imageExtensions.has(extname(file).toLowerCase()) && (file === declared || file === `${id}${extname(file)}` || file.startsWith(`${id}_`) || file.startsWith(`${id}-`)));
  const imageFiles = uniq([declared, ...found]);
  return {
    id,
    sku: id,
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
    imageFile: imageFiles[0] || declared,
    imageFiles,
    looksCount: lookCountBySku[id] || 0,
    tone: 'catalog',
  };
});

const media = mediaFiles.filter((file) => mediaExtensions.has(extname(file).toLowerCase())).map((file, index) => {
  const ext = extname(file).toLowerCase();
  const kind = ['.mp4', '.webm'].includes(ext) ? 'video' : ext === '.svg' ? 'svg' : 'image';
  return {
    id: `MEDIA-${index + 1}`,
    kind,
    name: file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
    file,
    tone: 'catalog-media',
  };
});

const generated = `const BASE_URL = import.meta.env.BASE_URL || '/';\nconst RAW_PRODUCTS = ${JSON.stringify(products, null, 2)};\nconst RAW_LOOKS = ${JSON.stringify(looks, null, 2)};\nconst RAW_MEDIA = ${JSON.stringify(media, null, 2)};\nexport const CATALOG_PRODUCTS = RAW_PRODUCTS.map((product) => ({ ...product, image: product.imageFile ? \`${'${BASE_URL}'}products/${'${product.imageFile}'}\` : '', images: product.imageFiles.map((file) => \`${'${BASE_URL}'}products/${'${file}'}\`) }));\nexport const CATALOG_LOOKS = RAW_LOOKS.map((look) => ({ ...look, image: look.imageFile ? \`${'${BASE_URL}'}looks/${'${look.imageFile}'}\` : '', images: look.imageFiles.map((file) => \`${'${BASE_URL}'}looks/${'${file}'}\`) }));\nexport const CATALOG_MEDIA = RAW_MEDIA.map((item) => ({ ...item, src: \`${'${BASE_URL}'}media/${'${item.file}'}\`, image: item.kind === 'image' || item.kind === 'svg' ? \`${'${BASE_URL}'}media/${'${item.file}'}\` : '' }));\n`;
writeFileSync('src/catalog.generated.js', generated);

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

if (!app.includes("./catalog.generated.js")) {
  app = app.replace("import './appv3.css';", "import './appv3.css';\nimport { CATALOG_PRODUCTS, CATALOG_LOOKS, CATALOG_MEDIA } from './catalog.generated.js';");
} else {
  app = app.replace("import { CATALOG_PRODUCTS, CATALOG_LOOKS } from './catalog.generated.js';", "import { CATALOG_PRODUCTS, CATALOG_LOOKS, CATALOG_MEDIA } from './catalog.generated.js';");
}

const productsStart = app.indexOf('const PRODUCTS = [');
const contentStart = app.indexOf('const CONTENT = [');
const typeStart = app.indexOf('const TYPE_LIBRARY = [');
if (productsStart >= 0 && contentStart > productsStart && typeStart > contentStart) {
  app = `${app.slice(0, productsStart)}const PRODUCTS = CATALOG_PRODUCTS;\nconst CONTENT = [...CATALOG_LOOKS, ...CATALOG_MEDIA];\n\n${app.slice(typeStart)}`;
} else {
  app = app.replace(/const PRODUCTS = CATALOG_PRODUCTS;[\s\S]*?const TYPE_LIBRARY = \[/, "const PRODUCTS = CATALOG_PRODUCTS;\nconst CONTENT = [...CATALOG_LOOKS, ...CATALOG_MEDIA];\n\nconst TYPE_LIBRARY = [");
}

app = app.replace("const DEFAULT_RULES = { mode: 'manual', collection: 'S26'", "const DEFAULT_RULES = { mode: 'manual', collection: 'Все'");
app = app.replace("if (id?.startsWith('P-')) return 'product';", "if (PRODUCTS.some((product) => product.id === id)) return 'product';");
app = app.replace("{ 0: 'P-101', 1: 'P-103', 2: 'P-105' }", "{ 0: 'LIM001', 1: 'LIM005', 2: 'LIM006' }");
app = app.replace("{ 0: 'L-01', 1: 'P-102', 2: 'M-01', 3: 'P-104', 4: 'M-02', 5: 'P-106' }", "{ 0: 'W01', 1: 'LIM004', 2: 'W02', 3: 'LIM006', 4: CATALOG_MEDIA[0]?.id || '', 5: 'LIM010' }");

const productCardStart = app.indexOf('function ProductCard(');
const slotStart = app.indexOf('function Slot(');
if (productCardStart >= 0 && slotStart > productCardStart) {
  const cards = `function EntityDetailsModal({ entity, region, onClose }) {\n  const isProduct = 'price' in entity;\n  const isLook = entity.kind === 'look';\n  const rows = isProduct ? [\n    ['Артикул', entity.id], ['Отдел', entity.department], ['Гендер', entity.gender], ['Категория', entity.category], ['Подкатегория', entity.subcategory], ['Материал', entity.material], ['Цена', money(entity.price)], ['Скидка', entity.discount ? \`-${'${entity.discount}'}%\` : '—'], ['Цвет', entity.color], ['Коллекция', entity.collection], ['Силуэт / фасон', entity.silhouette], ['Посадка', entity.fit], ['Длина', entity.length], ['Длина рукава', entity.sleeveLength], ['Детали', entity.details], ['Остаток', entity.stock?.[region] ?? entity.stockValue ?? 0], ['L7D', entity.l7d], ['Новинка', entity.isNew ? 'Да' : 'Нет'], ['В образах', entity.looksCount || 0]\n  ] : isLook ? [\n    ['ID образа', entity.id], ['Название RU', entity.name], ['Название EN', entity.nameEn], ['Отдел', entity.department], ['Коллекция', entity.collection], ['Товары', (entity.productIds || []).join(', ')], ['Количество товаров', entity.productCount], ['Суммарный остаток', entity.stockTotal], ['Фотографий', entity.images?.length || 1]\n  ] : [['Тип', CONTENT_LABELS[entity.kind] || entity.kind], ['Файл', entity.file || entity.name]];\n  return <div className=\"entity-details-backdrop\" onClick={(e) => { e.stopPropagation(); onClose(); }}><div className=\"entity-details-modal\" onClick={(e) => e.stopPropagation()}>\n    <div className=\"entity-details-head\"><div><span>{isProduct ? 'ТОВАР' : isLook ? 'ОБРАЗ' : 'МЕДИА'}</span><strong>{entity.name}</strong></div><button onClick={onClose}><X size={17}/></button></div>\n    <div className=\"entity-details-body\"><div className=\"entity-details-preview\">{entity.images?.[0] || entity.image ? <img src={entity.images?.[0] || entity.image} alt={entity.name}/> : entity.kind === 'video' && entity.src ? <video src={entity.src} controls/> : <ImageIcon size={32}/>}</div><div className=\"entity-details-grid\">{rows.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) => <div key={label}><span>{label}</span><strong>{String(value)}</strong></div>)}</div></div>\n  </div></div>;\n}\n\nfunction MediaIndex({ count, active, onChange }) {\n  if (count <= 1) return null;\n  return <div className=\"media-index\" onClick={(e) => e.stopPropagation()}>{Array.from({ length: count }, (_, index) => <button key={index} className={active === index ? 'active' : ''} onClick={() => onChange(index)}>{index + 1}</button>)}</div>;\n}\n\nfunction ProductCard({ product, region, compact = false }) {\n  const [active, setActive] = useState(0);\n  const [detailsOpen, setDetailsOpen] = useState(false);\n  const stock = product.stock?.[region] ?? product.stockValue ?? 0;\n  const images = product.images?.length ? product.images : product.image ? [product.image] : [];\n  const image = images[Math.min(active, Math.max(images.length - 1, 0))];\n  return <div className={\`entity-product merch-product-card ${'${compact ? \'compact\' : \'\'}'}\`}>\n    <div className=\"merch-card-media\">{image ? <img src={image} alt={product.name} loading=\"lazy\"/> : <div className=\"media-placeholder\"><ImageIcon size={28}/></div>}<MediaIndex count={images.length} active={active} onChange={setActive}/><div className=\"commerce-badges\"><span className=\"sku\">{product.id}</span><span className=\"l7d\">L7D {product.l7d}</span><span className=\"stock\">STOCK {stock}</span>{product.looksCount > 0 && <span className=\"looks\">ОБРАЗ {product.looksCount}</span>}</div><button className=\"entity-details-trigger\" title=\"Полная информация\" onClick={(e) => { e.stopPropagation(); setDetailsOpen(true); }}><Eye size={14}/></button></div>\n    <div className=\"store-card-caption\"><span>{product.collection || product.department}</span><strong>{product.name}</strong><b>{money(product.price)}</b>{product.discount > 0 && <em>-{product.discount}%</em>}</div>\n    {detailsOpen && <EntityDetailsModal entity={product} region={region} onClose={() => setDetailsOpen(false)}/>}\n  </div>;\n}\n\nfunction MediaCard({ entity, compact = false }) {\n  const [active, setActive] = useState(0);\n  const [detailsOpen, setDetailsOpen] = useState(false);\n  const isLook = entity.kind === 'look';\n  const images = entity.images?.length ? entity.images : entity.image ? [entity.image] : [];\n  const image = images[Math.min(active, Math.max(images.length - 1, 0))];\n  return <div className={\`entity-media merch-media-card ${'${isLook ? \'look-card\' : \'\'}'} ${'${compact ? \'compact\' : \'\'}'}\`}>\n    <div className=\"merch-card-media\">{entity.kind === 'video' && entity.src ? <video src={entity.src} muted loop autoPlay playsInline/> : image ? <img src={image} alt={entity.name} loading=\"lazy\"/> : <div className=\"media-placeholder\">{entity.kind === 'video' ? <Film size={28}/> : <ImageIcon size={28}/>}</div>}<MediaIndex count={images.length} active={active} onChange={setActive}/>{isLook && <div className=\"commerce-badges\"><span className=\"sku\">{entity.id}</span><span className=\"stock\">STOCK {entity.stockTotal}</span><span className=\"looks\">{entity.productCount} ТОВАРА</span></div>}<button className=\"entity-details-trigger\" title=\"Полная информация\" onClick={(e) => { e.stopPropagation(); setDetailsOpen(true); }}><Eye size={14}/></button></div>\n    <div className=\"store-card-caption\"><span>{isLook ? (entity.department || 'ОБРАЗ') : CONTENT_LABELS[entity.kind]}</span><strong>{entity.name}</strong>{isLook && <b>{entity.collection}</b>}</div>\n    {detailsOpen && <EntityDetailsModal entity={entity} region={'RU'} onClose={() => setDetailsOpen(false)}/>}\n  </div>;\n}\n`;
  app = `${app.slice(0, productCardStart)}${cards}${app.slice(slotStart)}`;
}

const slotFnStart = app.indexOf('function Slot(');
const sectionFnStart = app.indexOf('function SectionCanvas(');
if (slotFnStart >= 0 && sectionFnStart > slotFnStart) {
  const slotFn = `function Slot({ slot, region, shape, onDrop, onUnpin }) {\n  const shapeClass = shape?.span >= 10 ? 'slot-wide' : shape?.rows >= 2 ? 'slot-tall' : shape?.span >= 6 ? 'slot-half' : 'slot-card';\n  return <div className={\`lego-slot ${'${shapeClass}'} ${'${slot.entity ? \'filled\' : \'empty\'}'} ${'${slot.status}'}\`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>\n    {slot.entity ? <>{'price' in slot.entity ? <ProductCard product={slot.entity} region={region}/> : <MediaCard entity={slot.entity}/>} {slot.status === 'pin' && <span className=\"slot-mode-badge pin\">PIN</span>}{slot.status === 'auto' && <span className=\"slot-mode-badge auto\">AUTO</span>}{slot.status === 'pin' && <button className=\"slot-remove\" title=\"Очистить слот\" onClick={(e) => { e.stopPropagation(); onUnpin(); }}><X size={13}/></button>}{slot.warning && <span className=\"slot-warning\"><AlertTriangle size={13}/>{slot.warning}</span>}</> : slot.status === 'collapsed' ? <div className=\"empty-slot-state\"><RefreshCw size={19}/><strong>Слот схлопнут</strong><span>Нет кандидата</span></div> : <div className=\"empty-slot-state\"><Plus size={20}/><strong>Пустой слот</strong><span>Перетащите товар, образ или медиа</span></div>}\n  </div>;\n}\n`;
  app = `${app.slice(0, slotFnStart)}${slotFn}${app.slice(sectionFnStart)}`;
}

app = app.replace(/<Slot slot=\{slot\} region=\{region\} onDrop=/g, '<Slot slot={slot} region={region} shape={shape} onDrop=');
app = app.replace(
  "if (contentTab === 'product') return PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()));",
  "if (contentTab === 'product') { const q = query.toLowerCase(); return PRODUCTS.filter((p) => [p.name, p.id, p.department, p.category, p.subcategory, p.material, p.color, p.collection].some((value) => String(value || '').toLowerCase().includes(q))); }",
);
app = app.replace("if (contentTab === 'look') return CONTENT.filter((x) => x.kind === 'look');", "if (contentTab === 'look') return CATALOG_LOOKS;");
app = app.replace("return CONTENT.filter((x) => ['image', 'video', 'svg'].includes(x.kind));", "return CATALOG_MEDIA;");

if (!app.includes('const collectionOptions = useMemo')) {
  app = app.replace(
    "const folders = useMemo(() => flattenFolders(currentTree), [currentTree]);",
    "const folders = useMemo(() => flattenFolders(currentTree), [currentTree]);\n  const collectionOptions = useMemo(() => ['Все', ...Array.from(new Set(PRODUCTS.map((product) => product.collection).filter(Boolean))).sort()], []);",
  );
}
app = app.replace('<option>S26</option><option value="Все">Все</option>', '{collectionOptions.map((collection) => <option key={collection} value={collection}>{collection}</option>)}');
app = app.replace(
  '<div className="info-card"><Pin size={15}/><span>Перетащите в любой пустой слот товар, образ, изображение, видео или SVG.</span></div>',
  '<div className="info-card"><Pin size={15}/><span><b>{PRODUCTS.length} товаров · {CATALOG_LOOKS.length} образов · {CATALOG_MEDIA.length} медиа</b><br/>Перетащите сущность в любой пустой слот.</span></div>',
);

writeFileSync(appPath, app);

const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');
const marker = '/* storefront-entity-cards-v2 */';
if (!css.includes(marker)) {
  css += `\n${marker}\n.lego-slot{min-height:0;background:#fff;border:1px dashed #c3c7cf;overflow:visible}.lego-slot.filled{border-style:solid;border-color:#d9dbe1;background:#fff}.lego-slot.slot-wide{aspect-ratio:16/9}.lego-slot.slot-half{aspect-ratio:4/5}.lego-slot.slot-card{aspect-ratio:3/4}.lego-slot.slot-tall{aspect-ratio:3/4;min-height:520px}.merch-product-card,.merch-media-card{height:100%;min-height:100%;display:flex;flex-direction:column;background:#fff;position:relative}.merch-card-media{position:relative;flex:1;min-height:0;background:#f2f2f2;overflow:hidden}.merch-card-media>img,.merch-card-media>video{width:100%;height:100%;display:block;object-fit:contain;background:#f2f2f2}.look-card .merch-card-media>img,.merch-media-card:not(.look-card) .merch-card-media>img,.merch-media-card .merch-card-media>video{object-fit:cover}.media-placeholder{position:absolute;inset:0;display:grid;place-items:center;color:#a5a8af;background:#f0f0f1}.store-card-caption{position:relative;padding:9px 10px 11px;background:#fff;display:grid;gap:2px;min-height:66px;text-align:left}.store-card-caption span{font-size:8px;letter-spacing:.04em;color:#858891;text-transform:uppercase}.store-card-caption strong{font-size:10px;line-height:1.2;color:#17181d;text-transform:uppercase}.store-card-caption b{font-size:9px;font-weight:500;color:#17181d}.store-card-caption em{position:absolute;right:9px;bottom:10px;font-size:8px;font-style:normal;color:#bd4545}.media-index{position:absolute;left:7px;top:9px;display:flex;flex-direction:column;gap:5px;z-index:4}.media-index button{width:23px;height:23px;border-radius:50%;border:1px solid rgba(20,20,22,.45);background:rgba(255,255,255,.9);color:#191a1e;font-size:8px;font-weight:700;padding:0;display:grid;place-items:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}.media-index button.active{background:#17181d;color:#fff;border-color:#17181d}.commerce-badges{position:absolute;right:7px;bottom:7px;display:flex;flex-direction:column;align-items:stretch;gap:2px;z-index:4}.commerce-badges span{min-width:66px;padding:2px 5px;border-radius:2px;font-size:8px;font-weight:800;line-height:1.15;text-align:center;color:#fff;background:rgba(26,27,31,.88)}.commerce-badges .l7d{background:#79c6ae}.commerce-badges .stock{background:#e9be30}.commerce-badges .looks{background:#69a98f}.entity-details-trigger{position:absolute;right:7px;top:7px;width:27px;height:27px;border:0;background:rgba(20,20,22,.9);color:#fff;display:grid;place-items:center;z-index:5;border-radius:2px}.entity-details-trigger:hover{background:#000}.slot-mode-badge{position:absolute;left:7px;bottom:7px;z-index:7;font-size:7px;font-weight:900;letter-spacing:.05em;padding:3px 5px;border-radius:3px;background:#fff;color:#c54471;box-shadow:0 1px 5px rgba(0,0,0,.12)}.slot-mode-badge.auto{color:#3663ce}.slot-remove{right:38px;top:7px;bottom:auto;z-index:7;background:rgba(255,255,255,.95)}.slot-warning{left:7px;bottom:32px;z-index:8}.library-items{display:grid;grid-template-columns:1fr 1fr;gap:7px;align-items:start}.library-entity{position:relative;display:block;padding:0;overflow:hidden;border-radius:3px}.library-entity>.lucide-grip-vertical{position:absolute;right:5px;top:38px;z-index:8;background:rgba(255,255,255,.92);border-radius:2px;padding:2px;width:18px;height:24px}.library-entity .merch-product-card.compact,.library-entity .merch-media-card.compact{height:236px;display:flex}.library-entity .compact .merch-card-media{min-height:170px}.library-entity .compact .store-card-caption{min-height:62px;padding:7px}.library-entity .compact .store-card-caption strong{font-size:8px}.library-entity .compact .store-card-caption span,.library-entity .compact .store-card-caption b{font-size:7px}.library-entity .compact .commerce-badges span{min-width:50px;font-size:6px;padding:2px 3px}.library-entity .compact .media-index button{width:18px;height:18px;font-size:6px}.library-entity .compact .entity-details-trigger{width:22px;height:22px}.entity-details-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(19,20,24,.42);display:grid;place-items:center;padding:30px}.entity-details-modal{width:min(920px,94vw);max-height:88vh;overflow:hidden;background:#fff;border-radius:10px;box-shadow:0 30px 90px rgba(0,0,0,.26);display:flex;flex-direction:column}.entity-details-head{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #e7e8ec}.entity-details-head>div{display:grid;gap:3px}.entity-details-head span{font-size:8px;letter-spacing:.1em;color:#81848d}.entity-details-head strong{font-size:15px}.entity-details-head button{width:30px;height:30px;border:0;background:#f4f5f6;border-radius:5px;display:grid;place-items:center}.entity-details-body{display:grid;grid-template-columns:minmax(280px,42%) 1fr;min-height:0;overflow:auto}.entity-details-preview{min-height:560px;background:#f1f1f1;display:grid;place-items:center;overflow:hidden}.entity-details-preview img,.entity-details-preview video{width:100%;height:100%;max-height:70vh;object-fit:contain}.entity-details-grid{align-content:start;padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:0 18px;overflow:auto}.entity-details-grid>div{padding:9px 0;border-bottom:1px solid #ececef;display:grid;gap:3px}.entity-details-grid span{font-size:8px;color:#858891;text-transform:uppercase}.entity-details-grid strong{font-size:10px;line-height:1.35;font-weight:600}.preview-mode .slot-mode-badge,.preview-mode .slot-remove,.preview-mode .slot-warning{display:none}.preview-mode .lego-slot{overflow:hidden}.storefront-frame.mobile .lego-slot,.storefront-frame.mobile .lego-slot.slot-wide,.storefront-frame.mobile .lego-slot.slot-half,.storefront-frame.mobile .lego-slot.slot-card,.storefront-frame.mobile .lego-slot.slot-tall{aspect-ratio:3/4;min-height:0}.storefront-frame.mobile .library-items{grid-template-columns:1fr}@media(max-width:1100px){.library-items{grid-template-columns:1fr}.library-entity .merch-product-card.compact,.library-entity .merch-media-card.compact{height:300px}.entity-details-body{grid-template-columns:1fr}.entity-details-preview{min-height:340px}.entity-details-grid{grid-template-columns:1fr}}\n`;
  writeFileSync(cssPath, css);
}

console.log(`Catalog prepared: ${products.length} products, ${looks.length} looks, ${media.length} media`);
